// ==========================================
// 应力计算工具函数
// ==========================================
// 
// 提供应力、安全系数等力学量的计算功能
//

import { StressPoint } from './SolverTypes';

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
export function calculateStressPoint(
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
export function calculateElementStress(
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
