import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, RotateCcw, X } from 'lucide-react';
import { calculateFundamentals } from '../mechanics/fundamentals';
import { SimulationState } from '../types';

// 指针取值只更新图表与读数，不改变实验载荷，也不按像素重绘 React 树。
function StressStrainPlot({ state }: { state: SimulationState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const readingKind = useRef<HTMLSpanElement>(null);
  const strainReading = useRef<HTMLOutputElement>(null);
  const engineeringReading = useRef<HTMLOutputElement>(null);
  const trueReading = useRef<HTMLOutputElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const selected = useRef<number | null>(null);
  const pinned = useRef(false);
  const frame = useRef<number | null>(null);
  const geometry = useRef({ left: 40, right: 280, maxStrain: .002, current: 0 });
  const drawRef = useRef<() => void>(() => {});
  const redraw = () => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => { frame.current = null; drawRef.current(); });
  };
  const reset = () => { selected.current = null; pinned.current = false; redraw(); };
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    selected.current = null; pinned.current = false;
    const current = calculateFundamentals(state);
    const draw = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      if (w < 1 || h < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * ratio); el.height = Math.round(h * ratio);
      const ctx = el.getContext('2d');
      if (!ctx || !current.ok) return;
      ctx.scale(ratio, ratio);
      const palette = getComputedStyle(el);
      const engineeringColor = palette.getPropertyValue('--plot-engineering').trim() || '#66adff';
      const trueColor = palette.getPropertyValue('--plot-true').trim() || '#cfa4ae';
      const maxStrain = Math.max(.002, Math.min(.01, current.values.strain * 1.2));
      const range = state.bendModulus * 1000 * maxStrain * 1.12;
      const magnitude = 10 ** Math.floor(Math.log10(range));
      const maxStress = Math.ceil(range / magnitude) * magnitude;
      const left = w < 400 ? 35 : 48, right = w - 14, top = 28, bottom = h - 33;
      geometry.current = { left, right, maxStrain, current: current.values.strain };
      const x = (e: number) => left + e / maxStrain * (right - left);
      const y = (s: number) => bottom - s / maxStress * (bottom - top);
      const text = (value: string, px: number, py: number, color = '#91a9c5', align: CanvasTextAlign = 'center', size = 11) => {
        ctx.font = `${size}px ui-monospace, "SFMono-Regular", Consolas, monospace`;
        ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, px, py);
      };
      // 单位靠近坐标端点，横向网格承担读数，减少封闭方格的视觉重量。
      text('σ / MPa', left, 13, '#a9bfd9', 'left');
      text('ε / %', right, h - 3, '#a9bfd9', 'right');
      for (let i = 0; i <= 5; i++) {
        const yy = bottom - i * (bottom - top) / 5;
        ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(right, yy);
        ctx.strokeStyle = i === 0 ? '#40556d88' : '#7b9bbd1d'; ctx.lineWidth = 1; ctx.stroke();
        text((i * maxStress / 5).toFixed(0), left - 9, yy + 3, '#8ca3bd', 'right');
      }
      for (let i = 0; i <= 4; i++) {
        const xx = left + i * (right - left) / 4;
        if (i > 0 && i < 4) {
          ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, bottom);
          ctx.strokeStyle = '#7b9bbd0c'; ctx.stroke();
        }
        text((i * maxStrain / 4 * 100).toFixed(2), xx, bottom + 17);
      }
      ctx.save(); ctx.beginPath(); ctx.rect(left - 1, top - 1, right - left + 2, bottom - top + 2); ctx.clip();
      // 面积与曲线都来自同一组真实线弹性数据，不放大两条曲线间的差异。
      const fill = ctx.createLinearGradient(0, top, 0, bottom);
      fill.addColorStop(0, '#4b9cff1c'); fill.addColorStop(1, '#4b9cff02');
      ctx.beginPath(); ctx.moveTo(x(0), bottom);
      for (let i = 0; i <= 100; i++) { const e = i / 100 * maxStrain; ctx.lineTo(x(e), y(e * state.bendModulus * 1000)); }
      ctx.lineTo(right, bottom); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      for (const truth of [false, true]) {
        ctx.beginPath(); ctx.setLineDash(truth ? [5, 5] : []);
        for (let i = 0; i <= 100; i++) {
          const e = i / 100 * maxStrain, engineering = e * state.bendModulus * 1000;
          const stress = truth ? engineering / (1 - state.poissonRatio * e) ** 2 : engineering;
          if (i) ctx.lineTo(x(e), y(stress)); else ctx.moveTo(x(e), y(stress));
        }
        ctx.strokeStyle = truth ? trueColor : engineeringColor; ctx.lineWidth = truth ? 1.5 : 2;
        ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
      }
      const inspecting = selected.current !== null;
      const strain = selected.current ?? current.values.strain;
      const engineering = strain * state.bendModulus * 1000;
      const truth = engineering / (1 - state.poissonRatio * strain) ** 2;
      const cx = x(strain), cy = y(engineering);
      if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
        ctx.beginPath(); ctx.setLineDash([2, 4]); ctx.moveTo(cx, bottom); ctx.lineTo(cx, top);
        if (inspecting) { ctx.moveTo(left, cy); ctx.lineTo(right, cy); }
        ctx.strokeStyle = '#8fbeec55'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = '#72b6ff16'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = '#0d1b2b'; ctx.fill();
        ctx.strokeStyle = '#add5ff'; ctx.lineWidth = 1.7; ctx.stroke();
      }
      ctx.restore();
      if (readingKind.current) readingKind.current.textContent = inspecting ? pinned.current ? '固定取值' : '曲线取值' : '当前加载';
      if (strainReading.current) strainReading.current.textContent = `${(strain * 100).toFixed(3)}%`;
      if (engineeringReading.current) engineeringReading.current.textContent = engineering.toFixed(1);
      if (trueReading.current) trueReading.current.textContent = truth.toFixed(3);
      if (resetButton.current) resetButton.current.hidden = !inspecting;
      el.setAttribute('aria-valuemax', String(maxStrain * 100));
      el.setAttribute('aria-valuenow', String(Number((strain * 100).toFixed(6))));
      el.setAttribute('aria-valuetext', `应变 ${(strain * 100).toFixed(3)}%，工程应力 ${engineering.toFixed(1)} MPa，真应力 ${truth.toFixed(3)} MPa`);
    };
    drawRef.current = draw; draw();
    const observer = new ResizeObserver(draw); observer.observe(el);
    return () => { observer.disconnect(); drawRef.current = () => {}; if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; };
  }, [state]);
  const inspect = (event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const { left, right, maxStrain } = geometry.current;
    const px = event.clientX - event.currentTarget.getBoundingClientRect().left;
    selected.current = Math.max(0, Math.min(maxStrain, (px - left) / (right - left) * maxStrain));
    redraw();
  };
  return <div className="stress-strain-plot">
    <div className="plot-reading"><span ref={readingKind}>当前加载</span><span className="plot-strain">ε <output ref={strainReading}>—</output></span><button ref={resetButton} hidden aria-label="返回当前加载读数" title="返回当前加载" onClick={() => { reset(); canvas.current?.focus(); }}><RotateCcw size={12} /></button></div>
    <div className="plot-canvas-frame"><canvas ref={canvas} tabIndex={0} role="slider" aria-label="曲线取值，仅查看不改变载荷" aria-valuemin={0} aria-valuemax={.2} aria-valuenow={0} aria-description="移动指针查看，点击固定读数；左右方向键微调，Escape 返回当前加载读数。"
      onPointerMove={event => { if ((event.pointerType === 'mouse' && !pinned.current) || event.buttons) inspect(event); }} onPointerDown={event => { pinned.current = true; inspect(event); }}
      onClick={event => { pinned.current = true; inspect(event); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !pinned.current) reset(); }} onPointerCancel={reset}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
        if (event.key === 'Escape') {
          if (selected.current !== null) { event.preventDefault(); reset(); }
          return;
        }
        event.preventDefault();
        const { maxStrain, current } = geometry.current;
        if (event.key === 'Home') selected.current = 0;
        else if (event.key === 'End') selected.current = maxStrain;
        else selected.current = Math.max(0, Math.min(maxStrain, (selected.current ?? current) + (event.key === 'ArrowRight' ? 1 : -1) * maxStrain / 200));
        pinned.current = true; redraw();
      }} /></div>
    <div className="plot-series-readings">
      <div><span><i className="engineering-series" />工程应力</span><span><output ref={engineeringReading}>—</output><small>MPa</small></span></div>
      <div><span><i className="true-series" />真应力</span><span><output ref={trueReading}>—</output><small>MPa</small></span></div>
    </div>
  </div>;
}

export function FundamentalsChart({ state }: { state: SimulationState }) {
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const current = calculateFundamentals(state);
  useEffect(() => {
    if (expanded && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!expanded && dialog.current?.open) dialog.current.close();
  }, [expanded]);
  return <>
    <section className="lab-surface fundamentals-chart">
      <div className="lab-section-head"><div className="chart-heading-row"><h3>应力–应变曲线</h3>
        <button className="chart-expand-action" aria-label="展开应力应变曲线" title="展开曲线" disabled={!current.ok} onClick={() => setExpanded(true)}><Expand size={14} /></button>
      </div></div>
      {current.ok ? <StressStrainPlot state={state} /> : <p className="chart-unavailable">参数有效后显示曲线。</p>}
    </section>
    {createPortal(<dialog ref={dialog} className="chart-focus-dialog" aria-labelledby={titleId} onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)}
      onClick={event => { if (event.target === event.currentTarget) setExpanded(false); }}>
      <div className="chart-focus-content">
        <header><div><h2 id={titleId}>应力与应变</h2><p>小变形线弹性模型，真应力采用当前截面积计算。</p></div>
          <button className="tool-button" aria-label="关闭曲线大图" onClick={() => setExpanded(false)} autoFocus><X size={18} /></button>
        </header>
        <div className="chart-focus-canvas">{expanded ? <StressStrainPlot state={state} /> : null}</div>
        {current.ok ? <footer><span>试件应变 <strong>{(current.values.strain * 100).toFixed(3)}%</strong></span><span>弹性模量 <strong>{state.bendModulus} GPa</strong></span><span>泊松比 <strong>{state.poissonRatio}</strong></span></footer> : null}
      </div>
    </dialog>, document.body)}
  </>;
}
