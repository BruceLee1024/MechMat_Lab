import type { AxialSpecimen } from '../graphics/axialSpecimen';

type Vector = [number, number, number];
export interface AxialField {
  force: number;
  engineeringStress: number;
  trueStress: number;
  currentArea: number;
  lengthMm: number;
  strain: number;
  transverseStrain: number;
}

/** 均匀单轴场；材料本构及横向伸长比已经由材料响应层确定。 */
export function axialField(specimen: AxialSpecimen): AxialField | null {
  if (specimen.status !== 'coupled') return null;
  const g = specimen.geometry, area = g.width ** 2, currentArea = g.currentWidth ** 2;
  const force = g.stress * area;
  const values = [force, currentArea, g.lengthMm, g.strain, g.transverseStrain];
  if (!values.every(Number.isFinite) || currentArea <= 0 || g.lengthMm <= 0) return null;
  const trueStress = force / currentArea;
  if (!Number.isFinite(trueStress)) return null;
  return { force, engineeringStress: g.stress, trueStress, currentArea, lengthMm: g.lengthMm, strain: g.strain, transverseStrain: g.transverseStrain };
}

/** 参考坐标以杆中点为原点，固定刚体平移自由度；单位 mm。与画面放大倍率无关。 */
export function axialMaterialPoint(field: AxialField, reference: Vector) {
  const displacement: Vector = [field.strain * reference[0], field.transverseStrain * reference[1], field.transverseStrain * reference[2]];
  const current = reference.map((coordinate, i) => coordinate + displacement[i]) as Vector;
  return { reference, displacement, current };
}

/** 当前构形的柯西面力 t(n)=σ·n；传入单位法向，σ=diag(F/A,0,0)。 */
export function axialTraction(field: AxialField, normal: Vector): Vector {
  return [field.trueStress * normal[0], 0, 0];
}
