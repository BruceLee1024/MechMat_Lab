// 计算器配置 - 定义每种梁的输入参数和计算函数
export const CALCULATOR_CONFIG: Record<string, {
  inputs: { key: string; label: string; unit: string; default: number }[];
  calculate: (inputs: Record<string, number>) => { label: string; value: number; unit: string; formula: string }[];
}> = {
  "ss-center": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P * 1000; // kN -> N
      const L = inp.L * 1000; // m -> mm
      const E = inp.E * 1000; // GPa -> MPa
      const I = inp.I * 1e6; // ×10⁶mm⁴ -> mm⁴
      const R = P / 2;
      const Mmax = P * L / 4;
      const deltaMax = (P * Math.pow(L, 3)) / (48 * E * I);
      const thetaMax = (P * Math.pow(L, 2)) / (16 * E * I);
      return [
        { label: "支座反力 R", value: R / 1000, unit: "kN", formula: "R = P/2" },
        { label: "最大弯矩 Mmax", value: Mmax / 1e6, unit: "kN·m", formula: "Mmax = PL/4" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = PL³/48EI" },
        { label: "端部转角 θmax", value: thetaMax * 1000, unit: "×10⁻³ rad", formula: "θmax = PL²/16EI" },
      ];
    },
  },
  "ss-uniform": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 5 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const q = inp.q; // kN/m
      const L = inp.L; // m
      const E = inp.E * 1e9; // GPa -> Pa
      const I = inp.I * 1e-6; // ×10⁶mm⁴ -> m⁴
      const R = q * L / 2;
      const Mmax = q * L * L / 8;
      const deltaMax = (5 * q * Math.pow(L, 4)) / (384 * E * I) * 1000; // m -> mm
      const thetaMax = (q * Math.pow(L, 3)) / (24 * E * I);
      return [
        { label: "支座反力 R", value: R, unit: "kN", formula: "R = qL/2" },
        { label: "最大弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = qL²/8" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = 5qL⁴/384EI" },
        { label: "端部转角 θmax", value: thetaMax * 1000, unit: "×10⁻³ rad", formula: "θmax = qL³/24EI" },
      ];
    },
  },
  "cant-end": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 3 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 50 },
    ],
    calculate: (inp) => {
      const P = inp.P; // kN
      const L = inp.L; // m
      const E = inp.E * 1e9; // GPa -> Pa
      const I = inp.I * 1e-6; // ×10⁶mm⁴ -> m⁴
      const R = P;
      const M0 = P * L;
      const deltaMax = (P * Math.pow(L, 3)) / (3 * E * I) * 1000; // m -> mm
      const thetaMax = (P * Math.pow(L, 2)) / (2 * E * I);
      return [
        { label: "固定端反力 R", value: R, unit: "kN", formula: "R = P" },
        { label: "固定端弯矩 M₀", value: M0, unit: "kN·m", formula: "M₀ = PL" },
        { label: "自由端挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = PL³/3EI" },
        { label: "自由端转角 θmax", value: thetaMax * 1000, unit: "×10⁻³ rad", formula: "θmax = PL²/2EI" },
      ];
    },
  },
  "cant-uniform": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 5 },
      { key: "L", label: "梁长 L", unit: "m", default: 3 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 50 },
    ],
    calculate: (inp) => {
      const q = inp.q;
      const L = inp.L;
      const E = inp.E * 1e9;
      const I = inp.I * 1e-6;
      const R = q * L;
      const M0 = q * L * L / 2;
      const deltaMax = (q * Math.pow(L, 4)) / (8 * E * I) * 1000;
      const thetaMax = (q * Math.pow(L, 3)) / (6 * E * I);
      return [
        { label: "固定端反力 R", value: R, unit: "kN", formula: "R = qL" },
        { label: "固定端弯矩 M₀", value: M0, unit: "kN·m", formula: "M₀ = qL²/2" },
        { label: "自由端挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = qL⁴/8EI" },
        { label: "自由端转角 θmax", value: thetaMax * 1000, unit: "×10⁻³ rad", formula: "θmax = qL³/6EI" },
      ];
    },
  },
  // 简支梁 - 任意位置集中力
  "ss-point": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "a", label: "左侧距离 a", unit: "m", default: 2 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, a = inp.a, E = inp.E * 1e9, I = inp.I * 1e-6;
      const b = L - a;
      const R1 = P * b / L;
      const R2 = P * a / L;
      const Mmax = P * a * b / L;
      const deltaA = (P * a * a * b * b) / (3 * E * I * L) * 1000;
      return [
        { label: "左支座反力 R₁", value: R1, unit: "kN", formula: "R₁ = Pb/L" },
        { label: "右支座反力 R₂", value: R2, unit: "kN", formula: "R₂ = Pa/L" },
        { label: "最大弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = Pab/L" },
        { label: "载荷处挠度 δa", value: deltaA, unit: "mm", formula: "δa = Pa²b²/3EIL" },
      ];
    },
  },
  // 简支梁 - 两点对称集中力
  "ss-two-point": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "a", label: "载荷距端距离 a", unit: "m", default: 2 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, a = inp.a, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R = P;
      const M = P * a;
      const deltaMax = (P * a * (3 * L * L - 4 * a * a)) / (24 * E * I) * 1000;
      const theta = (P * a * (L - a)) / (E * I);
      return [
        { label: "支座反力 R", value: R, unit: "kN", formula: "R = P" },
        { label: "等弯矩段弯矩 M", value: M, unit: "kN·m", formula: "M = Pa" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = Pa(3L²-4a²)/24EI" },
        { label: "端部转角 θ", value: theta * 1000, unit: "×10⁻³ rad", formula: "θ = Pa(L-a)/EI" },
      ];
    },
  },
  // 简支梁 - 三角形载荷
  "ss-triangular": {
    inputs: [
      { key: "q", label: "最大载荷 q", unit: "kN/m", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R1 = q * L / 6;
      const R2 = q * L / 3;
      const Mmax = q * L * L / (9 * Math.sqrt(3));
      const deltaMax = 0.01304 * q * Math.pow(L, 4) / (E * I) * 1000;
      return [
        { label: "小端反力 R₁", value: R1, unit: "kN", formula: "R₁ = qL/6" },
        { label: "大端反力 R₂", value: R2, unit: "kN", formula: "R₂ = qL/3" },
        { label: "最大弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = qL²/9√3" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = 0.01304qL⁴/EI" },
      ];
    },
  },
  // 悬臂梁 - 任意位置集中力
  "cant-point": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 3 },
      { key: "a", label: "载荷距固定端 a", unit: "m", default: 2 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 50 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, a = inp.a, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R = P;
      const M0 = P * a;
      const deltaA = (P * Math.pow(a, 3)) / (3 * E * I) * 1000;
      const deltaEnd = (P * a * a * (3 * L - a)) / (6 * E * I) * 1000;
      return [
        { label: "固定端反力 R", value: R, unit: "kN", formula: "R = P" },
        { label: "固定端弯矩 M₀", value: M0, unit: "kN·m", formula: "M₀ = Pa" },
        { label: "载荷处挠度 δa", value: deltaA, unit: "mm", formula: "δa = Pa³/3EI" },
        { label: "自由端挠度 δ端", value: deltaEnd, unit: "mm", formula: "δ端 = Pa²(3L-a)/6EI" },
      ];
    },
  },
  // 悬臂梁 - 端部弯矩
  "cant-moment": {
    inputs: [
      { key: "M", label: "端部弯矩 M", unit: "kN·m", default: 20 },
      { key: "L", label: "梁长 L", unit: "m", default: 3 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 50 },
    ],
    calculate: (inp) => {
      const M = inp.M, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const deltaMax = (M * L * L) / (2 * E * I) * 1000;
      const thetaMax = (M * L) / (E * I);
      return [
        { label: "固定端反力 R", value: 0, unit: "kN", formula: "R = 0" },
        { label: "弯矩 (常数)", value: M, unit: "kN·m", formula: "M = M" },
        { label: "自由端挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = ML²/2EI" },
        { label: "自由端转角 θmax", value: thetaMax * 1000, unit: "×10⁻³ rad", formula: "θmax = ML/EI" },
      ];
    },
  },
  // 悬臂梁 - 三角形载荷
  "cant-triangular": {
    inputs: [
      { key: "q", label: "最大载荷 q", unit: "kN/m", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 3 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 50 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R = q * L / 2;
      const M0 = q * L * L / 6;
      const deltaMax = (q * Math.pow(L, 4)) / (30 * E * I) * 1000;
      const thetaMax = (q * Math.pow(L, 3)) / (24 * E * I);
      return [
        { label: "固定端反力 R", value: R, unit: "kN", formula: "R = qL/2" },
        { label: "固定端弯矩 M₀", value: M0, unit: "kN·m", formula: "M₀ = qL²/6" },
        { label: "自由端挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = qL⁴/30EI" },
        { label: "自由端转角 θmax", value: thetaMax * 1000, unit: "×10⁻³ rad", formula: "θmax = qL³/24EI" },
      ];
    },
  },
  // 两端固定梁 - 跨中集中力
  "fixed-center": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R = P / 2;
      const Mend = P * L / 8;
      const Mmid = P * L / 8;
      const deltaMax = (P * Math.pow(L, 3)) / (192 * E * I) * 1000;
      return [
        { label: "支座反力 R", value: R, unit: "kN", formula: "R = P/2" },
        { label: "端部弯矩 M端", value: Mend, unit: "kN·m", formula: "M端 = PL/8" },
        { label: "跨中弯矩 M中", value: Mmid, unit: "kN·m", formula: "M中 = PL/8" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = PL³/192EI" },
      ];
    },
  },
  // 两端固定梁 - 均布载荷
  "fixed-uniform": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 5 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R = q * L / 2;
      const Mend = q * L * L / 12;
      const Mmid = q * L * L / 24;
      const deltaMax = (q * Math.pow(L, 4)) / (384 * E * I) * 1000;
      return [
        { label: "支座反力 R", value: R, unit: "kN", formula: "R = qL/2" },
        { label: "端部弯矩 M端", value: Mend, unit: "kN·m", formula: "M端 = qL²/12" },
        { label: "跨中弯矩 M中", value: Mmid, unit: "kN·m", formula: "M中 = qL²/24" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = qL⁴/384EI" },
      ];
    },
  },
  // 外伸梁 - 悬臂端集中力
  "overhang": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "跨度 L", unit: "m", default: 6 },
      { key: "a", label: "悬臂长度 a", unit: "m", default: 2 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, a = inp.a, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R1 = -P * a / L;
      const R2 = P * (1 + a / L);
      const M = -P * a;
      const delta = (P * a * a * (L + a)) / (3 * E * I) * 1000;
      return [
        { label: "左支座反力 R₁", value: R1, unit: "kN", formula: "R₁ = -Pa/L" },
        { label: "右支座反力 R₂", value: R2, unit: "kN", formula: "R₂ = P(1+a/L)" },
        { label: "支座处弯矩 M", value: M, unit: "kN·m", formula: "M = -Pa" },
        { label: "自由端挠度 δ", value: delta, unit: "mm", formula: "δ = Pa²(L+a)/3EI" },
      ];
    },
  },
  // 一端固定一端简支 - 跨中集中力
  "propped-center": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const RA = 11 * P / 16;
      const RB = 5 * P / 16;
      const MA = 3 * P * L / 16;
      const Mmax = 5 * P * L / 32;
      const deltaMax = (P * Math.pow(L, 3)) / (48 * E * I * Math.sqrt(5)) * 1000;
      return [
        { label: "固定端反力 RA", value: RA, unit: "kN", formula: "RA = 11P/16" },
        { label: "简支端反力 RB", value: RB, unit: "kN", formula: "RB = 5P/16" },
        { label: "固定端弯矩 MA", value: MA, unit: "kN·m", formula: "MA = 3PL/16" },
        { label: "最大正弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = 5PL/32" },
      ];
    },
  },
  // 一端固定一端简支 - 均布载荷
  "propped-uniform": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 5 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const RA = 5 * q * L / 8;
      const RB = 3 * q * L / 8;
      const MA = q * L * L / 8;
      const MmaxPos = 9 * q * L * L / 128;
      const deltaMax = (q * Math.pow(L, 4)) / (185 * E * I) * 1000;
      return [
        { label: "固定端反力 RA", value: RA, unit: "kN", formula: "RA = 5qL/8" },
        { label: "简支端反力 RB", value: RB, unit: "kN", formula: "RB = 3qL/8" },
        { label: "固定端弯矩 MA", value: MA, unit: "kN·m", formula: "MA = qL²/8" },
        { label: "最大正弯矩 Mmax⁺", value: MmaxPos, unit: "kN·m", formula: "Mmax⁺ = 9qL²/128" },
      ];
    },
  },
  // 三铰拱 - 均布载荷
  "arch-3hinge-uniform": {
    inputs: [
      { key: "w", label: "均布载荷 w", unit: "kN/m", default: 10 },
      { key: "L", label: "跨度 L", unit: "m", default: 20 },
      { key: "f", label: "矢高 f", unit: "m", default: 5 },
    ],
    calculate: (inp) => {
      const w = inp.w, L = inp.L, f = inp.f;
      const R = w * L / 2;
      const H = w * L * L / (8 * f);
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = wL/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = wL²/8f" },
        { label: "推力/反力比", value: H / R, unit: "", formula: "H/R = L/4f" },
        { label: "抛物线拱弯矩", value: 0, unit: "kN·m", formula: "M = 0 (全拱)" },
      ];
    },
  },
  // 三铰拱 - 跨中集中力
  "arch-3hinge-center": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 100 },
      { key: "L", label: "跨度 L", unit: "m", default: 20 },
      { key: "f", label: "矢高 f", unit: "m", default: 5 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, f = inp.f;
      const R = P / 2;
      const H = P * L / (4 * f);
      const Mmax = P * L / 4 - H * f;
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = P/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = PL/4f" },
        { label: "最大弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = PL/4 - Hf" },
        { label: "推力/反力比", value: H / R, unit: "", formula: "H/R = L/2f" },
      ];
    },
  },
  // 三铰拱 - 半跨均布载荷
  "arch-half-uniform": {
    inputs: [
      { key: "w", label: "均布载荷 w", unit: "kN/m", default: 10 },
      { key: "L", label: "跨度 L", unit: "m", default: 20 },
      { key: "f", label: "矢高 f", unit: "m", default: 5 },
    ],
    calculate: (inp) => {
      const w = inp.w, L = inp.L, f = inp.f;
      const H = w * L * L / (16 * f);
      const RA = 3 * w * L / 8;
      const RC = w * L / 8;
      const Mmax = w * L * L / 16;
      return [
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = wL²/16f" },
        { label: "左支座反力 RA", value: RA, unit: "kN", formula: "RA = 3wL/8" },
        { label: "右支座反力 RC", value: RC, unit: "kN", formula: "RC = wL/8" },
        { label: "最大弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = wL²/16" },
      ];
    },
  },
  // 两铰拱 - 均布载荷
  "arch-2hinge-uniform": {
    inputs: [
      { key: "w", label: "均布载荷 w", unit: "kN/m", default: 10 },
      { key: "L", label: "跨度 L", unit: "m", default: 20 },
      { key: "f", label: "矢高 f", unit: "m", default: 5 },
    ],
    calculate: (inp) => {
      const w = inp.w, L = inp.L, f = inp.f;
      const R = w * L / 2;
      // 简化计算，假设 k ≈ 1 (对于常见的 f/L 比例)
      const H = w * L * L / (8 * f);
      const Mmid = w * L * L / 8 - H * f;
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = wL/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H ≈ wL²/8f" },
        { label: "跨中弯矩 M中", value: Mmid, unit: "kN·m", formula: "M中 = wL²/8 - Hf" },
        { label: "超静定次数", value: 1, unit: "次", formula: "一次超静定" },
      ];
    },
  },
  // 无铰拱 - 均布载荷
  "arch-fixed-uniform": {
    inputs: [
      { key: "w", label: "均布载荷 w", unit: "kN/m", default: 10 },
      { key: "L", label: "跨度 L", unit: "m", default: 20 },
      { key: "f", label: "矢高 f", unit: "m", default: 5 },
    ],
    calculate: (inp) => {
      const w = inp.w, L = inp.L, f = inp.f;
      const R = w * L / 2;
      const H = w * L * L / (8 * f);
      const Mend = -w * L * L / 12;
      const Mmid = w * L * L / 24;
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = wL/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H ≈ wL²/8f" },
        { label: "端部弯矩 M端", value: Mend, unit: "kN·m", formula: "M端 ≈ -wL²/12" },
        { label: "跨中弯矩 M中", value: Mmid, unit: "kN·m", formula: "M中 ≈ wL²/24" },
      ];
    },
  },
  // 简支梁 - 端部弯矩
  "ss-moment": {
    inputs: [
      { key: "M", label: "端部弯矩 M", unit: "kN·m", default: 20 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const M = inp.M, L = inp.L, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R = M / L;
      const theta1 = (M * L) / (3 * E * I);
      const theta2 = (M * L) / (6 * E * I);
      const deltaMax = (M * L * L) / (9 * Math.sqrt(3) * E * I) * 1000;
      return [
        { label: "支座反力 R", value: R, unit: "kN", formula: "R = M/L" },
        { label: "剪力 V (常数)", value: -R, unit: "kN", formula: "V = -M/L" },
        { label: "左端转角 θ₁", value: theta1 * 1000, unit: "×10⁻³ rad", formula: "θ₁ = ML/3EI" },
        { label: "右端转角 θ₂", value: theta2 * 1000, unit: "×10⁻³ rad", formula: "θ₂ = ML/6EI" },
      ];
    },
  },
  // 简支梁 - 部分均布载荷
  "ss-partial": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "a", label: "左侧空白 a", unit: "m", default: 1 },
      { key: "c", label: "载荷长度 c", unit: "m", default: 3 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L, a = inp.a, c = inp.c;
      const b = L - a - c;
      const R1 = q * c * (2 * b + c) / (2 * L);
      const R2 = q * c * (2 * a + c) / (2 * L);
      const xmax = a + R1 / q;
      const Mmax = R1 * (a + R1 / q) - q / 2 * Math.pow(R1 / q, 2);
      return [
        { label: "左支座反力 R₁", value: R1, unit: "kN", formula: "R₁ = qc(2b+c)/2L" },
        { label: "右支座反力 R₂", value: R2, unit: "kN", formula: "R₂ = qc(2a+c)/2L" },
        { label: "最大弯矩位置 x", value: xmax, unit: "m", formula: "x = a + R₁/q" },
        { label: "最大弯矩 Mmax", value: Mmax, unit: "kN·m", formula: "Mmax = R₁x - q(x-a)²/2" },
      ];
    },
  },
  // 两端固定梁 - 任意位置集中力
  "fixed-point": {
    inputs: [
      { key: "P", label: "集中力 P", unit: "kN", default: 10 },
      { key: "L", label: "梁长 L", unit: "m", default: 6 },
      { key: "a", label: "左侧距离 a", unit: "m", default: 2 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const P = inp.P, L = inp.L, a = inp.a, E = inp.E * 1e9, I = inp.I * 1e-6;
      const b = L - a;
      const R1 = P * b * b * (3 * a + b) / Math.pow(L, 3);
      const R2 = P * a * a * (a + 3 * b) / Math.pow(L, 3);
      const M1 = P * a * b * b / (L * L);
      const M2 = P * a * a * b / (L * L);
      const deltaA = (P * Math.pow(a, 3) * Math.pow(b, 3)) / (3 * E * I * Math.pow(L, 3)) * 1000;
      return [
        { label: "左支座反力 R₁", value: R1, unit: "kN", formula: "R₁ = Pb²(3a+b)/L³" },
        { label: "右支座反力 R₂", value: R2, unit: "kN", formula: "R₂ = Pa²(a+3b)/L³" },
        { label: "左端弯矩 M₁", value: M1, unit: "kN·m", formula: "M₁ = Pab²/L²" },
        { label: "右端弯矩 M₂", value: M2, unit: "kN·m", formula: "M₂ = Pa²b/L²" },
      ];
    },
  },
  // 外伸梁 - 悬臂段均布载荷
  "overhang-uniform": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 5 },
      { key: "L", label: "跨度 L", unit: "m", default: 6 },
      { key: "a", label: "悬臂长度 a", unit: "m", default: 2 },
      { key: "E", label: "弹性模量 E", unit: "GPa", default: 200 },
      { key: "I", label: "惯性矩 I", unit: "×10⁶mm⁴", default: 100 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L, a = inp.a, E = inp.E * 1e9, I = inp.I * 1e-6;
      const R1 = -q * a * a / (2 * L);
      const R2 = q * a * (2 * L + a) / (2 * L);
      const M = -q * a * a / 2;
      const delta = (q * Math.pow(a, 3) * (4 * L + 3 * a)) / (24 * E * I) * 1000;
      return [
        { label: "左支座反力 R₁", value: R1, unit: "kN", formula: "R₁ = -qa²/2L" },
        { label: "右支座反力 R₂", value: R2, unit: "kN", formula: "R₂ = qa(2L+a)/2L" },
        { label: "支座处弯矩 M", value: M, unit: "kN·m", formula: "M = -qa²/2" },
        { label: "自由端挠度 δ", value: delta, unit: "mm", formula: "δ = qa³(4L+3a)/24EI" },
      ];
    },
  },
  // 连续梁 - 两跨等跨均布载荷
  "continuous": {
    inputs: [
      { key: "q", label: "均布载荷 q", unit: "kN/m", default: 5 },
      { key: "L", label: "单跨长度 L", unit: "m", default: 6 },
    ],
    calculate: (inp) => {
      const q = inp.q, L = inp.L;
      const RA = 3 * q * L / 8;
      const RB = 10 * q * L / 8;
      const MB = -q * L * L / 8;
      const MmaxPos = 9 * q * L * L / 128;
      return [
        { label: "边支座反力 RA=RC", value: RA, unit: "kN", formula: "RA = RC = 3qL/8" },
        { label: "中支座反力 RB", value: RB, unit: "kN", formula: "RB = 10qL/8" },
        { label: "中支座弯矩 MB", value: MB, unit: "kN·m", formula: "MB = -qL²/8" },
        { label: "最大正弯矩 Mmax⁺", value: MmaxPos, unit: "kN·m", formula: "Mmax⁺ = 9qL²/128" },
      ];
    },
  },
};
