import React from 'react';
import type {SolverElement,SolverLoad,SolverNode} from '../SolverTypes';

/** 图符采用屏幕尺寸，作用点、方向与覆盖区间始终来自真实荷载。 */
export function SolverLoadGlyph({load,nodes,elements,viewScale,selected,onPointerDown,onClick}: {
  load:SolverLoad;nodes:SolverNode[];elements:SolverElement[];viewScale:number;selected:boolean;
  onPointerDown:(event:React.PointerEvent<SVGGElement>)=>void;onClick:(event:React.MouseEvent<SVGGElement>)=>void;
}) {
  const k=1/viewScale,color=selected?'var(--sw-accent)':'var(--sw-load)';
  const marker=selected?'url(#arrowForceSelected)':'url(#arrowForce)';
  const element=load.targetType==='element'?elements.find(e=>e.id===load.targetId):undefined;
  const a=nodes.find(n=>n.id===(element?.nodeStart??load.targetId));
  const b=element?nodes.find(n=>n.id===element.nodeEnd):undefined;
  if(!a || (element&&!b))return null;
  const point=(t:number)=>({x:a.x+(b?b.x-a.x:0)*t,y:a.y+(b?b.y-a.y:0)*t});
  const rad=load.angle*Math.PI/180,ux=Math.cos(rad),uy=Math.sin(rad);
  const common={stroke:color,strokeWidth:1.8*k};
  const label={fill:color,fontSize:11*k,fontWeight:550};
  const body=()=>{
    if((load.type==='distributed'||load.type==='triangular')&&b){
      const from=load.position??0,to=load.positionEnd??1,q1=load.value,q2=load.type==='triangular'?(load.valueEnd??0):load.value;
      const max=Math.max(Math.abs(q1),Math.abs(q2),1),height=36*k;
      const points=Array.from({length:Math.min(16,Math.max(3,Math.round(Math.hypot(b.x-a.x,b.y-a.y)*(to-from)*viewScale/42)+1))},(_,i)=>i);
      // 每个箭头按线性荷载强度缩放，正负值分别指向实际全局方向。
      const count=points.length;
      const arrows=points.map(i=>{const t=i/(count-1),q=q1+(q2-q1)*t,p=point(from+(to-from)*t);return {q,p,tail:{x:p.x-ux*q/max*height,y:p.y-uy*q/max*height}};});
      const mid=point((from+to)/2),qm=(q1+q2)/2;
      return <><polyline points={arrows.map(v=>`${v.tail.x},${v.tail.y}`).join(' ')} fill="none" {...common}/>{arrows.filter(v=>Math.abs(v.q)>1e-10).map((v,i)=><line key={i} data-force-direction={`${ux*Math.sign(v.q)},${uy*Math.sign(v.q)}`} x1={v.tail.x} y1={v.tail.y} x2={v.p.x-ux*Math.sign(v.q)*3*k} y2={v.p.y-uy*Math.sign(v.q)*3*k} {...common} markerEnd={marker}/>)}<text {...label} textAnchor="middle" x={mid.x-ux*qm/max*height} y={mid.y-uy*qm/max*height-10*k}>q = {q1/1000}{load.type==='triangular'?` → ${q2/1000}`:''} kN/m</text></>;
    }
    const p=point(load.position??.5);
    if(load.type==='moment'){
      const r=19*k,positive=load.value>=0;
      return <g transform={`translate(${p.x},${p.y})`}><circle r={26*k} fill="transparent"/><path d={`M ${r} 0 A ${r} ${r} 0 1 ${positive?1:0} ${-r} 0`} fill="none" {...common}/><polygon points={`${-r},0 ${-r-4*k},${(positive?6:-6)*k} ${-r+4*k},${(positive?6:-6)*k}`} fill={color}/><text {...label} x={0} y={-29*k} textAnchor="middle">M = {load.value/1000} kN·m</text></g>;
    }
    const sign=Math.sign(load.value),dx=ux*sign,dy=uy*sign,tail={x:p.x-dx*50*k,y:p.y-dy*50*k};
    return <><line x1={tail.x} y1={tail.y} x2={p.x} y2={p.y} stroke="transparent" strokeWidth={16*k}/>{sign!==0&&<line data-force-direction={`${dx},${dy}`} x1={tail.x} y1={tail.y} x2={p.x-dx*3*k} y2={p.y-dy*3*k} {...common} markerEnd={marker}/>}<text {...label} x={tail.x+8*k} y={tail.y-8*k}>F = {load.value/1000} kN</text></>;
  };
  return <g data-load-id={load.id} className="cursor-pointer" onPointerDown={onPointerDown} onClick={onClick}>{body()}</g>;
}
