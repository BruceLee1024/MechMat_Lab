import React from "react";
import {FormulaWorkbench, type FormulaWorkbenchEntry} from '../components/FormulaWorkbench';
import {FORMULA_BEAM_CALCULATORS, correctedReferenceFormulas} from '../mechanics/formulaBeamCalculators';

interface FormulaItem { label: string; formula: string; }
interface BeamFormula {
  id: string; name: string; group: string;
  fbd: React.ReactNode;
  sfd: React.ReactNode;
  bmd: React.ReactNode;
  formulas: FormulaItem[];
}
interface SectionFormula {
  id: string; name: string; group: string; diagram: React.ReactNode; formulas: FormulaItem[];
}

// ========== 简支梁 - 跨中集中力 ==========
const SSCenterFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <line x1="100" y1="5" x2="100" y2="35" stroke="#ef4444" strokeWidth="2" />
    <polygon points="100,40 95,30 105,30" fill="#ef4444" />
    <text x="100" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="20" y1="65" x2="20" y2="50" stroke="#3b82f6" strokeWidth="1.5" />
    <polygon points="20,45 16,52 24,52" fill="#3b82f6" />
    <text x="20" y="75" textAnchor="middle" fill="#3b82f6" fontSize="8">R=P/2</text>
    <line x1="180" y1="65" x2="180" y2="50" stroke="#3b82f6" strokeWidth="1.5" />
    <polygon points="180,45 176,52 184,52" fill="#3b82f6" />
    <text x="180" y="75" textAnchor="middle" fill="#3b82f6" fontSize="8">R=P/2</text>
    <line x1="20" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const SSCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 100 20 L 100 60 L 180 60" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="55" y="16" textAnchor="middle" fill="#22c55e" fontSize="8">+P/2</text>
    <text x="140" y="72" textAnchor="middle" fill="#22c55e" fontSize="8">-P/2</text>
  </svg>
);
const SSCenterBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 100 65 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="75" textAnchor="middle" fill="#f59e0b" fontSize="8">Mmax=PL/4</text>
  </svg>
);

// ========== 简支梁 - 均布载荷 ==========
const SSUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <rect x="20" y="15" width="160" height="20" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(9)].map((_,i)=>(<g key={i}><line x1={20+i*20} y1="18" x2={20+i*20} y2="35" stroke="#ef4444" strokeWidth="1" /><polygon points={`${20+i*20},40 ${17+i*20},33 ${23+i*20},33`} fill="#ef4444" /></g>))}
    <text x="100" y="12" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">q</text>
    <line x1="20" y1="65" x2="20" y2="50" stroke="#3b82f6" strokeWidth="1.5" />
    <polygon points="20,45 16,52 24,52" fill="#3b82f6" />
    <text x="20" y="75" textAnchor="middle" fill="#3b82f6" fontSize="8">R=qL/2</text>
    <line x1="180" y1="65" x2="180" y2="50" stroke="#3b82f6" strokeWidth="1.5" />
    <polygon points="180,45 176,52 184,52" fill="#3b82f6" />
    <text x="180" y="75" textAnchor="middle" fill="#3b82f6" fontSize="8">R=qL/2</text>
    <line x1="20" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const SSUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 100 40 L 180 60" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="40" y="18" fill="#22c55e" fontSize="8">+qL/2</text>
    <text x="160" y="72" fill="#22c55e" fontSize="8">-qL/2</text>
  </svg>
);
const SSUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 Q 100 80 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="75" textAnchor="middle" fill="#f59e0b" fontSize="8">Mmax=qL²/8</text>
  </svg>
);

// ========== 悬臂梁 - 端部集中力 ==========
const CantEndFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <line x1="180" y1="10" x2="180" y2="40" stroke="#ef4444" strokeWidth="2" />
    <polygon points="180,45 175,35 185,35" fill="#ef4444" />
    <text x="180" y="8" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="22" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
    <path d="M 15 70 A 8 8 0 0 0 15 80" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
    <text x="30" y="82" fill="#3b82f6" fontSize="8">M₀=PL</text>
  </svg>
);
const CantEndSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 180 25" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="20" textAnchor="middle" fill="#22c55e" fontSize="8">V=P</text>
  </svg>
);
const CantEndBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 65 L 180 15" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <polygon points="20,65 20,15 180,15" fill="rgba(245,158,11,0.2)" />
    <text x="30" y="60" fill="#f59e0b" fontSize="8">Mmax=PL</text>
  </svg>
);

// ========== 悬臂梁 - 均布载荷 ==========
const CantUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <rect x="22" y="20" width="158" height="20" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(8)].map((_,i)=>(<g key={i}><line x1={22+i*20} y1="23" x2={22+i*20} y2="40" stroke="#ef4444" strokeWidth="1" /><polygon points={`${22+i*20},45 ${19+i*20},38 ${25+i*20},38`} fill="#ef4444" /></g>))}
    <text x="100" y="15" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">q</text>
    <line x1="22" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
    <path d="M 15 70 A 8 8 0 0 0 15 80" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
    <text x="35" y="82" fill="#3b82f6" fontSize="8">M₀=qL²/2</text>
  </svg>
);
const CantUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="18" fill="#22c55e" fontSize="8">qL</text>
    <text x="175" y="52" fill="#22c55e" fontSize="8">0</text>
  </svg>
);
const CantUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 65 Q 100 50 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="30" y="60" fill="#f59e0b" fontSize="8">Mmax=qL²/2</text>
  </svg>
);

// ========== 两端固定梁 - 跨中集中力 ==========
const FixedCenterFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <rect x="178" y="25" width="12" height="40" fill="#334155" />
    <line x1="190" y1="20" x2="190" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="178" y2="45" stroke="#334155" strokeWidth="3" />
    <line x1="100" y1="10" x2="100" y2="40" stroke="#ef4444" strokeWidth="2" />
    <polygon points="100,45 95,35 105,35" fill="#ef4444" />
    <text x="100" y="8" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="22" y1="90" x2="178" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const FixedCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 25 L 100 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="55" y="22" fill="#22c55e" fontSize="8">+P/2</text>
    <text x="140" y="68" fill="#22c55e" fontSize="8">-P/2</text>
  </svg>
);
const FixedCenterBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 55 L 180 25" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="20" y="22" fill="#f59e0b" fontSize="7">-PL/8</text>
    <text x="100" y="68" fill="#f59e0b" fontSize="7">+PL/8</text>
    <text x="175" y="22" fill="#f59e0b" fontSize="7">-PL/8</text>
  </svg>
);

// ========== 简支梁 - 任意位置集中力 ==========
const SSPointFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <line x1="70" y1="5" x2="70" y2="35" stroke="#ef4444" strokeWidth="2" />
    <polygon points="70,40 65,30 75,30" fill="#ef4444" />
    <text x="70" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="20" y1="85" x2="70" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="45" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
    <line x1="70" y1="85" x2="180" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="125" y="95" textAnchor="middle" fill="#64748b" fontSize="8">b</text>
    <text x="20" y="75" textAnchor="middle" fill="#3b82f6" fontSize="7">R₁=Pb/L</text>
    <text x="180" y="75" textAnchor="middle" fill="#3b82f6" fontSize="7">R₂=Pa/L</text>
  </svg>
);
const SSPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 70 25 L 70 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="45" y="20" fill="#22c55e" fontSize="7">+Pb/L</text>
    <text x="125" y="68" fill="#22c55e" fontSize="7">-Pa/L</text>
  </svg>
);
const SSPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 70 60 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="70" y="75" textAnchor="middle" fill="#f59e0b" fontSize="7">Mmax=Pab/L</text>
  </svg>
);

// ========== 简支梁 - 两点对称集中力 ==========
const SSTwoPointFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <line x1="60" y1="5" x2="60" y2="35" stroke="#ef4444" strokeWidth="2" />
    <polygon points="60,40 55,30 65,30" fill="#ef4444" />
    <text x="60" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="140" y1="5" x2="140" y2="35" stroke="#ef4444" strokeWidth="2" />
    <polygon points="140,40 135,30 145,30" fill="#ef4444" />
    <text x="140" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="20" y1="85" x2="60" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="40" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
    <line x1="140" y1="85" x2="180" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="160" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
    <text x="20" y="75" textAnchor="middle" fill="#3b82f6" fontSize="8">R=P</text>
    <text x="180" y="75" textAnchor="middle" fill="#3b82f6" fontSize="8">R=P</text>
  </svg>
);
const SSTwoPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 60 25 L 60 40 L 140 40 L 140 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="40" y="20" fill="#22c55e" fontSize="7">+P</text>
    <text x="100" y="52" fill="#22c55e" fontSize="7">0</text>
    <text x="160" y="68" fill="#22c55e" fontSize="7">-P</text>
  </svg>
);
const SSTwoPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 60 55 L 140 55 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="70" textAnchor="middle" fill="#f59e0b" fontSize="7">M=Pa (等弯矩段)</text>
  </svg>
);

// ========== 简支梁 - 三角形载荷 ==========
const SSTriangularFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <polygon points="20,35 180,35 180,10" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(8)].map((_,i)=>{const x=20+i*20;const h=(i/8)*25;return(<g key={i}><line x1={x} y1={35-h} x2={x} y2={35} stroke="#ef4444" strokeWidth="1" /><polygon points={`${x},40 ${x-3},33 ${x+3},33`} fill="#ef4444" /></g>);})}
    <text x="175" y="8" fill="#ef4444" fontSize="10" fontWeight="bold">q</text>
    <text x="20" y="75" textAnchor="middle" fill="#3b82f6" fontSize="7">R₁=qL/6</text>
    <text x="180" y="75" textAnchor="middle" fill="#3b82f6" fontSize="7">R₂=qL/3</text>
    <line x1="20" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const SSTriangularSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 30 Q 100 35 180 60" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="25" fill="#22c55e" fontSize="7">+qL/6</text>
    <text x="165" y="72" fill="#22c55e" fontSize="7">-qL/3</text>
  </svg>
);
const SSTriangularBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 Q 80 55 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="75" y="60" fill="#f59e0b" fontSize="7">Mmax=qL²/(9√3)</text>
  </svg>
);

// ========== 简支梁 - 端部弯矩 ==========
const SSMomentFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <path d="M 170 25 A 12 12 0 1 1 170 45" fill="none" stroke="#ef4444" strokeWidth="2" />
    <polygon points="170,45 165,38 173,40" fill="#ef4444" />
    <text x="190" y="37" fill="#ef4444" fontSize="10" fontWeight="bold">M</text>
    <text x="20" y="75" textAnchor="middle" fill="#3b82f6" fontSize="7">R₁=M/L↓</text>
    <text x="180" y="75" textAnchor="middle" fill="#3b82f6" fontSize="7">R₂=M/L↑</text>
    <line x1="20" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const SSMomentSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 180 50" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="62" textAnchor="middle" fill="#22c55e" fontSize="7">V=-M/L (常数)</text>
  </svg>
);
const SSMomentBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 180 20" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="180" y="16" fill="#f59e0b" fontSize="7">M</text>
  </svg>
);

// ========== 悬臂梁 - 任意位置集中力 ==========
const CantPointFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <line x1="100" y1="10" x2="100" y2="40" stroke="#ef4444" strokeWidth="2" />
    <polygon points="100,45 95,35 105,35" fill="#ef4444" />
    <text x="100" y="8" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="22" y1="85" x2="100" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="60" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
    <line x1="100" y1="85" x2="180" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="140" y="95" textAnchor="middle" fill="#64748b" fontSize="8">b</text>
  </svg>
);
const CantPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 25 L 100 40 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="60" y="20" fill="#22c55e" fontSize="7">V=P</text>
    <text x="140" y="52" fill="#22c55e" fontSize="7">V=0</text>
  </svg>
);
const CantPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 60 L 100 15 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="30" y="55" fill="#f59e0b" fontSize="7">M₀=Pa</text>
  </svg>
);

// ========== 悬臂梁 - 端部弯矩 ==========
const CantMomentFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <path d="M 170 30 A 12 12 0 1 1 170 50" fill="none" stroke="#ef4444" strokeWidth="2" />
    <polygon points="170,50 165,43 173,45" fill="#ef4444" />
    <text x="190" y="42" fill="#ef4444" fontSize="10" fontWeight="bold">M</text>
    <line x1="22" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const CantMomentSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="52" textAnchor="middle" fill="#22c55e" fontSize="7">V=0</text>
  </svg>
);
const CantMomentBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 180 25" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="20" textAnchor="middle" fill="#f59e0b" fontSize="7">M=M (常数)</text>
  </svg>
);

// ========== 悬臂梁 - 三角形载荷 ==========
const CantTriangularFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <polygon points="22,40 180,40 22,15" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(8)].map((_,i)=>{const x=22+i*20;const h=((8-i)/8)*25;return(<g key={i}><line x1={x} y1={40-h} x2={x} y2={40} stroke="#ef4444" strokeWidth="1" /><polygon points={`${x},45 ${x-3},38 ${x+3},38`} fill="#ef4444" /></g>);})}
    <text x="30" y="12" fill="#ef4444" fontSize="10" fontWeight="bold">q</text>
    <line x1="22" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const CantTriangularSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 Q 100 30 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="16" fill="#22c55e" fontSize="7">qL/2</text>
  </svg>
);
const CantTriangularBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 60 Q 80 40 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="30" y="55" fill="#f59e0b" fontSize="7">M₀=qL²/6</text>
  </svg>
);

// ========== 两端固定梁 - 均布载荷 ==========
const FixedUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <rect x="178" y="25" width="12" height="40" fill="#334155" />
    <line x1="190" y1="20" x2="190" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="178" y2="45" stroke="#334155" strokeWidth="3" />
    <rect x="22" y="20" width="156" height="20" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(8)].map((_,i)=>(<g key={i}><line x1={22+i*20} y1="23" x2={22+i*20} y2="40" stroke="#ef4444" strokeWidth="1" /><polygon points={`${22+i*20},45 ${19+i*20},38 ${25+i*20},38`} fill="#ef4444" /></g>))}
    <text x="100" y="15" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">q</text>
    <line x1="22" y1="90" x2="178" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const FixedUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 40 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="20" fill="#22c55e" fontSize="7">+qL/2</text>
    <text x="165" y="68" fill="#22c55e" fontSize="7">-qL/2</text>
  </svg>
);
const FixedUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 Q 100 55 180 25" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="20" y="20" fill="#f59e0b" fontSize="6">-qL²/12</text>
    <text x="100" y="62" fill="#f59e0b" fontSize="6">+qL²/24</text>
    <text x="170" y="20" fill="#f59e0b" fontSize="6">-qL²/12</text>
  </svg>
);

// ========== 外伸梁 - 悬臂端集中力 ==========
const OverhangFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="10" y1="40" x2="190" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="40,40 32,55 48,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="28" y1="58" x2="52" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="140,40 132,55 148,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="136" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="144" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="130" y1="65" x2="150" y2="65" stroke="#334155" strokeWidth="1.5" />
    <line x1="190" y1="5" x2="190" y2="35" stroke="#ef4444" strokeWidth="2" />
    <polygon points="190,40 185,30 195,30" fill="#ef4444" />
    <text x="190" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="40" y1="85" x2="140" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="90" y="95" textAnchor="middle" fill="#64748b" fontSize="8">L</text>
    <line x1="140" y1="85" x2="190" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="165" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
  </svg>
);
const OverhangSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 120 50 L 120 25 L 180 25" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="70" y="62" fill="#22c55e" fontSize="7">-Pa/L</text>
    <text x="150" y="20" fill="#22c55e" fontSize="7">+P</text>
  </svg>
);
const OverhangBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 120 60 L 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="120" y="72" fill="#f59e0b" fontSize="7">M=-Pa</text>
  </svg>
);

// ========== 外伸梁 - 悬臂段均布载荷 ==========
const OverhangUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="10" y1="40" x2="190" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="40,40 32,55 48,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="28" y1="58" x2="52" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="140,40 132,55 148,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="136" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="144" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="130" y1="65" x2="150" y2="65" stroke="#334155" strokeWidth="1.5" />
    <rect x="140" y="18" width="50" height="18" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(3)].map((_,i)=>(<g key={i}><line x1={140+i*20} y1="20" x2={140+i*20} y2="35" stroke="#ef4444" strokeWidth="1" /><polygon points={`${140+i*20},40 ${137+i*20},33 ${143+i*20},33`} fill="#ef4444" /></g>))}
    <text x="165" y="14" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">q</text>
    <line x1="40" y1="85" x2="140" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="90" y="95" textAnchor="middle" fill="#64748b" fontSize="8">L</text>
    <line x1="140" y1="85" x2="190" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="165" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
  </svg>
);
const OverhangUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 120 50 L 120 25 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="70" y="62" fill="#22c55e" fontSize="7">-qa²/2L</text>
    <text x="140" y="20" fill="#22c55e" fontSize="7">qa</text>
  </svg>
);
const OverhangUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 120 55 Q 150 60 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="120" y="68" fill="#f59e0b" fontSize="7">M=-qa²/2</text>
  </svg>
);

// ========== 一端固定一端简支 - 跨中集中力 ==========
const ProppedCenterFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <polygon points="180,45 172,60 188,60" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="65" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="65" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="70" x2="190" y2="70" stroke="#334155" strokeWidth="1.5" />
    <line x1="100" y1="10" x2="100" y2="40" stroke="#ef4444" strokeWidth="2" />
    <polygon points="100,45 95,35 105,35" fill="#ef4444" />
    <text x="100" y="8" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="22" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const ProppedCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 22 L 100 22 L 100 58 L 180 58" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="55" y="18" fill="#22c55e" fontSize="7">+11P/16</text>
    <text x="140" y="70" fill="#22c55e" fontSize="7">-5P/16</text>
  </svg>
);
const ProppedCenterBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 60 L 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="20" y="20" fill="#f59e0b" fontSize="6">-3PL/16</text>
    <text x="100" y="72" fill="#f59e0b" fontSize="6">+5PL/32</text>
  </svg>
);

// ========== 一端固定一端简支 - 均布载荷 ==========
const ProppedUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="180" y2="45" stroke="#334155" strokeWidth="3" />
    <polygon points="180,45 172,60 188,60" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="65" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="65" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="70" x2="190" y2="70" stroke="#334155" strokeWidth="1.5" />
    <rect x="22" y="20" width="158" height="20" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(8)].map((_,i)=>(<g key={i}><line x1={22+i*20} y1="23" x2={22+i*20} y2="40" stroke="#ef4444" strokeWidth="1" /><polygon points={`${22+i*20},45 ${19+i*20},38 ${25+i*20},38`} fill="#ef4444" /></g>))}
    <text x="100" y="15" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">q</text>
    <line x1="22" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="98" textAnchor="middle" fill="#64748b" fontSize="9">L</text>
  </svg>
);
const ProppedUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 100 40 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="16" fill="#22c55e" fontSize="7">+5qL/8</text>
    <text x="165" y="68" fill="#22c55e" fontSize="7">-3qL/8</text>
  </svg>
);
const ProppedUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 Q 80 60 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="20" y="20" fill="#f59e0b" fontSize="6">-qL²/8</text>
    <text x="75" y="65" fill="#f59e0b" fontSize="6">+9qL²/128</text>
  </svg>
);

// ========== 简支梁 - 部分均布载荷 ==========
const SSPartialFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="20" y1="40" x2="180" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="20,40 12,55 28,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="8" y1="58" x2="32" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="180,40 172,55 188,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="184" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="65" x2="190" y2="65" stroke="#334155" strokeWidth="1.5" />
    <rect x="60" y="18" width="80" height="18" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(5)].map((_,i)=>(<g key={i}><line x1={60+i*20} y1="20" x2={60+i*20} y2="35" stroke="#ef4444" strokeWidth="1" /><polygon points={`${60+i*20},40 ${57+i*20},33 ${63+i*20},33`} fill="#ef4444" /></g>))}
    <text x="100" y="14" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">q</text>
    <line x1="20" y1="85" x2="60" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="40" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
    <line x1="60" y1="85" x2="140" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="100" y="95" textAnchor="middle" fill="#64748b" fontSize="8">c</text>
    <line x1="140" y1="85" x2="180" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="160" y="95" textAnchor="middle" fill="#64748b" fontSize="8">b</text>
  </svg>
);
const SSPartialSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 28 L 60 28 L 140 52 L 180 52" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="40" y="24" fill="#22c55e" fontSize="7">+R₁</text>
    <text x="160" y="64" fill="#22c55e" fontSize="7">-R₂</text>
  </svg>
);
const SSPartialBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 60 35 Q 100 60 140 35 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="70" textAnchor="middle" fill="#f59e0b" fontSize="7">Mmax</text>
  </svg>
);

// ========== 两端固定梁 - 任意位置集中力 ==========
const FixedPointFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <rect x="10" y="25" width="12" height="40" fill="#334155" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#334155" strokeWidth="2" />
    <rect x="178" y="25" width="12" height="40" fill="#334155" />
    <line x1="190" y1="20" x2="190" y2="70" stroke="#334155" strokeWidth="2" />
    <line x1="22" y1="45" x2="178" y2="45" stroke="#334155" strokeWidth="3" />
    <line x1="70" y1="10" x2="70" y2="40" stroke="#ef4444" strokeWidth="2" />
    <polygon points="70,45 65,35 75,35" fill="#ef4444" />
    <text x="70" y="8" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">P</text>
    <line x1="22" y1="85" x2="70" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="46" y="95" textAnchor="middle" fill="#64748b" fontSize="8">a</text>
    <line x1="70" y1="85" x2="178" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="124" y="95" textAnchor="middle" fill="#64748b" fontSize="8">b</text>
  </svg>
);
const FixedPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 70 25 L 70 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="45" y="20" fill="#22c55e" fontSize="7">+Pb²(3a+b)/L³</text>
    <text x="125" y="68" fill="#22c55e" fontSize="6">-Pa²(a+3b)/L³</text>
  </svg>
);
const FixedPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 28 L 70 55 L 180 32" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="20" y="24" fill="#f59e0b" fontSize="6">-Pab²/L²</text>
    <text x="175" y="28" fill="#f59e0b" fontSize="6">-Pa²b/L²</text>
  </svg>
);

// ========== 连续梁 - 两跨等跨均布载荷 ==========
const ContinuousFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    <line x1="10" y1="40" x2="190" y2="40" stroke="#334155" strokeWidth="3" />
    <polygon points="10,40 2,55 18,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="0" y1="58" x2="20" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="100,40 92,55 108,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="88" y1="58" x2="112" y2="58" stroke="#334155" strokeWidth="1.5" />
    <polygon points="190,40 182,55 198,55" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="186" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="194" cy="60" r="3" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="180" y1="65" x2="200" y2="65" stroke="#334155" strokeWidth="1.5" />
    <rect x="10" y="18" width="180" height="18" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1" />
    {[...Array(10)].map((_,i)=>(<g key={i}><line x1={10+i*20} y1="20" x2={10+i*20} y2="35" stroke="#ef4444" strokeWidth="1" /><polygon points={`${10+i*20},40 ${7+i*20},33 ${13+i*20},33`} fill="#ef4444" /></g>))}
    <text x="100" y="14" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">q</text>
    <line x1="10" y1="85" x2="100" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="55" y="95" textAnchor="middle" fill="#64748b" fontSize="8">L</text>
    <line x1="100" y1="85" x2="190" y2="85" stroke="#64748b" strokeWidth="1" />
    <text x="145" y="95" textAnchor="middle" fill="#64748b" fontSize="8">L</text>
  </svg>
);
const ContinuousSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 28 L 55 40 L 55 55 L 100 28 L 100 55 L 145 40 L 145 28 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
  </svg>
);
const ContinuousBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 Q 55 60 100 25 Q 145 60 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="20" fill="#f59e0b" fontSize="6">-qL²/8</text>
    <text x="55" y="68" fill="#f59e0b" fontSize="6">+9qL²/128</text>
  </svg>
);

// ========== 三铰拱 - 均布载荷 (任意形状) ==========
const Arch3HingeUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    {/* 均布载荷 - StructX 样式：顶部横线 + 竖线 */}
    <line x1="20" y1="8" x2="180" y2="8" stroke="#3b82f6" strokeWidth="1.5" />
    {[...Array(17)].map((_,i)=>(<line key={i} x1={20+i*10} y1="8" x2={20+i*10} y2="18" stroke="#3b82f6" strokeWidth="1" />))}
    {/* 拱 */}
    <path d="M 20 75 Q 100 20 180 75" fill="none" stroke="#334155" strokeWidth="2" />
    {/* 顶部铰 */}
    <circle cx="100" cy="28" r="3" fill="white" stroke="#334155" strokeWidth="1.5" />
    {/* 左支座 - 固定铰 */}
    <polygon points="20,75 12,88 28,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="10" y1="90" x2="30" y2="90" stroke="#334155" strokeWidth="1.5" />
    {/* 右支座 - 固定铰 */}
    <polygon points="180,75 172,88 188,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="90" x2="190" y2="90" stroke="#334155" strokeWidth="1.5" />
  </svg>
);
const Arch3HingeUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">Rₐ = Rc = wL/2</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">Hₐ = Hc = wL²/8f</text>
    <text x="30" y="70" fill="#64748b" fontSize="8">（竖向反力与简支梁相同）</text>
  </svg>
);
const Arch3HingeUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    {/* 拱的轮廓 */}
    <path d="M 20 60 Q 100 25 180 60" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
    {/* 弯矩图 */}
    <path d="M 20 60 Q 60 50 100 40 Q 140 50 180 60" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="72" textAnchor="middle" fill="#f59e0b" fontSize="7">M = wL²/8 × [4(x/L-(x/L)²) - y/f]</text>
  </svg>
);

// ========== 三铰拱 - 跨中集中力 ==========
const Arch3HingeCenterFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    {/* 集中力 */}
    <line x1="100" y1="5" x2="100" y2="22" stroke="#3b82f6" strokeWidth="1.5" />
    <polygon points="100,25 97,18 103,18" fill="#3b82f6" />
    {/* 拱 */}
    <path d="M 20 75 Q 100 20 180 75" fill="none" stroke="#334155" strokeWidth="2" />
    {/* 顶部铰 */}
    <circle cx="100" cy="28" r="3" fill="white" stroke="#334155" strokeWidth="1.5" />
    {/* 左支座 */}
    <polygon points="20,75 12,88 28,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="10" y1="90" x2="30" y2="90" stroke="#334155" strokeWidth="1.5" />
    {/* 右支座 */}
    <polygon points="180,75 172,88 188,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="90" x2="190" y2="90" stroke="#334155" strokeWidth="1.5" />
  </svg>
);
const Arch3HingeCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">轴力N</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 100 55 L 180 50" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="68" textAnchor="middle" fill="#22c55e" fontSize="7">N (压力)</text>
  </svg>
);
const Arch3HingeCenterBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">弯矩M</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 60 55 L 100 40 L 140 55 L 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="60" y="68" fill="#f59e0b" fontSize="7">+Mmax</text>
    <text x="140" y="68" fill="#f59e0b" fontSize="7">+Mmax</text>
  </svg>
);

// ========== 两铰拱 - 均布载荷 ==========
const Arch2HingeUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    {/* 均布载荷 */}
    <line x1="20" y1="8" x2="180" y2="8" stroke="#3b82f6" strokeWidth="1.5" />
    {[...Array(17)].map((_,i)=>(<line key={i} x1={20+i*10} y1="8" x2={20+i*10} y2="18" stroke="#3b82f6" strokeWidth="1" />))}
    {/* 拱 - 无顶部铰 */}
    <path d="M 20 75 Q 100 20 180 75" fill="none" stroke="#334155" strokeWidth="2" />
    {/* 左支座 - 固定铰 */}
    <polygon points="20,75 12,88 28,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="10" y1="90" x2="30" y2="90" stroke="#334155" strokeWidth="1.5" />
    {/* 右支座 - 滚动铰 */}
    <polygon points="180,75 172,88 188,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <circle cx="176" cy="92" r="3" fill="none" stroke="#334155" strokeWidth="1" />
    <circle cx="184" cy="92" r="3" fill="none" stroke="#334155" strokeWidth="1" />
    <line x1="170" y1="96" x2="190" y2="96" stroke="#334155" strokeWidth="1.5" />
  </svg>
);
const Arch2HingeUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">R = wL/2</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">H = wL²/8f × k</text>
    <text x="30" y="70" fill="#64748b" fontSize="8">（一次超静定）</text>
  </svg>
);
const Arch2HingeUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 Q 100 55 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="68" textAnchor="middle" fill="#f59e0b" fontSize="7">Mmax (跨中)</text>
  </svg>
);

// ========== 无铰拱 - 均布载荷 ==========
const ArchFixedUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    {/* 均布载荷 */}
    <line x1="20" y1="8" x2="180" y2="8" stroke="#3b82f6" strokeWidth="1.5" />
    {[...Array(17)].map((_,i)=>(<line key={i} x1={20+i*10} y1="8" x2={20+i*10} y2="18" stroke="#3b82f6" strokeWidth="1" />))}
    {/* 拱 */}
    <path d="M 20 75 Q 100 20 180 75" fill="none" stroke="#334155" strokeWidth="2" />
    {/* 左支座 - 固定端 */}
    <rect x="10" y="70" width="12" height="25" fill="#334155" />
    {/* 右支座 - 固定端 */}
    <rect x="178" y="70" width="12" height="25" fill="#334155" />
  </svg>
);
const ArchFixedUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">R = wL/2</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">H ≈ wL²/8f</text>
    <text x="30" y="70" fill="#64748b" fontSize="8">（三次超静定）</text>
  </svg>
);
const ArchFixedUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 30 Q 60 50 100 35 Q 140 50 180 30" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="20" y="25" fill="#f59e0b" fontSize="6">-M端</text>
    <text x="100" y="48" fill="#f59e0b" fontSize="6">+M中</text>
    <text x="175" y="25" fill="#f59e0b" fontSize="6">-M端</text>
  </svg>
);

// ========== 三铰拱 - 半跨均布载荷 ==========
const ArchHalfUniformFBD = () => (
  <svg viewBox="0 0 200 100" className="w-full h-auto">
    {/* 半跨均布载荷 */}
    <line x1="20" y1="8" x2="100" y2="8" stroke="#3b82f6" strokeWidth="1.5" />
    {[...Array(9)].map((_,i)=>(<line key={i} x1={20+i*10} y1="8" x2={20+i*10} y2="18" stroke="#3b82f6" strokeWidth="1" />))}
    {/* 拱 */}
    <path d="M 20 75 Q 100 20 180 75" fill="none" stroke="#334155" strokeWidth="2" />
    {/* 顶部铰 */}
    <circle cx="100" cy="28" r="3" fill="white" stroke="#334155" strokeWidth="1.5" />
    {/* 左支座 */}
    <polygon points="20,75 12,88 28,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="10" y1="90" x2="30" y2="90" stroke="#334155" strokeWidth="1.5" />
    {/* 右支座 */}
    <polygon points="180,75 172,88 188,88" fill="none" stroke="#334155" strokeWidth="1.5" />
    <line x1="170" y1="90" x2="190" y2="90" stroke="#334155" strokeWidth="1.5" />
  </svg>
);
const ArchHalfUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">Rₐ = 3wL/8</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">Rc = wL/8</text>
    <text x="30" y="70" fill="#3b82f6" fontSize="9">H = wL²/16f</text>
  </svg>
);
const ArchHalfUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 Q 60 60 100 40 Q 140 25 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="60" y="68" fill="#f59e0b" fontSize="7">+M</text>
    <text x="140" y="22" fill="#f59e0b" fontSize="7">-M</text>
  </svg>
);

// 梁公式数据
const BEAM_FORMULAS: BeamFormula[] = [
  // 简支梁
  { id:"ss-center", name:"跨中集中力", group:"简支梁", fbd:<SSCenterFBD/>, sfd:<SSCenterSFD/>, bmd:<SSCenterBMD/>, formulas:[
    {label:"R = V",formula:"R = V = \\frac{P}{2}"},
    {label:"Mmax (跨中)",formula:"M_{max} = \\frac{PL}{4}"},
    {label:"δmax (跨中)",formula:"\\delta_{max} = \\frac{PL^3}{48EI}"},
    {label:"θmax (端部)",formula:"\\theta_{max} = \\frac{PL^2}{16EI}"},
  ]},
  { id:"ss-uniform", name:"均布载荷", group:"简支梁", fbd:<SSUniformFBD/>, sfd:<SSUniformSFD/>, bmd:<SSUniformBMD/>, formulas:[
    {label:"R = V",formula:"R = V = \\frac{qL}{2}"},
    {label:"Mmax (跨中)",formula:"M_{max} = \\frac{qL^2}{8}"},
    {label:"δmax (跨中)",formula:"\\delta_{max} = \\frac{5qL^4}{384EI}"},
    {label:"θmax (端部)",formula:"\\theta_{max} = \\frac{qL^3}{24EI}"},
  ]},
  { id:"ss-point", name:"任意位置集中力", group:"简支梁", fbd:<SSPointFBD/>, sfd:<SSPointSFD/>, bmd:<SSPointBMD/>, formulas:[
    {label:"R₁ (左支座)",formula:"R_1 = \\frac{Pb}{L}"},
    {label:"R₂ (右支座)",formula:"R_2 = \\frac{Pa}{L}"},
    {label:"Mmax (载荷处)",formula:"M_{max} = \\frac{Pab}{L}"},
    {label:"δ (载荷处)",formula:"\\delta_a = \\frac{Pa^2b^2}{3EIL}"},
    {label:"δmax",formula:"\\delta_{max} = \\frac{Pb(L^2-b^2)^{3/2}}{9\\sqrt{3}EIL}"},
  ]},
  { id:"ss-two-point", name:"两点对称集中力", group:"简支梁", fbd:<SSTwoPointFBD/>, sfd:<SSTwoPointSFD/>, bmd:<SSTwoPointBMD/>, formulas:[
    {label:"R = V",formula:"R = V = P"},
    {label:"M (等弯矩段)",formula:"M = Pa"},
    {label:"δmax (跨中)",formula:"\\delta_{max} = \\frac{Pa(3L^2-4a^2)}{24EI}"},
    {label:"θ (端部)",formula:"\\theta = \\frac{Pa(L-a)}{EI}"},
  ]},
  { id:"ss-triangular", name:"三角形载荷", group:"简支梁", fbd:<SSTriangularFBD/>, sfd:<SSTriangularSFD/>, bmd:<SSTriangularBMD/>, formulas:[
    {label:"R₁ (小端)",formula:"R_1 = \\frac{qL}{6}"},
    {label:"R₂ (大端)",formula:"R_2 = \\frac{qL}{3}"},
    {label:"Mmax",formula:"M_{max} = \\frac{qL^2}{9\\sqrt{3}}"},
    {label:"δmax",formula:"\\delta_{max} = \\frac{0.01304qL^4}{EI}"},
  ]},
  { id:"ss-moment", name:"端部弯矩", group:"简支梁", fbd:<SSMomentFBD/>, sfd:<SSMomentSFD/>, bmd:<SSMomentBMD/>, formulas:[
    {label:"R₁",formula:"R_1 = -\\frac{M}{L}"},
    {label:"R₂",formula:"R_2 = \\frac{M}{L}"},
    {label:"V (常数)",formula:"V = -\\frac{M}{L}"},
    {label:"θ₁",formula:"\\theta_1 = \\frac{ML}{3EI}"},
    {label:"θ₂",formula:"\\theta_2 = \\frac{ML}{6EI}"},
  ]},
  { id:"ss-partial", name:"部分均布载荷", group:"简支梁", fbd:<SSPartialFBD/>, sfd:<SSPartialSFD/>, bmd:<SSPartialBMD/>, formulas:[
    {label:"R₁",formula:"R_1 = \\frac{qc(2b+c)}{2L}"},
    {label:"R₂",formula:"R_2 = \\frac{qc(2a+c)}{2L}"},
    {label:"Mmax",formula:"M_{max} = R_1(a+\\frac{R_1}{q})-\\frac{q}{2}(\\frac{R_1}{q})^2"},
    {label:"位置",formula:"x_{max} = a + \\frac{R_1}{q}"},
  ]},
  // 悬臂梁
  { id:"cant-end", name:"端部集中力", group:"悬臂梁", fbd:<CantEndFBD/>, sfd:<CantEndSFD/>, bmd:<CantEndBMD/>, formulas:[
    {label:"R (固定端)",formula:"R = P"},
    {label:"M₀ (固定端)",formula:"M_0 = PL"},
    {label:"δmax (自由端)",formula:"\\delta_{max} = \\frac{PL^3}{3EI}"},
    {label:"θmax (自由端)",formula:"\\theta_{max} = \\frac{PL^2}{2EI}"},
  ]},
  { id:"cant-uniform", name:"均布载荷", group:"悬臂梁", fbd:<CantUniformFBD/>, sfd:<CantUniformSFD/>, bmd:<CantUniformBMD/>, formulas:[
    {label:"R (固定端)",formula:"R = qL"},
    {label:"M₀ (固定端)",formula:"M_0 = \\frac{qL^2}{2}"},
    {label:"δmax (自由端)",formula:"\\delta_{max} = \\frac{qL^4}{8EI}"},
    {label:"θmax (自由端)",formula:"\\theta_{max} = \\frac{qL^3}{6EI}"},
  ]},
  { id:"cant-point", name:"任意位置集中力", group:"悬臂梁", fbd:<CantPointFBD/>, sfd:<CantPointSFD/>, bmd:<CantPointBMD/>, formulas:[
    {label:"R (固定端)",formula:"R = P"},
    {label:"M₀ (固定端)",formula:"M_0 = Pa"},
    {label:"δ (载荷处)",formula:"\\delta_a = \\frac{Pa^3}{3EI}"},
    {label:"δ (自由端)",formula:"\\delta_{端} = \\frac{Pa^2(3L-a)}{6EI}"},
  ]},
  { id:"cant-moment", name:"端部弯矩", group:"悬臂梁", fbd:<CantMomentFBD/>, sfd:<CantMomentSFD/>, bmd:<CantMomentBMD/>, formulas:[
    {label:"R (固定端)",formula:"R = 0"},
    {label:"M (常数)",formula:"M = M"},
    {label:"δmax (自由端)",formula:"\\delta_{max} = \\frac{ML^2}{2EI}"},
    {label:"θmax (自由端)",formula:"\\theta_{max} = \\frac{ML}{EI}"},
  ]},
  { id:"cant-triangular", name:"三角形载荷", group:"悬臂梁", fbd:<CantTriangularFBD/>, sfd:<CantTriangularSFD/>, bmd:<CantTriangularBMD/>, formulas:[
    {label:"R (固定端)",formula:"R = \\frac{qL}{2}"},
    {label:"M₀ (固定端)",formula:"M_0 = \\frac{qL^2}{6}"},
    {label:"δmax (自由端)",formula:"\\delta_{max} = \\frac{qL^4}{30EI}"},
    {label:"θmax (自由端)",formula:"\\theta_{max} = \\frac{qL^3}{24EI}"},
  ]},
  // 两端固定梁
  { id:"fixed-center", name:"跨中集中力", group:"两端固定梁", fbd:<FixedCenterFBD/>, sfd:<FixedCenterSFD/>, bmd:<FixedCenterBMD/>, formulas:[
    {label:"R",formula:"R = \\frac{P}{2}"},
    {label:"M (端部)",formula:"M_{端} = \\frac{PL}{8}"},
    {label:"M (跨中)",formula:"M_{中} = \\frac{PL}{8}"},
    {label:"δmax (跨中)",formula:"\\delta_{max} = \\frac{PL^3}{192EI}"},
  ]},
  { id:"fixed-uniform", name:"均布载荷", group:"两端固定梁", fbd:<FixedUniformFBD/>, sfd:<FixedUniformSFD/>, bmd:<FixedUniformBMD/>, formulas:[
    {label:"R",formula:"R = \\frac{qL}{2}"},
    {label:"M (端部)",formula:"M_{端} = \\frac{qL^2}{12}"},
    {label:"M (跨中)",formula:"M_{中} = \\frac{qL^2}{24}"},
    {label:"δmax (跨中)",formula:"\\delta_{max} = \\frac{qL^4}{384EI}"},
  ]},
  { id:"fixed-point", name:"任意位置集中力", group:"两端固定梁", fbd:<FixedPointFBD/>, sfd:<FixedPointSFD/>, bmd:<FixedPointBMD/>, formulas:[
    {label:"R₁",formula:"R_1 = \\frac{Pb^2(3a+b)}{L^3}"},
    {label:"R₂",formula:"R_2 = \\frac{Pa^2(a+3b)}{L^3}"},
    {label:"M₁ (左端)",formula:"M_1 = \\frac{Pab^2}{L^2}"},
    {label:"M₂ (右端)",formula:"M_2 = \\frac{Pa^2b}{L^2}"},
    {label:"δ (载荷处)",formula:"\\delta_a = \\frac{Pa^3b^3}{3EIL^3}"},
  ]},
  // 外伸梁
  { id:"overhang", name:"悬臂端集中力", group:"外伸梁", fbd:<OverhangFBD/>, sfd:<OverhangSFD/>, bmd:<OverhangBMD/>, formulas:[
    {label:"R₁",formula:"R_1 = -\\frac{Pa}{L}"},
    {label:"R₂",formula:"R_2 = P(1+\\frac{a}{L})"},
    {label:"M (支座处)",formula:"M_{R_2} = -Pa"},
    {label:"δ (自由端)",formula:"\\delta = \\frac{Pa^2(L+a)}{3EI}"},
  ]},
  { id:"overhang-uniform", name:"悬臂段均布载荷", group:"外伸梁", fbd:<OverhangUniformFBD/>, sfd:<OverhangUniformSFD/>, bmd:<OverhangUniformBMD/>, formulas:[
    {label:"R₁",formula:"R_1 = -\\frac{qa^2}{2L}"},
    {label:"R₂",formula:"R_2 = \\frac{qa(2L+a)}{2L}"},
    {label:"M (支座处)",formula:"M_{R_2} = -\\frac{qa^2}{2}"},
    {label:"δ (自由端)",formula:"\\delta = \\frac{qa^3(4L+3a)}{24EI}"},
  ]},
  // 一端固定一端简支
  { id:"propped-center", name:"跨中集中力", group:"一端固定一端简支", fbd:<ProppedCenterFBD/>, sfd:<ProppedCenterSFD/>, bmd:<ProppedCenterBMD/>, formulas:[
    {label:"R (固定端)",formula:"R_A = \\frac{11P}{16}"},
    {label:"R (简支端)",formula:"R_B = \\frac{5P}{16}"},
    {label:"M (固定端)",formula:"M_A = \\frac{3PL}{16}"},
    {label:"Mmax (跨中)",formula:"M_{max} = \\frac{5PL}{32}"},
    {label:"δmax",formula:"\\delta_{max} = \\frac{PL^3}{48EI}\\cdot\\frac{1}{\\sqrt{5}}"},
  ]},
  { id:"propped-uniform", name:"均布载荷", group:"一端固定一端简支", fbd:<ProppedUniformFBD/>, sfd:<ProppedUniformSFD/>, bmd:<ProppedUniformBMD/>, formulas:[
    {label:"R (固定端)",formula:"R_A = \\frac{5qL}{8}"},
    {label:"R (简支端)",formula:"R_B = \\frac{3qL}{8}"},
    {label:"M (固定端)",formula:"M_A = \\frac{qL^2}{8}"},
    {label:"Mmax (正)",formula:"M_{max}^+ = \\frac{9qL^2}{128}"},
    {label:"δmax（近似）",formula:"\\delta_{max} \\approx \\frac{qL^4}{185EI}"},
  ]},
  // 连续梁
  { id:"continuous", name:"两跨等跨均布载荷", group:"连续梁", fbd:<ContinuousFBD/>, sfd:<ContinuousSFD/>, bmd:<ContinuousBMD/>, formulas:[
    {label:"R (边支座)",formula:"R_A = R_C = \\frac{3qL}{8}"},
    {label:"R (中支座)",formula:"R_B = \\frac{10qL}{8}"},
    {label:"M (中支座)",formula:"M_B = -\\frac{qL^2}{8}"},
    {label:"Mmax (正)",formula:"M_{max}^+ = \\frac{9qL^2}{128}"},
  ]},
  // 三铰拱
  { id:"arch-3hinge-uniform", name:"均布载荷（抛物线拱）", group:"三铰拱", fbd:<Arch3HingeUniformFBD/>, sfd:<Arch3HingeUniformSFD/>, bmd:<Arch3HingeUniformBMD/>, formulas:[
    {label:"竖向反力",formula:"R_A = R_C = \\frac{wL}{2}"},
    {label:"水平推力",formula:"H_A = H_C = \\frac{wL^2}{8f}"},
    {label:"弯矩公式",formula:"M = \\frac{wL^2}{8}\\left[4\\left(\\frac{x}{L}-\\left(\\frac{x}{L}\\right)^2\\right)-\\frac{y}{f}\\right]"},
    {label:"抛物线拱",formula:"\\text{当 } y=\\frac{4f}{L^2}x(L-x) \\text{ 时, } M=0"},
  ]},
  { id:"arch-3hinge-center", name:"跨中集中力", group:"三铰拱", fbd:<Arch3HingeCenterFBD/>, sfd:<Arch3HingeCenterSFD/>, bmd:<Arch3HingeCenterBMD/>, formulas:[
    {label:"竖向反力",formula:"R_A = R_C = \\frac{P}{2}"},
    {label:"水平推力",formula:"H_A = H_C = \\frac{PL}{4f}"},
    {label:"弯矩 (x<L/2)",formula:"M = \\frac{Px}{2} - Hy"},
    {label:"最大弯矩",formula:"M_{max} = \\frac{PL}{4} - Hf"},
  ]},
  { id:"arch-half-uniform", name:"半跨均布载荷", group:"三铰拱", fbd:<ArchHalfUniformFBD/>, sfd:<ArchHalfUniformSFD/>, bmd:<ArchHalfUniformBMD/>, formulas:[
    {label:"水平推力",formula:"H = \\frac{wL^2}{16f}"},
    {label:"左支座反力",formula:"R_A = \\frac{3wL}{8}"},
    {label:"右支座反力",formula:"R_C = \\frac{wL}{8}"},
    {label:"最大弯矩",formula:"M_{max} = \\frac{wL^2}{16}"},
  ]},
  // 两铰拱
  { id:"arch-2hinge-uniform", name:"均布载荷", group:"两铰拱", fbd:<Arch2HingeUniformFBD/>, sfd:<Arch2HingeUniformSFD/>, bmd:<Arch2HingeUniformBMD/>, formulas:[
    {label:"竖向反力",formula:"R_A = R_C = \\frac{wL}{2}"},
    {label:"水平推力",formula:"H = \\frac{wL^2}{8f}\\cdot\\frac{1}{1+\\frac{I_c}{I}\\cdot\\frac{15f}{8L}}"},
    {label:"跨中弯矩",formula:"M_{中} = \\frac{wL^2}{8} - Hf"},
    {label:"超静定次数",formula:"\\text{一次超静定}"},
  ]},
  // 无铰拱
  { id:"arch-fixed-uniform", name:"均布载荷", group:"无铰拱", fbd:<ArchFixedUniformFBD/>, sfd:<ArchFixedUniformSFD/>, bmd:<ArchFixedUniformBMD/>, formulas:[
    {label:"水平推力",formula:"H \\approx \\frac{wL^2}{8f}"},
    {label:"端部弯矩",formula:"M_{端} \\approx -\\frac{wL^2}{12}"},
    {label:"跨中弯矩",formula:"M_{中} \\approx \\frac{wL^2}{24}"},
    {label:"超静定次数",formula:"\\text{三次超静定}"},
  ]},
];

// 基础公式数据
interface BasicFormula {
  id: string;
  name: string;
  group: string;
  formulas: FormulaItem[];
  params: string; // 参数说明
}

const BASIC_FORMULAS: BasicFormula[] = [
  // 应力与应变
  { id:"stress-basic", name:"正应力", group:"应力与应变", params:"σ-正应力 N-轴力 A-截面积 ε-应变 ΔL-伸长量 L-原长 E-弹性模量 ν-泊松比 ε'-横向应变", formulas:[
    {label:"正应力定义",formula:"\\sigma = \\frac{N}{A}"},
    {label:"轴向应变",formula:"\\varepsilon = \\frac{\\Delta L}{L}"},
    {label:"胡克定律",formula:"\\sigma = E \\varepsilon"},
    {label:"泊松比",formula:"\\nu = -\\frac{\\varepsilon'}{\\varepsilon}"},
  ]},
  { id:"shear-stress", name:"剪应力", group:"应力与应变", params:"τ-剪应力 V-剪力 A-截面积 γ-剪应变 G-剪切模量 E-弹性模量 ν-泊松比", formulas:[
    {label:"平均剪应力",formula:"\\tau = \\frac{V}{A}"},
    {label:"剪应变",formula:"\\gamma = \\frac{\\Delta s}{h}"},
    {label:"剪切胡克定律",formula:"\\tau = G \\gamma"},
    {label:"剪切模量",formula:"G = \\frac{E}{2(1+\\nu)}"},
  ]},
  { id:"strain-energy", name:"应变能", group:"应力与应变", params:"U-应变能 u-应变能密度 N-轴力 M-弯矩 T-扭矩 E-弹性模量 I-惯性矩 G-剪切模量 Ip-极惯性矩", formulas:[
    {label:"应变能密度",formula:"u = \\frac{1}{2}\\sigma\\varepsilon = \\frac{\\sigma^2}{2E}"},
    {label:"轴向应变能",formula:"U = \\frac{N^2L}{2EA}"},
    {label:"弯曲应变能",formula:"U = \\int\\frac{M^2}{2EI}dx"},
    {label:"扭转应变能",formula:"U = \\frac{T^2L}{2GI_p}"},
  ]},
  
  // 轴向载荷
  { id:"axial-deform", name:"轴向变形", group:"轴向载荷", params:"ΔL-变形量 N-轴力 L-长度 E-弹性模量 A-截面积 ρ-密度 g-重力加速度 α-线膨胀系数 ΔT-温度变化", formulas:[
    {label:"轴向变形",formula:"\\Delta L = \\frac{NL}{EA}"},
    {label:"变截面杆",formula:"\\Delta L = \\sum\\frac{N_iL_i}{E_iA_i}"},
    {label:"自重作用",formula:"\\Delta L = \\frac{\\rho gL^2}{2E}"},
    {label:"温度应力",formula:"\\sigma_T = E\\alpha\\Delta T"},
  ]},
  { id:"statically-indeterminate", name:"静不定问题", group:"轴向载荷", params:"ΔL-变形量 F-力 求解步骤：建立平衡方程、变形协调方程、物理方程（胡克定律）", formulas:[
    {label:"变形协调",formula:"\\Delta L_1 + \\Delta L_2 = 0"},
    {label:"平衡方程",formula:"\\sum F = 0"},
    {label:"组合求解",formula:"\\text{平衡 + 变形协调 + 物理关系}"},
  ]},
  
  // 扭转
  { id:"torsion-basic", name:"圆轴扭转", group:"扭转", params:"τ-剪应力 T-扭矩 ρ-到圆心距离 Ip-极惯性矩 Wp-抗扭截面模量 φ-扭转角 G-剪切模量 L-长度", formulas:[
    {label:"剪应力分布",formula:"\\tau = \\frac{T\\rho}{I_p}"},
    {label:"最大剪应力",formula:"\\tau_{max} = \\frac{T}{W_p}"},
    {label:"扭转角",formula:"\\varphi = \\frac{TL}{GI_p}"},
    {label:"单位扭转角",formula:"\\theta = \\frac{T}{GI_p}"},
  ]},
  { id:"torsion-section", name:"截面特性(扭转)", group:"扭转", params:"Ip-极惯性矩 Wp-抗扭截面模量 d-直径(实心) D-外径 d-内径(空心) r-半径", formulas:[
    {label:"实心圆",formula:"I_p = \\frac{\\pi d^4}{32}, W_p = \\frac{\\pi d^3}{16}"},
    {label:"空心圆",formula:"I_p = \\frac{\\pi(D^4-d^4)}{32}"},
    {label:"抗扭截面模量",formula:"W_p = \\frac{I_p}{r_{max}}"},
  ]},
  
  // 弯曲应力
  { id:"bending-stress", name:"弯曲正应力", group:"弯曲", params:"σ-正应力 M-弯矩 y-到中性轴距离 I-惯性矩 W-截面模量 ymax-最大距离", formulas:[
    {label:"弯曲正应力",formula:"\\sigma = \\frac{My}{I}"},
    {label:"最大弯曲应力",formula:"\\sigma_{max} = \\frac{M}{W}"},
    {label:"截面模量",formula:"W = \\frac{I}{y_{max}}"},
    {label:"中性轴",formula:"\\int_A y dA = 0"},
  ]},
  { id:"shear-stress-beam", name:"弯曲剪应力", group:"弯曲", params:"τ-剪应力 V-剪力 S*-静矩 I-惯性矩 b-截面宽度 A-截面积 A*-截断面积", formulas:[
    {label:"剪应力公式",formula:"\\tau = \\frac{VS^*}{Ib}"},
    {label:"静矩",formula:"S^* = \\int_{A^*} y dA"},
    {label:"矩形截面最大",formula:"\\tau_{max} = \\frac{3V}{2A}"},
    {label:"圆形截面最大",formula:"\\tau_{max} = \\frac{4V}{3A}"},
  ]},
  
  // 弯曲变形
  { id:"deflection", name:"挠度与转角", group:"弯曲变形", params:"y-挠度 θ-转角 M-弯矩 E-弹性模量 I-惯性矩 ρ-曲率半径 x-位置坐标", formulas:[
    {label:"挠曲线方程",formula:"EI\\frac{d^2y}{dx^2} = M(x)"},
    {label:"转角",formula:"\\theta = \\frac{dy}{dx}"},
    {label:"曲率",formula:"\\frac{1}{\\rho} = \\frac{M}{EI}"},
    {label:"叠加法",formula:"y = y_1 + y_2 + ..."},
  ]},
  { id:"deflection-common", name:"常用挠度", group:"弯曲变形", params:"ymax-最大挠度 P-集中力 q-均布载荷 L-梁长 E-弹性模量 I-惯性矩", formulas:[
    {label:"悬臂梁端部集中力",formula:"y_{max} = \\frac{PL^3}{3EI}"},
    {label:"简支梁跨中集中力",formula:"y_{max} = \\frac{PL^3}{48EI}"},
    {label:"简支梁均布载荷",formula:"y_{max} = \\frac{5qL^4}{384EI}"},
  ]},
  
  // 应力状态
  { id:"stress-transform", name:"应力变换", group:"应力状态", params:"σα-斜截面正应力 τα-斜截面剪应力 σx,σy-正应力分量 τxy-剪应力分量 α-斜截面角度 α0-主方向角", formulas:[
    {label:"斜截面正应力",formula:"\\sigma_\\alpha = \\frac{\\sigma_x+\\sigma_y}{2}+\\frac{\\sigma_x-\\sigma_y}{2}\\cos2\\alpha+\\tau_{xy}\\sin2\\alpha"},
    {label:"斜截面剪应力",formula:"\\tau_\\alpha = -\\frac{\\sigma_x-\\sigma_y}{2}\\sin2\\alpha+\\tau_{xy}\\cos2\\alpha"},
    {label:"主应力方向",formula:"\\tan2\\alpha_0 = \\frac{2\\tau_{xy}}{\\sigma_x-\\sigma_y}"},
  ]},
  { id:"principal-stress", name:"主应力", group:"应力状态", params:"σ1,σ2-主应力 τmax-最大剪应力 R-莫尔圆半径 σx,σy-正应力分量 τxy-剪应力分量", formulas:[
    {label:"主应力公式",formula:"\\sigma_{1,2} = \\frac{\\sigma_x+\\sigma_y}{2}\\pm\\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2+\\tau_{xy}^2}"},
    {label:"面内最大剪应力",formula:"\\tau_{max} = \\frac{\\sigma_1-\\sigma_2}{2}"},
    {label:"莫尔圆半径",formula:"R = \\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2+\\tau_{xy}^2}"},
  ]},
  
  // 强度理论
  { id:"strength-theory", name:"强度理论", group:"强度理论", params:"σ1,σ2,σ3-主应力(σ1≥σ2≥σ3) [σ]-许用应力 ν-泊松比 第一:最大拉应力 第三:最大剪应力 第四:畸变能", formulas:[
    {label:"第一强度理论",formula:"\\sigma_1 \\leq [\\sigma]"},
    {label:"第二强度理论",formula:"\\sigma_1 - \\nu(\\sigma_2+\\sigma_3) \\leq [\\sigma]"},
    {label:"第三强度理论",formula:"\\sigma_1 - \\sigma_3 \\leq [\\sigma]"},
    {label:"第四强度理论",formula:"\\sqrt{\\frac{1}{2}[(\\sigma_1-\\sigma_2)^2+(\\sigma_2-\\sigma_3)^2+(\\sigma_3-\\sigma_1)^2]} \\leq [\\sigma]"},
  ]},
  { id:"von-mises", name:"von Mises应力", group:"强度理论", params:"σeq-等效应力(von Mises应力) σx,σy-正应力 τxy-剪应力 σ1,σ2-主应力 τ-剪应力", formulas:[
    {label:"等效应力",formula:"\\sigma_{eq} = \\sqrt{\\sigma_x^2-\\sigma_x\\sigma_y+\\sigma_y^2+3\\tau_{xy}^2}"},
    {label:"平面应力",formula:"\\sigma_{eq} = \\sqrt{\\sigma_1^2-\\sigma_1\\sigma_2+\\sigma_2^2}"},
    {label:"纯剪切",formula:"\\sigma_{eq} = \\sqrt{3}\\tau"},
  ]},
  
  // 组合变形
  { id:"combined", name:"组合变形", group:"组合变形", params:"σ-正应力 N-轴力 A-截面积 M-弯矩 I-惯性矩 y-距中性轴距离 e-偏心距 i-回转半径 ρ-截面核心半径", formulas:[
    {label:"拉弯组合",formula:"\\sigma = \\frac{N}{A} \\pm \\frac{My}{I}"},
    {label:"弯扭组合（第三强度理论）",formula:"\\sigma_{eq} = \\sqrt{\\sigma^2+4\\tau^2}"},
    {label:"偏心压缩",formula:"\\sigma = \\frac{N}{A}(1\\pm\\frac{ey}{i^2})"},
    {label:"截面核心",formula:"\\rho = \\frac{i^2}{y_{max}}"},
  ]},
  
  // 压杆稳定
  { id:"buckling", name:"压杆稳定", group:"压杆稳定", params:"Pcr-临界力 σcr-临界应力 E-弹性模量 I-惯性矩 μ-长度系数 L-杆长 λ-柔度(长细比) i-回转半径 A-截面积", formulas:[
    {label:"欧拉公式",formula:"P_{cr} = \\frac{\\pi^2EI}{(\\mu L)^2}"},
    {label:"临界应力",formula:"\\sigma_{cr} = \\frac{\\pi^2E}{\\lambda^2}"},
    {label:"柔度",formula:"\\lambda = \\frac{\\mu L}{i}"},
    {label:"回转半径",formula:"i = \\sqrt{\\frac{I}{A}}"},
  ]},
  { id:"buckling-factor", name:"长度系数", group:"压杆稳定", params:"μ-长度系数 取决于杆端约束条件 μL为计算长度", formulas:[
    {label:"两端铰支",formula:"\\mu = 1"},
    {label:"一端固定一端自由",formula:"\\mu = 2"},
    {label:"两端固定",formula:"\\mu = 0.5"},
    {label:"一端固定一端铰支",formula:"\\mu = 0.7"},
  ]},
  
  // 能量法
  { id:"energy-method", name:"能量法", group:"能量法", params:"δ-位移 U-应变能 P-外力 M-弯矩 M̄-单位力作用下的弯矩 N-轴力 N̄-单位力作用下的轴力 E-弹性模量 I-惯性矩", formulas:[
    {label:"卡氏定理",formula:"\\delta_i = \\frac{\\partial U}{\\partial P_i}"},
    {label:"莫尔积分",formula:"\\delta = \\int\\frac{M\\bar{M}}{EI}dx"},
    {label:"单位载荷法",formula:"\\delta = \\sum\\frac{N\\bar{N}L}{EA}+\\sum\\int\\frac{M\\bar{M}}{EI}dx"},
    {label:"虚功原理",formula:"\\sum P_i\\delta_i = \\int\\sigma\\varepsilon dV"},
  ]},
  
  // 疲劳强度
  { id:"fatigue", name:"疲劳强度", group:"疲劳强度", params:"σa-应力幅 σm-平均应力 σmax-最大应力 σmin-最小应力 r-应力比 σ-1-对称循环疲劳极限", formulas:[
    {label:"应力幅",formula:"\\sigma_a = \\frac{\\sigma_{max}-\\sigma_{min}}{2}"},
    {label:"平均应力",formula:"\\sigma_m = \\frac{\\sigma_{max}+\\sigma_{min}}{2}"},
    {label:"应力比",formula:"r = \\frac{\\sigma_{min}}{\\sigma_{max}}"},
    {label:"疲劳极限",formula:"\\sigma_{-1} \\text{ (对称循环)}"},
  ]},
];

// 截面特性数据
const SECTION_FORMULAS: SectionFormula[] = [
  { id:"rect", name:"矩形", group:"基本截面", diagram:(<svg viewBox="0 0 80 70"><rect x="15" y="8" width="50" height="54" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2"/><line x1="15" y1="35" x2="65" y2="35" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2"/><text x="40" y="68" textAnchor="middle" fill="#64748b" fontSize="10">b</text><text x="73" y="38" fill="#64748b" fontSize="10">h</text></svg>), formulas:[{label:"A",formula:"A=bh"},{label:"Ix",formula:"I_x=\\frac{bh^3}{12}"},{label:"Wx",formula:"W_x=\\frac{bh^2}{6}"}] },
  { id:"circle", name:"圆形", group:"基本截面", diagram:(<svg viewBox="0 0 80 70"><circle cx="40" cy="35" r="27" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2"/><line x1="40" y1="35" x2="67" y2="35" stroke="#64748b" strokeWidth="1"/><text x="54" y="30" fill="#64748b" fontSize="10">r</text></svg>), formulas:[{label:"A",formula:"A=\\pi r^2"},{label:"I",formula:"I=\\frac{\\pi r^4}{4}"},{label:"W",formula:"W=\\frac{\\pi r^3}{4}"}] },
  { id:"hollow", name:"空心圆", group:"基本截面", diagram:(<svg viewBox="0 0 80 70"><circle cx="40" cy="35" r="27" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2"/><circle cx="40" cy="35" r="16" fill="white" stroke="#6366f1" strokeWidth="2"/><line x1="40" y1="35" x2="67" y2="35" stroke="#64748b"/><line x1="40" y1="35" x2="40" y2="19" stroke="#64748b"/><text x="54" y="31" fill="#64748b" fontSize="9">R</text><text x="43" y="27" fill="#64748b" fontSize="9">r</text></svg>), formulas:[{label:"A",formula:"A=\\pi(R^2-r^2)"},{label:"I",formula:"I=\\frac{\\pi(R^4-r^4)}{4}"}] },
  { id:"i-beam", name:"I型钢", group:"型钢截面", diagram:(<svg viewBox="0 0 80 70"><path d="M 15 8 L 65 8 L 65 18 L 47 18 L 47 52 L 65 52 L 65 62 L 15 62 L 15 52 L 33 52 L 33 18 L 15 18 Z" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2"/><text x="40" y="6" textAnchor="middle" fill="#64748b" fontSize="8">B</text><text x="70" y="38" fill="#64748b" fontSize="8">H</text><text x="5" y="17" fill="#64748b" fontSize="7">t_f</text><text x="49" y="37" fill="#64748b" fontSize="7">t_w</text></svg>), formulas:[{label:"A",formula:"A=2Bt_f+(H-2t_f)t_w"},{label:"Ix",formula:"I_x\\approx\\frac{BH^3-(B-t_w)(H-2t_f)^3}{12}"}] },
];

// 统一目录保留全部原有知识条目，梁与拱的公式和计算器共用已校验的模型。
export const FORMULA_REFERENCE_ENTRIES: FormulaWorkbenchEntry[] = [
  ...BASIC_FORMULAS.map(entry=>({...entry,kind:'basic' as const})),
  ...BEAM_FORMULAS.map(entry=>({...entry,kind:'beam' as const,
    formulas:correctedReferenceFormulas[entry.id]??entry.formulas,
    diagrams:{fbd:entry.fbd,sfd:entry.sfd,bmd:entry.bmd},
    calculator:FORMULA_BEAM_CALCULATORS[entry.id],
  })),
  ...SECTION_FORMULAS.map(entry=>({...entry,kind:'section' as const})),
];
export const FormulasModule = () => <FormulaWorkbench entries={FORMULA_REFERENCE_ENTRIES}/>;
