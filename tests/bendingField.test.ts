import { describe, it, expect } from 'vitest';
import { bendingStation, maximumBendingDeflection, type BendingField } from '../mechanics/bendingField';
import { calculateBending, calculateBendingTeaching } from '../mechanics/calculations';
import { getCalculationContext } from '../mechanics/aiContext';
import { DEFAULT_STATE } from '../types';

const f: BendingField = { load: 1000, lengthMm: 2000, positionMm: 500, modulusMPa: 200000, inertia: 100*200**3/12 };
describe('梁三维挠曲线的计算依据', () => {
  it('跨中加载为 PL³/(48EI)，支座挠度为零', () => {
    const centered = { ...f, positionMm: 1000 };
    expect(bendingStation(centered,1000).deflection).toBeCloseTo(1000*2000**3/(48*f.modulusMPa*f.inertia),12);
    expect(bendingStation(f,0).deflection).toBe(0);
    expect(bendingStation(f,2000).deflection).toBe(0);
  });
  it('偏心载荷点与原计算结果一致，但最大挠度不在载荷点', () => {
    const r = calculateBending({ load: 1000, length: 2, position: .5, modulus: 200, section: { type:'rectangle', width:100, height:200 } });
    if (!r.ok) throw new Error('无效工况');
    expect(bendingStation(f,500).deflection).toBeCloseTo(r.values.deflectionAtLoad,12);
    const peak = maximumBendingDeflection(f);
    expect(peak.xMm).toBeCloseTo(2000-Math.sqrt((2000**2-500**2)/3),10);
    expect(peak.deflection).toBeGreaterThan(r.values.deflectionAtLoad);
    expect(bendingStation(f,peak.xMm).slope).toBeCloseTo(0,12);
  });
  it('载荷点处挠度、转角、弯矩连续，剪力跳跃等于载荷', () => {
    const l=bendingStation(f,500-1e-5), r=bendingStation(f,500+1e-5), c=bendingStation(f,500);
    expect(l.deflection).toBeCloseTo(r.deflection,8);
    expect(l.slope).toBeCloseTo(r.slope,10);
    expect(l.moment).toBeCloseTo(r.moment,1);
    expect(c.shearLeft-c.shearRight).toBe(f.load);
    expect(c.moment).toBe(375000);
  });
  it('材料 E 减半或截面 I 减半，整条曲线挠度翻倍，内力不变', () => {
    for (const x of [200,500,900,1600]) {
      const base=bendingStation(f,x), soft=bendingStation({...f,modulusMPa:f.modulusMPa/2},x), weak=bendingStation({...f,inertia:f.inertia/2},x);
      expect(soft.deflection).toBeCloseTo(2*base.deflection,12);
      expect(weak.deflection).toBeCloseTo(2*base.deflection,12);
      expect(soft.moment).toBe(base.moment);
    }
  });
  it('左右对称、向上载荷、支座端点与零载荷均一致', () => {
    expect(bendingStation({...f,positionMm:1500},1500).deflection).toBeCloseTo(bendingStation(f,500).deflection,12);
    expect(bendingStation({...f,load:-1000},500).deflection).toBe(-bendingStation(f,500).deflection);
    for (const positionMm of [0,2000]) expect(maximumBendingDeflection({...f,positionMm}).deflection).toBe(0);
    expect(maximumBendingDeflection({...f,load:0}).deflection).toBe(0);
  });
  it('曲率与弯矩满足 w″=−M/EI', () => {
    for (const x of [250,800,1500]) {
      const dx=.1, second=(bendingStation(f,x+dx).slope-bendingStation(f,x-dx).slope)/(2*dx);
      expect(second).toBeCloseTo(-bendingStation(f,x).moment/(f.modulusMPa*f.inertia),12);
    }
  });
  it('超材料参考范围与大挠度不冒充有效弹性响应，AI 同步隐藏能量',()=>{
    const result=calculateBendingTeaching({materialName:'Q235钢',yieldStrength:235,modulus:206,load:200000,length:2,position:1,section:{type:'rectangle',width:100,height:150}});
    if(result.ok===false)throw new Error('无效工况');
    expect(result.values.phase).toContain('弹性外推');
    expect(result.values.energyApplicable).toBe(false);
    const context=getCalculationContext('bending',{...DEFAULT_STATE,materialName:'Q235钢',materialYield:235,bendModulus:206,bendLoad:200000});
    expect(context).toContain('当前外推工况不适用');
    expect(context).toContain('最大挠度位置');
  });
});
