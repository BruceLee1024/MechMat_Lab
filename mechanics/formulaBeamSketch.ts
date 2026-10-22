import {FORMULA_BEAM_CALCULATORS} from './formulaBeamCalculators';
export interface SketchSupport {x:number;name:string;kind:'pinned'|'roller'|'fixed';reaction:number;clockwiseMoment:number}
export interface SketchDistributed {from:number;to:number;start:number;end:number;label:string}
export interface SketchDimension {from:number;to:number;label:string;row:number}
export interface FormulaBeamSketch {
 length:number;supports:SketchSupport[];points:{x:number;value:number;label:string}[];couples:{x:number;value:number;label:string}[];distributed:SketchDistributed[];dimensions:SketchDimension[];breaks:number[];
 shearAt:(x:number,side?:'left'|'right')=>number;momentAt:(x:number,side?:'left'|'right')=>number;
}
/** 显示边界使用 kN、m、kN·m。反力取向上为正，外加力偶取顺时针为正。 */
export function buildFormulaBeamSketch(id:string,p:Record<string,number>):FormulaBeamSketch|null{
 const config=FORMULA_BEAM_CALCULATORS[id];
 if(!config||id.startsWith('arch-')||config.validate(p))return null;
 const rows=config.calculate(p),v=rows.map(r=>r.value),{L,P=0,q=0,a=0,c=0,M=0}=p;
 let length=L;
 const supports:SketchSupport[]=[],points:FormulaBeamSketch['points']=[],couples:FormulaBeamSketch['couples']=[],distributed:SketchDistributed[]=[],dimensions:SketchDimension[]=[];
 const support=(x:number,name:string,kind:SketchSupport['kind'],reaction:number,clockwiseMoment=0)=>supports.push({x,name,kind,reaction,clockwiseMoment});
 const point=(x:number,value=P,label='P')=>points.push({x,value,label});
 const uniform=(from=0,to=L)=>distributed.push({from,to,start:q,end:q,label:'q'});
 const dim=(from:number,to:number,label:string,row=0)=>{if(to>from)dimensions.push({from,to,label,row});};
 const pair=(RA:number,RB:number)=>{support(0,'A','pinned',RA);support(L,'B','roller',RB);};
 switch(id){
  case 'ss-center':pair(v[0],v[0]);point(L/2);dim(0,L/2,'L/2');dim(L/2,L,'L/2');dim(0,L,'L',1);break;
  case 'ss-uniform':pair(v[0],v[0]);uniform();break;
  case 'ss-point':pair(v[0],v[1]);point(a);dim(0,a,'a');dim(a,L,'b');dim(0,L,'L',1);break;
  case 'ss-two-point':pair(v[0],v[0]);point(a);point(L-a);dim(0,a,'a');dim(a,L-a,'L − 2a');dim(L-a,L,'a');dim(0,L,'L',1);break;
  case 'ss-triangular':pair(v[0],v[1]);distributed.push({from:0,to:L,start:0,end:q,label:'q'});break;
  case 'ss-moment':pair(v[4],v[0]);couples.push({x:L,value:M,label:'M'});break;
  case 'ss-partial':pair(v[0],v[1]);uniform(a,a+c);dim(0,a,'a');dim(a,a+c,'c');dim(a+c,L,'b');dim(0,L,'L',1);break;
  case 'cant-end':support(0,'A','fixed',v[0],-v[1]);point(L);break;
  case 'cant-uniform':support(0,'A','fixed',v[0],-v[1]);uniform();break;
  case 'cant-point':support(0,'A','fixed',v[0],-v[1]);point(a);dim(0,a,'a');dim(a,L,'L − a');dim(0,L,'L',1);break;
  case 'cant-moment':support(0,'A','fixed',0,-M);couples.push({x:L,value:M,label:'M'});break;
  case 'cant-triangular':support(0,'A','fixed',v[0],-v[1]);distributed.push({from:0,to:L,start:q,end:0,label:'q'});break;
  case 'fixed-center':support(0,'A','fixed',v[0],-v[1]);support(L,'B','fixed',v[0],v[1]);point(L/2);break;
  case 'fixed-uniform':support(0,'A','fixed',v[0],-v[1]);support(L,'B','fixed',v[0],v[1]);uniform();break;
  case 'fixed-point':support(0,'A','fixed',v[0],-v[2]);support(L,'B','fixed',v[1],v[3]);point(a);dim(0,a,'a');dim(a,L,'b');dim(0,L,'L',1);break;
  case 'propped-center':support(0,'A','fixed',v[0],-v[2]);support(L,'B','roller',v[1]);point(L/2);break;
  case 'propped-uniform':support(0,'A','fixed',v[0],-v[2]);support(L,'B','roller',v[1]);uniform();break;
  case 'overhang':case 'overhang-uniform':
   length=L+a;pair(v[0],v[1]);if(id==='overhang')point(length);else uniform(L,length);
   dim(0,L,'L');dim(L,length,'a');dim(0,length,'L + a',1);break;
  case 'continuous':
   length=2*L;support(0,'A','pinned',v[0]);support(L,'B','roller',v[1]);support(2*L,'C','roller',v[0]);uniform(0,length);
   dim(0,L,'L');dim(L,2*L,'L');dim(0,2*L,'2L',1);break;
  default:return null;
 }
 if(!Number.isFinite(length)||length<=0)return null;
 if(!dimensions.length)dim(0,length,'L');
 // 重合集中力合并画出，保持总荷载，避免两支箭头完全遮盖。
 const merged:typeof points=[];
 for(const f of points){const same=merged.find(g=>g.x===f.x);if(same){same.value+=f.value;same.label='2P';}else merged.push({...f});}
 const distributedEffect=(load:SketchDistributed,x:number)=>{
  const d=load.to-load.from;if(d<=0)return {force:0,moment:0};
  const t=Math.min(d,Math.max(0,x-load.from)),k=(load.end-load.start)/d,dx=x-load.from;
  return {force:load.start*t+k*t*t/2,moment:load.start*(dx*t-t*t/2)+k*(dx*t*t/2-t**3/3)};
 };
 const included=(position:number,x:number,side:'left'|'right')=>position<x||side==='right'&&position===x;
 const shearAt=(x:number,side:'left'|'right'='right')=>supports.reduce((n,s)=>n+(included(s.x,x,side)?s.reaction:0),0)-merged.reduce((n,f)=>n+(included(f.x,x,side)?f.value:0),0)-distributed.reduce((n,d)=>n+distributedEffect(d,x).force,0);
 const momentAt=(x:number,side:'left'|'right'='right')=>supports.reduce((n,s)=>n+(included(s.x,x,side)?s.reaction*(x-s.x)+s.clockwiseMoment:0),0)-merged.reduce((n,f)=>n+(included(f.x,x,side)?f.value*(x-f.x):0),0)+couples.reduce((n,f)=>n+(included(f.x,x,side)?f.value:0),0)-distributed.reduce((n,d)=>n+distributedEffect(d,x).moment,0);
 const breaks=Array.from(new Set([0,length,...supports.map(s=>s.x),...merged.map(s=>s.x),...couples.map(s=>s.x),...distributed.flatMap(d=>[d.from,d.to])])).sort((a,b)=>a-b);
 const test=breaks.flatMap(x=>[shearAt(x,'left'),shearAt(x,'right'),momentAt(x,'left'),momentAt(x,'right')]);
 if(test.some(n=>!Number.isFinite(n)))return null;
 return {length,supports,points:merged,couples,distributed,dimensions,breaks,shearAt,momentAt};
}
