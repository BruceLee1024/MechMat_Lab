import type { SceneView, Vec3 } from './conceptGeometry';

export interface SurfacePatch { points: Vec3[]; normal: Vec3; center: Vec3; side: number; station: number; band: number }
export const dot = (a: Vec3, b: Vec3) => a.reduce((v, n, i) => v + n * b[i], 0);
export const unit = (v: Vec3): Vec3 => { const length = Math.hypot(...v); return length > 1e-12 ? v.map(n => n / length) as Vec3 : [0, 0, 0]; };
export const mixPoint = (a: Vec3, b: Vec3, t: number) => a.map((v, i) => v + (b[i] - v) * t) as Vec3;
// Newell 面积法向量取整个曲面片的平均朝向，避免掠射角处只取角点导致翻面。
export function patchNormal(points: Vec3[]): Vec3 {
  const normal: Vec3 = [0, 0, 0];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    normal[0] += (p[1] - q[1]) * (p[2] + q[2]);
    normal[1] += (p[2] - q[2]) * (p[0] + q[0]);
    normal[2] += (p[0] - q[0]) * (p[1] + q[1]);
  });
  return unit(normal);
}
// 与投影核空间一致的观察方向；正视看向 z 负方向，俯视看向 y 负方向。
export function conceptViewDirection(view: SceneView, yaw: number): Vec3 {
  if (view === 'front') return [0, 0, 1];
  if (view === 'top') return [0, 1, 0];
  return unit([Math.sin(yaw) + .46 * Math.cos(yaw), .34, -Math.cos(yaw) + .46 * Math.sin(yaw)]);
}
export function buildSpecimenSurface(rings: Vec3[][], bands = 3): SurfacePatch[] {
  if (rings.length < 2) return [];
  const patches: SurfacePatch[] = [];
  const add = (points: Vec3[], side: number, station: number, band: number) => patches.push({ points, side, station, band, normal: patchNormal(points), center: [0, 1, 2].map(k => points.reduce((sum, p) => sum + p[k], 0) / points.length) as Vec3 });
  for (let station = 0; station < rings.length - 1; station++) {
    for (let side = 0; side < 4; side++) for (let band = 0; band < bands; band++) {
      const next = (side + 1) % 4, a = rings[station], b = rings[station + 1];
      add([mixPoint(a[side], a[next], band / bands), mixPoint(b[side], b[next], band / bands), mixPoint(b[side], b[next], (band + 1) / bands), mixPoint(a[side], a[next], (band + 1) / bands)], side, station, band);
    }
  }
  // 环按左端外法线排序，右端反向，保证端盖不会在转动时翻面。
  add(rings[0], 4, 0, 0); add([...rings[rings.length - 1]].reverse(), 5, rings.length - 2, 0);
  return patches;
}
