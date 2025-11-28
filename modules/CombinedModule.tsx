import React from "react";
import { Calculator, Sigma, Activity } from "lucide-react";
import { SliderControl, LatexRenderer } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const CombinedModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const { combinedLoad: P, combinedEccentricity: e, combinedWidth: b, combinedHeight: h } = state;
  const A = b * h; 
  const I = (b * Math.pow(h, 3)) / 12; 
  const M = P * e; 
  const sigma_axial = P / A; 
  const sigma_bending_max = (M * (h/2)) / I; 
  const sigma_top_val = sigma_axial - sigma_bending_max;
  const sigma_bottom = sigma_axial + sigma_bending_max; 

  const formulaAxial = `\\sigma_{axial} = ${sigma_axial.toFixed(2)} \\text{ MPa}`;
  const formulaMoment = `M = P \\cdot e = ${M} \\text{ N\\cdot mm}`;
  const formulaBending = `\\sigma_{bend} = ${sigma_bending_max.toFixed(2)} \\text{ MPa}`;
  const formulaSuperposition = `\\sigma_{total} = \\sigma_{axial} \\pm \\sigma_{bend}`;
  
  const scale = 1.8; 
  const beamH = h * scale;
  const beamW = 250;
  const cx = 150, cy = 175;
  const topY = cy - beamH/2;
  const bottomY = cy + beamH/2;
  const forceY = cy + e * scale; 
  
  const profileX = 450;
  const stressScale = 3; 
  const topStressX = profileX + sigma_top_val * stressScale;
  const bottomStressX = profileX + sigma_bottom * stressScale;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* TOP: Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-grow flex items-center justify-center relative min-h-[350px]">
        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
             <Activity className="w-4 h-4"/> 偏心受压演示
        </div>
        <svg width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet">
          <CommonDefs />

          {/* The Column - Transparent with Solid Border */}
          <rect 
              x={50} 
              y={topY} 
              width={beamW} 
              height={beamH} 
              fill="rgba(79, 70, 229, 0.05)" 
              stroke="#4f46e5" 
              strokeWidth="2" 
           />
          
          {/* Centerline (Dashed) */}
          <line x1={40} y1={cy} x2={400} y2={cy} stroke="#4f46e5" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.4" />
          
          {/* End Cap Lines (Reinforcement of border) */}
          <line x1={50} y1={topY} x2={50} y2={bottomY} stroke="#4f46e5" strokeWidth="2" />
          <line x1={50+beamW} y1={topY} x2={50+beamW} y2={bottomY} stroke="#4f46e5" strokeWidth="2" />

          {/* The Force (Rose) */}
          <line x1={350} y1={forceY} x2={300+10} y2={forceY} stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
          <circle cx={300} cy={forceY} r="3" fill="#e11d48" />
          <text x={355} y={forceY + 4} fill="#e11d48" fontWeight="bold" fontSize="12">F</text>
          
          {/* Eccentricity */}
          <line x1={320} y1={cy} x2={320} y2={forceY} stroke="#64748b" strokeWidth="1" />
          <line x1={315} y1={cy} x2={325} y2={cy} stroke="#64748b" />
          <line x1={315} y1={forceY} x2={325} y2={forceY} stroke="#64748b" />
          <text x={330} y={(cy + forceY)/2 + 4} fill="#64748b" fontSize="11">e</text>

          {/* Stress Profile Guide Line */}
          <line x1={profileX} y1={topY} x2={profileX} y2={bottomY} stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Stress Polygon Fill - Transparent */}
          <polygon 
            points={`${profileX},${topY} ${topStressX},${topY} ${bottomStressX},${bottomY} ${profileX},${bottomY}`} 
            fill={sigma_top_val < 0 ? "rgba(225, 29, 72, 0.1)" : "rgba(79, 70, 229, 0.1)"} 
            stroke="none"
           />
          
          {/* Stress Profile Outline - Solid */}
          <path d={`M ${topStressX},${topY} L ${bottomStressX},${bottomY}`} stroke={sigma_top_val < 0 && sigma_bottom < 0 ? "#e11d48" : "#4f46e5"} strokeWidth="2" fill="none" />
          <line x1={profileX} y1={topY} x2={topStressX} y2={topY} stroke="#4f46e5" strokeWidth="2" />
          <line x1={profileX} y1={bottomY} x2={bottomStressX} y2={bottomY} stroke="#4f46e5" strokeWidth="2" />

          {/* Values */}
          <text x={topStressX + (sigma_top_val > 0 ? 10 : -10)} y={topY - 5} fill="#4f46e5" textAnchor={sigma_top_val > 0 ? "start" : "end"} fontSize="11">
             σ_top = {sigma_top_val.toFixed(1)}
          </text>
          
           <text x={bottomStressX + 10} y={bottomY + 15} fill="#4f46e5" fontSize="11">
             σ_bot = {sigma_bottom.toFixed(1)}
          </text>

           <text x={profileX} y={topY - 30} textAnchor="middle" fontWeight="bold" fill="#334155" fontSize="12">应力分布 (Stress Profile)</text>
        </svg>
      </div>

      {/* MIDDLE: Parameters & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
           <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
               <Calculator className="w-4 h-4 text-indigo-500" /> 实验参数
           </h3>
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SliderControl label="截面宽度 (b)" value={state.combinedWidth} min={20} max={100} step={5} unit="mm" onChange={(v) => onChange({ combinedWidth: v })} />
                <SliderControl label="截面高度 (h)" value={state.combinedHeight} min={40} max={150} step={5} unit="mm" onChange={(v) => onChange({ combinedHeight: v })} />
              </div>
              <SliderControl label="偏心距 (e)" value={state.combinedEccentricity} min={0} max={100} step={5} unit="mm" onChange={(v) => onChange({ combinedEccentricity: v })} />
              <SliderControl label="轴向拉力 (F)" value={state.combinedLoad} min={1000} max={20000} step={1000} unit="N" onChange={(v) => onChange({ combinedLoad: v })} />
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
                  提示：如果偏心距 e 较大，M产生的弯曲应力可能超过轴向压应力，导致截面一侧出现拉应力（Rose色区域）。
              </div>
           </div>
        </div>
      </div>

      {/* BOTTOM: Calculation Process */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Sigma className="w-3 h-3 text-indigo-500" /> 计算过程演示
          </h4>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4 overflow-x-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div key="axial"><LatexRenderer formula={formulaAxial} /></div>
                <div key="moment"><LatexRenderer formula={formulaMoment} /></div>
                <div key="bending"><LatexRenderer formula={formulaBending} /></div>
                <div key="super"><LatexRenderer formula={formulaSuperposition} /></div>
             </div>
          </div>
      </div>
    </div>
  );
};