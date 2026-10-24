import type { SolverModel } from '../experiments/schema';
import type { SolverElement, SolverLoad, SolverNode, SupportType } from './SolverTypes';

export type DrawingPoint = { x: number; y: number };
export type MemberDefaults = { type: 'beam' | 'truss'; width: number; height: number; E: number; yield: number };
export const DEFAULT_MEMBER: MemberDefaults = { type: 'beam', width: 100, height: 100, E: 200000, yield: 250 };

export function drawingId(prefix: string, items: { id: string }[]) {
  let n = 1;
  while (items.some(item => item.id === `${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}
export function nearestNode(nodes: SolverNode[], point: DrawingPoint, tolerance: number) {
  return nodes.reduce<SolverNode | undefined>((best, node) => {
    const distance = Math.hypot(node.x-point.x, node.y-point.y);
    return distance <= tolerance && (!best || distance < Math.hypot(best.x-point.x,best.y-point.y)) ? node : best;
  }, undefined);
}
export function nearestMember(model: SolverModel, point: DrawingPoint, tolerance: number) {
  let best: { element: SolverElement; position: number; point: DrawingPoint; distance: number } | undefined;
  for (const element of model.elements) {
    const a=model.nodes.find(n=>n.id===element.nodeStart), b=model.nodes.find(n=>n.id===element.nodeEnd);
    if (!a || !b) continue;
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
    if (!length2) continue;
    const position=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length2));
    const projection={x:a.x+position*dx,y:a.y+position*dy};
    const distance=Math.hypot(point.x-projection.x,point.y-projection.y);
    if (distance<=tolerance && (!best || distance<best.distance)) best={element,position,point:projection,distance};
  }
  return best;
}
export function drawingPoint(nodes: SolverNode[], raw: DrawingPoint, grid: number | null, tolerance: number, origin?: DrawingPoint, orthogonal=false): DrawingPoint {
  const node=nearestNode(nodes,raw,tolerance);
  if (node) return {x:node.x,y:node.y};
  let point=grid ? {x:Math.round(raw.x/grid)*grid,y:Math.round(raw.y/grid)*grid} : raw;
  if (origin && orthogonal) point=Math.abs(point.x-origin.x)>=Math.abs(point.y-origin.y) ? {...point,y:origin.y} : {...point,x:origin.x};
  return point;
}
export function supportDOF(support: SupportType) {
  return {dx:support==='fixed'||support==='pinned',dy:support!=='none',rz:support==='fixed'};
}
export function drawingNode(nodes: SolverNode[], point: DrawingPoint): SolverNode {
  return {id:drawingId('N',nodes),...point,support:'none',fixedDOF:supportDOF('none')};
}

/** 在杆件中部放置连接节点时分割杆件，并守恒地映射已有荷载。 */
export function ensureDrawingNode(model: SolverModel, point: DrawingPoint, tolerance: number): {model:SolverModel;node:SolverNode} {
  const existing=nearestNode(model.nodes,point,tolerance);
  if(existing)return {model,node:existing};
  const hit=nearestMember(model,point,tolerance);
  const node=drawingNode(model.nodes,hit?.point??point);
  if(!hit || hit.position<=1e-9 || hit.position>=1-1e-9)return {model:{...model,nodes:[...model.nodes,node]},node};
  const first={...hit.element,nodeEnd:node.id},second={...hit.element,id:drawingId('E',model.elements),nodeStart:node.id};
  const cut=hit.position,loads:SolverLoad[]=[];
  for(const load of model.loads){
    if(load.targetType!=='element'||load.targetId!==hit.element.id){loads.push(load);continue;}
    if(load.type==='point'||load.type==='moment'){
      const t=load.position??.5;
      if(Math.abs(t-cut)<1e-9)loads.push({...load,targetType:'node',targetId:node.id,position:undefined,positionEnd:undefined});
      else loads.push({...load,targetId:t<cut?first.id:second.id,position:t<cut?t/cut:(t-cut)/(1-cut)});
      continue;
    }
    const from=load.position??0,to=load.positionEnd??1,q1=load.value,q2=load.type==='triangular'?(load.valueEnd??0):load.value;
    let used=false;
    for(const [element,start,end] of [[first,0,cut],[second,cut,1]] as const){
      const lo=Math.max(from,start),hi=Math.min(to,end);if(hi-lo<=1e-12)continue;
      const q=(t:number)=>q1+(q2-q1)*(t-from)/(to-from);
      loads.push({...load,id:used?drawingId('L',[...model.loads,...loads]):load.id,targetId:element.id,position:(lo-start)/(end-start),positionEnd:(hi-start)/(end-start),value:q(lo),...(load.type==='triangular'?{valueEnd:q(hi)}:{})});used=true;
    }
  }
  return {model:{...model,nodes:[...model.nodes,node],elements:model.elements.flatMap(element=>element.id===first.id?[first,second]:[element]),loads},node};
}

/** 一次提交同时创建端点与杆件，取消首点不会留下孤立节点。 */
export function drawMember(model: SolverModel, a: DrawingPoint, b: DrawingPoint, defaults: MemberDefaults, tolerance: number) {
  if (![a.x,a.y,b.x,b.y,defaults.width,defaults.height,defaults.E,defaults.yield].every(Number.isFinite) || [defaults.width,defaults.height,defaults.E,defaults.yield].some(v=>v<=0)) return {model,message:'杆件尺寸与材料参数必须为正有限数值。'};
  const first=ensureDrawingNode(model,a,tolerance),last=ensureDrawingNode(first.model,b,tolerance);
  const start=first.node,end=last.node,nodes=last.model.nodes;
  if (Math.hypot(start.x-end.x,start.y-end.y)<=tolerance || start.id===end.id) return {model,message:'终点太靠近起点，请选择另一个位置。'};
  const duplicate=last.model.elements.find(e=>(e.nodeStart===start.id&&e.nodeEnd===end.id)||(e.nodeStart===end.id&&e.nodeEnd===start.id));
  if (duplicate) return {model,selectedId:duplicate.id,message:'这两个节点之间已经有杆件。'};
  const {width,height,E}=defaults;
  const element: SolverElement={id:drawingId('E',last.model.elements),type:defaults.type,nodeStart:start.id,nodeEnd:end.id,
    section:{A:width*height,I:defaults.type==='beam'?width*height**3/12:0,width,height},material:{E,G:E/2.6,yield:defaults.yield}};
  if (![element.section.A,element.section.I].every(Number.isFinite)) return {model,message:'截面参数过大，请缩小尺寸。'};
  // 途经已有节点时分段连接；只有几何交叉、没有节点的位置不自动铰接。
  const dx=end.x-start.x,dy=end.y-start.y,length2=dx*dx+dy*dy;
  const interior=nodes.filter(n=>n.id!==start.id&&n.id!==end.id).map(node=>({node,t:((node.x-start.x)*dx+(node.y-start.y)*dy)/length2})).filter(({node,t})=>t>1e-9&&t<1-1e-9&&Math.hypot(node.x-start.x-t*dx,node.y-start.y-t*dy)<1e-6).sort((a,b)=>a.t-b.t).map(item=>item.node);
  const chain=[start,...interior,end],elements=[...last.model.elements],created:SolverElement[]=[];
  for(let i=1;i<chain.length;i++){
    const a=chain[i-1].id,b=chain[i].id;
    if(elements.some(e=>(e.nodeStart===a&&e.nodeEnd===b)||(e.nodeStart===b&&e.nodeEnd===a)))continue;
    const part={...element,id:drawingId('E',elements),nodeStart:a,nodeEnd:b};elements.push(part);created.push(part);
  }
  if(!created.length)return {model,message:'沿线已有杆件，未重复添加。'};
  return {model:{...last.model,nodes,elements},selectedId:created[created.length-1].id,end:{x:end.x,y:end.y},message:`已绘制 ${created.map(e=>e.id).join('、')}，可继续点选下一端点。`};
}

export type DrawingLoad = { type: 'point' | 'distributed' | 'moment'; value: number; angle: number };
export function placeDrawingLoad(model: SolverModel, raw: DrawingPoint, load: DrawingLoad, tolerance: number) {
  if (![load.value,load.angle].every(Number.isFinite)) return {model,message:'荷载数值与方向必须为有限数值。'};
  const node=load.type!=='distributed' ? nearestNode(model.nodes,raw,tolerance) : undefined;
  const member=node?undefined:nearestMember(model,raw,tolerance);
  if (!node&&!member) return {model,message:load.type==='distributed'?'请点击需要施加均布荷载的杆件。':'请点击节点或杆件放置荷载。'};
  if (member?.element.type==='truss' || (load.type==='moment' && node && !model.elements.some(e=>e.type==='beam'&&(e.nodeStart===node.id||e.nodeEnd===node.id)))) return {model,message:'理想桁架为二力杆，请在节点施加集中力。'};
  const item: SolverLoad={id:drawingId('L',model.loads),...load,targetType:node?'node':'element',targetId:node?.id??member!.element.id,
    ...(member?{position:load.type==='distributed'?0:member.position,...(load.type==='distributed'?{positionEnd:1}:{})}: {})};
  return {model:{...model,loads:[...model.loads,item]},selectedId:item.id,message:`已添加 ${item.id}，可继续点选其他位置。`};
}
