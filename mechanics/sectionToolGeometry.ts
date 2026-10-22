import {SECTION_TOOL_CONFIGS,calculatePolygonArea,calculatePolygonCentroid,type SectionToolType,type SectionParams,type PolygonPath} from './sectionTool';

/** 预览使用真实毫米坐标，整个截面只应用一次等比例变换。 */
export function sectionToolGeometry(type:SectionToolType,p:SectionParams,draw:PolygonPath[]){
  let paths:PolygonPath[]=[];
  const polygon=(points:number[][],hole=false)=>({id:`geometry-${paths.length}`,vertices:points.map(([x,y])=>({x,y})),isClosed:true,isHole:hole});
  const rect=(x:number,y:number,w:number,h:number,hole=false)=>polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],hole);
  const channel=(H:number,B:number,tw:number,tf:number)=>[[0,0],[B,0],[B,tf],[tw,tf],[tw,H-tf],[B,H-tf],[B,H],[0,H]];
  if(type==='custom')return null;
  if(type==='draw')paths=draw.filter(q=>q.isClosed&&q.vertices.length>=3);
  else if(type==='rectangle')paths=[rect(0,0,p.b,p.h)];
  else if(type==='hollow-rectangle')paths=[rect(0,0,p.B,p.H),rect(p.t,p.t,p.B-2*p.t,p.H-2*p.t,true)];
  else if(type==='circle'||type==='hollow-circle'){
    const D=type==='circle'?p.d:p.D,R=D/2;
    const circle=(r:number,hole=false)=>polygon(Array.from({length:512},(_,i)=>[R+r*Math.cos(i*Math.PI/256),R+r*Math.sin(i*Math.PI/256)]),hole);
    paths=[circle(R),...(type==='hollow-circle'?[circle(p.d/2,true)]:[])];
  } else if(type==='i-beam'){
    const {B,H,tw,tf}=p,a=(B-tw)/2,b=(B+tw)/2;
    paths=[polygon([[0,0],[B,0],[B,tf],[b,tf],[b,H-tf],[B,H-tf],[B,H],[0,H],[0,H-tf],[a,H-tf],[a,tf],[0,tf]])];
  } else if(type==='t-beam'){
    const {B,hw,tw,tf}=p,a=(B-tw)/2,b=(B+tw)/2;
    paths=[polygon([[a,0],[b,0],[b,hw],[B,hw],[B,hw+tf],[0,hw+tf],[0,hw],[a,hw]])];
  } else if(type==='channel')paths=[polygon(channel(p.H,p.B,p.tw,p.tf))];
  else if(type==='angle'||type==='unequal-angle'){
    const B=type==='angle'?p.L:p.B,H=type==='angle'?p.L:p.b,t=p.t;
    paths=[polygon([[0,0],[B,0],[B,t],[t,t],[t,H],[0,H]])];
  } else if(type==='double-channel'){
    const q=channel(p.H,p.B,p.tw,p.tf);
    paths=[polygon(q.map(([x,y])=>[p.B-x,y])),polygon(q.map(([x,y])=>[p.B+p.delta+x,y]))];
  } else if(type==='composite-rect'){
    const w=Math.max(p.b1,p.b2);
    paths=[rect((w-p.b2)/2,0,p.b2,p.h2),rect((w-p.b1)/2,p.h2,p.b1,p.h1)];
  }
  const vertices=paths.filter(q=>!q.isHole).flatMap(q=>q.vertices);
  if(!vertices.length||vertices.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))return null;
  const minX=Math.min(...vertices.map(v=>v.x)),maxX=Math.max(...vertices.map(v=>v.x)),minY=Math.min(...vertices.map(v=>v.y)),maxY=Math.max(...vertices.map(v=>v.y));
  let A=0,Ax=0,Ay=0;
  for(const q of paths){const a=calculatePolygonArea(q.vertices)*(q.isHole?-1:1),c=calculatePolygonCentroid(q.vertices);A+=a;Ax+=a*c.cx;Ay+=a*c.cy;}
  if(A<=0||maxX<=minX||maxY<=minY)return null;
  return {paths,minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY,cx:Ax/A,cy:Ay/A};
}

/** 与实验文档一致的尺寸约束，输入草稿不进入计算模型。 */
export function sectionParameterProblem(type:SectionToolType,p:SectionParams):string|null {
  for(const f of SECTION_TOOL_CONFIGS[type].params)if(!Number.isFinite(p[f.key])||p[f.key]<f.min)return `${f.label}不能小于 ${f.min} ${f.unit}`;
  if(type==='hollow-circle'&&p.D<=p.d)return '外径必须大于内径';
  if(type==='hollow-rectangle'&&2*p.t>=Math.min(p.B,p.H))return '壁厚必须小于宽高的一半';
  if(['i-beam','channel','double-channel'].includes(type)&&(p.H<=2*p.tf||p.B<=p.tw))return '翼缘或腹板尺寸超出截面范围';
  if(type==='t-beam'&&p.B<=p.tw)return '腹板厚度必须小于翼缘宽度';
  if(type==='angle'&&p.t>=p.L)return '厚度必须小于边长';
  if(type==='unequal-angle'&&p.t>=Math.min(p.B,p.b))return '厚度必须小于两边长度';
  const result=SECTION_TOOL_CONFIGS[type].calculate(p);
  if(Object.values(result).some(n=>!Number.isFinite(n)||n<0))return '当前参数量级超出可计算范围';
  return null;
}

export type SectionToolGeometry=NonNullable<ReturnType<typeof sectionToolGeometry>>;
