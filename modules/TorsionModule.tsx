import React, { useState } from "react";
import { Calculator, Sigma, Activity } from "lucide-react";
import { SliderControl, LatexRenderer, MaterialSelector } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const TorsionModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  // Local state for load distribution (Ratio of Torque at Gear B vs Total Input)
  const [loadRatio, setLoadRatio] = useState(0.6); 

  const Ip = (Math.PI * Math.pow(state.torqRadius, 4)) / 2;
  
  // Transmission Shaft Model
  // Gear A (Left, Input): T_in = state.torqTorque
  // Gear B (Middle, Output 1): T_out1 = loadRatio * T_in
  // Gear C (Right, Output 2): T_out2 = (1 - loadRatio) * T_in
  // Internal Torque:
  // Section AB: T_1 = T_in
  // Section BC: T_2 = T_in - T_out1 = T_out2
  
  const T_in_Nm = state.torqTorque;
  const T_out1_Nm = T_in_Nm * loadRatio;
  const T_out2_Nm = T_in_Nm * (1 - loadRatio);
  
  const T_AB_Nm = T_in_Nm;
  const T_BC_Nm = T_out2_Nm;
  
  // Max Shear Stress (Always in Section AB as T_AB > T_BC)
  const maxShear = (T_AB_Nm * 1000 * state.torqRadius) / Ip;
  const G_MPa = state.torqModulus * 1000;
  
  // Twist Angles
  // Lengths assumed: L_AB = 0.5 * L, L_BC = 0.5 * L
  const L_total_mm = state.torqLength * 1000;
  const L_AB_mm = L_total_mm * 0.5;
  const L_BC_mm = L_total_mm * 0.5;
  
  const phi_AB_rad = (T_AB_Nm * 1000 * L_AB_mm) / (G_MPa * Ip);
  const phi_BC_rad = (T_BC_Nm * 1000 * L_BC_mm) / (G_MPa * Ip);
  
  const phi_total_rad = phi_AB_rad + phi_BC_rad;
  const phi_total_deg = phi_total_rad * (180 / Math.PI);

  const formulaIp = `I_p = \\frac{\\pi r^4}{2} = \\frac{\\pi \\times ${state.torqRadius}^4}{2} = ${(Ip/10000).toFixed(2)} \\times 10^4 \\text{ mm}^4`;
  const formulaShear = `\\tau_{max} = \\frac{T_{AB} \\cdot r}{I_p} = \\frac{${T_AB_Nm} \\times 10^3 \\times ${state.torqRadius}}{${Ip.toFixed(0)}} = ${maxShear.toFixed(2)} \\text{ MPa}`;
  const formulaAngleAB = `\\varphi_{AB} = \\frac{T_{AB} \\cdot L_{AB}}{G \\cdot I_p} = \\frac{${T_AB_Nm} \\times 10^3 \\times ${L_AB_mm.toFixed(0)}}{${G_MPa} \\times ${Ip.toFixed(0)}} = ${(phi_AB_rad * 180 / Math.PI).toFixed(3)}^\\circ`;
  const formulaAngleBC = `\\varphi_{BC} = \\frac{T_{BC} \\cdot L_{BC}}{G \\cdot I_p} = \\frac{${T_BC_Nm.toFixed(0)} \\times 10^3 \\times ${L_BC_mm.toFixed(0)}}{${G_MPa} \\times ${Ip.toFixed(0)}} = ${(phi_BC_rad * 180 / Math.PI).toFixed(3)}^\\circ`;
  const formulaAngle = `\\varphi_{total} = \\varphi_{AB} + \\varphi_{BC} = ${(phi_AB_rad * 180 / Math.PI).toFixed(3)}^\\circ + ${(phi_BC_rad * 180 / Math.PI).toFixed(3)}^\\circ = ${phi_total_deg.toFixed(2)}^\\circ`;

  // --- Strain Energy Calculations ---
  // Stiffness GIp in Nm^2
  // G in GPa = 10^9 Pa, Ip in mm^4 = 10^-12 m^4
  // GIp = (G * 1e9) * (Ip * 1e-12) = G * Ip * 1e-3
  const stiffnessGIp = state.torqModulus * Ip * 0.001; 
  
  // U = T^2 * L / (2 * G * Ip)
  // L_AB_mm to meters -> L_AB_mm / 1000
  const U_AB_J = (Math.pow(T_AB_Nm, 2) * (L_AB_mm / 1000)) / (2 * stiffnessGIp);
  const U_BC_J = (Math.pow(T_BC_Nm, 2) * (L_BC_mm / 1000)) / (2 * stiffnessGIp);
  const U_total_J = U_AB_J + U_BC_J;
  
  // Strain Energy Density u_max = tau_max^2 / 2G
  // tau in MPa, G in MPa
  // Result in MJ/m^3 = 1000 kJ/m^3
  const u_max_density = (Math.pow(maxShear, 2) / (2 * state.torqModulus * 1000)) * 1000; // kJ/m^3

  const formulaEnergy = `U = \\sum \\frac{T_i^2 L_i}{2 G I_p} = \\frac{${T_AB_Nm}^2 \\times ${(L_AB_mm/1000).toFixed(2)}}{2 \\times ${stiffnessGIp.toFixed(1)}} + \\frac{${T_BC_Nm.toFixed(0)}^2 \\times ${(L_BC_mm/1000).toFixed(2)}}{2 \\times ${stiffnessGIp.toFixed(1)}} = ${U_total_J.toFixed(2)} \\text{ J}`;

  // Visualization Constants
  const shaftY = 100;
  const diagramY = 220;
  const diagramH = 80;
  const scaleX = 500 / 100; // map 0-100 to 0-500 width
  const maxT_display = 2500; // Scale factor for diagram height

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* TOP: Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative h-[320px]">
        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
             <Activity className="w-4 h-4"/> 传动轴扭矩图演示 (Transmission Shaft)
        </div>
        <svg width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet">
            <CommonDefs />
            <defs>
                {/* Gradient for shaft */}
                <linearGradient id="shaftGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="50%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
            </defs>
            
            {/* --- 1. Physical Model --- */}
            {/* Shaft */}
            <rect x="50" y={shaftY - 10} width="500" height="20" fill="url(#shaftGrad)" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Gear A (Input) at x=50 */}
            <g transform={`translate(50, ${shaftY})`}>
                 <ellipse cx="0" cy="0" rx="10" ry="40" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                 <ellipse cx="4" cy="0" rx="10" ry="40" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
                 {/* Torque Arrow CCW */}
                 <path d="M -20,30 A 40,40 0 0,1 -20,-30" fill="none" stroke="#e11d48" strokeWidth="3" markerEnd="url(#arrowForce)" />
                 <text x="-60" y="-40" fill="#e11d48" fontWeight="bold" fontSize="12">T_in</text>
            </g>

            {/* Gear B (Output 1) at x=300 (50%) */}
            <g transform={`translate(300, ${shaftY})`}>
                 <ellipse cx="0" cy="0" rx="8" ry="30" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                 <ellipse cx="4" cy="0" rx="8" ry="30" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
                 {/* Torque Arrow CW (Opposite to Input) */}
                 <path d="M 20,-25 A 30,30 0 0,1 20,25" fill="none" stroke="#4f46e5" strokeWidth="3" markerEnd="url(#arrowForce)" />
                 <text x="10" y="45" fill="#4f46e5" fontWeight="bold" fontSize="12">T_out1</text>
            </g>

            {/* Gear C (Output 2) at x=550 (100%) */}
            <g transform={`translate(550, ${shaftY})`}>
                 <ellipse cx="0" cy="0" rx="8" ry="30" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                 <ellipse cx="4" cy="0" rx="8" ry="30" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
                 {/* Torque Arrow CW */}
                 <path d="M 20,-25 A 30,30 0 0,1 20,25" fill="none" stroke="#4f46e5" strokeWidth="3" markerEnd="url(#arrowForce)" />
                 <text x="10" y="45" fill="#4f46e5" fontWeight="bold" fontSize="12">T_out2</text>
            </g>

            {/* Labels A, B, C */}
            <text x="50" y={shaftY - 50} fill="#64748b" fontWeight="bold">A</text>
            <text x="300" y={shaftY - 50} fill="#64748b" fontWeight="bold">B</text>
            <text x="550" y={shaftY - 50} fill="#64748b" fontWeight="bold">C</text>


            {/* --- 2. Torque Diagram (T-Plot) --- */}
            <line x1="50" y1={diagramY} x2="550" y2={diagramY} stroke="#94a3b8" strokeWidth="1" />
            <text x="20" y={diagramY} fontSize="12" fill="#64748b" dominantBaseline="middle">T</text>
            
            {/* Section AB: Torque = T_in */}
            {/* Height scaled. Max height for 2000Nm is say 60px */}
            <rect 
                x="50" 
                y={diagramY - (T_AB_Nm / maxT_display) * diagramH} 
                width="250" 
                height={(T_AB_Nm / maxT_display) * diagramH} 
                fill="rgba(225, 29, 72, 0.1)" 
                stroke="#e11d48" 
                strokeWidth="2" 
            />
            <text x="175" y={diagramY - (T_AB_Nm / maxT_display) * diagramH - 5} fill="#e11d48" fontSize="12" textAnchor="middle" fontWeight="bold">
                {Math.round(T_AB_Nm)} Nm (+)
            </text>
            <g transform={`translate(175, ${diagramY + 15})`}>
                <circle cx="0" cy="0" r="8" fill="white" stroke="#64748b" />
                <text x="0" y="0" fontSize="10" textAnchor="middle" dominantBaseline="middle" fill="#64748b">+</text>
            </g>

            {/* Section BC: Torque = T_out2 */}
            <rect 
                x="300" 
                y={diagramY - (T_BC_Nm / maxT_display) * diagramH} 
                width="250" 
                height={(T_BC_Nm / maxT_display) * diagramH} 
                fill="rgba(225, 29, 72, 0.1)" 
                stroke="#e11d48" 
                strokeWidth="2" 
            />
            <text x="425" y={diagramY - (T_BC_Nm / maxT_display) * diagramH - 5} fill="#e11d48" fontSize="12" textAnchor="middle" fontWeight="bold">
                {Math.round(T_BC_Nm)} Nm (+)
            </text>
            <g transform={`translate(425, ${diagramY + 15})`}>
                <circle cx="0" cy="0" r="8" fill="white" stroke="#64748b" />
                <text x="0" y="0" fontSize="10" textAnchor="middle" dominantBaseline="middle" fill="#64748b">+</text>
            </g>
            
            {/* Drop Lines */}
            <line x1="50" y1={shaftY + 20} x2="50" y2={diagramY + 20} stroke="#cbd5e1" strokeDasharray="4 2" />
            <line x1="300" y1={shaftY + 20} x2="300" y2={diagramY + 20} stroke="#cbd5e1" strokeDasharray="4 2" />
            <line x1="550" y1={shaftY + 20} x2="550" y2={diagramY + 20} stroke="#cbd5e1" strokeDasharray="4 2" />

            <text x="300" y={340} fontSize="12" fill="#64748b" textAnchor="middle" fontWeight="bold">扭矩图 (Torque Diagram)</text>
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
                    currentG={state.torqModulus} 
                    onSelect={(mat) => onChange({ torqModulus: mat.G })} 
                  />
                  <SliderControl label="输入扭矩 T_in" value={state.torqTorque} min={100} max={2000} step={50} unit="Nm" onChange={(v) => onChange({ torqTorque: v })} />
                  <div className="pt-2 pb-2">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">负载分配 (Load Ratio B:C)</span>
                        <span className="font-bold text-indigo-600">{Math.round(loadRatio*100)} : {Math.round((1-loadRatio)*100)}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="0.9" step="0.1" 
                        value={loadRatio} onChange={(e) => setLoadRatio(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <SliderControl label="轴半径 (r)" value={state.torqRadius} min={10} max={50} step={1} unit="mm" onChange={(v) => onChange({ torqRadius: v })} />
                      <SliderControl label="总轴长 (L)" value={state.torqLength} min={0.5} max={3.0} step={0.1} unit="m" onChange={(v) => onChange({ torqLength: v })} />
                  </div>
            </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Sigma className="w-4 h-4 text-indigo-500" /> 结果分析 (Results)
            </h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">最大切应力 (τ_max @ AB)</span>
              <span className="font-mono font-bold text-indigo-600">
                {maxShear.toFixed(2)} MPa
              </span>
            </div>
             <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">B端转角 (φ_B)</span>
              <span className="font-mono font-bold text-slate-700">{(phi_AB_rad * 180 / Math.PI).toFixed(2)}°</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">C端总转角 (φ_C)</span>
              <span className="font-mono font-bold text-rose-600">
                {phi_total_deg.toFixed(2)}°
              </span>
            </div>
             <div className="flex justify-between items-center p-3 bg-white rounded border border-slate-200">
              <span className="text-sm text-slate-600">应变能 (U)</span>
              <div className="text-right">
                  <span className="font-mono font-bold text-indigo-600 block">{U_total_J.toFixed(2)} J</span>
                  <span className="text-xs text-slate-400">Max u: {u_max_density.toFixed(0)} kJ/m³</span>
              </div>
            </div>
            <div className="mt-2 p-2 bg-indigo-50 rounded text-xs text-slate-500 leading-relaxed border border-indigo-100">
                 说明：传动轴由A端输入扭矩，经B、C两端输出。扭矩图显示了轴各段内部的扭矩大小，这对于确定轴的危险截面至关重要。在此例中，AB段承受最大扭矩。
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
              <div className="text-xs text-slate-500 mb-1">① 极惯性矩 (Polar Moment of Inertia)</div>
              <LatexRenderer formula={formulaIp} />
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">② 最大切应力 (Maximum Shear Stress)</div>
              <LatexRenderer formula={formulaShear} />
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">③ AB段扭转角</div>
              <LatexRenderer formula={formulaAngleAB} />
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">④ BC段扭转角</div>
              <LatexRenderer formula={formulaAngleBC} />
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">⑤ 总扭转角 (Total Angle of Twist)</div>
              <LatexRenderer formula={formulaAngle} />
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">⑥ 应变能 (Strain Energy)</div>
              <LatexRenderer formula={formulaEnergy} />
            </div>
          </div>
      </div>
    </div>
  );
};