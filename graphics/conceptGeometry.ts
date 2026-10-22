// 教学场景的几何与相机；图形放大不参与力学结果计算。
export type Vec3 = [number, number, number];
export type Vec2 = [number, number];
export type SceneView = '3d' | 'front' | 'top';
export type DeformationForm = 'axial' | 'shear' | 'torsion' | 'bending';
export function projectConcept([x, y, z]: Vec3, view: SceneView, yaw: number): Vec2 {
  if (view === 'front') return [x, -y];
  if (view === 'top') return [x, -z];
  const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
  const rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [rx + rz * .46, -y - rz * .34];
}
// 将屏幕拖动还原为单元 xy 平面上的位移，俯视图不可辨识竖向平移。
export function planeDrag(delta: Vec2, view: SceneView, yaw: number, scale: number): Vec2 | null {
  const bx = projectConcept([1, 0, 0], view, yaw), by = projectConcept([0, 1, 0], view, yaw);
  const det = bx[0] * by[1] - by[0] * bx[1];
  if (Math.abs(det) < 1e-6 || scale <= 0) return null;
  return [(delta[0] * by[1] - by[0] * delta[1]) / det / scale, (bx[0] * delta[1] - delta[0] * bx[1]) / det / scale];
}
export function deformSpecimen([x, y, z]: Vec3, form: DeformationForm, amount: number): Vec3 {
  if (form === 'axial') return [x * (1 + amount * .18), y, z];
  if (form === 'shear') return [x + amount * y * .55, y, z];
  if (form === 'torsion') {
    const angle = amount * .7 * x / 225;
    return [x, y * Math.cos(angle) - z * Math.sin(angle), y * Math.sin(angle) + z * Math.cos(angle)];
  }
  // 截面保持平面，并始终垂直于示意轴线的切线。
  const slope = amount * 130 * x / (225 * 225), angle = Math.atan(slope);
  return [x - y * Math.sin(angle), -amount * 65 * (1 - (x / 225) ** 2) + y * Math.cos(angle), z];
}
export function strainPoint([x, y, z]: Vec3, rigid: boolean, ex: number, gamma: number, tx: number, ty: number): Vec3 {
  const u = rigid ? tx : 8 * (ex * x + gamma * y), v = rigid ? ty : 0;
  return [(x + u - 50) * 2.5, (y + v - 50) * 2.5, z];
}
