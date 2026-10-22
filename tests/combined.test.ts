import {describe,it,expect} from 'vitest';
import {calculateCombined,combinedInput,combinedStation,combinedVertex,combinedStressVertex,combinedNormalStress,combinedSectionField,combinedStressAt,combinedStressAtSample,combinedTorsionWarping,type CombinedInput} from '../mechanics/combined';
import {DEFAULT_STATE} from '../types';
import {calculateSectionProperties} from '../mechanics/sections';
import {createExperiment,parseExperiment,getSimulation,serializeExperiment,parseExperimentJSON} from '../experiments/schema';
import {getResults} from '../experiments/results';
import {getCalculationContext} from '../mechanics/aiContext';
const eccentric=combinedInput(DEFAULT_STATE,'eccentric'),shaft=combinedInput(DEFAULT_STATE,'bendtorque');
// 圆形圣维南剪切能的独立闭式积分。
function circleShearCompliance(f:CombinedInput){const nu=f.modulusMPa/(2*f.shearMPa)-1,A=calculateSectionProperties(f.section).area;return (7+14*nu+8*nu*nu)/(6*(1+nu)**2*A);}
function value(f:CombinedInput){const r=calculateCombined(f);if(r.ok===false)throw Error(r.diagnostics.map(d=>d.message).join(' '));return r.values;}
describe('组合变形共用计算与几何',()=>{
  it('偏心轴力的应力、伸缩和端弯矩侧移符合独立参考值',()=>{
    const v=value(eccentric);expect(v.area).toBe(5000);expect(v.rootMoment).toBeCloseTo(198805.97086176762,6);expect(v.tipMoment).toBe(200000);expect(v.criticalLabel).toBe('B端名义截面');expect(v.axialStress).toBe(2);
    expect(v.topStress).toBeCloseTo(-.4,12);expect(v.bottomStress).toBeCloseTo(4.4,12);expect(v.tipExtension).toBeCloseTo(.01,12);expect(v.tipDeflection).toBeCloseTo(.11940291382323631,11);
    expect(combinedStation(eccentric,0)).toMatchObject({axial:0,deflection:0,slope:0});
  });
  it('拉力刚化、压力放大，不可把拉力位移直接取反作为压力解',()=>{
    const a=value(eccentric),b=value({...eccentric,load:-eccentric.load}),c=value({...eccentric,eccentricity:-eccentric.eccentricity}),d=value({...eccentric,eccentricity:0});
    expect(b.tipExtension).toBe(-a.tipExtension);expect(Math.abs(b.tipDeflection!)).toBeGreaterThan(Math.abs(a.tipDeflection!));expect(Math.abs(b.rootMoment!)).toBeGreaterThan(200000);expect(b.criticalLabel).toBe('A端名义截面');
    expect(c.tipDeflection).toBe(-a.tipDeflection);expect(c.topStress).toBeCloseTo(a.bottomStress!);expect(d.tipDeflection).toBe(0);expect(d.topStress).toBe(2);expect(d.bottomStress).toBe(2);
  });
  it('非对称T形采用真实形心到上下边缘距离',()=>{
    const f={...eccentric,section:{type:'t_beam' as const,tFlangeWidth:100,tFlangeThickness:10,tWebHeight:80,tWebThickness:8}},v=value(f),yc=(1000*85+640*40)/1640,I=calculateSectionProperties(f.section).Iz;
    expect(v.top).toBeCloseTo(90-yc);expect(v.bottom).toBeCloseTo(-yc);expect(v.top).not.toBe(-v.bottom);
    expect(v.topStress).toBeCloseTo(10000/1640-200000*(90-yc)/I);expect(v.bottomStress).toBeCloseTo(10000/1640+200000*yc/I);
  });
  it('悬臂任意位置集中力，加载点后曲率为零但转角不归零',()=>{
    const I=calculateSectionProperties(shaft.section).Iz,v=value(shaft),x=combinedStation(shaft,800),a=combinedStation(shaft,500);
    expect(v.rootMoment).toBe(-2500000);expect(v.tipDeflection).toBeCloseTo(-5000*500**2*2500/(6*200000*I)-5000*500*circleShearCompliance(shaft)/shaft.shearMPa);
    expect(x.moment).toBe(0);expect(x.slope).toBe(a.slope);expect(x.deflection).toBeLessThan(a.deflection);
    for(const xMm of [100,300,700]){const h=.1,curvature=(combinedStation(shaft,xMm+h).deflection-2*combinedStation(shaft,xMm).deflection+combinedStation(shaft,xMm-h).deflection)/(h*h);expect(curvature).toBeCloseTo(combinedStation(shaft,xMm).moment/(shaft.modulusMPa*I),10);}
  });
  it('自由端加载还原PL³/3EI，固定端加载时无弯曲；零载荷无无穷安全系数',()=>{
    const I=calculateSectionProperties(shaft.section).Iz;expect(value({...shaft,positionMm:1000}).tipDeflection).toBeCloseTo(-5000*1000**3/(3*200000*I)-5000*1000*circleShearCompliance(shaft)/shaft.shearMPa);
    const v=value({...shaft,positionMm:0});expect(v.rootMoment).toBe(0);expect(v.tipDeflection).toBe(0);expect(v.tipTwist).not.toBe(0);
    const zero=value({...shaft,load:0,torque:0});expect(zero.mises).toBe(0);expect(zero.referenceRatio).toBeNull();expect(zero.tipTwist).toBe(0);
  });
  it('材料刚度按 E/G/ν 一致联动；无效各向同性 E/G 组合不给出假扭转',()=>{
    const a=value(shaft),b=value({...shaft,modulusMPa:shaft.modulusMPa/2,shearMPa:shaft.shearMPa/2});
    expect(b.tipDeflection/a.tipDeflection).toBeCloseTo(2);expect(b.tipTwist!/a.tipTwist!).toBeCloseTo(2);expect(b.mises).toBe(a.mises);
    const bad=value({...shaft,shearMPa:shaft.shearMPa/2});expect(bad.geometryAvailable).toBe(false);expect(bad.tipTwist).toBeNull();expect(bad.notice).toContain('E/(2G)');
  });
  it('圆轴半径翻倍：挠度/转角1/16，正应力/切应力1/8',()=>{
    const a=value(shaft),b=value({...shaft,section:{type:'circle',radius:60}});expect(b.tipDeflection/a.tipDeflection).toBeCloseTo(1/16);expect(b.tipTwist!/a.tipTwist!).toBeCloseTo(1/16);expect(b.maxNormal!/a.maxNormal!).toBeCloseTo(1/8);expect(b.tau!/a.tau!).toBeCloseTo(1/8);
    expect(a.mises!**2).toBeCloseTo(a.maxNormal!**2+3*a.tau!**2,8);
  });
  it('空心圆用真实J，非圆截面不套用极惯性矩作为抗扭常数',()=>{
    const f={...shaft,section:{type:'hollow_circle' as const,outerRadius:30,innerRadius:20}},v=value(f),J=Math.PI*(30**4-20**4)/2;expect(v.tipTwist).toBeCloseTo(500000*1000/(77000*J),12);
    const rect=value({...shaft,section:{type:'rectangle',width:60,height:60}});expect(rect.torsionSupported).toBe(true);expect(rect.tau).toBeGreaterThan(0);expect(rect.mises).toBeGreaterThan(0);expect(rect.torsionConstant!).toBeLessThan(rect.polar);expect(rect.tipTwist).not.toBeNull();
  });
  it('三维点保持截面尺度，弯扭转角使用同一场函数而不随材料归一化',()=>{
    const x=700,p=combinedVertex(shaft,x,30,0,100),center=combinedVertex(shaft,x,0,0,100),distance=Math.hypot(...p.map((n,i)=>n-center[i]));expect(distance).toBeCloseTo(30*.56,10);
    expect(combinedVertex(shaft,0,30,0,100)).toEqual([-280,30*.56,0]);expect(combinedVertex({...shaft,shearMPa:26000},x,30,0,100)).not.toEqual(p);
  });
  it('反向扭矩改变转角，不改变等效应力；大变形和压缩失稳不冒充真实形态',()=>{
    const a=value(shaft),b=value({...shaft,torque:-shaft.torque});expect(b.tipTwist).toBe(-a.tipTwist!);expect(b.mises).toBe(a.mises);
    expect(value({...shaft,modulusMPa:1}).geometryAvailable).toBe(false);const unstable=value({...eccentric,load:-1e7});expect(unstable.compressionUnsupported).toBe(true);expect(unstable.tipDeflection).toBeNull();expect(unstable.rootMoment).toBeNull();expect(unstable.mises).toBeNull();
    expect(value({...shaft,materialName:'松木',strength:1}).ductile).toBe(false);
  });
  it('自定义截面不虚构边缘应力，非法参数拒绝',()=>{
    const custom=value({...eccentric,section:{type:'custom',customArea:1000,customIz:1e6,customIy:1e6}});expect(custom.topStress).toBeNull();expect(custom.mises).toBeNull();
    expect(calculateCombined({...shaft,shearMPa:0}).ok).toBe(false);expect(calculateCombined({...shaft,positionMm:2000}).ok).toBe(false);
  });
  it('组合新G参数和正负载荷可存档，老文档恢复预设或推导G',()=>{
    const d=createExperiment('combined');if(d.model.kind!=='simulation')throw Error('模型错误');d.model.parameters.combinedLoad=-1000;d.model.parameters.bendTorque=-500;
    expect(parseExperimentJSON(serializeExperiment(d))).toEqual(d);
    delete d.model.parameters.bendTorqueShearModulus;d.model.parameters.materialName='6061-T6铝合金';d.model.parameters.bendTorqueModulus=68.9;expect(getSimulation(parseExperiment(d)).bendTorqueShearModulus).toBe(26);
  });
  it('报告和AI共用已实现的非圆截面场与自由翘曲范围',()=>{
    const d=createExperiment('combined');if(d.model.kind!=='simulation')throw Error('模型错误');d.model.parameters.bendTorqueSection={type:'rectangle',width:50,height:100};
    expect(getResults(d).metrics.some(m=>m.label==='弯扭组合总剪应力')).toBe(true);expect(getCalculationContext('combined',getSimulation(d))).toContain('同一点σx、τxy、τxz叠加');expect(getResults(d).assumptions.join(' ')).toContain('轴向翘曲释放');
  });
});

// 独立有限差分求解EI·v″=F(e+v−vB)，不复用三角/双曲函数解析式。
function finiteDifferenceTip(f:CombinedInput) {
  const n=100,dx=f.lengthMm/n,I=calculateSectionProperties(f.section).Iz,q=f.load*dx*dx/(f.modulusMPa*I),rows=Array.from({length:n},()=>Array(n+1).fill(0));
  rows[0][0]=4;rows[0][1]=-1;
  for(let i=1;i<n;i++){const row=rows[i];if(i>1)row[i-2]=1;row[i-1]+=-2-q;row[i]+=1;row[n-1]+=q;row[n]=q*f.eccentricity;}
  for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(rows[i][k])>Math.abs(rows[pivot][k]))pivot=i;[rows[k],rows[pivot]]=[rows[pivot],rows[k]];const d=rows[k][k];for(let j=k;j<=n;j++)rows[k][j]/=d;for(let i=k+1;i<n;i++){const r=rows[i][k];for(let j=k;j<=n;j++)rows[i][j]-=r*rows[k][j];}}
  const answer=Array(n).fill(0);for(let i=n-1;i>=0;i--)answer[i]=rows[i][n]-rows[i].slice(i+1,n).reduce((a,x,j)=>a+x*answer[i+j+1],0);return answer[n-1];
}
describe('组合变形力学审查回归',()=>{
  it('短跨横剪主导时，危险点不在最大弯曲正应力外缘，不能直接拼极值',()=>{
    const f={...shaft,positionMm:1,torque:0},v=value(f),q=combinedStressAt(f,0,0,0)!;
    expect(v.mises).toBeCloseTo(q.mises,5);expect(Math.abs(v.hotspot!.y)).toBeLessThan(2);expect(v.mises).toBeGreaterThan(v.maxNormal!*4);
    expect(q.tauXY).toBeLessThan(0);expect(q.tauXZ).toBeCloseTo(0,12);expect(q.mises).toBeCloseTo(Math.sqrt(3)*Math.abs(q.tauXY),12);
  });
  it('横剪与扭转同点矢量叠加，加载点左右极限正确',()=>{
    const f={...shaft,section:{type:'rectangle' as const,width:60,height:100}},a=combinedStressAt(f,200,0,29)!,b=combinedStressAt({...f,torque:-f.torque},200,0,29)!;
    expect(a.tauXY).toBeCloseTo(a.shearY+a.torsionY,12);expect(a.tauXZ).toBeCloseTo(a.shearZ+a.torsionZ,12);expect(a.mises).not.toBe(b.mises);
    const left=combinedStressAt(f,f.positionMm,0,0,true)!,right=combinedStressAt(f,f.positionMm,0,0)!;expect(left.shearY).not.toBe(0);expect(right.shearY).toBe(0);
  });
  it('槽钢纯端扭矩与形心横向力满足互等位移，并计入诱发扭转',()=>{
    const f={...shaft,section:{type:'channel' as const},load:100,torque:0},q=combinedSectionField(f);if(q.ok===false)throw Error(q.reason);
    const bending=value(f),torsion=value({...f,load:0,torque:.1});
    expect(bending.tipTwist).toBeCloseTo(-100*q.complianceVT*f.positionMm/f.shearMPa,12);
    // 单位力施加在a，单位扭矩施加在B；以加载点位移比较互等功。
    const torsionAtA=combinedStation({...f,load:0,torque:1},f.positionMm).deflection;
    expect(torsionAtA/1000).toBeCloseTo(-bending.tipTwist!/100,12);expect(torsion.tipDeflection).not.toBe(0);
    const integral=q.points.reduce((s,p)=>s+p.weight*((-100*p.vy)**2+(-100*p.vz)**2),0);
    expect(q.complianceVV*100**2).toBeCloseTo(integral,8);
  });
  it('非圆截面扭转翘曲与 G、J、尺寸和扭矩符号对应，不使用任意归一化',()=>{
    const f={...shaft,load:0,section:{type:'rectangle' as const,width:50,height:100}},w=combinedTorsionWarping(f,300,40,20),q=combinedSectionField(f);if(q.ok===false)throw Error(q.reason);
    expect(Math.abs(w)).toBeGreaterThan(0);expect(combinedTorsionWarping({...f,torque:-f.torque},300,40,20)).toBe(-w);
    const half={...f,modulusMPa:f.modulusMPa/2,shearMPa:f.shearMPa/2};expect(combinedTorsionWarping(half,300,40,20)).toBeCloseTo(2*w,12);
    expect(value(f).tipTwist).toBeCloseTo(f.torque*1000*f.lengthMm/(f.shearMPa*q.J),11);
    const p=combinedVertex(f,300,40,20,100),zero=combinedVertex({...f,torque:0},300,40,20,100);
    expect(p[0]-zero[0]).toBeCloseTo(w*100*560/f.lengthMm,10);
  });
  it('端部转角因载荷抵消时仍检查杆内峰值，不能漏掉加载点最大扭角',()=>{
    const f={...shaft,load:150000,section:{type:'channel' as const}},q=combinedSectionField(f);if(q.ok===false)throw Error(q.reason);
    const torque=f.load*q.complianceVT*f.positionMm/(q.complianceTT*f.lengthMm*1000),v=value({...f,torque});
    expect(v.tipTwist).toBeCloseTo(0,10);expect(v.peakTwist).toBeGreaterThan(.15);expect(v.geometryAvailable).toBe(false);
  });
  it('凹角单元侧的最大值定位后保持同一个采样侧，不被邻单元替换',()=>{
    const f={...shaft,section:{type:'i_beam' as const}},v=value(f),p=v.hotspot!;
    expect(combinedStressAtSample(f,p.x,p.sampleIndex,p.x===f.positionMm)!.mises).toBe(v.mises);
  });
  it('梁柱解析解与独立差分边值问题相符，低轴力回到一阶极限',()=>{
    const base={...eccentric,section:{type:'circle' as const,radius:10},eccentricity:.1},I=calculateSectionProperties(base.section).Iz,Pcr=Math.PI**2*base.modulusMPa*I/(4*base.lengthMm**2);
    for(const load of [-.4*Pcr,.4*Pcr]){const f={...base,load},v=value(f);expect(v.tipDeflection!).toBeCloseTo(finiteDifferenceTip(f),4);}
    const tiny={...base,load:.001},v=value(tiny),linear=tiny.load*tiny.eccentricity*tiny.lengthMm**2/(2*tiny.modulusMPa*I);expect(v.tipDeflection!/linear).toBeCloseTo(1,5);
  });
  it('二阶弯矩满足偏心力平衡、曲率关系和固定端条件',()=>{
    for(const load of [-1e5,1e5]){const f={...eccentric,load},v=value(f),I=calculateSectionProperties(f.section).Iz;expect(combinedStation(f,0).deflection).toBeCloseTo(0,12);expect(combinedStation(f,0).slope).toBeCloseTo(0,12);expect(v.tipMoment).toBeCloseTo(load*f.eccentricity,7);
      for(const x of [100,400,800]){const p=combinedStation(f,x),h=.1,curv=(combinedStation(f,x+h).deflection-2*p.deflection+combinedStation(f,x-h).deflection)/(h*h);expect(p.moment).toBeCloseTo(load*(f.eccentricity+p.deflection-v.tipDeflection!),7);expect(curv).toBeCloseTo(p.moment/(f.modulusMPa*I),9);}}
  });
  it('横向剪力跳变与弯矩平衡，端点加载不产生伪斜线',()=>{
    const before=combinedStation(shaft,499.99),after=combinedStation(shaft,500);expect(before.shear).toBe(-5000);expect(after.shear).toBe(0);
    const a=combinedStation(shaft,200),b=combinedStation(shaft,200.1);expect((b.moment-a.moment)/.1).toBeCloseTo(-a.shear,7);expect(value({...shaft,positionMm:0}).rootShear).toBe(0);
  });
  it('纯扭转没有唯一A端危险截面；横剪完整叠加',()=>{
    const pure=value({...shaft,load:0});expect(pure.criticalLabel).toBe('全杆等扭矩');expect(pure.transverseShearOmitted).toBe(false);expect(value(shaft).transverseShearOmitted).toBe(false);expect(value(shaft).transverseMax).toBeGreaterThan(0);
  });
  it('弯曲应力空间位置不随扭转网格转走，粒子位置使用空间截面',()=>{
    const zero={...shaft,torque:0};for(const y of [-30,0,30]){const a=combinedStressVertex(shaft,400,y,0,100),b=combinedVertex(zero,400,y,0,100);a.forEach((n,i)=>expect(n).toBeCloseTo(b[i],9));}
    expect(combinedNormalStress(shaft,200,30)).toBeGreaterThan(0);expect(combinedNormalStress(shaft,200,-30)).toBeLessThan(0);
  });
  it('显示截面与包含轴向伸缩的中心线切向正交',()=>{
    const f={...eccentric,load:2e5},x=500,h=.01,amp=100,c=combinedVertex(f,x,0,0,amp),edge=combinedVertex(f,x,20,0,amp),lo=combinedVertex(f,x-h,0,0,amp),hi=combinedVertex(f,x+h,0,0,amp),tangent=hi.map((n,i)=>(n-lo[i])/(2*h)),radius=edge.map((n,i)=>n-c[i]);expect(tangent.reduce((a,n,i)=>a+n*radius[i],0)).toBeCloseTo(0,7);
  });
  it('开口压杆的扭转与弯扭稳定未验证，平面解不冒充完整稳定形态',()=>{
    const v=value({...eccentric,load:-1000,section:{type:'i_beam'}});expect(v.equilibrium).toBe(true);expect(v.stabilityUnverified).toBe(true);expect(v.geometryAvailable).toBe(false);expect(v.notice).toContain('稳定性未验证');
  });
  it('槽形形心横向加载不可假定无扭转，达到临界后报告不导出假侧移',()=>{
    const v=value({...shaft,torque:0,section:{type:'channel'}});expect(v.shearCenterUnsupported).toBe(false);expect(v.tipTwist).not.toBe(0);expect(v.tipTwist).not.toBeNull();expect(v.mises).toBeGreaterThan(0);expect(v.shearCenterZ).toBeLessThan(0);
    const d=createExperiment('combined');if(d.model.kind!=='simulation')throw Error('格式');d.model.parameters.combinedLoad=-1e7;const report=getResults(d);expect(report.metrics.some(m=>m.label==='偏心组合端部侧移')).toBe(false);expect(report.warnings.join(' ')).toContain('亚临界平衡');
  });
});
