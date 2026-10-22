import type { ElementResult } from './SolverTypes';

/** 水平 Euler–Bernoulli 梁：按分段线性弯矩积分 w''=-M/EI，并满足两端实际位移。
 * 恢复的是内力采样对应的数值挠曲线，不能用两端节点位移连线代替跨内变形。
 */
export function recoverBeamDeflection(forces: ElementResult['internalForces'], length: number, rigidity: number, start: number, end: number) {
  if (forces.length < 2 || ![length, rigidity, start, end].every(Number.isFinite) || length <= 0 || rigidity <= 0) return undefined;
  const samples = [...forces].sort((a, b) => a.position - b.position);
  if (samples.some(f => !Number.isFinite(f.position) || !Number.isFinite(f.M)) || samples[0].position !== 0 || samples.at(-1)!.position !== 1) return undefined;
  const integral = (x: number) => {
    let value = 0;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1].position * length, b = samples[i].position * length;
      if (a >= x) break;
      if (b <= a) continue;
      const h = Math.min(x, b) - a, m = samples[i - 1].M, slope = (samples[i].M - m) / (b - a), r = x - a;
      value -= (m * (r * h - h * h / 2) + slope * (r * h * h / 2 - h * h * h / 3)) / rigidity;
    }
    return value;
  };
  const slope = (end - start - integral(length)) / length;
  const positions = [...new Set([...Array.from({length: 101}, (_, i) => i / 100), ...samples.map(f => f.position)])].sort((a, b) => a - b);
  const curve = positions.map(position => ({position, dy: start + slope * position * length + integral(position * length)}));
  return curve.every(p => Number.isFinite(p.dy)) ? curve : undefined;
}
