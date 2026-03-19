// ==========================================
// 高级材料力学求解器 - 支持复杂结构和多种荷载
// ==========================================

import {
  SolverNode,
  SolverElement,
  SolverLoad,
  SolverResult,
  NodeResult,
  ElementResult,
} from './SolverTypes';

// ==========================================
// 矩阵运算工具
// ==========================================
function createMatrix(rows: number, cols: number): number[][] {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

function createVector(size: number): number[] {
  return Array(size).fill(0);
}

// 高斯消元法求解线性方程组
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const augmented = A.map((row, i) => [...row, b[i]]);
  
  // 前向消元
  for (let col = 0; col < n; col++) {
    // 找主元
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
    
    if (Math.abs(augmented[col][col]) < 1e-12) {
      continue; // 跳过零主元
    }
    
    // 消元
    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }
  
  // 回代
  const x = createVector(n);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(augmented[i][i]) < 1e-12) {
      x[i] = 0;
      continue;
    }
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }
  
  return x;
}

// ==========================================
// 梁单元刚度矩阵 (6x6)
// ==========================================
function getBeamStiffnessMatrix(E: number, I: number, A: number, L: number): number[][] {
  const k = createMatrix(6, 6);
  
  // 轴向刚度
  const EA_L = E * A / L;
  k[0][0] = EA_L;  k[0][3] = -EA_L;
  k[3][0] = -EA_L; k[3][3] = EA_L;
  
  // 弯曲刚度
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

// ==========================================
// 坐标变换矩阵
// ==========================================
function getTransformMatrix(cos: number, sin: number): number[][] {
  const T = createMatrix(6, 6);
  T[0][0] = cos;  T[0][1] = sin;
  T[1][0] = -sin; T[1][1] = cos;
  T[2][2] = 1;
  T[3][3] = cos;  T[3][4] = sin;
  T[4][3] = -sin; T[4][4] = cos;
  T[5][5] = 1;
  return T;
}

// 矩阵转置
function transpose(M: number[][]): number[][] {
  const rows = M.length;
  const cols = M[0].length;
  const result = createMatrix(cols, rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = M[i][j];
    }
  }
  return result;
}

// 矩阵乘法
function multiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = createMatrix(rowsA, colsB);
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

// 矩阵乘向量
function multiplyMV(M: number[][], v: number[]): number[] {
  const rows = M.length;
  const cols = M[0].length;
  const result = createVector(rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i] += M[i][j] * v[j];
    }
  }
  return result;
}

// ==========================================
// 等效节点荷载计算
// ==========================================
interface EquivalentLoads {
  F1y: number;  // 节点1垂直力
  M1: number;   // 节点1弯矩
  F2y: number;  // 节点2垂直力
  M2: number;   // 节点2弯矩
}

// 集中力的等效节点荷载
function pointLoadEquivalent(P: number, a: number, L: number): EquivalentLoads {
  const b = L - a;
  return {
    F1y: P * b * b * (3 * a + b) / (L * L * L),
    M1: P * a * b * b / (L * L),
    F2y: P * a * a * (a + 3 * b) / (L * L * L),
    M2: -P * a * a * b / (L * L),
  };
}

// 均布荷载的等效节点荷载
function distributedLoadEquivalent(q: number, L: number): EquivalentLoads {
  return {
    F1y: q * L / 2,
    M1: q * L * L / 12,
    F2y: q * L / 2,
    M2: -q * L * L / 12,
  };
}

// 力矩的等效节点荷载
function momentLoadEquivalent(M: number, a: number, L: number): EquivalentLoads {
  const b = L - a;
  return {
    F1y: -6 * M * a * b / (L * L * L),
    M1: M * b * (2 * a - b) / (L * L),
    F2y: 6 * M * a * b / (L * L * L),
    M2: M * a * (2 * b - a) / (L * L),
  };
}

// 部分均布荷载的等效节点荷载 (从 a 到 b 位置)
function partialDistributedLoadEquivalent(q: number, a: number, b: number, L: number): EquivalentLoads {
  const c = b - a; // 荷载长度
  const m = (a + b) / 2; // 荷载中心位置
  
  // 使用积分或近似方法
  // 简化：将部分均布荷载等效为作用在中心的集中力
  const P = q * c;
  return pointLoadEquivalent(P, m, L);
}

// 三角形分布荷载的等效节点荷载 (从0到q线性变化，全跨)
function triangularLoadEquivalent(q: number, L: number, ascending: boolean): EquivalentLoads {
  if (ascending) {
    // 从左到右递增 (0 -> q)
    return {
      F1y: q * L / 6,
      M1: q * L * L / 30,
      F2y: q * L / 3,
      M2: -q * L * L / 20,
    };
  } else {
    // 从左到右递减 (q -> 0)
    return {
      F1y: q * L / 3,
      M1: q * L * L / 20,
      F2y: q * L / 6,
      M2: -q * L * L / 30,
    };
  }
}

// 梯形分布荷载的等效节点荷载 (从q1到q2)
function trapezoidalLoadEquivalent(q1: number, q2: number, L: number): EquivalentLoads {
  // 分解为均布荷载 + 三角形荷载
  const qMin = Math.min(q1, q2);
  const qDiff = Math.abs(q2 - q1);
  
  const uniform = distributedLoadEquivalent(qMin, L);
  const triangular = triangularLoadEquivalent(qDiff, L, q2 > q1);
  
  return {
    F1y: uniform.F1y + triangular.F1y,
    M1: uniform.M1 + triangular.M1,
    F2y: uniform.F2y + triangular.F2y,
    M2: uniform.M2 + triangular.M2,
  };
}

// ==========================================
// 内力计算
// ==========================================
interface InternalForcePoint {
  x: number;
  V: number;
  M: number;
  N: number;
}

function calculateInternalForces(
  element: SolverElement,
  n1: SolverNode,
  n2: SolverNode,
  loads: SolverLoad[],
  nodeDisplacements: Map<string, { dx: number; dy: number; rz: number }>
): InternalForcePoint[] {
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const L = Math.sqrt(dx * dx + dy * dy);
  const cos = dx / L;
  const sin = dy / L;
  
  const E = element.material.E;
  const I = element.section.I;
  
  // 获取节点位移
  const d1 = nodeDisplacements.get(n1.id) || { dx: 0, dy: 0, rz: 0 };
  const d2 = nodeDisplacements.get(n2.id) || { dx: 0, dy: 0, rz: 0 };
  
  // 转换到局部坐标
  const u1 = d1.dx * cos + d1.dy * sin;
  const v1 = -d1.dx * sin + d1.dy * cos;
  const theta1 = d1.rz;
  const u2 = d2.dx * cos + d2.dy * sin;
  const v2 = -d2.dx * sin + d2.dy * cos;
  const theta2 = d2.rz;
  
  // 端部内力（由位移引起）
  // 注意：这只是 K * u 部分，不包含固端力。
  // 真实的端部力 F_end = K * u - F_equivalent
  const EI = E * I;
  const V_disp = 12 * EI / (L * L * L) * (v1 - v2) + 6 * EI / (L * L) * (theta1 + theta2);
  const M1_disp = 6 * EI / (L * L) * (v1 - v2) + 4 * EI / L * theta1 + 2 * EI / L * theta2;
  
  // 获取作用在此单元上的荷载
  const elementLoads = loads.filter(l => 
    l.targetId === element.id || l.targetId === n1.id || l.targetId === n2.id
  );
  
  // 计算等效节点荷载 (局部坐标系)
  let F1y_eq = 0;
  let M1_eq = 0;
  
  const elemAngle = Math.atan2(dy, dx);
  
  for (const load of elementLoads) {
    // 只处理单元荷载，节点荷载已经在边界条件或全局力向量中处理了
    if (load.targetType !== 'element') continue;

    const loadRad = (load.angle * Math.PI) / 180;
    const localRad = loadRad - elemAngle;
    const sinLocal = Math.sin(localRad);
    
    // 只考虑垂直于梁的分量产生弯曲
    // 平行分量产生轴力（暂不处理轴力修正，因为主要关注弯矩）
    const Py = load.value * sinLocal; 
    
    let eq: EquivalentLoads | null = null;
    const a = (load.position ?? 0) * L;
    const b = (load.positionEnd ?? 1) * L;
    
    if (load.type === 'point') {
      eq = pointLoadEquivalent(Py, a, L);
    } else if (load.type === 'distributed') {
      const q = Py / 1000; // N/m -> N/mm
      if (load.position !== undefined && load.positionEnd !== undefined && 
          (load.position > 0 || load.positionEnd < 1)) {
        eq = partialDistributedLoadEquivalent(q, a, b, L);
      } else {
        eq = distributedLoadEquivalent(q, L);
      }
    } else if (load.type === 'triangular') {
        const q1 = Py / 1000;
        const q2 = (load.valueEnd ?? 0) * sinLocal / 1000;
        if (q1 === 0 || q2 === 0) {
          eq = triangularLoadEquivalent(Math.max(q1, q2), L, q2 > q1);
        } else {
          eq = trapezoidalLoadEquivalent(q1, q2, L);
        }
    } else if (load.type === 'moment') {
        eq = momentLoadEquivalent(load.value * 1000, a, L);
    }
    
    if (eq) {
        F1y_eq += eq.F1y;
        M1_eq += eq.M1;
    }
  }
  
  // 修正后的初始内力
  // 注意：V_disp 是节点力（向下为正），但材力中剪力定义为左上为正
  // 所以需要取反：V_shear = -V_nodal
  // 同样，M_disp 是节点力矩（顺时针为正），但材力中弯矩定义为下凸为正
  // 对于左端，顺时针力矩使梁上凸，所以也需要取反
  const V_start = -(V_disp - F1y_eq);
  const M_start = -(M1_disp - M1_eq);
  
  // 准备荷载列表，按位置排序，用于积分
  // 将所有荷载转换为统一的格式：位置，类型，值
  const sortedLoads = elementLoads.map(load => {
    let start = 0;
    let end = 0;
    let val = 0;
    let valEnd = 0;
    
    const sinLocal = Math.sin((load.angle * Math.PI / 180) - elemAngle);
    const Py = load.value * sinLocal;
    
    if (load.targetType === 'element') {
        start = (load.position ?? 0) * L;
        end = (load.positionEnd ?? 1) * L;
    } else if (load.targetId === n1.id) {
        start = 0; end = 0;
    } else if (load.targetId === n2.id) {
        start = L; end = L;
    }
    
    if (load.type === 'point') {
        val = Py;
    } else if (load.type === 'distributed') {
        val = Py / 1000;
        valEnd = val;
    } else if (load.type === 'triangular') {
        val = Py / 1000;
        valEnd = (load.valueEnd ?? 0) * sinLocal / 1000;
    } else if (load.type === 'moment') {
        val = load.value * 1000;
    }
    
    return { ...load, start, end, val, valEnd };
  }).sort((a, b) => a.start - b.start);

  // 生成内力分布点
  // 增加采样点数以提高精度
  const nPoints = 50;
  const forces: InternalForcePoint[] = [];
  
  // 使用截面法计算内力
  // 材力符号规定：
  // - 剪力 V：使截面左侧向上为正
  // - 弯矩 M：使梁下凸（拉下部）为正
  // 微分关系：dV/dx = -q (向下荷载为正), dM/dx = V
  
  for (let i = 0; i <= nPoints; i++) {
    const x = (i / nPoints) * L;
    
    // 基础内力（左端反力产生）
    // V(x) = V_start (常数，直到遇到荷载)
    // M(x) = M_start + V_start * x
    let V = V_start;
    let M = M_start + V_start * x;
    
    // 叠加荷载影响（荷载使剪力减小，使弯矩增加）
    for (const load of sortedLoads) {
        if (x < load.start) continue;
        
        const dist = Math.min(x, load.end) - load.start;
        const distTotal = x - load.start;
        
        if (load.type === 'point') {
            // 集中力 P (向下为正)
            // 过了荷载点后：V 减小 P, M 增加 P * (x - a)
            if (x >= load.start) {
                V -= load.val;
                M -= load.val * distTotal;
            }
        } else if (load.type === 'moment') {
            // 集中力矩 T (顺时针为正)
            // 过了力矩点后：M 减小 T
            if (x >= load.start) {
                M -= load.val;
            }
        } else if (load.type === 'distributed') {
            if (dist > 0) {
                // 均布荷载 q (向下为正)
                // V 减小 q * dist
                // M 减小 q * dist * (x - 荷载中心)
                const q = load.val;
                V -= q * dist;
                M -= q * dist * (distTotal - dist/2);
            }
        } else if (load.type === 'triangular') {
            if (dist > 0) {
                const a = load.start;
                const b = load.end;
                const loadLen = b - a;
                const q1 = load.val;
                const q2 = load.valEnd;
                const slope = (q2 - q1) / loadLen;
                
                const limit = Math.min(x, b);
                const len = limit - a;
                
                const F_part = q1 * len + 0.5 * slope * len * len;
                V -= F_part;
                M -= q1 * distTotal * len - 0.5 * q1 * len * len + 0.5 * slope * distTotal * len * len - slope * len * len * len / 3;
            }
        }
    }
    
    forces.push({ x, V, M, N: 0 });
  }
  
  return forces;
}

// ==========================================
// 主求解函数
// ==========================================
export function solveAdvanced(
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
  
  const hasSupport = nodes.some(n => n.support !== 'none');
  if (!hasSupport) {
    return { success: false, message: '结构无约束，请添加支座', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  // 建立节点编号映射
  const nodeIndexMap = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndexMap.set(n.id, i));
  
  const nDOF = nodes.length * 3; // 每个节点3个自由度
  
  // 初始化全局刚度矩阵和荷载向量
  const K = createMatrix(nDOF, nDOF);
  const F = createVector(nDOF);
  
  // 组装刚度矩阵
  for (const elem of elements) {
    const n1 = nodes.find(n => n.id === elem.nodeStart)!;
    const n2 = nodes.find(n => n.id === elem.nodeEnd)!;
    const i1 = nodeIndexMap.get(n1.id)!;
    const i2 = nodeIndexMap.get(n2.id)!;
    
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const cos = dx / L;
    const sin = dy / L;
    
    const E = elem.material.E;
    const I = elem.section.I;
    const A = elem.section.A;
    
    // 局部刚度矩阵
    const kLocal = getBeamStiffnessMatrix(E, I, A, L);
    
    // 坐标变换
    const T = getTransformMatrix(cos, sin);
    const Tt = transpose(T);
    const kGlobal = multiply(multiply(Tt, kLocal), T);
    
    // 组装到全局矩阵
    const dofMap = [i1 * 3, i1 * 3 + 1, i1 * 3 + 2, i2 * 3, i2 * 3 + 1, i2 * 3 + 2];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        K[dofMap[i]][dofMap[j]] += kGlobal[i][j];
      }
    }
    
    // 计算等效节点荷载
    const elemLoads = loads.filter(l => l.targetId === elem.id);
    for (const load of elemLoads) {
      let eq: EquivalentLoads;
      const a = (load.position ?? 0) * L;
      const b = (load.positionEnd ?? 1) * L;
      const q = load.value / 1000; // N/m -> N/mm
      
      if (load.type === 'point') {
        eq = pointLoadEquivalent(load.value, a, L);
      } else if (load.type === 'distributed') {
        // 检查是否是部分均布荷载
        if (load.position !== undefined && load.positionEnd !== undefined && 
            (load.position > 0 || load.positionEnd < 1)) {
          eq = partialDistributedLoadEquivalent(q, a, b, L);
        } else {
          eq = distributedLoadEquivalent(q, L);
        }
      } else if (load.type === 'triangular') {
        // 三角形荷载
        const q1 = load.value / 1000;
        const q2 = (load.valueEnd ?? 0) / 1000;
        if (q1 === 0 || q2 === 0) {
          // 纯三角形 (0 -> q 或 q -> 0)
          eq = triangularLoadEquivalent(Math.max(q1, q2), L, q2 > q1);
        } else {
          // 梯形荷载
          eq = trapezoidalLoadEquivalent(q1, q2, L);
        }
      } else if (load.type === 'moment') {
        eq = momentLoadEquivalent(load.value * 1000, a, L); // Nm -> Nmm
      } else {
        continue;
      }
      
      // 转换到全局坐标并添加到荷载向量
      F[i1 * 3 + 1] += eq.F1y * cos;
      F[i1 * 3 + 2] += eq.M1;
      F[i2 * 3 + 1] += eq.F2y * cos;
      F[i2 * 3 + 2] += eq.M2;
    }
  }
  
  // 添加节点荷载
  for (const load of loads) {
    const nodeIdx = nodeIndexMap.get(load.targetId);
    if (nodeIdx === undefined) continue;
    
    if (load.type === 'point') {
      const rad = (load.angle * Math.PI) / 180;
      F[nodeIdx * 3] += load.value * Math.cos(rad);     // Fx
      F[nodeIdx * 3 + 1] += load.value * Math.sin(rad); // Fy
    } else if (load.type === 'moment') {
      F[nodeIdx * 3 + 2] += load.value * 1000; // Nm -> Nmm
    }
  }
  
  // 备份原始刚度矩阵和荷载向量用于计算反力
  const K_orig = K.map(row => [...row]);
  const F_orig = [...F];

  // 应用边界条件（大数法）
  const bigNum = 1e20;
  for (const node of nodes) {
    const idx = nodeIndexMap.get(node.id)!;
    if (node.support === 'fixed') {
      K[idx * 3][idx * 3] = bigNum;
      K[idx * 3 + 1][idx * 3 + 1] = bigNum;
      K[idx * 3 + 2][idx * 3 + 2] = bigNum;
      F[idx * 3] = 0;
      F[idx * 3 + 1] = 0;
      F[idx * 3 + 2] = 0;
    } else if (node.support === 'pinned') {
      K[idx * 3][idx * 3] = bigNum;
      K[idx * 3 + 1][idx * 3 + 1] = bigNum;
      F[idx * 3] = 0;
      F[idx * 3 + 1] = 0;
    } else if (node.support === 'roller') {
      K[idx * 3 + 1][idx * 3 + 1] = bigNum;
      F[idx * 3 + 1] = 0;
    }
  }
  
  // 求解位移
  const U = solveLinearSystem(K, F);
  if (!U) {
    return { success: false, message: '刚度矩阵奇异，无法求解', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  // 提取节点位移
  const nodeDisplacements = new Map<string, { dx: number; dy: number; rz: number }>();
  const nodeResults: NodeResult[] = [];
  
  for (const node of nodes) {
    const idx = nodeIndexMap.get(node.id)!;
    const disp = {
      dx: U[idx * 3],
      dy: U[idx * 3 + 1],
      rz: U[idx * 3 + 2],
    };
    nodeDisplacements.set(node.id, disp);
    
    // 计算支座反力
    let reaction: { Fx: number; Fy: number; Mz: number } | undefined;
    if (node.support !== 'none') {
      // 使用原始刚度矩阵计算反力: R = K_orig * U - F_orig
      let Fx = 0, Fy = 0, Mz = 0;
      for (let j = 0; j < nDOF; j++) {
        Fx += K_orig[idx * 3][j] * U[j];
        Fy += K_orig[idx * 3 + 1][j] * U[j];
        Mz += K_orig[idx * 3 + 2][j] * U[j];
      }
      Fx -= F_orig[idx * 3];
      Fy -= F_orig[idx * 3 + 1];
      Mz -= F_orig[idx * 3 + 2];
      
      reaction = { Fx, Fy, Mz };
    }
    
    nodeResults.push({
      nodeId: node.id,
      displacement: disp,
      reaction,
    });
  }
  
  // 计算单元内力
  const elementResults: ElementResult[] = [];
  let totalStrainEnergy = 0;
  
  for (const elem of elements) {
    const n1 = nodes.find(n => n.id === elem.nodeStart)!;
    const n2 = nodes.find(n => n.id === elem.nodeEnd)!;
    
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const h = elem.section.height;
    const I = elem.section.I;
    const E = elem.material.E;
    
    // 计算内力分布
    const forces = calculateInternalForces(elem, n1, n2, loads, nodeDisplacements);
    
    // 找最大值
    let maxM = 0, maxV = 0;
    for (const f of forces) {
      if (Math.abs(f.M) > Math.abs(maxM)) maxM = f.M;
      if (Math.abs(f.V) > Math.abs(maxV)) maxV = f.V;
    }
    
    const maxStress = Math.abs(maxM) * (h / 2) / I;
    
    // 应变能（简化计算）
    let strainEnergy = 0;
    for (let i = 1; i < forces.length; i++) {
      const dx = forces[i].x - forces[i-1].x;
      const M_avg = (forces[i].M + forces[i-1].M) / 2;
      strainEnergy += M_avg * M_avg * dx / (2 * E * I);
    }
    
    elementResults.push({
      elementId: elem.id,
      internalForces: forces.map(f => ({
        position: f.x / L,
        N: f.N,
        V: f.V,
        M: f.M,
      })),
      maxStress,
      minStress: -maxStress,
      strainEnergy,
    });
    
    totalStrainEnergy += strainEnergy;
  }
  
  return {
    success: true,
    message: '求解成功',
    nodes: nodeResults,
    elements: elementResults,
    totalStrainEnergy,
  };
}
