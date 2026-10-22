import {describe,it,expect} from 'vitest';
import katex from 'katex';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FormulaCard} from '../components/FormulaCard';
import {DEFAULT_STATE as D} from '../types';
import {calculateAxialTeaching,calculateBendingTeaching,calculateBucklingTeaching,calculateTorsionTeaching,calculatePlaneStress} from '../mechanics/calculations';
import {sectionStudy} from '../mechanics/conceptStudies';
import {calculateFundamentals} from '../mechanics/fundamentals';
import {calculateCombined,combinedInput} from '../mechanics/combined';
import {axialFormulas,bendingFormulas,bucklingFormulas,torsionFormulas,stressFormulas,fundamentalsFormulas,combinedFormulas,overviewFormulas,sectionFormulas,strainFormulas,formTeachingFormula} from '../mechanics/formulaExplanations';
const val=<T,>(r:{ok:true;values:T}|{ok:false})=>{if(!r.ok)throw Error('参数无效');return r.values;};
const results=(entries:ReturnType<typeof bendingFormulas>)=>Object.fromEntries(entries.flatMap(e=>e.details?.results??[]).map(r=>[r.key,r]));
describe('公式代入复用当前求解结果，不另建近似计算器',()=>{
  it('梁的单位换算、反力、载荷点挠度与能量对应同一次计算，参数改变实时更新',()=>{
    for(const load of [1000,-2400]){
      const s={...D,bendLoad:load,bendLength:2.6,bendLoadPos:.8,bendModulus:206,materialName:'Q235钢',materialYield:235};
      const v=val(calculateBendingTeaching({load,length:s.bendLength,position:s.bendLoadPos,modulus:s.bendModulus,section:s.bendSection,materialName:s.materialName,yieldStrength:s.materialYield}));
      const entries=bendingFormulas(s,v),r=results(entries);
      expect(r.RA.value).toBe(v.R1);expect(r.RB.value).toBe(v.R2);expect(r.moment.value).toBe(v.maxMoment);
      expect(r.loadDeflection.value).toBe(v.deflectionAtLoad);expect(r.energy.value).toBe(v.strainEnergy/1000);
      expect(entries.flatMap(e=>e.details?.symbols??[]).find(p=>p.symbol==='E')?.value).toBe(206000);
    }
  });
  it('自定义截面不虚构边缘应力，超范围能量不生成有效代入等号',()=>{
    const s={...D,bendSection:{type:'custom' as const}};
    const v=val(calculateBendingTeaching({load:s.bendLoad,length:s.bendLength,position:s.bendLoadPos,modulus:s.bendModulus,section:s.bendSection,materialName:s.materialName,yieldStrength:s.materialYield}));
    const entries=bendingFormulas(s,v);expect(results(entries).edgeStress).toBeUndefined();
    expect(entries.find(e=>e.label==='截面正应力')?.details.note).toContain('边缘');
  });
  it('压杆超临界仅代入临界力、惯性半径；不计算负侧移或除以零',()=>{
    const s={...D,buckleLoad:1e9};
    const v=val(calculateBucklingTeaching({load:s.buckleLoad,length:s.buckleLength,modulus:s.buckleModulus,section:s.buckleSection,materialName:s.materialName,yieldStrength:s.materialYield,initialBow:s.buckleInitialBow}));
    const entries=bucklingFormulas(s,v),r=results(entries);
    expect(r.critical.value).toBe(v.Pcr/1000);expect(r.totalBow).toBeUndefined();expect(r.sigmaMin).toBeUndefined();
    expect(entries.find(e=>e.label==='亚临界初弯曲放大')?.details.note).toContain('不代入');
    expect(JSON.stringify(entries)).not.toMatch(/NaN|Infinity/);
  });
  it('圆轴分段相对转角和能量使用 N·mm、MPa 后转换为度和 J',()=>{
    const s={...D,torqTorque:-500,torqLoadRatio:.25};
    const v=val(calculateTorsionTeaching({torque:s.torqTorque,radius:s.torqRadius,length:s.torqLength,modulus:s.torqModulus,loadRatio:s.torqLoadRatio,materialName:s.materialName,yieldStrength:s.materialYield}));
    const r=results(torsionFormulas(s,v));expect(r.angle.value).toBe(v.phi_total_deg);expect(r.tau.value).toBe(v.maxShear);expect(r.energy.value).toBe(v.U_total_J);
  });
  it('连续屈服应变与所选材料一致，不把教学应变写成σ/E；不输出无效弹性能',()=>{
    const s={...D,materialName:'6061-T6铝合金',bendModulus:68.9,materialYield:276,axialForce:27600,axialArea:100};
    const v=val(calculateAxialTeaching({force:s.axialForce,area:s.axialArea,length:s.axialLength,modulus:s.bendModulus,materialName:s.materialName,yieldStrength:s.materialYield}));
    const entries=axialFormulas(s,v),r=results(entries);
    expect(r.strain.value).toBe(v.strain*100);expect(r.strain.value).toBeGreaterThan(v.stress/v.modulusMPa*100);
    expect(entries.find(e=>e.label.includes('连续屈服'))?.details.steps.join('')).toContain('0.002');expect(r.energy).toBeUndefined();
    expect(results(axialFormulas(s,v,true)).normal.value).toBeCloseTo(v.stress*Math.cos(s.axialObliqueAngle*Math.PI/180)**2);
  });
  it('应力变换保留负号，退化莫尔圆不伪造唯一主方向',()=>{
    const s={...D,stressSigX:-70,stressSigY:110,stressTauXY:-35,stressAngle:73};
    const v=val(calculatePlaneStress({sigmaX:s.stressSigX,sigmaY:s.stressSigY,tauXY:s.stressTauXY,angle:s.stressAngle})),r=results(stressFormulas(s,v));
    expect(r.sigmaXPrime.value).toBe(v.sigX_prime);expect(r.tauPrime.value).toBe(v.tauXY_prime);expect(r.spaceShear.value).toBe(v.absoluteMaxShear);
    const h={...s,stressSigX:50,stressSigY:50,stressTauXY:0},hv=val(calculatePlaneStress({sigmaX:50,sigmaY:50,tauXY:0,angle:h.stressAngle}));
    expect(results(stressFormulas(h,hv)).principalAngle).toBeUndefined();
  });
  it('泊松真应力采用未放大的当前面积，百分数只用于显示',()=>{
    const s={...D,axialForce:12000,axialArea:120,bendModulus:200,poissonRatio:.3};
    const v=val(calculateFundamentals(s)),r=results(fundamentalsFormulas(s,v));
    expect(r.trueStress.value).toBe(v.trueStress);expect(r.transverse.value).toBe(v.transverseStrain*100);
  });
  it('弯扭代入同一个控制采样点，不能把各分量的独立最大值混用',()=>{
    const f=combinedInput({...D,bendTorqueSection:{type:'rectangle',width:60,height:100},bendTorqueBendLoad:1000,bendTorque:50},'bendtorque'),v=val(calculateCombined(f));
    const r=results(combinedFormulas(f,v));expect(r.mises.value).toBe(v.mises);expect(r.tauXY.value).toBe(v.hotspot!.tauXY);expect(r.tauXZ.value).toBe(v.hotspot!.tauXZ);expect(r.tipDeflection.value).toBe(v.tipDeflection);
    expect(r.mises.value).toBeCloseTo(Math.hypot(v.hotspot!.sigma,Math.sqrt(3)*Math.hypot(r.tauXY.value,r.tauXZ.value)));
  });
  it('偏心压杆代入梁柱二阶弯矩，不把所有截面的弯矩写成Fe',()=>{
    const f=combinedInput({...D,combinedLoad:-1000,combinedEccentricity:10},'eccentric'),v=val(calculateCombined(f));
    const r=results(combinedFormulas(f,v));expect(r.criticalMoment.value).toBe(v.rootMoment);expect(r.topStress.value).toBe(v.topStress);expect(r.criticalMoment.value).not.toBe(f.load*f.eccentricity);
  });
  it('符号名称保留真正的 LaTeX 命令，不丢失反斜杠或变成控制字符',()=>{
    const v=val(calculateFundamentals(D)),entries=fundamentalsFormulas(D,v);
    expect(entries[2].details.symbols[0].symbol).toBe(String.raw`\nu`);
    expect(entries[2].details.symbols[1].symbol).toBe(String.raw`\varepsilon_{axial}`);
    for(const e of entries)for(const p of [...e.details.symbols,...e.details.results])expect(p.symbol).not.toMatch(/[\x00-\x1f]/);
  });
  it('基础理论的取截面、位移梯度和演示幅度使用各自的实际量纲',()=>{
    const cut=sectionStudy(36,5,-8),r=results(sectionFormulas(cut));
    expect(r.moment.value).toBe(cut.momentKNm);expect(r.shear.unit).toBe('kN');
    const v=val(calculateFundamentals(D));expect(results(overviewFormulas(D,v)).extension.value).toBe(v.deformation);
    const deform=results(strainFormulas({rigid:false,ex:.001,gamma:.002,tx:11,ty:8}));
    expect(deform.cornerU.value).toBeCloseTo(.3);expect(deform.strain.value).toBe(.1);expect(deform.gamma.unit).toBe('rad');
    const rigid=results(strainFormulas({rigid:true,ex:.001,gamma:.002,tx:11,ty:8}));
    expect(rigid.cornerU.value).toBe(11);expect(rigid.strain.value).toBe(0);expect(rigid.gamma.value).toBe(0);
    for(const form of ['axial','shear','torsion','bending'] as const){
      const demo=formTeachingFormula(form,.74,'几何演示','a');expect(results(demo)).toEqual({});expect(demo[0].details.note).toContain('缺少实际量纲标定');
    }
  });
  it('主公式、符号和每一步代入都可排版，参数说明真实呈现在公式下方',()=>{
    const b=val(calculateBendingTeaching({load:1000,length:2,position:1,modulus:200,section:D.bendSection,materialName:D.materialName,yieldStrength:D.materialYield}));
    const f=combinedInput(D,'bendtorque'),c=val(calculateCombined(f));
    const a=val(calculateAxialTeaching({force:D.axialForce,area:D.axialArea,length:D.axialLength,modulus:D.bendModulus,materialName:D.materialName,yieldStrength:D.materialYield}));
    const t=val(calculateTorsionTeaching({torque:D.torqTorque,radius:D.torqRadius,length:D.torqLength,modulus:D.torqModulus,loadRatio:D.torqLoadRatio,materialName:D.materialName,yieldStrength:D.materialYield}));
    const k=val(calculateBucklingTeaching({load:D.buckleLoad,length:D.buckleLength,modulus:D.buckleModulus,section:D.buckleSection,materialName:D.materialName,yieldStrength:D.materialYield,initialBow:D.buckleInitialBow}));
    const st=val(calculatePlaneStress({sigmaX:D.stressSigX,sigmaY:D.stressSigY,tauXY:D.stressTauXY,angle:D.stressAngle})),fv=val(calculateFundamentals(D));
    const entries=[...bendingFormulas(D,b),...combinedFormulas(f,c),...axialFormulas(D,a),...axialFormulas(D,a,true),...torsionFormulas(D,t),...bucklingFormulas(D,k),...stressFormulas(D,st),...fundamentalsFormulas(D,fv),...overviewFormulas(D,fv),...sectionFormulas(sectionStudy(36,5,-8)),...strainFormulas({rigid:false,ex:.001,gamma:.002,tx:11,ty:8})];
    for(const e of entries)for(const latex of [e.formula,...e.details!.symbols.map(p=>p.symbol),...e.details!.steps])expect(()=>katex.renderToString(latex,{throwOnError:true,strict:false})).not.toThrow();
    const html=renderToStaticMarkup(React.createElement(FormulaCard,{entry:entries[0]}));
    expect(html).toContain('符号与当前值');expect(html).toContain('当前参数代入');expect(html).toContain('集中载荷，向下为正');
  });
});
