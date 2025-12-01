import React, { useState } from "react";
import { Calculator, Sigma, Activity, Rotate3d } from "lucide-react";
import { SliderControl, LatexRenderer, MaterialSelector } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const AxialModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const stress = state.axialForce / state.axialArea; 
  const E_MPa = state.bendModulus * 1000; 
  const yieldStrength = state.materialYield;
  
  let strain = 0;
  let isPlastic = false;
  let isFailure = false;
  
  const strainAtYield = yieldStrength / E_MPa;
  const utsStrength = yieldStrength * 1.5; 
  const failureStrength = yieldStrength * 1.4; 
  const strainAtUTS = strainAtYield * 10; 
  const strainAtFailure = strainAtYield * 15;

  if (stress <= yieldStrength) {
      strain = stress / E_MPa;
  } else {
      isPlastic = true;
      if (stress > utsStrength) {
         isFailure = true;
         strain = strainAtFailure; 
      } else {
         const ratio = (stress - yieldStrength) / (utsStrength - yieldStrength);
         strain = strainAtYield + (strainAtUTS - strainAtYield) * Math.pow(ratio, 2); 
      }
  }
  
  const deformation = strain * state.axialLength * 1000; 
  const originalLength = state.axialLength * 1000; 

  const visualDeformation = Math.min(deformation * 100, 150); 
  
  // Color Logic for Transparent/Solid
  let strokeColor = "#4f46e5"; // Indigo
  let fillColor = "rgba(79, 70, 229, 0.1)";

  if (isFailure) {
    strokeColor = "#e11d48"; // Rose
    fillColor = "rgba(225, 29, 72, 0.1)";
  } else if (isPlastic) {
    strokeColor = "#f59e0b"; // Amber
    fillColor = "rgba(245, 158, 11, 0.1)";
  }

  const baseWidth = 200;
  const currentWidth = baseWidth + visualDeformation;
  
  const gx = (val: number) => 40 + (val / strainAtFailure) * 240; 
  const gy = (val: number) => 170 - (val / utsStrength) * 140;    

  const pOrigin = "40,170";
  const pYield = `${gx(strainAtYield)},${gy(yieldStrength)}`;
  const pUTS = `${gx(strainAtUTS)},${gy(utsStrength)}`;
  const pFail = `${gx(strainAtFailure)},${gy(failureStrength)}`;
  
  const curvePath = `M ${pOrigin} L ${pYield} Q ${gx((strainAtYield+strainAtUTS)/2)},${gy(utsStrength)} ${pUTS} L ${pFail}`;
  
  const dotX = gx(strain);
  const dotY = gy(Math.min(stress, utsStrength)); 

  const formulaStress = `\\sigma = \\frac{F}{A} = \\frac{${state.axialForce}}{${state.axialArea}} = ${stress.toFixed(1)} \\text{ MPa}`;
  const formulaHooke = `\\varepsilon = \\frac{\\sigma}{E} = \\frac{${stress.toFixed(1)}}{${E_MPa}} = ${(strain*100).toFixed(4)} \\% `;
  const formulaDeformation = `\\Delta L = \\varepsilon \\cdot L = ${(strain*100).toFixed(4)}\\% \\times ${(state.axialLength*1000).toFixed(0)} = ${deformation.toFixed(3)} \\text{ mm}`;
  const formulaPlastic = `\\sigma = ${stress.toFixed(1)} > \\sigma_{yield} = ${yieldStrength} \\text{ MPa} \\rightarrow \\text{塑性变形!}`;

  const barHeight = Math.sqrt(state.axialArea) * 4;

  // --- Oblique Section State ---
  const [obliqueAngle, setObliqueAngle] = useState(30); // degrees
  const alphaRad = (obliqueAngle * Math.PI) / 180;
  const sigmaAlpha = stress * Math.pow(Math.cos(alphaRad), 2);
  const tauAlpha = (stress / 2) * Math.sin(2 * alphaRad);
  
  // Oblique Visual Constants
  const oblW = 200;
  const oblH = 80;
  const oblCx = 150;
  const oblCy = 100;
  // Calculate polygon points for the left part of the cut bar
  // Cut line passes through center. 
  // x = y * tan(alpha) relative to center? 
  // Let's define alpha as angle between section normal and axis.
  // Then the section plane is at (90 - alpha) to the axis.
  // Actually, standard text: alpha is angle between normal (n) and axis (x).
  // So the cut plane is rotated by alpha from the vertical.
  const cutDx = (oblH / 2) * Math.tan(alphaRad);
  
  const polyPoints = `
    ${oblCx - oblW/2},${oblCy - oblH/2} 
    ${oblCx + cutDx},${oblCy - oblH/2} 
    ${oblCx - cutDx},${oblCy + oblH/2} 
    ${oblCx - oblW/2},${oblCy + oblH/2}
  `;

  const formulaSigAlpha = `\\sigma_{\\alpha} = \\sigma \\cos^2 \\alpha = ${stress.toFixed(1)} \\cdot \\cos^2(${obliqueAngle}^\\circ) = ${sigmaAlpha.toFixed(1)} \\text{ MPa}`;
  const formulaTauAlpha = `\\tau_{\\alpha} = \\frac{\\sigma}{2} \\sin 2\\alpha = \\frac{${stress.toFixed(1)}}{2} \\sin(${2*obliqueAngle}^\\circ) = ${tauAlpha.toFixed(1)} \\text{ MPa}`;

  // --- Strain Energy Calculations ---
  // Strain Energy Density u = sigma^2 / 2E  (MPa * MPa / MPa = MPa = MJ/m^3)
  // 1 MPa = 10^6 Pa = 10^6 J/m^3 = 1000 kJ/m^3
  const strainEnergyDensity = (stress * stress) / (2 * E_MPa); // MPa
  const strainEnergyDensityKJ = strainEnergyDensity * 1000; // kJ/m^3
  
  // Total Strain Energy U = u * Volume = (sigma^2 / 2E) * (Area * Length)
  // Or U = 1/2 * P * deltaL (Elastic assumption)
  // Volume in m^3 = (Area mm^2 * 10^-6) * Length m
  const volumeM3 = (state.axialArea * 1e-6) * state.axialLength;
  const totalStrainEnergyJ = strainEnergyDensity * 1e6 * volumeM3; // Pa * m^3 = Joules

  const formulaStrainEnergy = `U = \\frac{P^2 L}{2 E A} = \\frac{${state.axialForce}^2 \\cdot ${(state.axialLength*1000).toFixed(0)}}{2 \\cdot ${E_MPa} \\cdot ${state.axialArea}} = ${totalStrainEnergyJ.toFixed(2)} \\text{ J}`;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* TOP: Visualization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Visualizer */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative overflow-hidden h-[320px]">
             <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                 <Activity className="w-4 h-4"/> 试件变形演示
             </div>
             <svg width="100%" height="100%" viewBox="0 0 400 200" className="z-10">
                <CommonDefs />
                
                {/* Wall Fixed Support */}
                <rect x="10" y="20" width="20" height="160" fill="url(#hatchPattern)" stroke="#64748b" strokeWidth="2" />
                <line x1="30" y1="20" x2="30" y2="180" stroke="#64748b" strokeWidth="2" />
                
                {/* Bar Specimen */}
                <g>
                    {/* Fixed part (reference) */}
                     <rect
                        x="30"
                        y={100 - barHeight/2}
                        width={10}
                        height={barHeight}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                    />
                    {/* Main Bar */}
                    <rect 
                        x="40" 
                        y={100 - barHeight/2} 
                        width={currentWidth} 
                        height={barHeight} 
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                        style={{ transition: "width 0.1s linear, fill 0.3s, stroke 0.3s" }}
                    />
                     {/* Centerline */}
                     <line x1="30" y1="100" x2={40 + currentWidth} y2="100" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
                     
                     {/* Measuring Points */}
                     <line x1={40} y1={100 - barHeight/2} x2={40} y2={100 + barHeight/2} stroke={strokeColor} strokeOpacity="0.5" />
                     <line x1={40 + currentWidth} y1={100 - barHeight/2} x2={40 + currentWidth} y2={100 + barHeight/2} stroke={strokeColor} strokeOpacity="0.5" />
                </g>

                {/* Force Arrow (Rose) */}
                <g transform={`translate(${40 + currentWidth}, 100)`} style={{ transition: "transform 0.1s linear" }}>
                    <line x1="0" y1="0" x2="60" y2="0" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                    <text x="5" y="-10" fill="#e11d48" fontWeight="bold">F = {state.axialForce} N</text>
                </g>

                {/* Dimensions */}
                <g transform="translate(0, 160)">
                    <line x1="40" y1="0" x2={40} y2="20" stroke="#94a3b8" />
                    <line x1={40 + currentWidth} y1="0" x2={40 + currentWidth} y2="20" stroke="#94a3b8" />
                    <line x1="40" y1="10" x2={40 + currentWidth} y2="10" stroke="#94a3b8" markerEnd="url(#arrowDim)" />
                    <text x={40 + currentWidth/2} y="25" fill="#64748b" fontSize="12" textAnchor="middle">L + ΔL</text>
                </g>
             </svg>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative h-[320px]">
             <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                 <Sigma className="w-4 h-4"/> 应力-应变曲线
             </div>
             <svg width="100%" height="100%" viewBox="0 0 300 200">
                {/* Grid */}
                <path d="M40,30 L40,170 L280,170" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                
                {/* Curve */}
                <path d={curvePath} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
                <path d={curvePath} fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

                {/* Current Point */}
                <circle cx={dotX} cy={dotY} r="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" className="shadow-sm" />
                
                {/* Drop lines */}
                <line x1={dotX} y1={dotY} x2={dotX} y2="170" stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />
                <line x1={dotX} y1={dotY} x2="40" y2={dotY} stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" />

                <text x="280" y="185" fontSize="12" fill="#64748b" textAnchor="end">Strain (ε)</text>
                <text x="30" y="25" fontSize="12" fill="#64748b">Stress (σ)</text>
             </svg>
          </div>
      </div>

      {/* MIDDLE: Parameters & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Experimental Parameters */}
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
               <SliderControl label="轴向拉力 (Force)" value={state.axialForce} min={1000} max={50000} step={1000} unit="N" onChange={(v) => onChange({ axialForce: v })} />
               <SliderControl label="横截面积 (Area)" value={state.axialArea} min={10} max={500} step={10} unit="mm²" onChange={(v) => onChange({ axialArea: v })} />
               <SliderControl label="原长 (Length)" value={state.axialLength} min={0.1} max={5.0} step={0.1} unit="m" onChange={(v) => onChange({ axialLength: v })} />
           </div>
        </div>
        
        {/* Right: Results Analysis */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Sigma className="w-4 h-4 text-indigo-500" /> 结果分析
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                  <span className="text-sm text-slate-600">当前应力 (Stress)</span>
                  <span className={`font-mono font-bold text-lg ${isPlastic ? 'text-rose-600' : 'text-indigo-600'}`}>{stress.toFixed(1)} MPa</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                  <span className="text-sm text-slate-600">当前应变 (Strain)</span>
                  <span className="font-mono font-bold text-slate-700">{(strain*100).toFixed(3)} %</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                  <span className="text-sm text-slate-600">总伸长量 (ΔL)</span>
                  <span className="font-mono font-bold text-slate-700">{deformation.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                  <span className="text-sm text-slate-600">原始长度 (L0)</span>
                  <span className="font-mono font-bold text-slate-500">{originalLength.toFixed(0)} mm</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
                  <span className="text-sm text-slate-600">弹性应变能 (U)</span>
                  <div className="text-right">
                      <span className="font-mono font-bold text-indigo-600 block">{totalStrainEnergyJ.toFixed(2)} J</span>
                      <span className="text-xs text-slate-400">({strainEnergyDensityKJ.toFixed(0)} kJ/m³)</span>
                  </div>
                </div>
                
                <div className={`mt-4 p-3 rounded text-sm font-bold text-center transition-colors ${isFailure ? "bg-rose-100 text-rose-700" : (isPlastic ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}`}>
                    {isFailure ? "结构断裂 (Fracture)" : (isPlastic ? "塑性屈服 (Yielding)" : "弹性状态 (Elastic)")}
                </div>
            </div>
        </div>
      </div>

      {/* NEW: Oblique Section Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
             <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                 <Rotate3d className="w-4 h-4 text-indigo-500" /> 斜截面应力分析 (Oblique Section)
             </h3>
             <div className="flex flex-col items-center">
                  <div className="w-full h-[200px] flex items-center justify-center border border-slate-100 rounded mb-4 bg-slate-50 relative">
                      <svg width="300" height="200" viewBox="0 0 300 200">
                          <defs>
                              <marker id="arrowN" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#e11d48" />
                              </marker>
                              <marker id="arrowV" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#4f46e5" />
                              </marker>
                          </defs>
                          
                          {/* Left part of the bar */}
                          <polygon points={polyPoints} fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" />
                          
                          {/* Cut Face Line */}
                          <line 
                            x1={oblCx + cutDx} y1={oblCy - oblH/2} 
                            x2={oblCx - cutDx} y2={oblCy + oblH/2} 
                            stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 2"
                          />

                          {/* Normal Vector n (Perpendicular to cut) */}
                          {/* Angle of normal is alpha. So vector is (cos alpha, -sin alpha) if y is up. 
                              Here y is down. Cut line angle with vertical is alpha. 
                              Normal angle with horizontal is alpha.
                              Vector: (cos alpha, sin alpha) ? 
                              Let's check: alpha=0 -> horizontal vector (1,0). Correct.
                              alpha=45 -> (0.7, 0.7). Down-right.
                          */}
                          <line 
                             x1={oblCx} y1={oblCy} 
                             x2={oblCx + 60 * Math.cos(alphaRad)} 
                             y2={oblCy - 60 * Math.sin(alphaRad)} 
                             stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowDim)"
                          />
                          <text x={oblCx + 70 * Math.cos(alphaRad)} y={oblCy - 70 * Math.sin(alphaRad)} fontSize="10" fill="#94a3b8">n</text>

                          {/* Stress Vectors on the face */}
                          {/* Sigma (Normal) - Along n */}
                          <g transform={`translate(${oblCx}, ${oblCy}) rotate(${-obliqueAngle})`}>
                               <line x1="0" y1="0" x2={Math.min(sigmaAlpha*1.5, 80)} y2="0" stroke="#e11d48" strokeWidth="3" markerEnd="url(#arrowN)" />
                               <text x={Math.min(sigmaAlpha*1.5, 80) + 10} y="4" fill="#e11d48" fontSize="12" fontWeight="bold">σ_α</text>
                          </g>

                          {/* Tau (Shear) - Along the cut face */}
                          {/* Cut face direction is -90 deg from n. */}
                           <g transform={`translate(${oblCx}, ${oblCy}) rotate(${-obliqueAngle + 90})`}>
                               <line x1="0" y1="0" x2={Math.min(Math.abs(tauAlpha)*3, 80)} y2="0" stroke="#4f46e5" strokeWidth="3" markerEnd="url(#arrowV)" />
                               <text x={Math.min(Math.abs(tauAlpha)*3, 80) + 10} y="4" fill="#4f46e5" fontSize="12" fontWeight="bold">τ_α</text>
                          </g>
                          
                          {/* Angle Arc */}
                          <path d={`M ${oblCx+30},${oblCy} A 30,30 0 0,0 ${oblCx + 30*Math.cos(-alphaRad)},${oblCy + 30*Math.sin(-alphaRad)}`} fill="none" stroke="#94a3b8" />
                          <text x={oblCx + 40} y={oblCy - 10} fontSize="10" fill="#94a3b8">α</text>
                      </svg>
                  </div>
                  <div className="w-full px-4">
                      <SliderControl label="截面角度 α (Angle)" value={obliqueAngle} min={-60} max={60} step={1} unit="°" onChange={setObliqueAngle} />
                  </div>
             </div>
         </div>
         
         <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full flex flex-col justify-center">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Sigma className="w-4 h-4 text-indigo-500" /> 计算结果
            </h3>
            <div className="space-y-4">
                <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">正应力 (Normal Stress)</div>
                    <div className="overflow-x-auto pb-2">
                        <LatexRenderer formula={formulaSigAlpha} />
                    </div>
                </div>
                 <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">切应力 (Shear Stress)</div>
                    <div className="overflow-x-auto pb-2">
                        <LatexRenderer formula={formulaTauAlpha} />
                    </div>
                </div>
                <div className="text-xs text-slate-500 bg-indigo-50 p-3 rounded border border-indigo-100">
                    <strong>规律总结：</strong><br/>
                    • α = 0° 时，正应力最大 (σ_max = σ)，切应力为 0。<br/>
                    • α = 45° 时，切应力达到最大值 (τ_max = σ/2)。<br/>
                    • α = 90° 时，正应力和切应力均为 0。
                </div>
            </div>
         </div>
      </div>

      {/* BOTTOM: Calculation Process */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Sigma className="w-4 h-4 text-indigo-500" /> 计算过程演示
         </h4>
         <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4 overflow-x-auto">
            <div className="space-y-3">
                <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">① 应力计算 (Stress)</div>
                    <LatexRenderer formula={formulaStress} />
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">② 应变计算 (Strain) - 胡克定律</div>
                    {isPlastic ? (
                        <LatexRenderer formula={formulaPlastic} />
                    ) : (
                        <LatexRenderer formula={formulaHooke} />
                    )}
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">③ 变形量计算 (Deformation)</div>
                    <LatexRenderer formula={formulaDeformation} />
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">④ 应变能计算 (Strain Energy)</div>
                    <LatexRenderer formula={formulaStrainEnergy} />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};