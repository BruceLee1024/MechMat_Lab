import React, { useState } from "react";
import { Calculator, Sigma, Activity } from "lucide-react";
import { SliderInputControl, LatexRenderer, SectionSelector, calculateSectionProperties } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

// 计算矩形截面在 y 处的静矩 Q 和宽度 b
const calcRectShear = (b: number, h: number, y: number) => {
  const yMax = h / 2;
  const yc = Math.max(-yMax, Math.min(yMax, y));
  const Q = (b / 2) * (yMax * yMax - yc * yc);
  return { Q, bAtY: b };
};

// 计算圆形截面在 y 处的静矩 Q 和宽度 b
const calcCircleShear = (r: number, y: number) => {
  const yc = Math.max(-r, Math.min(r, y));
  const bAtY = 2 * Math.sqrt(Math.max(0, r * r - yc * yc));
  const Q = (2 / 3) * Math.pow(r * r - yc * yc, 1.5);
  return { Q, bAtY };
};

// 计算工字钢截面在 y 处的静矩 Q 和宽度 b
const calcIBeamShear = (bf: number, tf: number, hw: number, tw: number, y: number) => {
  const h = hw + 2 * tf;
  const yMax = h / 2;
  const yc = Math.max(-yMax, Math.min(yMax, y));
  
  if (Math.abs(yc) > hw / 2) {
    // 在翼缘区域
    const yEdge = yc > 0 ? yMax : -yMax;
    const flangeH = Math.abs(yEdge - yc);
    const Q = bf * flangeH * (yEdge + yc) / 2;
    return { Q: Math.abs(Q), bAtY: bf };
  } else {
    // 在腹板区域: 翼缘的静矩 + 腹板到y的静矩
    const flangeQ = bf * tf * (hw / 2 + tf / 2);
    const webQ = tw * (hw / 2 - Math.abs(yc)) * (hw / 2 + Math.abs(yc)) / 2;
    return { Q: flangeQ + webQ, bAtY: tw };
  }
};

export const ShearStressModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const [yPosition, setYPosition] = useState(0); // 用户选择的截面高度位置
  const [cutPosition, setCutPosition] = useState(0.3); // 截面位置 (0-1)

  const L_mm = state.bendLength * 1000;
  const a_mm = state.bendLoadPos * 1000;
  const b_mm = L_mm - a_mm;
  const sectionProps = calculateSectionProperties(state.bendSection);
  const I = sectionProps.Iz;
  const yMax = sectionProps.yMax;
  const area = sectionProps.area;

  // 支座反力
  const R1 = (state.bendLoad * b_mm) / L_mm;
  const R2 = (state.bendLoad * a_mm) / L_mm;

  // 在截面位置处的剪力
  const cutX_mm = cutPosition * L_mm;
  const V = cutX_mm <= a_mm ? R1 : -R2;

  // 计算当前截面的剪应力分布
  const getShearAtY = (y: number) => {
    const sec = state.bendSection;
    let result = { Q: 0, bAtY: 1 };
    switch (sec.type) {
      case 'rectangle':
        result = calcRectShear(sec.width || 100, sec.height || 150, y);
        break;
      case 'circle':
        result = calcCircleShear(sec.radius || 50, y);
        break;
      case 'i_beam':
        result = calcIBeamShear(
          sec.flangeWidth || 100, sec.flangeThickness || 10,
          sec.webHeight || 100, sec.webThickness || 6, y
        );
        break;
      default:
        result = calcRectShear(sec.width || 100, sec.height || 150, y);
    }
    if (result.bAtY < 0.001) return { tau: 0, Q: result.Q, bAtY: result.bAtY };
    const tau = (Math.abs(V) * result.Q) / (I * result.bAtY);
    return { tau, Q: result.Q, bAtY: result.bAtY };
  };

  // 当前y位置的剪应力
  const currentShear = getShearAtY(yPosition);
  // 中性轴处最大剪应力
  const maxShear = getShearAtY(0);
  // 平均剪应力
  const tauAvg = Math.abs(V) / area;

  // 生成剪应力分布数据点
  const distributionPoints: { y: number; tau: number }[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const y = -yMax + (2 * yMax * i) / steps;
    const { tau } = getShearAtY(y);
    distributionPoints.push({ y, tau });
  }
  const tauMax = Math.max(...distributionPoints.map(p => p.tau), 0.001);

  // SVG 坐标映射
  const beamStartX = 60, beamEndX = 540, floorY = 160, supportH = 30;
  const baselineY = floorY - supportH;
  const beamW = beamEndX - beamStartX;
  const mapBX = (ratio: number) => beamStartX + ratio * beamW;
  const loadX = mapBX(state.bendLoadPos / state.bendLength);
  const cutSvgX = mapBX(cutPosition);

  // 剪力图参数
  const sfdY = 250, sfdH = 60;
  const sfdScale = sfdH / Math.max(Math.abs(R1), Math.abs(R2), 1);

  // 剪应力分布图参数
  const distX = 80, distW = 120, distY0 = 50, distH = 200;
  const distMapY = (y: number) => distY0 + distH / 2 - (y / yMax) * (distH / 2);
  const distMapX = (tau: number) => distX + (tau / tauMax) * distW;

  // LaTeX 公式
  const formulaV = `V = ${V > 0 ? "R_1" : "-R_2"} = ${Math.abs(V).toFixed(1)} \\text{ N}`;
  const formulaQ = `Q(y=${yPosition.toFixed(1)}) = ${currentShear.Q.toFixed(1)} \\text{ mm}^3`;
  const formulaTau = `\\tau = \\frac{V \\cdot Q}{I \\cdot b} = \\frac{${Math.abs(V).toFixed(0)} \\times ${currentShear.Q.toFixed(0)}}{${I.toFixed(0)} \\times ${currentShear.bAtY.toFixed(0)}} = ${currentShear.tau.toFixed(2)} \\text{ MPa}`;
  const formulaTauMax = `\\tau_{max} = ${maxShear.tau.toFixed(2)} \\text{ MPa} \\quad (y=0, \\text{中性轴})`;
  const formulaRatio = `\\frac{\\tau_{max}}{\\tau_{avg}} = \\frac{${maxShear.tau.toFixed(2)}}{${tauAvg.toFixed(2)}} = ${(maxShear.tau / tauAvg).toFixed(2)}`;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 梁模型 + 剪力图 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4" /> 梁模型与剪力图
        </div>
        <div className="flex justify-center">
        <svg width="100%" height="280" viewBox="0 0 600 340" preserveAspectRatio="xMidYMid meet">
          <CommonDefs />
          {/* 地面 */}
          <line x1="20" y1={floorY} x2="580" y2={floorY} stroke="#cbd5e1" strokeWidth="2" />
          {/* 左支座 */}
          <g transform={`translate(${beamStartX}, ${floorY})`}>
            <path d={`M0,0 L-12,-${supportH} L12,-${supportH} Z`} fill="url(#hatchPattern)" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy={-supportH} r="3" fill="white" stroke="#94a3b8" strokeWidth="2" />
          </g>
          {/* 右支座 */}
          <g transform={`translate(${beamEndX}, ${floorY})`}>
            <path d={`M0,-6 L-12,-${supportH} L12,-${supportH} Z`} fill="url(#hatchPattern)" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy={-supportH} r="3" fill="white" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="-6" cy="-3" r="2.5" fill="#cbd5e1" />
            <circle cx="6" cy="-3" r="2.5" fill="#cbd5e1" />
          </g>
          {/* 梁 */}
          <line x1={beamStartX} y1={baselineY} x2={beamEndX} y2={baselineY} stroke="#4f46e5" strokeWidth="8" strokeLinecap="round" opacity="0.15" />
          <line x1={beamStartX} y1={baselineY} x2={beamEndX} y2={baselineY} stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="6 4" />
          {/* 载荷 */}
          <g transform={`translate(${loadX}, ${baselineY})`}>
            <line x1="0" y1="-50" x2="0" y2="-8" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
            <text x="10" y="-30" fill="#e11d48" fontWeight="bold" fontSize="12">P={state.bendLoad}N</text>
          </g>
          {/* 截面位置指示线 */}
          <line x1={cutSvgX} y1={baselineY - 20} x2={cutSvgX} y2={baselineY + 20} stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" />
          <text x={cutSvgX} y={baselineY - 25} textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">截面</text>

          {/* 剪力图 */}
          <g transform={`translate(0, ${sfdY})`}>
            <line x1="20" y1="0" x2="580" y2="0" stroke="#94a3b8" strokeWidth="1" />
            <text x="25" y="-5" fontSize="11" fill="#64748b" fontWeight="bold">V (剪力)</text>
            {/* 左段: +R1 */}
            <rect x={beamStartX} y={-R1 * sfdScale} width={loadX - beamStartX} height={R1 * sfdScale}
              fill="rgba(79,70,229,0.1)" stroke="#4f46e5" strokeWidth="1.5" />
            <text x={beamStartX + 8} y={-R1 * sfdScale + 14} fontSize="10" fill="#4f46e5">+{R1.toFixed(0)}</text>
            {/* 右段: -R2 */}
            <rect x={loadX} y="0" width={beamEndX - loadX} height={R2 * sfdScale}
              fill="rgba(225,29,72,0.1)" stroke="#e11d48" strokeWidth="1.5" />
            <text x={beamEndX - 45} y={R2 * sfdScale - 4} fontSize="10" fill="#e11d48">-{R2.toFixed(0)}</text>
            {/* 截面位置标记 */}
            <line x1={cutSvgX} y1={-sfdH - 5} x2={cutSvgX} y2={sfdH + 5} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx={cutSvgX} cy={V > 0 ? -V * sfdScale : -V * sfdScale} r="4" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
          </g>
        </svg>
        </div>
      </div>

      {/* 截面剪应力分布 + 参数 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 剪应力分布图 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2">
            <Sigma className="w-4 h-4" /> 截面剪应力分布
          </div>
          <div className="flex justify-center">
          <svg width="280" height="280" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
            {/* 截面轮廓 */}
            <rect x="20" y={distY0} width="40" height={distH} fill="rgba(79,70,229,0.05)" stroke="#4f46e5" strokeWidth="1.5" />
            {/* 中性轴 */}
            <line x1="10" y1={distY0 + distH / 2} x2="60" y2={distY0 + distH / 2} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
            <text x="5" y={distY0 + distH / 2 - 5} fontSize="8" fill="#94a3b8">N.A.</text>
            {/* y轴标注 */}
            <text x="35" y={distY0 - 5} fontSize="9" fill="#64748b" textAnchor="middle">+y</text>
            <text x="35" y={distY0 + distH + 12} fontSize="9" fill="#64748b" textAnchor="middle">-y</text>

            {/* 剪应力分布曲线 */}
            {distributionPoints.length > 1 && (
              <path
                d={distributionPoints.map((p, i) => {
                  const px = distMapX(p.tau);
                  const py = distMapY(p.y);
                  return `${i === 0 ? 'M' : 'L'} ${px},${py}`;
                }).join(' ')}
                fill="none" stroke="#e11d48" strokeWidth="2.5"
              />
            )}
            {/* 填充区域 */}
            {distributionPoints.length > 1 && (
              <path
                d={`M ${distX},${distMapY(distributionPoints[0].y)} ` +
                   distributionPoints.map(p => `L ${distMapX(p.tau)},${distMapY(p.y)}`).join(' ') +
                   ` L ${distX},${distMapY(distributionPoints[distributionPoints.length - 1].y)} Z`}
                fill="rgba(225,29,72,0.08)" stroke="none"
              />
            )}
            {/* 零线 */}
            <line x1={distX} y1={distY0} x2={distX} y2={distY0 + distH} stroke="#94a3b8" strokeWidth="1" />
            {/* τ轴 */}
            <line x1={distX} y1={distY0 + distH + 5} x2={distX + distW + 10} y2={distY0 + distH + 5} stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowDim)" />
            <text x={distX + distW / 2} y={distY0 + distH + 20} fontSize="10" fill="#64748b" textAnchor="middle">τ (MPa)</text>

            {/* 当前y位置标记 */}
            <line x1="15" y1={distMapY(yPosition)} x2={distMapX(currentShear.tau) + 5} y2={distMapY(yPosition)}
              stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx={distMapX(currentShear.tau)} cy={distMapY(yPosition)} r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
            <text x={distMapX(currentShear.tau) + 10} y={distMapY(yPosition) + 4} fontSize="10" fill="#f59e0b" fontWeight="bold">
              {currentShear.tau.toFixed(2)}
            </text>

            {/* 最大值标注 */}
            <circle cx={distMapX(maxShear.tau)} cy={distMapY(0)} r="4" fill="#e11d48" stroke="white" strokeWidth="1.5" />
            <text x={distMapX(maxShear.tau) + 8} y={distMapY(0) - 6} fontSize="9" fill="#e11d48" fontWeight="bold">
              τ_max={maxShear.tau.toFixed(1)}
            </text>
          </svg>
          </div>
        </div>

        {/* 参数面板 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
            <Calculator className="w-4 h-4 text-indigo-500" /> 实验参数
          </h3>
          <div className="space-y-2">
            <SectionSelector section={state.bendSection} onChange={(s) => onChange({ bendSection: s })} />
            <SliderInputControl label="载荷 P" value={state.bendLoad} min={100} max={50000} step={100} unit="N" onChange={(v) => onChange({ bendLoad: v })} />
            <SliderInputControl label="跨度 L" value={state.bendLength} min={0.5} max={10} step={0.1} unit="m" onChange={(v) => onChange({ bendLength: v })} />
            <SliderInputControl label="载荷位置 a" value={state.bendLoadPos} min={0.1} max={state.bendLength - 0.1} step={0.1} unit="m" onChange={(v) => onChange({ bendLoadPos: v })} />
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">截面位置 x/L</label>
                <span className="text-sm font-bold" style={{ color: 'var(--color-1)' }}>{(cutPosition * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.01" max="0.99" step="0.01" value={cutPosition}
                onChange={(e) => setCutPosition(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">截面高度 y</label>
                <span className="text-sm font-bold" style={{ color: 'var(--color-1)' }}>{yPosition.toFixed(1)} mm</span>
              </div>
              <input type="range" min={-yMax} max={yMax} step={yMax / 50} value={yPosition}
                onChange={(e) => setYPosition(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* 结果面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
            <Sigma className="w-4 h-4 text-indigo-500" /> 剪应力分析结果
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">截面处剪力 V</span>
              <span className="font-mono font-bold text-indigo-600">{Math.abs(V).toFixed(1)} N</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">当前y处剪应力 τ</span>
              <span className="font-mono font-bold text-indigo-600">{currentShear.tau.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大剪应力 τ_max (y=0)</span>
              <span className="font-mono font-bold text-rose-600">{maxShear.tau.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">平均剪应力 τ_avg</span>
              <span className="font-mono font-bold text-slate-600">{tauAvg.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">τ_max / τ_avg</span>
              <span className="font-mono font-bold text-indigo-600">{(maxShear.tau / tauAvg).toFixed(2)}</span>
            </div>
            <div className="p-2 bg-blue-50 rounded text-xs text-slate-600 leading-relaxed border border-blue-100">
              💡 矩形截面 τ_max/τ_avg = 1.5，圆形截面为 4/3 ≈ 1.33，工字钢腹板承担绝大部分剪力。
            </div>
          </div>
        </div>

        {/* 计算过程 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
            <Sigma className="w-4 h-4 text-indigo-500" /> 计算过程演示
          </h4>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 overflow-x-auto">
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">① 截面处剪力</div>
              <LatexRenderer formula={formulaV} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">② 截面惯性矩</div>
              <LatexRenderer formula={`I_z = ${(I / 1e4).toFixed(2)} \\times 10^4 \\text{ mm}^4`} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">③ y={yPosition.toFixed(1)}mm 处的面积静矩</div>
              <LatexRenderer formula={formulaQ} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">④ 剪应力计算 τ = VQ/(Ib)</div>
              <LatexRenderer formula={formulaTau} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">⑤ 最大剪应力</div>
              <LatexRenderer formula={formulaTauMax} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">⑥ 最大与平均之比</div>
              <LatexRenderer formula={formulaRatio} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
