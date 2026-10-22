/** 首页教学预览。内部统一采用 N、mm、MPa；与实验模块状态隔离。 */
export type HomePreviewMode = 'axial' | 'bending' | 'torsion';
export const HOME_PREVIEW = { length: 800, diameter: 80, E: 206000, nu: 0.3 };
export function homePreviewResult(mode: HomePreviewMode, factor: number) {
 const { length: L, diameter: d, E, nu } = HOME_PREVIEW;
 const A = Math.PI * d ** 2 / 4, I = Math.PI * d ** 4 / 64, J = 2 * I, G = E / (2 * (1 + nu));
 const load = (mode === 'axial' ? 80000 : mode === 'bending' ? 8000 : 8000000) * factor;
 const stress = mode === 'axial' ? load / A : mode === 'bending' ? load * L * d / (8 * I) : load * d / (2 * J);
 const displacement = mode === 'axial' ? load * L / (E * A) : mode === 'bending' ? load * L ** 3 / (48 * E * I) : load * L / (G * J);
 return { load, stress, displacement, A, I, J, G, amplification: mode === 'axial' ? 700 : mode === 'bending' ? 180 : 15 };
}
/** 先算真实位移，再施加明确标注的显示放大倍数；圆轴扭转不使用非圆截面公式。 */
export function homePreviewPoint(mode: HomePreviewMode, factor: number, x: number, y: number, z: number) {
 const { length: L, E, nu } = HOME_PREVIEW;
 const r = homePreviewResult(mode, factor), scale = r.amplification;
 if (mode === 'axial') {
  const strain = r.stress / E;
  return { x: x * (1 + strain * scale), y: y * (1 - nu * strain * scale), z: z * (1 - nu * strain * scale) };
 }
 if (mode === 'torsion') {
  const theta = r.displacement * x / L * scale;
  return { x, y: y * Math.cos(theta) - z * Math.sin(theta), z: y * Math.sin(theta) + z * Math.cos(theta) };
 }
 // 简支梁跨中集中荷载：两半跨镜像，v 向上为正，故向下挠度取负。
 const s = Math.min(x, L - x), w = r.load * s * (3 * L ** 2 - 4 * s ** 2) / (48 * E * r.I);
 const dw = r.load * (3 * L ** 2 - 12 * s ** 2) / (48 * E * r.I) * (x <= L / 2 ? 1 : -1);
 // 放大后的截面仍保持圆形，沿显示挠曲线法向布置，避免显示放大造成截面剪切。
 const theta = -Math.atan(dw * scale);
 return { x: x - y * Math.sin(theta), y: y * Math.cos(theta) - w * scale, z };
}
