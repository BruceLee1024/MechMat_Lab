import {describe,it,expect} from 'vitest';
import {DEFAULT_MEMBER,drawMember,drawingPoint,placeDrawingLoad,supportDOF,nearestMember,drawingId,ensureDrawingNode} from '../solver/drawing';
import {solveUnified} from '../solver/UnifiedSolver';
import type {SolverModel} from '../experiments/schema';
const empty=():SolverModel=>({kind:'solver',coordinateUnit:'mm',nodes:[],elements:[],loads:[]});
describe('画布建模使用真实坐标和拓扑',()=>{
  it('一次画杆件同时建立端点，矩形惯性矩与宽高一致',()=>{
    const {model}=drawMember(empty(),{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1);
    expect(model.nodes).toHaveLength(2);expect(model.elements).toHaveLength(1);
    expect(model.elements[0].section.I).toBeCloseTo(100*100**3/12,7);
  });
  it('连续画杆件复用节点，拒绝零长与正反重复杆件',()=>{
    const a=drawMember(empty(),{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,5).model;
    const b=drawMember(a,{x:1001,y:0},{x:2000,y:0},DEFAULT_MEMBER,5).model;
    expect(b.nodes).toHaveLength(3);expect(b.elements[0].nodeEnd).toBe(b.elements[1].nodeStart);
    expect(drawMember(a,{x:1000,y:0},{x:0,y:0},DEFAULT_MEMBER,5).model).toBe(a);
    expect(drawMember(empty(),{x:0,y:0},{x:0,y:0},DEFAULT_MEMBER,5).model.nodes).toHaveLength(0);
  });
  it('吸附已有节点优先于网格，Shift 限制水平或竖向',()=>{
    const m=drawMember(empty(),{x:37,y:23},{x:1000,y:23},DEFAULT_MEMBER,1).model;
    expect(drawingPoint(m.nodes,{x:39,y:25},50,5)).toEqual({x:37,y:23});
    expect(drawingPoint([],{x:308,y:125},50,5,{x:0,y:0},true)).toEqual({x:300,y:0});
    expect(drawingPoint([],{x:10,y:251},50,5,{x:0,y:0},true)).toEqual({x:0,y:250});
    expect(drawingId('N',[{id:'N1'},{id:'N3'}])).toBe('N2');
  });
  it('荷载吸附到杆件投影，均布荷载覆盖选中杆件全长',()=>{
    const m=drawMember(empty(),{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1).model;
    expect(nearestMember(m,{x:400,y:3},5)?.position).toBeCloseTo(.4);
    const p=placeDrawingLoad(m,{x:400,y:3},{type:'point',value:10000,angle:90},5).model.loads[0];
    expect(p.position).toBeCloseTo(.4);expect(p.targetType).toBe('element');
    const q=placeDrawingLoad(m,{x:400,y:3},{type:'distributed',value:2000,angle:90},5).model.loads[0];
    expect(q.position).toBe(0);expect(q.positionEnd).toBe(1);
  });
  it('拒绝在桁架杆件中部加横向荷载或在铰接节点加力矩',()=>{
    const m=drawMember(empty(),{x:0,y:0},{x:1000,y:0},{...DEFAULT_MEMBER,type:'truss'},1).model;
    expect(placeDrawingLoad(m,{x:500,y:0},{type:'point',value:100,angle:90},5).model).toBe(m);
    expect(placeDrawingLoad(m,{x:0,y:0},{type:'moment',value:10,angle:90},5).model).toBe(m);
    expect(placeDrawingLoad(m,{x:0,y:0},{type:'point',value:100,angle:90},5).model.loads).toHaveLength(1);
  });
  it('从空白画布构建的简支梁与解析反力、弯矩、挠度对应',()=>{
    let m=drawMember(empty(),{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1).model;
    m={...m,nodes:m.nodes.map((n,i)=>({...n,support:i?'roller':'pinned',fixedDOF:supportDOF(i?'roller':'pinned')}))};
    m=placeDrawingLoad(m,{x:500,y:0},{type:'point',value:10000,angle:90},5).model;
    const r=solveUnified(m.nodes,m.elements,m.loads);
    expect(r.success).toBe(true);expect(r.nodes[0].reaction?.Fy).toBeCloseTo(-5000,5);
    expect(Math.max(...r.elements[0].internalForces.map(f=>f.M))/(10000*1000/4)).toBeCloseTo(1,7);
    expect(Math.max(...r.elements[0].deflectionCurve!.map(p=>Math.abs(p.dy)))).toBeCloseTo(10000*1000**3/(48*200000*(100*100**3/12)),5);
  });
  it('从梁中部画支杆会建立共用连接节点，已有荷载的合力与作用位置守恒',()=>{
    let m=drawMember(empty(),{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1).model;
    m=placeDrawingLoad(m,{x:500,y:0},{type:'point',value:10000,angle:90},1).model;
    m=placeDrawingLoad(m,{x:400,y:0},{type:'distributed',value:2000,angle:90},1).model;
    const next=drawMember(m,{x:250,y:0},{x:250,y:400},DEFAULT_MEMBER,1).model;
    expect(next.nodes).toHaveLength(4);expect(next.elements).toHaveLength(3);
    const joint=next.nodes.find(n=>n.x===250&&n.y===0)!;
    expect(next.elements.filter(e=>e.nodeStart===joint.id||e.nodeEnd===joint.id)).toHaveLength(3);
    const concentrated=next.loads.find(l=>l.type==='point')!,member=next.elements.find(e=>e.id===concentrated.targetId)!;
    const a=next.nodes.find(n=>n.id===member.nodeStart)!,b=next.nodes.find(n=>n.id===member.nodeEnd)!;
    expect(a.x+(b.x-a.x)*concentrated.position!).toBeCloseTo(500,8);
    let resultant=0,moment=0;
    for(const load of next.loads.filter(l=>l.type==='distributed')){
      const element=next.elements.find(e=>e.id===load.targetId)!,a=next.nodes.find(n=>n.id===element.nodeStart)!,b=next.nodes.find(n=>n.id===element.nodeEnd)!;
      const force=load.value*(b.x-a.x)/1000;resultant+=force;moment+=force*(a.x+b.x)/2;
    }
    expect(resultant).toBeCloseTo(2000,8);expect(moment).toBeCloseTo(2000*500,8);
  });
  it('在已有集中力位置插入节点，转成节点荷载且反力不变',()=>{
    let m=drawMember(empty(),{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1).model;
    m={...m,nodes:m.nodes.map((n,i)=>({...n,support:i?'roller':'pinned',fixedDOF:supportDOF(i?'roller':'pinned')}))};
    m=placeDrawingLoad(m,{x:500,y:0},{type:'point',value:10000,angle:90},1).model;
    const next=ensureDrawingNode(m,{x:500,y:0},1);
    expect(next.model.loads[0].targetId).toBe(next.node.id);expect(next.model.loads[0].targetType).toBe('node');
    const r=solveUnified(next.model.nodes,next.model.elements,next.model.loads);
    expect(r.success).toBe(true);expect(r.nodes[0].reaction?.Fy).toBeCloseTo(-5000,3);expect(r.nodes[1].reaction?.Fy).toBeCloseTo(-5000,3);
  });
  it('画布均布荷载的峰值包含跨中解析极值，不低报为相邻采样点',()=>{
    let m=drawMember(empty(),{x:0,y:0},{x:400,y:0},DEFAULT_MEMBER,1).model;
    m={...m,nodes:m.nodes.map((n,i)=>({...n,support:i?'roller':'pinned',fixedDOF:supportDOF(i?'roller':'pinned')}))};
    m=placeDrawingLoad(m,{x:200,y:0},{type:'distributed',value:2000,angle:90},1).model;
    const r=solveUnified(m.nodes,m.elements,m.loads);
    expect(r.success).toBe(true);expect(Math.max(...r.elements[0].internalForces.map(f=>f.M))).toBeCloseTo(40000,5);
    expect(r.nodes[0].reaction?.Fy).toBeCloseTo(-400,5);
  });
  it('途经已有节点时连接成分段杆，沿已有杆件延长不会叠加重复杆件',()=>{
    let m=drawMember(empty(),{x:0,y:0},{x:500,y:0},DEFAULT_MEMBER,1).model;
    m=drawMember(m,{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1).model;
    expect(m.elements).toHaveLength(2);expect(m.nodes).toHaveLength(3);
    expect(drawMember(m,{x:0,y:0},{x:1000,y:0},DEFAULT_MEMBER,1).model).toBe(m);
  });
});
