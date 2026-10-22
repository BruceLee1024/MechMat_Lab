import React, { useEffect, useRef, useState } from 'react';
import { Box, Square, PanelsTopLeft, ZoomIn, ZoomOut, Scan, Layers2, RotateCcw, Grid2X2, Waves } from 'lucide-react';
import { deformSpecimen, planeDrag, projectConcept, strainPoint, type DeformationForm, type SceneView, type Vec2, type Vec3 } from '../graphics/conceptGeometry';
import { conceptViewDirection } from '../graphics/conceptSurface';
import { drawConceptSurface } from '../graphics/drawConceptSurface';
import { conceptFlowLabel, sampleConceptFlow } from '../graphics/conceptFlow';

type SectionScene = { kind: 'sections'; cut: number; axial: number; transverse: number; isolate: boolean };
type StrainScene = { kind: 'strain'; rigid: boolean; axialPercent: number; shear: number; tx: number; ty: number; onAxial: (v: number) => void; onShear: (v: number) => void; onTranslate: (x: number, y: number) => void };
type FormScene = { kind: 'forms'; form: DeformationForm; amount: number };
type Scene = SectionScene | StrainScene | FormScene;
type Handle = { name: string; point: Vec2; action: 'axial' | 'shear' | 'rigid' };
const blue = '#8ad4ff', mint = '#8ee9d1', coral = '#ff9eae', lilac = '#c7b4ff';
const ringOrder = [0, 1, 2, 3, 0];
const ring = (x: number, size = 48): Vec3[] => [[x, -size, size], [x, size, size], [x, size, -size], [x, -size, -size]];
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// 与泊松效应使用相同的 Canvas 空间投影、半透明材质和发光边线。
export function ConceptScene3D({ scene, label, caption }: { scene: Scene; label: string; caption: string }) {
  const [view, setView] = useState<SceneView>('3d');
  const [zoom, setZoom] = useState(1);
  const [original, setOriginal] = useState(true);
  const [xray, setXray] = useState(false);
  const [showFlow, setShowFlow] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canvas = useRef<HTMLCanvasElement>(null);
  const flowCanvas = useRef<HTMLCanvasElement>(null);
  const flowDraw = useRef<(seconds: number) => void>(() => {});
  const flowTime = useRef(1.25);
  const latestScene = useRef(scene);
  const yaw = useRef(.2);
  const redraw = useRef(() => {});
  const handles = useRef<Handle[]>([]);
  const cameraScale = useRef(1);
  const drag = useRef<{ x: number; y: number; yaw: number; action: Handle['action'] | 'orbit'; source: Scene } | null>(null);
  const pendingFrame = useRef<number | null>(null);
  const scheduleDraw = () => { if (pendingFrame.current === null) pendingFrame.current = requestAnimationFrame(() => { pendingFrame.current = null; redraw.current(); }); };
  const resetCamera = () => { yaw.current = .2; setZoom(1); setView('3d'); scheduleDraw(); };
  const flowActive = scene.kind === 'sections' ? scene.axial !== 0 || scene.transverse !== 0 : scene.kind === 'strain' ? !scene.rigid && (scene.axialPercent !== 0 || scene.shear !== 0) : scene.amount > 0;
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { drag.current = null; resetCamera(); }, [scene.kind]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const draw = () => {
      const scene = latestScene.current;
      const { width: w, height: h } = el.getBoundingClientRect();
      if (!w || !h) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const pw = Math.round(w * ratio), ph = Math.round(h * ratio);
      if (el.width !== pw || el.height !== ph) { el.width = pw; el.height = ph; }
      const ctx = el.getContext('2d'); if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w / (scene.kind === 'strain' ? 430 : 745), (h - 95) / (scene.kind === 'strain' ? 390 : 350)) * zoom;
      cameraScale.current = scale;
      const center: Vec2 = [w / 2, h * .49];
      const project = (v: Vec3): Vec2 => { const p = projectConcept(v, view, yaw.current); return [center[0] + p[0] * scale, center[1] + p[1] * scale]; };
      const depth = ([x, y, z]: Vec3) => { const a = yaw.current; return -Math.sin(a) * x + Math.cos(a) * z - .46 * (Math.cos(a) * x + Math.sin(a) * z) + .34 * y; };
      const path = (points: Vec2[], color: string, width = 1, dashed = false, close = false) => {
        ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); if (close) ctx.closePath();
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dashed ? [5, 5] : []); ctx.stroke(); ctx.setLineDash([]);
      };
      const line = (a: Vec3, b: Vec3, color = '#173a55', width = 1, dashed = false) => path([project(a), project(b)], color, width, dashed);
      const text = (value: string, p: Vec3, color = '#b6cde4', offset: Vec2 = [0, 0], align: CanvasTextAlign = 'center', size = 12) => {
        const q = project(p); ctx.font = `${size}px "SFMono-Regular", "PingFang SC", monospace`;
        ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
        // 细描边保持文字在空间网格和透明实体上清晰可读。
        ctx.strokeStyle = '#0b1928'; ctx.lineWidth = 4; ctx.strokeText(value, q[0] + offset[0], q[1] + offset[1]); ctx.fillText(value, q[0] + offset[0], q[1] + offset[1]);
      };
      const arrow2 = (a: Vec2, b: Vec2, color: string, solid = false) => {
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]); if (length < 1) return;
        const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
        ctx.save(); ctx.translate(...a); ctx.rotate(angle); ctx.shadowColor = color; ctx.shadowBlur = solid ? 12 : 5;
        const head = Math.min(solid ? 13 : 9, length * .4), half = solid ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(length - head, -half); ctx.lineTo(length - head, -head * .55); ctx.lineTo(length, 0); ctx.lineTo(length - head, head * .55); ctx.lineTo(length - head, half); ctx.lineTo(0, half); ctx.closePath();
        ctx.fillStyle = color; ctx.fill(); if (solid) { ctx.strokeStyle = '#ffe1e9'; ctx.lineWidth = .7; ctx.stroke(); } ctx.restore();
      };
      const arrow = (a: Vec3, b: Vec3, color: string, name?: string, offset: Vec2 = [0, -13]) => { arrow2(project(a), project(b), color, true); if (name) text(name, b, color, offset, 'center', 14); };
      const polygon = (pts: Vec3[], color: string, stroke: string) => {
        const p = pts.map(project); ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath();
        ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
      };
      if (view === '3d') {
        // 与泊松场景相同的地面网格，离轴越远越淡。
        for (let n = -760; n <= 760; n += 40) {
          ctx.globalAlpha = scene.kind === 'forms' ? .5 * (1 - Math.abs(n) / 1000) : 1;
          line([n, -155, -600], [n, -155, 600], '#173d5655');
          line([-760, -155, n], [760, -155, n], '#173d5655');
          ctx.globalAlpha = 1;
        }
        const glow = ctx.createRadialGradient(w / 2, h * .58, 0, w / 2, h * .58, w * .48);
        glow.addColorStop(0, '#338fff14'); glow.addColorStop(1, '#338fff00'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
        if (scene.kind === 'forms') {
          const p = project([0, -154, 0]), axis = project([1, -154, 0]);
          ctx.save(); ctx.translate(...p); ctx.rotate(Math.atan2(axis[1] - p[1], axis[0] - p[0])); ctx.scale(1, .2);
          const radius = 290 * scale, shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
          shadow.addColorStop(0, '#02091599'); shadow.addColorStop(.55, '#02091555'); shadow.addColorStop(1, '#02091500');
          ctx.fillStyle = shadow; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
        }
      } else {
        for (let n = -600; n <= 600; n += 40) line([n, -300, -300], [n, 300, 300], '#173d5640');
        for (let n = -300; n <= 300; n += 40) line([-600, view === 'front' ? n : 0, view === 'top' ? n : 0], [600, view === 'front' ? n : 0, view === 'top' ? n : 0], '#173d5640');
      }
      const wire = (rings: Vec3[][], color: string, dashed = false, width = 1) => {
        for (const r of [rings[0], rings[rings.length - 1]]) path(ringOrder.map(i => project(r[i])), color, width, dashed);
        for (let i = 0; i < 4; i++) path(rings.map(r => project(r[i])), color, width, dashed);
      };
      const solid = (rings: Vec3[][]) => {
        const faces: { points: Vec3[]; face: number }[] = [];
        for (let side = 0; side < 4; side++) faces.push({ points: [...rings.map(r => r[side]), ...rings.slice().reverse().map(r => r[(side + 1) % 4])], face: side });
        faces.push({ points: rings[0], face: 4 }, { points: rings[rings.length - 1], face: 5 });
        faces.sort((a, b) => a.points.reduce((v, p) => v + depth(p), 0) / a.points.length - b.points.reduce((v, p) => v + depth(p), 0) / b.points.length);
        faces.forEach(({ points, face }) => {
          const p = points.map(project); ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath();
          const gradient = ctx.createLinearGradient(0, center[1] - 110 * scale, 0, center[1] + 120 * scale);
          gradient.addColorStop(0, ['#3a96e57a', '#9cdeff8c', '#174b7545', '#174e7d65', '#79c8ff65', '#83cfff70'][face]); gradient.addColorStop(1, '#123f7830'); ctx.fillStyle = gradient; ctx.fill();
        });
        // 截面线与面内材料网格保留透明度，外轮廓单独发光。
        rings.forEach(r => path(ringOrder.map(i => project(r[i])), '#89ceff35'));
        for (let side = 0; side < 4; side++) for (let j = 1; j < 4; j++) {
          const t = j / 4; path(rings.map(r => project(r[side].map((n, k) => n + (r[(side + 1) % 4][k] - n) * t) as Vec3)), '#89ceff30');
        }
        ctx.shadowColor = '#4baaff'; ctx.shadowBlur = 16; wire(rings, '#69c5ff', false, 2.2); ctx.shadowBlur = 0;
        wire(rings, '#c5ecff', false, .65);
      };
      const couple = (center3: Vec3, plane: 'xy' | 'yz', direction: number, color: string, name: string, radius = 39) => {
        const pts: Vec3[] = Array.from({ length: 36 }, (_, i) => {
          const angle = -.7 + direction * i / 35 * Math.PI * 1.55;
          return plane === 'xy' ? [center3[0] + radius * Math.cos(angle), center3[1] + radius * Math.sin(angle), center3[2]] : [center3[0], center3[1] + radius * Math.cos(angle), center3[2] + radius * Math.sin(angle)];
        });
        const p = pts.map(project); path(p, color, 2);
        const end = p[p.length - 1], prev = p[p.length - 2], angle = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
        ctx.beginPath(); ctx.moveTo(...end); ctx.lineTo(end[0] - 9 * Math.cos(angle - .45), end[1] - 9 * Math.sin(angle - .45)); ctx.lineTo(end[0] - 9 * Math.cos(angle + .45), end[1] - 9 * Math.sin(angle + .45)); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
        text(name, center3, color, [0, 0], 'center', 14);
      };
      const dimension = (a: Vec3, b: Vec3, name: string, offset: Vec2 = [0, -13], color = '#a7c4df') => {
        const p = project(a), q = project(b); path([p, q], '#80a7c6', .8);
        const dx = q[0] - p[0], dy = q[1] - p[1], length = Math.hypot(dx, dy); if (length < 4) return;
        const n: Vec2 = [-dy / length * 5, dx / length * 5];
        for (const v of [p, q]) path([[v[0] - n[0], v[1] - n[1]], [v[0] + n[0], v[1] + n[1]]], '#80a7c6', .8);
        text(name, a.map((n, i) => (n + b[i]) / 2) as Vec3, color, offset, 'center', w < 500 ? 10 : 12);
      };
      handles.current = [];
      if (scene.kind === 'sections') {
        const cutX = -225 + 450 * scene.cut / 100;
        if (original) wire([ring(-225), ring(225)], '#92adca77', true);
        const start = scene.isolate ? cutX : -225;
        solid(Array.from({ length: 13 }, (_, i) => ring(start + (225 - start) * i / 12)));
        const plane = ring(cutX, 65);
        polygon(plane, '#74ddc91f', '#94e8d0');
        path([...plane, plane[0]].map(project), '#94e8d0', 1, true);
        const leader = project([cutX, 65, 65]); path([leader, [leader[0] - 18, leader[1] - 26]], mint);
        text('截面 x', [cutX, 65, 65], mint, [-23, -34], 'right', 11);
        if (scene.axial > 0) arrow([234, 0, 0], [315, 0, 0], coral, 'F');
        if (scene.transverse > 0) arrow([225, -55, 0], [225, -125, 0], coral, 'P', [15, 0]);
        if (scene.isolate) {
          if (scene.axial > 0) arrow([cutX - 6, 0, 0], [cutX - 90, 0, 0], blue, 'N');
          if (scene.transverse > 0) { arrow([cutX, 70, 0], [cutX, 140, 0], mint, 'Q', [13, -4]); couple([cutX - 30, -110, 15], 'xy', 1, lilac, 'M', 31); }
        } else {
          polygon(ring(-235, 64), '#8ea5c01c', '#8ea5c0');
          for (let n = -60; n < 65; n += 18) line([-235, n, 58], [-257, n - 15, 58], '#8ea5c0');
          if (scene.axial > 0) arrow([-240, 0, 0], [-325, 0, 0], blue, 'Rx');
          if (scene.transverse > 0) { arrow([-235, 75, 0], [-235, 140, 0], mint, 'Ry', [0, -12]); couple([-260, -110, 15], 'xy', 1, lilac, 'M₀', 31); }
        }
        dimension([-225, 190, 0], [225, 190, 0], 'L = 1.00 m');
        if (w > 520) dimension([cutX, -190, 0], [225, -190, 0], `L − x = ${(1 - scene.cut / 100).toFixed(2)} m`, [0, 16], mint);
      } else if (scene.kind === 'strain') {
        const transform = (p: Vec3) => strainPoint(p, scene.rigid, scene.axialPercent / 100, scene.shear, scene.tx, scene.ty);
        const slabRing = (x: number) => [[x, 0, 18], [x, 100, 18], [x, 100, -18], [x, 0, -18]] as Vec3[];
        if (original) wire([slabRing(0), slabRing(100)].map(r => r.map(([x, y, z]) => [(x - 50) * 2.5, (y - 50) * 2.5, z] as Vec3)), '#a2b5cd99', true);
        solid(Array.from({ length: 11 }, (_, i) => slabRing(i * 10).map(transform)));
        // 正面材料网格来自同一位移场，随伸缩和剪切共同变形。
        for (let i = 10; i < 100; i += 10) line(transform([0, i, 18]), transform([100, i, 18]), '#a1dbff50');
        const points = [[0, 0, 18], [100, 0, 18], [100, 100, 18], [0, 100, 18]] as Vec3[];
        points.forEach((p, i) => {
          const q = project(transform(p)); const active = view !== 'top' && (scene.rigid ? i === 2 : i === 1 || i === 3);
          const color = i === 2 ? coral : mint;
          if (original) { const ref = project([(p[0] - 50) * 2.5, (p[1] - 50) * 2.5, p[2]]); if (Math.hypot(q[0] - ref[0], q[1] - ref[1]) > 8) arrow2(ref, q, '#91edcf77'); }
          if (active) { ctx.beginPath(); ctx.arc(...q, 11, 0, 2 * Math.PI); ctx.fillStyle = '#74ddc91f'; ctx.fill(); handles.current.push({ name: ['A', 'B', 'C', 'D'][i], point: q, action: scene.rigid ? 'rigid' : i === 1 ? 'axial' : 'shear' }); }
          ctx.beginPath(); ctx.arc(...q, active ? 5 : 3, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#d0fff2'; ctx.lineWidth = 1; ctx.stroke();
          text(['A', 'B', 'C', 'D'][i], transform(p), color, [i === 1 || i === 2 ? 15 : -15, i < 2 ? 16 : -16]);
        });
        dimension([-125, 178, 18], [125, 178, 18], 'L₀ = 100 mm', [0, -14]);
      } else {
        const reference = Array.from({ length: 49 }, (_, i) => ring(-225 + i * 450 / 48));
        if (original) wire(reference, '#92adca88', true);
        drawConceptSurface(ctx, reference.map(r => r.map(p => deformSpecimen(p, scene.form, scene.amount))), { project, viewDirection: conceptViewDirection(view, yaw.current), xray, accentEnds: scene.form === 'torsion' });
        // 中性轴/中心轴用于辨认弯曲和截面转动。
        if (xray) path(reference.map(r => project(deformSpecimen([r[0][0], 0, 0], scene.form, scene.amount))), '#a3dcff70', 1, true);
        const edgeX = 225 * (scene.form === 'axial' ? 1 + scene.amount * .18 : 1);
        if (scene.form === 'axial') { arrow([-edgeX - 10, 0, 0], [-edgeX - 80, 0, 0], coral, 'N'); arrow([edgeX + 10, 0, 0], [edgeX + 80, 0, 0], coral, 'N'); }
        if (scene.form === 'shear') {
          arrow([-225, 0, 0], [-225, -105, 0], mint, 'Q', [-14, 0]); arrow([225, 0, 0], [225, 105, 0], mint, 'Q');
          arrow([-35, 85, 0], [65, 85, 0], mint); arrow([35, -85, 0], [-65, -85, 0], mint);
        }
        if (scene.form === 'torsion') {
          couple([-273, 0, 0], 'yz', -1, lilac, 'T', 72); couple([273, 0, 0], 'yz', 1, lilac, 'T', 72);
          if (w > 600 && view !== 'top') {
            text('起始截面', [-225, 99, 0], '#9cd8df', [0, -12], 'center', 10);
            text('末端截面', [225, 99, 0], '#bdc5ee', [0, -12], 'center', 10);
          }
        }
        if (scene.form === 'bending') { couple([-285, 0, 0], 'xy', -1, coral, 'M', 50); couple([285, 0, 0], 'xy', 1, coral, 'M', 50); }
        dimension([-225, 150, 0], [225, 150, 0], '初始轴线 L₀', [0, -15]);
      }
      // 屏幕坐标中的方向标尺与泊松效应一致，不随缩放改变文字大小。
      const origin: Vec2 = [30, h - 80];
      for (const [name, vector] of [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]] as [string, Vec3][]) {
        const p = projectConcept(vector, view, yaw.current), norm = Math.hypot(...p); if (norm < .01) continue;
        const d = p.map(v => v / norm) as Vec2;
        arrow2(origin, [origin[0] + d[0] * 29, origin[1] + d[1] * 29], '#8cabc7');
        ctx.font = '10px system-ui'; ctx.fillStyle = '#a8c9e8'; ctx.textAlign = 'center'; ctx.fillText(name, origin[0] + d[0] * 39, origin[1] + d[1] * 39);
      }
      // 流线在参考构形中生成，再经过与试件完全相同的变形和相机映射。
      const overlay = flowCanvas.current, flow = overlay?.getContext('2d');
      if (overlay && flow) {
        if (overlay.width !== pw || overlay.height !== ph) { overlay.width = pw; overlay.height = ph; }
        flowDraw.current = seconds => {
          flow.setTransform(ratio, 0, 0, ratio, 0, 0); flow.clearRect(0, 0, w, h);
          if (!showFlow) return;
          for (const particle of sampleConceptFlow(scene, seconds)) {
            const points = particle.trail.map(project), head = points[points.length - 1];
            const gradient = flow.createLinearGradient(...points[0], ...head);
            gradient.addColorStop(0, `${particle.color}00`); gradient.addColorStop(1, particle.color);
            flow.globalAlpha = particle.opacity * .8; flow.strokeStyle = gradient; flow.lineWidth = 1.3; flow.lineCap = 'round';
            flow.beginPath(); points.forEach((p, i) => i ? flow.lineTo(...p) : flow.moveTo(...p)); flow.stroke();
            flow.globalAlpha = particle.opacity; flow.fillStyle = particle.color; flow.shadowColor = particle.color; flow.shadowBlur = 7;
            flow.beginPath(); flow.arc(...head, 1.45, 0, Math.PI * 2); flow.fill(); flow.shadowBlur = 0;
          }
          flow.globalAlpha = 1;
        };
        flowDraw.current(flowTime.current);
      }
    };
    redraw.current = draw; draw();
    const observer = new ResizeObserver(draw); observer.observe(el);
    return () => { observer.disconnect(); redraw.current = () => {}; flowDraw.current = () => {}; if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current); pendingFrame.current = null; };
  }, [scene.kind, view, zoom, original, xray, showFlow, reducedMotion]);
  // 播放和调参只重绘，不重复注册尺寸观察器。
  useEffect(() => { latestScene.current = scene; redraw.current(); }, [scene]);
  useEffect(() => {
    if (!showFlow || !flowActive || reducedMotion) return;
    let request: number | null = null, previous = 0, painted = 0, visible = false;
    const tick = (now: number) => {
      if (previous) flowTime.current += Math.min((now - previous) / 1000, .1);
      previous = now;
      if (now - painted >= 32) { flowDraw.current(flowTime.current); painted = now; }
      request = requestAnimationFrame(tick);
    };
    const stop = () => { if (request !== null) cancelAnimationFrame(request); request = null; previous = 0; };
    const update = () => { if (!visible || document.visibilityState !== 'visible') stop(); else if (request === null) request = requestAnimationFrame(tick); };
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); update(); }, { threshold: .01 });
    if (flowCanvas.current) observer.observe(flowCanvas.current);
    document.addEventListener('visibilitychange', update);
    return () => { stop(); observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [showFlow, flowActive, reducedMotion, scene.kind]);
  return <div className="study-stage concept-scene-3d">
    <div className="study-scene-topline"><div className="study-legend">{original && <span><i className="study-dashed" />{scene.kind === 'sections' ? '完整构件轮廓' : '初始形态'}</span>}<span><i />{scene.kind === 'sections' ? scene.isolate ? '保留右段' : '完整构件' : '当前形态'}</span></div>
      <div className="study-view-controls" role="group" aria-label="概念演示视角">{([['3d', '三维视图', Box], ['front', '正视图', Square], ['top', '俯视图', PanelsTopLeft]] as const).map(([key, name, Icon]) => <button key={key} aria-label={name} title={name} aria-pressed={view === key} onClick={() => setView(key)}><Icon size={13} /><span>{key === '3d' ? '3D 视图' : name}</span></button>)}</div>
    </div>
    {showFlow && <div className="study-flow-legend" title="粒子仅示意受力或应变特征，不计算定量应力，也不表示材料流动。"><Waves size={12} /><span>{conceptFlowLabel(scene)}{reducedMotion && flowActive ? ' · 静态' : ''}</span></div>}
    <canvas ref={canvas} role="img" aria-label={`${label}，${view === '3d' ? '三维视图' : view === 'front' ? '正视图' : '俯视图'}${scene.kind === 'forms' ? xray ? '，透视网格' : '，实体表面' : ''}，粒子流${showFlow ? flowActive ? reducedMotion ? '静态显示' : '已开启' : '无活动粒子' : '已关闭'}`} onPointerDown={e => {
      const rect = e.currentTarget.getBoundingClientRect(), p: Vec2 = [e.clientX - rect.left, e.clientY - rect.top];
      const handle = handles.current.find(h => Math.hypot(h.point[0] - p[0], h.point[1] - p[1]) < 18);
      if (!handle && view !== '3d') return;
      drag.current = { x: e.clientX, y: e.clientY, yaw: yaw.current, action: handle?.action ?? 'orbit', source: scene };
      e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.style.cursor = 'grabbing';
    }} onPointerMove={e => {
      const gesture = drag.current;
      if (!gesture) { const rect = e.currentTarget.getBoundingClientRect(); const hit = handles.current.some(h => Math.hypot(h.point[0] - e.clientX + rect.left, h.point[1] - e.clientY + rect.top) < 18); e.currentTarget.style.cursor = hit ? 'move' : view === '3d' ? 'grab' : 'default'; return; }
      if (gesture.action === 'orbit') { yaw.current = clamp(gesture.yaw + (e.clientX - gesture.x) * .004, -.45, .8); scheduleDraw(); return; }
      const s = gesture.source; if (s.kind !== 'strain') return;
      const delta = planeDrag([e.clientX - gesture.x, e.clientY - gesture.y], view, yaw.current, cameraScale.current * 2.5);
      if (!delta) return;
      if (gesture.action === 'rigid') s.onTranslate(clamp(Math.round(s.tx + delta[0]), -20, 20), clamp(Math.round(s.ty + delta[1]), -20, 20));
      else if (gesture.action === 'axial') s.onAxial(clamp(Number((s.axialPercent + delta[0] / 8).toFixed(2)), -1, 1));
      else s.onShear(clamp(Number((s.shear + delta[0] / 800).toFixed(3)), -.03, .03));
    }} onPointerUp={e => { drag.current = null; e.currentTarget.style.cursor = view === '3d' ? 'grab' : 'default'; }} onPointerCancel={() => { drag.current = null; }} />
    <canvas ref={flowCanvas} className="concept-flow-canvas" aria-hidden="true" />
    <div className="study-camera-dock" role="toolbar" aria-label="概念视图显示控制">
      <button aria-label="缩小概念视图" title="缩小" disabled={zoom <= .7} onClick={() => setZoom(v => Math.max(.7, Number((v - .1).toFixed(1))))}><ZoomOut size={14} /></button><output aria-label="概念视图缩放比例">{Math.round(zoom * 100)}%</output>
      <button aria-label="放大概念视图" title="放大" disabled={zoom >= 1.4} onClick={() => setZoom(v => Math.min(1.4, Number((v + .1).toFixed(1))))}><ZoomIn size={14} /></button><button aria-label="适应概念画布" title="适应画布" onClick={() => setZoom(1)}><Scan size={14} /></button><span />
      {scene.kind === 'forms' && <button aria-label="透视网格" title="透视网格" aria-pressed={xray} onClick={() => setXray(v => !v)}><Grid2X2 size={14} /></button>}
      <button aria-label="显示概念初始轮廓" title="初始轮廓" aria-pressed={original} onClick={() => setOriginal(v => !v)}><Layers2 size={14} /></button><button aria-label="复位概念视角" title="复位视角" onClick={resetCamera}><RotateCcw size={14} /></button>
      <span /><button className="concept-flow-toggle" aria-label="显示概念粒子流" title={showFlow ? '关闭粒子流' : '开启粒子流'} aria-pressed={showFlow} onClick={() => setShowFlow(v => !v)}><Waves size={14} /></button>
    </div>
    <div className="study-caption"><span>{scene.kind === 'strain' && view === 'top' ? '切换三维或正视图可拖动单元' : scene.kind === 'forms' && scene.form === 'torsion' ? '几何示意 · 青色线为随截面转动的材料线' : caption}</span><span>{view === '3d' ? '拖动空白区域旋转视角' : '正交投影'}</span></div>
  </div>;
}
