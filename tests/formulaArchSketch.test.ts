import {describe,it,expect} from 'vitest';
import {FORMULA_BEAM_CALCULATORS} from '../mechanics/formulaBeamCalculators';
import {buildFormulaArchSketch} from '../mechanics/formulaArchSketch';
const ids=Object.keys(FORMULA_BEAM_CALCULATORS).filter(id=>id.startsWith('arch-'));
const defaults=(id:string)=>Object.fromEntries(FORMULA_BEAM_CALCULATORS[id].inputs.map(f=>[f.key,f.default]));
const model=(id:string,p:Record<string,number>={})=>buildFormulaArchSketch(id,{...defaults(id),...p})!;
describe('教材式抛物线拱内力与当前计算器保持一致',()=>{
 for(const id of ids){
  it(`${id} 支座整体平衡与拱脚边界`,()=>{
   const a=model(id),W=a.distributed?(a.distributed.to-a.distributed.from)*a.distributed.value:0,P=a.point?.value??0;
   expect(a.leftReaction+a.rightReaction).toBeCloseTo(W+P,9);
   expect(a.rightReaction*a.length).toBeCloseTo(W*((a.distributed?.to??0)/2)+P*(a.point?.x??0),9);
   expect(a.sectionAt(0).moment).toBeCloseTo(0,9);expect(a.sectionAt(a.length,'left').moment).toBeCloseTo(0,9);
   if(a.kind==='three-hinged')expect(a.sectionAt(a.length/2).moment).toBeCloseTo(0,9);
  });
  it(`${id} 局部力分解、dM/ds=V 与力矩截面平衡`,()=>{
   const a=model(id),x=a.length*.317,e=a.length*1e-6,s=a.sectionAt(x),norm=Math.hypot(1,s.slope);
   expect((a.sectionAt(x+e).moment-a.sectionAt(x-e).moment)/(2*e*norm)).toBeCloseTo(s.shear,6);
   expect(s.normal).toBeCloseTo(-(a.thrust+s.verticalShear*s.slope)/norm,8);
   expect(s.shear).toBeCloseTo((s.verticalShear-a.thrust*s.slope)/norm,8);
   expect(Math.hypot(s.normal,s.shear)).toBeCloseTo(Math.hypot(a.thrust,s.verticalShear),8);
  });
  it(`${id} 荷载倍增时内力同步，零载荷不出现虚构内力`,()=>{
   const p=defaults(id),key='P' in p?'P':'w';const a=model(id),twice=model(id,{[key]:p[key]*2}),zero=model(id,{[key]:0});
   for(const x of [0,a.length*.25,a.length*.5,a.length*.75,a.length])for(const field of ['normal','shear','moment'] as const){expect(twice.sectionAt(x)[field]).toBeCloseTo(a.sectionAt(x)[field]*2,8);expect(zero.sectionAt(x)[field]).toBe(0);}
  });
 }
 it('三铰拱跨中荷载：四分点负弯矩、拱顶剪力跃变与计算器结果一致',()=>{
  const a=model('arch-3hinge-center',{P:100,L:20,f:5});
  expect(a.thrust).toBe(100);expect(a.sectionAt(5).moment).toBe(-125);expect(a.sectionAt(15).moment).toBe(-125);
  expect(a.sectionAt(10,'left').shear).toBe(50);expect(a.sectionAt(10,'right').shear).toBe(-50);expect(a.sectionAt(10).normal).toBe(-100);
 });
 it('半跨均布载荷：左右四分点弯矩等幅反号，局部剪力不同于竖向剪力',()=>{
  const a=model('arch-half-uniform',{w:10,L:20,f:5});
  expect(a.distributed?.to).toBe(10);expect(a.leftReaction).toBe(75);expect(a.rightReaction).toBe(25);expect(a.thrust).toBe(50);
  expect(a.sectionAt(5).moment).toBe(62.5);expect(a.sectionAt(15).moment).toBe(-62.5);
  expect(a.sectionAt(0).shear).toBeCloseTo(25/Math.sqrt(2));expect(a.sectionAt(0).verticalShear).toBe(75);
 });
 it('三种满跨均布压力拱 M=V=0，但轴向压力随位置变化',()=>{
  for(const id of ['arch-3hinge-uniform','arch-2hinge-uniform','arch-fixed-uniform']){
   const a=model(id);expect(a.sectionAt(4).moment).toBe(0);expect(a.sectionAt(4).shear).toBe(0);
   expect(a.sectionAt(10).normal).toBe(-100);expect(a.sectionAt(0).normal).toBeCloseTo(-Math.hypot(100,100));
  }
 });
 it('矢高改变会更新推力、坡度和轴力，不伪造非零满跨均布弯矩',()=>{
  const a=model('arch-half-uniform',{f:2.5});expect(a.thrust).toBe(100);expect(a.sectionAt(0).slope).toBe(.5);expect(a.sectionAt(5).moment).toBeCloseTo(62.5);
 });
 it('无效尺寸、负荷载和非拱条目不生成图',()=>{
  for(const p of [{f:0},{L:0},{w:-1},{f:NaN}])expect(buildFormulaArchSketch('arch-half-uniform',{...defaults('arch-half-uniform'),...p})).toBeNull();
  expect(buildFormulaArchSketch('ss-uniform',defaults('ss-uniform'))).toBeNull();
 });
});
