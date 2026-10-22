import {describe,it,expect} from 'vitest';
import {bucklingGeometry,bucklingStation,bucklingVertex,type BucklingField} from '../mechanics/bucklingField';
import {calculateBucklingTeaching} from '../mechanics/calculations';
import {DEFAULT_STATE} from '../types';
import {createExperiment,parseExperiment,getSimulation,serializeExperiment,parseExperimentJSON} from '../experiments/schema';
import {getResults} from '../experiments/results';
import {getCalculationContext} from '../mechanics/aiContext';
const base:BucklingField={load:1000,lengthMm:2000,modulusMPa:200000,section:{type:'rectangle',width:40,height:60},initialBow:2};
function calc(f:BucklingField){const r=calculateBucklingTeaching({load:f.load,length:f.lengthMm/1000,modulus:f.modulusMPa/1000,section:f.section,initialBow:f.initialBow,materialName:DEFAULT_STATE.materialName,yieldStrength:250});if(!r.ok)throw Error('计算无效');return r.values;}
describe('压杆几何与二阶侧移',()=>{
  it('材料 E 与临界力成正比，长度平方反比；固定载荷不归一化侧移',()=>{
    const a=bucklingGeometry(base),b=bucklingGeometry({...base,modulusMPa:100000}),c=bucklingGeometry({...base,lengthMm:4000});
    expect(b.critical).toBeCloseTo(a.critical/2,8);expect(c.critical).toBeCloseTo(a.critical/4,8);expect(b.amplitude!).toBeGreaterThan(a.amplitude!);
  });
  it('矩形宽高互换保持 Imin 但弱轴和位移平面互换',()=>{
    const a=bucklingGeometry(base),f={...base,section:{type:'rectangle' as const,width:60,height:40}},b=bucklingGeometry(f);
    expect(a.weakAxis).toBe('y');expect(b.weakAxis).toBe('z');expect(b.critical).toBe(a.critical);
    const p=bucklingVertex(base,1000,0,0,10),q=bucklingVertex(f,1000,0,0,10);expect(p[1]).toBe(0);expect(p[2]).toBeCloseTo(2.5);expect(q[1]).toBeCloseTo(2.5);expect(q[2]).toBe(0);
  });
  it('两边尺寸同时翻倍，Imin 和 Pcr 为16倍，实际尺寸共用坐标比例',()=>{
    const a=bucklingGeometry(base),f={...base,section:{type:'rectangle' as const,width:80,height:120}};
    expect(bucklingGeometry(f).critical/a.critical).toBeCloseTo(16);
    const p=bucklingVertex(base,0,10,0,0),q=bucklingVertex(base,0,20,0,0);expect(q[1]/p[1]).toBeCloseTo(2);
  });
  it('亚临界初弯曲按 1/(1−P/Pcr) 放大，端点零、中点峰值',()=>{
    const P=bucklingGeometry(base).critical,f={...base,load:.8*P},g=bucklingGeometry(f);expect(g.amplitude).toBeCloseTo(10);
    expect(bucklingStation(f,0,10).offset).toBe(0);expect(bucklingStation(f,2000,10).offset).toBeCloseTo(0);expect(bucklingStation(f,1000,10).offset).toBeCloseTo(10);
    expect(bucklingStation(f,1000,10).slope).toBeCloseTo(0);
  });
  it('理想直杆在临界前为直线；零载荷回到初始弯曲',()=>{
    expect(bucklingGeometry({...base,initialBow:0}).amplitude).toBe(0);expect(bucklingGeometry({...base,load:0}).amplitude).toBe(2);
    expect(calc({...base,load:0}).totalBow).toBe(2);
  });
  it('临界、超临界以及小挠度范围外不输出实际位移，不使用伪造后屈曲幅值',()=>{
    const P=bucklingGeometry(base).critical;
    for(const load of [P,1.2*P]){const v=calc({...base,load});expect(v.totalBow).toBeNull();expect(v.displacementAvailable).toBe(false);}
    expect(calc({...base,load:P*.999}).displacementAvailable).toBe(false);
    expect(calc({...base,initialBow:200}).displacementAvailable).toBe(false);
  });
  it('欧拉临界应力达到屈服参考、二阶应力超参考均限制材料适用性',()=>{
    expect(calc({...base,lengthMm:100}).eulerApplicable).toBe(false);
    const P=bucklingGeometry(base).critical;
    expect(calc({...base,load:P*.99,initialBow:1}).displacementAvailable).toBe(false);
    const nonmetal=calculateBucklingTeaching({load:1000,length:2,modulus:12,section:base.section,initialBow:1,materialName:'松木',yieldStrength:1});if(!nonmetal.ok)throw Error('无效');expect(nonmetal.values.eulerApplicable).toBeNull();
  });
  it('自定义截面用 Iy/Iz 确定弱轴；初弯曲拒绝负数和非有限值',()=>{
    expect(bucklingGeometry({...base,section:{type:'custom',customArea:1000,customIy:1e6,customIz:2e6}}).weakAxis).toBe('y');
    for(const initialBow of [-1,NaN,Infinity])expect(calculateBucklingTeaching({load:1000,length:2,modulus:200,section:base.section,initialBow,materialName:'自定义材料',yieldStrength:250}).ok).toBe(false);
  });
  it('新文档保存初弯曲；旧版缺字段恢复为理想直杆，负值导入拒绝',()=>{
    const document=createExperiment('buckling');expect(parseExperimentJSON(serializeExperiment(document))).toEqual(document);
    if(document.model.kind!=='simulation')throw Error('模型错误');delete document.model.parameters.buckleInitialBow;
    const legacy=parseExperiment(document);expect(getSimulation(legacy).buckleInitialBow).toBe(0);
    const oldState={...DEFAULT_STATE} as Partial<typeof DEFAULT_STATE>;delete oldState.buckleInitialBow;
    expect(getSimulation(parseExperiment({format:'mechmat-experiment',schemaVersion:0,module:'buckling',name:'旧压杆',state:oldState})).buckleInitialBow).toBe(0);
    document.model.parameters.buckleInitialBow=-1;expect(()=>parseExperiment(document)).toThrow();
  });
  it('报告和 AI 不把超临界参考模态当作实际位移',()=>{
    const d=createExperiment('buckling');if(d.model.kind!=='simulation')throw Error('错误');d.model.parameters.buckleLoad=1e6;
    expect(getResults(d).metrics.some(m=>m.label==='总侧移')).toBe(false);expect(getCalculationContext('buckling',getSimulation(d))).toContain('未计算实际位移');
  });
});
