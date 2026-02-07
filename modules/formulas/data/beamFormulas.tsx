import React from "react";
import { BeamFormula } from "../types";
import {
  SSCenterFBD, SSCenterSFD, SSCenterBMD,
  SSUniformFBD, SSUniformSFD, SSUniformBMD,
  SSPointFBD, SSPointSFD, SSPointBMD,
  SSTwoPointFBD, SSTwoPointSFD, SSTwoPointBMD,
  SSTriangularFBD, SSTriangularSFD, SSTriangularBMD,
  SSMomentFBD, SSMomentSFD, SSMomentBMD,
  SSPartialFBD, SSPartialSFD, SSPartialBMD,
  CantEndFBD, CantEndSFD, CantEndBMD,
  CantUniformFBD, CantUniformSFD, CantUniformBMD,
  CantPointFBD, CantPointSFD, CantPointBMD,
  CantMomentFBD, CantMomentSFD, CantMomentBMD,
  CantTriangularFBD, CantTriangularSFD, CantTriangularBMD,
  FixedCenterFBD, FixedCenterSFD, FixedCenterBMD,
  FixedUniformFBD, FixedUniformSFD, FixedUniformBMD,
  FixedPointFBD, FixedPointSFD, FixedPointBMD,
  OverhangFBD, OverhangSFD, OverhangBMD,
  OverhangUniformFBD, OverhangUniformSFD, OverhangUniformBMD,
  ProppedCenterFBD, ProppedCenterSFD, ProppedCenterBMD,
  ProppedUniformFBD, ProppedUniformSFD, ProppedUniformBMD,
  ContinuousFBD, ContinuousSFD, ContinuousBMD,
} from "../diagrams/BeamDiagrams";
import {
  Arch3HingeUniformFBD, Arch3HingeUniformSFD, Arch3HingeUniformBMD,
  Arch3HingeCenterFBD, Arch3HingeCenterSFD, Arch3HingeCenterBMD,
  ArchHalfUniformFBD, ArchHalfUniformSFD, ArchHalfUniformBMD,
  Arch2HingeUniformFBD, Arch2HingeUniformSFD, Arch2HingeUniformBMD,
  ArchFixedUniformFBD, ArchFixedUniformSFD, ArchFixedUniformBMD,
} from "../diagrams/ArchDiagrams";

// 梁公式数据
export const BEAM_FORMULAS: BeamFormula[] = [
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
    {label:"δmax",formula:"\\delta_{max} = \\frac{qL^4}{185EI}"},
  ]},
  // 连续梁
  { id:"continuous", name:"两跨等跨均布载荷", group:"连续梁", fbd:<ContinuousFBD/>, sfd:<ContinuousSFD/>, bmd:<ContinuousBMD/>, formulas:[
    {label:"R (边支座)",formula:"R_A = R_C = \\frac{3qL}{8}"},
    {label:"R (中支座)",formula:"R_B = \\frac{10qL}{8}"},
    {label:"M (中支座)",formula:"M_B = -\\frac{qL^2}{8}"},
    {label:"Mmax (正)",formula:"M_{max}^+ = \\frac{9qL^2}{128}"},
  ]},
  // 三铰拱
  { id:"arch-3hinge-uniform", name:"均布载荷(任意形状)", group:"三铰拱", fbd:<Arch3HingeUniformFBD/>, sfd:<Arch3HingeUniformSFD/>, bmd:<Arch3HingeUniformBMD/>, formulas:[
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
