import {describe,it,expect} from 'vitest';
import {calculateBendingTeaching,calculateBucklingTeaching,calculateBuckling} from '../mechanics/calculations';
import {bucklingGeometry,bucklingStressAt,bucklingStressGlyphs} from '../mechanics/bucklingField';
import {bendingProfile} from '../mechanics/sectionOutline';
import {calculateSectionProperties} from '../mechanics/sections';
import {getCalculationContext} from '../mechanics/aiContext';
import {getResults} from '../experiments/results';
import {createExperiment} from '../experiments/schema';
import {compareBendingSections} from '../mechanics/sectionExploration';
import {DEFAULT_STATE,type SectionProperties} from '../types';
function values<T>(r:{ok:true;values:T}|{ok:false}){if(!r.ok)throw Error('计算无效');return r.values;}
const bend={materialName:'Q235钢',yieldStrength:235,load:1000,length:2,position:1,modulus:206};
const column={materialName:'Q235钢',yieldStrength:235,load:1000,length:3,modulus:206,initialBow:2};
describe('梁与压杆模型边界不能伪造应力或空间稳定性',()=>{
  it('自定义截面只有 A/I，不能从虚构的50mm距离生成应力与材料判据',()=>{
    const section:SectionProperties={type:'custom',customArea:1000,customIz:1e6,customIy:2e6};
    const v=values(calculateBendingTeaching({...bend,section}));
    expect(v.maxStress).toBeNull();expect(v.maxStrainEnergyDensity).toBeNull();expect(v.yMax).toBeNull();
    expect(v.notice).toContain('边缘');expect(v.maxDeflection).toBeGreaterThan(0);
    expect(compareBendingSections({...DEFAULT_STATE,bendSection:section},section)?.stressChange).toBeNull();
    const d=createExperiment('bending');if(d.model.kind!=='simulation')throw Error();d.model.parameters.bendSection=section;
    expect(getResults(d).metrics.some(m=>m.label==='最大应力')).toBe(false);
    expect(getCalculationContext('bending',{...DEFAULT_STATE,bendSection:section})).toContain('未提供边缘几何');
  });
  it('槽形梁载荷过形心会引起扭转，不能当作已求得三维纯弯曲',()=>{
    const r=calculateBendingTeaching({...bend,section:{type:'channel'}}),v=values(r);
    expect(v.geometryAvailable).toBe(false);expect(v.energyApplicable).toBe(false);
    expect(v.notice).toContain('剪心');expect(v.phase).toContain('参考');
    expect(values(calculateBendingTeaching({...bend,load:0,section:{type:'channel'}})).geometryAvailable).toBe(true);
  });
  it('有间隙的分离组合梁不能默认为完全共同工作',()=>{
    const v=values(calculateBendingTeaching({...bend,section:{type:'composite',compSpacing:20}}));
    expect(v.geometryAvailable).toBe(false);expect(v.notice).toContain('连接');
  });
  it('短粗梁保持EB计算值，但不把未计剪切变形的图形标为实际弹性响应',()=>{
    const v=values(calculateBendingTeaching({...bend,length:.4,position:.2,section:{type:'rectangle',width:100,height:150}}));
    expect(v.spanDepthRatio).toBeCloseTo(400/150);expect(v.geometryAvailable).toBe(false);expect(v.notice).toContain('剪切变形');
  });
  it('开口压杆不将弯曲欧拉参考当作完整失稳解，报告和AI同步',()=>{
    for(const type of ['i_beam','t_beam','channel','composite','custom'] as const){
      const v=values(calculateBucklingTeaching({...column,section:{type}}));
      expect(v.stabilityVerified).toBe(false);expect(v.displacementAvailable).toBe(false);expect(v.phase).toContain('参考');
    }
    const d=createExperiment('buckling');if(d.model.kind!=='simulation')throw Error();d.model.parameters.buckleSection={type:'channel'};d.model.parameters.buckleLoad=1000;
    expect(getResults(d).metrics.find(m=>m.label.includes('参考'))).toBeDefined();
    expect(getResults(d).metrics.some(m=>m.label==='总侧移')).toBe(false);
    expect(getCalculationContext('buckling',{...DEFAULT_STATE,buckleSection:{type:'channel'},buckleLoad:1000})).toContain('扭转');
  });
  it('矩形与圆管的纯弯曲屈曲保持原有解析关系',()=>{
    for(const section of [{type:'rectangle',width:40,height:60},{type:'hollow_circle',outerRadius:30,innerRadius:25}] as SectionProperties[]){
      const v=values(calculateBucklingTeaching({...column,section}));
      expect(v.stabilityVerified).toBe(true);expect(v.displacementAvailable).toBe(true);
      expect(v.totalBow).toBeCloseTo(column.initialBow/(1-column.load/v.Pcr),10);
    }
  });
  it('初弯曲产生 P–Δ 弯曲正应力，按真实纤维坐标叠加轴压',()=>{
    const f={load:1000,lengthMm:3000,modulusMPa:206000,initialBow:2,section:{type:'rectangle' as const,width:60,height:40}};
    const g=bucklingGeometry(f),a=calculateSectionProperties(f.section),e=g.amplitude!;
    expect(g.weakAxis).toBe('z');
    expect(bucklingStressAt(f,1500,20,0)).toBeCloseTo(-1000/a.area+1000*e*20/a.Iz,10);
    expect(bucklingStressAt(f,1500,-20,0)).toBeCloseTo(-1000/a.area-1000*e*20/a.Iz,10);
    expect(bucklingStressAt(f,0,20,0)).toBeCloseTo(-1000/a.area,10);
    expect(bucklingStressAt({...f,load:g.critical},1500,20,0)).toBeNull();
  });
  it('非对称T形截面区分受压与受拉边缘，不能套用最远边缘为压应力',()=>{
    const section:SectionProperties={type:'t_beam',tFlangeWidth:300,tFlangeThickness:20,tWebThickness:10,tWebHeight:80};
    const v=values(calculateBucklingTeaching({...column,section})),p=bendingProfile(section),a=calculateSectionProperties(section),e=v.totalBow!;
    expect(v.weakAxis).toBe('z');
    expect(v.minNormalStress).toBeCloseTo(-column.load/a.area+column.load*e*p.bottom/a.Iz,10);
    expect(v.maxNormalStress).toBeCloseTo(-column.load/a.area+column.load*e*p.top/a.Iz,10);
    expect(v.edgeStress).toBeCloseTo(-v.minNormalStress!,10);
    expect(values(calculateBucklingTeaching({...column,section:{type:'custom'}})).edgeStress).toBeNull();
  });
  it('临界点属于失稳边界，基础载荷比不被1.5截断',()=>{
    const f={...column,section:{type:'rectangle' as const,width:40,height:60}},v=values(calculateBuckling(f));
    expect(values(calculateBuckling({...f,load:v.Pcr})).isBuckled).toBe(true);
    expect(values(calculateBuckling({...f,load:3*v.Pcr})).ratio).toBeCloseTo(3);
  });
  it('粒子取各纤维真实拉压方向，临界和零载荷关闭，不能一律表现为均匀受压',()=>{
    const f={load:1000,lengthMm:3000,modulusMPa:206000,initialBow:30,section:{type:'rectangle' as const,width:60,height:40}};
    const glyphs=bucklingStressGlyphs(f,1);
    expect(glyphs.some(p=>p.stress>0)).toBe(true);expect(glyphs.some(p=>p.stress<0)).toBe(true);
    for(const p of glyphs){expect(p.stress).toBeCloseTo(bucklingStressAt(f,p.x,p.y,p.z)!,10);expect(Math.sign(p.x-p.tailX)).toBe((p.x<f.lengthMm/2?-1:1)*Math.sign(p.stress));}
    expect(bucklingStressGlyphs({...f,load:0},1)).toEqual([]);
    expect(bucklingStressGlyphs({...f,load:bucklingGeometry(f).critical},1)).toEqual([]);
  });
});
