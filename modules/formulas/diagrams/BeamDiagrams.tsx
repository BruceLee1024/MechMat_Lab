// ========== 简支梁 - 跨中集中力 ==========
export const SSCenterFBD = () => (
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
export const SSCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 100 20 L 100 60 L 180 60" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="55" y="16" textAnchor="middle" fill="#22c55e" fontSize="8">+P/2</text>
    <text x="140" y="72" textAnchor="middle" fill="#22c55e" fontSize="8">-P/2</text>
  </svg>
);
export const SSCenterBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 100 65 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="75" textAnchor="middle" fill="#f59e0b" fontSize="8">Mmax=PL/4</text>
  </svg>
);

// ========== 简支梁 - 均布载荷 ==========
export const SSUniformFBD = () => (
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
export const SSUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 100 40 L 180 60" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="40" y="18" fill="#22c55e" fontSize="8">+qL/2</text>
    <text x="160" y="72" fill="#22c55e" fontSize="8">-qL/2</text>
  </svg>
);
export const SSUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 Q 100 80 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="75" textAnchor="middle" fill="#f59e0b" fontSize="8">Mmax=qL²/8</text>
  </svg>
);

// ========== 悬臂梁 - 端部集中力 ==========
export const CantEndFBD = () => (
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
export const CantEndSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 180 25" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="20" textAnchor="middle" fill="#22c55e" fontSize="8">V=P</text>
  </svg>
);
export const CantEndBMD = () => (
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
export const CantUniformFBD = () => (
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
export const CantUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="18" fill="#22c55e" fontSize="8">qL</text>
    <text x="175" y="52" fill="#22c55e" fontSize="8">0</text>
  </svg>
);
export const CantUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 65 Q 100 50 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="30" y="60" fill="#f59e0b" fontSize="8">Mmax=qL²/2</text>
  </svg>
);

// ========== 两端固定梁 - 跨中集中力 ==========
export const FixedCenterFBD = () => (
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
export const FixedCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 25 L 100 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="55" y="22" fill="#22c55e" fontSize="8">+P/2</text>
    <text x="140" y="68" fill="#22c55e" fontSize="8">-P/2</text>
  </svg>
);
export const FixedCenterBMD = () => (
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
export const SSPointFBD = () => (
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
export const SSPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 70 25 L 70 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="45" y="20" fill="#22c55e" fontSize="7">+Pb/L</text>
    <text x="125" y="68" fill="#22c55e" fontSize="7">-Pa/L</text>
  </svg>
);
export const SSPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 70 60 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="70" y="75" textAnchor="middle" fill="#f59e0b" fontSize="7">Mmax=Pab/L</text>
  </svg>
);

// ========== 简支梁 - 两点对称集中力 ==========
export const SSTwoPointFBD = () => (
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
export const SSTwoPointSFD = () => (
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
export const SSTwoPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 60 55 L 140 55 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="70" textAnchor="middle" fill="#f59e0b" fontSize="7">M=Pa (等弯矩段)</text>
  </svg>
);

// ========== 简支梁 - 三角形载荷 ==========
export const SSTriangularFBD = () => (
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
export const SSTriangularSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 30 Q 100 35 180 60" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="25" fill="#22c55e" fontSize="7">+qL/6</text>
    <text x="165" y="72" fill="#22c55e" fontSize="7">-qL/3</text>
  </svg>
);
export const SSTriangularBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 Q 80 55 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="75" y="60" fill="#f59e0b" fontSize="7">Mmax=qL²/(9√3)</text>
  </svg>
);

// ========== 简支梁 - 端部弯矩 ==========
export const SSMomentFBD = () => (
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
export const SSMomentSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 180 50" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="62" textAnchor="middle" fill="#22c55e" fontSize="7">V=-M/L (常数)</text>
  </svg>
);
export const SSMomentBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 180 20" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="180" y="16" fill="#f59e0b" fontSize="7">M</text>
  </svg>
);

// ========== 悬臂梁 - 任意位置集中力 ==========
export const CantPointFBD = () => (
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
export const CantPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 25 L 100 40 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="60" y="20" fill="#22c55e" fontSize="7">V=P</text>
    <text x="140" y="52" fill="#22c55e" fontSize="7">V=0</text>
  </svg>
);
export const CantPointBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 60 L 100 15 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="30" y="55" fill="#f59e0b" fontSize="7">M₀=Pa</text>
  </svg>
);

// ========== 悬臂梁 - 端部弯矩 ==========
export const CantMomentFBD = () => (
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
export const CantMomentSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="52" textAnchor="middle" fill="#22c55e" fontSize="7">V=0</text>
  </svg>
);
export const CantMomentBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 180 25" fill="none" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="20" textAnchor="middle" fill="#f59e0b" fontSize="7">M=M (常数)</text>
  </svg>
);

// ========== 悬臂梁 - 三角形载荷 ==========
export const CantTriangularFBD = () => (
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
export const CantTriangularSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 Q 100 30 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="16" fill="#22c55e" fontSize="7">qL/2</text>
  </svg>
);
export const CantTriangularBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 60 Q 80 40 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="30" y="55" fill="#f59e0b" fontSize="7">M₀=qL²/6</text>
  </svg>
);

// ========== 两端固定梁 - 均布载荷 ==========
export const FixedUniformFBD = () => (
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
export const FixedUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 100 40 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="20" fill="#22c55e" fontSize="7">+qL/2</text>
    <text x="165" y="68" fill="#22c55e" fontSize="7">-qL/2</text>
  </svg>
);
export const FixedUniformBMD = () => (
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
export const OverhangFBD = () => (
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
export const OverhangSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 120 50 L 120 25 L 180 25" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="70" y="62" fill="#22c55e" fontSize="7">-Pa/L</text>
    <text x="150" y="20" fill="#22c55e" fontSize="7">+P</text>
  </svg>
);
export const OverhangBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 120 60 L 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="120" y="72" fill="#f59e0b" fontSize="7">M=-Pa</text>
  </svg>
);

// ========== 外伸梁 - 悬臂段均布载荷 ==========
export const OverhangUniformFBD = () => (
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
export const OverhangUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 120 50 L 120 25 L 180 40" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="70" y="62" fill="#22c55e" fontSize="7">-qa²/2L</text>
    <text x="140" y="20" fill="#22c55e" fontSize="7">qa</text>
  </svg>
);
export const OverhangUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 L 120 55 Q 150 60 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="120" y="68" fill="#f59e0b" fontSize="7">M=-qa²/2</text>
  </svg>
);

// ========== 一端固定一端简支 - 跨中集中力 ==========
export const ProppedCenterFBD = () => (
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
export const ProppedCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 22 L 100 22 L 100 58 L 180 58" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="55" y="18" fill="#22c55e" fontSize="7">+11P/16</text>
    <text x="140" y="70" fill="#22c55e" fontSize="7">-5P/16</text>
  </svg>
);
export const ProppedCenterBMD = () => (
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
export const ProppedUniformFBD = () => (
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
export const ProppedUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 20 L 100 40 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="30" y="16" fill="#22c55e" fontSize="7">+5qL/8</text>
    <text x="165" y="68" fill="#22c55e" fontSize="7">-3qL/8</text>
  </svg>
);
export const ProppedUniformBMD = () => (
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
export const SSPartialFBD = () => (
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
export const SSPartialSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 28 L 60 28 L 140 52 L 180 52" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="40" y="24" fill="#22c55e" fontSize="7">+R₁</text>
    <text x="160" y="64" fill="#22c55e" fontSize="7">-R₂</text>
  </svg>
);
export const SSPartialBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="15" x2="180" y2="15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 15 L 60 35 Q 100 60 140 35 L 180 15" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="70" textAnchor="middle" fill="#f59e0b" fontSize="7">Mmax</text>
  </svg>
);

// ========== 两端固定梁 - 任意位置集中力 ==========
export const FixedPointFBD = () => (
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
export const FixedPointSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 25 L 70 25 L 70 55 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="45" y="20" fill="#22c55e" fontSize="7">+Pb²(3a+b)/L³</text>
    <text x="125" y="68" fill="#22c55e" fontSize="6">-Pa²(a+3b)/L³</text>
  </svg>
);
export const FixedPointBMD = () => (
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
export const ContinuousFBD = () => (
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
export const ContinuousSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">SFD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 28 L 55 40 L 55 55 L 100 28 L 100 55 L 145 40 L 145 28 L 180 55" fill="none" stroke="#22c55e" strokeWidth="2" />
  </svg>
);
export const ContinuousBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="10" x2="20" y2="70" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 Q 55 60 100 25 Q 145 60 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="20" fill="#f59e0b" fontSize="6">-qL²/8</text>
    <text x="55" y="68" fill="#f59e0b" fontSize="6">+9qL²/128</text>
  </svg>
);
