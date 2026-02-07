import { BasicFormula } from "../types";

export const BASIC_FORMULAS: BasicFormula[] = [
  // 应力与应变
  { id:"stress-basic", name:"正应力", group:"应力与应变", params:"σ-正应力 N-轴力 A-截面积 ε-应变 ΔL-伸长量 L-原长 E-弹性模量 ν-泊松比 ε'-横向应变", formulas:[
    {label:"正应力定义",formula:"\\sigma = \\frac{N}{A}"},
    {label:"轴向应变",formula:"\\varepsilon = \\frac{\\Delta L}{L}"},
    {label:"胡克定律",formula:"\\sigma = E \\varepsilon"},
    {label:"泊松比",formula:"\\nu = -\\frac{\\varepsilon'}{\\varepsilon}"},
  ]},
  { id:"shear-stress", name:"剪应力", group:"应力与应变", params:"τ-剪应力 V-剪力 A-截面积 γ-剪应变 G-剪切模量 E-弹性模量 ν-泊松比", formulas:[
    {label:"剪应力定义",formula:"\\tau = \\frac{V}{A}"},
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
    {label:"最大剪应力",formula:"\\tau_{max} = \\frac{\\sigma_1-\\sigma_2}{2}"},
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
    {label:"弯扭组合",formula:"\\sigma_{eq} = \\sqrt{\\sigma^2+4\\tau^2}"},
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
