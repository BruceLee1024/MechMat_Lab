import {FORMULA_BEAM_CALCULATORS} from './formulaBeamCalculators';

export type SectionSide='left'|'right';
export interface ArchSectionValues {height:number;slope:number;verticalShear:number;normal:number;shear:number;moment:number}
export interface FormulaArchSketch {
 length:number;rise:number;kind:'three-hinged'|'two-hinged'|'fixed';
 leftReaction:number;rightReaction:number;thrust:number;
 distributed:{from:number;to:number;value:number}|null;
 point:{x:number;value:number}|null;
 breaks:number[];
 sectionAt:(x:number,side?:SectionSide)=>ArchSectionValues;
}

/** 抛物线拱；显示单位为 kN、m、kN·m。N 拉正压负，V=V₀cosφ−Hsinφ，M=M₀−Hy。 */
export function buildFormulaArchSketch(id:string,p:Record<string,number>):FormulaArchSketch|null {
 if(!['arch-3hinge-uniform','arch-3hinge-center','arch-half-uniform','arch-2hinge-uniform','arch-fixed-uniform'].includes(id))return null;
 const config=FORMULA_BEAM_CALCULATORS[id];if(config.validate(p))return null;
 const {L,f,w=0,P=0}=p;
 const rows=config.calculate(p),half=id==='arch-half-uniform',center=id==='arch-3hinge-center';
 const leftReaction=rows[half?1:0].value,rightReaction=rows[half?2:0].value,thrust=rows[half?0:1].value;
 const kind=id==='arch-fixed-uniform'?'fixed':id==='arch-2hinge-uniform'?'two-hinged':'three-hinged';
 const distributed=center?null:{from:0,to:half?L/2:L,value:w};
 const point=center?{x:L/2,value:P}:null;
 const sectionAt=(x:number,side:SectionSide='right'):ArchSectionValues=>{
  const t=Math.min(1,Math.max(0,x/L)),height=4*f*t*(1-t),slope=4*(f/L)*(1-2*t),norm=Math.hypot(1,slope);
  const d=distributed?Math.min(t*L,distributed.to):0;
  const appliedPoint=point&&(x>point.x||x===point.x&&side==='right')?point.value:0;
  const verticalShear=leftReaction-(distributed?.value??0)*d-appliedPoint;
  // 全跨竖向均布载荷的抛物线压力拱在当前忽略轴向/剪切变形的模型下 M=V=0。
  const funicular=!half&&!center;
  const moment=funicular?0:leftReaction*x-(distributed?.value??0)*d*(x-d/2)-appliedPoint*(x-(point?.x??0))-thrust*height;
  const shear=funicular?0:(verticalShear-thrust*slope)/norm;
  const rawNormal=-(thrust/norm+verticalShear*(slope/norm));
  const normal=rawNormal===0?0:rawNormal;
  return {height,slope,verticalShear,normal,shear,moment};
 };
 const breaks=[0,L/4,L/2,3*L/4,L];
 if(![leftReaction,rightReaction,thrust,...breaks.flatMap(x=>Object.values(sectionAt(x)))].every(Number.isFinite))return null;
 return {length:L,rise:f,kind,leftReaction,rightReaction,thrust,distributed,point,breaks,sectionAt};
}
