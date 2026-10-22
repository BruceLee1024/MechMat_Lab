import type { SectionProperties, SectionType, SimulationState } from '../types';
import { SECTION_FIELDS, validateSection } from './sections';
import { calculateBendingTeaching } from './calculations';

export const SECTION_NAMES: Record<SectionType,string> = {rectangle:'矩形',circle:'圆形',hollow_circle:'空心圆',i_beam:'工字钢',t_beam:'T 型',channel:'槽钢',composite:'组合截面',custom:'自定义'};
export type DimensionKey = Exclude<keyof SectionProperties,'type'> | 'wallThickness';
export interface SectionDimension { key: DimensionKey; label: string; value: number; unit: string; minimum: number; maximum?: number }

export function sectionDimensions(s: SectionProperties): SectionDimension[] {
  if(s.type==='hollow_circle') {
    const outer=s.outerRadius??50,inner=s.innerRadius??40;
    return [{key:'outerRadius',label:'外半径 R',value:outer,unit:'mm',minimum:outer-inner}, {key:'wallThickness',label:'壁厚 t',value:outer-inner,unit:'mm',minimum:Math.min(.1,(outer-inner)/10),maximum:outer}];
  }
  return SECTION_FIELDS[s.type].map(field=>{
    const value=s[field.key]??field.defaultValue;
    let minimum=field.allowZero?0:Math.min(.1,value/10),maximum:number|undefined;
    if(field.key==='webThickness')maximum=s.flangeWidth??100;
    if(field.key==='flangeWidth')minimum=s.webThickness??6;
    if(field.key==='tWebThickness')maximum=s.tFlangeWidth??100;
    if(field.key==='tFlangeWidth')minimum=s.tWebThickness??8;
    if(field.key==='channelWeb')maximum=(s.channelWidth??50)*.999;
    if(field.key==='channelWidth')minimum=(s.channelWeb??5)*1.001;
    if(field.key==='channelFlange')maximum=(s.channelHeight??100)*.499;
    if(field.key==='channelHeight')minimum=(s.channelFlange??8)*2.001;
    return {key:field.key,label:field.label.replace(/\s*\(.*\)/,''),value,unit:field.key==='customArea'?'mm²':['customIz','customIy'].includes(field.key)?'mm⁴':'mm',minimum,maximum};
  });
}

export function changeSectionDimension(section:SectionProperties,key:DimensionKey,value:number):SectionProperties|null {
  if(!Number.isFinite(value))return null;
  let next:SectionProperties;
  if(key==='wallThickness'&&section.type==='hollow_circle') next={...section,innerRadius:(section.outerRadius??50)-value};
  else if(key==='outerRadius'&&section.type==='hollow_circle') next={...section,outerRadius:value,innerRadius:value-((section.outerRadius??50)-(section.innerRadius??40))};
  else if(SECTION_FIELDS[section.type].some(field=>field.key===key))next={...section,[key]:value};
  else return null;
  return validateSection(next)?null:next;
}

export function defaultExplorationSection(type:SectionType):SectionProperties {
  return Object.fromEntries([['type',type],...SECTION_FIELDS[type].map(field=>[field.key,field.defaultValue])]) as unknown as SectionProperties;
}

/** 只冻结基准截面，其余工况始终取当前值，避免把材料或载荷变化误算成截面影响。 */
export function compareBendingSections(state:SimulationState,baseline:SectionProperties) {
  const common={materialName:state.materialName,yieldStrength:state.materialYield,modulus:state.bendModulus,load:state.bendLoad,length:state.bendLength,position:state.bendLoadPos};
  const current=calculateBendingTeaching({...common,section:state.bendSection}),reference=calculateBendingTeaching({...common,section:baseline});
  if(current.ok===false||reference.ok===false)return null;
  const a=current.values,b=reference.values;
  return {current:a,reference:b,inertiaRatio:a.inertia/b.inertia,deflectionChange:Math.abs(b.maxDeflection)>0?(Math.abs(a.maxDeflection/b.maxDeflection)-1)*100:null,stressChange:a.maxStress!==null&&b.maxStress!==null&&b.maxStress>0?(a.maxStress/b.maxStress-1)*100:null,extrapolated:a.extrapolated||b.extrapolated};
}
