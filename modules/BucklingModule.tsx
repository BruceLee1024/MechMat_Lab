import React from "react";
import { Calculator, Sigma, Activity } from "lucide-react";
import { SliderInputControl, LatexRenderer, MaterialSelector, SectionSelector, calculateSectionProperties } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const BucklingModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const E = state.buckleModulus * 1000; 
  const L_mm = state.buckleLength * 1000;
  
  // 使用截面选择器计算属性
  const sectionProps = calculateSectionProperties(state.buckleSection);
  const I_min = Math.min(sectionProps.Iz, sectionProps.Iy); // 取最小惯性矩
  const Area = sectionProps.area;
  const radiusOfGyration = Math.sqrt(I_min / Area); 
  
  const lambda = L_mm / radiusOfGyration;
  const Pcr = (Math.pow(Math.PI, 2) * E * I_min) / Math.pow(L_mm, 2); 

  const isBuckled = state.buckleLoad > Pcr;
  const ratio = Math.min(state.buckleLoad / Pcr, 1.5);
  const bowAmount = isBuckled ? (ratio - 1) * 100 : 0; 

  // 根据截面类型生成惯性矩公式
  const getInertiaFormula = () => {
    switch (state.buckleSection.type) {
      case 'rectangle':
        const b = state.buckleSection.width || 40;
        const h = state.buckleSection.height || 40;
        return `I_{min} = \\frac{b \\cdot h_{min}^3}{12} = \\frac{${Math.max(b,h)} \\times ${Math.min(b,h)}^3}{12} = ${(I_min/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      case 'circle':
        return `I = \\frac{\\pi r^4}{4} = ${(I_min/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      case 'hollow_circle':
        return `I = \\frac{\\pi (R^4 - r^4)}{4} = ${(I_min/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      default:
        return `I_{min} = ${(I_min/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
    }
  };
  const formulaI = getInertiaFormula();
  const formulaArea = `A = ${Area.toFixed(0)} \\text{ mm}^2`;
  const formulaGyration = `i = \\sqrt{\\frac{I_{min}}{A}} = \\sqrt{\\frac{${I_min.toFixed(0)}}{${Area}}} = ${radiusOfGyration.toFixed(2)} \\text{ mm}`;
  const formulaLambda = `\\lambda = \\frac{\\mu L}{i} = \\frac{1 \\times ${L_mm.toFixed(0)}}{${radiusOfGyration.toFixed(2)}} = ${lambda.toFixed(1)}`;
  const formulaPcr = `P_{cr} = \\frac{\\pi^2 E I}{(\\mu L)^2} = \\frac{\\pi^2 \\times ${E} \\times ${I_min.toFixed(0)}}{(1 \\times ${L_mm.toFixed(0)})^2} = ${Math.round(Pcr)} \\text{ N}`;
  
  const strokeW = Math.max(12, state.buckleWidth / 3);
  
  // Visual styling
  const mainColor = isBuckled ? "#e11d48" : "#4f46e5";
  const transparentColor = isBuckled ? "rgba(225, 29, 72, 0.15)" : "rgba(79, 70, 229, 0.15)";

  return (
    <div className="flex flex-col h-full space-y-6">
       {/* TOP: Visualization */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative h-[320px]">
        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
             <Activity className="w-4 h-4"/> 压杆稳定性演示
        </div>
        <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
          <CommonDefs />
          
          {/* Floor */}
          <rect x="200" y="250" width="200" height="6" fill="url(#hatchPattern)" stroke="#64748b" />
          
          {/* Column Body - Transparent with thick stroke feel */}
          <path 
            d={`M 300,250 Q ${300 + bowAmount * 2},150 300,50`} 
            stroke={transparentColor} 
            strokeWidth={strokeW} 
            fill="none" 
            strokeLinecap="butt" 
            style={{ transition: "d 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), stroke 0.3s" }}
          />
          
           {/* Column Centerline - Solid */}
           <path 
            d={`M 300,250 Q ${300 + bowAmount * 2},150 300,50`} 
            stroke={mainColor}
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="6 4"
            style={{ transition: "d 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), stroke 0.3s" }}
          />
          
          {/* Top Plate */}
          <rect x={280} y={40} width={40} height={10} fill="#f8fafc" stroke="#64748b" strokeWidth="2" rx="2" />
          
          {/* Load Arrow (Rose) */}
          <g transform={`translate(300, 35)`}>
             <line x1="0" y1="-40" x2="0" y2="-5" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
             <text x="15" y="-20" fill="#e11d48" fontWeight="bold">P = {state.buckleLoad} N</text>
          </g>
          
          <text x={380} y={100} fill="#64748b" fontSize="12">
             Crit. Load: {Math.round(Pcr)} N
          </text>
          {isBuckled && (
             <text x="380" y="130" fill="#e11d48" fontWeight="bold" fontSize="16" className="animate-pulse">BUCKLED!</text>
          )}
        </svg>
       </div>

       {/* MIDDLE: Parameters & Results */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
           <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
             <Calculator className="w-4 h-4 text-indigo-500" /> 实验参数
           </h3>
           <div className="space-y-4">
                 <MaterialSelector 
                   currentE={state.buckleModulus} 
                   onSelect={(mat) => onChange({ buckleModulus: mat.E })} 
                 />
                 <SectionSelector
                   section={state.buckleSection}
                   onChange={(s) => onChange({ buckleSection: s })}
                 />
                 <SliderInputControl label="压力 (Load)" value={state.buckleLoad} min={10} max={100000} step={10} unit="N" onChange={(v) => onChange({ buckleLoad: v })} />
                 <SliderInputControl label="杆长 (Length)" value={state.buckleLength} min={0.1} max={10} step={0.1} unit="m" onChange={(v) => onChange({ buckleLength: v })} />
                 <SliderInputControl label="弹性模量 (E)" value={state.buckleModulus} min={1} max={500} step={1} unit="GPa" onChange={(v) => onChange({ buckleModulus: v })} />
           </div>
         </div>
         
         <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Sigma className="w-4 h-4 text-indigo-500" /> 稳定性分析
            </h3>
            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border border-slate-200 text-center">
                    <div className="text-xs text-slate-500">惯性矩 (I_min)</div>
                    <div className="font-mono font-bold text-slate-700">{(I_min/10000).toFixed(2)} cm⁴</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 text-center">
                    <div className="text-xs text-slate-500">惯性半径 (i)</div>
                    <div className="font-mono font-bold text-slate-700">{radiusOfGyration.toFixed(1)} mm</div>
                  </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                <span className="text-sm text-slate-600">柔度/长细比 (λ)</span>
                <span className="font-mono font-bold text-indigo-600">{lambda.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                <span className="text-sm text-slate-600">临界载荷 (P_cr)</span>
                <span className="font-mono font-bold text-slate-700">{Math.round(Pcr)} N</span>
              </div>
              <div className={`p-3 rounded text-sm font-bold text-center transition-colors duration-300 ${isBuckled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                 {isBuckled ? "危险：结构已失稳" : "安全：处于稳定平衡状态"}
              </div>
            </div>
         </div>
       </div>

       {/* BOTTOM: Calculation Process */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Sigma className="w-3 h-3 text-indigo-500" /> 计算过程演示
          </h4>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 overflow-x-auto">
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">① 截面面积 (Cross-sectional Area)</div>
               <LatexRenderer formula={formulaArea} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">② 最小惯性矩 (Minimum Moment of Inertia)</div>
               <LatexRenderer formula={formulaI} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">③ 惯性半径 (Radius of Gyration)</div>
               <LatexRenderer formula={formulaGyration} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">④ 柔度/长细比 (Slenderness Ratio)</div>
               <LatexRenderer formula={formulaLambda} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">⑤ 欧拉临界力 (Euler Critical Load, μ=1 两端铰支)</div>
               <LatexRenderer formula={formulaPcr} />
             </div>
          </div>
       </div>
    </div>
  );
};