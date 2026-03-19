// ==========================================
// 材料力学经典求解器 - 基于平衡方程和叠加法
// ==========================================

import {
  SolverNode,
  SolverElement,
  SolverLoad,
  SolverResult,
  NodeResult,
  ElementResult,
} from './SolverTypes';

// 单跨梁求解结果
interface BeamSolution {
  // 支座反力
  R1: number;  // 左端反力 (N)
  R2: number;  // 右端反力 (N)
  M1: number;  // 左端弯矩 (Nm) - 固定端
  M2: number;  // 右端弯矩 (Nm) - 固定端
  // 内力函数采样点
  internalForces: {
    x: number;      // 位置 (0-L)
    V: number;      // 剪力 (N)
    M: number;      // 弯矩 (Nm)
  }[];
  // 最大值
  maxV: number;
  maxM: number;
  maxDeflection: number;
  deflectionPos: number;
  // 应变能
  strainEnergy: number;
}

// ==========================================
// 简支梁集中荷载求解
// ==========================================
function solveSimplySupportedBeamPointLoad(
  P: number,      // 荷载 (N), 向下为正
  a: number,      // 荷载距左端距离 (mm)
  L: number,      // 跨度 (mm)
  E: number,      // 弹性模量 (MPa)
  I: number       // 惯性矩 (mm^4)
): BeamSolution {
  const b = L - a;
  
  // 支座反力 (静力平衡)
  const R1 = P * b / L;
  const R2 = P * a / L;
  
  // 内力分布
  const nPoints = 21;
  const internalForces: BeamSolution['internalForces'] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const x = (i / nPoints) * L;
    let V: number, M: number;
    
    if (x <= a) {
      // 左段
      V = R1;
      M = R1 * x;
    } else {
      // 右段
      V = R1 - P;  // = -R2
      M = R1 * x - P * (x - a);
    }
    
    internalForces.push({ x, V, M });
  }
  
  // 最大弯矩在荷载作用点
  const maxM = R1 * a;  // = P * a * b / L
  const maxV = Math.max(Math.abs(R1), Math.abs(R2));
  
  // 最大挠度
  // 对于 a <= L/2: w_max 在 x = sqrt(L²-b²)/sqrt(3) ≈ 在荷载点附近
  // 简化：计算荷载点挠度
  const deflectionAtLoad = (P * Math.pow(a, 2) * Math.pow(b, 2)) / (3 * E * I * L);
  
  // 应变能: U = ∫M²/(2EI)dx = P²a²b²/(6EIL)
  const strainEnergy = (Math.pow(P, 2) * Math.pow(a, 2) * Math.pow(b, 2)) / (6 * E * I * L);
  
  return {
    R1, R2,
    M1: 0, M2: 0,
    internalForces,
    maxV,
    maxM,
    maxDeflection: deflectionAtLoad,
    deflectionPos: a,
    strainEnergy,
  };
}

// ==========================================
// 简支梁均布荷载求解
// ==========================================
function solveSimplySupportedBeamDistributedLoad(
  q: number,      // 均布荷载强度 (N/mm)
  L: number,      // 跨度 (mm)
  E: number,      // 弹性模量 (MPa)
  I: number       // 惯性矩 (mm^4)
): BeamSolution {
  // 支座反力
  const R1 = q * L / 2;
  const R2 = q * L / 2;
  
  // 内力分布
  const nPoints = 21;
  const internalForces: BeamSolution['internalForces'] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const x = (i / nPoints) * L;
    // V(x) = R1 - q*x = qL/2 - qx
    const V = R1 - q * x;
    // M(x) = R1*x - q*x²/2
    const M = R1 * x - q * x * x / 2;
    internalForces.push({ x, V, M });
  }
  
  // 最大弯矩在跨中
  const maxM = q * L * L / 8;
  const maxV = R1;
  
  // 最大挠度在跨中: w_max = 5qL⁴/(384EI)
  const maxDeflection = (5 * q * Math.pow(L, 4)) / (384 * E * I);
  
  // 应变能: U = q²L⁵/(240EI)
  const strainEnergy = (Math.pow(q, 2) * Math.pow(L, 5)) / (240 * E * I);
  
  return {
    R1, R2,
    M1: 0, M2: 0,
    internalForces,
    maxV,
    maxM,
    maxDeflection,
    deflectionPos: L / 2,
    strainEnergy,
  };
}

// ==========================================
// 悬臂梁集中荷载求解
// ==========================================
function solveCantileverBeamPointLoad(
  P: number,      // 荷载 (N), 向下为正
  a: number,      // 荷载距固定端距离 (mm)
  L: number,      // 梁长 (mm)
  E: number,      // 弹性模量 (MPa)
  I: number       // 惯性矩 (mm^4)
): BeamSolution {
  // 固定端反力
  const R1 = P;
  const M1 = -P * a;  // 固定端弯矩（逆时针为负）
  
  // 内力分布
  const nPoints = 21;
  const internalForces: BeamSolution['internalForces'] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const x = (i / nPoints) * L;
    let V: number, M: number;
    
    if (x <= a) {
      V = P;
      M = -P * (a - x);  // 固定端处最大
    } else {
      V = 0;
      M = 0;
    }
    
    internalForces.push({ x, V, M });
  }
  
  const maxM = Math.abs(M1);
  const maxV = P;
  
  // 自由端挠度: w = Pa²(3L-a)/(6EI), 当荷载在自由端(a=L): w = PL³/(3EI)
  const deflectionAtEnd = (P * Math.pow(a, 2) * (3 * L - a)) / (6 * E * I);
  
  // 应变能: U = P²a³/(6EI)
  const strainEnergy = (Math.pow(P, 2) * Math.pow(a, 3)) / (6 * E * I);
  
  return {
    R1, R2: 0,
    M1, M2: 0,
    internalForces,
    maxV,
    maxM,
    maxDeflection: deflectionAtEnd,
    deflectionPos: L,
    strainEnergy,
  };
}

// ==========================================
// 两端固定梁集中荷载求解
// ==========================================
function solveFixedBeamPointLoad(
  P: number,
  a: number,
  L: number,
  E: number,
  I: number
): BeamSolution {
  const b = L - a;
  
  // 超静定求解 - 使用公式
  const R1 = P * Math.pow(b, 2) * (3 * a + b) / Math.pow(L, 3);
  const R2 = P * Math.pow(a, 2) * (a + 3 * b) / Math.pow(L, 3);
  const M1 = -P * a * Math.pow(b, 2) / Math.pow(L, 2);
  const M2 = P * Math.pow(a, 2) * b / Math.pow(L, 2);
  
  // 内力分布
  const nPoints = 21;
  const internalForces: BeamSolution['internalForces'] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const x = (i / nPoints) * L;
    let V: number, M: number;
    
    if (x <= a) {
      V = R1;
      M = M1 + R1 * x;
    } else {
      V = R1 - P;
      M = M1 + R1 * x - P * (x - a);
    }
    
    internalForces.push({ x, V, M });
  }
  
  const maxM = Math.max(Math.abs(M1), Math.abs(M2), Math.abs(M1 + R1 * a));
  const maxV = Math.max(Math.abs(R1), Math.abs(R2));
  
  // 荷载点挠度
  const deflectionAtLoad = (P * Math.pow(a, 3) * Math.pow(b, 3)) / (3 * E * I * Math.pow(L, 3));
  
  // 应变能 (近似)
  const strainEnergy = (Math.pow(P, 2) * Math.pow(a, 3) * Math.pow(b, 3)) / (6 * E * I * Math.pow(L, 3));
  
  return {
    R1, R2,
    M1, M2,
    internalForces,
    maxV,
    maxM,
    maxDeflection: deflectionAtLoad,
    deflectionPos: a,
    strainEnergy,
  };
}

// ==========================================
// 判断结构类型并求解
// ==========================================
function identifyAndSolveBeam(
  nodes: SolverNode[],
  element: SolverElement,
  loads: SolverLoad[]
): BeamSolution | null {
  const n1 = nodes.find(n => n.id === element.nodeStart);
  const n2 = nodes.find(n => n.id === element.nodeEnd);
  if (!n1 || !n2) return null;
  
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const L = Math.sqrt(dx * dx + dy * dy);
  
  const E = element.material.E;
  const I = element.section.I;
  
  // 获取作用在此单元上的荷载
  const elementLoads = loads.filter(l => 
    l.targetId === element.id || l.targetId === n1.id || l.targetId === n2.id
  );
  
  if (elementLoads.length === 0) {
    // 无荷载
    return {
      R1: 0, R2: 0, M1: 0, M2: 0,
      internalForces: [{ x: 0, V: 0, M: 0 }, { x: L, V: 0, M: 0 }],
      maxV: 0, maxM: 0, maxDeflection: 0, deflectionPos: 0, strainEnergy: 0,
    };
  }
  
  // 判断支座类型
  const leftFixed = n1.support === 'fixed';
  const leftPinned = n1.support === 'pinned';
  const leftRoller = n1.support === 'roller';
  const rightFixed = n2.support === 'fixed';
  const rightPinned = n2.support === 'pinned';
  const rightRoller = n2.support === 'roller';
  
  // 处理第一个荷载
  const load = elementLoads[0];
  
  // 均布荷载
  if (load.type === 'distributed') {
    const q = load.value / 1000; // N/m -> N/mm
    
    if ((leftPinned || leftRoller) && (rightPinned || rightRoller)) {
      return solveSimplySupportedBeamDistributedLoad(q, L, E, I);
    }
    // 其他情况暂用简支梁
    return solveSimplySupportedBeamDistributedLoad(q, L, E, I);
  }
  
  // 集中荷载
  let P = load.value;
  let a: number;
  
  // 计算荷载位置
  if (load.targetType === 'element') {
    a = (load.position ?? 0.5) * L;
  } else if (load.targetId === n1.id) {
    a = 0;
  } else if (load.targetId === n2.id) {
    a = L;
  } else {
    a = L / 2;
  }
  
  // 考虑荷载方向 (90度为向下)
  const rad = (load.angle * Math.PI) / 180;
  const Py = P * Math.sin(rad);  // 垂直分量
  P = Math.abs(Py);
  
  // 根据支座类型选择求解方法
  if (leftFixed && !rightFixed && !rightPinned && !rightRoller) {
    // 悬臂梁
    return solveCantileverBeamPointLoad(P, a, L, E, I);
  } else if (leftFixed && rightFixed) {
    // 两端固定
    return solveFixedBeamPointLoad(P, a, L, E, I);
  } else if ((leftPinned || leftRoller) && (rightPinned || rightRoller)) {
    // 简支梁
    return solveSimplySupportedBeamPointLoad(P, a, L, E, I);
  } else if (leftPinned && rightFixed) {
    // 一端铰支一端固定 - 用简支梁近似
    return solveSimplySupportedBeamPointLoad(P, a, L, E, I);
  }
  
  // 默认按简支梁处理
  return solveSimplySupportedBeamPointLoad(P, a, L, E, I);
}

// ==========================================
// 主求解函数
// ==========================================
export function solveClassic(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[]
): SolverResult {
  // 验证输入
  if (nodes.length < 2) {
    return { success: false, message: '至少需要2个节点', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  if (elements.length < 1) {
    return { success: false, message: '至少需要1个单元', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  if (loads.length < 1) {
    return { success: false, message: '请添加荷载', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  // 检查支座约束
  const hasSupport = nodes.some(n => n.support !== 'none');
  if (!hasSupport) {
    return { success: false, message: '结构无约束，请添加支座', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  const nodeResults: NodeResult[] = [];
  const elementResults: ElementResult[] = [];
  let totalStrainEnergy = 0;
  
  // 逐个单元求解
  for (const element of elements) {
    const solution = identifyAndSolveBeam(nodes, element, loads);
    
    if (!solution) {
      return { success: false, message: `单元 ${element.id} 求解失败`, nodes: [], elements: [], totalStrainEnergy: 0 };
    }
    
    const n1 = nodes.find(n => n.id === element.nodeStart)!;
    const n2 = nodes.find(n => n.id === element.nodeEnd)!;
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const h = element.section.height;
    const I = element.section.I;
    
    // 节点结果
    const existingN1 = nodeResults.find(r => r.nodeId === n1.id);
    if (!existingN1) {
      nodeResults.push({
        nodeId: n1.id,
        displacement: { dx: 0, dy: 0, rz: 0 },
        reaction: n1.support !== 'none' ? {
          Fx: 0,
          Fy: solution.R1,
          Mz: solution.M1,
        } : undefined,
      });
    }
    
    const existingN2 = nodeResults.find(r => r.nodeId === n2.id);
    if (!existingN2) {
      // 计算端点位移（简化：线性插值）
      const deflectionScale = solution.maxDeflection / L;
      nodeResults.push({
        nodeId: n2.id,
        displacement: { 
          dx: 0, 
          dy: n2.support === 'none' ? solution.maxDeflection : 0, 
          rz: 0 
        },
        reaction: n2.support !== 'none' ? {
          Fx: 0,
          Fy: solution.R2,
          Mz: solution.M2,
        } : undefined,
      });
    }
    
    // 单元结果
    const internalForces = solution.internalForces.map(f => ({
      position: f.x / L,
      N: 0,
      V: f.V,
      M: f.M,
    }));
    
    // 最大应力
    const maxStress = solution.maxM * (h / 2) / I;
    
    elementResults.push({
      elementId: element.id,
      internalForces,
      maxStress,
      minStress: -maxStress,
      strainEnergy: solution.strainEnergy,
    });
    
    totalStrainEnergy += solution.strainEnergy;
  }
  
  return {
    success: true,
    message: '求解成功',
    nodes: nodeResults,
    elements: elementResults,
    totalStrainEnergy,
  };
}
