// ========== 三铰拱 - 均布载荷 (任意形状) ==========
export const Arch3HingeUniformFBD = () => (
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
export const Arch3HingeUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">Rₐ = Rc = wL/2</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">Hₐ = Hc = wL²/8f</text>
    <text x="30" y="70" fill="#64748b" fontSize="8">（竖向反力与简支梁相同）</text>
  </svg>
);
export const Arch3HingeUniformBMD = () => (
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
export const Arch3HingeCenterFBD = () => (
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
export const Arch3HingeCenterSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">轴力N</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 50 L 100 55 L 180 50" fill="none" stroke="#22c55e" strokeWidth="2" />
    <text x="100" y="68" textAnchor="middle" fill="#22c55e" fontSize="7">N (压力)</text>
  </svg>
);
export const Arch3HingeCenterBMD = () => (
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
export const Arch2HingeUniformFBD = () => (
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
export const Arch2HingeUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">R = wL/2</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">H = wL²/8f × k</text>
    <text x="30" y="70" fill="#64748b" fontSize="8">（一次超静定）</text>
  </svg>
);
export const Arch2HingeUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 Q 100 55 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="100" y="68" textAnchor="middle" fill="#f59e0b" fontSize="7">Mmax (跨中)</text>
  </svg>
);

// ========== 无铰拱 - 均布载荷 ==========
export const ArchFixedUniformFBD = () => (
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
export const ArchFixedUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">R = wL/2</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">H ≈ wL²/8f</text>
    <text x="30" y="70" fill="#64748b" fontSize="8">（三次超静定）</text>
  </svg>
);
export const ArchFixedUniformBMD = () => (
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
export const ArchHalfUniformFBD = () => (
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
export const ArchHalfUniformSFD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">反力</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <text x="30" y="30" fill="#3b82f6" fontSize="9">Rₐ = 3wL/8</text>
    <text x="30" y="50" fill="#3b82f6" fontSize="9">Rc = wL/8</text>
    <text x="30" y="70" fill="#3b82f6" fontSize="9">H = wL²/16f</text>
  </svg>
);
export const ArchHalfUniformBMD = () => (
  <svg viewBox="0 0 200 80" className="w-full h-auto">
    <text x="5" y="12" fill="#64748b" fontSize="9" fontWeight="bold">BMD</text>
    <line x1="20" y1="40" x2="180" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="15" x2="20" y2="65" stroke="#94a3b8" strokeWidth="1" />
    <path d="M 20 40 Q 60 60 100 40 Q 140 25 180 40" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="2" />
    <text x="60" y="68" fill="#f59e0b" fontSize="7">+M</text>
    <text x="140" y="22" fill="#f59e0b" fontSize="7">-M</text>
  </svg>
);
