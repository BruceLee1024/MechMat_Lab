import {describe,it,expect} from 'vitest';
import {torsionStation,torsionVertex,torsionShearAtRadius,torsionDisplay,torsionFlow,torsionAppliedTorques,type TorsionField} from '../mechanics/torsionField';
import {calculateTorsionTeaching} from '../mechanics/calculations';
import {getCalculationContext} from '../mechanics/aiContext';
import {DEFAULT_STATE} from '../types';
const base:TorsionField={torqueNm:500,radiusMm:20,lengthMm:1000,modulusMPa:77000,loadRatio:.6};
const station=(f:TorsionField)=>torsionStation(f,f.lengthMm);
describe('两段传动圆轴：三维、场函数与材料计算一致',()=>{
  it('分段积分与现有总角、能量一致，B角连续，导数跳跃',()=>{
    const r=calculateTorsionTeaching({torque:500,radius:20,length:1,modulus:77,loadRatio:.6,materialName:DEFAULT_STATE.materialName,yieldStrength:250});if(!r.ok)throw Error('计算无效');
    expect(station(base).angleRad).toBeCloseTo(r.values.phi_total_rad,12);
    const left=torsionStation(base,500,'left'),right=torsionStation(base,500,'right');
    expect(left.angleRad).toBe(right.angleRad);expect(left.torqueNmm).toBe(500000);expect(right.torqueNmm).toBe(200000);
    expect(left.twistRate/right.twistRate).toBeCloseTo(2.5);
    const applied=torsionAppliedTorques(base);expect(applied.reduce((s,t)=>s+t,0)).toBe(0);
    expect((applied[1]*right.angleRad+applied[2]*station(base).angleRad)/2).toBeCloseTo(r.values.U_total_J,12);
  });
  it('相同扭矩下 G 降半，转角翻倍，切应力不变',()=>{
    const soft={...base,modulusMPa:base.modulusMPa/2};
    expect(station(soft).angleRad/station(base).angleRad).toBeCloseTo(2);
    expect(torsionStation(soft,0).surfaceShear).toBe(torsionStation(base,0).surfaceShear);
  });
  it('半径翻倍，转角1/16、切应力1/8；长度翻倍转角翻倍',()=>{
    const thick={...base,radiusMm:40};expect(station(thick).angleRad/station(base).angleRad).toBeCloseTo(1/16);
    expect(torsionStation(thick,0).surfaceShear/torsionStation(base,0).surfaceShear).toBeCloseTo(1/8);
    expect(station({...base,lengthMm:2000}).angleRad/station(base).angleRad).toBeCloseTo(2);
  });
  it('几何不归一化材料转角，保持圆截面半径与统一长度比例',()=>{
    for(const u of [0,.25,.5,.75,1]){
      const p=torsionVertex(base,u*1000,20,.4,20),a=.4+torsionStation(base,u*1000).angleRad*20;
      expect(Math.hypot(p[1],p[2])).toBeCloseTo(20*.56,12);
      expect(p[1]).toBeCloseTo(20*.56*Math.cos(a),12);expect(p[0]).toBeCloseTo((u-.5)*560);
    }
    expect(torsionVertex({...base,modulusMPa:26000},1000,20,0,20)).not.toEqual(torsionVertex(base,1000,20,0,20));
  });
  it('零载荷归零，反向载荷反转角与切向粒子，分流端值正确',()=>{
    expect(station({...base,torqueNm:0}).angleRad).toBe(0);expect(torsionFlow({...base,torqueNm:0},1)).toEqual([]);
    expect(station({...base,torqueNm:-500}).angleRad).toBe(-station(base).angleRad);
    const forward=torsionFlow(base,1),reverse=torsionFlow({...base,torqueNm:-500},1);expect(forward[0].azimuth).toBe(-reverse[0].azimuth);
    expect(torsionStation({...base,loadRatio:1},750).surfaceShear).toBe(0);expect(torsionStation({...base,loadRatio:0},750).surfaceShear).toBe(torsionStation(base,0).surfaceShear);
  });
  it('横截面切应力从中心零线性增至表面，两段对应实际扭矩',()=>{
    expect(torsionShearAtRadius(base,100,0)).toBe(0);expect(torsionShearAtRadius(base,100,10)).toBeCloseTo(torsionShearAtRadius(base,100,20)/2);
    expect(torsionShearAtRadius(base,750,20)/torsionShearAtRadius(base,100,20)).toBeCloseTo(.4);
    const particles=torsionFlow({...base,loadRatio:1},0);expect(particles.every(p=>p.x<500)).toBe(true);
  });
  it('外推范围统一供视图与AI，不能冒充真实塑性形态或有效能量',()=>{
    const state={...DEFAULT_STATE,torqTorque:10000,torqRadius:10};
    const r=calculateTorsionTeaching({torque:state.torqTorque,radius:10,length:1,modulus:77,loadRatio:.6,materialName:state.materialName,yieldStrength:250});if(!r.ok)throw Error('无效');
    expect(r.values.energyApplicable).toBe(false);expect(r.values.phase).toContain('外推');expect(getCalculationContext('torsion',state)).toContain('当前外推工况不适用');
    const rubber={...base,modulusMPa:3};expect(torsionDisplay(rubber,20).available).toBe(false);
    expect(torsionDisplay({...base,torqueNm:500000},100).available).toBe(false);
  });
  it('木材、混凝土与未知材料不套用延性金属的屈服判据',()=>{
    for(const materialName of ['松木','C30混凝土','自定义材料','铸铁HT200']){
      const r=calculateTorsionTeaching({torque:500,radius:20,length:1,modulus:77,loadRatio:.6,materialName,yieldStrength:10});if(!r.ok)throw Error('无效');
      expect(r.values.shearReference).toBe(null);expect(r.values.phase).toBe('等效剪切模量模型');
    }
  });
});
