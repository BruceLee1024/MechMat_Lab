import React, { useEffect, useId, useRef, useState } from 'react';

/** 端部等大反向轴力，无中间集中力或分布轴向荷载，故 N(x)=F。 */
export function AxialForceDiagram({ force, lengthMm, failureTeaching = false }: {
  force: number; lengthMm: number; failureTeaching?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [failureTeaching]);
  const forceKN = force / 1000;
  const scaleKN = Math.max(10, Math.ceil(Math.abs(forceKN) / 10) * 10);
  const left = 37, right = Math.max(left + 30, width - 12);
  const baseline = force >= 0 ? 72 : 23;
  const ordinate = baseline - forceKN / scaleKN * 49;
  const format = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  if (failureTeaching) return <section className="axial-force-diagram axial-force-unavailable" aria-label="轴力图超出模型范围">
    <header><h3>轴力图 <span>N(x)</span></h3><span>未求解</span></header>
    <div><strong>无有效静力解</strong><p>试加载 {forceKN.toFixed(2)} kN 已超出材料教学曲线。当前模型不能给出破坏后的贯通轴力，也不能据此认定承载力为零。</p></div>
  </section>;
  return <section className="axial-force-diagram" aria-label="轴力图">
    <header><h3>轴力图 <span>N(x)</span></h3><output>{force > 0 ? '+' : ''}{forceKN.toFixed(2)} <small>kN</small></output></header>
    <div className="axial-force-plot" ref={frame}>
      <svg viewBox={`0 0 ${width} 100`} role="img" aria-label={`轴力图：从 0 至 ${lengthMm} mm，轴力 ${forceKN.toFixed(3)} kN 沿杆长恒定，拉力为正`}>
        <defs><linearGradient id={`${id}-force-area`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#85dbc9" stopOpacity=".23" /><stop offset="1" stopColor="#85dbc9" stopOpacity=".04" /></linearGradient></defs>
        <text x="0" y="12">N / kN</text><text x={left - 8} y={baseline + 3} textAnchor="end">0</text>
        <path d={`M${left} ${baseline}H${right}`} stroke="#718da777" strokeWidth="1" />
        <path d={`M${left} 20V76`} stroke="#718da733" strokeWidth="1" />
        {[0, .5, 1].map(ratio => {
          const x = left + (right-left) * ratio;
          return <g key={ratio}><path d={`M${x} ${baseline-2}V${baseline+3}`} stroke="#718da766" /><text x={x} y="89" textAnchor={ratio === 0 ? 'start' : ratio === 1 ? 'end' : 'middle'}>{format(lengthMm*ratio)}</text></g>;
        })}
        <text x={right} y="12" textAnchor="end">x / mm</text>
        {force !== 0 && <>
          <path d={`M${left} ${ordinate}H${right}`} stroke="#718da733" strokeDasharray="3 4" />
          <text x={left-8} y={ordinate+3} textAnchor="end">{format(forceKN)}</text>
          <path d={`M${left} ${baseline}V${ordinate}H${right}V${baseline}Z`} fill={`url(#${id}-force-area)`} />
        </>}
        <path d={`M${left} ${baseline}V${ordinate}H${right}V${baseline}`} stroke="#8ee1cd" strokeWidth="1.6" fill="none" />
      </svg>
    </div>
    <p>N(x) = F · 沿杆长恒定 · 拉力为正</p>
  </section>;
}
