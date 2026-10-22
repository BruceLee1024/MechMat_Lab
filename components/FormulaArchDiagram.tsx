import React from 'react';
import {BeamSupportSymbol} from './BeamSupportSymbol';
import type {FormulaArchSketch,SectionSide} from '../mechanics/formulaArchSketch';

const fmt=(n:number)=>Number(n.toPrecision(4)).toString();
const ink='#bed1df',muted='#809aaf',load='#ee9fa8',probeInk='#6ce0c4';
export type ArchDiagramMode='fbd'|'sfd'|'bmd'|'nfd';

/** 拱轴以同一比例拟合，内力沿真实局部法线作图；正弯矩置于拱内受拉侧。 */
export function FormulaArchDiagram({sketch,mode,probe,side,showReactions}:{sketch:FormulaArchSketch;mode:ArchDiagramMode;probe:number;side:SectionSide;showReactions:boolean}){
 const scale=Math.min(448/sketch.length,124/sketch.rise),base=226;
 const x=(p:number)=>320+(p-sketch.length/2)*scale;
 const point=(p:number)=>({x:x(p),y:base-sketch.sectionAt(p).height*scale});
 const field=(p:number,s:SectionSide='right')=>{const v=sketch.sectionAt(p,s);return mode==='sfd'?v.shear:mode==='nfd'?v.normal:v.moment;};
 const samples=sketch.breaks.flatMap((p,i)=>{
  const b=sketch.breaks[i+1];
  return [{p,side:'left' as const},{p,side:'right' as const},...(b===undefined?[]:Array.from({length:19},(_,j)=>({p:p+(b-p)*(j+1)/20,side:'right' as const})))];
 });
 const peak=Math.max(...samples.map(s=>Math.abs(field(s.p,s.side))));
 const offset=(p:number,s:SectionSide='right')=>{
  const v=sketch.sectionAt(p,s),b=point(p),norm=Math.hypot(1,v.slope),a=field(p,s)/(peak||1)*43*(mode==='bmd'?1:-1);
  return {x:b.x+a*v.slope/norm,y:b.y+a/norm};
 };
 const archPath=Array.from({length:81},(_,i)=>{const b=point(sketch.length*i/80);return `${i?'L':'M'}${b.x},${b.y}`;}).join(' ');
 const curve=samples.map((s,i)=>{const b=offset(s.p,s.side);return `${i?'L':'M'}${b.x},${b.y}`;}).join(' ');
 const color=mode==='bmd'?'#c6b3eb':mode==='nfd'?'#6edbc4':'#8dc6ee';
 const arrow=(from:[number,number],to:[number,number],color:string,key:string)=>{
  const dx=to[0]-from[0],dy=to[1]-from[1],a=Math.atan2(dy,dx),c=Math.cos(a),s=Math.sin(a);
  return <g key={key} stroke={color} strokeWidth="1.45"><line x1={from[0]} y1={from[1]} x2={to[0]-6*c} y2={to[1]-6*s}/><path d={`M${to[0]},${to[1]}L${to[0]-7*c+3*s},${to[1]-7*s-3*c}L${to[0]-7*c-3*s},${to[1]-7*s+3*c}Z`} fill={color} stroke="none"/></g>;
 };
 const crown=point(sketch.length/2),isFbd=mode==='fbd',selected=point(probe),selectedTip=offset(probe,side);
 const loadCount=sketch.distributed?Math.max(3,Math.ceil((x(sketch.distributed.to)-x(sketch.distributed.from))/31)):0;
 const named=[{p:0,name:'A'},{p:sketch.length/2,name:'B'},{p:sketch.length,name:'C'}];
 const stations=mode==='bmd'?[sketch.length/4,3*sketch.length/4]:[0,sketch.length/2,sketch.length];
 return <svg className="fw-arch-textbook" viewBox="0 0 640 354" role="img" aria-label={`教材式${sketch.kind==='three-hinged'?'三铰拱':sketch.kind==='two-hinged'?'两铰拱':'无铰拱'}${isFbd?'受力图':mode==='sfd'?'局部剪力图':mode==='bmd'?'弯矩图':'轴力图'}，跨度 ${fmt(sketch.length)} m，矢高 ${fmt(sketch.rise)} m`}>
  <g fill={ink} fontSize="13" fontFamily="inherit">
   <path d={archPath} stroke={ink} strokeWidth="2.2" fill="none" data-arch-axis="true"/>
   <line x1={x(0)} y1={base} x2={x(sketch.length)} y2={base} stroke={muted} strokeWidth=".7" strokeDasharray="5 5"/>
   {named.filter(n=>n.name!=='B').map(n=><g key={n.name} data-support={n.name} data-kind={sketch.kind==='fixed'?'fixed':'pinned'}>
    {sketch.kind==='fixed'?<g stroke={ink} strokeWidth="1.2"><path d={`M${x(n.p)-17},${base+3}H${x(n.p)+17}`} fill="none"/>{Array.from({length:6},(_,i)=><line key={i} x1={x(n.p)-15+i*6} y1={base+3} x2={x(n.p)-21+i*6} y2={base+12}/>)}</g>:<BeamSupportSymbol kind="pinned" x={x(n.p)} y={base} size={.8}/>}
    <text x={x(n.p)+(n.name==='A'?-25:25)} y={base+18} fontStyle="italic">{n.name}</text>
   </g>)}
   {sketch.kind==='three-hinged'&&<circle cx={crown.x} cy={crown.y} r="3.2" fill="#091522" stroke={ink} strokeWidth="1.2" data-hinge="crown"/>}
   <text x={crown.x+9} y={crown.y-9} fontStyle="italic">B</text>
   {isFbd?<>
    {sketch.distributed&&sketch.distributed.value>0&&<g data-load="distributed" data-from={sketch.distributed.from} data-to={sketch.distributed.to}>
     <line x1={x(sketch.distributed.from)} y1={crown.y-42} x2={x(sketch.distributed.to)} y2={crown.y-42} stroke={load} strokeWidth="1.4"/>
     {Array.from({length:loadCount+1},(_,i)=>{const p=sketch.distributed!.from+(sketch.distributed!.to-sketch.distributed!.from)*i/loadCount,b=point(p);return arrow([b.x,crown.y-42],[b.x,b.y-4],load,String(i));})}
     <text x={(x(sketch.distributed.from)+x(sketch.distributed.to))/2} y={crown.y-54} fill={load} textAnchor="middle">w = {fmt(sketch.distributed.value)} kN/m</text>
    </g>}
    {sketch.point&&sketch.point.value>0&&<g data-load="point">{arrow([crown.x,crown.y-59],[crown.x,crown.y-5],load,'P')}<text x={crown.x+10} y={crown.y-63} fill={load}>P = {fmt(sketch.point.value)} kN</text></g>}
    {showReactions&&[0,sketch.length].map((p,i)=>{const px=x(p),sign=i===0?-1:1;return <g key={i} data-reaction={i?'C':'A'}>
     {sketch.thrust!==0&&<>{arrow([px+sign*55,base-8],[px+sign*5,base-8],probeInk,'H')}<text x={px+sign*37} y={base-18} textAnchor="middle" fill={probeInk}>H</text></>}
     {(i?sketch.rightReaction:sketch.leftReaction)!==0&&<>{arrow([px+sign*29,base+40],[px+sign*29,base+5],probeInk,'R')}<text x={px+sign*38} y={base+33} textAnchor="middle" fill={probeInk}>R<tspan fontSize="9">{i?'C':'A'}</tspan></text></>}
    </g>;})}
   </>:<>
    {Array.from({length:33},(_,i)=>{const p=sketch.length*i/32,b=point(p),e=offset(p);return <line key={i} x1={b.x} y1={b.y} x2={e.x} y2={e.y} stroke={color} strokeWidth=".8" strokeOpacity=".45"/>;})}
    <path d={curve} fill="none" stroke={color} strokeWidth="1.8" data-field={mode}/>
    <text x="25" y="35" fill={color}>{mode==='sfd'?'V / kN':mode==='bmd'?'M / kN·m':'N / kN'}</text>
    {peak===0?<text x="320" y="165" textAnchor="middle" fill={color}>全拱 {mode==='sfd'?'V':'M'} = 0</text>:stations.flatMap(p=>{
     const sides:SectionSide[]=sketch.point?.x===p&&mode==='sfd'?['left','right']:['right'];
     return sides.map((s,i)=>{const b=offset(p,s),v=field(p,s);return Math.abs(v)<1e-10?null:<g key={`${p}-${s}`}><circle cx={b.x} cy={b.y} r="2.2" fill={color}/><text x={b.x+(p===0?7:p===sketch.length?-7:i?-8:8)} y={b.y+(mode==='bmd'&&v<0?-11:mode==='sfd'&&v>0?-11:18)} textAnchor={p===sketch.length||i?'end':'start'} fill={color} fontSize="12">{v>0?'+':''}{fmt(v)}</text></g>;});
    })}
   </>}
   <g stroke={muted} strokeWidth=".8" fill="none" data-dimension="L"><path d={`M${x(0)},${base+47}V307M${x(sketch.length)},${base+47}V307M${x(0)},299H${x(sketch.length)}`}/><path d={`M${x(0)+6},296L${x(0)},299L${x(0)+6},302M${x(sketch.length)-6},296L${x(sketch.length)},299L${x(sketch.length)-6},302`}/></g>
   <text x="320" y="321" textAnchor="middle">L = {fmt(sketch.length)} m</text>
   {sketch.distributed&&sketch.distributed.to<sketch.length&&<g stroke={muted} strokeWidth=".8" fill="none"><path d={`M${x(0)},268H${crown.x}M${x(0)},263V273M${crown.x},263V273`}/><text x={(x(0)+crown.x)/2} y="287" stroke="none" fill={ink} textAnchor="middle" fontSize="12">L/2 = {fmt(sketch.length/2)} m</text></g>}
   {isFbd&&<g stroke={muted} strokeWidth=".8" fill="none" data-dimension="f"><path d={`M${crown.x},${crown.y}H${crown.x+60}M${crown.x+53},${crown.y}V${base}M${crown.x+45},${base}H${crown.x+61}`} strokeDasharray="3 3"/><text transform={`translate(${crown.x+70} ${(crown.y+base)/2}) rotate(-90)`} textAnchor="middle" fill={ink} stroke="none">f = {fmt(sketch.rise)} m</text></g>}
   <g data-probe-position={probe} stroke={probeInk} fill={probeInk}>
    {!isFbd&&<line x1={selected.x} y1={selected.y} x2={selectedTip.x} y2={selectedTip.y} strokeWidth="2"/>}
    <circle cx={selected.x} cy={selected.y} r="3.5" fill="#091522" strokeWidth="1.5"/>
    {!isFbd&&<circle cx={selectedTip.x} cy={selectedTip.y} r="3.5" fill="#091522" strokeWidth="1.5"/>}
   </g>
   <text x="320" y="345" textAnchor="middle" fill={muted} fontSize="11">{isFbd?'竖向荷载按水平投影长度计 · 拱轴等比例':mode==='bmd'?'正弯矩画在拱内受拉侧 · 内力纵标自动缩放':mode==='sfd'?'局部剪力 V，正值向拱外 · 内力纵标自动缩放':'轴力 N 拉正压负 · 内力纵标自动缩放'}</text>
  </g>
 </svg>;
}
