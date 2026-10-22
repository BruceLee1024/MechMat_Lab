import {describe,it,expect} from 'vitest';
import {calculatePlaneStress} from '../mechanics/calculations';
import {stressRotate,stressFaceTraction,stressAngleFromMohr,stressMohrPoints,stressAngle180} from '../mechanics/stressState';
import {createExperiment,getSimulation,parseExperimentJSON,serializeExperiment} from '../experiments/schema';
import {getResults} from '../experiments/results';
import {getCalculationContext} from '../mechanics/aiContext';
const calc=(x:number,y:number,t:number,a=0)=>{const r=calculatePlaneStress({sigmaX:x,sigmaY:y,tauXY:t,angle:a});if(r.ok===false)throw Error(r.diagnostics[0].message);return r.values;};
describe('应力单元体、莫尔圆与计算的一致性',()=>{
  it('独立参考：50/20/30MPa转30°得到正确正应力和剪应力',()=>{
    const v=calc(50,20,30,30);expect(v.sigX_prime).toBeCloseTo(68.48076211353316,10);expect(v.sigY_prime).toBeCloseTo(1.51923788646684,10);expect(v.tauXY_prime).toBeCloseTo(2.00961894323342,10);
    expect(v.sig1).toBeCloseTo(68.54101966249685,10);expect(v.sig2).toBeCloseTo(1.45898033750315,10);
  });
  it('旋转不改变迹、行列式、面内主应力与等效应力',()=>{
    const a=calc(-60,70,30);for(const angle of [-270,-41,0,19,90,179,180,437]){const b=calc(-60,70,30,angle);expect(b.sigX_prime+b.sigY_prime).toBeCloseTo(10,10);expect(b.sigX_prime*b.sigY_prime-b.tauXY_prime**2).toBeCloseTo(-5100,8);expect(b.sig1).toBe(a.sig1);expect(b.R).toBe(a.R);expect(b.mises).toBe(a.mises);}
  });
  it('四个面牵引与全局张量乘法一致，反面等大反向',()=>{
    for(const angle of [0,24,90,123]){const v=calc(-60,70,30,angle);for(const axis of ['x','y'] as const){const n=stressRotate(axis==='x'?[1,0,0]:[0,1,0],angle),q=stressRotate(stressFaceTraction(v,axis,1),angle),expected=[-60*n[0]+30*n[1],30*n[0]+70*n[1],0];q.forEach((x,i)=>expect(x).toBeCloseTo(expected[i],10));stressFaceTraction(v,axis,-1).forEach((x,i)=>expect(x).toBeCloseTo(-stressFaceTraction(v,axis,1)[i],10));}}
  });
  it('莫尔状态点位于同一个圆并互为对径，θ正转时圆上顺时针2θ',()=>{
    const a=calc(80,-20,35,0),b=calc(80,-20,35,17),p=stressMohrPoints(b);expect(Math.hypot(p.x[0]-b.avg,p.x[1])).toBeCloseTo(b.R,10);expect(p.x[0]+p.y[0]).toBeCloseTo(2*b.avg,10);expect(p.x[1]+p.y[1]).toBe(0);
    const old=Math.atan2(a.tauXY_prime,a.sigX_prime-a.avg),next=Math.atan2(p.x[1],p.x[0]-b.avg);expect(next-old).toBeCloseTo(-34*Math.PI/180,10);
  });
  it('主方向用atan2保持象限正确；主平面剪应力零、最大剪平面正应力为C',()=>{
    for(const [x,y,t] of [[-60,70,30],[60,-70,-30],[20,50,-30],[0,0,50]]){const a=calc(x,y,t),b=calc(x,y,t,a.principalAngle!),c=calc(x,y,t,a.maxShearAngle!);expect(b.sigX_prime).toBeCloseTo(a.sig1,10);expect(b.tauXY_prime).toBeCloseTo(0,10);expect(c.sigX_prime).toBeCloseTo(a.avg,10);expect(Math.abs(c.tauXY_prime)).toBeCloseTo(a.R,10);}
  });
  it('拖动状态点反解方位，支持负剪力与180°周期',()=>{
    for(const tau of [-30,30])for(const angle of [0,.1,38,90,135,179.9]){const a=calc(-60,70,tau,angle),theta=stressAngleFromMohr(a.diff,tau,a.sigX_prime-a.avg,a.tauXY_prime)!;expect(Math.min(Math.abs(theta-angle),180-Math.abs(theta-angle))).toBeLessThan(1e-9);}
    expect(stressAngleFromMohr(0,0,0,0)).toBeNull();expect(stressAngle180(-30)).toBe(150);
  });
  it('等双拉/等双压时面内圆退化，但空间最大剪应力不为零',()=>{
    for(const n of [-60,60]){const v=calc(n,n,0,33);expect(v.R).toBe(0);expect(v.principalAngle).toBeNull();expect(v.maxShearAngle).toBeNull();expect(v.maxShear).toBe(0);expect(v.absoluteMaxShear).toBe(30);expect(v.principalMax).toBe(Math.max(n,0));expect(v.principalMin).toBe(Math.min(n,0));expect(v.principalMid).toBe(n);expect(v.mises).toBe(60);}
  });
  it('纯剪、零载荷和超大角度无假方向或NaN',()=>{
    const v=calc(0,0,50);expect(v.sig1).toBe(50);expect(v.sig2).toBe(-50);expect(v.principalAngle).toBe(45);expect(v.mises).toBeCloseTo(50*Math.sqrt(3));
    const zero=calc(0,0,0);expect(zero.absoluteMaxShear).toBe(0);expect(zero.mises).toBe(0);expect(zero.principalAngle).toBeNull();expect(calc(50,20,30,1e308).R).toBeCloseTo(Math.hypot(15,30));
    expect(calculatePlaneStress({sigmaX:NaN,sigmaY:0,tauXY:0,angle:0}).ok).toBe(false);
  });
  it('报告、AI与页面使用同一旋转结果，旧隐藏分量不作为空间张量求解',()=>{
    const d=createExperiment('stress');if(d.model.kind!=='simulation')throw Error('格式');Object.assign(d.model.parameters,{stressSigX:60,stressSigY:60,stressTauXY:0,stressSigZ:999,stressAngle:30});
    const restored=parseExperimentJSON(serializeExperiment(d));expect(getSimulation(restored).stressSigZ).toBe(999);
    const results=getResults(restored);expect(results.metrics.find(m=>m.label==='面内最大切应力')?.value).toBe(0);expect(results.metrics.find(m=>m.label==='空间最大切应力')?.value).toBe(30);
    const ai=getCalculationContext('stress',getSimulation(restored));expect(ai).toContain('σz=τyz=τzx=0');expect(ai).toContain('"空间最大切应力 (MPa)":30');expect(ai).not.toContain('999');
  });
});
