import React, { useState } from "react";
import { Calculator, Sigma, Shield, Activity } from "lucide-react";
import { SliderControl, LatexRenderer } from "../components";
import { SimulationState } from "../types";

export const StrengthTheoryModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const [sig1, setSig1] = useState(120);
  const [sig2, setSig2] = useState(-40);
  const [sig3, setSig3] = useState(0);
  const [sigmaS, setSigmaS] = useState(state.materialYield);
  const nu = state.poissonRatio;

  // 排序主应力 s1 >= s2 >= s3
  const sorted = [sig1, sig2, sig3].sort((a, b) => b - a);
  const s1 = sorted[0], s2 = sorted[1], s3 = sorted[2];

  // 四大强度理论计算
  // 第一强度理论: 最大拉应力
  const sigma_r1 = s1;
  // 第二强度理论: 最大伸长线应变
  const sigma_r2 = s1 - nu * (s2 + s3);
  // 第三强度理论: Tresca (最大剪应力)
  const sigma_r3 = s1 - s3;
  // 第四强度理论: von Mises
  const sigma_r4 = Math.sqrt(0.5 * ((s1 - s2) ** 2 + (s2 - s3) ** 2 + (s3 - s1) ** 2));

  // 安全系数
  const n1 = sigmaS / Math.max(Math.abs(sigma_r1), 0.001);
  const n2 = sigmaS / Math.max(Math.abs(sigma_r2), 0.001);
  const n3 = sigmaS / Math.max(Math.abs(sigma_r3), 0.001);
  const n4 = sigmaS / Math.max(Math.abs(sigma_r4), 0.001);

  const theories = [
    { id: 1, name: "第一强度理论", sub: "最大拉应力", sigma: sigma_r1, n: n1, color: "#3b82f6", safe: Math.abs(sigma_r1) <= sigmaS },
    { id: 2, name: "第二强度理论", sub: "最大伸长线应变", sigma: sigma_r2, n: n2, color: "#8b5cf6", safe: Math.abs(sigma_r2) <= sigmaS },
    { id: 3, name: "第三强度理论", sub: "Tresca", sigma: sigma_r3, n: n3, color: "#f59e0b", safe: Math.abs(sigma_r3) <= sigmaS },
    { id: 4, name: "第四强度理论", sub: "von Mises", sigma: sigma_r4, n: n4, color: "#e11d48", safe: Math.abs(sigma_r4) <= sigmaS },
  ];

  // σ1-σ2 屈服面图参数 (σ3=0 平面)
  const svgSize = 300;
  const center = svgSize / 2;
  const axisLen = 120;
  const scale = axisLen / (sigmaS * 1.5);
  const toSvgX = (v: number) => center + v * scale;
  const toSvgY = (v: number) => center - v * scale;

  // 生成 Tresca 六边形 (σ3=0 平面)
  const trescaPoints = [
    [sigmaS, 0], [sigmaS, sigmaS], [0, sigmaS],
    [-sigmaS, 0], [-sigmaS, -sigmaS], [0, -sigmaS],
  ].map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`).join(' ');

  // 生成 von Mises 椭圆路径 (σ3=0: σ1²-σ1σ2+σ2²=σs²)
  const vmPoints: string[] = [];
  for (let t = 0; t <= 360; t += 2) {
    const rad = (t * Math.PI) / 180;
    // 参数方程: σ1 = σs*(cos(t) + sin(t)/√3), σ2 = σs*(-cos(t) + sin(t)/√3) 不准确
    // 直接用极坐标近似
    const ct = Math.cos(rad), st = Math.sin(rad);
    const r = sigmaS / Math.sqrt(ct * ct - ct * st + st * st);
    const x = r * ct, y = r * st;
    vmPoints.push(`${toSvgX(x)},${toSvgY(y)}`);
  }
  const vmPath = `M ${vmPoints.join(' L ')} Z`;

  // 第一强度理论: 正方形 |σ1|≤σs 且 |σ2|≤σs
  const theory1Rect = `${toSvgX(-sigmaS)},${toSvgY(sigmaS)} ${toSvgX(sigmaS)},${toSvgY(sigmaS)} ${toSvgX(sigmaS)},${toSvgY(-sigmaS)} ${toSvgX(-sigmaS)},${toSvgY(-sigmaS)}`;

  // 等效应力柱状图参数
  const barMaxW = 200;
  const barH = 28;
  const maxSigmaR = Math.max(...theories.map(t => Math.abs(t.sigma)), sigmaS) * 1.1;

  // LaTeX
  const fR1 = `\\sigma_{r1} = \\sigma_1 = ${s1.toFixed(1)} \\text{ MPa}`;
  const fR2 = `\\sigma_{r2} = \\sigma_1 - \\nu(\\sigma_2 + \\sigma_3) = ${s1.toFixed(1)} - ${nu}(${s2.toFixed(1)} + ${s3.toFixed(1)}) = ${sigma_r2.toFixed(1)} \\text{ MPa}`;
  const fR3 = `\\sigma_{r3} = \\sigma_1 - \\sigma_3 = ${s1.toFixed(1)} - (${s3.toFixed(1)}) = ${sigma_r3.toFixed(1)} \\text{ MPa}`;
  const fR4VM = `\\sigma_{r4} = \\sqrt{\\frac{1}{2}[(${s1.toFixed(0)}-${s2.toFixed(0)})^2+(${s2.toFixed(0)}-${s3.toFixed(0)})^2+(${s3.toFixed(0)}-${s1.toFixed(0)})^2]} = ${sigma_r4.toFixed(1)} \\text{ MPa}`;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 屈服面图 + 柱状对比 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* σ1-σ2 屈服面 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
          <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" /> σ₁-σ₂ 屈服面 (σ₃=0)
          </div>
          <div className="flex justify-center">
          <svg width="300" height="300" viewBox={`0 0 ${svgSize} ${svgSize}`} preserveAspectRatio="xMidYMid meet">
            {/* 坐标轴 */}
            <line x1={center - axisLen - 15} y1={center} x2={center + axisLen + 15} y2={center} stroke="#cbd5e1" strokeWidth="1" markerEnd="url(#arrowDim)" />
            <line x1={center} y1={center + axisLen + 15} x2={center} y2={center - axisLen - 15} stroke="#cbd5e1" strokeWidth="1" markerEnd="url(#arrowDim)" />
            <text x={center + axisLen + 8} y={center - 8} fontSize="12" fill="#64748b">σ₁</text>
            <text x={center + 8} y={center - axisLen - 5} fontSize="12" fill="#64748b">σ₂</text>

            {/* 第一强度理论 - 正方形 */}
            <polygon points={theory1Rect} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
            {/* 第三强度理论 - Tresca 六边形 */}
            <polygon points={trescaPoints} fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.8" />
            {/* 第四强度理论 - von Mises 椭圆 */}
            <path d={vmPath} fill="rgba(225,29,72,0.06)" stroke="#e11d48" strokeWidth="2.5" />

            {/* 刻度线 */}
            {[-1, -0.5, 0.5, 1].map(f => (
              <g key={f}>
                <line x1={toSvgX(f * sigmaS)} y1={center - 3} x2={toSvgX(f * sigmaS)} y2={center + 3} stroke="#94a3b8" strokeWidth="1" />
                <text x={toSvgX(f * sigmaS)} y={center + 14} fontSize="8" fill="#94a3b8" textAnchor="middle">{(f * sigmaS).toFixed(0)}</text>
                <line x1={center - 3} y1={toSvgY(f * sigmaS)} x2={center + 3} y2={toSvgY(f * sigmaS)} stroke="#94a3b8" strokeWidth="1" />
                <text x={center - 14} y={toSvgY(f * sigmaS) + 3} fontSize="8" fill="#94a3b8" textAnchor="end">{(f * sigmaS).toFixed(0)}</text>
              </g>
            ))}

            {/* 当前应力状态点 */}
            <circle cx={toSvgX(sig1)} cy={toSvgY(sig2)} r="7" fill="white" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx={toSvgX(sig1)} cy={toSvgY(sig2)} r="3" fill="#1e293b" />
            <text x={toSvgX(sig1) + 12} y={toSvgY(sig2) - 8} fontSize="10" fill="#1e293b" fontWeight="bold">
              ({sig1},{sig2})
            </text>

            {/* 图例 */}
            <g transform={`translate(10, ${svgSize - 55})`}>
              <line x1="0" y1="0" x2="18" y2="0" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="22" y="4" fontSize="9" fill="#3b82f6">第一 (正方形)</text>
              <line x1="0" y1="14" x2="18" y2="14" stroke="#f59e0b" strokeWidth="2" />
              <text x="22" y="18" fontSize="9" fill="#f59e0b">第三 Tresca</text>
              <line x1="0" y1="28" x2="18" y2="28" stroke="#e11d48" strokeWidth="2.5" />
              <text x="22" y="32" fontSize="9" fill="#e11d48">第四 von Mises</text>
            </g>
          </svg>
          </div>
        </div>

        {/* 等效应力柱状对比 + 参数 */}
        <div className="flex flex-col gap-4">
          {/* 柱状图 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 等效应力对比
            </div>
            <div className="space-y-2.5">
              {theories.map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-20 text-xs font-medium text-slate-600 shrink-0 leading-tight">{t.name}</div>
                  <div className="flex-1 relative h-7 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${(Math.abs(t.sigma) / maxSigmaR) * 100}%`,
                        backgroundColor: t.color,
                        opacity: 0.8,
                      }}
                    />
                    {/* 许用应力线 */}
                    <div
                      className="absolute top-0 h-full border-r-2 border-dashed border-slate-500"
                      style={{ left: `${(sigmaS / maxSigmaR) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-mono font-bold" style={{ color: t.color }}>
                      {Math.abs(t.sigma).toFixed(1)}
                    </span>
                  </div>
                  <div className={`w-12 text-center text-xs font-bold rounded py-0.5 ${t.safe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {t.safe ? '安全' : '危险'}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                <div className="w-20 text-xs text-slate-500">许用应力</div>
                <div className="flex-1" />
                <div className="w-20 text-right text-sm font-mono text-slate-500">[σ]={sigmaS}</div>
                <div className="w-12" />
              </div>
            </div>
          </div>

          {/* 参数面板 */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4 text-indigo-500" /> 应力参数
            </h3>
            <div className="space-y-1">
              <SliderControl label="σ₁ (主应力1)" value={sig1} min={-500} max={500} step={5} unit="MPa" onChange={setSig1} />
              <SliderControl label="σ₂ (主应力2)" value={sig2} min={-500} max={500} step={5} unit="MPa" onChange={setSig2} />
              <SliderControl label="σ₃ (主应力3)" value={sig3} min={-500} max={500} step={5} unit="MPa" onChange={setSig3} />
              <SliderControl label="屈服强度 σs" value={sigmaS} min={50} max={1000} step={10} unit="MPa" onChange={setSigmaS} />
              <div className="text-xs text-slate-400">泊松比 ν = {nu} (在设置中修改)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 结果 + 计算过程 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 安全系数对比 */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
            <Sigma className="w-4 h-4 text-indigo-500" /> 安全系数对比
          </h3>
          <div className="space-y-2">
            <div className="text-xs text-slate-500 mb-1">排序后主应力: σ₁={s1.toFixed(1)}, σ₂={s2.toFixed(1)}, σ₃={s3.toFixed(1)} MPa</div>
            {theories.map(t => (
              <div key={t.id} className={`flex justify-between items-center p-2.5 rounded border ${t.safe ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
                <div>
                  <span className="text-sm font-medium" style={{ color: t.color }}>{t.name}</span>
                  <span className="text-xs text-slate-400 ml-1">({t.sub})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">σ_r = {Math.abs(t.sigma).toFixed(1)}</span>
                  <span className={`font-mono font-bold text-sm ${t.n >= 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    n = {t.n.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            <div className="p-2 bg-blue-50 rounded text-xs text-slate-600 leading-relaxed border border-blue-100">
              💡 安全系数 n = σ_s / σ_r。n {'>'} 1 为安全，n {'<'} 1 为危险。工程中通常要求 n {'>'} 1.5~2.0。
            </div>
          </div>
        </div>

        {/* 计算过程 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
            <Sigma className="w-4 h-4 text-indigo-500" /> 计算过程
          </h4>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 overflow-x-auto">
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">① 第一强度理论 (最大拉应力)</div>
              <LatexRenderer formula={fR1} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">② 第二强度理论 (最大伸长线应变)</div>
              <LatexRenderer formula={fR2} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">③ 第三强度理论 (Tresca)</div>
              <LatexRenderer formula={fR3} />
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-0.5">④ 第四强度理论 (von Mises)</div>
              <LatexRenderer formula={fR4VM} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
