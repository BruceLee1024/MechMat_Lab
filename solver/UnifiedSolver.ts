// ==========================================
// 统一求解器 - 自动选择最优求解方法
// ==========================================
// 
// 策略：
// 1. 简单单跨梁 → 截面法（解析解，精确）
// 2. 复杂结构（多跨、桁架、框架）→ 矩阵位移法
//

import {
  SolverNode,
  SolverElement,
  SolverLoad,
  SolverResult,
  NodeResult,
  ElementResult,
  StressPoint,
} from './SolverTypes';

// ==========================================
// 应力计算工具函数
// ==========================================

/**
 * 计算矩形截面的应力分布
 * @param N 轴力 (N)
 * @param V 剪力 (N)
 * @param M 弯矩 (Nmm)
 * @param A 截面积 (mm²)
 * @param I 惯性矩 (mm⁴)
 * @param b 截面宽度 (mm)
 * @param h 截面高度 (mm)
 * @param position 沿单元长度的位置 (0-1)
 */
function calculateStressPoint(
  N: number, V: number, M: number,
  A: number, I: number, b: number, h: number,
  position: number
): StressPoint {
  // 轴向正应力 σ = N/A
  const sigmaN = A > 0 ? N / A : 0;
  
  // 对于桁架单元 (I=0, h=0 或很小)，只有轴向应力
  const isTruss = I === 0 || h === 0;
  
  let sigmaMTop = 0;
  let sigmaMBottom = 0;
  let tauMax = 0;
  
  if (!isTruss && I > 0 && h > 0) {
    const y = h / 2; // 到中性轴的距离
    
    // 弯曲正应力 σ = My/I
    sigmaMTop = -M * y / I;    // 上表面
    sigmaMBottom = M * y / I;  // 下表面
    
    // 剪应力 - 使用简化公式 τ_max = 1.5 * V/A (矩形截面)
    tauMax = A > 0 ? 1.5 * Math.abs(V) / A : 0;
  }
  
  // 总正应力
  const sigmaTop = sigmaN + sigmaMTop;
  const sigmaBottom = sigmaN + sigmaMBottom;
  
  // 主应力计算 - 在中性轴处（正应力为sigmaN，剪应力为tauMax）
  // σ1,2 = σ/2 ± √((σ/2)² + τ²)
  const sigmaAvg = sigmaN / 2;
  const R = Math.sqrt(sigmaAvg * sigmaAvg + tauMax * tauMax);
  const sigma1 = sigmaAvg + R;
  const sigma2 = sigmaAvg - R;
  
  // 绝对最大剪应力
  const tauAbsMax = R;
  
  // von Mises 等效应力
  // 对于桁架（纯轴向应力）：σ_vm = |σ|
  // 对于梁：取最大值
  let sigmaVonMises: number;
  if (isTruss) {
    sigmaVonMises = Math.abs(sigmaN);
  } else {
    const vmTop = Math.abs(sigmaTop);
    const vmBottom = Math.abs(sigmaBottom);
    const vmNeutral = Math.sqrt(sigmaN * sigmaN + 3 * tauMax * tauMax);
    sigmaVonMises = Math.max(vmTop, vmBottom, vmNeutral);
  }
  
  return {
    position,
    sigmaN,
    sigmaMTop,
    sigmaMBottom,
    sigmaTop,
    sigmaBottom,
    tauMax,
    sigma1,
    sigma2,
    tauAbsMax,
    sigmaVonMises,
  };
}

/**
 * 计算单元的应力分布
 */
function calculateElementStress(
  internalForces: { position: number; N: number; V: number; M: number }[],
  A: number, I: number, b: number, h: number, yieldStrength: number
): {
  stressDistribution: StressPoint[];
  maxStress: number;
  minStress: number;
  maxShearStress: number;
  maxVonMises: number;
  safetyFactor: number;
} {
  const stressDistribution: StressPoint[] = [];
  let maxStress = -Infinity;
  let minStress = Infinity;
  let maxShearStress = 0;
  let maxVonMises = 0;
  
  for (const f of internalForces) {
    const stress = calculateStressPoint(f.N, f.V, f.M, A, I, b, h, f.position);
    stressDistribution.push(stress);
    
    // 更新极值
    maxStress = Math.max(maxStress, stress.sigmaTop, stress.sigmaBottom);
    minStress = Math.min(minStress, stress.sigmaTop, stress.sigmaBottom);
    maxShearStress = Math.max(maxShearStress, stress.tauMax, stress.tauAbsMax);
    maxVonMises = Math.max(maxVonMises, stress.sigmaVonMises);
  }
  
  // 安全系数 = 屈服强度 / 最大等效应力
  const safetyFactor = maxVonMises > 0 ? yieldStrength / maxVonMises : Infinity;
  
  return {
    stressDistribution,
    maxStress,
    minStress,
    maxShearStress,
    maxVonMises,
    safetyFactor,
  };
}

// ==========================================
// 结构类型识别
// ==========================================
interface StructureInfo {
  type: 'simple-beam' | 'cantilever' | 'continuous' | 'truss' | 'frame' | 'complex';
  spans: number;
  hasAxialLoad: boolean;
  isStaticallyDeterminate: boolean;
}

function analyzeStructure(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[]
): StructureInfo {
  // 统计支座约束数
  let nConstraints = 0;
  let hasFixed = false;
  let hasPinned = false;
  let hasRoller = false;
  
  for (const node of nodes) {
    if (node.support === 'fixed') {
      nConstraints += 3;
      hasFixed = true;
    } else if (node.support === 'pinned') {
      nConstraints += 2;
      hasPinned = true;
    } else if (node.support === 'roller') {
      nConstraints += 1;
      hasRoller = true;
    }
  }
  
  // 检查是否有桁架单元
  const hasTruss = elements.some(e => e.type === 'truss');
  
  // 检查是否有轴向荷载
  const hasAxialLoad = loads.some(l => {
    if (l.type === 'point' && l.angle !== 90 && l.angle !== -90) {
      return true;
    }
    return false;
  });
  
  // 静定性判断（简化）
  // 梁：约束数 = 3 为静定
  // 桁架：2n = m + r (n节点数, m杆件数, r约束数)
  const isStaticallyDeterminate = hasTruss 
    ? (2 * nodes.length === elements.length + nConstraints)
    : (nConstraints === 3);
  
  // 判断结构类型
  if (hasTruss) {
    return { type: 'truss', spans: elements.length, hasAxialLoad: true, isStaticallyDeterminate };
  }
  
  // 单跨梁判断
  if (elements.length === 1) {
    const elem = elements[0];
    const n1 = nodes.find(n => n.id === elem.nodeStart);
    const n2 = nodes.find(n => n.id === elem.nodeEnd);
    
    if (n1 && n2) {
      // 悬臂梁：一端固定，一端自由
      if ((n1.support === 'fixed' && n2.support === 'none') ||
          (n1.support === 'none' && n2.support === 'fixed')) {
        return { type: 'cantilever', spans: 1, hasAxialLoad, isStaticallyDeterminate: true };
      }
      
      // 简支梁：两端简支
      if ((n1.support === 'pinned' || n1.support === 'roller') &&
          (n2.support === 'pinned' || n2.support === 'roller')) {
        return { type: 'simple-beam', spans: 1, hasAxialLoad, isStaticallyDeterminate: true };
      }
      
      // 一端固定一端简支（超静定）
      if ((n1.support === 'fixed' && (n2.support === 'pinned' || n2.support === 'roller')) ||
          ((n1.support === 'pinned' || n1.support === 'roller') && n2.support === 'fixed')) {
        return { type: 'simple-beam', spans: 1, hasAxialLoad, isStaticallyDeterminate: false };
      }
      
      // 两端固定（超静定）
      if (n1.support === 'fixed' && n2.support === 'fixed') {
        return { type: 'simple-beam', spans: 1, hasAxialLoad, isStaticallyDeterminate: false };
      }
    }
  }
  
  // 多跨连续梁
  if (elements.length > 1 && !hasTruss) {
    return { type: 'continuous', spans: elements.length, hasAxialLoad, isStaticallyDeterminate: false };
  }
  
  return { type: 'complex', spans: elements.length, hasAxialLoad, isStaticallyDeterminate };
}

// ==========================================
// 截面法求解器 - 单跨梁解析解
// ==========================================

// 简支梁集中力
function solveSimplySupported_PointLoad(
  P: number, a: number, L: number, E: number, I: number, h: number
): { forces: { position: number; N: number; V: number; M: number }[]; R1: number; R2: number; maxDeflection: number } {
  const b = L - a;
  const R1 = P * b / L;
  const R2 = P * a / L;
  
  // 收集采样点，确保包含荷载作用点的左右极限
  const positions = new Set<number>();
  const nPoints = 21;
  for (let i = 0; i <= nPoints; i++) {
    positions.add(i / nPoints);
  }
  // 添加荷载作用点的左右极限
  const loadPos = a / L;
  if (loadPos > 0 && loadPos < 1) {
    positions.add(loadPos - 1e-9);
    positions.add(loadPos + 1e-9);
  }
  
  const sortedPositions = Array.from(positions).sort((a, b) => a - b);
  const forces: { position: number; N: number; V: number; M: number }[] = [];
  
  for (const xi of sortedPositions) {
    const x = xi * L;
    let V: number, M: number;
    
    if (x <= a + 1e-6) {
      V = R1;
      M = R1 * x;
    } else {
      V = -R2;
      M = R2 * (L - x);
    }
    
    forces.push({ position: xi, N: 0, V, M });
  }
  
  // 最大挠度（近似在荷载点）
  const maxDeflection = (P * a * a * b * b) / (3 * E * I * L);
  
  return { forces, R1, R2, maxDeflection };
}

// 简支梁均布荷载
function solveSimplySupported_DistributedLoad(
  q: number, L: number, E: number, I: number
): { forces: { position: number; N: number; V: number; M: number }[]; R1: number; R2: number; maxDeflection: number } {
  const R1 = q * L / 2;
  const R2 = q * L / 2;
  
  const nPoints = 21;
  const forces: { position: number; N: number; V: number; M: number }[] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const xi = i / nPoints;
    const x = xi * L;
    const V = R1 - q * x;
    const M = R1 * x - q * x * x / 2;
    forces.push({ position: xi, N: 0, V, M });
  }
  
  const maxDeflection = (5 * q * L * L * L * L) / (384 * E * I);
  
  return { forces, R1, R2, maxDeflection };
}

// 悬臂梁集中力（固定端在左）
function solveCantilever_PointLoad(
  P: number, a: number, L: number, E: number, I: number
): { forces: { position: number; N: number; V: number; M: number }[]; R1: number; M1: number; maxDeflection: number } {
  const R1 = P;
  const M1 = -P * a;
  
  const nPoints = 21;
  const forces: { position: number; N: number; V: number; M: number }[] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const xi = i / nPoints;
    const x = xi * L;
    let V: number, M: number;
    
    if (x <= a) {
      V = P;
      M = -P * (a - x);
    } else {
      V = 0;
      M = 0;
    }
    
    forces.push({ position: xi, N: 0, V, M });
  }
  
  const maxDeflection = (P * a * a * (3 * L - a)) / (6 * E * I);
  
  return { forces, R1, M1, maxDeflection };
}

// 悬臂梁均布荷载
function solveCantilever_DistributedLoad(
  q: number, L: number, E: number, I: number
): { forces: { position: number; N: number; V: number; M: number }[]; R1: number; M1: number; maxDeflection: number } {
  const R1 = q * L;
  const M1 = -q * L * L / 2;
  
  const nPoints = 21;
  const forces: { position: number; N: number; V: number; M: number }[] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const xi = i / nPoints;
    const x = xi * L;
    const V = q * (L - x);
    const M = -q * (L - x) * (L - x) / 2;
    forces.push({ position: xi, N: 0, V, M });
  }
  
  const maxDeflection = (q * L * L * L * L) / (8 * E * I);
  
  return { forces, R1, M1, maxDeflection };
}

// 两端固定梁集中力
function solveFixedFixed_PointLoad(
  P: number, a: number, L: number, E: number, I: number
): { forces: { position: number; N: number; V: number; M: number }[]; R1: number; R2: number; M1: number; M2: number; maxDeflection: number } {
  const b = L - a;
  const R1 = P * b * b * (3 * a + b) / (L * L * L);
  const R2 = P * a * a * (a + 3 * b) / (L * L * L);
  const M1 = -P * a * b * b / (L * L);
  const M2 = P * a * a * b / (L * L);
  
  const nPoints = 21;
  const forces: { position: number; N: number; V: number; M: number }[] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const xi = i / nPoints;
    const x = xi * L;
    let V: number, M: number;
    
    if (x <= a) {
      V = R1;
      M = M1 + R1 * x;
    } else {
      V = R1 - P;
      M = M1 + R1 * x - P * (x - a);
    }
    
    forces.push({ position: xi, N: 0, V, M });
  }
  
  const maxDeflection = (P * a * a * a * b * b * b) / (3 * E * I * L * L * L);
  
  return { forces, R1, R2, M1, M2, maxDeflection };
}

// 两端固定梁均布荷载
function solveFixedFixed_DistributedLoad(
  q: number, L: number, E: number, I: number
): { forces: { position: number; N: number; V: number; M: number }[]; R1: number; R2: number; M1: number; M2: number; maxDeflection: number } {
  const R1 = q * L / 2;
  const R2 = q * L / 2;
  const M1 = -q * L * L / 12;
  const M2 = q * L * L / 12;
  
  const nPoints = 21;
  const forces: { position: number; N: number; V: number; M: number }[] = [];
  
  for (let i = 0; i <= nPoints; i++) {
    const xi = i / nPoints;
    const x = xi * L;
    const V = R1 - q * x;
    const M = M1 + R1 * x - q * x * x / 2;
    forces.push({ position: xi, N: 0, V, M });
  }
  
  const maxDeflection = (q * L * L * L * L) / (384 * E * I);
  
  return { forces, R1, R2, M1, M2, maxDeflection };
}

// 截面法主函数
function solveBySectionMethod(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[],
  structureInfo: StructureInfo
): SolverResult | null {
  if (elements.length !== 1) return null;
  
  const elem = elements[0];
  const n1 = nodes.find(n => n.id === elem.nodeStart);
  const n2 = nodes.find(n => n.id === elem.nodeEnd);
  if (!n1 || !n2) return null;
  
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const L = Math.sqrt(dx * dx + dy * dy);
  const E = elem.material.E;
  const I = elem.section.I;
  const A = elem.section.A;
  const h = elem.section.height;
  
  // 判断支座类型
  const leftFixed = n1.support === 'fixed';
  const rightFixed = n2.support === 'fixed';
  const leftSupported = n1.support === 'pinned' || n1.support === 'roller';
  const rightSupported = n2.support === 'pinned' || n2.support === 'roller';
  
  // 获取荷载
  const load = loads[0];
  if (!load) return null;
  
  // 计算荷载位置
  let loadPos = 0.5;
  if (load.targetType === 'element') {
    // 验证荷载作用在当前单元上
    if (load.targetId !== elem.id) {
      return null; // 荷载不在这个单元上
    }
    loadPos = load.position ?? 0.5;
  } else if (load.targetType === 'node') {
    // 节点荷载
    if (load.targetId === n1.id) {
      loadPos = 0;
    } else if (load.targetId === n2.id) {
      loadPos = 1;
    } else {
      // 荷载作用在其他节点上，不属于这个单元
      return null;
    }
  }
  const a = loadPos * L;
  
  // 荷载值（考虑方向，90度为向下）
  const rad = (load.angle * Math.PI) / 180;
  const Py = load.value * Math.sin(rad);
  const P = Math.abs(Py);
  
  let result: {
    forces: { position: number; N: number; V: number; M: number }[];
    R1: number;
    R2?: number;
    M1?: number;
    M2?: number;
    maxDeflection: number;
  } | null = null;
  
  // 根据支座和荷载类型选择公式
  if (structureInfo.type === 'cantilever') {
    // 悬臂梁
    if (load.type === 'point') {
      result = solveCantilever_PointLoad(P, a, L, E, I);
    } else if (load.type === 'distributed') {
      const q = load.value / 1000; // N/m -> N/mm
      result = solveCantilever_DistributedLoad(q, L, E, I);
    }
  } else if (structureInfo.type === 'simple-beam') {
    // 简支梁或其他单跨梁
    if (leftFixed && rightFixed) {
      // 两端固定
      if (load.type === 'point') {
        result = solveFixedFixed_PointLoad(P, a, L, E, I);
      } else if (load.type === 'distributed') {
        const q = load.value / 1000;
        result = solveFixedFixed_DistributedLoad(q, L, E, I);
      }
    } else if (leftSupported && rightSupported) {
      // 简支梁
      if (load.type === 'point') {
        result = solveSimplySupported_PointLoad(P, a, L, E, I, h);
      } else if (load.type === 'distributed') {
        const q = load.value / 1000;
        result = solveSimplySupported_DistributedLoad(q, L, E, I);
      }
    }
    // 一端固定一端简支的情况暂不用截面法，交给矩阵位移法
  }
  
  if (!result) return null;
  
  // 构建结果
  const nodeResults: NodeResult[] = [];
  
  // 节点1结果
  const node1Result: NodeResult = {
    nodeId: n1.id,
    displacement: { dx: 0, dy: 0, rz: 0 },
  };
  if (n1.support !== 'none') {
    node1Result.reaction = {
      Fx: 0,
      Fy: result.R1,
      Mz: result.M1 ?? 0,
    };
  }
  nodeResults.push(node1Result);
  
  // 节点2结果
  const node2Result: NodeResult = {
    nodeId: n2.id,
    displacement: { 
      dx: 0, 
      dy: n2.support === 'none' ? result.maxDeflection : 0, 
      rz: 0 
    },
  };
  if (n2.support !== 'none') {
    node2Result.reaction = {
      Fx: 0,
      Fy: result.R2 ?? 0,
      Mz: result.M2 ?? 0,
    };
  }
  nodeResults.push(node2Result);
  
  // 计算应力分布
  const b = elem.section.width;
  const yieldStrength = elem.material.yield;
  const stressResult = calculateElementStress(result.forces, A, I, b, h, yieldStrength);
  
  // 应变能（简化计算）
  let strainEnergy = 0;
  for (let i = 1; i < result.forces.length; i++) {
    const dx = (result.forces[i].position - result.forces[i-1].position) * L;
    const M_avg = (result.forces[i].M + result.forces[i-1].M) / 2;
    strainEnergy += M_avg * M_avg * dx / (2 * E * I);
  }
  
  const elementResults: ElementResult[] = [{
    elementId: elem.id,
    internalForces: result.forces,
    stressDistribution: stressResult.stressDistribution,
    maxStress: stressResult.maxStress,
    minStress: stressResult.minStress,
    maxShearStress: stressResult.maxShearStress,
    maxVonMises: stressResult.maxVonMises,
    safetyFactor: stressResult.safetyFactor,
    strainEnergy,
  }];
  
  return {
    success: true,
    message: '求解成功（截面法）',
    nodes: nodeResults,
    elements: elementResults,
    totalStrainEnergy: strainEnergy,
  };
}


// ==========================================
// 矩阵位移法求解器 - 复杂结构
// ==========================================

// 矩阵工具函数
function createMatrix(rows: number, cols: number): number[][] {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

function createVector(size: number): number[] {
  return Array(size).fill(0);
}

// 高斯消元法
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    
    if (Math.abs(aug[col][col]) < 1e-12) continue;
    
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }
  
  const x = createVector(n);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-12) {
      x[i] = 0;
      continue;
    }
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    x[i] /= aug[i][i];
  }
  
  return x;
}

// 梁单元刚度矩阵（局部坐标系）
function getBeamStiffnessLocal(E: number, A: number, I: number, L: number): number[][] {
  const k = createMatrix(6, 6);
  
  // 轴向
  const EA_L = E * A / L;
  k[0][0] = EA_L;  k[0][3] = -EA_L;
  k[3][0] = -EA_L; k[3][3] = EA_L;
  
  // 弯曲
  const EI = E * I;
  const L2 = L * L;
  const L3 = L2 * L;
  
  k[1][1] = 12 * EI / L3;
  k[1][2] = 6 * EI / L2;
  k[1][4] = -12 * EI / L3;
  k[1][5] = 6 * EI / L2;
  
  k[2][1] = 6 * EI / L2;
  k[2][2] = 4 * EI / L;
  k[2][4] = -6 * EI / L2;
  k[2][5] = 2 * EI / L;
  
  k[4][1] = -12 * EI / L3;
  k[4][2] = -6 * EI / L2;
  k[4][4] = 12 * EI / L3;
  k[4][5] = -6 * EI / L2;
  
  k[5][1] = 6 * EI / L2;
  k[5][2] = 2 * EI / L;
  k[5][4] = -6 * EI / L2;
  k[5][5] = 4 * EI / L;
  
  return k;
}

// 桁架单元刚度矩阵（局部坐标系）
function getTrussStiffnessLocal(E: number, A: number, L: number): number[][] {
  const k = createMatrix(4, 4);
  const EA_L = E * A / L;
  
  k[0][0] = EA_L;  k[0][2] = -EA_L;
  k[2][0] = -EA_L; k[2][2] = EA_L;
  
  return k;
}

// 桁架单元刚度矩阵（直接全局坐标系）
function getTrussStiffnessGlobal(E: number, A: number, L: number, cos: number, sin: number): number[][] {
  const k = createMatrix(4, 4);
  const EA_L = E * A / L;
  const c2 = cos * cos;
  const s2 = sin * sin;
  const cs = cos * sin;
  
  k[0][0] = c2 * EA_L;   k[0][1] = cs * EA_L;   k[0][2] = -c2 * EA_L;  k[0][3] = -cs * EA_L;
  k[1][0] = cs * EA_L;   k[1][1] = s2 * EA_L;   k[1][2] = -cs * EA_L;  k[1][3] = -s2 * EA_L;
  k[2][0] = -c2 * EA_L;  k[2][1] = -cs * EA_L;  k[2][2] = c2 * EA_L;   k[2][3] = cs * EA_L;
  k[3][0] = -cs * EA_L;  k[3][1] = -s2 * EA_L;  k[3][2] = cs * EA_L;   k[3][3] = s2 * EA_L;
  
  return k;
}

// 坐标变换矩阵
function getTransformMatrix(cos: number, sin: number, isBeam: boolean): number[][] {
  if (isBeam) {
    const T = createMatrix(6, 6);
    T[0][0] = cos;  T[0][1] = sin;
    T[1][0] = -sin; T[1][1] = cos;
    T[2][2] = 1;
    T[3][3] = cos;  T[3][4] = sin;
    T[4][3] = -sin; T[4][4] = cos;
    T[5][5] = 1;
    return T;
  } else {
    const T = createMatrix(4, 4);
    T[0][0] = cos;  T[0][1] = sin;
    T[1][0] = -sin; T[1][1] = cos;
    T[2][2] = cos;  T[2][3] = sin;
    T[3][2] = -sin; T[3][3] = cos;
    return T;
  }
}

// 矩阵乘法
function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = B[0].length, p = B.length;
  const C = createMatrix(m, n);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < p; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

// 矩阵转置
function transpose(A: number[][]): number[][] {
  const m = A.length, n = A[0].length;
  const B = createMatrix(n, m);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      B[j][i] = A[i][j];
    }
  }
  return B;
}

// 等效节点荷载
function getEquivalentLoads(load: SolverLoad, L: number, cos: number, sin: number): number[] {
  // 返回 [F1x, F1y, M1, F2x, F2y, M2] 局部坐标系
  const eq = [0, 0, 0, 0, 0, 0];
  
  const loadRad = (load.angle * Math.PI) / 180;
  const Px = load.value * Math.cos(loadRad);
  const Py = load.value * Math.sin(loadRad);
  
  // 转到局部坐标
  const Plocal_x = Px * cos + Py * sin;
  const Plocal_y = -Px * sin + Py * cos;
  
  const a = (load.position ?? 0.5) * L;
  const b = L - a;
  
  if (load.type === 'point') {
    // 集中力等效节点荷载
    eq[0] = Plocal_x * b / L;
    eq[1] = Plocal_y * b * b * (3 * a + b) / (L * L * L);
    eq[2] = Plocal_y * a * b * b / (L * L);
    eq[3] = Plocal_x * a / L;
    eq[4] = Plocal_y * a * a * (a + 3 * b) / (L * L * L);
    eq[5] = -Plocal_y * a * a * b / (L * L);
  } else if (load.type === 'distributed') {
    const q = load.value / 1000; // N/m -> N/mm
    // 荷载方向转到局部坐标
    const qx = q * Math.cos(loadRad);
    const qy = q * Math.sin(loadRad);
    const qlocal_y = -qx * sin + qy * cos; // 局部y方向分量
    eq[1] = qlocal_y * L / 2;
    eq[2] = qlocal_y * L * L / 12;
    eq[4] = qlocal_y * L / 2;
    eq[5] = -qlocal_y * L * L / 12;
  } else if (load.type === 'moment') {
    const M = load.value * 1000; // Nm -> Nmm
    eq[1] = -6 * M * a * b / (L * L * L);
    eq[2] = M * b * (2 * a - b) / (L * L);
    eq[4] = 6 * M * a * b / (L * L * L);
    eq[5] = M * a * (2 * b - a) / (L * L);
  }
  
  return eq;
}

// 矩阵位移法主函数
function solveByMatrixMethod(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[]
): SolverResult {
  const nodeIndex = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndex.set(n.id, i));
  
  // 判断是否全为桁架
  const allTruss = elements.every(e => e.type === 'truss');
  // 如果有梁单元，所有节点都需要3个自由度；如果全是桁架，只需要2个
  const dofPerNode = allTruss ? 2 : 3;
  const nDOF = nodes.length * dofPerNode;
  
  const K = createMatrix(nDOF, nDOF);
  const F = createVector(nDOF);
  
  // 存储单元信息
  const elemInfo: { elem: SolverElement; L: number; cos: number; sin: number; i1: number; i2: number }[] = [];
  
  // 组装刚度矩阵
  for (const elem of elements) {
    const i1 = nodeIndex.get(elem.nodeStart)!;
    const i2 = nodeIndex.get(elem.nodeEnd)!;
    const n1 = nodes[i1];
    const n2 = nodes[i2];
    
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const cos = dx / L;
    const sin = dy / L;
    
    elemInfo.push({ elem, L, cos, sin, i1, i2 });
    
    const E = elem.material.E;
    const A = elem.section.A;
    const I = elem.section.I;
    const isBeam = elem.type === 'beam';
    
    // 局部刚度矩阵和自由度映射
    let kGlobal: number[][];
    let dofMap: number[];
    
    if (allTruss) {
      // 纯桁架结构，每个节点2个自由度
      // 直接使用全局刚度矩阵公式，避免变换矩阵计算误差
      kGlobal = getTrussStiffnessGlobal(E, A, L, cos, sin);
      dofMap = [i1 * 2, i1 * 2 + 1, i2 * 2, i2 * 2 + 1];
    } else if (isBeam) {
      // 梁单元，6个自由度
      const kLocal = getBeamStiffnessLocal(E, A, I, L);
      const T = getTransformMatrix(cos, sin, true);
      const Tt = transpose(T);
      kGlobal = matMul(matMul(Tt, kLocal), T);
      dofMap = [i1 * 3, i1 * 3 + 1, i1 * 3 + 2, i2 * 3, i2 * 3 + 1, i2 * 3 + 2];
    } else {
      // 混合结构中的桁架单元，需要扩展到6x6（转角自由度刚度为0）
      // 直接使用全局刚度矩阵公式
      const kGlobal4 = getTrussStiffnessGlobal(E, A, L, cos, sin);
      
      // 扩展到6x6，转角自由度位置为0
      kGlobal = createMatrix(6, 6);
      // 映射: 4x4的[0,1,2,3] -> 6x6的[0,1,3,4] (跳过转角2,5)
      const map4to6 = [0, 1, 3, 4];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          kGlobal[map4to6[i]][map4to6[j]] = kGlobal4[i][j];
        }
      }
      dofMap = [i1 * 3, i1 * 3 + 1, i1 * 3 + 2, i2 * 3, i2 * 3 + 1, i2 * 3 + 2];
    }
    
    for (let i = 0; i < dofMap.length; i++) {
      for (let j = 0; j < dofMap.length; j++) {
        K[dofMap[i]][dofMap[j]] += kGlobal[i][j];
      }
    }
    
    // 单元荷载等效节点力
    const elemLoads = loads.filter(l => l.targetId === elem.id);
    for (const load of elemLoads) {
      const eq = getEquivalentLoads(load, L, cos, sin);
      
      // 转到全局坐标
      if (isBeam) {
        F[i1 * 3] += eq[0] * cos - eq[1] * sin;
        F[i1 * 3 + 1] += eq[0] * sin + eq[1] * cos;
        F[i1 * 3 + 2] += eq[2];
        F[i2 * 3] += eq[3] * cos - eq[4] * sin;
        F[i2 * 3 + 1] += eq[3] * sin + eq[4] * cos;
        F[i2 * 3 + 2] += eq[5];
      }
    }
  }
  
  // 节点荷载
  for (const load of loads) {
    if (load.targetType !== 'node') continue;
    const idx = nodeIndex.get(load.targetId);
    if (idx === undefined) continue;
    
    const rad = (load.angle * Math.PI) / 180;
    if (load.type === 'point') {
      if (allTruss) {
        F[idx * 2] += load.value * Math.cos(rad);
        F[idx * 2 + 1] += load.value * Math.sin(rad);
      } else {
        F[idx * 3] += load.value * Math.cos(rad);
        F[idx * 3 + 1] += load.value * Math.sin(rad);
      }
    } else if (load.type === 'moment' && !allTruss) {
      F[idx * 3 + 2] += load.value * 1000;
    }
  }
  
  // 备份用于计算反力
  const K_orig = K.map(row => [...row]);
  const F_orig = [...F];
  
  // 边界条件（大数法）
  const BIG = 1e20;
  for (const node of nodes) {
    const idx = nodeIndex.get(node.id)!;
    if (allTruss) {
      if (node.support === 'fixed' || node.support === 'pinned') {
        K[idx * 2][idx * 2] = BIG;
        K[idx * 2 + 1][idx * 2 + 1] = BIG;
        F[idx * 2] = 0;
        F[idx * 2 + 1] = 0;
      } else if (node.support === 'roller') {
        K[idx * 2 + 1][idx * 2 + 1] = BIG;
        F[idx * 2 + 1] = 0;
      }
    } else {
      if (node.support === 'fixed') {
        K[idx * 3][idx * 3] = BIG;
        K[idx * 3 + 1][idx * 3 + 1] = BIG;
        K[idx * 3 + 2][idx * 3 + 2] = BIG;
        F[idx * 3] = 0;
        F[idx * 3 + 1] = 0;
        F[idx * 3 + 2] = 0;
      } else if (node.support === 'pinned') {
        K[idx * 3][idx * 3] = BIG;
        K[idx * 3 + 1][idx * 3 + 1] = BIG;
        F[idx * 3] = 0;
        F[idx * 3 + 1] = 0;
      } else if (node.support === 'roller') {
        K[idx * 3 + 1][idx * 3 + 1] = BIG;
        F[idx * 3 + 1] = 0;
      }
    }
  }
  
  // 求解
  const U = solveLinearSystem(K, F);
  if (!U) {
    return { success: false, message: '刚度矩阵奇异，结构可能是机构', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  // 节点结果
  const nodeResults: NodeResult[] = nodes.map((node, i) => {
    const idx = nodeIndex.get(node.id)!;
    const disp = allTruss
      ? { dx: U[idx * 2], dy: U[idx * 2 + 1], rz: 0 }
      : { dx: U[idx * 3], dy: U[idx * 3 + 1], rz: U[idx * 3 + 2] };
    
    let reaction: { Fx: number; Fy: number; Mz: number } | undefined;
    if (node.support !== 'none') {
      let Fx = 0, Fy = 0, Mz = 0;
      if (allTruss) {
        for (let j = 0; j < nDOF; j++) {
          Fx += K_orig[idx * 2][j] * U[j];
          Fy += K_orig[idx * 2 + 1][j] * U[j];
        }
        Fx -= F_orig[idx * 2];
        Fy -= F_orig[idx * 2 + 1];
      } else {
        for (let j = 0; j < nDOF; j++) {
          Fx += K_orig[idx * 3][j] * U[j];
          Fy += K_orig[idx * 3 + 1][j] * U[j];
          Mz += K_orig[idx * 3 + 2][j] * U[j];
        }
        Fx -= F_orig[idx * 3];
        Fy -= F_orig[idx * 3 + 1];
        Mz -= F_orig[idx * 3 + 2];
      }
      reaction = { Fx, Fy, Mz };
    }
    
    return { nodeId: node.id, displacement: disp, reaction };
  });
  
  // 单元结果
  let totalStrainEnergy = 0;
  const elementResults: ElementResult[] = elemInfo.map(({ elem, L, cos, sin, i1, i2 }) => {
    const isBeam = elem.type === 'beam';
    const E = elem.material.E;
    const A = elem.section.A;
    const I = elem.section.I;
    const h = elem.section.height;
    
    // 获取节点位移（全局）
    let uGlobal: number[];
    let useBeamTransform: boolean;
    
    if (allTruss) {
      // 纯桁架结构，每个节点2个自由度
      uGlobal = [U[i1 * 2], U[i1 * 2 + 1], U[i2 * 2], U[i2 * 2 + 1]];
      useBeamTransform = false;
    } else if (isBeam) {
      // 梁单元，6个自由度
      uGlobal = [
        U[i1 * 3], U[i1 * 3 + 1], U[i1 * 3 + 2],
        U[i2 * 3], U[i2 * 3 + 1], U[i2 * 3 + 2]
      ];
      useBeamTransform = true;
    } else {
      // 混合结构中的桁架单元，只取平移自由度（每个节点3个自由度中的前2个）
      uGlobal = [U[i1 * 3], U[i1 * 3 + 1], U[i2 * 3], U[i2 * 3 + 1]];
      useBeamTransform = false;
    }
    
    // 转到局部坐标
    const T = getTransformMatrix(cos, sin, useBeamTransform);
    const uLocal: number[] = [];
    for (let i = 0; i < uGlobal.length; i++) {
      let sum = 0;
      for (let j = 0; j < uGlobal.length; j++) {
        sum += T[i][j] * uGlobal[j];
      }
      uLocal.push(sum);
    }
    
    // 获取作用在此单元上的荷载
    const elemLoads = loads.filter(l => l.targetId === elem.id);
    
    // 计算内力
    const forces: { position: number; N: number; V: number; M: number }[] = [];
    
    if (isBeam) {
      const N_axial = (E * A / L) * (uLocal[3] - uLocal[0]);
      const EI = E * I;
      const L2 = L * L;
      const L3 = L2 * L;
      
      // 计算由位移产生的节点力 (K_local * u_local)
      const F_disp = [
        (E * A / L) * (uLocal[0] - uLocal[3]),
        (12 * EI / L3) * uLocal[1] + (6 * EI / L2) * uLocal[2] - (12 * EI / L3) * uLocal[4] + (6 * EI / L2) * uLocal[5],
        (6 * EI / L2) * uLocal[1] + (4 * EI / L) * uLocal[2] - (6 * EI / L2) * uLocal[4] + (2 * EI / L) * uLocal[5],
        (E * A / L) * (uLocal[3] - uLocal[0]),
        -(12 * EI / L3) * uLocal[1] - (6 * EI / L2) * uLocal[2] + (12 * EI / L3) * uLocal[4] - (6 * EI / L2) * uLocal[5],
        (6 * EI / L2) * uLocal[1] + (2 * EI / L) * uLocal[2] - (6 * EI / L2) * uLocal[4] + (4 * EI / L) * uLocal[5],
      ];
      
      // 计算固端力（两端固定时荷载产生的端部反力）
      const F_fixed = [0, 0, 0, 0, 0, 0];
      for (const load of elemLoads) {
        const loadRad = (load.angle * Math.PI) / 180;
        const Py = load.value * Math.sin(loadRad);
        
        if (load.type === 'point') {
          const a = (load.position ?? 0.5) * L;
          const b = L - a;
          // 固端力公式
          F_fixed[1] += Py * b * b * (3 * a + b) / L3;
          F_fixed[2] += Py * a * b * b / L2;
          F_fixed[4] += Py * a * a * (a + 3 * b) / L3;
          F_fixed[5] += -Py * a * a * b / L2;
        } else if (load.type === 'distributed') {
          const q = Py / 1000; // N/m -> N/mm
          // 全跨均布荷载固端力
          F_fixed[1] += q * L / 2;
          F_fixed[2] += q * L2 / 12;
          F_fixed[4] += q * L / 2;
          F_fixed[5] += -q * L2 / 12;
        } else if (load.type === 'moment') {
          const a = (load.position ?? 0.5) * L;
          const b = L - a;
          const M0 = load.value * 1000; // Nm -> Nmm
          F_fixed[1] += -6 * M0 * a * b / L3;
          F_fixed[2] += M0 * b * (2 * a - b) / L2;
          F_fixed[4] += 6 * M0 * a * b / L3;
          F_fixed[5] += M0 * a * (2 * b - a) / L2;
        }
      }
      
      // 单元端部内力 = 位移产生的节点力 - 固端力
      // 注意：节点力和截面内力的符号规定不同
      // 左端：截面内力 = -节点力（因为节点力是作用在节点上的，截面内力是截面左侧对右侧的作用）
      // 这里 V1, M1 是左端截面的剪力和弯矩
      const V1 = F_disp[1] - F_fixed[1];  // 左端剪力
      const M1 = F_disp[2] - F_fixed[2];  // 左端弯矩
      
      // 收集所有关键位置
      const keyPositions = new Set<number>([0, 1]);
      const epsilon = 1e-9;
      
      for (const load of elemLoads) {
        if (load.type === 'point' || load.type === 'moment') {
          const pos = load.position ?? 0.5;
          if (pos > 0 && pos < 1) {
            keyPositions.add(pos - epsilon);
            keyPositions.add(pos + epsilon);
          }
        } else if (load.type === 'distributed' || load.type === 'triangular') {
          const startPos = load.position ?? 0;
          const endPos = load.positionEnd ?? 1;
          if (startPos > 0) keyPositions.add(startPos);
          if (endPos < 1) keyPositions.add(endPos);
        }
      }
      
      const nPoints = 21;
      for (let i = 0; i <= nPoints; i++) {
        keyPositions.add(i / nPoints);
      }
      
      const sortedPositions = Array.from(keyPositions).sort((a, b) => a - b);
      
      // 使用截面法计算内力分布
      const calcForceAt = (xi: number): { position: number; N: number; V: number; M: number } => {
        const x = xi * L;
        // 从左端开始，用截面法
        // V(x) = V1 - 荷载在[0,x]区间的合力
        // M(x) = M1 + V1*x - 荷载在[0,x]区间对x截面的力矩
        let V = V1;
        let M = M1 + V1 * x;
        
        for (const load of elemLoads) {
          const loadRad = (load.angle * Math.PI) / 180;
          const Py = load.value * Math.sin(loadRad);
          
          if (load.type === 'point') {
            const a = (load.position ?? 0.5) * L;
            if (x > a + 1e-6) {
              V -= Py;
              M -= Py * (x - a);
            }
          } else if (load.type === 'distributed') {
            const q = Py / 1000;
            const startPos = (load.position ?? 0) * L;
            const endPos = (load.positionEnd ?? 1) * L;
            
            if (x > startPos) {
              const loadedLength = Math.min(x, endPos) - startPos;
              if (loadedLength > 0) {
                V -= q * loadedLength;
                M -= q * loadedLength * (x - startPos - loadedLength / 2);
              }
            }
          } else if (load.type === 'triangular') {
            const q1 = (load.value / 1000) * Math.sin(loadRad);
            const q2 = ((load.valueEnd ?? 0) / 1000) * Math.sin(loadRad);
            const startPos = (load.position ?? 0) * L;
            const endPos = (load.positionEnd ?? 1) * L;
            const loadLen = endPos - startPos;
            
            if (x > startPos && loadLen > 0) {
              const xInLoad = Math.min(x, endPos) - startPos;
              const slope = (q2 - q1) / loadLen;
              const F_part = q1 * xInLoad + 0.5 * slope * xInLoad * xInLoad;
              V -= F_part;
              // 力矩 = q1*xInLoad*(xInLoad/2) + slope*xInLoad²/2 * (xInLoad/3)
              M -= q1 * xInLoad * xInLoad / 2 + slope * xInLoad * xInLoad * xInLoad / 6;
            }
          } else if (load.type === 'moment') {
            const a = (load.position ?? 0.5) * L;
            const T = load.value * 1000;
            if (x > a + 1e-6) {
              M -= T;
            }
          }
        }
        
        return { position: xi, N: N_axial, V, M };
      };
      
      for (const xi of sortedPositions) {
        forces.push(calcForceAt(xi));
      }
    } else {
      // 桁架只有轴力
      const N = E * A / L * (uLocal[2] - uLocal[0]);
      forces.push({ position: 0, N, V: 0, M: 0 });
      forces.push({ position: 1, N, V: 0, M: 0 });
    }
    
    // 计算应力分布
    const b = elem.section.width;
    const yieldStrength = elem.material.yield;
    const stressResult = calculateElementStress(forces, A, I, b, h, yieldStrength);
    
    // 应变能
    let strainEnergy = 0;
    if (isBeam) {
      const N = forces[0].N;
      strainEnergy += (N * N * L) / (2 * E * A);
      for (let i = 1; i < forces.length; i++) {
        const dx = L / (forces.length - 1);
        const M_avg = (forces[i].M + forces[i-1].M) / 2;
        strainEnergy += M_avg * M_avg * dx / (2 * E * I);
      }
    } else {
      const N = forces[0].N;
      strainEnergy = (N * N * L) / (2 * E * A);
    }
    totalStrainEnergy += strainEnergy;
    
    return {
      elementId: elem.id,
      internalForces: forces,
      stressDistribution: stressResult.stressDistribution,
      maxStress: stressResult.maxStress,
      minStress: stressResult.minStress,
      maxShearStress: stressResult.maxShearStress,
      maxVonMises: stressResult.maxVonMises,
      safetyFactor: stressResult.safetyFactor,
      strainEnergy,
    };
  });
  
  return {
    success: true,
    message: '求解成功（矩阵位移法）',
    nodes: nodeResults,
    elements: elementResults,
    totalStrainEnergy,
  };
}

// ==========================================
// 统一求解入口
// ==========================================
export function solveUnified(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[]
): SolverResult {
  // 输入验证
  if (nodes.length < 2) {
    return { success: false, message: '至少需要2个节点', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  if (elements.length < 1) {
    return { success: false, message: '至少需要1个单元', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  if (loads.length < 1) {
    return { success: false, message: '请添加荷载', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  const hasSupport = nodes.some(n => n.support !== 'none');
  if (!hasSupport) {
    return { success: false, message: '结构无约束，请添加支座', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  // 分析结构类型
  const structureInfo = analyzeStructure(nodes, elements, loads);
  
  // 简单单跨梁且只有一个荷载 → 截面法
  if ((structureInfo.type === 'simple-beam' || structureInfo.type === 'cantilever') && 
      elements.length === 1 && loads.length === 1) {
    const sectionResult = solveBySectionMethod(nodes, elements, loads, structureInfo);
    if (sectionResult) {
      return sectionResult;
    }
  }
  
  // 其他情况 → 矩阵位移法
  return solveByMatrixMethod(nodes, elements, loads);
}

// 导出结构分析函数供外部使用
export { analyzeStructure };
export type { StructureInfo };
