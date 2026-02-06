// ==========================================
// 刚度矩阵模块
// ==========================================
// 
// 提供单元刚度矩阵、坐标变换、等效节点荷载计算
//

import { SolverLoad } from './SolverTypes';
import { createMatrix } from './MatrixUtils';

/**
 * 梁单元刚度矩阵（局部坐标系）
 * @returns 6x6 刚度矩阵 [u1, v1, θ1, u2, v2, θ2]
 */
export function getBeamStiffnessLocal(E: number, A: number, I: number, L: number): number[][] {
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

/**
 * 桁架单元刚度矩阵（直接全局坐标系）
 * @returns 4x4 刚度矩阵 [u1, v1, u2, v2]
 */
export function getTrussStiffnessGlobal(E: number, A: number, L: number, cos: number, sin: number): number[][] {
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

/**
 * 坐标变换矩阵
 * @param cos 单元轴向与全局x轴夹角余弦
 * @param sin 单元轴向与全局x轴夹角正弦
 * @param isBeam true=梁单元(6x6), false=桁架单元(4x4)
 */
export function getTransformMatrix(cos: number, sin: number, isBeam: boolean): number[][] {
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

/**
 * 等效节点荷载（局部坐标系）
 * @returns [F1x, F1y, M1, F2x, F2y, M2]
 */
export function getEquivalentLoads(load: SolverLoad, L: number, cos: number, sin: number): number[] {
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
    const qlocal_x = qx * cos + qy * sin;  // 局部x方向分量（轴向）
    const qlocal_y = -qx * sin + qy * cos; // 局部y方向分量
    eq[0] = qlocal_x * L / 2;
    eq[1] = qlocal_y * L / 2;
    eq[2] = qlocal_y * L * L / 12;
    eq[3] = qlocal_x * L / 2;
    eq[4] = qlocal_y * L / 2;
    eq[5] = -qlocal_y * L * L / 12;
  } else if (load.type === 'moment') {
    const M = load.value * 1000; // Nm -> Nmm
    eq[1] = -6 * M * a * b / (L * L * L);
    eq[2] = M * b * (2 * a - b) / (L * L);
    eq[4] = 6 * M * a * b / (L * L * L);
    eq[5] = M * a * (2 * b - a) / (L * L);
  } else if (load.type === 'triangular') {
    // 线性变化荷载: q1 在左端，q2 在右端
    const q1 = load.value / 1000; // N/m -> N/mm
    const q2 = (load.valueEnd ?? 0) / 1000;
    const qx1 = q1 * Math.cos(loadRad);
    const qy1 = q1 * Math.sin(loadRad);
    const qx2 = q2 * Math.cos(loadRad);
    const qy2 = q2 * Math.sin(loadRad);
    const qlocal_x1 = qx1 * cos + qy1 * sin;
    const qlocal_x2 = qx2 * cos + qy2 * sin;
    const qlocal_y1 = -qx1 * sin + qy1 * cos;
    const qlocal_y2 = -qx2 * sin + qy2 * cos;
    // 固端梁线性变化荷载等效节点力
    eq[0] = L * (2 * qlocal_x1 + qlocal_x2) / 6;
    eq[1] = L * (7 * qlocal_y1 + 3 * qlocal_y2) / 20;
    eq[2] = L * L * (3 * qlocal_y1 + 2 * qlocal_y2) / 60;
    eq[3] = L * (qlocal_x1 + 2 * qlocal_x2) / 6;
    eq[4] = L * (3 * qlocal_y1 + 7 * qlocal_y2) / 20;
    eq[5] = -L * L * (2 * qlocal_y1 + 3 * qlocal_y2) / 60;
  }
  
  return eq;
}
