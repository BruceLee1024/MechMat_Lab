import React, { useState } from 'react';
import { Book, Box, Scissors, Move, Layers } from 'lucide-react';
import { SliderControl, LatexRenderer } from '../components';
import { CommonDefs } from './CommonDefs';

// 保留原有教材章节和交互；与泊松效应实验的参数独立。
export function FundamentalsConcepts({ initialTab = 'assumptions', title = '绪论与基本概念', showNavigation = true }: { initialTab?: 'assumptions' | 'sections' | 'strain' | 'forms'; title?: string; showNavigation?: boolean }) {
  const [conceptTab, setConceptTab] = useState(initialTab);
  const [cutPos, setCutPos] = useState(60);
  const [vertexDx, setVertexDx] = useState(20);
  const [vertexDy, setVertexDy] = useState(0);
  const [isRigidMode, setIsRigidMode] = useState(false);
  const Q_val = (1 - cutPos / 100) * 50;
  const M_val = (cutPos / 100) * (1 - cutPos / 100) * 100;
  const strainEps = isRigidMode ? 0 : vertexDx / 100;
  const strainGamma = isRigidMode ? 0 : vertexDy / 100;
  return (
<>
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
       <div className="fundamental-concepts bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Book className="w-4 h-4 text-indigo-500" /> {title}
            </h3>
            {showNavigation ? <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 overflow-x-auto">
                <button onClick={() => setConceptTab("assumptions")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "assumptions" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Box className="w-4 h-4" /> 变形固体假设</button>
                <button onClick={() => setConceptTab("sections")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "sections" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Scissors className="w-4 h-4" /> 截面法</button>
                <button onClick={() => setConceptTab("strain")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "strain" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Move className="w-4 h-4" /> 位移与应变</button>
                <button onClick={() => setConceptTab("forms")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${conceptTab === "forms" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Layers className="w-4 h-4" /> 变形基本形式</button>
            </div> : null}

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

</>
);
}
