import type { Vec2, Vec3 } from './conceptGeometry';
import { buildSpecimenSurface, dot, mixPoint, unit } from './conceptSurface';

interface SurfaceOptions {
  project: (p: Vec3) => Vec2;
  viewDirection: Vec3;
  xray: boolean;
  accentEnds: boolean;
}
// 曲面按局部法线着色；默认仅绘制可见网格，避免透明体的前后网格相互干扰。
export function drawConceptSurface(ctx: CanvasRenderingContext2D, rings: Vec3[][], options: SurfaceOptions) {
  const { project, viewDirection, xray, accentEnds } = options;
  const patches = buildSpecimenSurface(rings, 4);
  const keyLight = unit([viewDirection[0] * .25, 1, viewDirection[2] * .5]), fillLight = unit([-viewDirection[0], .1, viewDirection[2]]);
  const halfLight = unit(keyLight.map((v, i) => v + viewDirection[i]) as Vec3);
  const path = (points: Vec3[], color: string, width = 1, dashed = false) => {
    ctx.beginPath(); points.map(project).forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dashed ? [3, 5] : []); ctx.stroke(); ctx.setLineDash([]);
  };
  const visible = patches.filter(p => dot(p.normal, viewDirection) > 1e-5).sort((a, b) => dot(a.center, viewDirection) - dot(b.center, viewDirection));
  // 连续封闭底色覆盖掠射角处的轮廓，避免曲面细分的离散可见性产生空洞。
  if (!xray) {
    ctx.fillStyle = '#174370';
    for (const patch of patches) {
      ctx.beginPath(); patch.points.map(project).forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
    }
  }
  for (const patch of visible) {
    const points = patch.points.map(project);
    const n = patch.normal, facing = Math.max(0, dot(n, viewDirection));
    const diffuse = .18 + .75 * Math.max(0, dot(n, keyLight)) + .12 * Math.max(0, dot(n, fillLight));
    const specular = Math.pow(Math.max(0, dot(n, halfLight)), 34) * .55;
    const rim = Math.pow(1 - facing, 3) * .5;
    let rgb = [19 + 39 * diffuse + 75 * specular + 32 * rim, 53 + 94 * diffuse + 92 * specular + 52 * rim, 93 + 126 * diffuse + 94 * specular + 50 * rim];
    if (accentEnds && patch.side >= 4) {
      const tint = patch.side === 4 ? [100, 200, 196] : [161, 155, 219];
      rgb = rgb.map((v, i) => v * .72 + tint[i] * .28);
    }
    const color = `rgba(${rgb.map(v => Math.round(Math.min(255, v))).join(',')},${xray ? .34 : .96})`;
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    // 只覆盖子面之间的半像素接缝，不画三角剖分线。
    if (!xray) { ctx.strokeStyle = color; ctx.lineWidth = .6; ctx.stroke(); }
  }
  const count = rings.length - 1;
  const visibility = Array.from({ length: count }, () => Array.from({ length: 4 }, () => [false, false, false, false]));
  for (const patch of visible) if (patch.side < 4) visibility[patch.station][patch.side][patch.band] = true;
  const visibleCaps = new Set(visible.filter(p => p.side >= 4).map(p => p.side));
  const sideVisible = (station: number, side: number, band: number) => visibility[Math.min(station, count - 1)][side][band];
  // 长度方向六格、周向三格，曲面采样密度与显示网格密度分开。
  for (let station = 0; station < count; station++) for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4, r = rings[station], q = rings[station + 1];
    if (station % Math.max(1, Math.round(count / 6)) === 0 && station > 0) for (let band = 0; band < 4; band++) {
      const front = sideVisible(station, side, band); if (front || xray) path([mixPoint(r[side], r[next], band / 4), mixPoint(r[side], r[next], (band + 1) / 4)], front ? '#a5deff35' : '#a5deff14', .8);
    }
    if (accentEnds && side === 1 && sideVisible(station, side, 2)) path([mixPoint(r[side], r[next], .5), mixPoint(q[side], q[next], .5)], '#92e9d0', 1.25);
    for (const t of [1 / 3, 2 / 3]) {
      const front = sideVisible(station, side, Math.floor(t * 4)); if (front || xray) path([mixPoint(r[side], r[next], t), mixPoint(q[side], q[next], t)], front ? '#a5deff35' : '#a5deff14', .8);
    }
  }
  // 隐藏的边线只在透视模式下显示；可见边线用窄高光和柔和蓝光分层绘制。
  const edges: { points: Vec3[]; visible: boolean; accent: boolean }[] = [];
  for (let station = 0; station < count; station++) for (let corner = 0; corner < 4; corner++) edges.push({ points: [rings[station][corner], rings[station + 1][corner]], visible: sideVisible(station, corner, 0) || sideVisible(station, (corner + 3) % 4, 3), accent: accentEnds && corner === 2 });
  for (const end of [0, count]) for (let side = 0; side < 4; side++) edges.push({ points: [rings[end][side], rings[end][(side + 1) % 4]], visible: visibleCaps.has(end === 0 ? 4 : 5) || visibility[Math.min(end, count - 1)][side].some(Boolean), accent: accentEnds });
  if (xray) for (const edge of edges.filter(e => !e.visible)) path(edge.points, '#82bfff33', .8, true);
  const frontEdges = edges.filter(e => e.visible);
  const strokeEdges = (list: typeof edges, color: string, width: number) => {
    ctx.beginPath();
    for (const edge of list) edge.points.map(project).forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  };
  ctx.save(); ctx.shadowColor = '#4baaff'; ctx.shadowBlur = 13;
  strokeEdges(frontEdges.filter(e => !e.accent), '#75c8ff', 1.8);
  strokeEdges(frontEdges.filter(e => e.accent), '#a2e7e9', 1.8);
  ctx.shadowBlur = 0; strokeEdges(frontEdges, '#d5f1ff', .6);
  ctx.restore();
}
