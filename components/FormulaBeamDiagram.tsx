import React from 'react';
import {BeamSupportSymbol} from './BeamSupportSymbol';
import type {FormulaBeamSketch} from '../mechanics/formulaBeamSketch';
import type {SectionSide} from '../mechanics/formulaArchSketch';

const fmt=(n:number)=>Number(n.toPrecision(4)).toString();
const structure='#bed1df',load='#ee9fa8',ordinate='#8dc6ee',muted='#809aaf';

/** 教材式梁简图：三种视图共用物理坐标，剪力正值向上，弯矩画在受拉侧。 */
export function FormulaBeamDiagram({sketch,mode,probe,side,showReactions}:{sketch:FormulaBeamSketch;mode:'fbd'|'sfd'|'bmd';probe?:number;side?:SectionSide;showReactions?:boolean}){
 const x=(position:number)=>64+position/sketch.length*512;
 const beamY=mode==='fbd'?142:38;
 const valueAt=mode==='sfd'?sketch.shearAt:sketch.momentAt;
 // 弯矩驻点由 V=0 求出，数值标签不依赖曲线采样恰好命中极值。
 const critical=mode==='bmd'?sketch.breaks.flatMap((a,i)=>{
  const b=sketch.breaks[i+1];if(b===undefined||sketch.shearAt(a,'right')*sketch.shearAt(b,'left')>=0)return [];
  let lo=a,hi=b;const sign=sketch.shearAt(lo,'right');
  for(let j=0;j<45;j++){const mid=(lo+hi)/2;if(sketch.shearAt(mid)*sign>0)lo=mid;else hi=mid;}
  return [(lo+hi)/2];
 }):[];
 const samples=sketch.breaks.flatMap((position,i)=>{
  const next=sketch.breaks[i+1];
  return [{position,value:valueAt(position,'left')},{position,value:valueAt(position,'right')},...(next===undefined?[]:Array.from({length:24},(_,j)=>{const p=position+(next-position)*(j+1)/25;return {position:p,value:valueAt(p)};}))];
 });
 const peak=Math.max(...samples.map(s=>Math.abs(s.value)),...critical.map(p=>Math.abs(valueAt(p))));
 const axisY=166;
 const y=(value:number)=>axisY+(mode==='sfd'?-1:1)*value/(peak||1)*61;
 const path=samples.map((s,i)=>`${i?'L':'M'}${x(s.position)},${y(s.value)}`).join(' ');
 const freeEnd=!sketch.supports.some(s=>s.x===sketch.length);
 const dimensions=sketch.dimensions;
 const arrow=(px:number,from:number,to:number,key:string)=><g key={key} stroke={load} strokeWidth="1.6"><line x1={px} y1={from} x2={px} y2={to-7}/><path d={`M${px-3.5},${to-8}L${px},${to}L${px+3.5},${to-8}`} fill={load} stroke="none"/></g>;
 const stations=Array.from(new Set([0,sketch.length,...sketch.supports.map(s=>s.x),...sketch.points.map(s=>s.x),...sketch.distributed.flatMap(s=>[s.from,s.to]),...critical])).sort((a,b)=>a-b);
 const keyValues=mode==='fbd'?[]:stations.flatMap(position=>{
  const left=valueAt(position,'left'),right=valueAt(position,'right');
  const values=Math.abs(left-right)>Math.max(peak,1)*1e-8?[left,right]:[right];
  return values.filter(v=>Math.abs(v)>Math.max(peak,1)*1e-8).map((value,i)=>({position,value,i}));
 });
 return <svg className="fw-beam-textbook" viewBox="0 0 640 326" role="img" aria-label={`${mode==='fbd'?'教材式梁受力图':mode==='sfd'?'剪力图，正值向上':'弯矩图，正值向下画在受拉侧'}，总长 ${fmt(sketch.length)} m`}>
  <g fontSize="14" fontFamily="inherit" fill={structure}>
   <line x1={x(0)} y1={beamY} x2={x(sketch.length)} y2={beamY} stroke={structure} strokeWidth={mode==='fbd'?3:2}/>
   {sketch.supports.map(s=><g key={s.name} data-support={s.name} data-position={s.x}>
    {s.kind==='fixed'?<g stroke={structure} strokeWidth="1.4"><line x1={x(s.x)} y1={beamY-22} x2={x(s.x)} y2={beamY+25}/>{Array.from({length:7},(_,i)=><line key={i} x1={x(s.x)} y1={beamY-19+i*7} x2={x(s.x)+(s.x===0?-9:9)} y2={beamY-12+i*7}/>)}</g>:<BeamSupportSymbol kind={s.kind} x={x(s.x)} y={beamY} size={1.05}/>}
    <text x={x(s.x)+(s.x===sketch.length?24:-25)} y={beamY+19} textAnchor="middle" fontStyle="italic">{s.name}</text>
   </g>)}
   {/* 中间支点不切断梁轴线，避免把连续支承误读为内部铰。 */}
   {sketch.supports.filter(s=>s.x>0&&s.x<sketch.length).map(s=><line key={s.name} x1={x(s.x)-5} x2={x(s.x)+5} y1={beamY} y2={beamY} stroke={structure} strokeWidth={mode==='fbd'?3:2}/>)}
   {freeEnd&&<text x={x(sketch.length)+15} y={beamY+19} fontStyle="italic">{sketch.supports.length===1?'B':'C'}</text>}
   {mode==='fbd'?<>
    {sketch.distributed.map((d,i)=>{
     if(d.to<=d.from||Math.max(d.start,d.end)===0)return null;
     const max=Math.max(d.start,d.end),count=Math.max(2,Math.ceil((x(d.to)-x(d.from))/34));
     const top=(t:number)=>beamY-9-65*(d.start+(d.end-d.start)*t)/max;
     return <g key={i} data-load="distributed" data-from={d.from} data-to={d.to}>
      <path d={`M${x(d.from)},${top(0)}L${x(d.to)},${top(1)}`} fill="none" stroke={load} strokeWidth="1.5"/>
      {Array.from({length:count+1},(_,j)=>{const t=j/count;return (d.start+(d.end-d.start)*t)>max*.025?arrow(x(d.from+(d.to-d.from)*t),top(t),beamY-2,String(j)):null;})}
      <text x={(x(d.from)+x(d.to))/2} y={beamY-88} textAnchor="middle" fill={load}><tspan fontStyle="italic">{d.label}</tspan><tspan fontSize="12"> = {fmt(max)} kN/m</tspan></text>
     </g>;
    })}
    {sketch.points.filter(p=>p.value!==0).map((p,i)=><g key={i} data-load="point">{arrow(x(p.x),beamY-75,beamY-2,'force')}<text x={x(p.x)+(p.x>sketch.length*.8?-9:9)} textAnchor={p.x>sketch.length*.8?'end':'start'} y={beamY-79} fill={load}><tspan fontStyle="italic">{p.label}</tspan><tspan fontSize="12"> = {fmt(p.value)} kN</tspan></text></g>)}
    {sketch.couples.filter(p=>p.value!==0).map((p,i)=><g key={i} stroke={load} fill="none" strokeWidth="1.6" transform={`translate(${x(p.x)} ${beamY})`}><path d="M-20,8 A23,23 0 1 1 21,9"/><path d="M22,0L21,10L30,5"/><text x="0" y="-41" textAnchor="middle" fill={load} stroke="none"><tspan fontStyle="italic">M</tspan><tspan fontSize="12"> = {fmt(p.value)} kN·m</tspan></text></g>)}
   </>:<>
    <line x1={x(0)-12} y1={axisY} x2={x(sketch.length)+15} y2={axisY} stroke={muted} strokeWidth=".8"/>
    <text x="20" y={axisY+5} fill={muted}>0</text>
    <text x="24" y="101" fill={ordinate} fontStyle="italic">{mode==='sfd'?'V':'M'}</text>
    <text x="24" y="118" fill={muted} fontSize="9">{mode==='sfd'?'kN':'kN·m'}</text>
    <path d={`${path}L${x(sketch.length)},${axisY}L${x(0)},${axisY}Z`} fill={ordinate} fillOpacity=".045" stroke="none"/>
    {Array.from({length:31},(_,i)=>{const p=sketch.length*i/30;return <line key={i} x1={x(p)} x2={x(p)} y1={axisY} y2={y(valueAt(p))} stroke={ordinate} strokeOpacity=".26" strokeWidth=".75"/>;})}
    <path d={path} fill="none" stroke={ordinate} strokeWidth="1.8" strokeLinejoin="round" data-field={mode}/>
    {keyValues.map((s,i)=><g key={i}><circle cx={x(s.position)} cy={y(s.value)} r="2.3" fill={ordinate}/><text x={x(s.position)+(s.position===0?5:s.position===sketch.length?-5:s.i===0?-6:6)} y={y(s.value)+(s.value*(mode==='sfd'?-1:1)<0?-9:17)} textAnchor={s.position===sketch.length||s.position>0&&s.i===0?'end':'start'} fill={ordinate} fontSize="12">{s.value>0?'+':''}{fmt(s.value)}</text></g>)}
   </>}
   {mode==='fbd'&&showReactions&&sketch.supports.filter(s=>s.reaction!==0).map(s=>{
    const px=x(s.x)+(s.x===sketch.length?29:-29),bottom=beamY+61,top=beamY+7,to=s.reaction>0?top:bottom,from=s.reaction>0?bottom:top,dir=s.reaction>0?-1:1;
    return <g key={s.name} stroke="#6ce0c4" strokeWidth="1.4" data-reaction={s.name}><line x1={px} y1={from} x2={px} y2={to-dir*7}/><path d={`M${px-3},${to-dir*7}L${px},${to}L${px+3},${to-dir*7}`} fill="#6ce0c4"/></g>;
   })}
   {mode==='fbd'&&showReactions&&sketch.supports.filter(s=>s.clockwiseMoment!==0).map(s=>{
    const dir=Math.sign(s.clockwiseMoment),cx=x(s.x)+(s.x===0?-19:19),cy=beamY-15,start=Math.PI*.85,end=start+dir*Math.PI*1.5;
    const points=Array.from({length:31},(_,i)=>{const a=start+(end-start)*i/30;return `${cx+15*Math.cos(a)},${cy+15*Math.sin(a)}`;}).join(' ');
    const ex=cx+15*Math.cos(end),ey=cy+15*Math.sin(end),tx=-Math.sin(end)*dir,ty=Math.cos(end)*dir;
    return <g key={s.name} stroke="#6ce0c4" strokeWidth="1.3" fill="none"><polyline points={points}/><path d={`M${ex-6*tx-3*ty},${ey-6*ty+3*tx}L${ex},${ey}L${ex-6*tx+3*ty},${ey-6*ty-3*tx}`}/><text x={cx} y={cy-23} textAnchor="middle" fill="#6ce0c4" stroke="none" fontSize="12">M<tspan fontSize="9">{s.name}</tspan></text></g>;
   })}
   {probe!==undefined&&<g stroke="#6ce0c4" fill="#091522" data-probe-position={probe}><line x1={x(probe)} x2={x(probe)} y1={mode==='fbd'?beamY-24:beamY+6} y2={mode==='fbd'?beamY+30:y(valueAt(probe,side))} strokeDasharray="3 4" strokeWidth="1"/><circle cx={x(probe)} cy={beamY} r="3" strokeWidth="1.5"/>{mode!=='fbd'&&<circle cx={x(probe)} cy={y(valueAt(probe,side))} r="3.5" strokeWidth="1.5"/>}</g>}
   {dimensions.map((d,i)=>{
    const a=x(d.from),b=x(d.to),dy=mode==='fbd'?226+d.row*42:259+d.row*37;
    return <g key={i} stroke={muted} strokeWidth=".8" data-dimension={d.label}>
     <path d={`M${a},${dy-12}V${dy+6}M${b},${dy-12}V${dy+6}M${a},${dy}H${b}`} fill="none"/>
     <path d={`M${a+6},${dy-2}L${a},${dy}L${a+6},${dy+2}M${b-6},${dy-2}L${b},${dy}L${b-6},${dy+2}`} fill="none"/>
     {b-a>48?<text x={(a+b)/2} y={dy+20} textAnchor="middle" fill={structure} stroke="none" fontSize="13">{d.label} = {fmt(d.to-d.from)} m</text>:<title>{d.label} = {fmt(d.to-d.from)} m</title>}
    </g>;
   })}
  </g>
 </svg>;
}
