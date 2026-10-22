// 常用公式页的独立计算入口。
export interface FormulaBeamInput {
  key: string;
  label: string;
  unit: string;
  default: number;
}

export interface FormulaBeamResult {
  label: string;
  value: number;
  unit: string;
  formula: string;
}

export interface FormulaBeamCalculator {
  inputs: FormulaBeamInput[];
  assumptions: string[];
  validate: (inputs: Record<string, number>) => string | null;
  /** 无效输入抛出 RangeError；界面应先展示 validate 返回的中文诊断。 */
  calculate: (inputs: Record<string, number>) => FormulaBeamResult[];
}

type FormulaBeamDefinition = Pick<FormulaBeamCalculator, 'inputs' | 'calculate'>;

// 梁的变形统一以 N、mm、MPa、mm⁴ 计算；只在输入/输出边界换算。
// 拱与不涉及变形的静力结果直接以显示单位 kN、m、kN·m 保持平衡。
const DEFINITIONS: Record<string, FormulaBeamDefinition> = {
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
      const q = inp.q; // kN/m = N/mm
      const L = inp.L * 1000; // m → mm
      const E = inp.E * 1000; // GPa → MPa
      const I = inp.I * 1e6; // ×10⁶mm⁴ → mm⁴
      const R = q * L / 2;
      const Mmax = q * L * L / 8;
      const deltaMax = (5 * q * Math.pow(L, 4)) / (384 * E * I);
      const thetaMax = (q * Math.pow(L, 3)) / (24 * E * I);
      return [
        { label: "支座反力 R", value: R / 1000, unit: "kN", formula: "R = qL/2" },
        { label: "最大弯矩 Mmax", value: Mmax / 1e6, unit: "kN·m", formula: "Mmax = qL²/8" },
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
      const P = inp.P * 1000; // kN → N
      const L = inp.L * 1000; // m → mm
      const E = inp.E * 1000; // GPa → MPa
      const I = inp.I * 1e6; // ×10⁶mm⁴ → mm⁴
      const R = P;
      const M0 = P * L;
      const deltaMax = (P * Math.pow(L, 3)) / (3 * E * I);
      const thetaMax = (P * Math.pow(L, 2)) / (2 * E * I);
      return [
        { label: "固定端反力 R", value: R / 1000, unit: "kN", formula: "R = P" },
        { label: "固定端弯矩 M₀", value: M0 / 1e6, unit: "kN·m", formula: "M₀ = PL" },
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
      const L = inp.L * 1000;
      const E = inp.E * 1000;
      const I = inp.I * 1e6;
      const R = q * L;
      const M0 = q * L * L / 2;
      const deltaMax = (q * Math.pow(L, 4)) / (8 * E * I);
      const thetaMax = (q * Math.pow(L, 3)) / (6 * E * I);
      return [
        { label: "固定端反力 R", value: R / 1000, unit: "kN", formula: "R = qL" },
        { label: "固定端弯矩 M₀", value: M0 / 1e6, unit: "kN·m", formula: "M₀ = qL²/2" },
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
      const P = inp.P * 1000, L = inp.L * 1000, a = inp.a * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const b = L - a;
      const R1 = P * b / L;
      const R2 = P * a / L;
      const Mmax = P * a * b / L;
      const deltaA = (P * a * a * b * b) / (3 * E * I * L);
      return [
        { label: "左支座反力 R₁", value: R1 / 1000, unit: "kN", formula: "R₁ = Pb/L" },
        { label: "右支座反力 R₂", value: R2 / 1000, unit: "kN", formula: "R₂ = Pa/L" },
        { label: "最大弯矩 Mmax", value: Mmax / 1e6, unit: "kN·m", formula: "Mmax = Pab/L" },
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
      const P = inp.P * 1000, L = inp.L * 1000, a = inp.a * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R = P;
      const M = P * a;
      const deltaMax = (P * a * (3 * L * L - 4 * a * a)) / (24 * E * I);
      const theta = (P * a * (L - a)) / (2 * E * I);
      return [
        { label: "支座反力 R", value: R / 1000, unit: "kN", formula: "R = P" },
        { label: "等弯矩段弯矩 M", value: M / 1e6, unit: "kN·m", formula: "M = Pa" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax = Pa(3L²-4a²)/24EI" },
        { label: "端部转角 θ", value: theta * 1000, unit: "×10⁻³ rad", formula: "θ = Pa(L-a)/2EI" },
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
      const q = inp.q, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R1 = q * L / 6;
      const R2 = q * L / 3;
      const Mmax = q * L * L / (9 * Math.sqrt(3));
      const t = Math.sqrt(1 - Math.sqrt(480) / 30);
      const deltaMax = q * Math.pow(L, 4) * t * (7 - 10 * t * t + 3 * t ** 4) / (360 * E * I);
      return [
        { label: "小端反力 R₁", value: R1 / 1000, unit: "kN", formula: "R₁ = qL/6" },
        { label: "大端反力 R₂", value: R2 / 1000, unit: "kN", formula: "R₂ = qL/3" },
        { label: "最大弯矩 Mmax", value: Mmax / 1e6, unit: "kN·m", formula: "Mmax = qL²/9√3" },
        { label: "最大挠度 δmax", value: deltaMax, unit: "mm", formula: "δmax ≈ 0.00652218qL⁴/EI (x≈0.51933L)" },
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
      const P = inp.P * 1000, L = inp.L * 1000, a = inp.a * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R = P;
      const M0 = P * a;
      const deltaA = (P * Math.pow(a, 3)) / (3 * E * I);
      const deltaEnd = (P * a * a * (3 * L - a)) / (6 * E * I);
      return [
        { label: "固定端反力 R", value: R / 1000, unit: "kN", formula: "R = P" },
        { label: "固定端弯矩 M₀", value: M0 / 1e6, unit: "kN·m", formula: "M₀ = Pa" },
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
      const M = inp.M * 1e6, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const deltaMax = (M * L * L) / (2 * E * I);
      const thetaMax = (M * L) / (E * I);
      return [
        { label: "固定端反力 R", value: 0 / 1000, unit: "kN", formula: "R = 0" },
        { label: "弯矩 (常数)", value: M / 1e6, unit: "kN·m", formula: "M = M" },
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
      const q = inp.q, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R = q * L / 2;
      const M0 = q * L * L / 6;
      const deltaMax = (q * Math.pow(L, 4)) / (30 * E * I);
      const thetaMax = (q * Math.pow(L, 3)) / (24 * E * I);
      return [
        { label: "固定端反力 R", value: R / 1000, unit: "kN", formula: "R = qL/2" },
        { label: "固定端弯矩 M₀", value: M0 / 1e6, unit: "kN·m", formula: "M₀ = qL²/6" },
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
      const P = inp.P * 1000, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R = P / 2;
      const Mend = P * L / 8;
      const Mmid = P * L / 8;
      const deltaMax = (P * Math.pow(L, 3)) / (192 * E * I);
      return [
        { label: "支座反力 R", value: R / 1000, unit: "kN", formula: "R = P/2" },
        { label: "端部弯矩 M端", value: Mend / 1e6, unit: "kN·m", formula: "M端 = PL/8" },
        { label: "跨中弯矩 M中", value: Mmid / 1e6, unit: "kN·m", formula: "M中 = PL/8" },
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
      const q = inp.q, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R = q * L / 2;
      const Mend = q * L * L / 12;
      const Mmid = q * L * L / 24;
      const deltaMax = (q * Math.pow(L, 4)) / (384 * E * I);
      return [
        { label: "支座反力 R", value: R / 1000, unit: "kN", formula: "R = qL/2" },
        { label: "端部弯矩 M端", value: Mend / 1e6, unit: "kN·m", formula: "M端 = qL²/12" },
        { label: "跨中弯矩 M中", value: Mmid / 1e6, unit: "kN·m", formula: "M中 = qL²/24" },
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
      const P = inp.P * 1000, L = inp.L * 1000, a = inp.a * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R1 = -P * a / L;
      const R2 = P * (1 + a / L);
      const M = -P * a;
      const delta = (P * a * a * (L + a)) / (3 * E * I);
      return [
        { label: "左支座反力 R₁", value: R1 / 1000, unit: "kN", formula: "R₁ = -Pa/L" },
        { label: "右支座反力 R₂", value: R2 / 1000, unit: "kN", formula: "R₂ = P(1+a/L)" },
        { label: "支座处弯矩 M", value: M / 1e6, unit: "kN·m", formula: "M = -Pa" },
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
      const P = inp.P * 1000, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const RA = 11 * P / 16;
      const RB = 5 * P / 16;
      const MA = 3 * P * L / 16;
      const Mmax = 5 * P * L / 32;
      return [
        { label: "固定端反力 RA", value: RA / 1000, unit: "kN", formula: "RA = 11P/16" },
        { label: "简支端反力 RB", value: RB / 1000, unit: "kN", formula: "RB = 5P/16" },
        { label: "固定端弯矩 MA", value: MA / 1e6, unit: "kN·m", formula: "MA = 3PL/16" },
        { label: "最大正弯矩 Mmax", value: Mmax / 1e6, unit: "kN·m", formula: "Mmax = 5PL/32" },
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
      const q = inp.q, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const RA = 5 * q * L / 8;
      const RB = 3 * q * L / 8;
      const MA = q * L * L / 8;
      const MmaxPos = 9 * q * L * L / 128;
      return [
        { label: "固定端反力 RA", value: RA / 1000, unit: "kN", formula: "RA = 5qL/8" },
        { label: "简支端反力 RB", value: RB / 1000, unit: "kN", formula: "RB = 3qL/8" },
        { label: "固定端弯矩 MA", value: MA / 1e6, unit: "kN·m", formula: "MA = qL²/8" },
        { label: "最大正弯矩 Mmax⁺", value: MmaxPos / 1e6, unit: "kN·m", formula: "Mmax⁺ = 9qL²/128" },
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
        { label: "推力/反力几何比", value: L / (4 * f), unit: "", formula: "L/4f (零载荷时表示几何极限比)" },
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
      const Mmax = P * L / 16;
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = P/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = PL/4f" },
        { label: "最大弯矩幅值 |M|max", value: Mmax, unit: "kN·m", formula: "|M|max = PL/16 (x=L/4,3L/4，负弯矩)" },
        { label: "推力/反力几何比", value: L / (2 * f), unit: "", formula: "L/2f (零载荷时表示几何极限比)" },
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
      const Mmax = w * L * L / 64;
      return [
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = wL²/16f" },
        { label: "左支座反力 RA", value: RA, unit: "kN", formula: "RA = 3wL/8" },
        { label: "右支座反力 RC", value: RC, unit: "kN", formula: "RC = wL/8" },
        { label: "最大弯矩幅值 |M|max", value: Mmax, unit: "kN·m", formula: "|M|max = wL²/64 (x=L/4,3L/4，等幅反号)" },
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
      const H = w * L * L / (8 * f);
      const Mmid = w * L * L / 8 - H * f;
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = wL/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = wL²/8f (忽略轴向与剪切变形)" },
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
      const Mend = 0;
      const Mmid = 0;
      return [
        { label: "竖向反力 R", value: R, unit: "kN", formula: "R = wL/2" },
        { label: "水平推力 H", value: H, unit: "kN", formula: "H = wL²/8f (忽略轴向与剪切变形)" },
        { label: "端部弯矩 M端", value: Mend, unit: "kN·m", formula: "M端 = 0 (理想抛物线拱)" },
        { label: "跨中弯矩 M中", value: Mmid, unit: "kN·m", formula: "M中 = 0 (理想抛物线拱)" },
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
      const M = inp.M * 1e6, L = inp.L * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R = M / L;
      const theta1 = (M * L) / (3 * E * I);
      const theta2 = (M * L) / (6 * E * I);
      const deltaMax = (M * L * L) / (9 * Math.sqrt(3) * E * I);
      return [
        { label: "右支座反力 R₂", value: R / 1000, unit: "kN", formula: "R₂ = M/L" },
        { label: "剪力 V (常数)", value: (-R) / 1000, unit: "kN", formula: "V = -M/L" },
        { label: "左端转角 θ₁", value: theta1 * 1000, unit: "×10⁻³ rad", formula: "θ₁ = ML/3EI" },
        { label: "右端转角 θ₂", value: theta2 * 1000, unit: "×10⁻³ rad", formula: "θ₂ = ML/6EI" },
        { label: "左支座反力 R₁", value: -R / 1000, unit: "kN", formula: "R₁ = -M/L" },
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
      const xmax = q === 0 ? a + c / 2 : a + R1 / q;
      const Mmax = R1 * xmax - q / 2 * Math.pow(xmax - a, 2);
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
      const P = inp.P * 1000, L = inp.L * 1000, a = inp.a * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const b = L - a;
      const R1 = P * b * b * (3 * a + b) / Math.pow(L, 3);
      const R2 = P * a * a * (a + 3 * b) / Math.pow(L, 3);
      const M1 = P * a * b * b / (L * L);
      const M2 = P * a * a * b / (L * L);
      const deltaA = (P * Math.pow(a, 3) * Math.pow(b, 3)) / (3 * E * I * Math.pow(L, 3));
      return [
        { label: "左支座反力 R₁", value: R1 / 1000, unit: "kN", formula: "R₁ = Pb²(3a+b)/L³" },
        { label: "右支座反力 R₂", value: R2 / 1000, unit: "kN", formula: "R₂ = Pa²(a+3b)/L³" },
        { label: "左端弯矩 M₁", value: M1 / 1e6, unit: "kN·m", formula: "M₁ = Pab²/L²" },
        { label: "右端弯矩 M₂", value: M2 / 1e6, unit: "kN·m", formula: "M₂ = Pa²b/L²" },
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
      const q = inp.q, L = inp.L * 1000, a = inp.a * 1000, E = inp.E * 1000, I = inp.I * 1e6;
      const R1 = -q * a * a / (2 * L);
      const R2 = q * a * (2 * L + a) / (2 * L);
      const M = -q * a * a / 2;
      const delta = (q * Math.pow(a, 3) * (4 * L + 3 * a)) / (24 * E * I);
      return [
        { label: "左支座反力 R₁", value: R1 / 1000, unit: "kN", formula: "R₁ = -qa²/2L" },
        { label: "右支座反力 R₂", value: R2 / 1000, unit: "kN", formula: "R₂ = qa(2L+a)/2L" },
        { label: "支座处弯矩 M", value: M / 1e6, unit: "kN·m", formula: "M = -qa²/2" },
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

export const FORMULA_BEAM_UNIT_GUIDE = [
  'P 为集中力，q / w 为单位长度载荷；M 为外加力矩；载荷输入均为示意方向的非负幅值。',
  'L 为梁长或支座跨度，a 的起点见参数名称，c 为受载长度；E 为弹性模量，I 为截面惯性矩，f 为拱顶矢高。',
  '输入 P：kN，q / w：kN/m，L / a / c / f：m，E：GPa，I：百万 mm⁴；输出转角 ×10⁻³ rad 等于 mrad。',
  '内力有明确正负号时保留符号；未标明方向的变形、转角及固端弯矩给出幅值。',
];

const BEAM_ASSUMPTIONS = ['等截面、线弹性、小变形 Euler–Bernoulli 梁；忽略剪切变形，支座无沉降。'];
const ARCH_ASSUMPTIONS = [
  '等高拱脚，拱轴为 y=4fx(L-x)/L² 的抛物线；均布竖向载荷按水平投影长度计。',
  'x 自左拱脚起算；三铰拱的第三铰位于拱顶；本页不计算屈曲与大变形。',
];

const EXTRA_ASSUMPTIONS: Record<string, string[]> = {
  'ss-point': ['b=L-a；载荷处挠度一般不等于全梁最大挠度。'],
  'ss-two-point': ['两个集中力各为 P；0≤a≤L/2，分别位于距两端 a 处。'],
  'ss-triangular': ['载荷由左端 0 线性增加至右端 q；最大挠度位于 x≈0.51933L。'],
  'ss-partial': ['b=L-a-c，0≤a，0≤c，a+c≤L；零载荷时最大弯矩位置不唯一，显示受载区段中点作为代表。'],
  'cant-triangular': ['三角载荷在固定端为 q，沿悬臂线性减小至自由端 0。'],
  'overhang': ['左支座反力为负表示上拔；需有可承受上拔的实际支座。'],
  'overhang-uniform': ['均布载荷只作用于外伸段；左支座反力为负表示上拔。'],
  'continuous': ['两个等跨、等刚度的连续梁，两跨均满布 q；端支座为简支。'],
  'arch-3hinge-center': ['全拱最大弯矩幅值位于 x=L/4、3L/4，均为负弯矩；拱顶弯矩为零。'],
  'arch-half-uniform': ['载荷作用于左半跨；两侧四分点弯矩分别为 +wL²/64 与 -wL²/64。'],
  'arch-2hinge-uniform': ['仅适用忽略轴向和剪切变形的弯曲理论；不含温度、支座位移与初始应变。考虑轴向压缩时须另提供 EA 与 EI 进行相容分析。'],
  'arch-fixed-uniform': ['仅适用忽略轴向和剪切变形的弯曲理论；此理想模型全拱弯矩为零。实际固端拱的压缩相容与端矩须另提供 EA、EI 分析，不能套用固端直梁弯矩。'],
};

const withinSpan = new Set(['ss-point', 'fixed-point', 'cant-point']);

function diagnoseInput(id: string, config: FormulaBeamDefinition, inputs: Record<string, number>): string | null {
  for (const input of config.inputs) {
    const value = inputs[input.key];
    if (!Number.isFinite(value)) return `${input.label}须为有限数值。`;
    const positive = ['L', 'E', 'I', 'f'].includes(input.key);
    if (positive ? value <= 0 : value < 0) return `${input.label}须${positive ? '大于' : '不小于'} 0。`;
  }
  if (withinSpan.has(id) && inputs.a > inputs.L) return '载荷位置 a 须在 0 至 L 之间。';
  if (id === 'ss-two-point' && inputs.a > inputs.L / 2) return '对称载荷距端距离 a 不得超过 L/2。';
  if (id === 'ss-partial' && inputs.a + inputs.c > inputs.L) return '左侧空白 a 与载荷长度 c 之和不得超过 L。';
  if (config.inputs.some(input => input.key === 'E')) {
    const stiffness = inputs.E * 1000 * (inputs.I * 1e6);
    if (!Number.isFinite(stiffness) || stiffness <= 0) return '弯曲刚度 EI 超出可计算数值范围，请调整 E 或 I。';
  }
  return null;
}

function makeCalculator(id: string, config: FormulaBeamDefinition): FormulaBeamCalculator {
  const validate = (inputs: Record<string, number>): string | null => {
    const diagnosis = diagnoseInput(id, config, inputs);
    if (diagnosis) return diagnosis;
    const results = config.calculate(inputs);
    return results.every(row => Number.isFinite(row.value)) ? null : '计算结果超出有限数值范围，请调整载荷、尺寸或刚度。';
  };
  return {
    ...config,
    assumptions: [
      ...(id.startsWith('arch-') ? ARCH_ASSUMPTIONS : BEAM_ASSUMPTIONS),
      ...(EXTRA_ASSUMPTIONS[id] ?? []),
      FORMULA_BEAM_UNIT_GUIDE[3],
    ],
    validate,
    calculate: (inputs) => {
      const diagnosis = validate(inputs);
      if (diagnosis) throw new RangeError(diagnosis);
      return config.calculate(inputs);
    },
  };
}

export const FORMULA_BEAM_CALCULATORS: Record<string, FormulaBeamCalculator> = Object.fromEntries(
  Object.entries(DEFINITIONS).map(([id, config]) => [id, makeCalculator(id, config)]),
);

/** 供公式目录复用的修正式；公式采用一致的力、长度单位。 */
export const correctedReferenceFormulas: Record<string, { label: string; formula: string }[]> = {
  'ss-point': [
    { label: 'R₁ (左支座)', formula: 'R_1=\\frac{Pb}{L}' },
    { label: 'R₂ (右支座)', formula: 'R_2=\\frac{Pa}{L}' },
    { label: 'Mmax (载荷处)', formula: 'M_{max}=\\frac{Pab}{L}' },
    { label: 'δ (载荷处)', formula: '\\delta_a=\\frac{Pa^2b^2}{3EIL}' },
    { label: 'δmax (m为较短侧距离)', formula: 'm=\\min(a,b),\\quad\\delta_{max}=\\frac{Pm(L^2-m^2)^{3/2}}{9\\sqrt{3}EIL}' },
  ],
  'ss-two-point': [
    { label: 'R = V', formula: 'R=V=P' },
    { label: 'M (等弯矩段)', formula: 'M=Pa' },
    { label: 'δmax (跨中)', formula: '\\delta_{max}=\\frac{Pa(3L^2-4a^2)}{24EI}' },
    { label: 'θ (端部幅值)', formula: '|\\theta|=\\frac{Pa(L-a)}{2EI}' },
  ],
  'ss-triangular': [
    { label: 'R₁ (小端)', formula: 'R_1=\\frac{qL}{6}' },
    { label: 'R₂ (大端)', formula: 'R_2=\\frac{qL}{3}' },
    { label: 'Mmax', formula: 'M_{max}=\\frac{qL^2}{9\\sqrt{3}}' },
    { label: 'δmax (x≈0.51933L)', formula: '\\delta_{max}\\approx0.00652218\\frac{qL^4}{EI}' },
  ],
  'arch-3hinge-center': [
    { label: '竖向反力', formula: 'R_A=R_C=\\frac{P}{2}' },
    { label: '水平推力', formula: 'H=\\frac{PL}{4f}' },
    { label: '左半跨弯矩', formula: 'M(x)=\\frac{Px}{2}-Hy(x),\\quad0\\le x\\le L/2' },
    { label: '抛物线拱最大弯矩幅值', formula: '|M|_{max}=\\frac{PL}{16},\\quad x=L/4,\\ 3L/4\\quad(M<0)' },
  ],
  'arch-half-uniform': [
    { label: '水平推力', formula: 'H=\\frac{wL^2}{16f}' },
    { label: '左支座反力', formula: 'R_A=\\frac{3wL}{8}' },
    { label: '右支座反力', formula: 'R_C=\\frac{wL}{8}' },
    { label: '抛物线拱正负峰值', formula: 'M(L/4)=\\frac{wL^2}{64},\\quad M(3L/4)=-\\frac{wL^2}{64}' },
  ],
  'arch-2hinge-uniform': [
    { label: '竖向反力', formula: 'R_A=R_C=\\frac{wL}{2}' },
    { label: '理想抛物线拱水平推力', formula: 'H=\\frac{wL^2}{8f}' },
    { label: '全拱弯矩', formula: 'M(x)=\\frac{wx(L-x)}{2}-Hy(x)=0' },
    { label: '适用模型', formula: '\\text{仅弯曲变形；忽略轴向和剪切变形}' },
  ],
  'arch-fixed-uniform': [
    { label: '竖向反力', formula: 'R_A=R_C=\\frac{wL}{2}' },
    { label: '理想抛物线拱水平推力', formula: 'H=\\frac{wL^2}{8f}' },
    { label: '端部及全拱弯矩', formula: 'M_{端}=M(x)=0' },
    { label: '适用模型', formula: '\\text{仅弯曲变形；忽略轴向和剪切变形}' },
  ],
};

export const correctedReferenceConditions: Record<string, string[]> = Object.fromEntries(
  Object.keys(correctedReferenceFormulas).map(id => [id, FORMULA_BEAM_CALCULATORS[id].assumptions]),
);
