import {calculatePolygonArea,calculatePolygonCentroid,calculatePolygonInertia,type PolygonPath,type SectionParams,type SectionToolType,type Vertex} from './sectionTool';
import {sectionToolGeometry,sectionParameterProblem,type SectionToolGeometry} from './sectionToolGeometry';

export type TeachingMode='parts'|'centroid'|'inertia'|'compare';
export type TeachingAxis='x'|'y';
export interface TeachingPart {
  id:string;label:string;sign:1|-1;color:string;vertices:Vertex[];
  kind:'polygon'|'rectangle'|'circle';width?:number;height?:number;radius?:number;
  A:number;cx:number;cy:number;Ix0:number;Iy0:number;dx:number;dy:number;Ix:number;Iy:number;
}
export interface SectionTeachingData {
  geometry:SectionToolGeometry;parts:TeachingPart[];A:number;cx:number;cy:number;Ix:number;Iy:number;
}
const colors=['#81bdf2','#7dd9c4','#bea8e5','#e5c080','#8dc9d6','#d9a1b2'];
type RawPart=Omit<TeachingPart,'dx'|'dy'|'Ix'|'Iy'>;

/** 分块使用原始毫米坐标。显示上的展开、缩放和动画均不进入积分。 */
export function buildSectionTeaching(type:SectionToolType,p:SectionParams,paths:PolygonPath[]):SectionTeachingData|null {
  if(type!=='draw'&&sectionParameterProblem(type,p))return null;
  const g=sectionToolGeometry(type,p,paths);if(!g)return null;
  const raw:RawPart[]=[];
  const polygon=(id:string,label:string,vertices:Vertex[],hole=false)=>{
    const A=calculatePolygonArea(vertices),c=calculatePolygonCentroid(vertices),I=calculatePolygonInertia(vertices);
    raw.push({id,label,vertices,sign:hole?-1:1,color:hole?'#e9ad93':colors[raw.length%colors.length],kind:'polygon',A,cx:c.cx,cy:c.cy,Ix0:I.Ix,Iy0:I.Iy});
  };
  const rect=(id:string,label:string,x:number,y:number,w:number,h:number,hole=false)=>{
    const vertices=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
    raw.push({id,label,vertices,sign:hole?-1:1,color:hole?'#e9ad93':colors[raw.length%colors.length],kind:'rectangle',width:w,height:h,A:w*h,cx:x+w/2,cy:y+h/2,Ix0:w*h**3/12,Iy0:h*w**3/12});
  };
  if(type==='rectangle')rect('body','矩形实体',0,0,p.b,p.h);
  else if(type==='hollow-rectangle'){
    rect('outer','外矩形',0,0,p.B,p.H);rect('hole','扣除内孔',p.t,p.t,p.B-2*p.t,p.H-2*p.t,true);
  }else if(type==='circle'||type==='hollow-circle'){
    const D=type==='circle'?p.d:p.D,R=D/2;
    for(const [i,r] of [R,...(type==='hollow-circle'?[p.d/2]:[])].entries())raw.push({id:i?'hole':'body',label:i?'扣除内圆':'圆形实体',sign:i?-1:1,color:i?'#e9ad93':colors[0],vertices:g.paths[i].vertices,kind:'circle',radius:r,A:Math.PI*r*r,cx:R,cy:R,Ix0:Math.PI*r**4/4,Iy0:Math.PI*r**4/4});
  }else if(type==='i-beam'||type==='channel'){
    const x=type==='i-beam'?(p.B-p.tw)/2:0;
    rect('top','上翼缘',0,p.H-p.tf,p.B,p.tf);rect('web','腹板',x,p.tf,p.tw,p.H-2*p.tf);rect('bottom','下翼缘',0,0,p.B,p.tf);
  }else if(type==='t-beam'){
    rect('top','翼缘',0,p.hw,p.B,p.tf);rect('web','腹板',(p.B-p.tw)/2,0,p.tw,p.hw);
  }else if(type==='angle'||type==='unequal-angle'){
    const B=type==='angle'?p.L:p.B,H=type==='angle'?p.L:p.b;
    rect('horizontal','水平肢',0,0,B,p.t);rect('vertical','竖直肢',0,p.t,p.t,H-p.t);
  }else if(type==='double-channel')g.paths.forEach((path,i)=>polygon(i?'right':'left',i?'右槽钢':'左槽钢',path.vertices));
  else if(type==='composite-rect'){
    const w=Math.max(p.b1,p.b2);
    rect('top','上部矩形',(w-p.b1)/2,p.h2,p.b1,p.h1);rect('bottom','下部矩形',(w-p.b2)/2,0,p.b2,p.h2);
  }else g.paths.forEach((path,i)=>polygon(path.id,`${path.isHole?'内孔':'实体轮廓'} ${i+1}`,path.vertices,path.isHole));
  const A=raw.reduce((s,v)=>s+v.sign*v.A,0);
  if(!(A>0)||raw.some(v=>!(v.A>0)||![v.A,v.Ix0,v.Iy0,v.cx,v.cy].every(Number.isFinite)))return null;
  const cx=raw.reduce((s,v)=>s+v.sign*v.A*v.cx,0)/A,cy=raw.reduce((s,v)=>s+v.sign*v.A*v.cy,0)/A;
  const parts=raw.map(v=>({...v,dx:v.cx-cx,dy:v.cy-cy,Ix:v.sign*(v.Ix0+v.A*(v.cy-cy)**2),Iy:v.sign*(v.Iy0+v.A*(v.cx-cx)**2)}));
  const Ix=parts.reduce((s,v)=>s+v.Ix,0),Iy=parts.reduce((s,v)=>s+v.Iy,0);
  if(![A,cx,cy,Ix,Iy].every(Number.isFinite)||Ix<=0||Iy<=0)return null;
  return {geometry:g,parts,A,cx,cy,Ix,Iy};
}

/** 半平面裁切保留有向边界积分；非凸轮廓的连接边在裁切线上抵消。 */
function clipBelow(vertices:Vertex[],coordinate:'x'|'y',cut:number):Vertex[]{
  const output:Vertex[]=[];
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],insideA=a[coordinate]<=cut,insideB=b[coordinate]<=cut;
    if(insideA)output.push(a);
    if(insideA!==insideB){const t=(cut-a[coordinate])/(b[coordinate]-a[coordinate]);output.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
  }
  return output;
}

/** 圆段的零次、一次、二次面积矩解析原函数，避免用离散圆环伪装精确积分。 */
function circleSegment(r:number,t:number){
  if(t<=-r)return {A:0,Q:0,I:0};
  if(t>=r)return {A:Math.PI*r*r,Q:0,I:Math.PI*r**4/4};
  const root=Math.sqrt(Math.max(0,r*r-t*t)),angle=Math.asin(t/r);
  return {A:t*root+r*r*(angle+Math.PI/2),Q:-2*root**3/3,I:r**4*(angle+Math.PI/2)/4-t*(r*r-2*t*t)*root/4};
}

/** 扫描区域始终绕完整截面的形心轴累计，不绕已扫描区域自身的形心轴。 */
export function scanSection(data:SectionTeachingData,axis:TeachingAxis,progress:number){
  const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0)),g=data.geometry;
  const coordinate=axis==='x'?'y':'x',min=axis==='x'?g.minY:g.minX,max=axis==='x'?g.maxY:g.maxX,cut=min+(max-min)*p;
  if(p===0)return {A:0,I:0,cut};
  if(p===1)return {A:data.A,I:axis==='x'?data.Ix:data.Iy,cut};
  let A=0,I=0;
  for(const part of data.parts){
    if(part.kind==='circle'){
      const center=axis==='x'?part.cy:part.cx,offset=center-(axis==='x'?data.cy:data.cx),v=circleSegment(part.radius!,cut-center);
      A+=part.sign*v.A;I+=part.sign*(v.I+2*offset*v.Q+offset**2*v.A);
    }else{
      const clipped=clipBelow(part.vertices,coordinate,cut),a=calculatePolygonArea(clipped);
      if(a<=0)continue;
      const c=calculatePolygonCentroid(clipped),local=calculatePolygonInertia(clipped),distance=axis==='x'?c.cy-data.cy:c.cx-data.cx;
      A+=part.sign*a;I+=part.sign*((axis==='x'?local.Ix:local.Iy)+a*distance**2);
    }
  }
  return {A:Math.max(0,A),I:Math.max(0,I),cut};
}
