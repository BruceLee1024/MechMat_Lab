
import React, { useState } from "react";
import { Scaling, Sigma, Calculator, Book, Scissors, Move, Layers, Box } from "lucide-react";
import { SliderControl, LatexRenderer, MaterialSelector } from "../components";
import { SimulationState } from "../types";
import { CommonDefs } from "./CommonDefs";

export const FundamentalsModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  // --- Main Module State (Poisson & Stress-Strain) ---
  const [strainLevel, setStrainLevel] = useState(0.1); 
  
  // --- Textbook Concepts State ---
  const [conceptTab, setConceptTab] = useState<"assumptions" | "sections" | "strain" | "forms">("assumptions");
  
  // §1-3 Method of Sections
  const [cutPos, setCutPos] = useState(60); // % of beam length

  // §1-4 Displacement & Strain
  const [vertexDx, setVertexDx] = useState(20);
  const [vertexDy, setVertexDy] = useState(0);
  const [isRigidMode, setIsRigidMode] = useState(false);

  // --- Calculations for Main Module ---
  const nu = state.poissonRatio;
  const epsAxial = strainLevel;
  const epsTrans = -nu * strainLevel;

  const w0 = 100;
  const h0 = 100;
  const wCurrent = w0 * (1 + epsTrans); 
  const hCurrent = h0 * (1 + epsAxial); 

  const generateChartData = () => {
      const points = [];
      for(let e = 0; e <= 0.5; e += 0.01) {
          let sigEng = 0;
          if (e < 0.05) {
             sigEng = e * 4000; 
          } else {
             const ep = e - 0.05;
             sigEng = 200 + 300 * Math.pow(ep, 0.4) - 100 * Math.pow(ep, 2); 
          }
          const sigTrue = sigEng * (1 + e);
          points.push({ e, sigEng, sigTrue });
      }
      return points;
  }
  const chartData = generateChartData();
  
  const width = 300;
  const height = 180;
  const padding = 30;
  const maxStrain = 0.5;
  const maxStress = 600; 
  
  const mapX = (val: number) => padding + (val / maxStrain) * (width - 2 * padding);
  const mapY = (val: number) => height - padding - (val / maxStress) * (height - 2 * padding);
  
  const pathEng = chartData.map((p, i) => `${i===0?'M':'L'} ${mapX(p.e)},${mapY(p.sigEng)}`).join(" ");
  const pathTrue = chartData.map((p, i) => `${i===0?'M':'L'} ${mapX(p.e)},${mapY(p.sigTrue)}`).join(" ");

  const currentSigEng = strainLevel < 0.05 ? strainLevel * 4000 : 200 + 300 * Math.pow(strainLevel - 0.05, 0.4) - 100 * Math.pow(strainLevel - 0.05, 2);
  const currentSigTrue = currentSigEng * (1 + strainLevel);
  const cx = mapX(strainLevel);

  // --- Helpers for Concept Visualizations ---
  const Q_val = (1 - cutPos/100) * 50; 
  const M_val = (cutPos/100) * (1 - cutPos/100) * 100;
  const strainEps = isRigidMode ? 0 : (vertexDx / 100);
  const strainGamma = isRigidMode ? 0 : (vertexDy / 100);

  return (
    <div className="flex flex-col h-full space-y-6">
       <style>{`
         @keyframes axialStretch {
           0% { transform: scaleX(1); }
           100% { transform: scaleX(1.3); }
         }
         @keyframes arrowMoveRight {
            0% { transform: translate(45px, 0); }
            100% { transform: translate(60px, 0); }
         }
         @keyframes arrowMoveLeft {
            0% { transform: translate(-45px, 0) rotate(180deg); }
            100% { transform: translate(-60px, 0) rotate(180deg); }
         }
         @keyframes shearSlideUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-5px); }
         }
         @keyframes shearSlideDown {
            0% { transform: translateY(0); }
            100% { transform: translateY(5px); }
         }
         @keyframes torqueRotateRight {
            0% { transform: translate(50px, 0) rotate(0deg); }
            100% { transform: translate(50px, 0) rotate(15deg); }
         }
         @keyframes torqueRotateLeft {
            0% { transform: translate(-50px, 0) rotate(180deg); }
            100% { transform: translate(-50px, 0) rotate(195deg); }
         }
       `}</style>

       {/* TOP: Textbook Concepts Section - 绪论与基本概念 */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Book className="w-4 h-4 text-indigo-500" /> 绪论与基本概念 (Introduction & Basic Concepts)
            </h3>
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 overflow-x-auto">
                <button onClick={() => setConceptTab("assumptions")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "assumptions" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Box className="w-4 h-4" /> §1-2 变形固体假设</button>
                <button onClick={() => setConceptTab("sections")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "sections" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Scissors className="w-4 h-4" /> §1-3 截面法</button>
                <button onClick={() => setConceptTab("strain")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "strain" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Move className="w-4 h-4" /> §1-4 位移与应变</button>
                <button onClick={() => setConceptTab("forms")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "forms" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Layers className="w-4 h-4" /> §1-5 变形基本形式</button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[300px] flex flex-col justify-center">
                {conceptTab === "assumptions" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 1, title: "连续性假设", desc: "材料内部无空隙,充满整个体积。可用连续函数描述。" },
                            { id: 2, title: "均匀性假设", desc: "各点力学性质相同 (E, G, v 不随位置变化)。" },
                            { id: 3, title: "各向同性", desc: "各个方向力学性质相同。区别于木材等各向异性材料。" },
                            { id: 4, title: "小变形假设", desc: "变形量远小于尺寸，可按原始尺寸建立平衡方程。" }
                        ].map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:border-indigo-300 transition-colors">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3 text-indigo-600 font-bold">{item.id}</div>
                                <h4 className="font-bold text-slate-800 mb-2">{item.title}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                )}

                {conceptTab === "sections" && (
                     <div className="flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
                             <div className="w-[300px] h-[200px] bg-white rounded border border-slate-200 relative shadow-sm">
                                 <svg width="100%" height="100%" viewBox="0 0 300 200">
                                    <CommonDefs />
                                    <path d={`M 20,100 Q 150,${80} 280,100 L 280,140 Q 150,160 20,140 Z`} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
                                    <clipPath id="cutClip"><rect x="0" y="0" width={20 + (260 * cutPos/100)} height="200" /></clipPath>
                                    <path d={`M 20,100 Q 150,${80} 280,100 L 280,140 Q 150,160 20,140 Z`} fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" clipPath="url(#cutClip)"/>
                                    <line x1="20" y1="120" x2="0" y2="120" stroke="#e11d48" strokeWidth="3" markerEnd="url(#arrowForce)" transform="rotate(180, 20, 120)" />
                                    <text x="5" y="110" fontSize="12" fill="#e11d48" fontWeight="bold">F_ext</text>
                                    <g transform={`translate(${20 + 260*cutPos/100}, 120)`}>
                                        <line x1="0" y1="-30" x2="0" y2="30" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
                                        <line x1="0" y1="0" x2={30 + M_val/5} y2="0" stroke="#4f46e5" strokeWidth="2" markerEnd="url(#arrowVector)" />
                                        <text x={35} y="4" fontSize="12" fill="#4f46e5" fontWeight="bold">N</text>
                                        <line x1="0" y1="0" x2="0" y2={-30 - Q_val} stroke="#4f46e5" strokeWidth="2" markerEnd="url(#arrowVector)" />
                                        <text x="5" y={-35 - Q_val} fontSize="12" fill="#4f46e5" fontWeight="bold">Q</text>
                                        <path d="M 15,-15 A 15,15 0 1,1 15,15" fill="none" stroke="#4f46e5" strokeWidth="2" markerEnd="url(#arrowVector)" />
                                        <text x="30" y="20" fontSize="12" fill="#4f46e5" fontWeight="bold">M</text>
                                    </g>
                                 </svg>
                                 <div className="absolute bottom-2 right-2 text-xs text-slate-400">隔离体 (Free Body Diagram)</div>
                             </div>
                             <div className="w-full md:w-64 space-y-4">
                                 <div className="bg-white p-4 rounded border border-slate-200">
                                     <div className="text-sm font-bold text-slate-700 mb-2">截面位置 x (Position)</div>
                                     <input type="range" min="10" max="90" value={cutPos} onChange={(e) => setCutPos(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                                     <div className="text-right text-xs text-slate-500 mt-1">{cutPos.toFixed(0)}% L</div>
                                 </div>
                                 <div className="text-sm text-slate-600 space-y-2">
                                     <p>1. 假想沿 <span className="font-mono bg-slate-100 px-1">x={cutPos}%</span> 处切开。</p>
                                     <p>2. 抛去右段，保留左段。</p>
                                     <p>3. 在截面上加内力 <span className="text-indigo-600 font-bold">N, Q, M</span> 代替右段作用。</p>
                                     <p>4. 建立平衡方程求解。</p>
                                 </div>
                             </div>
                        </div>
                     </div>
                )}

                {conceptTab === "strain" && (
                    <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[250px] relative overflow-hidden">
                                <svg width="300" height="200" viewBox="0 0 300 200">
                                    <CommonDefs />
                                    <g transform="translate(50, 150) scale(1, -1)">
                                        <line x1="-20" y1="0" x2="220" y2="0" stroke="#cbd5e1" strokeWidth="1" />
                                        <line x1="0" y1="-20" x2="0" y2="120" stroke="#cbd5e1" strokeWidth="1" />
                                        <rect x="0" y="0" width="100" height="100" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                                        <text x="-15" y="-5" transform="scale(1, -1)" fontSize="12" fill="#94a3b8">A</text>
                                        {isRigidMode ? (
                                            <g transform={`translate(${vertexDx}, ${vertexDy})`}>
                                                <rect x="0" y="0" width="100" height="100" fill="rgba(148, 163, 184, 0.2)" stroke="#64748b" strokeWidth="2" />
                                                <circle cx="100" cy="100" r="3" fill="#e11d48" />
                                            </g>
                                        ) : (
                                            <g>
                                                <path d={`M0,0 L100,0 L${100+vertexDx},${100+vertexDy} L0,100 Z`} fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" />
                                                <circle cx={100+vertexDx} cy={100+vertexDy} r="3" fill="#e11d48" />
                                                <line x1="100" y1="100" x2={100+vertexDx} y2="100" stroke="#e11d48" strokeWidth="1" />
                                                <line x1={100+vertexDx} y1="100" x2={100+vertexDx} y2={100+vertexDy} stroke="#e11d48" strokeWidth="1" />
                                            </g>
                                        )}
                                    </g>
                                    <text x="260" y="190" fontSize="12" fill="#64748b">x</text>
                                    <text x="40" y="20" fontSize="12" fill="#64748b">y</text>
                                </svg>
                                <div className="absolute top-2 right-2 flex gap-2">
                                     <button onClick={() => setIsRigidMode(true)} className={`px-3 py-1 text-xs rounded border ${isRigidMode ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-600 border-slate-200'}`}>刚体位移</button>
                                     <button onClick={() => setIsRigidMode(false)} className={`px-3 py-1 text-xs rounded border ${!isRigidMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200'}`}>变形</button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded border border-slate-200 space-y-4">
                                    <div className="text-sm font-bold text-slate-700">顶点位移控制 (C → C')</div>
                                    <SliderControl label="水平位移 u (dx)" value={vertexDx} min={-40} max={40} step={1} unit="px" onChange={setVertexDx} />
                                    <SliderControl label="垂直位移 v (dy)" value={vertexDy} min={-40} max={40} step={1} unit="px" onChange={setVertexDy} />
                                </div>
                                <div className="bg-slate-100 p-4 rounded border border-slate-200">
                                    {isRigidMode ? (
                                        <div className="text-center text-slate-500">
                                            <h4 className="font-bold mb-2">刚体位移</h4>
                                            <p className="text-xs">各点间距离保持不变。形状未改变。</p>
                                            <p className="font-mono mt-2">ε = 0, γ = 0</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-indigo-700 text-sm mb-2">应变计算 (Small Strain)</h4>
                                            <div className="flex justify-between text-sm"><span>线应变 ε_x ≈ du/dx</span><span className="font-mono font-bold text-indigo-600">{strainEps.toFixed(2)}</span></div>
                                            <div className="flex justify-between text-sm"><span>切应变 γ_xy ≈ du/dy + dv/dx</span><span className="font-mono font-bold text-rose-600">{strainGamma.toFixed(2)}</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Basic Forms Animation (Automatic Loop) */}
                {conceptTab === "forms" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: "axial", name: "轴向拉伸 (Tension)", desc: "轴线方向伸长" },
                            { id: "shear", name: "剪切 (Shear)", desc: "截面发生错动" },
                            { id: "torsion", name: "扭转 (Torsion)", desc: "截面绕轴旋转" },
                            { id: "bending", name: "弯曲 (Bending)", desc: "轴线变弯曲" }
                        ].map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center hover:border-indigo-300 transition-colors">
                                <div className="w-40 h-32 bg-slate-50 rounded mb-3 flex items-center justify-center relative overflow-hidden">
                                    <svg width="140" height="100" viewBox="0 0 140 100">
                                        <CommonDefs />
                                        
                                        {/* (a) AXIAL TENSION (Automatic Loop) */}
                                        {item.id === "axial" && (
                                            <g transform="translate(70, 50)">
                                                {/* Original - Dashed - Static */}
                                                <rect x="-40" y="-15" width="80" height="30" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
                                                {/* Deformed - Solid - Animated */}
                                                <g style={{ animation: "axialStretch 2s ease-in-out infinite alternate" }}>
                                                    <rect x="-40" y="-15" width="80" height="30" fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" />
                                                </g>
                                                {/* Force Arrows */}
                                                <g style={{ animation: "arrowMoveRight 2s ease-in-out infinite alternate" }}>
                                                    <line x1="0" y1="0" x2="15" y2="0" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                    <text x="5" y="-5" fontSize="10" fill="#e11d48">F</text>
                                                </g>
                                                <g style={{ animation: "arrowMoveLeft 2s ease-in-out infinite alternate" }}>
                                                    <line x1="0" y1="0" x2="15" y2="0" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                </g>
                                            </g>
                                        )}

                                        {/* (c) SHEAR (Automatic Loop) */}
                                        {item.id === "shear" && (
                                            <g transform="translate(70, 50)">
                                                <rect x="-40" y="-20" width="80" height="40" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
                                                {/* Left Block (Down) */}
                                                <g style={{ animation: "shearSlideDown 2s ease-in-out infinite alternate" }}>
                                                    <path d="M -40,-20 L 0,-20 L 0,20 L -40,20 Z" fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" />
                                                    <line x1="-20" y1="-35" x2="-20" y2="-25" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                </g>
                                                {/* Right Block (Up) */}
                                                 <g style={{ animation: "shearSlideUp 2s ease-in-out infinite alternate" }}>
                                                    <path d="M 0,-20 L 40,-20 L 40,20 L 0,20 Z" fill="rgba(79, 70, 229, 0.1)" stroke="#4f46e5" strokeWidth="2" />
                                                    <line x1="20" y1="35" x2="20" y2="25" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                </g>
                                                <text x="-30" y="-40" fontSize="10" fill="#e11d48">F</text>
                                            </g>
                                        )}

                                        {/* (d) TORSION (Automatic Loop - SMIL) */}
                                        {item.id === "torsion" && (
                                            <g transform="translate(70, 50)">
                                                <rect x="-40" y="-20" width="80" height="40" fill="url(#hatchPattern)" stroke="none" opacity="0.1" />
                                                <rect x="-40" y="-20" width="80" height="40" fill="none" stroke="#4f46e5" strokeWidth="2" />
                                                {/* Longitudinal Line - Twisting SMIL */}
                                                <path stroke="#e11d48" strokeWidth="2" fill="none">
                                                    <animate attributeName="d" values="M -40,0 L 40,0; M -40,0 Q 0,15 40,0; M -40,0 L 40,0; M -40,0 Q 0,-15 40,0; M -40,0 L 40,0" dur="4s" repeatCount="indefinite" />
                                                </path>
                                                <line x1="-40" y1="0" x2="40" y2="0" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
                                                {/* Rotating Torque Arrows */}
                                                <g style={{ animation: "torqueRotateRight 4s linear infinite alternate" }}>
                                                   <path d="M 50,10 A 10,10 0 0,0 50,-10" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                </g>
                                                 <g style={{ animation: "torqueRotateLeft 4s linear infinite alternate" }}>
                                                   <path d="M -50,-10 A 10,10 0 0,0 -50,10" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                </g>
                                                <text x="45" y="-25" fontSize="10" fill="#e11d48">T</text>
                                            </g>
                                        )}

                                        {/* (e) BENDING (Automatic Loop - SMIL) */}
                                        {item.id === "bending" && (
                                            <g transform="translate(70, 50)">
                                                <line x1="-50" y1="0" x2="50" y2="0" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
                                                <rect x="-50" y="-10" width="100" height="20" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
                                                <g>
                                                    {/* Top Arc (Compression) */}
                                                    <path stroke="#4f46e5" strokeWidth="2" fill="none">
                                                        <animate attributeName="d" values="M -50,-10 L 50,-10; M -50,-10 Q 0,0 50,-10; M -50,-10 L 50,-10" dur="3s" repeatCount="indefinite" />
                                                    </path>
                                                    {/* Bottom Arc (Tension) */}
                                                    <path stroke="#4f46e5" strokeWidth="2" fill="none">
                                                        <animate attributeName="d" values="M -50,10 L 50,10; M -50,10 Q 0,20 50,10; M -50,10 L 50,10" dur="3s" repeatCount="indefinite" />
                                                    </path>
                                                    {/* Vertical Sides */}
                                                    <path stroke="#4f46e5" strokeWidth="2" fill="none">
                                                         <animate attributeName="d" values="M -50,-10 L -50,10; M -50,-10 L -50,10; M -50,-10 L -50,10" dur="3s" repeatCount="indefinite" />
                                                    </path>
                                                     <path stroke="#4f46e5" strokeWidth="2" fill="none">
                                                         <animate attributeName="d" values="M 50,-10 L 50,10; M 50,-10 L 50,10; M 50,-10 L 50,10" dur="3s" repeatCount="indefinite" />
                                                    </path>
                                                </g>
                                                <g transform="translate(-60, 0)">
                                                    <path d="M 0,15 Q -10,0 0,-15" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                    <text x="-15" y="0" fontSize="10" fill="#e11d48">M</text>
                                                </g>
                                                <g transform="translate(60, 0)">
                                                     <path d="M 0,15 Q 10,0 0,-15" fill="none" stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                                                     <text x="5" y="0" fontSize="10" fill="#e11d48">M</text>
                                                </g>
                                            </g>
                                        )}
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
       </div>

       {/* MIDDLE: Visualization */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Poisson Effect Card */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col relative h-[400px]">
                <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Scaling className="w-4 h-4"/> 泊松效应 (Poisson Effect)
                </div>
                <div className="flex-grow min-h-0 flex items-center justify-center pt-4">
                    <svg width="100%" height="100%" viewBox="0 0 300 320" preserveAspectRatio="xMidYMid meet">
                        <CommonDefs />
                        <line x1="150" y1="20" x2="150" y2="300" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="20" y1="160" x2="280" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                        <g transform="translate(0, 10)">
                            <rect x={150 - w0/2} y={150 - h0/2} width={w0} height={h0} 
                                  fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                            <rect x={150 - wCurrent/2} y={150 - hCurrent/2} width={wCurrent} height={hCurrent}
                                  fill="rgba(79, 70, 229, 0.1)" 
                                  stroke="#4f46e5"
                                  strokeWidth="2"
                                  style={{ transition: "all 0.1s linear" }}/>
                            <line x1={150 - wCurrent/2} y1={150} x2={150 - wCurrent/2 - 10} y2={150} stroke="#e11d48" />
                            <line x1={150 + wCurrent/2} y1={150} x2={150 + wCurrent/2 + 10} y2={150} stroke="#e11d48" />
                            <line x1="150" y1={150 - hCurrent/2} x2="150" y2={150 - hCurrent/2 - 30} stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                            <line x1="150" y1={150 + hCurrent/2} x2="150" y2={150 + hCurrent/2 + 30} stroke="#e11d48" strokeWidth="2" markerEnd="url(#arrowForce)" />
                            <text x={150 + w0/2 + 15} y={145} fontSize="11" fill="#94a3b8">Original</text>
                            <text x={150 + wCurrent/2 + 15} y={165} fontSize="11" fill="#4f46e5" fontWeight="bold">Deformed</text>
                        </g>
                    </svg>
                </div>
           </div>

           {/* Stress-Strain Curve Card */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col relative h-[400px]">
                <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Sigma className="w-4 h-4"/> 工程应力 vs 真应力
                </div>
                <div className="flex-grow min-h-0 flex items-center justify-center">
                    <svg width="100%" height="100%" viewBox="0 0 300 180">
                        <path d="M30,30 L30,150 L270,150" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                        {[120, 90, 60].map(y => <line key={y} x1="30" y1={y} x2="270" y2={y} stroke="#f1f5f9" />)}
                        {[90, 150, 210].map(x => <line key={x} x1={x} y1="30" x2={x} y2="150" stroke="#f1f5f9" />)}
                        <text x={275} y={154} fontSize="10" fill="#94a3b8">ε</text>
                        <text x={20} y={25} fontSize="10" fill="#94a3b8">σ</text>
                        <path d={pathEng} fill="none" stroke="#4f46e5" strokeWidth="2" />
                        <text x={mapX(0.4)} y={mapY(220)} fontSize="10" fill="#4f46e5">Eng.</text>
                        <path d={pathTrue} fill="none" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 2"/>
                        <text x={mapX(0.4)} y={mapY(450)} fontSize="10" fill="#e11d48">True</text>
                        <circle cx={cx} cy={mapY(currentSigEng)} r="4" fill="#fff" stroke="#4f46e5" strokeWidth="2" />
                        <circle cx={cx} cy={mapY(currentSigTrue)} r="4" fill="#fff" stroke="#e11d48" strokeWidth="2" />
                        <line x1={cx} y1={mapY(currentSigEng)} x2={cx} y2={mapY(currentSigTrue)} stroke="#94a3b8" strokeDasharray="2 2" />
                    </svg>
                </div>
           </div>
       </div>

       {/* MIDDLE: Parameters & Results */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
                <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-500" /> 实验参数控制</h3>
                <MaterialSelector 
                    currentE={state.bendModulus} 
                    currentYield={state.materialYield}
                    currentPoisson={state.poissonRatio}
                    onSelect={(mat) => onChange({ 
                        materialName: mat.name, 
                        bendModulus: mat.E, 
                        materialYield: mat.yield,
                        poissonRatio: mat.poisson
                    })} 
                />
                <div className="mt-4">
                    <SliderControl label="加载应变 (Strain)" value={parseFloat(strainLevel.toFixed(2))} min={0} max={0.5} step={0.01} unit="" onChange={(v) => setStrainLevel(v)} />
                </div>
           </div>
           
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
               <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                   <Sigma className="w-4 h-4 text-indigo-500" /> 结果分析
               </h3>
               <div className="grid grid-cols-1 gap-4">
                   <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-600">轴向应变 (Axial)</span>
                            <span className="font-mono font-bold text-emerald-600">{(epsAxial*100).toFixed(1)}%</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">横向应变 (Trans)</span>
                            <span className="font-mono font-bold text-rose-600">{(epsTrans*100).toFixed(1)}%</span>
                        </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 bg-indigo-50 rounded border border-indigo-100 text-center">
                            <span className="text-xs text-indigo-800 block mb-1">工程应力 σ_eng</span>
                            <span className="font-mono font-bold text-indigo-700">{currentSigEng.toFixed(1)} MPa</span>
                        </div>
                        <div className="p-2 bg-rose-50 rounded border border-rose-100 text-center">
                            <span className="text-xs text-rose-800 block mb-1">真应力 σ_true</span>
                            <span className="font-mono font-bold text-rose-700">{currentSigTrue.toFixed(1)} MPa</span>
                        </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
