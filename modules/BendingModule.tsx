import React from "react";
import { Calculator, Sigma, Activity } from "lucide-react";
import { SliderInputControl, LatexRenderer, MaterialSelector, SectionSelector, calculateSectionProperties } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const BendingModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const L_mm = state.bendLength * 1000;
  const a_mm = state.bendLoadPos * 1000;
  const b_mm = L_mm - a_mm;
  const E_MPa = state.bendModulus * 1000;
  
  // 使用截面选择器计算惯性矩
  const sectionProps = calculateSectionProperties(state.bendSection);
  const inertia = sectionProps.Iz;
  const yMax = sectionProps.yMax; 
  
  // Reactions
  const R1 = (state.bendLoad * b_mm) / L_mm;
  const R2 = (state.bendLoad * a_mm) / L_mm;

  // Max Moment (at load point)
  const maxMoment = (state.bendLoad * (a_mm/1000) * (b_mm/1000)) / state.bendLength;
  
  // Deflection at load point (for display)
  const deflectionAtLoad = (state.bendLoad * Math.pow(a_mm, 2) * Math.pow(b_mm, 2)) / (3 * E_MPa * inertia * L_mm);
  
  const maxStress = ((maxMoment * 1000) * yMax) / inertia;

  // Strain Energy: U = ∫M²/(2EI)dx = P²a²b²/(6EIL)
  // Units: P in N, a,b,L in mm, E in MPa (N/mm²), I in mm⁴ → U in N·mm = mJ
  const strainEnergy = (Math.pow(state.bendLoad, 2) * Math.pow(a_mm, 2) * Math.pow(b_mm, 2)) / (6 * E_MPa * inertia * L_mm);
  // Max strain energy density: u_max = σ²/(2E)
  const maxStrainEnergyDensity = Math.pow(maxStress, 2) / (2 * E_MPa); // mJ/mm³

  const visualSag = Math.min(deflectionAtLoad * 2, 100); 
  const startX = 60;
  const endX = 540;
  const beamPixelWidth = endX - startX;
  
  // Map physical position to pixels
  const mapX = (pos_m: number) => startX + (pos_m / state.bendLength) * beamPixelWidth;
  
  const loadX = mapX(state.bendLoadPos);
  const floorY = 220;
  const supportHeight = 40;
  const baselineY = floorY - supportHeight; 
  
  const sagY = baselineY + visualSag;
  // Control point for quadratic curve? 
  // For asymmetric load, simple Q is not accurate.
  // We use two segments or just draw to the load point.
  // Visual Approximation: curve from start to load point (sagY), then to end.
  // Using simplified path for visual feedback.

  // 根据截面类型生成惯性矩公式
  const getInertiaFormula = () => {
    switch (state.bendSection.type) {
      case 'rectangle':
        return `I_z = \\frac{b h^3}{12} = \\frac{${state.bendSection.width || 100} \\times ${state.bendSection.height || 150}^3}{12} = ${(inertia/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      case 'circle':
        return `I_z = \\frac{\\pi r^4}{4} = \\frac{\\pi \\times ${state.bendSection.radius || 50}^4}{4} = ${(inertia/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      case 'hollow_circle':
        return `I_z = \\frac{\\pi (R^4 - r^4)}{4} = ${(inertia/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      case 'i_beam':
        return `I_z = \\frac{b_f h^3}{12} - \\frac{(b_f-t_w) h_w^3}{12} = ${(inertia/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
      default:
        return `I_z = ${(inertia/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
    }
  };
  const formulaInertia = getInertiaFormula();
  const formulaMoment = `M_{max} = \\frac{P \\cdot a \\cdot b}{L} = \\frac{${state.bendLoad} \\times ${(a_mm/1000).toFixed(1)} \\times ${(b_mm/1000).toFixed(1)}}{${state.bendLength}} = ${maxMoment.toFixed(1)} \\text{ Nm}`;
  const formulaDeflection = `w_{load} = \\frac{P a^2 b^2}{3 E I L} = \\frac{${state.bendLoad} \\times ${a_mm.toFixed(0)}^2 \\times ${b_mm.toFixed(0)}^2}{3 \\times ${E_MPa} \\times ${inertia.toFixed(0)} \\times ${L_mm.toFixed(0)}} = ${deflectionAtLoad.toFixed(2)} \\text{ mm}`;
  const formulaStress = `\\sigma_{max} = \\frac{M_{max} \\cdot y_{max}}{I_z} = \\frac{${(maxMoment*1000).toFixed(0)} \\times ${yMax.toFixed(0)}}{${inertia.toFixed(0)}} = ${maxStress.toFixed(2)} \\text{ MPa}`;
  const formulaStrainEnergy = `U = \\frac{P^2 a^2 b^2}{6 E I L} = \\frac{${state.bendLoad}^2 \\times ${a_mm.toFixed(0)}^2 \\times ${b_mm.toFixed(0)}^2}{6 \\times ${E_MPa} \\times ${inertia.toFixed(0)} \\times ${L_mm.toFixed(0)}} = ${strainEnergy.toFixed(2)} \\text{ mJ}`;

  const beamThick = Math.max(10, state.bendHeight / 5);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* TOP: Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative h-[320px]">
         <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
             <Activity className="w-4 h-4"/> 梁变形与内力图 (Deformation & Internal Forces)
         </div>
         <svg width="100%" height="100%" viewBox="0 0 600 550" preserveAspectRatio="xMidYMid meet">
            <CommonDefs />
            
            {/* --- 1. Physical Beam --- */}
            {/* Floor */}
            <line x1="20" y1={floorY} x2="580" y2={floorY} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            
            {/* Left Support */}
            <g transform={`translate(${startX}, ${floorY})`}>
                <path d={`M0,0 L-15,-${supportHeight} L15,-${supportHeight} Z`} fill="url(#hatchPattern)" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="0" cy={`-${supportHeight}`} r="4" fill="white" stroke="#94a3b8" strokeWidth="2"/>
                {/* Reaction Arrow */}
                <line x1="-25" y1="0" x2="-25" y2={`-${supportHeight}`} stroke="#4f46e5" strokeWidth="2" markerEnd="url(#arrowForce)" />
                <text x="-45" y="-15" fontSize="10" fill="#4f46e5">{Math.round(R1)} N</text>
            </g>
            
            {/* Right Support */}
            <g transform={`translate(${endX}, ${floorY})`}>
                 <path d={`M0,-8 L-15,-${supportHeight} L15,-${supportHeight} Z`} fill="url(#hatchPattern)" stroke="#94a3b8" strokeWidth="2" />
                 <circle cx="0" cy={`-${supportHeight}`} r="4" fill="white" stroke="#94a3b8" strokeWidth="2"/>
                 <circle cx="-8" cy="-4" r="3" fill="#cbd5e1" />
                 <circle cx="8" cy="-4" r="3" fill="#cbd5e1" />
                 {/* Reaction Arrow */}
                 <line x1="25" y1="0" x2="25" y2={`-${supportHeight}`} stroke="#4f46e5" strokeWidth="2" markerEnd="url(#arrowForce)" />
                 <text x="30" y="-15" fontSize="10" fill="#4f46e5">{Math.round(R2)} N</text>
            </g>

            {/* Original Beam (Dashed Outline) */}
            <path 
              d={`M ${startX},${baselineY} L ${endX},${baselineY}`} 
              stroke="#cbd5e1" 
              strokeWidth={beamThick} 
              strokeLinecap="butt" 
              fill="none"
              style={{ opacity: 0.5 }}
            />
             <path 
              d={`M ${startX},${baselineY} L ${endX},${baselineY}`} 
              stroke="#94a3b8" 
              strokeWidth="1" 
              strokeLinecap="butt" 
              strokeDasharray="4 4"
              fill="none"
            />

            {/* Deformed Beam (Transparent with Solid Outline Effect) */}
            {/* Main Body - Transparent Indigo */}
            {/* Approximation using two quadratic curves meeting at load point */}
            <path 
              d={`M ${startX},${baselineY} Q ${(startX+loadX)/2},${sagY} ${loadX},${sagY} Q ${(loadX+endX)/2},${sagY} ${endX},${baselineY}`} 
              stroke="rgba(79, 70, 229, 0.15)" 
              strokeWidth={beamThick} 
              fill="none" 
              strokeLinecap="butt" 
              style={{ transition: "d 0.3s ease-out, stroke-width 0.3s" }}
            />
             {/* Centerline - Solid Indigo Dashed */}
             <path 
              d={`M ${startX},${baselineY} Q ${(startX+loadX)/2},${sagY} ${loadX},${sagY} Q ${(loadX+endX)/2},${sagY} ${endX},${baselineY}`} 
              stroke="#4f46e5" 
              strokeOpacity="0.5"
              strokeWidth="1" 
              fill="none" 
              strokeDasharray="6 6"
              style={{ transition: "d 0.3s ease-out" }}
            />
            {/* Cap Ends (Approximate) */}
            <rect x={startX} y={baselineY - beamThick/2} width={2} height={beamThick} fill="#4f46e5" style={{ opacity: 0.5 }} />
            <rect x={endX-2} y={baselineY - beamThick/2} width={2} height={beamThick} fill="#4f46e5" style={{ opacity: 0.5 }} />

            {/* Force Arrow (Rose) */}
            <g transform={`translate(${loadX}, ${sagY - beamThick/2 - 2})`} style={{ transition: "transform 0.3s ease-out" }}>
                <line x1="0" y1="-60" x2="0" y2="-12" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                <text x="10" y="-35" fill="#e11d48" fontWeight="bold" fontSize="14">F = {state.bendLoad} N</text>
            </g>
            
            {/* Deflection Measurement (Indigo) */}
            <g style={{ opacity: visualSag > 5 ? 1 : 0, transition: "opacity 0.3s" }}>
                 <line x1={loadX} y1={baselineY} x2={loadX} y2={sagY} stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 2" />
                 <text x={loadX + 10} y={(baselineY+sagY)/2} fill="#4f46e5" fontSize="12" fontWeight="bold">w</text>
            </g>

            {/* --- Drop Lines --- */}
            <line x1={startX} y1={floorY + 10} x2={startX} y2={530} stroke="#e2e8f0" strokeDasharray="4 2" />
            <line x1={loadX} y1={floorY + 10} x2={loadX} y2={530} stroke="#e2e8f0" strokeDasharray="4 2" />
            <line x1={endX} y1={floorY + 10} x2={endX} y2={530} stroke="#e2e8f0" strokeDasharray="4 2" />

            {/* --- 2. Shear Force Diagram (SFD) --- */}
            <g transform="translate(0, 320)">
                <line x1="20" y1="0" x2="580" y2="0" stroke="#94a3b8" strokeWidth="1" />
                <text x="20" y="-5" fontSize="12" fill="#64748b" fontWeight="bold">F_s (V)</text>
                
                {/* Left Positive Shear (+R1) */}
                <rect x={startX} y="-40" width={loadX - startX} height="40" fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" />
                <text x={startX + 10} y="-20" fontSize="11" fill="#4f46e5">+{Math.round(R1)}</text>
                <text x={startX + 10} y="-5" fontSize="9" fill="#4f46e5" opacity="0.7">SFD</text>

                {/* Right Negative Shear (-R2) */}
                {/* Scale height? For simplicity keeping consistent height but could scale */}
                <rect x={loadX} y="0" width={endX - loadX} height="40" fill="rgba(225, 29, 72, 0.1)" stroke="#e11d48" />
                <text x={endX - 50} y="25" fontSize="11" fill="#e11d48">-{Math.round(R2)}</text>
            </g>

            {/* --- 3. Bending Moment Diagram (BMD) --- */}
            <g transform="translate(0, 450)">
                <line x1="20" y1="0" x2="580" y2="0" stroke="#94a3b8" strokeWidth="1" />
                <text x="20" y="-5" fontSize="12" fill="#64748b" fontWeight="bold">M</text>
                
                {/* Triangle (Positive Downwards) */}
                <path d={`M ${startX},0 L ${loadX},60 L ${endX},0 Z`} fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" />
                
                <line x1={loadX} y1="0" x2={loadX} y2="60" stroke="#4f46e5" strokeDasharray="2 2" />
                <text x={loadX + 10} y="30" fontSize="11" fill="#4f46e5" fontWeight="bold">{maxMoment.toFixed(0)} Nm</text>
                <text x={startX + 10} y="-5" fontSize="9" fill="#4f46e5" opacity="0.7">BMD</text>
            </g>

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
                  currentE={state.bendModulus} 
                  currentYield={state.materialYield}
                  currentPoisson={state.poissonRatio}
                  onSelect={(mat) => onChange({ bendModulus: mat.E, materialYield: mat.yield, poissonRatio: mat.poisson })} 
                />
                <SectionSelector
                  section={state.bendSection}
                  onChange={(s) => onChange({ bendSection: s })}
                />
                <SliderInputControl label="载荷 (Load)" value={state.bendLoad} min={100} max={50000} step={100} unit="N" onChange={(v) => onChange({ bendLoad: v })} />
                <div className="grid grid-cols-2 gap-4">
                    <SliderInputControl label="梁跨度 (Length)" value={state.bendLength} min={0.1} max={20} step={0.1} unit="m" onChange={(v) => onChange({ bendLength: v })} />
                    <SliderInputControl label="载荷位置 (a)" value={state.bendLoadPos} min={0.01} max={state.bendLength - 0.01} step={0.01} unit="m" onChange={(v) => onChange({ bendLoadPos: Math.min(v, state.bendLength - 0.01) })} />
                </div>
                <SliderInputControl label="弹性模量 (E)" value={state.bendModulus} min={1} max={500} step={1} unit="GPa" onChange={(v) => onChange({ bendModulus: v })} />
           </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
           <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
             <Sigma className="w-4 h-4 text-indigo-500" /> 结果分析
           </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">截面惯性矩 (I_z)</span>
              <span className="font-mono font-bold text-slate-700">{(inertia/10000).toFixed(1)} cm⁴</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">加载点挠度 (w_load)</span>
              <span className="font-mono font-bold text-indigo-600">{deflectionAtLoad.toFixed(2)} mm</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大弯矩 (M_max)</span>
              <span className="font-mono font-bold text-slate-600">{maxMoment.toFixed(0)} Nm</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大正应力 (σ_max)</span>
              <span className="font-mono font-bold text-rose-600">{maxStress.toFixed(1)} MPa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">弯曲应变能 (U)</span>
              <span className="font-mono font-bold text-emerald-600">{strainEnergy.toFixed(2)} mJ</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大应变能密度 (u_max)</span>
              <span className="font-mono font-bold text-emerald-600">{(maxStrainEnergyDensity * 1000).toFixed(4)} μJ/mm³</span>
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
            <div className="text-xs text-slate-500 mb-1">① 截面惯性矩 (Moment of Inertia)</div>
            <LatexRenderer formula={formulaInertia} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">② 最大弯矩 (Maximum Moment)</div>
            <LatexRenderer formula={formulaMoment} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">③ 加载点挠度 (Deflection at Load)</div>
            <LatexRenderer formula={formulaDeflection} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">④ 最大弯曲正应力 (Maximum Bending Stress)</div>
            <LatexRenderer formula={formulaStress} />
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">⑤ 弯曲应变能 (Bending Strain Energy)</div>
            <LatexRenderer formula={formulaStrainEnergy} />
          </div>
        </div>
      </div>
    </div>
  );
};