import { describe,it,expect } from 'vitest';
import { changeSectionDimension,compareBendingSections,defaultExplorationSection,sectionDimensions } from '../mechanics/sectionExploration';
import { DEFAULT_STATE } from '../types';

describe('截面尺寸探索',()=>{
  const baseline={type:'rectangle' as const,width:100,height:150};
  const state={...DEFAULT_STATE,bendSection:{...baseline,height:300}};
  it('高度翻倍：惯性矩八倍、挠度减少87.5%、应力减少75%',()=>{
    const r=compareBendingSections(state,baseline)!;
    expect(r.inertiaRatio).toBeCloseTo(8,10);
    expect(r.deflectionChange).toBeCloseTo(-87.5,10);
    expect(r.stressChange).toBeCloseTo(-75,10);
  });
  it('宽度翻倍：惯性矩二倍、挠度和应力减半',()=>{
    const r=compareBendingSections({...state,bendSection:{...baseline,width:200}},baseline)!;
    expect(r.inertiaRatio).toBeCloseTo(2,10);
    expect(r.deflectionChange).toBeCloseTo(-50,10);
    expect(r.stressChange).toBeCloseTo(-50,10);
  });
  it('修改载荷、材料或跨度后两组仍用相同工况，不把外因混入尺寸对比',()=>{
    const a=compareBendingSections(state,baseline)!,b=compareBendingSections({...state,bendLoad:15000,bendModulus:68.9,bendLength:4,bendLoadPos:.8},baseline)!;
    expect(a.inertiaRatio).toBeCloseTo(b.inertiaRatio,10);
    expect(a.deflectionChange).toBeCloseTo(b.deflectionChange!,10);
    expect(a.stressChange).toBeCloseTo(b.stressChange!,10);
    expect(b.reference.E_MPa).toBe(68900);
    expect(b.reference.L_mm).toBe(4000);
  });
  it('零载荷不产生0/0或虚假的挠度百分比',()=>{
    const r=compareBendingSections({...state,bendLoad:0},baseline)!;
    expect(r.inertiaRatio).toBe(8);expect(r.deflectionChange).toBeNull();expect(r.stressChange).toBeNull();
  });
  it('宽高互换的影响仍按实际截面计算',()=>{
    const r=compareBendingSections({...state,bendSection:{type:'rectangle',width:150,height:100}},baseline)!;
    expect(r.inertiaRatio).toBeCloseTo(4/9,10);
    expect(r.deflectionChange).toBeCloseTo(125,10);
  });
  it('调节空心圆外径保持壁厚，调壁厚保持外径',()=>{
    const s={type:'hollow_circle' as const,outerRadius:50,innerRadius:40};
    expect(changeSectionDimension(s,'outerRadius',60)).toEqual({...s,outerRadius:60,innerRadius:50});
    expect(changeSectionDimension(s,'wallThickness',5)).toEqual({...s,innerRadius:45});
    expect(changeSectionDimension(s,'wallThickness',51)).toBeNull();
    expect(changeSectionDimension(s,'outerRadius',5)).toBeNull();
  });
  it('快捷调节不提交非法截面，槽钢壁厚/高度保持有效',()=>{
    expect(changeSectionDimension({type:'channel'},'channelFlange',50)).toBeNull();
    expect(changeSectionDimension({type:'i_beam'},'webThickness',200)).toBeNull();
    expect(changeSectionDimension(baseline,'height',0)).toBeNull();
    expect(changeSectionDimension(baseline,'height',NaN)).toBeNull();
  });
  it('所有截面都有可编辑尺寸，自定义截面保留面积与惯性矩的真实单位',()=>{
    for(const type of ['rectangle','circle','hollow_circle','i_beam','t_beam','channel','composite','custom'] as const){
      expect(sectionDimensions(defaultExplorationSection(type)).length).toBeGreaterThan(0);
    }
    expect(sectionDimensions({type:'custom'}).find(d=>d.key==='customIz')?.unit).toBe('mm⁴');
  });
});
