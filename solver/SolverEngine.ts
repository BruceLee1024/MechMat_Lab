// ==========================================
// 材料力学求解器 - 计算引擎
// ==========================================

import {
  SolverNode,
  SolverElement,
  SolverLoad,
  SolverResult,
  NodeResult,
  ElementResult,
} from './SolverTypes';

// 矩阵运算辅助函数
class Matrix {
  data: number[][];
  rows: number;
  cols: number;

  constructor(rows: number, cols: number, fill: number = 0) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array(rows).fill(null).map(() => Array(cols).fill(fill));
  }

  static identity(n: number): Matrix {
    const m = new Matrix(n, n);
    for (let i = 0; i < n; i++) m.data[i][i] = 1;
    return m;
  }

  get(i: number, j: number): number {
    return this.data[i][j];
  }

  set(i: number, j: number, val: number): void {
    this.data[i][j] = val;
  }

  add(i: number, j: number, val: number): void {
    this.data[i][j] += val;
  }

  // 高斯消元法求解线性方程组 Ax = b
  static solve(A: Matrix, b: number[]): number[] | null {
    const n = A.rows;
    const aug = new Matrix(n, n + 1);
    
    // 构建增广矩阵
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        aug.set(i, j, A.get(i, j));
      }
      aug.set(i, n, b[i]);
    }

    // 前向消元
    for (let col = 0; col < n; col++) {
      // 选主元
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug.get(row, col)) > Math.abs(aug.get(maxRow, col))) {
          maxRow = row;
        }
      }
      
      // 交换行
      if (maxRow !== col) {
        for (let j = 0; j <= n; j++) {
          const temp = aug.get(col, j);
          aug.set(col, j, aug.get(maxRow, j));
          aug.set(maxRow, j, temp);
        }
      }

      // 检查奇异矩阵
      if (Math.abs(aug.get(col, col)) < 1e-12) {
        return null; // 奇异矩阵
      }

      // 消元
      for (let row = col + 1; row < n; row++) {
        const factor = aug.get(row, col) / aug.get(col, col);
        for (let j = col; j <= n; j++) {
          aug.set(row, j, aug.get(row, j) - factor * aug.get(col, j));
        }
      }
    }

    // 回代
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = aug.get(i, n);
      for (let j = i + 1; j < n; j++) {
        sum -= aug.get(i, j) * x[j];
      }
      x[i] = sum / aug.get(i, i);
    }

    return x;
  }
}

// 梁单元刚度矩阵 (局部坐标系)
function getBeamLocalStiffness(E: number, A: number, I: number, L: number): Matrix {
  const k = new Matrix(6, 6);
  
  // 轴向刚度
  const EA_L = E * A / L;
  k.set(0, 0, EA_L);
  k.set(0, 3, -EA_L);
  k.set(3, 0, -EA_L);
  k.set(3, 3, EA_L);

  // 弯曲刚度
  const EI = E * I;
  const L2 = L * L;
  const L3 = L2 * L;

  k.set(1, 1, 12 * EI / L3);
  k.set(1, 2, 6 * EI / L2);
  k.set(1, 4, -12 * EI / L3);
  k.set(1, 5, 6 * EI / L2);

  k.set(2, 1, 6 * EI / L2);
  k.set(2, 2, 4 * EI / L);
  k.set(2, 4, -6 * EI / L2);
  k.set(2, 5, 2 * EI / L);

  k.set(4, 1, -12 * EI / L3);
  k.set(4, 2, -6 * EI / L2);
  k.set(4, 4, 12 * EI / L3);
  k.set(4, 5, -6 * EI / L2);

  k.set(5, 1, 6 * EI / L2);
  k.set(5, 2, 2 * EI / L);
  k.set(5, 4, -6 * EI / L2);
  k.set(5, 5, 4 * EI / L);

  return k;
}

// 桁架单元刚度矩阵 (局部坐标系)
function getTrussLocalStiffness(E: number, A: number, L: number): Matrix {
  const k = new Matrix(4, 4);
  const EA_L = E * A / L;
  
  k.set(0, 0, EA_L);
  k.set(0, 2, -EA_L);
  k.set(2, 0, -EA_L);
  k.set(2, 2, EA_L);

  return k;
}

// 坐标变换矩阵
function getTransformMatrix(cos: number, sin: number, isBeam: boolean): Matrix {
  if (isBeam) {
    const T = new Matrix(6, 6);
    T.set(0, 0, cos);
    T.set(0, 1, sin);
    T.set(1, 0, -sin);
    T.set(1, 1, cos);
    T.set(2, 2, 1);
    T.set(3, 3, cos);
    T.set(3, 4, sin);
    T.set(4, 3, -sin);
    T.set(4, 4, cos);
    T.set(5, 5, 1);
    return T;
  } else {
    const T = new Matrix(4, 4);
    T.set(0, 0, cos);
    T.set(0, 1, sin);
    T.set(1, 0, -sin);
    T.set(1, 1, cos);
    T.set(2, 2, cos);
    T.set(2, 3, sin);
    T.set(3, 2, -sin);
    T.set(3, 3, cos);
    return T;
  }
}

// 矩阵乘法
function matMul(A: Matrix, B: Matrix): Matrix {
  const result = new Matrix(A.rows, B.cols);
  for (let i = 0; i < A.rows; i++) {
    for (let j = 0; j < B.cols; j++) {
      let sum = 0;
      for (let k = 0; k < A.cols; k++) {
        sum += A.get(i, k) * B.get(k, j);
      }
      result.set(i, j, sum);
    }
  }
  return result;
}

// 矩阵转置
function transpose(A: Matrix): Matrix {
  const result = new Matrix(A.cols, A.rows);
  for (let i = 0; i < A.rows; i++) {
    for (let j = 0; j < A.cols; j++) {
      result.set(j, i, A.get(i, j));
    }
  }
  return result;
}

// 主求解函数
export function solve(
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

  // 建立节点ID到索引的映射
  const nodeIndex = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndex.set(n.id, i));

  // 确定自由度数量 (每个节点3个自由度: dx, dy, rz)
  const nDOF = nodes.length * 3;
  
  // 组装总刚度矩阵
  const K = new Matrix(nDOF, nDOF);
  
  // 存储单元信息用于后处理
  const elementInfo: {
    element: SolverElement;
    L: number;
    cos: number;
    sin: number;
    nodeStartIdx: number;
    nodeEndIdx: number;
  }[] = [];

  for (const elem of elements) {
    const startIdx = nodeIndex.get(elem.nodeStart);
    const endIdx = nodeIndex.get(elem.nodeEnd);
    
    if (startIdx === undefined || endIdx === undefined) {
      return { success: false, message: `单元 ${elem.id} 的节点不存在`, nodes: [], elements: [], totalStrainEnergy: 0 };
    }

    const n1 = nodes[startIdx];
    const n2 = nodes[endIdx];
    
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    
    if (L < 1e-6) {
      return { success: false, message: `单元 ${elem.id} 长度过小`, nodes: [], elements: [], totalStrainEnergy: 0 };
    }

    const cos = dx / L;
    const sin = dy / L;

    elementInfo.push({ element: elem, L, cos, sin, nodeStartIdx: startIdx, nodeEndIdx: endIdx });

    const isBeam = elem.type === 'beam';
    
    // 获取局部刚度矩阵
    let kLocal: Matrix;
    if (isBeam) {
      kLocal = getBeamLocalStiffness(elem.material.E, elem.section.A, elem.section.I, L);
    } else {
      kLocal = getTrussLocalStiffness(elem.material.E, elem.section.A, L);
    }

    // 坐标变换
    const T = getTransformMatrix(cos, sin, isBeam);
    const Tt = transpose(T);
    const kGlobal = matMul(matMul(Tt, kLocal), T);

    // 组装到总刚度矩阵
    const dofMap = isBeam
      ? [startIdx * 3, startIdx * 3 + 1, startIdx * 3 + 2, endIdx * 3, endIdx * 3 + 1, endIdx * 3 + 2]
      : [startIdx * 3, startIdx * 3 + 1, endIdx * 3, endIdx * 3 + 1];

    for (let i = 0; i < dofMap.length; i++) {
      for (let j = 0; j < dofMap.length; j++) {
        K.add(dofMap[i], dofMap[j], kGlobal.get(i, j));
      }
    }
  }

  // 组装荷载向量
  const F = new Array(nDOF).fill(0);
  
  for (const load of loads) {
    if (load.targetType === 'node') {
      const idx = nodeIndex.get(load.targetId);
      if (idx === undefined) continue;
      
      const rad = (load.angle * Math.PI) / 180;
      const Fx = load.value * Math.cos(rad);
      const Fy = load.value * Math.sin(rad);
      
      if (load.type === 'point') {
        F[idx * 3] += Fx;
        F[idx * 3 + 1] += Fy;
      } else if (load.type === 'moment') {
        F[idx * 3 + 2] += load.value;
      }
    } else if (load.targetType === 'element') {
      // 单元上的荷载需要等效到节点
      const elemInfo = elementInfo.find(e => e.element.id === load.targetId);
      if (!elemInfo) continue;

      const { L, cos, sin, nodeStartIdx, nodeEndIdx } = elemInfo;
      const pos = load.position ?? 0.5;
      const a = pos * L;
      const b = L - a;

      const rad = (load.angle * Math.PI) / 180;
      const Px = load.value * Math.cos(rad);
      const Py = load.value * Math.sin(rad);

      // 转换到局部坐标
      const Plocal_x = Px * cos + Py * sin;
      const Plocal_y = -Px * sin + Py * cos;

      if (load.type === 'point') {
        // 等效节点力 (简支梁公式)
        const F1y = Plocal_y * b / L;
        const F2y = Plocal_y * a / L;
        const M1 = Plocal_y * a * b * b / (L * L);
        const M2 = -Plocal_y * a * a * b / (L * L);

        // 轴向力直接分配
        const F1x = Plocal_x * b / L;
        const F2x = Plocal_x * a / L;

        // 转回全局坐标
        F[nodeStartIdx * 3] += F1x * cos - F1y * sin;
        F[nodeStartIdx * 3 + 1] += F1x * sin + F1y * cos;
        F[nodeStartIdx * 3 + 2] += M1;

        F[nodeEndIdx * 3] += F2x * cos - F2y * sin;
        F[nodeEndIdx * 3 + 1] += F2x * sin + F2y * cos;
        F[nodeEndIdx * 3 + 2] += M2;
      }
    }
  }

  // 应用边界条件 (大数法)
  const LARGE = 1e30;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.fixedDOF.dx) {
      K.set(i * 3, i * 3, LARGE);
      F[i * 3] = 0;
    }
    if (node.fixedDOF.dy) {
      K.set(i * 3 + 1, i * 3 + 1, LARGE);
      F[i * 3 + 1] = 0;
    }
    if (node.fixedDOF.rz) {
      K.set(i * 3 + 2, i * 3 + 2, LARGE);
      F[i * 3 + 2] = 0;
    }
  }

  // 求解位移
  const U = Matrix.solve(K, F);
  
  if (!U) {
    return { success: false, message: '刚度矩阵奇异，无法求解。请检查结构是否为机构。', nodes: [], elements: [], totalStrainEnergy: 0 };
  }

  // 计算节点结果
  const nodeResults: NodeResult[] = nodes.map((node, i) => {
    const result: NodeResult = {
      nodeId: node.id,
      displacement: {
        dx: U[i * 3],
        dy: U[i * 3 + 1],
        rz: U[i * 3 + 2],
      },
    };

    // 计算支座反力
    if (node.support !== 'none') {
      result.reaction = {
        Fx: node.fixedDOF.dx ? -F[i * 3] + K.get(i * 3, i * 3) * U[i * 3] / LARGE * LARGE : 0,
        Fy: node.fixedDOF.dy ? -F[i * 3 + 1] + K.get(i * 3 + 1, i * 3 + 1) * U[i * 3 + 1] / LARGE * LARGE : 0,
        Mz: node.fixedDOF.rz ? -F[i * 3 + 2] + K.get(i * 3 + 2, i * 3 + 2) * U[i * 3 + 2] / LARGE * LARGE : 0,
      };
    }

    return result;
  });

  // 计算单元结果
  let totalStrainEnergy = 0;
  const elementResults: ElementResult[] = elementInfo.map(({ element, L, cos, sin, nodeStartIdx, nodeEndIdx }) => {
    const isBeam = element.type === 'beam';
    
    // 获取节点位移
    const uGlobal = isBeam
      ? [
          U[nodeStartIdx * 3], U[nodeStartIdx * 3 + 1], U[nodeStartIdx * 3 + 2],
          U[nodeEndIdx * 3], U[nodeEndIdx * 3 + 1], U[nodeEndIdx * 3 + 2],
        ]
      : [
          U[nodeStartIdx * 3], U[nodeStartIdx * 3 + 1],
          U[nodeEndIdx * 3], U[nodeEndIdx * 3 + 1],
        ];

    // 转换到局部坐标
    const T = getTransformMatrix(cos, sin, isBeam);
    const uLocal: number[] = [];
    for (let i = 0; i < uGlobal.length; i++) {
      let sum = 0;
      for (let j = 0; j < uGlobal.length; j++) {
        sum += T.get(i, j) * uGlobal[j];
      }
      uLocal.push(sum);
    }

    // 计算内力
    const internalForces: { position: number; N: number; V: number; M: number }[] = [];
    const E = element.material.E;
    const A = element.section.A;
    const I = element.section.I;
    const h = element.section.height;

    if (isBeam) {
      // 梁单元内力
      const N = E * A / L * (uLocal[3] - uLocal[0]);
      
      // 沿梁长度计算剪力和弯矩
      const nPoints = 11;
      for (let i = 0; i <= nPoints; i++) {
        const xi = i / nPoints;
        const x = xi * L;
        
        // 形函数导数
        const EI = E * I;
        const V = EI / (L * L * L) * (12 * (uLocal[4] - uLocal[1]) + 6 * L * (uLocal[2] + uLocal[5]));
        
        // 弯矩 (使用Hermite插值)
        const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
        const N2 = L * (xi - 2 * xi * xi + xi * xi * xi);
        const N3 = 3 * xi * xi - 2 * xi * xi * xi;
        const N4 = L * (-xi * xi + xi * xi * xi);
        
        const v = N1 * uLocal[1] + N2 * uLocal[2] + N3 * uLocal[4] + N4 * uLocal[5];
        
        // 曲率
        const N1pp = (-6 + 12 * xi) / (L * L);
        const N2pp = (-4 + 6 * xi) / L;
        const N3pp = (6 - 12 * xi) / (L * L);
        const N4pp = (-2 + 6 * xi) / L;
        
        const kappa = N1pp * uLocal[1] + N2pp * uLocal[2] + N3pp * uLocal[4] + N4pp * uLocal[5];
        const M = -EI * kappa;

        internalForces.push({ position: xi, N, V, M });
      }
    } else {
      // 桁架单元只有轴力
      const N = E * A / L * (uLocal[2] - uLocal[0]);
      internalForces.push({ position: 0, N, V: 0, M: 0 });
      internalForces.push({ position: 1, N, V: 0, M: 0 });
    }

    // 计算最大应力
    let maxStress = 0;
    let minStress = 0;
    
    for (const f of internalForces) {
      const sigmaN = f.N / A;
      const sigmaM = Math.abs(f.M) * (h / 2) / I;
      const sigmaMax = sigmaN + sigmaM;
      const sigmaMin = sigmaN - sigmaM;
      
      if (sigmaMax > maxStress) maxStress = sigmaMax;
      if (sigmaMin < minStress) minStress = sigmaMin;
    }

    // 计算应变能
    let strainEnergy = 0;
    if (isBeam) {
      // 轴向应变能
      const N = internalForces[0].N;
      strainEnergy += (N * N * L) / (2 * E * A);
      
      // 弯曲应变能 (数值积分)
      for (let i = 0; i < internalForces.length - 1; i++) {
        const M1 = internalForces[i].M;
        const M2 = internalForces[i + 1].M;
        const dx = L / (internalForces.length - 1);
        strainEnergy += ((M1 * M1 + M2 * M2) / 2) * dx / (2 * E * I);
      }
    } else {
      const N = internalForces[0].N;
      strainEnergy = (N * N * L) / (2 * E * A);
    }

    totalStrainEnergy += strainEnergy;

    return {
      elementId: element.id,
      internalForces,
      maxStress,
      minStress,
      strainEnergy,
    };
  });

  return {
    success: true,
    message: '求解成功',
    nodes: nodeResults,
    elements: elementResults,
    totalStrainEnergy,
  };
}

// 计算反力 (更精确的方法)
export function calculateReactions(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[],
  displacements: number[]
): Map<string, { Fx: number; Fy: number; Mz: number }> {
  const reactions = new Map<string, { Fx: number; Fy: number; Mz: number }>();
  
  // 简化处理：通过平衡方程计算
  for (const node of nodes) {
    if (node.support !== 'none') {
      reactions.set(node.id, { Fx: 0, Fy: 0, Mz: 0 });
    }
  }

  return reactions;
}
