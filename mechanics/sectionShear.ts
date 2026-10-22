import type {SectionProperties} from '../types';
import {bendingProfile} from './sectionOutline';
import {evaluateSection} from './sections';

/** 截面坐标 y、z；单位载荷场分别对应 Vy=1 N、Tx=1 N·mm。
 * 圣维南弹性截面分析：ω 的 Neumann 问题和含泊松项的剪切函数。
 * 不使用 Ip 代替非圆截面 J；所有孔边与外边均为自由表面。
 * 公式、边界与校核见 docs/组合变形可视化模型.md。
 */
export interface SectionShearPoint {y:number;z:number;weight:number;vy:number;vz:number;ty:number;tz:number;omega:number}
export interface SectionShear {
  ok:true; J:number; shearCenterZ:number; elasticShearCenterZ:number;
  complianceVV:number; complianceVT:number; complianceTT:number;
  points:SectionShearPoint[]; cells:[number,number][][];
  at:(y:number,z:number)=>Omit<SectionShearPoint,'weight'>|null;
  residual:number; method:string; nodes:number;
}
export type SectionShearResult=SectionShear|{ok:false;reason:string};
const cache=new Map<string,SectionShearResult>();
const dot=(a:Float64Array,b:Float64Array)=>a.reduce((s,v,i)=>s+v*b[i],0);
const gauss=[[-Math.sqrt(3/5),5/9],[0,8/9],[Math.sqrt(3/5),5/9]];
const basis=(x:number)=>[x*(x-1)/2,1-x*x,x*(x+1)/2];
const deriv=(x:number)=>[x-.5,-2*x,x+.5];
function shape(u:number,v:number,hy:number,hz:number) {
  const a=basis(u),b=basis(v),da=deriv(u),db=deriv(v),N:number[]=[],Y:number[]=[],Z:number[]=[];
  for(let j=0;j<3;j++)for(let i=0;i<3;i++){N.push(a[i]*b[j]);Y.push(da[i]*b[j]*2/hy);Z.push(a[i]*db[j]*2/hz);}return {N,Y,Z};
}
function solve(rows:Map<number,number>[],rhs:Float64Array) {
  // 常数零模通过一个节点固定消除；求解后再减面积平均值。
  const n=rows.length,diag=Float64Array.from(rows,(r,i)=>i===0?1:r.get(i)??0),b=rhs.slice();b[0]=0;
  const offsets=new Int32Array(n+1),cols:number[]=[],vals:number[]=[];
  rows.forEach((row,i)=>{if(i)for(const [j,k] of row)if(j){cols.push(j);vals.push(k);}offsets[i+1]=cols.length;});
  const multiply=(p:Float64Array)=>{const out=new Float64Array(n);out[0]=p[0];for(let i=1;i<n;i++)for(let k=offsets[i];k<offsets[i+1];k++)out[i]+=vals[k]*p[cols[k]];return out;};
  const x=new Float64Array(n),r=b.slice(),z=Float64Array.from(r,(v,i)=>v/diag[i]),p=z.slice(),bNorm=Math.sqrt(dot(b,b));
  if(bNorm<1e-15)return {x,residual:0};let rz=dot(r,z),residual=1;
  for(let it=0;it<3500;it++) {const ap=multiply(p),den=dot(p,ap);if(!(den>0))break;const alpha=rz/den;
    for(let i=0;i<n;i++){x[i]+=alpha*p[i];r[i]-=alpha*ap[i];}residual=Math.sqrt(dot(r,r))/bNorm;if(residual<2e-10)break;
    for(let i=0;i<n;i++)z[i]=r[i]/diag[i];const next=dot(r,z),beta=next/rz;for(let i=0;i<n;i++)p[i]=z[i]+beta*p[i];rz=next;
  }
  return {x,residual};
}
function inside(y:number,z:number,contours:[number,number][][]) {
  // 轴线对齐多边形/无间距组合截面的并集，不把接触边当作自由边。
  return contours.some(c=>{let hit=false;for(let i=0,j=c.length-1;i<c.length;j=i++)if((c[i][1]>z)!==(c[j][1]>z)&&y<(c[j][0]-c[i][0])*(z-c[i][1])/(c[j][1]-c[i][1])+c[i][0])hit=!hit;return hit;});
}
function subdivide(a:number[],h:number) {const out:number[]=[];a.forEach((v,i)=>{if(!i){out.push(v);return;}const lo=a[i-1],n=Math.max(2,Math.ceil((v-lo)/h));for(let j=1;j<=n;j++)out.push(lo+(v-lo)*j/n);});return out;}

/** refinement=1 为交互网格；测试可独立加密检查 J 与能量收敛。 */
export function sectionShear(section:SectionProperties,nu=0,refinement=1):SectionShearResult {
  const key=JSON.stringify([section,nu,refinement]),old=cache.get(key);if(old)return old;
  const result=build(section,nu,refinement);cache.set(key,result);if(cache.size>20)cache.delete(cache.keys().next().value!);return result;
}
function build(section:SectionProperties,nu:number,refinement:number):SectionShearResult {
  const valid=evaluateSection(section);if(valid.ok===false)return {ok:false,reason:valid.diagnostics[0].message};
  if(!Number.isFinite(nu)||nu<=-1||nu>=.5)return {ok:false,reason:'各向同性材料需满足 −1 < E/(2G)−1 < 0.5，请检查 E、G'};
  if(section.type==='custom')return {ok:false,reason:'只有 A、I 无法确定剪应力与翘曲；请先选择有完整轮廓的截面'};
  if(section.type==='composite'&&(section.compSpacing??0)>0)return {ok:false,reason:'两块截面之间存在间隙，尚无连接件传力模型；请将间距设为 0 并按完全粘结计算'};
  const p=valid.values,profile=bendingProfile(section),contours=profile.contours;
  if(section.type==='circle'||section.type==='hollow_circle') {
    const R=section.type==='circle'?section.radius??50:section.outerRadius??50,r=section.type==='circle'?0:section.innerRadius??40,I=p.Iz,J=p.Ip;
    const a=(3+2*nu)/(8*(1+nu)*I),b=-(1-2*nu)/(8*(1+nu)*I),c=-(1+2*nu)/(4*(1+nu)*I),e=a*R*R*r*r;
    const at=(y:number,z:number)=>{const q=y*y+z*z;if(q>R*R*(1+1e-10)||q<r*r*(1-1e-10))return null;const inv=q?e/(q*q):0;return {y,z,vy:a*(R*R+r*r-y*y)+b*z*z+inv*(z*z-y*y),vz:c*y*z-2*inv*y*z,ty:-z/J,tz:y/J,omega:0};};
    const points:SectionShearPoint[]=[];let energy=0;
    // 径向高斯积分；带小孔时对数分段，兼顾孔边梯度与极薄圆环。
    const bands=r?Math.max(8,Math.min(120,Math.ceil(Math.log(R/r)/Math.log(1.35)))):8;
    for(let k=0;k<bands;k++){const lo=r?r*(R/r)**(k/bands):R*k/bands,hi=r?r*(R/r)**((k+1)/bands):R*(k+1)/bands;
      for(const [g,w] of gauss)for(let j=0;j<64;j++){const radius=(lo+hi)/2+g*(hi-lo)/2,angle=2*Math.PI*(j+.5)/64,weight=w*(hi-lo)/2*radius*2*Math.PI/64,q=at(radius*Math.cos(angle),radius*Math.sin(angle))!;points.push({...q,weight});energy+=weight*(q.vy*q.vy+q.vz*q.vz);}}
    // 边界与中心也参与危险点搜索，不能仅搜索积分点。
    for(const radius of Array.from({length:17},(_,i)=>r+(R-r)*i/16))for(let j=0;j<96;j++)points.push({...at(radius*Math.cos(j*Math.PI/48),radius*Math.sin(j*Math.PI/48))!,weight:0});
    return {ok:true,J,shearCenterZ:0,elasticShearCenterZ:0,complianceVV:energy,complianceVT:0,complianceTT:1/J,points,cells:[],at,residual:0,method:'圆/环截面圣维南解析场',nodes:0};
  }
  const vertices=contours.flat(),D=Math.max(profile.top-profile.bottom,...vertices.map(q=>q[1]))-Math.min(0,...vertices.map(q=>q[1]));
  const norm=contours.map(c=>c.map(([y,z])=>[y/D,z/D] as [number,number]));
  const unique=(v:number[])=>[...new Set(v)].sort((a,b)=>a-b),ys=subdivide(unique(norm.flat().map(q=>q[0])),1/(12*refinement)),zs=subdivide(unique(norm.flat().map(q=>q[1])),1/(12*refinement));
  const nodeIndex=new Map<string,number>(),nodes:[number,number][]=[],elements:{ids:number[];iy:number;iz:number;hy:number;hz:number}[]=[],lookup=new Map<string,number>();
  const node=(i:number,j:number,y:number,z:number)=>{const k=`${i},${j}`;let id=nodeIndex.get(k);if(id===undefined){id=nodes.length;nodes.push([y,z]);nodeIndex.set(k,id);}return id;};
  for(let j=0;j<zs.length-1;j++)for(let i=0;i<ys.length-1;i++)if(inside((ys[i]+ys[i+1])/2,(zs[j]+zs[j+1])/2,norm)) {
    const ids:number[]=[],hy=ys[i+1]-ys[i],hz=zs[j+1]-zs[j];for(let b=0;b<3;b++)for(let a=0;a<3;a++)ids.push(node(2*i+a,2*j+b,ys[i]+hy*a/2,zs[j]+hz*b/2));lookup.set(`${i},${j}`,elements.length);elements.push({ids,iy:i,iz:j,hy,hz});
  }
  if(elements.length>4000||!elements.length)return {ok:false,reason:'截面网格超出交互求解范围，请调整极端尺寸'};
  const rows=nodes.map(()=>new Map<number,number>()),fw=new Float64Array(nodes.length),fs=new Float64Array(nodes.length),weights=new Float64Array(nodes.length),I=p.Iz/D**4;
  const d=(y:number,z:number)=>[nu*(y*y-z*z)/(4*(1+nu)*I),nu*y*z/(2*(1+nu)*I)];
  for(const el of elements)for(const [u,wu] of gauss)for(const [v,wv] of gauss) {
    const {N,Y,Z}=shape(u,v,el.hy,el.hz),y=ys[el.iy]+(u+1)*el.hy/2,z=zs[el.iz]+(v+1)*el.hz/2,w=wu*wv*el.hy*el.hz/4,[dy,dz]=d(y,z);
    el.ids.forEach((a,i)=>{fw[a]+=w*(Y[i]*z-Z[i]*y);fs[a]+=w*(Y[i]*dy+Z[i]*dz+N[i]*y/I);weights[a]+=w*N[i];el.ids.forEach((b,j)=>rows[a].set(b,(rows[a].get(b)??0)+w*(Y[i]*Y[j]+Z[i]*Z[j])));});
  }
  const warp=solve(rows,fw),shear=solve(rows,fs),residual=Math.max(warp.residual,shear.residual);
  if(!Number.isFinite(residual)||residual>1e-7)return {ok:false,reason:'截面求解未收敛，不输出近似为零的扭转或剪应力'};
  const area=weights.reduce((s,w)=>s+w,0),mean=dot(warp.x,weights)/area;warp.x.forEach((v,i)=>warp.x[i]=v-mean);
  const sample=(el:typeof elements[number],u:number,v:number)=>{const {N,Y,Z}=shape(u,v,el.hy,el.hz);let wy=0,wz=0,sy=0,sz=0,omega=0;el.ids.forEach((id,i)=>{wy+=Y[i]*warp.x[id];wz+=Z[i]*warp.x[id];sy+=Y[i]*shear.x[id];sz+=Z[i]*shear.x[id];omega+=N[i]*warp.x[id];});const y=ys[el.iy]+(u+1)*el.hy/2,z=zs[el.iz]+(v+1)*el.hz/2,[dy,dz]=d(y,z);return {y:y*D,z:z*D,vy:(sy-dy)/D**2,vz:(sz-dz)/D**2,ty:(wy-z)*D,tz:(wz+y)*D,omega:omega*D**2};};
  const points:SectionShearPoint[]=[];let J=0,tv=0;
  const cells:[number,number][][]=[];
  for(const el of elements){cells.push([0,2,8,6].map(i=>nodes[el.ids[i]].map(a=>a*D) as [number,number]));for(const [u,wu] of gauss)for(const [v,wv] of gauss){const q=sample(el,u,v),weight=wu*wv*el.hy*el.hz*D*D/4;J+=weight*(q.ty*q.ty+q.tz*q.tz);tv+=weight*(q.y*q.vz-q.z*q.vy);points.push({...q,weight});}}
  if(!(J>0&&Number.isFinite(J)))return {ok:false,reason:'截面抗扭刚度无效'};
  // 单位横剪场减去其自身扭矩：确保其对形心合矩为 0。
  const normalize=(q:Omit<SectionShearPoint,'weight'>)=>({...q,ty:q.ty/J,tz:q.tz/J,vy:q.vy-tv*q.ty/J,vz:q.vz-tv*q.tz/J});
  let cvv=0,cvt=0,ctt=0;
  for(let i=0;i<points.length;i++){const q=normalize(points[i]),w=points[i].weight;points[i]={...q,weight:w};cvv+=w*(q.vy*q.vy+q.vz*q.vz);cvt+=w*(q.vy*q.ty+q.vz*q.tz);ctt+=w*(q.ty*q.ty+q.tz*q.tz);}
  // 单元边缘采样保留各侧极值，不将凹角两侧的应力平均抹平。
  for(const el of elements)for(const u of [-1,0,1])for(const v of [-1,0,1])points.push({...normalize(sample(el,u,v)),weight:0});
  const bracket=(a:number[],x:number)=>{if(x<a[0]-1e-9||x>a.at(-1)!+1e-9)return -1;let lo=0,hi=a.length-1;while(hi-lo>1){const m=(hi+lo)>>1;if(x<a[m])hi=m;else lo=m;}return Math.min(lo,a.length-2);};
  const at=(y:number,z:number)=>{const i=bracket(ys,y/D),j=bracket(zs,z/D);for(const a of [i,i-1])for(const b of [j,j-1]){const index=lookup.get(`${a},${b}`);if(index===undefined)continue;const el=elements[index],u=2*(y/D-ys[a])/el.hy-1,v=2*(z/D-zs[b])/el.hz-1;if(Math.abs(u)<=1+1e-8&&Math.abs(v)<=1+1e-8)return normalize(sample(el,u,v));}return null;};
  if([J,cvv,cvt,ctt,...points.flatMap(q=>[q.vy,q.vz,q.ty,q.tz,q.omega])].some(v=>!Number.isFinite(v)))return {ok:false,reason:'截面场数值溢出'};
  return {ok:true,J,shearCenterZ:cvt*J,elasticShearCenterZ:-tv,complianceVV:cvv,complianceVT:cvt,complianceTT:ctt,points,cells,at,residual,method:'Q2 九节点截面有限元 · 自由翘曲',nodes:nodes.length};
}
