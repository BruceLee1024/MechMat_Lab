import type { calculateAxialTeaching } from '../mechanics/calculations';
import type { PoissonGeometry } from '../components/PoissonScene';

type AxialValues = Extract<ReturnType<typeof calculateAxialTeaching>, { ok: true }>['values'];
export interface AxialSpecimen {
  geometry: PoissonGeometry;
  status: 'coupled' | 'fracture-reference' | 'unavailable';
  currentLength: number | null;
  allowFlow: boolean;
  label: string;
  transverseRule: string;
}

// 三维显示只消费曲线计算结果，不在渲染层另算一条应力—应变关系。
export function deriveAxialSpecimen(v: AxialValues, area: number, poisson: number): AxialSpecimen {
  const elasticStrain = v.stress / v.modulusMPa;
  // 极端自定义参数可能使小应变泊松公式给出负宽度，不能继续绘制有效实体。
  const known = v.strainMode !== 'elastic-estimate' && 1 + v.strain > 0 && 1 - poisson * elasticStrain > 0;
  const fracture = !known && v.modelFamily === 'brittle' && v.isFailure;
  const status = known ? 'coupled' : fracture ? 'fracture-reference' : 'unavailable';
  const strain = known ? v.strain : 0;
  // 弹性部分使用泊松比；金属非弹性部分以塑性体积不变作均匀收缩教学示意。
  // 这里只展示上升支，不模拟颈缩、卸载残余或断裂开口量。
  const plasticStretch = known && ['plateau', 'smooth'].includes(v.modelFamily) ? Math.max(1, (1 + strain) / (1 + elasticStrain)) : 1;
  const transverseStrain = known ? (1 - poisson * elasticStrain) / Math.sqrt(plasticStretch) - 1 : 0;
  const width = Math.sqrt(area);
  return {
    geometry: { stress: v.stress, strain, transverseStrain, lengthMm: v.lengthMm, currentLength: v.lengthMm * (1 + strain), width, currentWidth: width * (1 + transverseStrain) },
    currentLength: known ? v.lengthMm * (1 + strain) : null,
    status, allowFlow: known,
    label: known ? v.phase : fracture ? '超出脆断教学参考点' : '变形未标定 · 显示参考试件',
    transverseRule: !known ? '当前长度与横向尺寸未计算' : plasticStretch > 1 + 1e-12 ? '弹性泊松收缩 + 塑性等体积示意' : '横向尺寸按材料泊松比计算',
  };
}

// 共用一个放大因子，避免分别截断轴向、横向位移而改变变形关系。
// 高倍率可能使压缩方向翻转，此时降低共同倍率并将实际倍率显示给用户。
export function axialDisplayShape(strain: number, transverseStrain: number, requested: number) {
  let amplification = requested;
  for (const value of [strain, transverseStrain]) if (value < 0) amplification = Math.min(amplification, .8 / -value);
  return { halfLength: 200 * (1 + strain * amplification), halfWidth: 60 * (1 + transverseStrain * amplification), amplification };
}
