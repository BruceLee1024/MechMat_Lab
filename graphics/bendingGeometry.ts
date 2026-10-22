import { bendingStation, maximumBendingDeflection, bendingSmallDeflection, type BendingField } from '../mechanics/bendingField';
export {bendingProfile} from '../mechanics/sectionOutline';
export type {SectionPoint,BendingProfile} from '../mechanics/sectionOutline';

// 物理坐标先统一换到场景坐标；长细比保真，截面只随局部转角转动。
export function bendingDisplay(field: BendingField, requested: number) {
  const peak=maximumBendingDeflection(field);
  const available=bendingSmallDeflection(field);
  // 用户选择固定倍率；不能随材料刚度归一化，否则材料切换后会呈现同一弯曲幅度。
  const amplification=available ? requested : 1;
  return {available,amplification,scale:560/field.lengthMm,peak};
}

export function bendingVertex(field: BendingField, x: number, y: number, z: number, amplification: number): [number,number,number] {
  const station=bendingStation(field,x), scale=560/field.lengthMm;
  const theta=-Math.atan(station.slope*amplification);
  return [(x-field.lengthMm/2-y*Math.sin(theta))*scale,(-station.deflection*amplification+y*Math.cos(theta))*scale,z*scale];
}
