import {describe,it,expect} from 'vitest';
import {FORMULA_BEAM_CALCULATORS} from '../mechanics/formulaBeamCalculators';
import {buildFormulaBeamSketch} from '../mechanics/formulaBeamSketch';
const defaults=(id:string)=>Object.fromEntries(FORMULA_BEAM_CALCULATORS[id].inputs.map(f=>[f.key,f.default]));
const model=(id:string,p:Record<string,number>={})=>{const m=buildFormulaBeamSketch(id,{...defaults(id),...p});if(!m)throw Error(id);return m;};
describe('教材式梁简图采用真实支点、荷载与尺寸',()=>{
 it('外伸梁只有右侧外伸，L 标支座间距，a 标悬臂段',()=>{const m=model('overhang-uniform',{L:6,a:2,q:5});expect(m.length).toBe(8);expect(m.supports.map(s=>s.x)).toEqual([0,6]);expect(m.supports.map(s=>s.kind)).toEqual(['pinned','roller']);expect(m.distributed).toEqual([{from:6,to:8,start:5,end:5,label:'q'}]);expect(m.dimensions.filter(d=>d.row===0).map(d=>[d.from,d.to,d.label])).toEqual([[0,6,'L'],[6,8,'a']]);});
 it('外伸均布梁满足左反力向下、右支座负弯矩和自由端零内力',()=>{const m=model('overhang-uniform',{L:6,a:2,q:5});expect(m.supports[0].reaction).toBeCloseTo(-5/3);expect(m.supports[1].reaction).toBeCloseTo(35/3);expect(m.shearAt(3)).toBeCloseTo(-5/3);expect(m.shearAt(6,'left')).toBeCloseTo(-5/3);expect(m.shearAt(6,'right')).toBeCloseTo(10);expect(m.momentAt(6)).toBeCloseTo(-10);expect(m.momentAt(7)).toBeCloseTo(-2.5);expect(m.momentAt(8)).toBeCloseTo(0);expect(m.shearAt(8)).toBeCloseTo(0);});
 it('外伸跨比变化会更新荷载区间，不保留无载左悬臂',()=>{const a=model('overhang-uniform',{L:3,a:6});expect(a.supports[0].x).toBe(0);expect(a.supports[1].x/a.length).toBeCloseTo(1/3);expect(a.distributed[0].from).toBe(3);expect(a.distributed[0].to).toBe(9);});
 it('三角形荷载的大小端与计算器一致',()=>{expect(model('ss-triangular').distributed[0].start).toBe(0);expect(model('ss-triangular').distributed[0].end).toBe(10);expect(model('cant-triangular').distributed[0].start).toBe(10);expect(model('cant-triangular').distributed[0].end).toBe(0);});
 it('连续梁 L 为单跨，支点不误画成内部铰',()=>{const m=model('continuous',{L:4});expect(m.length).toBe(8);expect(m.supports.map(s=>s.x)).toEqual([0,4,8]);expect(m.momentAt(4)).toBeCloseTo(-10);expect(m.dimensions.filter(d=>d.row===0).map(d=>d.label)).toEqual(['L','L']);});
 for(const id of Object.keys(FORMULA_BEAM_CALCULATORS).filter(id=>!id.startsWith('arch-')))it(`${id} 满足整体平衡及剪力弯矩微分关系`,()=>{
  const m=model(id),loads=m.distributed.map(d=>({force:(d.start+d.end)*(d.to-d.from)/2,moment:(d.to-d.from)*(d.start*(2*d.from+d.to)+d.end*(d.from+2*d.to))/6}));
  const force=m.supports.reduce((n,s)=>n+s.reaction,0)-m.points.reduce((n,p)=>n+p.value,0)-loads.reduce((n,l)=>n+l.force,0);
  const moment=m.supports.reduce((n,s)=>n+s.reaction*s.x-s.clockwiseMoment,0)-m.points.reduce((n,p)=>n+p.value*p.x,0)-loads.reduce((n,l)=>n+l.moment,0)-m.couples.reduce((n,c)=>n+c.value,0);
  expect(force).toBeCloseTo(0,8);expect(moment).toBeCloseTo(0,8);
  const x=m.length*.413,eps=m.length*1e-5;
  if(!m.breaks.some(b=>Math.abs(b-x)<eps*3))expect((m.momentAt(x+eps)-m.momentAt(x-eps))/(2*eps)).toBeCloseTo(m.shearAt(x),5);
  const p=defaults(id);for(const k of ['P','q','M'])if(k in p)p[k]=0;const zero=buildFormulaBeamSketch(id,p)!;expect(zero.momentAt(m.length*.45)).toBe(0);expect(zero.shearAt(m.length*.45)).toBe(0);
 });
 it('无效几何不生成误导图形，拱保留独立模型',()=>{expect(buildFormulaBeamSketch('overhang-uniform',{...defaults('overhang-uniform'),L:0})).toBeNull();expect(buildFormulaBeamSketch('arch-3hinge-uniform',defaults('arch-3hinge-uniform'))).toBeNull();});
});

describe('图示关键截面与计算器弯矩读数一致',()=>{
 const cases:[string,(p:Record<string,number>)=>number,number,number][]=[
  ['ss-center',p=>p.L/2,1,1],['ss-uniform',p=>p.L/2,1,1],['ss-point',p=>p.a,2,1],['ss-two-point',p=>p.L/2,1,1],['ss-triangular',p=>p.L/Math.sqrt(3),2,1],
  ['cant-end',()=>0,1,-1],['cant-uniform',()=>0,1,-1],['cant-point',()=>0,1,-1],['cant-triangular',()=>0,1,-1],
  ['fixed-center',()=>0,1,-1],['fixed-center',p=>p.L/2,2,1],['fixed-uniform',()=>0,1,-1],['fixed-uniform',p=>p.L/2,2,1],
  ['fixed-point',()=>0,2,-1],['fixed-point',p=>p.L,3,-1],['propped-center',()=>0,2,-1],['propped-center',p=>p.L/2,3,1],['propped-uniform',()=>0,2,-1],['propped-uniform',p=>5*p.L/8,3,1],
  ['overhang',p=>p.L,2,1],['overhang-uniform',p=>p.L,2,1],['continuous',p=>p.L,2,1],['continuous',p=>3*p.L/8,3,1],
 ];
 for(const [id,position,index,sign] of cases)it(`${id} 在对应截面保留内力正负号`,()=>{
  for(const multiplier of [1,1.73]){const p=defaults(id);for(const key of ['P','q','L','a','c'])if(key in p)p[key]*=multiplier;
   const a=buildFormulaBeamSketch(id,p)!,x=position(p),rows=FORMULA_BEAM_CALCULATORS[id].calculate(p);
   expect(a.momentAt(x,x===a.length?'left':'right')).toBeCloseTo(sign*rows[index].value,7);
  }
 });
 it('端部力矩在自由端左侧取值，不能取梁外的零弯矩',()=>{
  const p=defaults('cant-moment'),m=model('cant-moment');expect(m.momentAt(p.L,'left')).toBe(-p.M);expect(m.momentAt(p.L,'right')).toBe(0);
 });
 it('部分均布梁零剪力截面与最大弯矩位置对应',()=>{
  const p=defaults('ss-partial'),a=model('ss-partial'),r=FORMULA_BEAM_CALCULATORS['ss-partial'].calculate(p);
  expect(a.shearAt(r[2].value)).toBeCloseTo(0);expect(a.momentAt(r[2].value)).toBeCloseTo(r[3].value);
 });
});
