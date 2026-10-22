import { axialField, axialMaterialPoint, axialTraction } from '../mechanics/axialField';
import { AxialFieldReadout, type AxialFieldMode } from './AxialFieldReadout';
import {drawLoadArrow} from '../graphics/loadArrows';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Square, PanelsTopLeft, Maximize2, RotateCcw, ZoomIn, ZoomOut, Scan, Ruler, Layers2, Waves } from 'lucide-react';
import { sampleStressFlow } from '../graphics/stressFlow';
import { axialSectionPlane } from '../graphics/axialSection';
import { axialDisplayShape, type AxialSpecimen } from '../graphics/axialSpecimen';

type View = '3d' | 'front' | 'top';
type Point = [number, number];
type Vector = [number, number, number];
export interface PoissonGeometry { stress: number; strain: number; transverseStrain: number; lengthMm: number; currentLength: number; width: number; currentWidth: number }

// 科学可视化使用动态 Canvas 投影，几何随当前计算结果变化，文字不烘焙为图片。
export function PoissonScene({ values, title = '泊松效应演示实验', subtitle = '轴向拉伸下的三维变形可视化', showSection = false, axial = false, specimen, sectionAngle = 0, children }: { values: PoissonGeometry; title?: string; subtitle?: string; showSection?: boolean; axial?: boolean; specimen?: AxialSpecimen; sectionAngle?: number; children?: React.ReactNode }) {
  const [fieldMode, setFieldMode] = useState<AxialFieldMode>('deformation');
  const [station, setStation] = useState(.5);
  const [view, setView] = useState<View>('3d');
  const [zoom, setZoom] = useState(1);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showStress, setShowStress] = useState(true);
  const [requestedAmplification, setRequestedAmplification] = useState(10);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const orbit = useRef(0);
  const redraw = useRef<() => void>(() => {});
  const frame = useRef<number | null>(null);
  const drag = useRef<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const flowCanvas = useRef<HTMLCanvasElement>(null);
  const flowDraw = useRef<(seconds: number) => void>(() => {});
  const flowTime = useRef(1.25);
  const figure = useRef<HTMLDivElement>(null);
  const shape = axialDisplayShape(values.strain, values.transverseStrain, requestedAmplification);
  const amplification = axial ? shape.amplification : 80;
  const coupled = !specimen || specimen.status === 'coupled';
  const field = specimen ? axialField(specimen) : null;
  const mode = coupled && !showSection ? fieldMode : 'deformation';
  const flowAllowed = (specimen?.allowFlow ?? true) && (!axial || mode === 'deformation');
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const draw = () => {
      const rect = el.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width < 1 || rect.height < 1) return;
      el.width = Math.round(rect.width * ratio); el.height = Math.round(rect.height * ratio);
      const ctx = el.getContext('2d'); if (!ctx) return;
      ctx.scale(ratio, ratio);
      const w = rect.width, h = rect.height;
      const l = axial ? shape.halfLength : 200 * (1 + Math.max(-0.25, Math.min(0.4, values.strain * amplification)));
      const s = axial ? shape.halfWidth : 60 * (1 + Math.max(-0.2, Math.min(0.2, values.transverseStrain * amplification)));
      // 短屏时留出顶部图例空间，实体与粒子叠层共用同一等比投影。
      const centerY = axial ? (h - 5) / 2 : h * .46;
      const yaw = view === '3d' ? 0.2 + orbit.current : 0;
      const project = ([x, y, z]: Vector): Point => {
        const rx = x * Math.cos(yaw) + z * Math.sin(yaw), rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
        return view === 'front' ? [x, -y] : view === 'top' ? [x, z] : [rx + rz * 0.46, -y - rz * 0.34];
      };
      let scale = Math.min(w / (w < 620 ? 660 : 760), h / 405);
      if (axial) {
        // 只做统一相机缩放，不截断应变，也不单独拉伸画布的宽高。
        const bounds: Point[] = [];
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) bounds.push(project([x * (Math.max(200,l) + 100), y * Math.max(110,s), z * Math.max(60,s)]));
        const maxX = Math.max(...bounds.map(p => Math.abs(p[0]))), maxY = Math.max(...bounds.map(p => Math.abs(p[1])));
        scale = Math.min(scale, (w-30)/(2*maxX), Math.max(30,centerY-58)/maxY, Math.max(30,h-centerY-62)/maxY);
      }
      scale *= zoom;
      ctx.save(); ctx.translate(w / 2, centerY); ctx.scale(scale, scale);
      const line = (a: Point, b: Point, color = '#244868', width = 1, dashed = false) => {
        ctx.beginPath(); ctx.setLineDash(dashed ? [5, 5] : []); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); ctx.setLineDash([]);
      };
      const label = (text: string, x: number, y: number, color = '#a8c9e8', align: CanvasTextAlign = 'center', font = 13) => {
        if (w < 620 && /^(L|h|w)/.test(text)) return;
        if (axial || w < 500) font = Math.max(font, 10 / scale);
        ctx.font = `${font}px Inter, "PingFang SC", sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y);
      };
      if (view === '3d') {
        for (let n = -600; n <= 600; n += 40) {
          line(project([n, -90, -420]), project([n, -90, 420]), '#102b43');
          line(project([-600, -90, n]), project([600, -90, n]), '#102b43');
        }
      } else {
        for (let n = -500; n < 500; n += 40) {
          line([n, -220], [n, 220], '#10273e'); line([-500, n], [500, n], '#10273e');
        }
      }
      const corners = (lx: number, sy: number, left = -lx): Vector[] => [
        [left, -sy, -sy], [lx, -sy, -sy], [lx, sy, -sy], [left, sy, -sy],
        [left, -sy, sy], [lx, -sy, sy], [lx, sy, sy], [left, sy, sy],
      ];
      const original = corners(200, 60).map(project);
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      if (showOriginal) edges.forEach(([a,b]) => line(original[a], original[b], '#92adca', 1, true));
      const drawBlock = (left: number, right: number) => {
      const pts = corners(right, s, left).map(project);
      const faces = [[0,1,2,3],[1,5,6,2],[3,2,6,7],[4,5,6,7]];
      faces.forEach((face, i) => {
        ctx.beginPath(); face.forEach((v,j) => j ? ctx.lineTo(...pts[v]) : ctx.moveTo(...pts[v])); ctx.closePath();
        const fill = ctx.createLinearGradient(0,-100,0,100);
        fill.addColorStop(0, ['#123b6888','#368ce199','#94d8ff99','#367fdf99'][i]); fill.addColorStop(1, '#10336799');
        ctx.fillStyle = fill; ctx.fill();
      });
      for (let i = 1; i < 18; i++) {
        const x = left + i * (right-left) / 18;
        line(project([x,-s,s]), project([x,s,s]), '#6ab8ff33');
        line(project([x,s,-s]), project([x,s,s]), '#6ab8ff33');
      }
      for (let i = 1; i < 5; i++) {
        const y = -s + i * 2 * s / 5;
        line(project([left,y,s]), project([right,y,s]), '#6ab8ff33');
      }
      ctx.shadowColor = '#53adff'; ctx.shadowBlur = 20;
      edges.forEach(([a,b]) => line(pts[a],pts[b], '#6ac3ff', 2.6));
      ctx.shadowBlur = 0;
      [[4,5],[5,6],[6,7],[7,4],[3,7],[2,6]].forEach(([a,b]) => line(pts[a],pts[b],'#bde8ff',1));
      };
      if (axial && field && mode==='traction') {
        const x=(station*2-1)*l;
        drawBlock(-l,x);
        ctx.save();ctx.globalAlpha=.16;drawBlock(x,l);ctx.restore();
      } else drawBlock(-l,l);
      if (specimen?.status === 'fracture-reference') {
        // 未求解裂缝位置和开口，保留完整参考体，不凭空制造两块断体。
        label('超出脆断参考点 · 破坏后形态未求解',0,s+52,'#e8b9c5','center',12);
      }
      // 位移场使用同一材料应变映射参考网格；色彩仅编码 u_x，单轴应力并不沿杆长变化。
      if (axial && field && mode === 'displacement') {
        for (let i=0;i<24;i++) {
          const a=-l+2*l*i/24,b=-l+2*l*(i+1)/24;
          const ux=axialMaterialPoint(field,[((i+.5)/24-.5)*field.lengthMm,0,0]).displacement[0];
          const maxU=Math.abs(field.strain*field.lengthMm/2);
          const t=maxU>0?ux/maxU:0;
          const color=t<0 ? `rgba(105,185,255,${Math.abs(t)*.5})` : `rgba(189,158,247,${Math.abs(t)*.5})`;
          const pts=[[a,-s,s],[b,-s,s],[b,s,s],[a,s,s]].map(p=>project(p as Vector));
          ctx.beginPath();pts.forEach((p,j)=>j?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();
        }
        for (const side of [-1,1]) {
          const ux=axialMaterialPoint(field,[side*field.lengthMm/2,0,0]).displacement[0];
          const p=project([side*l,-s-20,s]);
          label(`uₓ = ${ux.toFixed(4)} mm`,p[0],p[1],side<0?'#93c9ff':'#d4b9ff','center',11);
        }
      }
      if (axial && field && mode !== 'deformation') {
        const x=(station*2-1)*l;
        const pts=[[x,-s,-s],[x,s,-s],[x,s,s],[x,-s,s]].map(p=>project(p as Vector));
        ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
        ctx.fillStyle=mode==='traction'?'#8ce1c946':'#ceb0ff22';ctx.fill();ctx.strokeStyle=mode==='traction'?'#9beed6':'#c4aff3';ctx.lineWidth=1.5;ctx.stroke();
        const traction = axialTraction(field,[1,0,0]);
        if (mode==='traction' && traction[0]!==0) {
          // 正法向截面上的面力 t_x=F/A，九个等长箭头表示均匀分布，非九个集中载荷。
          for (const y of [-.65,0,.65]) for (const z of [-.65,0,.65]) {
            const a=project([x,y*s,z*s]),b=project([x+Math.sign(traction[0])*46,y*s,z*s]);
            line(a,b,'#aff9dd',1.5);const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
            ctx.beginPath();ctx.moveTo(...b);ctx.lineTo(b[0]-7*Math.cos(angle-.4),b[1]-7*Math.sin(angle-.4));ctx.lineTo(b[0]-7*Math.cos(angle+.4),b[1]-7*Math.sin(angle+.4));ctx.closePath();ctx.fillStyle='#aff9dd';ctx.fill();
          }
        }
        const p=project([x,s+25,s]);
        label(mode==='traction'?'保留左段 · n = +eₓ':`探针 uₓ = ${axialMaterialPoint(field,[(station-.5)*field.lengthMm,0,0]).displacement[0].toFixed(4)} mm`,p[0],p[1],mode==='traction'?'#b4efdc':'#d4b9ff','center',11);
      }
      if (showSection) {
        const plane = axialSectionPlane(l, s, sectionAngle);
        const section = plane.map(project);
        ctx.beginPath(); section.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
        ctx.fillStyle = '#74ddc92b'; ctx.fill(); ctx.strokeStyle = '#91eedb'; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
        const edge = project(plane[2]);
        line(edge,[edge[0]-28,edge[1]-42],'#91eedb',1);
        label(sectionAngle ? `斜截面 α = ${sectionAngle}°` : '截面 A₀',edge[0]-32,edge[1]-49,'#a6efdf','right',12);
      }
      const arrow = (start: Point, end: Point, color: string) => {
        if (color === '#ff9ba9') {drawLoadArrow(ctx,start,end);return;}
        line(start,end,color,2); const angle=Math.atan2(end[1]-start[1],end[0]-start[0]);
        ctx.beginPath(); ctx.moveTo(...end); ctx.lineTo(end[0]-12*Math.cos(angle-.4),end[1]-12*Math.sin(angle-.4)); ctx.lineTo(end[0]-12*Math.cos(angle+.4),end[1]-12*Math.sin(angle+.4)); ctx.closePath(); ctx.fillStyle=color; ctx.fill();
      };
      const direction = values.stress < 0 ? -1 : 1;
      for (const side of [-1,1]) {
        if (Math.abs(values.stress) < 1e-12) continue;
        const p=project([side*(l+8),0,0]), q=project([side*(l+78),0,0]);
        ctx.save();if (axial && mode==='traction' && side===1) ctx.globalAlpha=.25;
        arrow(direction > 0 ? p:q,direction > 0 ? q:p,'#ff9ba9');
        label(coupled ? 'F' : 'F试',q[0]+side*16,q[1]-8,'#ff9ba9','center',18);
        ctx.restore();
      }
      if (showDimensions && w >= 620) {
      const left=project([-200,110,0]), right=project([200,110,0]);
      const lengthY = Math.min(left[1], right[1]) - 10;
      line([left[0],lengthY],[right[0],lengthY],'#85acd0');
      [left,right].forEach(p=>line([p[0],lengthY-5],[p[0],lengthY+18],'#85acd0'));
      label(`L₀ = ${values.lengthMm.toFixed(1)} mm`,(left[0]+right[0])/2,lengthY-32,'#c2d7ed');
      label(coupled ? `L = ${values.currentLength.toFixed(3)} mm` : 'L 未确定 · 参考形态',(left[0]+right[0])/2,lengthY-13,'#6ecbff');
      if (axial) {
        const areaPoint = project([l+16,-s-32,s]);
        label(`A₀ = ${(values.width**2).toFixed(1)} mm²`,areaPoint[0],areaPoint[1],'#a6efdf','center',12);
        if (coupled) label(`A = ${(values.currentWidth**2).toFixed(3)} mm²`,areaPoint[0],areaPoint[1]+20,'#8db5d0','center',11);
      } else {
      const side=project([l+32,25,s]);
      line([side[0],side[1]-s],[side[0],side[1]+s],'#85acd0');
      line([side[0]-5,side[1]-s],[side[0]+5,side[1]-s],'#85acd0');
      line([side[0]-5,side[1]+s],[side[0]+5,side[1]+s],'#85acd0');
      label(`h₀ = ${values.width.toFixed(1)} mm`,side[0]+13,side[1]-s-22,'#c2d7ed','left');
      label(`h = ${values.currentWidth.toFixed(3)} mm`,side[0]+13,side[1]-s-1,'#6ecbff','left');
      const depth=project([l+32,-80,-s]);
      label(`w₀ = ${values.width.toFixed(1)} mm`,depth[0]+13,depth[1]+10,'#c2d7ed','left');
      label(`w = ${values.currentWidth.toFixed(3)} mm`,depth[0]+13,depth[1]+31,'#6ecbff','left');
      }
      }
      ctx.restore();
      const origin: Point=[34,h-78];
      const axis = (name: string, vector: Vector) => {
        const [px, py] = project(vector), norm = Math.hypot(px, py);
        if (norm < .01) return;
        const dx = px / norm, dy = py / norm;
        arrow(origin, [origin[0] + dx * 35, origin[1] + dy * 35], '#8baecf');
        ctx.font='11px Inter, sans-serif';ctx.fillStyle='#a8c9e8';ctx.textAlign='center';
        ctx.fillText(name, origin[0] + dx * 46, origin[1] + dy * 46 + 4);
      };
      axis('x', [1,0,0]);
      if (view !== 'top') axis('y', [0,1,0]);
      if (view !== 'front') axis('z', [0,0,1]);
      // 透明叠层只重绘粒子，试件、标注和网格不参与连续动画重绘。
      const overlay = flowCanvas.current;
      const flow = overlay?.getContext('2d');
      if (overlay && flow) {
        overlay.width = el.width; overlay.height = el.height;
        flowDraw.current = seconds => {
          flow.setTransform(ratio, 0, 0, ratio, 0, 0);
          flow.clearRect(0, 0, w, h);
          if (!showStress || !flowAllowed || !Number.isFinite(values.stress) || values.stress === 0) return;
          flow.save(); flow.translate(w / 2, centerY); flow.scale(scale, scale);
          const particles = sampleStressFlow(values.stress, seconds);
          const color = values.stress > 0 ? '#ffc690' : '#81eadb';
          const core = values.stress > 0 ? '#fff2d3' : '#d9fff8';
          for (const particle of particles) {
            const head = project([particle.position[0] * l, particle.position[1] * s, particle.position[2] * s]);
            const tail = project([particle.tail[0] * l, particle.tail[1] * s, particle.tail[2] * s]);
            flow.globalAlpha = particle.opacity * .65;
            const trail = flow.createLinearGradient(...tail, ...head);
            trail.addColorStop(0, `${color}00`); trail.addColorStop(1, color);
            flow.strokeStyle = trail; flow.lineWidth = Math.max(1.25, .8 / scale); flow.lineCap = 'round';
            flow.beginPath(); flow.moveTo(...tail); flow.lineTo(...head); flow.stroke();
            flow.globalAlpha = particle.opacity;
            flow.shadowColor = color; flow.shadowBlur = 7;
            flow.fillStyle = core; flow.beginPath(); flow.arc(...head, Math.max(1.25, .9 / scale), 0, Math.PI * 2); flow.fill(); flow.shadowBlur = 0;
          }
          flow.restore();
        };
        flowDraw.current(flowTime.current);
      }
    };
    redraw.current = draw;
    draw(); const observer=new ResizeObserver(draw); observer.observe(el);
    window.addEventListener('resize', draw);
    return()=>{
      observer.disconnect(); window.removeEventListener('resize', draw); redraw.current = () => {}; flowDraw.current = () => {};
      if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null;
    };
  }, [values, view, zoom, showDimensions, showOriginal, showSection, showStress, reducedMotion, axial, sectionAngle, amplification, specimen, mode, station]);
  useEffect(() => {
    // 遵循减少动画偏好；离开画布或切到其他主题时停止调度。
    if (!showStress || !flowAllowed || reducedMotion || !Number.isFinite(values.stress) || values.stress === 0) return;
    let request: number | null = null, last = 0, painted = 0, inView = false;
    const tick = (now: number) => {
      if (last) flowTime.current += Math.min((now - last) / 1000, .1);
      last = now;
      if (now - painted >= 32) { flowDraw.current(flowTime.current); painted = now; }
      request = requestAnimationFrame(tick);
    };
    const stop = () => { if (request !== null) cancelAnimationFrame(request); request = null; last = 0; };
    const update = () => {
      if (!inView || document.visibilityState !== 'visible') stop();
      else if (request === null) request = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); update(); }, { threshold: .01 });
    if (flowCanvas.current) observer.observe(flowCanvas.current);
    document.addEventListener('visibilitychange', update);
    return () => { stop(); observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [showStress, flowAllowed, reducedMotion, values.stress]);
  return <section className="lab-surface poisson-figure" ref={figure}>
    <div className="lab-section-head"><div><h3>{title}</h3><p>{subtitle}</p></div>
      <div className="scene-view-controls" aria-label="实验视角">
        {([['3d','3D 视图',Box],['front','正视图',Square],['top','俯视图',PanelsTopLeft]] as const).map(([key,label,Icon])=><button key={key} aria-label={label} title={label} aria-pressed={view===key} onClick={()=>setView(key)}><Icon size={13}/><span>{label}</span></button>)}
        <button aria-label="复位实验视角" title="复位视角" onClick={()=>{setView('3d');setZoom(1);orbit.current=0;redraw.current();}}><RotateCcw size={14}/></button>
        <button aria-label="全屏查看实验" title="全屏查看" onClick={()=>{if(document.fullscreenElement) void document.exitFullscreen(); else void figure.current?.requestFullscreen().catch(()=>{});}}><Maximize2 size={15}/></button>
      </div>
    </div>
    {children}
    {axial && <div className="axial-deformation-bar"><div><span className={coupled ? 'is-coupled' : 'is-reference'}>{specimen?.label ?? '材料响应'}</span><small>{specimen?.transverseRule}</small></div><label>形变显示<select aria-label="形变放大倍率" value={requestedAmplification} disabled={!coupled} onChange={event => setRequestedAmplification(Number(event.target.value))}><option value={1}>应变 ×1</option><option value={10}>放大 ×10</option><option value={80}>放大 ×80</option></select></label></div>}
    {axial && !showSection && <div className="axial-field-toolbar">
      <div role="group" aria-label="三维力学图层">{([['deformation','材料变形'],['traction','截面内力'],['displacement','位移场']] as const).map(([key,label])=><button key={key} aria-pressed={mode===key} disabled={!coupled && key!=='deformation'} onClick={()=>setFieldMode(key)}>{label}</button>)}</div>
      {field && mode!=='deformation' && <label>截面位置<input type="range" aria-label="三维截面位置" min={.05} max={.95} step={.01} value={station} onChange={event=>setStation(Number(event.target.value))}/><output>{(station*values.lengthMm).toFixed(0)} mm</output></label>}
    </div>}
    <div className="poisson-canvas-wrap">
      <div className="scene-legend">{showOriginal ? <span><i className="original-line"/>原始尺寸（未变形）</span> : null}<span><i/>{coupled ? '变形后尺寸' : '材料参考形态'}</span>{showStress && flowAllowed && <><span className={`stress-flow-key ${values.stress < 0 ? 'is-compression' : ''}`}><i /><span className="stress-flow-label">{values.stress === 0 ? '未加载 · 无应力粒子' : `${values.stress > 0 ? '拉应力' : '压应力'} · ${Math.abs(values.stress).toFixed(1)} MPa${reducedMotion ? ' · 静态' : ''}`}</span></span><span className="stress-flow-note">疏密随应力变化 · 非材料流动</span></>}</div>
      {axial && mode==='displacement' && <div className="axial-displacement-key"><span>−uₓ</span><i/><span>+uₓ</span></div>}
      {showDimensions ? <div className="scene-mobile-dimensions"><span>L₀ = {values.lengthMm.toFixed(1)} mm</span><span>{coupled ? `L = ${values.currentLength.toFixed(3)} mm` : 'L 未确定'}</span>{axial ? <span>A₀ = {(values.width**2).toFixed(1)} mm²</span> : <span>h = {values.currentWidth.toFixed(3)} mm</span>}</div> : null}
      <canvas ref={canvas} data-field-mode={axial ? mode : undefined} data-probe-reference-x={axial && field ? (station-.5)*values.lengthMm : undefined} data-crack-opening="not-solved" data-response-status={specimen?.status} data-current-length={coupled ? values.currentLength : undefined} data-current-width={coupled ? values.currentWidth : undefined} data-axial-strain={coupled ? values.strain : undefined} data-display-amplification={amplification} aria-label={`${title}${view==='3d'?'三维':view==='front'?'正视':'俯视'}图：${coupled ? `轴向应变 ${(values.strain*100).toFixed(3)}%，横向应变 ${(values.transverseStrain*100).toFixed(3)}%` : specimen?.label}，应力粒子${showStress && flowAllowed ? reducedMotion ? '静态显示' : '流已开启' : '已关闭'}`}
        onPointerDown={e=>{if(view==='3d'){drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}}
        onPointerMove={e=>{if(drag.current!==null){const delta=e.clientX-drag.current; orbit.current=Math.max(-.6,Math.min(.6,orbit.current+delta*.004)); if(frame.current===null) frame.current=requestAnimationFrame(()=>{frame.current=null;redraw.current();});drag.current=e.clientX;}}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} />
      <canvas ref={flowCanvas} className="stress-flow-canvas" aria-hidden="true" />
      <div className="scene-camera-dock" role="toolbar" aria-label="视图显示控制">
        <button aria-label="缩小试件视图" title="缩小视图" disabled={zoom <= .65} onClick={() => setZoom(z => Math.max(.65, Math.round((z - .1) * 100) / 100))}><ZoomOut size={15} /></button>
        <output aria-label="视图缩放比例">{Math.round(zoom * 100)}%</output>
        <button aria-label="放大试件视图" title="放大视图" disabled={zoom >= 1.45} onClick={() => setZoom(z => Math.min(1.45, Math.round((z + .1) * 100) / 100))}><ZoomIn size={15} /></button>
        <button aria-label="适应画布" title="适应画布" onClick={() => setZoom(1)}><Scan size={15} /></button>
        <span className="camera-dock-divider" />
        <button aria-label="显示尺寸标注" title="尺寸标注" aria-pressed={showDimensions} onClick={() => setShowDimensions(!showDimensions)}><Ruler size={15} /></button>
        <button aria-label="显示原始轮廓" title="原始轮廓" aria-pressed={showOriginal} onClick={() => setShowOriginal(!showOriginal)}><Layers2 size={15} /></button>
        <span className="camera-dock-divider" />
        <button className="stress-flow-toggle" aria-label="显示应力粒子流" disabled={!flowAllowed} title={!flowAllowed ? !coupled ? '参考形态不显示应力粒子' : '当前图层不叠加应力粒子' : showStress ? '关闭应力粒子流' : '开启应力粒子流'} aria-pressed={showStress && flowAllowed} onClick={() => setShowStress(!showStress)}><Waves size={15} /></button>
      </div>
      <div className="scene-caption"><span>{axial ? coupled ? `形变 ×${Number(amplification.toFixed(2))}${amplification < requestedAmplification ? '（共同倍率自动调低）' : ''} · 尺寸为计算值 · 等效方截面 · 长细比示意` : '参考形态 · 不将线弹性估算用于三维变形' : `变形放大 ×${amplification} · 长细比示意`}</span><span>{view==='3d'?'拖动试件旋转视角':'正交投影'}</span></div>
    </div>
    {axial && !showSection && <AxialFieldReadout field={field} mode={mode} station={station} />}
  </section>;
}
