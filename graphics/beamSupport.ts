export type BeamSupportKind = 'pinned' | 'roller';
type Point = [number, number];

/** 教材式立面符号。以梁底铰接点为原点，支座保持竖直，不随梁端转角旋转。 */
export function beamSupportGlyph(kind: BeamSupportKind) {
  const rollerRadius = 3.2;
  const baseY = 24;
  const groundY = kind === 'roller' ? baseY + rollerRadius * 2 : baseY;
  return {
    pinRadius: 2.8,
    triangle: [[0, 2.8], [-13.5, baseY], [13.5, baseY]] as Point[],
    rollers: kind === 'roller' ? [[-7, baseY + rollerRadius], [7, baseY + rollerRadius]] as Point[] : [],
    rollerRadius,
    ground: [[-21, groundY], [21, groundY]] as [Point, Point],
    hatches: [-17, -10, -3, 4, 11, 18].map(x => [[x, groundY + 1], [x - 5, groundY + 7]] as [Point, Point]),
    labelY: groundY + 21,
  };
}

export function drawBeamSupport(ctx: CanvasRenderingContext2D, kind: BeamSupportKind, contact: Point, size = 1) {
  const glyph = beamSupportGlyph(kind);
  ctx.save();
  ctx.translate(...contact); ctx.scale(size, size);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([]);
  ctx.shadowBlur = 0; ctx.strokeStyle = '#c2d1dc'; ctx.lineWidth = 1.35; ctx.fillStyle = '#0c1927';
  ctx.beginPath(); glyph.triangle.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const center of glyph.rollers) { ctx.beginPath(); ctx.arc(...center, glyph.rollerRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(...glyph.ground[0]); ctx.lineTo(...glyph.ground[1]); ctx.stroke();
  ctx.strokeStyle = '#8299ac'; ctx.lineWidth = 1;
  ctx.beginPath(); for (const [from,to] of glyph.hatches) { ctx.moveTo(...from); ctx.lineTo(...to); } ctx.stroke();
  // 铰点最后绘制，保证在试件端面和支座三角形之间清晰可见。
  ctx.strokeStyle = '#d5e0e9'; ctx.lineWidth = 1.35;
  ctx.beginPath(); ctx.arc(0, 0, glyph.pinRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  return glyph;
}
