/** 简支等截面梁、任意位置单点载荷。内部单位 N / mm / MPa，挠度向下为正。 */
export interface BendingField {
  load: number; lengthMm: number; positionMm: number; modulusMPa: number; inertia: number;
}

export function bendingStation(field: BendingField, xMm: number) {
  const { load: P, lengthMm: L, positionMm: a, modulusMPa: E, inertia: I } = field;
  const x = Math.max(0, Math.min(L, xMm)), b = L-a;
  const left = x <= a, distance = left ? x : L-x, arm = left ? b : a;
  const coefficient = P * arm / (6 * L * E * I);
  const deflection = coefficient * distance * (L*L-arm*arm-distance*distance);
  const slope = (left ? 1 : -1) * coefficient * (L*L-arm*arm-3*distance*distance);
  const reactionLeft = P*b/L;
  const moment = x <= a ? reactionLeft*x : P*a*(L-x)/L;
  return { xMm: x, deflection, slope, moment, shearLeft: x <= a ? reactionLeft : -P*a/L, shearRight: x < a ? reactionLeft : -P*a/L };
}

export function maximumBendingDeflection(field: BendingField) {
  const { lengthMm: L, positionMm: a, load } = field;
  if (load === 0 || a === 0 || a === L) return { xMm: L/2, deflection: 0 };
  const xMm = a <= L/2 ? L-Math.sqrt((L*L-a*a)/3) : Math.sqrt((L*L-(L-a)**2)/3);
  return { xMm, deflection: bendingStation(field,xMm).deflection };
}

// 教学显示的保守保护线，并非规范验算或材料适用性认证。
export function bendingSmallDeflection(field: BendingField) {
  const peak=maximumBendingDeflection(field);
  const maxSlope=Math.max(Math.abs(bendingStation(field,0).slope),Math.abs(bendingStation(field,field.lengthMm).slope));
  return Math.abs(peak.deflection)/field.lengthMm<=.05 && maxSlope<=.2;
}
