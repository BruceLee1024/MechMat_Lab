import React, { useEffect, useId, useRef, useState } from 'react';

interface Series { label: string; points: [number, number][]; value: string; color: string; unit: string; dashed?: boolean }
// 显示未放大的教学计算结果，当前截面位置与控制滑杆保持一致。
export function StudyResultPlot({ title, xLabel, yLabel, series, markerX }: {
  title: string; xLabel: string; yLabel: string; series: Series[]; markerX: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 300, height: 250 });
  useEffect(() => {
    const el = frame.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  const { width, height } = size, right = width - 12, bottom = height - 36;
  const points = series.flatMap(item => item.points);
  const xmin = Math.min(...points.map(p => p[0])), xmax = Math.max(...points.map(p => p[0]));
  const low = Math.min(0, ...points.map(p => p[1])), high = Math.max(0, ...points.map(p => p[1]));
  const range = high - low || 1, magnitude = 10 ** Math.floor(Math.log10(range));
  const step = [.2, .5, 1, 2].map(v => v * magnitude).find(value => range / value <= 5) ?? magnitude * 2;
  const ymin = Math.floor(low / step) * step, ymax = high === low ? ymin + step * 5 : Math.ceil(high / step) * step;
  const tickCount = Math.round((ymax - ymin) / step);
  const project = ([x, y]: [number, number]): [number, number] => [42 + (x - xmin) / (xmax - xmin || 1) * (right - 42), bottom - (y - ymin) / (ymax - ymin) * (bottom - 28)];
  const label = (value: number, yAxis = false) => Number(value.toFixed(yAxis ? Math.max(0, -Math.floor(Math.log10(step))) : 2)).toString();
  const marker = series[series.length - 1];
  const current = marker.points.find(p => Math.abs(p[0] - markerX) < 1e-8) ?? marker.points[marker.points.length - 1];
  const [mx, my] = project(current);
  return <section className="lab-surface fundamentals-chart study-result-chart" aria-label={title}>
    <div className="lab-section-head"><h3>{title}</h3></div>
    <div className="study-result-plot" ref={frame}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}：${series.map(s => `${s.label} ${s.value} ${s.unit}`).join('，')}`}>
        <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={marker.color} stopOpacity=".14" /><stop offset="1" stopColor={marker.color} stopOpacity=".01" /></linearGradient></defs>
        {Array.from({ length: tickCount + 1 }, (_, i) => {
          const y = ymin + step * i, py = project([0, y])[1];
          return <g key={i}><path d={`M42 ${py}H${right}`} stroke="#7b9bbd25" strokeWidth=".7" /><text x="34" y={py + 3} textAnchor="end">{label(y, true)}</text></g>;
        })}
        {Array.from({ length: 5 }, (_, i) => {
          const x = xmin + (xmax - xmin) * i / 4, px = project([x, 0])[0];
          return <g key={i}><path d={`M${px} 28V${bottom}`} stroke="#7b9bbd10" strokeWidth=".7" /><text x={px} y={bottom + 17} textAnchor="middle">{label(x)}</text></g>;
        })}
        <text x="42" y="13" className="study-plot-axis">{yLabel}</text><text x={right} y={height - 3} textAnchor="end" className="study-plot-axis">{xLabel}</text>
        <polygon points={[...marker.points.map(project), project([xmax, 0]), project([xmin, 0])].map(p => p.join(',')).join(' ')} fill={`url(#${id}-area)`} />
        {series.map(item => <polyline key={item.label} points={item.points.map(project).map(p => p.join(',')).join(' ')} fill="none" stroke={item.color} strokeWidth="1.8" strokeDasharray={item.dashed ? '4 3' : undefined} />)}
        <path d={`M${mx} 28V${bottom}`} stroke="#7eacc666" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx={mx} cy={my} r="9" fill={marker.color} opacity=".1" /><circle cx={mx} cy={my} r="4" fill="#0c1b2c" stroke={marker.color} strokeWidth="1.6" />
      </svg>
    </div>
    <div className="plot-series-readings">{series.map(item => <div key={item.label}><span><i style={{ borderColor: item.color, borderTopStyle: item.dashed ? 'dashed' : 'solid' }} />{item.label}</span><output style={{ color: item.color }}>{item.value}<small>{item.unit}</small></output></div>)}</div>
  </section>;
}
