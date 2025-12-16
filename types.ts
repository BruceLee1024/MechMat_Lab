export type ModuleType = "home" | "fundamentals" | "axial" | "bending" | "torsion" | "buckling" | "stress" | "combined" | "solver" | "section" | "formulas" | "resources" | "settings";

// 截面类型
export type SectionType = 'rectangle' | 'circle' | 'hollow_circle' | 'i_beam' | 't_beam' | 'channel' | 'composite' | 'custom';

export interface SectionProperties {
  type: SectionType;
  width?: number;
  height?: number;
  radius?: number;
  outerRadius?: number;
  innerRadius?: number;
  flangeWidth?: number;
  flangeThickness?: number;
  webHeight?: number;
  webThickness?: number;
  // T型截面
  tFlangeWidth?: number;
  tFlangeThickness?: number;
  tWebHeight?: number;
  tWebThickness?: number;
  // U型截面
  channelWidth?: number;
  channelHeight?: number;
  channelFlange?: number;
  channelWeb?: number;
  // 组合截面
  comp1Width?: number;
  comp1Height?: number;
  comp2Width?: number;
  comp2Height?: number;
  compSpacing?: number;
  // 自定义截面
  customArea?: number;
  customIz?: number;
  customIy?: number;
}

export interface SimulationState {
  // Material Props (Shared)
  materialName: string; // For display
  materialYield: number; // MPa (Yield Strength)
  poissonRatio: number; // Ratio (0.0 - 0.5)
  
  // Axial (拉伸)
  axialForce: number; // N
  axialArea: number; // mm^2
  axialLength: number; // m
  
  // Bending (弯曲)
  bendLoad: number; // N
  bendLength: number; // m
  bendLoadPos: number; // m (Position of load from left support)
  bendModulus: number; // GPa
  bendWidth: number; // mm
  bendHeight: number; // mm
  bendSection: SectionProperties; // 截面属性
  
  // Torsion (扭转)
  torqTorque: number; // Nm
  torqRadius: number; // mm
  torqLength: number; // m
  torqModulus: number; // GPa (Shear Modulus G)
  
  // Buckling (压杆稳定)
  buckleLoad: number; // N
  buckleLength: number; // m
  buckleModulus: number; // GPa
  buckleWidth: number; // mm
  buckleHeight: number; // mm
  buckleSection: SectionProperties; // 截面属性

  // Stress Transformation (应力状态 - 3D Tensor)
  stressSigX: number; // MPa
  stressSigY: number; // MPa
  stressSigZ: number; // MPa
  stressTauXY: number; // MPa
  stressTauYZ: number; // MPa
  stressTauZX: number; // MPa
  stressAngle: number; // Degrees

  // Combined Loading (Eccentric Loading - Axial + Bending)
  combinedLoad: number; // N
  combinedEccentricity: number; // mm (offset from centroid)
  combinedWidth: number; // mm
  combinedHeight: number; // mm
  combinedLength: number; // m
  combinedSection: SectionProperties; // 截面属性
}

export const DEFAULT_STATE: SimulationState = {
  materialName: "结构钢 (Structural Steel)",
  materialYield: 250, // MPa
  poissonRatio: 0.3,
  // Axial
  axialForce: 5000,
  axialArea: 100,
  axialLength: 1.0,
  // Bending
  bendLoad: 2000,
  bendLength: 2.0,
  bendLoadPos: 1.0,
  bendModulus: 200,
  bendWidth: 100,
  bendHeight: 150,
  bendSection: { type: 'rectangle', width: 100, height: 150 },
  // Torsion
  torqTorque: 500,
  torqRadius: 20,
  torqLength: 1.0,
  torqModulus: 77, 
  // Buckling
  buckleLoad: 1000,
  buckleLength: 2.0,
  buckleModulus: 200,
  buckleWidth: 40,
  buckleHeight: 40,
  buckleSection: { type: 'rectangle', width: 40, height: 40 },
  // Stress
  stressSigX: 50,
  stressSigY: 20,
  stressSigZ: 10,
  stressTauXY: 30,
  stressTauYZ: 0,
  stressTauZX: 0,
  stressAngle: 0,
  // Combined
  combinedLoad: 10000,
  combinedEccentricity: 20,
  combinedWidth: 50,
  combinedHeight: 100,
  combinedLength: 1.0,
  combinedSection: { type: 'rectangle', width: 50, height: 100 },
};

export const THEORY_INFO = {
  home: {
    title: "欢迎使用材料力学可视化实验室",
    definition: "一个交互式的材料力学学习平台，通过可视化和动态模拟帮助你理解力学概念。",
    formulas: [],
    insight: "选择左侧菜单中的模块开始探索材料力学的世界。"
  },
  fundamentals: {
    title: "应力应变基础理论 (Stress & Strain)",
    definition: "探讨材料在受力变形时的基本行为，重点在于泊松效应（横向变形）以及工程应力与真应力的区别。",
    formulas: [
      { label: "泊松比 (Poisson's Ratio)", latex: "\\nu = -\\frac{\\varepsilon_{trans}}{\\varepsilon_{axial}}", desc: "材料受拉伸时，横向收缩应变与轴向伸长应变的比值。" },
      { label: "工程应力 (Eng. Stress)", latex: "\\sigma_{eng} = \\frac{F}{A_0}", desc: "基于试件原始横截面积计算的应力。" },
      { label: "真应力 (True Stress)", latex: "\\sigma_{true} = \\frac{F}{A_{actual}} = \\sigma_{eng}(1+\\varepsilon_{eng})", desc: "基于试件变形后瞬时横截面积计算的应力。" },
      { label: "体积不变假设 (塑性)", latex: "A_0 L_0 = A L", desc: "在塑性变形阶段，通常假设材料体积保持不变。" }
    ],
    insight: "大多数材料在拉伸时会变细（泊松效应）。虽然我们在工程计算中常用‘工程应力’，但在大变形情况下（如金属成型），必须考虑截面收缩带来的‘真应力’显著增加。"
  },
  axial: {
    title: "轴向拉伸与材料特性 (Axial Loading)",
    definition: "杆件受到沿轴线方向的外力作用时，会发生伸长或缩短。材料的响应通常分为弹性阶段和塑性阶段。",
    formulas: [
      { label: "工程应力 (Eng. Stress)", latex: "\\sigma = \\frac{F}{A}", desc: "单位面积上的内力。" },
      { label: "工程应变 (Eng. Strain)", latex: "\\varepsilon = \\frac{\\Delta L}{L}", desc: "长度变化的相对比率。" },
      { label: "胡克定律 (弹性段)", latex: "\\sigma = E \\cdot \\varepsilon", desc: "当应力小于屈服强度时，应力与应变成正比。" },
      { label: "屈服准则", latex: "\\sigma \\ge \\sigma_{yield}", desc: "当应力超过屈服强度，材料发生不可恢复的塑性变形。" }
    ],
    insight: "在工程设计中，我们通常希望结构处于弹性范围内（σ < σ_y）。一旦进入塑性区，卸载后会有永久变形，这通常被视为失效。"
  },
  bending: {
    title: "平面弯曲 (Beam Bending)",
    definition: "梁在垂直于轴线的载荷作用下，轴线由直线变为曲线。这种变形称为弯曲。",
    formulas: [
      { label: "最大弯矩 (Max Moment)", latex: "M_{max} = \\frac{P \\cdot L}{4}", desc: "简支梁跨中集中载荷下的最大弯矩。" },
      { label: "最大挠度 (Deflection)", latex: "w_{max} = \\frac{P \\cdot L^3}{48 \\cdot E \\cdot I}", desc: "梁在跨中位置产生的最大位移。" },
      { label: "截面惯性矩 (Moment of Inertia)", latex: "I_z = \\frac{b \\cdot h^3}{12}", desc: "矩形截面抵抗弯曲变形的几何性质。" },
      { label: "弯曲正应力 (Bending Stress)", latex: "\\sigma = \\frac{M \\cdot y}{I_z}", desc: "离中性轴越远，应力越大。" }
    ],
    insight: "截面高度 (h) 对抗弯能力贡献巨大 (h³)。立着放的木板比平着放的木板这种抗弯刚度大得多。"
  },
  torsion: {
    title: "圆轴扭转 (Torsion)",
    definition: "杆件受到绕轴线力偶（扭矩）作用时，横截面绕轴线发生相对转动。",
    formulas: [
      { label: "最大切应力 (Shear Stress)", latex: "\\tau_{max} = \\frac{T \\cdot r}{I_p}", desc: "发生在圆轴表面处。" },
      { label: "扭转角 (Angle of Twist)", latex: "\\varphi = \\frac{T \\cdot L}{G \\cdot I_p}", desc: "两端截面的相对转角。" },
      { label: "极惯性矩 (Polar Moment)", latex: "I_p = \\frac{\\pi \\cdot r^4}{2}", desc: "圆轴截面的抗扭几何性质。" }
    ],
    insight: "半径 (r) 是抗扭的关键。极惯性矩 I_p 与半径的四次方 (r⁴) 成正比。半径稍微增加，抗扭刚度会成倍提升。"
  },
  buckling: {
    title: "压杆稳定 (Column Buckling)",
    definition: "细长压杆受压力作用，当压力达到某一临界值时，杆件会突然由直线平衡状态变为弯曲平衡状态，导致失稳。",
    formulas: [
      { label: "欧拉临界力 (Euler Load)", latex: "P_{cr} = \\frac{\\pi^2 E I}{(\\mu L)^2}", desc: "压杆维持直线平衡状态的最大轴向压力。" },
      { label: "惯性半径 (Radius of Gyration)", latex: "i = \\sqrt{\\frac{I}{A}}", desc: "反映截面质量分布的参数。" },
      { label: "柔度/长细比 (Slenderness)", latex: "\\lambda = \\frac{\\mu L}{i}", desc: "衡量压杆细长程度，lambda越大越容易失稳。" }
    ],
    insight: "对于细长杆，破坏往往不是因为强度不足，而是因为刚度不足。惯性半径 i 越小（截面越扁），柔度 λ 越大，临界力 Pcr 越低。"
  },
  stress: {
    title: "应力状态 (Stress Transformation)",
    definition: "同一点在不同方位的截面上，应力的大小和性质随截面方位而变。三维应力状态可以通过应力张量或莫尔圆来描述。",
    formulas: [
      { label: "应力张量 (Stress Tensor)", latex: "\\sigma_{ij} = \\begin{bmatrix} \\sigma_x & \\tau_{xy} & \\tau_{xz} \\\\ \\tau_{yx} & \\sigma_y & \\tau_{yz} \\\\ \\tau_{zx} & \\tau_{zy} & \\sigma_z \\end{bmatrix}", desc: "描述同一点各个方向受力的矩阵。" },
      { label: "第一不变量 (First Invariant)", latex: "I_1 = \\sigma_x + \\sigma_y + \\sigma_z", desc: "应力张量的迹，在坐标变换下保持不变。" },
      { label: "特征方程 (Characteristic Eq)", latex: "\\sigma^3 - I_1\\sigma^2 + I_2\\sigma - I_3 = 0", desc: "求解该三次方程的根即为三个主应力。" }
    ],
    insight: "无论外部载荷多么复杂，在某一个特定的坐标系下（主轴），切应力分量全部为零，此时的正应力即为主应力。这是强度理论的基础。"
  },
  combined: {
    title: "组合变形 (Combined Loading)",
    definition: "构件同时发生两种或两种以上的基本变形。常见的如偏心拉伸（拉伸+弯曲）或弯扭组合（弯曲+扭转）。",
    formulas: [
      { label: "叠加原理 (Superposition)", latex: "\\sigma = \\sigma_{axial} \\pm \\sigma_{bending}", desc: "在线性弹性范围内，各载荷引起的应力可以代数相加。" },
      { label: "偏心拉伸应力", latex: "\\sigma = \\frac{F}{A} \\pm \\frac{M \\cdot y}{I_z}", desc: "轴向力 F 产生的均匀应力与弯矩 M=F·e 产生的线性分布应力叠加。" },
      { label: "截面核心 (Kern)", latex: "e < \\frac{W}{A}", desc: "如果偏心距过大，截面上可能会出现反向应力（例如受压构件出现拉应力）。" }
    ],
    insight: "应力的叠加可能会导致截面的一侧应力急剧增大，而另一侧可能减小甚至改变符号。这是设计偏心受力构件（如压力机立柱）时必须考虑的。"
  },
  solver: {
    title: "结构求解器 (Structural Solver)",
    definition: "交互式材料力学求解器，基于静力平衡方程和经典梁理论，支持自定义构建梁结构，求解支座反力、内力分布和挠度。",
    formulas: [
      { label: "静力平衡", latex: "\\sum F = 0, \\quad \\sum M = 0", desc: "静定结构可直接由平衡方程求解支座反力。" },
      { label: "简支梁弯矩", latex: "M_{max} = \\frac{Pab}{L}", desc: "集中荷载P作用于距左端a处时，荷载点处弯矩最大。" },
      { label: "简支梁挠度", latex: "w = \\frac{Pa^2b^2}{3EIL}", desc: "荷载作用点的挠度公式。" },
      { label: "弯曲应变能", latex: "U = \\frac{P^2a^2b^2}{6EIL}", desc: "简支梁在集中荷载下的弯曲应变能。" }
    ],
    insight: "材料力学中的静定结构可以直接用平衡方程求解，不需要有限元方法。掌握经典公式可以快速估算结构响应。"
  },
  section: {
    title: "截面特性计算器 (Section Properties)",
    definition: "计算各种截面的面积、惯性矩、惯性半径和抗弯截面模量。",
    formulas: [
      { label: "惯性矩 (Moment of Inertia)", latex: "I_x = \\int y^2 dA", desc: "截面对某轴的惯性矩，反映截面抵抗弯曲的能力。" },
      { label: "惯性半径 (Radius of Gyration)", latex: "i = \\sqrt{\\frac{I}{A}}", desc: "惯性矩与面积的比值开方，用于压杆稳定计算。" },
      { label: "抗弯截面模量", latex: "W = \\frac{I}{y_{max}}", desc: "惯性矩除以到中性轴最远距离，用于计算最大弯曲应力。" },
    ],
    insight: "截面形状对结构性能影响巨大。工字钢的惯性矩远大于同面积的实心矩形，这就是为什么建筑中广泛使用型钢。"
  },
  formulas: {
    title: "常用公式速查 (Formula Reference)",
    definition: "材料力学常用公式汇总，涵盖梁的弯曲、截面特性、应力应变、压杆稳定和扭转等。",
    formulas: [
      { label: "弯曲正应力", latex: "\\sigma = \\frac{My}{I}", desc: "梁弯曲时横截面上的正应力分布。" },
      { label: "欧拉临界力", latex: "P_{cr} = \\frac{\\pi^2 EI}{(\\mu L)^2}", desc: "细长压杆的临界载荷。" },
      { label: "扭转剪应力", latex: "\\tau = \\frac{T\\rho}{I_p}", desc: "圆轴扭转时的剪应力分布。" },
    ],
    insight: "公式是解决问题的工具，理解公式背后的物理意义比死记硬背更重要。"
  },
  resources: {
    title: "学习资源库 (Learning Resources)",
    definition: "精选的材料力学学习资料，包括教材、视频、论文和在线工具。",
    formulas: [],
    insight: "系统学习材料力学，从基础到进阶，这里有你需要的所有资源。"
  },
  settings: {
    title: "设置 (Settings)",
    definition: "配置 AI 助教和其他系统参数。",
    formulas: [],
    insight: "在这里配置您的 API Key 和其他偏好设置。"
  }
};
