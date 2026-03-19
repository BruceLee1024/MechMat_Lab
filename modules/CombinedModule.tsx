import React, { useState } from "react";
import { Calculator, Sigma, Activity, ShieldCheck, Layers } from "lucide-react";
import { SliderInputControl, LatexRenderer, SectionSelector, calculateSectionProperties } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

type CombinedTab = "eccentric" | "bendtorque" | "verification";

// ============================================================
// 偏心受压子模块 (保持原有代码)
// ============================================================
const EccentricModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const { combinedLoad: P, combinedEccentricity: e } = state;
  const sectionProps = calculateSectionProperties(state.combinedSection);
  const A = sectionProps.area;
  const I = sectionProps.Iz;
  const yMax = sectionProps.yMax;
  const h = yMax * 2;

  const M = P * e;
  const sigma_axial = P / A;
  const sigma_bending_max = (M * yMax) / I;
  const sigma_top_val = sigma_axial - sigma_bending_max;
  const sigma_bottom = sigma_axial + sigma_bending_max;

  const scale = 1.8;
  const beamH = h * scale;
  const beamW = 250;
  const cx = 150, cy = 175;
  const topY = cy - beamH / 2;
  const bottomY = cy + beamH / 2;
  const forceY = cy + e * scale;

  const profileX = 450;
  const stressScale = 3;
  const topStressX = profileX + sigma_top_val * stressScale;
  const bottomStressX = profileX + sigma_bottom * stressScale;

  return (
    <div className="space-y-6">
      {/* 可视化 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative h-[320px]">
        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4" /> 偏心受压演示
        </div>
        <svg width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet">
          <CommonDefs />
          <rect x={50} y={topY} width={beamW} height={beamH} fill="rgba(79, 70, 229, 0.05)" stroke="#4f46e5" strokeWidth="2" />
          <line x1={40} y1={cy} x2={400} y2={cy} stroke="#4f46e5" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.4" />
          <line x1={50} y1={topY} x2={50} y2={bottomY} stroke="#4f46e5" strokeWidth="2" />
          <line x1={50 + beamW} y1={topY} x2={50 + beamW} y2={bottomY} stroke="#4f46e5" strokeWidth="2" />
          <line x1={350} y1={forceY} x2={300 + 10} y2={forceY} stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
          <circle cx={300} cy={forceY} r="3" fill="#e11d48" />
          <text x={355} y={forceY + 4} fill="#e11d48" fontWeight="bold" fontSize="12">F</text>
          <line x1={320} y1={cy} x2={320} y2={forceY} stroke="#64748b" strokeWidth="1" />
          <line x1={315} y1={cy} x2={325} y2={cy} stroke="#64748b" />
          <line x1={315} y1={forceY} x2={325} y2={forceY} stroke="#64748b" />
          <text x={330} y={(cy + forceY) / 2 + 4} fill="#64748b" fontSize="11">e</text>
          <line x1={profileX} y1={topY} x2={profileX} y2={bottomY} stroke="#cbd5e1" strokeWidth="2" />
          <polygon
            points={`${profileX},${topY} ${topStressX},${topY} ${bottomStressX},${bottomY} ${profileX},${bottomY}`}
            fill={sigma_top_val < 0 ? "rgba(225, 29, 72, 0.1)" : "rgba(79, 70, 229, 0.1)"}
            stroke="none"
          />
          <path d={`M ${topStressX},${topY} L ${bottomStressX},${bottomY}`} stroke={sigma_top_val < 0 && sigma_bottom < 0 ? "#e11d48" : "#4f46e5"} strokeWidth="2" fill="none" />
          <line x1={profileX} y1={topY} x2={topStressX} y2={topY} stroke="#4f46e5" strokeWidth="2" />
          <line x1={profileX} y1={bottomY} x2={bottomStressX} y2={bottomY} stroke="#4f46e5" strokeWidth="2" />
          <text x={topStressX + (sigma_top_val > 0 ? 10 : -10)} y={topY - 5} fill="#4f46e5" textAnchor={sigma_top_val > 0 ? "start" : "end"} fontSize="11">
            σ_top = {sigma_top_val.toFixed(1)}
          </text>
          <text x={bottomStressX + 10} y={bottomY + 15} fill="#4f46e5" fontSize="11">
            σ_bot = {sigma_bottom.toFixed(1)}
          </text>
          <text x={profileX} y={topY - 30} textAnchor="middle" fontWeight="bold" fill="#334155" fontSize="12">应力分布 (Stress Profile)</text>
        </svg>
      </div>

      {/* 参数与结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-500" /> 实验参数
          </h3>
          <div className="space-y-4">
            <SectionSelector
              section={state.combinedSection}
              onChange={(s) => onChange({ combinedSection: s })}
            />
            <SliderInputControl label="偏心距 (e)" value={state.combinedEccentricity} min={0} max={200} step={1} unit="mm" onChange={(v) => onChange({ combinedEccentricity: v })} />
            <SliderInputControl label="轴向拉力 (F)" value={state.combinedLoad} min={100} max={100000} step={100} unit="N" onChange={(v) => onChange({ combinedLoad: v })} />
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Sigma className="w-4 h-4 text-indigo-500" /> 结果分析
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">轴向应力 (σ_axial)</span>
              <span className="font-mono font-bold text-indigo-600">{sigma_axial.toFixed(1)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大弯曲应力 (σ_bend)</span>
              <span className="font-mono font-bold text-indigo-600">{sigma_bending_max.toFixed(1)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">上边缘总应力 (σ_top)</span>
              <span className={`font-mono font-bold ${sigma_top_val < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>{sigma_top_val.toFixed(1)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">下边缘总应力 (σ_bot)</span>
              <span className="font-mono font-bold text-indigo-600">{sigma_bottom.toFixed(1)} MPa</span>
            </div>
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-slate-500 leading-relaxed border border-blue-100">
              提示：如果偏心距 e 较大，M产生的弯曲应力可能超过轴向压应力，导致截面一侧出现拉应力。
            </div>
          </div>
        </div>
      </div>

      {/* 计算过程 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Sigma className="w-3 h-3 text-indigo-500" /> 计算过程演示
        </h4>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 overflow-x-auto">
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">① 截面面积与惯性矩 (Section Properties)</div>
            <LatexRenderer formula={`A = ${A.toFixed(0)} \\text{ mm}^2, \\quad I_z = ${(I / 10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">② 轴向应力 (Axial Stress)</div>
            <LatexRenderer formula={`\\sigma_{axial} = \\frac{P}{A} = \\frac{${P}}{${A}} = ${sigma_axial.toFixed(2)} \\text{ MPa}`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">③ 偏心弯矩 (Eccentric Moment)</div>
            <LatexRenderer formula={`M = P \\cdot e = ${P} \\times ${e} = ${M} \\text{ N}\\cdot\\text{mm}`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">④ 最大弯曲应力 (Maximum Bending Stress)</div>
            <LatexRenderer formula={`\\sigma_{bend} = \\frac{M \\cdot y_{max}}{I} = \\frac{${M} \\times ${yMax.toFixed(0)}}{${I.toFixed(0)}} = ${sigma_bending_max.toFixed(2)} \\text{ MPa}`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">⑤ 应力叠加 (Stress Superposition)</div>
            <LatexRenderer formula={`\\sigma_{top} = \\sigma_{axial} - \\sigma_{bend} = ${sigma_axial.toFixed(2)} - ${sigma_bending_max.toFixed(2)} = ${sigma_top_val.toFixed(2)} \\text{ MPa}`} />
            <LatexRenderer formula={`\\sigma_{bot} = \\sigma_{axial} + \\sigma_{bend} = ${sigma_axial.toFixed(2)} + ${sigma_bending_max.toFixed(2)} = ${sigma_bottom.toFixed(2)} \\text{ MPa}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 弯扭组合子模块 (新增加)
// ============================================================
const BendTorqueModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const { bendTorque: T, bendTorqueBendLoad: P, bendTorqueBendPos: a, bendTorqueLength: L, bendTorqueModulus: E } = state;

  // 截面计算
  const sectionProps = calculateSectionProperties(state.bendTorqueSection);

  // 使用统一函数获取截面属性
  const Ip = sectionProps.Ip;
  const Wp = sectionProps.Wp;
  const Iz = sectionProps.Iz;
  const Wz = sectionProps.Iz / sectionProps.yMax;
  const r = sectionProps.yMax;

  // 弯矩计算（悬臂梁：P 作用在距离固定端 a 的位置）
  const M = P * a * 1000; // N·mm
  const sigma = M / Wz; // 最大正应力 MPa

  // 扭矩计算
  const tau = (T * 1000) / Wp; // MPa

  // 强度理论计算
  const sigma_eq3 = Math.sqrt(Math.pow(sigma, 2) + 4 * Math.pow(tau, 2)); // 第三强度理论
  const sigma_eq4 = Math.sqrt(Math.pow(sigma, 2) + 3 * Math.pow(tau, 2)); // 第四强度理论

  // 安全系数
  const yieldStress = state.materialYield;
  const n3 = yieldStress / sigma_eq3; // 第三强度理论安全系数
  const n4 = yieldStress / sigma_eq4; // 第四强度理论安全系数

  // 可视化参数
  const shaftLength = 400;
  const shaftY = 175;
  const shaftRadius = Math.min(r, 40); // 缩放显示
  const fixedX = 80;
  const loadX = fixedX + a * 300;
  const freeX = fixedX + shaftLength;

  return (
    <div className="space-y-6">
      {/* 可视化 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative h-[320px]">
        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
          <Layers className="w-4 h-4" /> 弯扭组合演示
        </div>
        <svg width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet">
          <CommonDefs />

          {/* 固定端 */}
          <rect x={fixedX - 15} y={shaftY - shaftRadius - 20} width={20} height={shaftRadius * 2 + 40} fill="#64748b" rx="3" />
          <line x1={fixedX - 15} y1={shaftY - shaftRadius - 15} x2={fixedX - 15} y2={shaftY + shaftRadius + 15} stroke="#475569" strokeWidth="3" />
          <line x1={fixedX - 20} y1={shaftY - shaftRadius - 10} x2={fixedX - 5} y2={shaftY - shaftRadius - 10} stroke="#475569" strokeWidth="2" />
          <line x1={fixedX - 20} y1={shaftY + shaftRadius + 10} x2={fixedX - 5} y2={shaftY + shaftRadius + 10} stroke="#475569" strokeWidth="2" />

          {/* 轴身 (用椭圆表示3D效果) */}
          <ellipse cx={fixedX} cy={shaftY} rx={6} ry={shaftRadius} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="1.5" />
          <line x1={fixedX} y1={shaftY - shaftRadius} x2={freeX} y2={shaftY - shaftRadius} stroke="#6366f1" strokeWidth="2" />
          <line x1={fixedX} y1={shaftY + shaftRadius} x2={freeX} y2={shaftY + shaftRadius} stroke="#6366f1" strokeWidth="2" />
          <ellipse cx={freeX} cy={shaftY} rx={6} ry={shaftRadius} fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="1.5" />

          {/* 中间截面标记 */}
          <line x1={loadX} y1={shaftY - shaftRadius - 10} x2={loadX} y2={shaftY - shaftRadius + 5} stroke="#6366f1" strokeWidth="1" />
          <line x1={loadX} y1={shaftY + shaftRadius - 5} x2={loadX} y2={shaftY + shaftRadius + 10} stroke="#6366f1" strokeWidth="1" />

          {/* 弯曲载荷 P (向下) */}
          <line x1={loadX} y1={shaftY - shaftRadius} x2={loadX} y2={shaftY - shaftRadius - 50} stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
          <text x={loadX + 8} y={shaftY - shaftRadius - 40} fill="#e11d48" fontWeight="bold" fontSize="11">P = {P}N</text>

          {/* 扭矩 T (绕轴线旋转箭头) */}
          <path d={`M ${freeX + 30} ${shaftY - 25} A 30 30 0 0 1 ${freeX + 30} ${shaftY + 25}`} fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
          <path d={`M ${freeX + 30} ${shaftY + 25} A 30 30 0 0 1 ${freeX + 30} ${shaftY - 25}`} fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x={freeX + 45} y={shaftY + 4} fill="#f59e0b" fontWeight="bold" fontSize="11">T</text>

          {/* 危险截面标注 */}
          <line x1={loadX} y1={shaftY + shaftRadius + 20} x2={loadX} y2={shaftY + shaftRadius + 45} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
          <text x={loadX - 20} y={shaftY + shaftRadius + 58} fill="#ef4444" fontSize="10" textAnchor="middle">危险截面</text>

          {/* 图例 */}
          <rect x={30} y={280} width={12} height={12} fill="#6366f1" rx="2" />
          <text x={48} y={290} fill="#64748b" fontSize="10">轴截面</text>
          <line x1={100} y1={286} x2={120} y2={286} stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
          <text x={126} y={290} fill="#64748b" fontSize="10">弯矩 P</text>
          <path d={`M 170 282 A 8 8 0 0 1 186 282`} fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x={192} y={290} fill="#64748b" fontSize="10">扭矩 T</text>
        </svg>
      </div>

      {/* 参数与结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-500" /> 实验参数
          </h3>
          <div className="space-y-4">
            <SectionSelector
              section={state.bendTorqueSection}
              onChange={(s) => onChange({ bendTorqueSection: s })}
            />
            <SliderInputControl label="弯矩载荷 (P)" value={state.bendTorqueBendLoad} min={100} max={50000} step={100} unit="N" onChange={(v) => onChange({ bendTorqueBendLoad: v })} />
            <SliderInputControl label="载荷位置 (a)" value={state.bendTorqueBendPos} min={0.1} max={L} step={0.05} unit="m" onChange={(v) => onChange({ bendTorqueBendPos: v })} />
            <SliderInputControl label="扭矩 (T)" value={state.bendTorque} min={10} max={5000} step={10} unit="N·m" onChange={(v) => onChange({ bendTorque: v })} />
            <SliderInputControl label="轴长 (L)" value={state.bendTorqueLength} min={0.5} max={5} step={0.1} unit="m" onChange={(v) => onChange({ bendTorqueLength: v })} />
            <SliderInputControl label="弹性模量 (E)" value={state.bendTorqueModulus} min={50} max={300} step={5} unit="GPa" onChange={(v) => onChange({ bendTorqueModulus: v })} />
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Sigma className="w-4 h-4 text-indigo-500" /> 应力分析结果
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大弯矩 (M)</span>
              <span className="font-mono font-bold text-indigo-600">{(M / 1000).toFixed(2)} N·m</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">弯曲正应力 (σ)</span>
              <span className="font-mono font-bold text-indigo-600">{sigma.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">扭转切应力 (τ)</span>
              <span className="font-mono font-bold text-amber-600">{tau.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">τ/σ 比值</span>
              <span className="font-mono font-bold text-slate-600">{(tau / sigma).toFixed(3)}</span>
            </div>
            <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-slate-500 leading-relaxed border border-amber-100">
              提示：弯扭组合变形常见于传动轴设计。弯曲使轴上下表面产生最大正应力，扭转使圆周方向产生最大切应力，两者同时作用形成复杂应力状态。
            </div>
          </div>
        </div>
      </div>

      {/* 强度理论与安全系数 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" /> 强度理论与安全系数
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 第三强度理论 */}
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
            <div className="text-sm font-semibold text-rose-700 mb-2">第三强度理论（最大切应力准则）</div>
            <LatexRenderer formula={`\\sigma_{eq3} = \\sqrt{\\sigma^2 + 4\\tau^2} = ${sigma_eq3.toFixed(2)} \\text{ MPa}`} />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-slate-600">安全系数</span>
              <span className={`font-mono font-bold text-lg ${n3 >= 1.5 ? 'text-green-600' : n3 >= 1.0 ? 'text-amber-600' : 'text-rose-600'}`}>
                n = {n3.toFixed(2)}
              </span>
            </div>
            <div className={`mt-2 text-xs rounded px-2 py-1 ${n3 >= 1.5 ? 'bg-green-100 text-green-700' : n3 >= 1.0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {n3 >= 1.5 ? '✓ 安全' : n3 >= 1.0 ? '⚠ 接近极限' : '✗ 强度不足'}
            </div>
          </div>

          {/* 第四强度理论 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-semibold text-blue-700 mb-2">第四强度理论（畸变能准则）</div>
            <LatexRenderer formula={`\\sigma_{eq4} = \\sqrt{\\sigma^2 + 3\\tau^2} = ${sigma_eq4.toFixed(2)} \\text{ MPa}`} />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-slate-600">安全系数</span>
              <span className={`font-mono font-bold text-lg ${n4 >= 1.5 ? 'text-green-600' : n4 >= 1.0 ? 'text-amber-600' : 'text-rose-600'}`}>
                n = {n4.toFixed(2)}
              </span>
            </div>
            <div className={`mt-2 text-xs rounded px-2 py-1 ${n4 >= 1.5 ? 'bg-green-100 text-green-700' : n4 >= 1.0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {n4 >= 1.5 ? '✓ 安全' : n4 >= 1.0 ? '⚠ 接近极限' : '✗ 强度不足'}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-600 mb-2">强度理论说明：</div>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• <strong>第三强度理论</strong>：基于最大切应力准则，结果偏大，适用于脆性材料或应力状态简单的情况</li>
            <li>• <strong>第四强度理论</strong>：基于畸变能理论，结果偏小且更接近实验数据，适用于塑性材料（如钢材）</li>
            <li>• 一般取安全系数 n ≥ 1.5 ~ 2.0 作为设计依据</li>
          </ul>
        </div>
      </div>

      {/* 计算过程 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Sigma className="w-3 h-3 text-indigo-500" /> 计算过程演示
        </h4>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 overflow-x-auto">
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">① 截面几何特性 (Section Properties)</div>
            {state.bendTorqueSection.type === 'circle' || state.bendTorqueSection.type === 'hollow_circle' ? (
              <LatexRenderer formula={`d = ${r * 2} \\text{ mm}, \\quad I_p = ${Ip.toFixed(0)} \\text{ mm}^4, \\quad W_p = ${Wp.toFixed(0)} \\text{ mm}^3`} />
            ) : (
              <LatexRenderer formula={`b = ${state.bendTorqueSection.width || 40} \\text{ mm}, \\quad h = ${state.bendTorqueSection.height || 60} \\text{ mm}, \\quad I_z = ${Iz.toFixed(0)} \\text{ mm}^4`} />
            )}
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">② 弯矩计算 (Bending Moment - 悬臂梁)</div>
            <LatexRenderer formula={`M = P \\cdot a = ${P} \\times ${a.toFixed(2)} = ${(M / 1000).toFixed(2)} \\text{ N}\\cdot\\text{m}`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">③ 弯曲正应力 (Bending Stress)</div>
            <LatexRenderer formula={`\\sigma = \\frac{M}{W_z} = \\frac{${(M / 1000).toFixed(2)} \\times 10^3}{${Wz.toFixed(0)}} = ${sigma.toFixed(2)} \\text{ MPa}`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">④ 扭转切应力 (Torsional Shear Stress)</div>
            <LatexRenderer formula={`\\tau = \\frac{T}{W_p} = \\frac{${T} \\times 10^3}{${Wp.toFixed(0)}} = ${tau.toFixed(2)} \\text{ MPa}`} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">⑤ 强度理论合成 (Equivalent Stress)</div>
            <LatexRenderer formula={`\\sigma_{eq3} = \\sqrt{${sigma.toFixed(2)}^2 + 4 \\times ${tau.toFixed(2)}^2} = ${sigma_eq3.toFixed(2)} \\text{ MPa}`} />
            <LatexRenderer formula={`\\sigma_{eq4} = \\sqrt{${sigma.toFixed(2)}^2 + 3 \\times ${tau.toFixed(2)}^2} = ${sigma_eq4.toFixed(2)} \\text{ MPa}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 强度校核子模块
// ============================================================
const VerificationModule = ({ state }: { state: SimulationState }) => {
  // 复用偏心受压和弯扭的计算结果
  const { combinedLoad: P, combinedEccentricity: e } = state;
  const sectionProps = calculateSectionProperties(state.combinedSection);
  const A = sectionProps.area;
  const I = sectionProps.Iz;
  const yMax = sectionProps.yMax;

  const M = P * e;
  const sigma_axial = P / A;
  const sigma_bending_max = (M * yMax) / I;
  const sigma_top = sigma_axial - sigma_bending_max;

  // 弯扭部分
  const { bendTorque: T, bendTorqueBendLoad: P_bt, bendTorqueBendPos: a } = state;
  const btSectionProps = calculateSectionProperties(state.bendTorqueSection);
  const Wz_bt = btSectionProps.Iz / btSectionProps.yMax;
  const Wp_bt = btSectionProps.Wp;
  const M_bt = P_bt * a * 1000;
  const sigma_bt = M_bt / Wz_bt;
  const tau_bt = (T * 1000) / Wp_bt;
  const sigma_eq3 = Math.sqrt(Math.pow(sigma_bt, 2) + 4 * Math.pow(tau_bt, 2));
  const n = state.materialYield / sigma_eq3;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" /> 强度校核总览
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 偏心受压校核 */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-700 mb-3">偏心受压校核</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">材料屈服强度</span>
                <span className="font-mono">{state.materialYield} MPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">最大压应力</span>
                <span className="font-mono">{Math.max(sigma_axial + sigma_bending_max, sigma_top, sigma_axial - sigma_bending_max).toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">是否出现拉应力</span>
                <span className={`font-mono ${sigma_top < 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  {sigma_top < 0 ? '是' : '否'}
                </span>
              </div>
            </div>
          </div>

          {/* 弯扭组合校核 */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-700 mb-3">弯扭组合校核</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">等效应力 (第三强度)</span>
                <span className="font-mono">{sigma_eq3.toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">安全系数</span>
                <span className={`font-mono font-bold ${n >= 1.5 ? 'text-green-600' : n >= 1.0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  n = {n.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">校核结果</span>
                <span className={`font-mono font-bold ${n >= 1.5 ? 'text-green-600' : n >= 1.0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {n >= 1.5 ? '通过' : n >= 1.0 ? '注意' : '不通过'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="font-medium text-indigo-700 mb-2">校核要点</h4>
          <ul className="text-sm text-indigo-600 space-y-1">
            <li>• 偏心受压时，需注意截面是否出现拉应力（混凝土等脆性材料不允许受拉）</li>
            <li>• 弯扭组合变形应使用强度理论计算等效应力</li>
            <li>• 传动轴设计时，通常以第四强度理论作为校核依据</li>
            <li>• 安全系数一般取 n ≥ 1.5 ~ 2.0</li>
          </ul>
        </div>
      </div>

      {/* 材料选择建议 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" /> 材料选用参考
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-2 text-left text-slate-600">材料</th>
                <th className="px-4 py-2 text-left text-slate-600">屈服强度 σ_s</th>
                <th className="px-4 py-2 text-left text-slate-600">适用场景</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2">Q235 碳素结构钢</td>
                <td className="px-4 py-2">235 MPa</td>
                <td className="px-4 py-2">一般构件、轻载传动轴</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2">Q345 低合金钢</td>
                <td className="px-4 py-2">345 MPa</td>
                <td className="px-4 py-2">中载传动轴、重要构件</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-2">45 号钢</td>
                <td className="px-4 py-2">355 MPa</td>
                <td className="px-4 py-2">调质处理后，高强度传动轴</td>
              </tr>
              <tr>
                <td className="px-4 py-2">40Cr 合金钢</td>
                <td className="px-4 py-2">785 MPa</td>
                <td className="px-4 py-2">重载高速传动轴</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 主模块入口
// ============================================================
export const CombinedModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const [activeTab, setActiveTab] = useState<CombinedTab>("eccentric");

  const tabs: { id: CombinedTab; label: string; icon: React.ReactNode }[] = [
    { id: "eccentric", label: "偏心受压", icon: <Activity className="w-4 h-4" /> },
    { id: "bendtorque", label: "弯扭组合", icon: <Layers className="w-4 h-4" /> },
    { id: "verification", label: "强度校核", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 标签页导航 */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-b-xl p-6">
        {activeTab === "eccentric" && <EccentricModule state={state} onChange={onChange} />}
        {activeTab === "bendtorque" && <BendTorqueModule state={state} onChange={onChange} />}
        {activeTab === "verification" && <VerificationModule state={state} />}
      </div>
    </div>
  );
};
