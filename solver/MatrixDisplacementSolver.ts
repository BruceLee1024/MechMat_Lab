// ==========================================
// 矩阵位移法求解器 - 求解复杂结构
// ==========================================

import { SolverNode, SolverElement, SolverLoad, SolverResult, NodeResult, ElementResult } from './SolverTypes';
import { createMatrix, createVector, solveLinearSystem, matMul, transpose } from './MatrixUtils';
import { getBeamStiffnessLocal, getTrussStiffnessGlobal, getTransformMatrix, getEquivalentLoads } from './StiffnessMatrix';
import { calculateElementStress } from './StressCalculator';

/** 将集中力分解到单元局部坐标系 */
function toLocalForce(value: number, angleDeg: number, cos: number, sin: number): { Px: number; Py: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const Gx = value * Math.cos(rad);
  const Gy = value * Math.sin(rad);
  return { Px: Gx * cos + Gy * sin, Py: -Gx * sin + Gy * cos };
}

/** 将分布荷载强度(N/mm)分解到单元局部坐标系 */
function toLocalQ(q: number, angleDeg: number, cos: number, sin: number): { qx: number; qy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const Gx = q * Math.cos(rad);
  const Gy = q * Math.sin(rad);
  return { qx: Gx * cos + Gy * sin, qy: -Gx * sin + Gy * cos };
}

/** 计算梁单元挠度曲线（Hermite形函数 + 固端特解） */
function computeBeamDeflection(
  uLocal: number[], L: number, E: number, I: number,
  elemLoads: SolverLoad[], cos: number, sin: number
): { position: number; dy: number }[] {
  const v1 = uLocal[1], theta1 = uLocal[2];
  const v2 = uLocal[4], theta2 = uLocal[5];
  const curve: { position: number; dy: number }[] = [];
  const nPoints = 21;
  for (let i = 0; i <= nPoints; i++) {
    const xi = i / nPoints;
    const x = xi * L;
    const xi2 = xi * xi, xi3 = xi2 * xi;
    // Hermite 形函数插值（齐次解）
    let dy = (1 - 3*xi2 + 2*xi3) * v1 + L*(xi - 2*xi2 + xi3) * theta1
           + (3*xi2 - 2*xi3) * v2 + L*(-xi2 + xi3) * theta2;
    // 叠加固端特解（使用局部坐标系分量）
    for (const load of elemLoads) {
      if (load.type === 'point') {
        const { Py } = toLocalForce(load.value, load.angle, cos, sin);
        const a = (load.position ?? 0.5) * L, b = L - a;
        const L3 = L*L*L;
        if (x <= a) {
          dy += Py * b*b * x*x * (3*a*L - x*(3*a + b)) / (6*E*I*L3);
        } else {
          dy += Py * a*a * (L-x)*(L-x) * (3*b*L - (L-x)*(3*b + a)) / (6*E*I*L3);
        }
      } else if (load.type === 'distributed') {
        const { qy } = toLocalQ(load.value / 1000, load.angle, cos, sin);
        dy += qy * x*x * (L-x)*(L-x) / (24*E*I);
      } else if (load.type === 'moment') {
        const a = (load.position ?? 0.5) * L, b = L - a;
        const M0 = load.value * 1000, L3 = L*L*L;
        if (x <= a) {
          dy += M0 * a * x*x * b * (2*L - 3*b + x*b/a) / (6*E*I*L3);
        } else {
          const xr = L - x;
          dy -= M0 * b * xr*xr * a * (2*L - 3*a + xr*a/b) / (6*E*I*L3);
        }
      } else if (load.type === 'triangular') {
        const { qy: qy1 } = toLocalQ(load.value / 1000, load.angle, cos, sin);
        const { qy: qy2 } = toLocalQ((load.valueEnd ?? 0) / 1000, load.angle, cos, sin);
        const loadLen = ((load.positionEnd ?? 1) - (load.position ?? 0)) * L;
        if (loadLen > 0) {
          dy += ((qy1 + qy2) / 2) * x*x * (L-x)*(L-x) / (24*E*I);
        }
      }
    }
    curve.push({ position: xi, dy });
  }
  return curve;
}

/** 计算应变能（梯形积分） */
function computeStrainEnergy(
  forces: { position: number; N: number; M: number }[],
  E: number, A: number, I: number, L: number, isBeam: boolean
): number {
  if (!isBeam) {
    const N = forces[0].N;
    return (N * N * L) / (2 * E * A);
  }
  let energy = 0;
  for (let i = 1; i < forces.length; i++) {
    const segDx = (forces[i].position - forces[i-1].position) * L;
    if (segDx < 1e-12) continue;
    // 轴力应变能: ∫N²/(2EA)dx
    const N_avg = (forces[i].N + forces[i-1].N) / 2;
    energy += N_avg * N_avg * segDx / (2 * E * A);
    // 弯矩应变能: ∫M²/(2EI)dx
    const M_avg = (forces[i].M + forces[i-1].M) / 2;
    energy += M_avg * M_avg * segDx / (2 * E * I);
  }
  return energy;
}

/** 计算固端力（局部坐标系，含轴向分量） */
function computeFixedEndForces(
  elemLoads: SolverLoad[], L: number, cos: number, sin: number
): number[] {
  const Ff = [0, 0, 0, 0, 0, 0];
  const L2 = L * L, L3 = L2 * L;
  for (const load of elemLoads) {
    if (load.type === 'point') {
      const { Px, Py } = toLocalForce(load.value, load.angle, cos, sin);
      const a = (load.position ?? 0.5) * L, b = L - a;
      Ff[0] += Px * b / L;  Ff[3] += Px * a / L;
      Ff[1] += Py * b*b * (3*a + b) / L3;
      Ff[2] += Py * a * b*b / L2;
      Ff[4] += Py * a*a * (a + 3*b) / L3;
      Ff[5] += -Py * a*a * b / L2;
    } else if (load.type === 'distributed') {
      const { qx, qy } = toLocalQ(load.value / 1000, load.angle, cos, sin);
      Ff[0] += qx * L / 2;  Ff[3] += qx * L / 2;
      Ff[1] += qy * L / 2;  Ff[2] += qy * L2 / 12;
      Ff[4] += qy * L / 2;  Ff[5] += -qy * L2 / 12;
    } else if (load.type === 'moment') {
      const a = (load.position ?? 0.5) * L, b = L - a;
      const M0 = load.value * 1000;
      Ff[1] += -6 * M0 * a * b / L3;
      Ff[2] += M0 * b * (2*a - b) / L2;
      Ff[4] += 6 * M0 * a * b / L3;
      Ff[5] += M0 * a * (2*b - a) / L2;
    } else if (load.type === 'triangular') {
      const { qx: qx1, qy: qy1 } = toLocalQ(load.value / 1000, load.angle, cos, sin);
      const { qx: qx2, qy: qy2 } = toLocalQ((load.valueEnd ?? 0) / 1000, load.angle, cos, sin);
      Ff[0] += L * (2*qx1 + qx2) / 6;  Ff[3] += L * (qx1 + 2*qx2) / 6;
      Ff[1] += L * (7*qy1 + 3*qy2) / 20;
      Ff[2] += L2 * (3*qy1 + 2*qy2) / 60;
      Ff[4] += L * (3*qy1 + 7*qy2) / 20;
      Ff[5] += -L2 * (2*qy1 + 3*qy2) / 60;
    }
  }
  return Ff;
}

/** 截面法计算内力分布（局部坐标系） */
function calcSectionForce(
  xi: number, L: number, N1: number, V1: number, M1: number,
  elemLoads: SolverLoad[], cos: number, sin: number
): { position: number; N: number; V: number; M: number } {
  const x = xi * L;
  let N = N1, V = V1, M = M1 + V1 * x;
  for (const load of elemLoads) {
    if (load.type === 'point') {
      const { Px, Py } = toLocalForce(load.value, load.angle, cos, sin);
      const a = (load.position ?? 0.5) * L;
      if (x > a + 1e-6) { N -= Px; V -= Py; M -= Py * (x - a); }
    } else if (load.type === 'distributed') {
      const { qx, qy } = toLocalQ(load.value / 1000, load.angle, cos, sin);
      const s = (load.position ?? 0) * L, e = (load.positionEnd ?? 1) * L;
      if (x > s) {
        const len = Math.min(x, e) - s;
        if (len > 0) { N -= qx * len; V -= qy * len; M -= qy * len * (x - s - len/2); }
      }
    } else if (load.type === 'triangular') {
      const { qx: qx1, qy: qy1 } = toLocalQ(load.value / 1000, load.angle, cos, sin);
      const { qx: qx2, qy: qy2 } = toLocalQ((load.valueEnd ?? 0) / 1000, load.angle, cos, sin);
      const s = (load.position ?? 0) * L, e = (load.positionEnd ?? 1) * L;
      const loadLen = e - s;
      if (x > s && loadLen > 0) {
        const d = Math.min(x, e) - s;
        const sY = (qy2 - qy1) / loadLen, sX = (qx2 - qx1) / loadLen;
        V -= qy1 * d + 0.5 * sY * d * d;
        M -= qy1 * d*d / 2 + sY * d*d*d / 6;
        N -= qx1 * d + 0.5 * sX * d * d;
      }
    } else if (load.type === 'moment') {
      const a = (load.position ?? 0.5) * L;
      if (x > a + 1e-6) { M -= load.value * 1000; }
    }
  }
  return { position: xi, N, V, M };
}

/**
 * 矩阵位移法主函数
 */
export function solveByMatrixMethod(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[]
): SolverResult {
  const nodeIndex = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndex.set(n.id, i));
  
  // 节点存在性校验
  for (const elem of elements) {
    if (!nodeIndex.has(elem.nodeStart) || !nodeIndex.has(elem.nodeEnd)) {
      return { success: false, message: `单元 ${elem.id} 引用的节点不存在`, nodes: [], elements: [], totalStrainEnergy: 0 };
    }
  }
  
  // 判断是否全为桁架
  const allTruss = elements.every(e => e.type === 'truss');
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
    if (L < 1e-6) {
      return { success: false, message: `单元 ${elem.id} 长度为零（节点重合）`, nodes: [], elements: [], totalStrainEnergy: 0 };
    }
    const cos = dx / L;
    const sin = dy / L;
    
    elemInfo.push({ elem, L, cos, sin, i1, i2 });
    
    const E = elem.material.E;
    const A = elem.section.A;
    const I = elem.section.I;
    const isBeam = elem.type === 'beam';
    
    let kGlobal: number[][];
    let dofMap: number[];
    
    if (allTruss) {
      kGlobal = getTrussStiffnessGlobal(E, A, L, cos, sin);
      dofMap = [i1 * 2, i1 * 2 + 1, i2 * 2, i2 * 2 + 1];
    } else if (isBeam) {
      const kLocal = getBeamStiffnessLocal(E, A, I, L);
      const T = getTransformMatrix(cos, sin, true);
      const Tt = transpose(T);
      kGlobal = matMul(matMul(Tt, kLocal), T);
      dofMap = [i1 * 3, i1 * 3 + 1, i1 * 3 + 2, i2 * 3, i2 * 3 + 1, i2 * 3 + 2];
    } else {
      const kGlobal4 = getTrussStiffnessGlobal(E, A, L, cos, sin);
      kGlobal = createMatrix(6, 6);
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
    
    let uGlobal: number[];
    let useBeamTransform: boolean;
    
    if (allTruss) {
      uGlobal = [U[i1 * 2], U[i1 * 2 + 1], U[i2 * 2], U[i2 * 2 + 1]];
      useBeamTransform = false;
    } else if (isBeam) {
      uGlobal = [
        U[i1 * 3], U[i1 * 3 + 1], U[i1 * 3 + 2],
        U[i2 * 3], U[i2 * 3 + 1], U[i2 * 3 + 2]
      ];
      useBeamTransform = true;
    } else {
      uGlobal = [U[i1 * 3], U[i1 * 3 + 1], U[i2 * 3], U[i2 * 3 + 1]];
      useBeamTransform = false;
    }
    
    const T = getTransformMatrix(cos, sin, useBeamTransform);
    const uLocal: number[] = [];
    for (let i = 0; i < uGlobal.length; i++) {
      let sum = 0;
      for (let j = 0; j < uGlobal.length; j++) {
        sum += T[i][j] * uGlobal[j];
      }
      uLocal.push(sum);
    }
    
    const elemLoads = loads.filter(l => l.targetId === elem.id);
    const forces: { position: number; N: number; V: number; M: number }[] = [];
    
    if (isBeam) {
      const EI = E * I;
      const L2 = L * L, L3 = L2 * L;
      
      // k_local · u_local
      const F_disp = [
        (E * A / L) * (uLocal[0] - uLocal[3]),
        (12*EI/L3)*uLocal[1] + (6*EI/L2)*uLocal[2] - (12*EI/L3)*uLocal[4] + (6*EI/L2)*uLocal[5],
        (6*EI/L2)*uLocal[1] + (4*EI/L)*uLocal[2] - (6*EI/L2)*uLocal[4] + (2*EI/L)*uLocal[5],
        (E * A / L) * (uLocal[3] - uLocal[0]),
        -(12*EI/L3)*uLocal[1] - (6*EI/L2)*uLocal[2] + (12*EI/L3)*uLocal[4] - (6*EI/L2)*uLocal[5],
        (6*EI/L2)*uLocal[1] + (2*EI/L)*uLocal[2] - (6*EI/L2)*uLocal[4] + (4*EI/L)*uLocal[5],
      ];
      
      // 固端力（局部坐标系，含轴向）
      const F_fixed = computeFixedEndForces(elemLoads, L, cos, sin);
      
      // 左端内力初始值（截面法起点）
      const N1 = F_fixed[0] - F_disp[0];
      const V1 = F_fixed[1] - F_disp[1];
      const M1 = F_disp[2] - F_fixed[2];
      
      // 采样位置（含荷载突变点）
      const keyPositions = new Set<number>([0, 1]);
      const epsilon = 1e-9;
      for (const load of elemLoads) {
        if (load.type === 'point' || load.type === 'moment') {
          const pos = load.position ?? 0.5;
          if (pos > 0 && pos < 1) { keyPositions.add(pos - epsilon); keyPositions.add(pos + epsilon); }
        } else if (load.type === 'distributed' || load.type === 'triangular') {
          const s = load.position ?? 0, e = load.positionEnd ?? 1;
          if (s > 0) keyPositions.add(s);
          if (e < 1) keyPositions.add(e);
        }
      }
      for (let i = 0; i <= 21; i++) keyPositions.add(i / 21);
      
      const sortedPositions = Array.from(keyPositions).sort((a, b) => a - b);
      for (const xi of sortedPositions) {
        forces.push(calcSectionForce(xi, L, N1, V1, M1, elemLoads, cos, sin));
      }
    } else {
      const N = E * A / L * (uLocal[2] - uLocal[0]);
      forces.push({ position: 0, N, V: 0, M: 0 });
      forces.push({ position: 1, N, V: 0, M: 0 });
    }
    
    const b = elem.section.width;
    const stressResult = calculateElementStress(forces, A, I, b, h, elem.material.yield);
    
    const deflectionCurve = isBeam
      ? computeBeamDeflection(uLocal, L, E, I, elemLoads, cos, sin)
      : [{ position: 0, dy: 0 }, { position: 1, dy: 0 }];
    
    const strainEnergy = computeStrainEnergy(forces, E, A, I, L, isBeam);
    totalStrainEnergy += strainEnergy;
    
    return {
      elementId: elem.id,
      internalForces: forces.map(f => ({ ...f, M: f.M / 1000 })),
      deflectionCurve,
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
