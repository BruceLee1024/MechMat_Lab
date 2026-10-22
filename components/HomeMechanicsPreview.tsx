import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, CircleDot, RotateCw, Ruler } from 'lucide-react';
import { HOME_PREVIEW, homePreviewPoint, homePreviewResult, type HomePreviewMode } from '../mechanics/homePreview';

const modes: { id: HomePreviewMode; title: string; icon: React.ElementType }[] = [
 { id: 'axial', title: '拉伸', icon: ArrowLeftRight }, { id: 'bending', title: '弯曲', icon: Ruler }, { id: 'torsion', title: '扭转', icon: RotateCw },
];
const details = {
 axial: { name: '轴向拉伸', load: '轴力 N', unit: 'kN', result: '伸长量 ΔL', stress: '正应力 σ', formula: 'σ = N/A', range: '均匀圆杆 · 线弹性' },
 bending: { name: '简支梁弯曲', load: '跨中荷载 P', unit: 'kN', result: '跨中挠度 w', stress: '最大 |σ|', formula: 'w = PL³/48EI', range: '简支圆杆 · 跨中集中力' },
 torsion: { name: '圆轴扭转', load: '扭矩 T', unit: 'kN·m', result: '相对转角 φ', stress: '表面剪应力 τ', formula: 'φ = TL/GJ', range: '实心圆轴 · 圣维南扭转' },
};

function PreviewCanvas({ mode, factor, motion }: { mode: HomePreviewMode; factor: number; motion: boolean }) {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const cameraRef = useRef({ yaw: -.28, pitch: .34, drag: false, x: 0, y: 0 });
 const propsRef = useRef({ mode, factor, motion });
 const redrawRef = useRef<() => void>(() => {});
 useEffect(() => { propsRef.current = { mode, factor, motion }; redrawRef.current(); }, [mode, factor, motion]);
 useEffect(() => {
  const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  let width = 1, height = 1, frame = 0, phase = 0, previous = 0, lastPaint = 0, visible = true, reduced = false;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = media.matches;
  function draw(now: number) {
   frame = 0;
   const { mode, factor, motion } = propsRef.current;
   if (!visible || document.hidden) { previous = 0; return; }
   const moving = motion && !reduced;
   if (moving && now - lastPaint < 32) { frame = requestAnimationFrame(draw); return; }
   lastPaint = now;
   if (moving) phase += previous ? Math.min((now - previous) / 1000, .05) : 0;
   previous = now;
   ctx!.clearRect(0, 0, width, height);
   const { length: L, diameter: d } = HOME_PREVIEW;
   const scale = Math.min(width / 1100, height / 550), cx = width * .5, cy = height * .5;
   const yaw = cameraRef.current.yaw + (moving ? Math.sin(phase * .22) * .045 : 0), pitch = cameraRef.current.pitch;
   type P = { x: number; y: number; z: number };
   const project = ({ x, y, z }: P) => {
    const X = x - L / 2, depth = -X * Math.sin(yaw) + z * Math.cos(yaw);
    return { x: cx + (X * Math.cos(yaw) + z * Math.sin(yaw)) * scale, y: cy + (-y + depth * pitch) * scale, depth };
   };
   const point = (x: number, angle: number, radius = d / 2) => homePreviewPoint(mode, factor, x, Math.cos(angle) * radius, Math.sin(angle) * radius);
   const path = (points: P[], stroke: string, lineWidth = 1, close = false) => {
    ctx!.beginPath(); points.forEach((p, i) => { const q = project(p); i ? ctx!.lineTo(q.x, q.y) : ctx!.moveTo(q.x, q.y); });
    if (close) ctx!.closePath(); ctx!.strokeStyle = stroke; ctx!.lineWidth = lineWidth; ctx!.stroke();
   };
   const text = (p: P, label: string, color = '#8ba9bb', align: CanvasTextAlign = 'center') => {
    const q = project(p); ctx!.font = '11px ui-monospace, monospace'; ctx!.textAlign = align; ctx!.fillStyle = color; ctx!.fillText(label, q.x, q.y);
   };
   const arrow = (from: P, to: P, label: string, color = '#efa49d') => {
    const a = project(from), b = project(to), theta = Math.atan2(b.y - a.y, b.x - a.x);
    ctx!.strokeStyle = color; ctx!.fillStyle = color; ctx!.lineWidth = 2;
    ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke();
    ctx!.beginPath(); ctx!.moveTo(b.x, b.y); ctx!.lineTo(b.x - 10 * Math.cos(theta - .36), b.y - 10 * Math.sin(theta - .36)); ctx!.lineTo(b.x - 10 * Math.cos(theta + .36), b.y - 10 * Math.sin(theta + .36)); ctx!.closePath(); ctx!.fill();
    ctx!.font = 'italic 14px Georgia, serif'; ctx!.textAlign = 'center'; ctx!.fillText(label, a.x, a.y - 10);
   };
   // 低对比度空间网格，位置与试件坐标一致。
   for (let x = -250; x <= L + 250; x += 80) path([{ x, y: -112, z: -230 }, { x, y: -112, z: 230 }], '#335b701e');
   for (let z = -230; z <= 230; z += 46) path([{ x: -250, y: -112, z }, { x: L + 250, y: -112, z }], '#335b701e');
   // 未变形轮廓仅作位置参照。
   ctx!.setLineDash([4, 5]);
   for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2; path([{ x: 0, y: Math.cos(a) * d / 2, z: Math.sin(a) * d / 2 }, { x: L, y: Math.cos(a) * d / 2, z: Math.sin(a) * d / 2 }], '#7c9bb250'); }
   ctx!.setLineDash([]);
   const segments = 32, radial = 16;
   const faces: { points: P[]; depth: number; light: number }[] = [];
   for (let i = 0; i < segments; i++) for (let j = 0; j < radial; j++) {
    const a = j / radial * Math.PI * 2, b = (j + 1) / radial * Math.PI * 2;
    const points = [point(i / segments * L, a), point((i + 1) / segments * L, a), point((i + 1) / segments * L, b), point(i / segments * L, b)];
    faces.push({ points, depth: points.reduce((n, p) => n + project(p).depth, 0) / 4, light: Math.cos(a) });
   }
   faces.sort((a, b) => b.depth - a.depth).forEach(face => {
    ctx!.beginPath(); face.points.forEach((p, i) => { const q = project(p); i ? ctx!.lineTo(q.x, q.y) : ctx!.moveTo(q.x, q.y); }); ctx!.closePath();
    ctx!.fillStyle = mode === 'bending' && face.light < -.2 ? 'rgba(235,151,142,.13)' : `rgba(69,167,207,${.07 + (face.light + 1) * .045})`; ctx!.fill();
    ctx!.strokeStyle = '#86d9ed1a'; ctx!.lineWidth = .55; ctx!.stroke();
   });
   for (let j = 0; j < 8; j++) { const angle = j * Math.PI / 4; path(Array.from({ length: 33 }, (_, i) => point(i * L / 32, angle)), j % 2 ? '#88d4ef33' : '#a0e1f3a1', j % 2 ? .7 : 1.2); }
   [0, L].forEach(x => {
    const ring = Array.from({ length: 33 }, (_, j) => point(x, j * Math.PI / 16));
    ctx!.shadowColor = '#6dcfe2'; ctx!.shadowBlur = 10; path(ring, '#a6eafa', 1.5, true); ctx!.shadowBlur = 0;
   });
   // 被观察的截面用独立环线标记，扫描光仅改变亮度，不改变力学读数。
   const sectionX = mode === 'bending' ? L / 2 : L * .64;
   const sectionRing = Array.from({ length: 33 }, (_, j) => point(sectionX, j * Math.PI / 16));
   ctx!.shadowColor = '#8eead6'; ctx!.shadowBlur = moving ? 10 + Math.sin(phase * 2) * 4 : 8;
   path(sectionRing, '#a9ead8aa', 1.3, true); ctx!.shadowBlur = 0;
   // 有方向的流点是应力传递示意，不表示材料粒子的运动。
   if (factor > 0) for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
    const t = (i / 6 + phase * .09) % 1;
    const x = mode === 'axial' ? (j % 2 ? .5 + t * .5 : .5 - t * .5) * L : t * L;
    const angle = j / 6 * Math.PI * 2 + (mode === 'torsion' ? t * Math.PI * 2 : 0);
    const q = project(point(x, angle, d / 2 + 1));
    ctx!.fillStyle = mode === 'bending' && Math.cos(angle) < 0 ? '#f7b3a5' : '#a0f1e1';
    ctx!.shadowColor = ctx!.fillStyle; ctx!.shadowBlur = moving ? 7 : 0;
    ctx!.beginPath(); ctx!.arc(q.x, q.y, 1.2, 0, Math.PI * 2); ctx!.fill();
   }
   ctx!.shadowBlur = 0;
   if (mode === 'axial' && factor > 0) {
    const end = homePreviewPoint(mode, factor, L, 0, 0).x;
    arrow({ x: 10, y: 0, z: 0 }, { x: -115, y: 0, z: 0 }, 'N');
    arrow({ x: end - 10, y: 0, z: 0 }, { x: end + 115, y: 0, z: 0 }, 'N');
   } else if (mode === 'bending') {
    const mid = point(L / 2, 0);
    if (factor > 0) arrow({ x: mid.x, y: mid.y + 140, z: 0 }, { x: mid.x, y: mid.y + 7, z: 0 }, 'P');
    [0, L].forEach((x, i) => {
     const q = project(homePreviewPoint(mode, factor, x, -d / 2, 0)), h = 20;
     ctx!.strokeStyle = '#a5bac8'; ctx!.lineWidth = 1.3; ctx!.beginPath(); ctx!.moveTo(q.x, q.y + 2); ctx!.lineTo(q.x - 12, q.y + h); ctx!.lineTo(q.x + 12, q.y + h); ctx!.closePath(); ctx!.stroke();
     const ground = q.y + h + (i ? 10 : 4);
     if (i) [-6, 6].forEach(offset => { ctx!.beginPath(); ctx!.arc(q.x + offset, q.y + h + 4, 3, 0, Math.PI * 2); ctx!.stroke(); });
     ctx!.beginPath(); ctx!.moveTo(q.x - 17, ground); ctx!.lineTo(q.x + 17, ground); ctx!.stroke();
     for (let k = -15; k < 17; k += 6) { ctx!.beginPath(); ctx!.moveTo(q.x + k, ground); ctx!.lineTo(q.x + k - 4, ground + 5); ctx!.stroke(); }
    });
   } else if (mode === 'torsion' && factor > 0) {
    [0, L].forEach((x, i) => {
     const arc = Array.from({ length: 30 }, (_, j) => { const a = (i ? -1 : 1) * j / 29 * Math.PI * 1.55; return { x, y: Math.cos(a) * 88, z: Math.sin(a) * 88 }; });
     path(arc, '#b8b3ef', 1.5); arrow(arc[27], arc[29], '', '#b8b3ef'); text({ x, y: 116, z: 0 }, 'T', '#c6bef4');
    });
   }
   path([{ x: 0, y: 145, z: 0 }, { x: L, y: 145, z: 0 }], '#7492a476');
   [0, L].forEach(x => path([{ x, y: 135, z: 0 }, { x, y: 155, z: 0 }], '#7492a4a0'));
   text({ x: L / 2, y: 163, z: 0 }, `L₀ = ${L} mm`);
   text({ x: L * .7, y: -145, z: 0 }, 'd = 80 mm', '#8fb8c8');
   // 屏幕角落的空间坐标轴。
   const o = { x: width - 48, y: height - 34 };
   ctx!.strokeStyle = '#5b7b8e'; ctx!.lineWidth = 1; ctx!.beginPath(); ctx!.moveTo(o.x, o.y - 22); ctx!.lineTo(o.x, o.y); ctx!.lineTo(o.x + 22, o.y); ctx!.moveTo(o.x, o.y); ctx!.lineTo(o.x - 13, o.y + 10); ctx!.stroke();
   ctx!.font = '9px ui-monospace,monospace'; ctx!.fillStyle = '#8cabbc'; ctx!.fillText('x', o.x + 26, o.y + 3); ctx!.fillText('y', o.x, o.y - 27); ctx!.fillText('z', o.x - 19, o.y + 15);
   if (moving) frame = requestAnimationFrame(draw);
  }
  const requestDraw = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const resize = () => { const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); width = r.width; height = r.height; canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); requestDraw(); };
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) requestDraw(); }); intersection.observe(canvas);
  const visibility = () => { if (!document.hidden) requestDraw(); };
  const preference = () => { reduced = media.matches; requestDraw(); };
  document.addEventListener('visibilitychange', visibility); media.addEventListener('change', preference);
  redrawRef.current = requestDraw; resize();
  return () => { cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', preference); redrawRef.current = () => {}; };
 }, []);
 return <canvas ref={canvasRef} className="hl-preview-canvas" tabIndex={0}
  onPointerDown={e => { const c = cameraRef.current; c.drag = true; c.x = e.clientX; c.y = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }}
  onPointerMove={e => { const c = cameraRef.current; if (!c.drag) return; c.yaw = Math.max(-.9, Math.min(.9, c.yaw + (e.clientX-c.x)*.004)); c.pitch = Math.max(-.65, Math.min(.8, c.pitch + (e.clientY-c.y)*.003)); c.x = e.clientX; c.y = e.clientY; redrawRef.current(); }}
  onPointerUp={e => { cameraRef.current.drag = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
  onPointerCancel={() => { cameraRef.current.drag = false; }}
  onKeyDown={e => { const c = cameraRef.current; if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return; e.preventDefault(); c.yaw = Math.max(-.9, Math.min(.9, c.yaw + (e.key==='ArrowLeft'?-.06:e.key==='ArrowRight'?.06:0))); c.pitch = Math.max(-.65, Math.min(.8,c.pitch + (e.key==='ArrowUp'?-.06:e.key==='ArrowDown'?.06:0))); redrawRef.current(); }} role="img" aria-label={`${details[mode].name}三维教学示意，载荷幅值 ${Math.round(factor * 100)}%，变形已放大；拖动或用方向键旋转，流点表示应力传递示意`}/>;
}

export function HomeMechanicsPreview({ mode, onModeChange, motion, factor: controlledFactor, onFactorChange }: { mode: HomePreviewMode; onModeChange: (mode: HomePreviewMode) => void; motion: boolean; factor?: number; onFactorChange?: (factor: number) => void }) {
 const [localFactor, setLocalFactor] = useState(.72);
 const factor = controlledFactor ?? localFactor;
 const setFactor = onFactorChange ?? setLocalFactor;
 const r = homePreviewResult(mode, factor), info = details[mode];
 return <div className="hl-preview">
  <header className="hl-preview-header"><span><CircleDot size={14}/>线弹性教学预览</span><div role="group" aria-label="首页预览受力形式">{modes.map(({id,title,icon:Icon})=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>onModeChange(id)}><Icon size={13}/>{title}</button>)}</div></header>
  <div className="hl-preview-stage"><div className="hl-stage-caption"><span>{info.range}</span><span>E 206 GPa · ν 0.3</span></div><div className="hl-stage-scan" aria-hidden="true"/><PreviewCanvas mode={mode} factor={factor} motion={motion}/><span className="hl-stage-formula">{info.formula}</span><span className="hl-stage-scale">拖动旋转 · 变形 ×{r.amplification}</span></div>
  <div className="hl-preview-results" aria-live="polite"><div><span>{info.load}</span><strong>{(r.load / (mode==='torsion'?1e6:1000)).toFixed(2)}<small>{info.unit}</small></strong></div><div><span>{info.stress}</span><strong>{r.stress.toFixed(2)}<small>MPa</small></strong></div><div><span>{info.result}</span><strong>{(r.displacement * (mode==='torsion'?180/Math.PI:1)).toFixed(3)}<small>{mode==='torsion'?'°':'mm'}</small></strong></div></div>
  <footer className="hl-preview-control"><label htmlFor="home-preview-load">拖动改变载荷</label><input id="home-preview-load" aria-label="首页预览载荷幅值" type="range" min="0" max="100" value={Math.round(factor*100)} onChange={e=>setFactor(Number(e.target.value)/100)}/><span>{Math.round(factor*100)}%</span></footer>
  <p className="hl-preview-note">首页独立教学参数 · 流点为应力传递示意，不表示材料运动</p>
 </div>;
}
