import React from "react";
import { Calculator, Sigma, Rotate3d, Circle } from "lucide-react";
import { SliderControl, LatexRenderer } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const StressModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const { stressSigX, stressSigY, stressTauXY, stressAngle } = state;
  
  // Calculations
  // Convert angle to radians (Input is in degrees)
  const thetaRad = (stressAngle * Math.PI) / 180;
  const cos2 = Math.cos(2 * thetaRad);
  const sin2 = Math.sin(2 * thetaRad);
  
  const avg = (stressSigX + stressSigY) / 2;
  const diff = (stressSigX - stressSigY) / 2;
  
  // Transformed Stresses
  const sigX_prime = avg + diff * cos2 + stressTauXY * sin2;
  const sigY_prime = avg - diff * cos2 - stressTauXY * sin2; // stress on face perpendicular to X'
  const tauXY_prime = -diff * sin2 + stressTauXY * cos2;
  
  // Principal Stresses
  const R = Math.sqrt(diff * diff + stressTauXY * stressTauXY);
  const sig1 = avg + R;
  const sig2 = avg - R;
  const maxShear = R;
  
  // --- Visual Constants ---
  const boxSize = 120;
  const center = 200; // SVG center coordinate (200, 200) for 400x400 view
  
  // Helper: Dynamic Arrow Length Calculation
  // Maps stress magnitude to pixel length. Min 30px, Max 90px.
  const calcArrowLen = (val: number) => {
    const abs = Math.abs(val);
    return Math.min(Math.max(30 + abs * 0.4, 30), 90);
  };

  const lenX = calcArrowLen(sigX_prime);
  const lenY = calcArrowLen(sigY_prime);
  const lenTau = calcArrowLen(tauXY_prime);
  
  // Mohr's Circle Scaling
  // 需要确保整个圆（包括圆心偏移）都在视图内
  // 圆的最左边是 avg - R，最右边是 avg + R = sig1
  // 圆的最上/下是 ±R
  const maxSigma = Math.max(Math.abs(sig1), Math.abs(sig2)) || 10;
  const maxTau = Math.abs(R) || 10;
  const maxVal = Math.max(maxSigma, maxTau);
  
  // 计算缩放比例，确保圆完全在视图内
  // 视图宽度约240px（20到260），高度约240px
  const mohrScale = 100 / (maxVal * 1.3);
  const mohrCx = 150; // SVG中心作为σ=0的位置
  const mohrCy = 150; // SVG中心作为τ=0的位置
  
  // 圆心在σ轴上的位置
  const circleCenterX = mohrCx + avg * mohrScale;

  // Dynamic Formulas with full substitution
  const formulaAvg = `\\sigma_{avg} = \\frac{\\sigma_x + \\sigma_y}{2} = \\frac{${stressSigX} + ${stressSigY}}{2} = ${avg.toFixed(1)} \\text{ MPa}`;
  const formulaDiff = `\\frac{\\sigma_x - \\sigma_y}{2} = \\frac{${stressSigX} - ${stressSigY}}{2} = ${diff.toFixed(1)} \\text{ MPa}`;
  const formulaSigXPrime = `\\sigma_{x'} = \\sigma_{avg} + \\frac{\\sigma_x - \\sigma_y}{2}\\cos 2\\theta + \\tau_{xy}\\sin 2\\theta = ${avg.toFixed(1)} + ${diff.toFixed(1)} \\times \\cos(${2*stressAngle}^\\circ) + ${stressTauXY} \\times \\sin(${2*stressAngle}^\\circ) = ${sigX_prime.toFixed(1)} \\text{ MPa}`;
  const formulaSigYPrime = `\\sigma_{y'} = \\sigma_{avg} - \\frac{\\sigma_x - \\sigma_y}{2}\\cos 2\\theta - \\tau_{xy}\\sin 2\\theta = ${avg.toFixed(1)} - ${diff.toFixed(1)} \\times \\cos(${2*stressAngle}^\\circ) - ${stressTauXY} \\times \\sin(${2*stressAngle}^\\circ) = ${sigY_prime.toFixed(1)} \\text{ MPa}`;
  const formulaTauPrime = `\\tau_{x'y'} = -\\frac{\\sigma_x - \\sigma_y}{2}\\sin 2\\theta + \\tau_{xy}\\cos 2\\theta = -${diff.toFixed(1)} \\times \\sin(${2*stressAngle}^\\circ) + ${stressTauXY} \\times \\cos(${2*stressAngle}^\\circ) = ${tauXY_prime.toFixed(1)} \\text{ MPa}`;
  const formulaRadius = `R = \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2} = \\sqrt{${diff.toFixed(1)}^2 + ${stressTauXY}^2} = ${R.toFixed(1)} \\text{ MPa}`;
  const formulaPrincipal = `\\sigma_{1,2} = \\sigma_{avg} \\pm R = ${avg.toFixed(1)} \\pm ${R.toFixed(1)} = ${sig1.toFixed(1)}, ${sig2.toFixed(1)} \\text{ MPa}`;
  const formulaMaxShear = `\\tau_{max} = R = ${R.toFixed(1)} \\text{ MPa}`;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* TOP: Visualization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* 1. Rotated Stress Element Visualization */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative h-[320px] flex flex-col">
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Rotate3d className="w-4 h-4"/> 微元体应力状态
            </div>
            <div className="flex-grow flex items-center justify-center overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 400 400">
                    <CommonDefs />
                    
                    {/* Coordinate System (Fixed) */}
                    <line x1="340" y1="340" x2="380" y2="340" stroke="#64748b" markerEnd="url(#arrowDim)" />
                    <line x1="340" y1="340" x2="340" y2="300" stroke="#64748b" markerEnd="url(#arrowDim)" />
                    <text x="385" y="345" fontSize="10" fill="#64748b">x</text>
                    <text x="330" y="300" fontSize="10" fill="#64748b">y</text>

                    {/* Rotated Group */}
                    <g transform={`translate(${center}, ${center}) rotate(${-stressAngle})`}>
                        
                        {/* The Element Box - Transparent Fill, Solid Indigo Border */}
                        <rect 
                            x={-boxSize/2} 
                            y={-boxSize/2} 
                            width={boxSize} 
                            height={boxSize} 
                            fill="rgba(79, 70, 229, 0.1)" 
                            stroke="#4f46e5" 
                            strokeWidth="2"
                        />
                        
                        {/* Grid lines on element for wireframe feel */}
                        <line x1="0" y1={-boxSize/2} x2="0" y2={boxSize/2} stroke="#4f46e5" strokeWidth="1" strokeOpacity="0.2" />
                        <line x1={-boxSize/2} y1="0" x2={boxSize/2} y2="0" stroke="#4f46e5" strokeWidth="1" strokeOpacity="0.2" />

                        {/* --- Stress Arrows --- */}
                        
                        {/* Sigma X' (Right Face) */}
                        {Math.abs(sigX_prime) > 0.1 && (
                            <g transform={`translate(${boxSize/2}, 0)`}>
                                <line 
                                    x1={sigX_prime > 0 ? 0 : lenX} 
                                    y1="0" 
                                    x2={sigX_prime > 0 ? lenX : 0} 
                                    y2="0" 
                                    stroke="#e11d48" 
                                    strokeWidth="2" 
                                    markerEnd="url(#arrowForce)" 
                                />
                                <text 
                                    x={lenX + 15} 
                                    y={4} 
                                    fill="#e11d48" 
                                    fontSize="12" 
                                    fontWeight="bold" 
                                    textAnchor="middle" 
                                    transform={`rotate(${stressAngle}, ${lenX + 15}, 4)`}
                                >
                                    σx'
                                </text>
                            </g>
                        )}

                        {/* Sigma X' (Left Face) - Equilibrium */}
                        {Math.abs(sigX_prime) > 0.1 && (
                            <g transform={`translate(${-boxSize/2}, 0) rotate(180)`}>
                                <line 
                                    x1={sigX_prime > 0 ? 0 : lenX} 
                                    y1="0" 
                                    x2={sigX_prime > 0 ? lenX : 0} 
                                    y2="0" 
                                    stroke="#e11d48" 
                                    strokeWidth="2" 
                                    markerEnd="url(#arrowForce)" 
                                />
                            </g>
                        )}

                        {/* Sigma Y' (Top Face) */}
                        {Math.abs(sigY_prime) > 0.1 && (
                            <g transform={`translate(0, ${-boxSize/2}) rotate(-90)`}>
                                <line 
                                    x1={sigY_prime > 0 ? 0 : lenY} 
                                    y1="0" 
                                    x2={sigY_prime > 0 ? lenY : 0} 
                                    y2="0" 
                                    stroke="#e11d48" 
                                    strokeWidth="2" 
                                    markerEnd="url(#arrowForce)" 
                                />
                                <text 
                                    x={lenY + 15} 
                                    y={4} 
                                    fill="#e11d48" 
                                    fontSize="12" 
                                    fontWeight="bold" 
                                    textAnchor="middle" 
                                    transform={`rotate(${stressAngle + 90}, ${lenY + 15}, 4)`}
                                >
                                    σy'
                                </text>
                            </g>
                        )}
                        
                        {/* Sigma Y' (Bottom Face) */}
                        {Math.abs(sigY_prime) > 0.1 && (
                            <g transform={`translate(0, ${boxSize/2}) rotate(90)`}>
                                <line 
                                    x1={sigY_prime > 0 ? 0 : lenY} 
                                    y1="0" 
                                    x2={sigY_prime > 0 ? lenY : 0} 
                                    y2="0" 
                                    stroke="#e11d48" 
                                    strokeWidth="2" 
                                    markerEnd="url(#arrowForce)" 
                                />
                            </g>
                        )}

                        {/* Tau X'Y' (Right Face) - Positive is Up (-Y in SVG) */}
                        {Math.abs(tauXY_prime) > 0.1 && (
                            <g transform={`translate(${boxSize/2}, 0)`}>
                                <line 
                                    x1={10} y1={tauXY_prime > 0 ? lenTau/2 : -lenTau/2}
                                    x2={10} y2={tauXY_prime > 0 ? -lenTau/2 : lenTau/2}
                                    stroke="#e11d48" 
                                    strokeWidth="2" 
                                    markerEnd="url(#arrowForce)" 
                                />
                                <text 
                                    x={22} 
                                    y={0} 
                                    fill="#e11d48" 
                                    fontSize="12" 
                                    fontWeight="bold" 
                                    textAnchor="start" 
                                    dominantBaseline="middle" 
                                    transform={`rotate(${stressAngle}, 22, 0)`}
                                >
                                    τ
                                </text>
                            </g>
                        )}
                        
                        {/* Tau (Top Face) - Positive is Right (+X in SVG) */}
                         {Math.abs(tauXY_prime) > 0.1 && (
                            <g transform={`translate(0, ${-boxSize/2})`}>
                                <line 
                                    x1={tauXY_prime > 0 ? -lenTau/2 : lenTau/2}
                                    y1={-10}
                                    x2={tauXY_prime > 0 ? lenTau/2 : -lenTau/2}
                                    y2={-10}
                                    stroke="#e11d48" 
                                    strokeWidth="2" 
                                    markerEnd="url(#arrowForce)" 
                                />
                            </g>
                        )}
                    </g>
                </svg>
            </div>
            <div className="bg-slate-50 p-2 rounded text-center text-xs text-slate-500 border border-slate-200 mx-4 mb-2">
                旋转角度 (Rotation): {stressAngle}°
            </div>
        </div>

        {/* 2. Mohr's Circle Visualization */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative h-[320px] flex flex-col overflow-hidden">
             <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2 z-10">
                <Circle className="w-4 h-4"/> 莫尔圆
            </div>
            <div className="flex-grow flex items-center justify-center overflow-hidden">
                 <svg width="100%" height="100%" viewBox="0 0 300 300" style={{ overflow: 'hidden' }}>
                    {/* Grid / Axes - σ轴水平，τ轴垂直 */}
                    <line x1="20" y1={mohrCy} x2="280" y2={mohrCy} stroke="#cbd5e1" strokeWidth="2" />
                    <line x1={mohrCx} y1="280" x2={mohrCx} y2="20" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="285" y={mohrCy + 4} fontSize="10" fill="#94a3b8">σ</text>
                    <text x={mohrCx + 5} y="15" fontSize="10" fill="#94a3b8">τ</text>
                    
                    {/* 刻度线 */}
                    {[-100, -50, 50, 100].map(v => {
                      const x = mohrCx + v * mohrScale;
                      if (x > 25 && x < 275) {
                        return (
                          <g key={`tick-${v}`}>
                            <line x1={x} y1={mohrCy - 3} x2={x} y2={mohrCy + 3} stroke="#94a3b8" strokeWidth="1" />
                            <text x={x} y={mohrCy + 12} fontSize="8" fill="#94a3b8" textAnchor="middle">{v}</text>
                          </g>
                        );
                      }
                      return null;
                    })}

                    {/* The Circle - 圆心在 (avg, 0) */}
                    <circle 
                        cx={circleCenterX} 
                        cy={mohrCy} 
                        r={R * mohrScale} 
                        fill="rgba(79, 70, 229, 0.05)" 
                        stroke="#4f46e5" 
                        strokeWidth="2" 
                    />
                    
                    {/* 主应力点 σ1 和 σ2 */}
                    <circle cx={mohrCx + sig1 * mohrScale} cy={mohrCy} r="4" fill="#10b981" stroke="white" strokeWidth="1" />
                    <text x={mohrCx + sig1 * mohrScale} y={mohrCy + 15} fontSize="9" fill="#10b981" textAnchor="middle">σ₁</text>
                    
                    <circle cx={mohrCx + sig2 * mohrScale} cy={mohrCy} r="4" fill="#10b981" stroke="white" strokeWidth="1" />
                    <text x={mohrCx + sig2 * mohrScale} y={mohrCy + 15} fontSize="9" fill="#10b981" textAnchor="middle">σ₂</text>
                    
                    {/* State Line (Diameter) - 连接X面和Y面的状态点 */}
                    {/* 莫尔圆约定：X面状态点 (σx, τxy)，Y面状态点 (σy, -τxy) */}
                    {/* SVG中Y轴向下，所以τ正值在下方 */}
                    <line 
                        x1={mohrCx + stressSigX * mohrScale} 
                        y1={mohrCy + stressTauXY * mohrScale} 
                        x2={mohrCx + stressSigY * mohrScale} 
                        y2={mohrCy - stressTauXY * mohrScale} 
                        stroke="#e11d48" 
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        opacity="0.7"
                    />

                    {/* X State Point - X面的应力状态 (σx, τxy) */}
                    <circle 
                        cx={mohrCx + stressSigX * mohrScale} 
                        cy={mohrCy + stressTauXY * mohrScale} 
                        r="6" 
                        fill="#e11d48" 
                        stroke="white"
                        strokeWidth="2"
                    />
                    <text x={mohrCx + stressSigX * mohrScale + 10} y={mohrCy + stressTauXY * mohrScale + 5} fontSize="10" fill="#e11d48" fontWeight="bold">X</text>

                    {/* Y State Point - Y面的应力状态 (σy, -τxy) */}
                    <circle 
                        cx={mohrCx + stressSigY * mohrScale} 
                        cy={mohrCy - stressTauXY * mohrScale} 
                        r="5" 
                        fill="white" 
                        stroke="#e11d48"
                        strokeWidth="2"
                    />
                    <text x={mohrCx + stressSigY * mohrScale - 12} y={mohrCy - stressTauXY * mohrScale - 5} fontSize="10" fill="#e11d48">Y</text>

                    {/* Center Point C */}
                    <circle cx={circleCenterX} cy={mohrCy} r="3" fill="#4f46e5" />
                    <text x={circleCenterX} y={mohrCy - 8} fontSize="9" fill="#4f46e5" textAnchor="middle">C({avg.toFixed(0)})</text>

                 </svg>
            </div>
            <div className="bg-slate-50 p-2 rounded text-center text-xs text-slate-500 border border-slate-200 mx-4 mb-2">
                圆心 C = ({avg.toFixed(1)}, 0) MPa, 半径 R = {R.toFixed(1)} MPa, 主应力 σ₁={sig1.toFixed(1)}, σ₂={sig2.toFixed(1)} MPa
            </div>
        </div>
      </div>

      {/* MIDDLE: Parameters & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
               <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                 <Calculator className="w-4 h-4 text-indigo-500" /> 初始应力设定
               </h3>
               <div className="space-y-4">
                   <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3">
                            <SliderControl label="正应力 σ_x" value={stressSigX} min={-100} max={100} step={5} unit="MPa" onChange={(v) => onChange({ stressSigX: v })} />
                        </div>
                        <div className="col-span-3">
                            <SliderControl label="正应力 σ_y" value={stressSigY} min={-100} max={100} step={5} unit="MPa" onChange={(v) => onChange({ stressSigY: v })} />
                        </div>
                        <div className="col-span-3">
                            <SliderControl label="切应力 τ_xy" value={stressTauXY} min={-100} max={100} step={5} unit="MPa" onChange={(v) => onChange({ stressTauXY: v })} />
                        </div>
                   </div>
                   
                   <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">截面旋转角 θ (Angle)</span>
                            <span className="text-sm font-bold text-indigo-600">{stressAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={180}
                          step={1}
                          value={stressAngle}
                          onChange={(e) => onChange({ stressAngle: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                   </div>
               </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                 <Sigma className="w-4 h-4 text-indigo-500" /> 结果分析
              </h3>
              <div className="space-y-4">
                 {/* Transformed Values */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-white rounded border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-500 mb-1">变换后正应力 σ_x'</div>
                         <div className="font-mono font-bold text-lg text-indigo-600">{sigX_prime.toFixed(1)} MPa</div>
                     </div>
                     <div className="p-3 bg-white rounded border border-slate-200 shadow-sm">
                         <div className="text-xs text-slate-500 mb-1">变换后切应力 τ_x'y'</div>
                         <div className="font-mono font-bold text-lg text-rose-600">{tauXY_prime.toFixed(1)} MPa</div>
                     </div>
                 </div>
                 
                 {/* Principal Stresses */}
                 <div className="bg-white rounded border border-slate-200 p-4">
                     <div className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-100 pb-1">主应力</div>
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-sm text-slate-700">σ_1 (最大拉/压)</span>
                         <span className="font-mono font-bold text-slate-800">{sig1.toFixed(1)} MPa</span>
                     </div>
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-sm text-slate-700">σ_2 (最小拉/压)</span>
                         <span className="font-mono font-bold text-slate-800">{sig2.toFixed(1)} MPa</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-sm text-slate-700">τ_max (最大切应力)</span>
                         <span className="font-mono font-bold text-rose-600">{maxShear.toFixed(1)} MPa</span>
                     </div>
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
               <div className="text-xs text-slate-500 mb-1">① 平均正应力 (Average Normal Stress)</div>
               <LatexRenderer formula={formulaAvg} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">② 正应力差的一半</div>
               <LatexRenderer formula={formulaDiff} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">③ 变换后正应力 σ_x' (θ = {stressAngle}°)</div>
               <LatexRenderer formula={formulaSigXPrime} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">④ 变换后正应力 σ_y' (θ = {stressAngle}°)</div>
               <LatexRenderer formula={formulaSigYPrime} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">⑤ 变换后切应力 τ_x'y' (θ = {stressAngle}°)</div>
               <LatexRenderer formula={formulaTauPrime} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">⑥ 莫尔圆半径 (Mohr's Circle Radius)</div>
               <LatexRenderer formula={formulaRadius} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">⑦ 主应力 (Principal Stresses)</div>
               <LatexRenderer formula={formulaPrincipal} />
             </div>
             <div className="p-3 bg-white rounded border border-slate-200">
               <div className="text-xs text-slate-500 mb-1">⑧ 最大切应力 (Maximum Shear Stress)</div>
               <LatexRenderer formula={formulaMaxShear} />
             </div>
         </div>
      </div>
    </div>
  );
};