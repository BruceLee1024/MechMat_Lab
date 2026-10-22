import type {StudyParams,StudyOutput} from './formulaStudies';
export interface SceneLoad {label:string;value:number;unit:string;position:number;type:'force'|'moment'|'distributed'}
interface BaseScene {title:string;note:string;gain:number;loads:SceneLoad[]}
export type FormulaScene=BaseScene&(
 |{kind:'shear';height:number;shiftMm:number;gamma:number;tau:number}
 |{kind:'compatibility';length1:number;length2:number;uMm:number;force1:number;force2:number}
 |{kind:'torsion';length:number;radius:number;phi:number;rho:number;tau:number;twistAt:(t:number)=>number}
 |{kind:'section';width:number;height:number;pointY:number;pointStress:number;stressAt:(y:number)=>number;shear:boolean}
 |{kind:'beam';length:number;support:'cantilever'|'simply-supported';deflectionAt:(t:number)=>number;point:number;pointDeflection:number}
);
export const FORMULA_SCENE_IDS=['shear-stress','statically-indeterminate','torsion-basic','bending-stress','shear-stress-beam','combined','deflection','deflection-common','energy-method'] as const;
export function buildFormulaScene(id:string,p:StudyParams,r:StudyOutput,gain:number):FormulaScene|null{
 if(!Number.isFinite(gain)||gain<=0)return null;
 const load=(label:string,value:number,unit:string,position:number,type:SceneLoad['type']='force'):SceneLoad=>({label,value,unit,position,type});
 const nonzero=(loads:SceneLoad[])=>loads.filter(l=>l.value!==0);
 if(id==='shear-stress')return {kind:'shear',title:'简单剪切 · 层间相对运动',gain,height:p.h,shiftMm:r.values.slip,gamma:r.values.gamma,tau:r.values.tau,loads:nonzero([load('V',p.V,'kN',1)]),note:'四个面上的箭头表示互等剪应力方向；变形放大，应力按初始构形示意。'};
 if(id==='statically-indeterminate')return {kind:'compatibility',title:'双端固定 · 平衡与协调',gain,length1:p.L1,length2:p.L2,uMm:r.values.u,force1:r.values.N1,force2:r.values.N2,loads:nonzero([load('Rₐ',r.values.RA,'N',0),load('P',p.P*1000,'N',p.L1/(p.L1+p.L2)),load('Rᵦ',r.values.RB,'N',1)]),note:'端点保持固定，节点右移时左段伸长、右段缩短；轴力以拉为正。'};
 if(id==='torsion-basic')return {kind:'torsion',title:'圆轴扭转 · 截面相对转角',gain,length:p.L,radius:p.R,rho:p.rho,phi:r.values.phi,tau:r.values.tau,twistAt:t=>r.values.phi*t,loads:nonzero([load('T',-p.T,'N·m',0,'moment'),load('T',p.T,'N·m',1,'moment')]),note:'两端扭矩互相平衡，纵向母线随计算转角旋转；长径比为示意，转角单独放大。'};
 if(['bending-stress','shear-stress-beam','combined'].includes(id)){
  const shear=id==='shear-stress-beam',I=p.b*p.h**3/12,A=p.b*p.h;
  const stressAt=shear?(y:number)=>1.5*p.V*1000/A*(1-4*y*y/p.h**2):(y:number)=>(id==='combined'?p.N*1000/A:0)+p.M*1e6*y/I;
  return {kind:'section',title:shear?'矩形截面 · 剪应力分布':id==='combined'?'轴向与弯曲 · 正应力叠加':'矩形截面 · 拉压分区',gain,width:p.b,height:p.h,pointY:p.y,pointStress:stressAt(p.y),stressAt,shear,loads:nonzero([load(shear?'V':'M',shear?p.V:p.M,shear?'kN':'kN·m',1,shear?'force':'moment')]),note:shear?'矩形截面中性轴剪应力最大，上下自由边剪应力为零。':id==='combined'?'箭头只表示合成正应力；给定剪应力 τ 仍仅用于所选点的等效应力计算。':'右侧箭头表示该截面上的正应力，向右为拉、向左为压；纵坐标 y 向上为正。'};
 }
 if(['deflection','deflection-common','energy-method'].includes(id)){
  const length=id==='deflection'?p.L:p.L*1000;
  const support=id==='deflection-common'&&p.case!==0?'simply-supported':'cantilever';
  let deflectionAt:(t:number)=>number;
  if(id==='deflection')deflectionAt=t=>r.values.kappa*(t*length)**2/2;
  else if(id==='energy-method'||p.case===0){const delta=id==='energy-method'?r.values.delta:r.values.v;deflectionAt=t=>delta*t*t*(3-t)/2;}
  else if(p.case===1)deflectionAt=t=>{const s=Math.min(t,1-t);return r.values.v*s*(3-4*s*s);};
  else deflectionAt=t=>r.values.v*16/5*t*(1-2*t*t+t**3);
  const point=id==='deflection'?p.x/length:support==='cantilever'?1:.5;
  const loads=id==='deflection'?[load('M',p.M,'kN·m',1,'moment')]:id==='deflection-common'&&p.case===2?[load('q',p.q,'kN/m',.5,'distributed')]:[load('P',p.P,'kN',support==='cantilever'?1:.5)];
  return {kind:'beam',title:id==='energy-method'?'悬臂梁 · 能量法求位移':support==='cantilever'?'悬臂梁 · 载荷与变形':'简支梁 · 载荷与变形',gain,length,support,deflectionAt,point,pointDeflection:deflectionAt(point),loads:nonzero(loads),note:'支座用工程简图表示；长度按轴向坐标绘制，竖向挠度按所选倍率放大，读数不放大。'};
 }
 return null;
}
