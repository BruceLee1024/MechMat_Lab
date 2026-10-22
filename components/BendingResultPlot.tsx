import React, { useId, useState } from 'react';
import { bendingStation, maximumBendingDeflection, type BendingField } from '../mechanics/bendingField';

export function BendingResultPlot({field}:{field:BendingField}) {
  const [type,setType]=useState<'moment'|'shear'|'deflection'>('moment'),id=useId().replace(/:/g,'');
  const peak=maximumBendingDeflection(field),a=field.positionMm,L=field.lengthMm;
  const samples=Array.from(new Set([...Array.from({length:81},(_,i)=>i*L/80),a,peak.xMm])).sort((x,y)=>x-y).map(x=>bendingStation(field,x));
  const points=samples.flatMap(p=>type==='shear'&&p.xMm===a&&a>0&&a<L?[[p.xMm,p.shearLeft/1000],[p.xMm,p.shearRight/1000]]:[[p.xMm,type==='moment'?p.moment/1e6:type==='shear'?(p.xMm===L?p.shearLeft:p.shearRight)/1000:p.deflection]]);
  const maximum=Math.max(...points.map(p=>Math.abs(p[1])),1e-9),x=(v:number)=>35+v/L*230;
  const y=(v:number)=>90+(type==='deflection'?1:-1)*v/maximum*49;
  const path=points.map(([px,py],i)=>`${i?'L':'M'}${x(px)},${y(py)}`).join(' ');
  const title={moment:'弯矩分布',shear:'剪力分布',deflection:'挠曲线'}[type],unit=type==='moment'?'kN·m':type==='shear'?'kN':'mm';
  const format=(value:number)=>Math.abs(value)>=10000?value.toExponential(1):value.toFixed(type==='deflection'?3:2);
  const zero=field.load===0||a===0||a===L;
  const axisMax=zero?1:maximum;
  return <section className="bending-result-plot" aria-label="梁内力与变形图表">
    <div className="axial-chart-switch" role="group" aria-label="切换梁结果图表">{([['moment','弯矩图'],['shear','剪力图'],['deflection','挠度图']] as const).map(([key,label])=><button key={key} aria-pressed={type===key} onClick={()=>setType(key)}>{label}</button>)}</div>
    <header><h3>{title}</h3><span>{unit}</span></header>
    <svg viewBox="0 0 285 166" role="img" aria-label={`${title}，载荷 ${(field.load/1000).toFixed(2)} kN，位置 ${(a/1000).toFixed(2)} m，最大绝对值 ${(zero?0:maximum).toFixed(3)} ${unit}`}>
      <defs><linearGradient id={`beam-plot-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#85c9ff" stopOpacity=".2"/><stop offset="1" stopColor="#85c9ff" stopOpacity=".025"/></linearGradient><clipPath id={`beam-clip-${id}`}><rect x="34" y="22" width="232" height="121"/></clipPath></defs>
      {[-1,0,1].map(v=><g key={v}><path d={`M35 ${90-v*49}H265`} stroke={v===0?'#6d899e':'#2d4054'} strokeWidth={v===0?1:.6}/><text x="27" y={94-v*49} textAnchor="end">{format(v*axisMax*(type==='deflection'?-1:1))}</text></g>)}
      {[0,.25,.5,.75,1].map(v=><g key={v}><path d={`M${x(L*v)} 30V143`} stroke="#2b415355"/><text x={x(L*v)} y="157" textAnchor="middle">{(L*v/1000).toFixed(1)}</text></g>)}
      <path d={`M${x(a)} 24V143`} stroke="#87bdb55c" strokeDasharray="3 4"/>
      <g clipPath={`url(#beam-clip-${id})`}><path d={`${path}L265 90H35Z`} fill={`url(#beam-plot-${id})`}/><path d={path} stroke={type==='shear'?'#8fd9c8':'#91c7ff'} strokeWidth="1.7" fill="none"/>
        {type==='deflection'&&<circle cx={x(peak.xMm)} cy={y(peak.deflection)} r="3.2" fill="#0f2235" stroke="#9ce5d4" strokeWidth="1.5"/>}
      </g><text x="265" y="17" textAnchor="end">a = {(a/1000).toFixed(2)} m</text><text x="282" y="157" textAnchor="end">m</text>
    </svg>
    <p>{a===0||a===L?'载荷直接作用于支座，梁跨内剪力与弯矩均为零。':type==='moment'?'正弯矩：上缘受压、下缘受拉；峰值位于加载截面。':type==='shear'?'集中载荷处剪力发生跳跃，跳跃量等于 P；纵轴随当前内力取值。':`挠度向下为正；|w|max 位于 ${(peak.xMm/1000).toFixed(3)} m，偏心加载时不等于加载点。`}</p>
  </section>;
}
