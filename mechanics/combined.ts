import type {SimulationState,SectionProperties} from '../types';
import {evaluateSection,calculateSectionProperties} from './sections';
import {calculation,invalidParameters} from './validation';
import {DEFAULT_MATERIALS} from './materials';
import {sectionShear,type SectionShearPoint} from './sectionShear';
export type CombinedMode='eccentric'|'bendtorque';
export interface CombinedInput {mode:CombinedMode;load:number;eccentricity:number;torque:number;positionMm:number;lengthMm:number;modulusMPa:number;shearMPa:number;section:SectionProperties;materialName:string;strength:number}
/** 老文档没有独立 G 时，优先采用匹配的材料预设；其余按旧各向同性 E、ν 估算。 */
export function legacyCombinedG(s:Partial<SimulationState>) {const m=DEFAULT_MATERIALS.find(m=>m.name===s.materialName&&Math.abs(m.E-(s.bendTorqueModulus??200))<1e-8);return m?.G??(s.bendTorqueModulus??200)/(2*(1+(s.poissonRatio??.3)));}
export function combinedInput(s:SimulationState,mode:CombinedMode):CombinedInput {
  return {mode,load:mode==='eccentric'?s.combinedLoad:s.bendTorqueBendLoad,eccentricity:mode==='eccentric'?s.combinedEccentricity:0,torque:mode==='eccentric'?0:s.bendTorque,positionMm:mode==='eccentric'?s.combinedLength*1000:s.bendTorqueBendPos*1000,lengthMm:(mode==='eccentric'?s.combinedLength:s.bendTorqueLength)*1000,modulusMPa:s.bendTorqueModulus*1000,shearMPa:s.bendTorqueShearModulus*1000,section:mode==='eccentric'?s.combinedSection:s.bendTorqueSection,materialName:s.materialName,strength:s.materialYield};
}
function verticalEdges(s:SectionProperties) {
  const p=evaluateSection(s);if(!p.ok)return {top:0,bottom:0,known:false};
  if(s.type==='custom')return {top:0,bottom:0,known:false};
  if(s.type==='t_beam'){const b=s.tFlangeWidth??100,t=s.tFlangeThickness??10,h=s.tWebHeight??80,w=s.tWebThickness??8,yc=(b*t*(h+t/2)+h*w*h/2)/(b*t+h*w);return {top:h+t-yc,bottom:-yc,known:true};}
  if(s.type==='composite'){const b=s.comp1Width??100,h=s.comp1Height??20,c=s.comp2Width??40,d=s.comp2Height??80,g=s.compSpacing??0,yc=(b*h*(d+g+h/2)+c*d*d/2)/(b*h+c*d);return {top:d+g+h-yc,bottom:-yc,known:true};}
  return {top:p.values.yMax,bottom:-p.values.yMax,known:true};
}
/** 固定—自由杆，在当前轴力下是否仍有可用的亚临界平衡。 */
export function combinedEquilibrium(f:CombinedInput) {
  const p=calculateSectionProperties(f.section);
  return f.mode!=='eccentric'||f.load>=0||-f.load<Math.PI**2*f.modulusMPa*Math.min(p.Iy,p.Iz)/(4*f.lengthMm**2);
}
const prepared=new WeakMap<CombinedInput,ReturnType<typeof sectionShear>>();
export function combinedSectionField(f:CombinedInput) {let q=prepared.get(f);if(!q){q=sectionShear(f.section,f.modulusMPa/(2*f.shearMPa)-1);prepared.set(f,q);}return q;}
export function combinedStation(f:CombinedInput,xMm:number) {
  const {area:A,Iz:I,Ip:J}=calculateSectionProperties(f.section),x=Math.max(0,Math.min(f.lengthMm,xMm)),E=f.modulusMPa;
  if(f.mode==='eccentric') {
    const axial=f.load*x/(E*A),k=Math.sqrt(Math.abs(f.load)/(E*I)),K=k*f.lengthMm,q=k*x,e=f.eccentricity;
    // 无稳定解时仅供原始轮廓定位，调用方不得把占位0作为有效侧移/弯矩输出。
    if(!combinedEquilibrium(f))return {x,axial,deflection:0,slope:0,moment:0,twist:0,shear:0};
    if(f.load===0)return {x,axial:0,deflection:0,slope:0,moment:0,twist:0,shear:0};
    if(f.load<0){const c=Math.cos(K);return {x,axial,deflection:-2*e*Math.sin(q/2)**2/c,slope:-e*k*Math.sin(q)/c,moment:f.load*e*Math.cos(q)/c,twist:0,shear:0};}
    // 稳定指数比避免大拉力下cosh溢出；小K用sinh²避免相减消失。
    const den=1+Math.exp(-2*K),sech=2*Math.exp(-K)/den,cr=(Math.exp(q-K)+Math.exp(-q-K))/den,sr=(Math.exp(q-K)-Math.exp(-q-K))/den;
    return {x,axial,deflection:e*(K<350?2*Math.sinh(q/2)**2*sech:cr-sech),slope:e*k*sr,moment:f.load*e*cr,twist:0,shear:0};
  }
  const a=f.positionMm,P=f.load,T=f.torque*1000,clean=(n:number)=>n===0?0:n,q=combinedSectionField(f),rotation=clean(-P*(x<=a?x*(2*a-x):a*a)/(2*E*I));
  // 应力场的互等柔度来自同一截面场的剪切能；包括形心力与扭矩耦合。
  const shearDeflection=q.ok?(-P*q.complianceVV*Math.min(x,a)+T*q.complianceVT*x)/f.shearMPa:0;
  const twist=q.ok?(-P*q.complianceVT*Math.min(x,a)+T*q.complianceTT*x)/f.shearMPa:0;
  return {x,axial:0,deflection:clean(-P*(x<=a?x*x*(3*a-x):a*a*(3*x-a))/(6*E*I)+shearDeflection),slope:rotation+(q.ok?((x<a?-P:0)*q.complianceVV+T*q.complianceVT)/f.shearMPa:0),rotation,moment:clean(-P*Math.max(0,a-x)),twist:clean(twist),shear:x<a?clean(-P):0};
}
export function combinedNormalStress(f:CombinedInput,x:number,y:number) {
  const p=calculateSectionProperties(f.section);
  return (f.mode==='eccentric'?f.load/p.area:0)-combinedStation(f,x).moment*y/p.Iz;
}
function stressComponents(f:CombinedInput,x:number,q:Omit<SectionShearPoint,'weight'>,V:number) {
  const sigma=combinedNormalStress(f,x,q.y),T=f.torque*1000,shearY=V*q.vy,shearZ=V*q.vz,torsionY=T*q.ty,torsionZ=T*q.tz,tauXY=shearY+torsionY,tauXZ=shearZ+torsionZ,shear=Math.hypot(tauXY,tauXZ);
  return {x,y:q.y,z:q.z,sigma,shearY,shearZ,torsionY,torsionZ,tauXY,tauXZ,shear,mises:Math.hypot(sigma,Math.sqrt(3)*shear),tresca:Math.hypot(sigma,2*shear)};
}
export function combinedStressAt(f:CombinedInput,x:number,y:number,z:number,left=false) {
  const field=combinedSectionField(f);if(!field.ok)return null;const q=field.at(y,z);if(!q)return null;
  return stressComponents(f,x,q,left&&x>0&&x<=f.positionMm?-f.load:combinedStation(f,x).shear);
}
/** 保留FEM单元侧采样值，避免危险点恰在公共边时换到另一单元而改变读数。 */
export function combinedStressAtSample(f:CombinedInput,x:number,index:number,left=false) {
  const field=combinedSectionField(f);if(!field.ok)return null;const q=field.points[index];if(!q)return null;
  return stressComponents(f,x,q,left&&x>0&&x<=f.positionMm?-f.load:combinedStation(f,x).shear);
}
/** 纯扭矩引起的圣维南翘曲。横剪区的附加翘曲不伪装成平截面。 */
export function combinedTorsionWarping(f:CombinedInput,x:number,y:number,z:number,left=false) {
  const q=combinedSectionField(f);if(!q.ok)return 0;const V=left&&x>0&&x<=f.positionMm?-f.load:combinedStation(f,x).shear;return (q.at(y,z)?.omega??0)*(f.torque*1000+q.elasticShearCenterZ*V)/(f.shearMPa*q.J);
}
export function calculateCombined(f:CombinedInput) {
  const errors=invalidParameters({load:f.load,eccentricity:f.eccentricity,torque:f.torque,positionMm:f.positionMm,lengthMm:f.lengthMm,modulusMPa:f.modulusMPa,shearMPa:f.shearMPa,strength:f.strength},['lengthMm','modulusMPa','shearMPa','strength']);
  if(f.positionMm<0||f.positionMm>f.lengthMm)errors.push({field:'position',message:'加载位置必须位于杆件范围内'});
  if(errors.length)return {ok:false as const,diagnostics:errors};
  const section=evaluateSection(f.section);if(section.ok===false)return section;
  const p=section.values,edges=verticalEdges(f.section),root=combinedStation(f,0),end=combinedStation(f,f.lengthMm),circular=['circle','hollow_circle'].includes(f.section.type);
  const equilibrium=combinedEquilibrium(f),criticalCompression=Math.PI**2*f.modulusMPa*Math.min(p.Iy,p.Iz)/(4*f.lengthMm**2),compressionUnsupported=!equilibrium;
  const field=f.mode==='bendtorque'?combinedSectionField(f):null;
  const torsionSupported=f.mode==='eccentric'||!!field?.ok,shearCenterUnsupported=false,transverseShearOmitted=f.mode==='bendtorque'&&f.load!==0&&f.positionMm>0&&!field?.ok;
  const criticalX=f.mode==='eccentric'&&f.load>0?f.lengthMm:0;
  const criticalLabel=!equilibrium?'无稳定解':f.mode==='eccentric'?(f.load*f.eccentricity===0?'全杆':f.load>0?'B端名义截面':'A端名义截面'):(root.moment===0?(f.torque?'全杆等扭矩':'杆内零弯矩/扭矩'):'A端最大弯矩截面');
  const topStress=edges.known&&equilibrium?combinedNormalStress(f,criticalX,edges.top):null,bottomStress=edges.known&&equilibrium?combinedNormalStress(f,criticalX,edges.bottom):null;
  const maxNormal=topStress!==null&&bottomStress!==null?Math.max(Math.abs(topStress),Math.abs(bottomStress)):null;
  let tau:number|null=f.mode==='eccentric'?0:null,mises:number|null=f.mode==='eccentric'?maxNormal:null,tresca=mises,transverseMax:number|null=f.mode==='eccentric'?0:null,totalShearMax:number|null=f.mode==='eccentric'?0:null;
  let hotspot:(ReturnType<typeof stressComponents>&{sampleIndex:number})|null=null;
  if(field?.ok){tau=0;mises=0;tresca=0;transverseMax=0;totalShearMax=0;
    // 各段 M 为线性，V、T 为常数；同一点 VM² 对 x 为凸二次函数，段端搜索足够。
    // 加载点分别取左右极限，避免漏掉剪力跳跃前的危险点。
    const stations=[{x:0,left:false},{x:f.positionMm,left:true},{x:f.positionMm,left:false},{x:f.lengthMm,left:true}];
    for(const station of stations)for(let sampleIndex=0;sampleIndex<field.points.length;sampleIndex++){const q=field.points[sampleIndex];const V=station.left?(station.x<=f.positionMm&&station.x>0?-f.load:0):combinedStation(f,station.x).shear,r=stressComponents(f,station.x,q,V);
      tau=Math.max(tau,Math.hypot(r.torsionY,r.torsionZ));transverseMax=Math.max(transverseMax,Math.hypot(r.shearY,r.shearZ));totalShearMax=Math.max(totalShearMax,r.shear);
      if(!hotspot||r.mises>mises){hotspot={...r,sampleIndex};mises=r.mises;}tresca=Math.max(tresca,r.tresca);
    }
  }
  const material=DEFAULT_MATERIALS.find(m=>m.name===f.materialName),ductile=(material?.category==='metal'&&!f.materialName.includes('铸铁'))||f.materialName==='结构钢 (Structural Steel)';
  const yieldExceeded=ductile&&mises!==null&&mises>=f.strength;
  const stations=f.mode==='eccentric'?[root,end]:Array.from(new Set([...Array.from({length:65},(_,i)=>i*f.lengthMm/64),f.positionMm,Math.max(0,f.positionMm-f.lengthMm*1e-9)])).map(x=>combinedStation(f,x));
  const peakDeflection=Math.max(...stations.map(q=>Math.abs(q.deflection))),peakSlope=Math.max(...stations.map(q=>Math.abs(q.slope))),peakRotation=Math.max(...stations.map(q=>Math.abs('rotation' in q?q.rotation:q.slope))),peakTwist=Math.max(...stations.map(q=>Math.abs(q.twist)));
  const small=equilibrium&&peakDeflection/f.lengthMm<=.05&&peakSlope<=.2&&Math.abs(end.axial)/f.lengthMm<=.05&&(totalShearMax===null||totalShearMax/f.shearMPa<=.05)&&peakTwist<=.15;
  const stabilityUnverified=f.mode==='eccentric'&&f.load<0&&!['rectangle','circle','hollow_circle'].includes(f.section.type);
  const geometryAvailable=small&&torsionSupported&&!stabilityUnverified;
  const phase=!torsionSupported?'截面场不可计算':compressionUnsupported?'压缩达到失稳参考':stabilityUnverified?'开口/未知截面 · 稳定性未核':!small?'超小变形范围':yieldExceeded?'超材料参考 · 弹性外推':f.mode==='eccentric'?'梁柱小挠度 · 含轴力效应':'横剪 + 弯扭 · 截面弹性场';
  const notice=!torsionSupported?(field&&field.ok===false?field.reason:'缺少截面场'):compressionUnsupported?'已无可用的亚临界平衡，不输出侧移、弯矩与边缘应力':stabilityUnverified?'仅求得平面梁柱分量；截面扭转/弯扭稳定性未验证，不作为稳定形态':!small?'位移或转角超出线性梁范围，仅保留参考轮廓':yieldExceeded?'仅显示弹性外推，不表示塑性、颈缩或断裂':f.mode==='eccentric'?(f.load<0?'含压缩二阶放大；接近临界或超小挠度范围时停止展示计算形态':'含拉力几何刚度；B端名义弯矩为 Fe'):'含横剪矢量叠加与弯扭耦合；圣维南自由翘曲，端部约束区不在此模型内';
  const assumptions=[...section.assumptions,f.mode==='eccentric'?'A固定、B自由；等截面、线弹性、小挠度；不含连接区应力集中或局部屈曲。':'A端约束梁的平移与转角，轴向翘曲释放；等截面、各向同性、线弹性、小转角（≤0.15rad）。完全夹紧端的约束翘曲、双力矩及集中载荷边界层不在圣维南模型内。',f.mode==='eccentric'?'偏心力为沿全局x的定向力，e沿全局−y；EI v″=F[e+v(x)−v(L)]，计入轴力几何刚度，轴向伸缩仅用FL/(EA)。':'P沿全局−y并通过形心，T为对形心的总扭矩；Mz=−P(a−x)，Vy=−P（x<a）。截面应力场恢复合力、形心合矩，含剪力诱发扭转；梁位移使用同一场的剪切能柔度及互等耦合。','弱轴欧拉参考只检查弯曲失稳；开口或未知截面的扭转、弯扭失稳未验证。','正应力拉正压负。τxy、τxz先按同一点矢量叠加再计算VM、Tresca；最大值为截面网格采样值，尖锐凹角的局部奇异峰值不作为收敛应力。',...(field?.ok?[field.method+'；J独立于极惯性矩Ip。ν=E/(2G)−1。']:[]),...(edges.known?[]:['自定义截面没有轮廓与边缘距离，不输出边缘应力或等效应力。']),...(ductile?['屈服比是当前弹性梁模型参考，不等于完整承载力验算。']:['当前只按等效各向同性E、G求解；非金属判据、开裂、方向性未标定。'])];
  return calculation({area:p.area,inertia:p.Iz,polar:p.Ip,torsionConstant:field?.ok?field.J:circular?p.Ip:null,shearCenterZ:field?.ok?field.shearCenterZ:null,elasticShearCenterZ:field?.ok?field.elasticShearCenterZ:null,sectionMethod:field?.ok?field.method:null,sectionNodes:field?.ok?field.nodes:0,sectionResidual:field?.ok?field.residual:null,hotspot,transverseMax,totalShearMax,top:edges.top,bottom:edges.bottom,edgeKnown:edges.known,circular,torsionSupported,shearCenterUnsupported,equilibrium,stabilityUnverified,transverseShearOmitted,criticalX,criticalLabel,axialStress:f.mode==='eccentric'?f.load/p.area:0,rootMoment:equilibrium?root.moment:null,tipMoment:equilibrium?end.moment:null,rootShear:root.shear,averageTransverseShear:root.shear/p.area,topStress,bottomStress,maxNormal,tau,mises,tresca,tipDeflection:equilibrium?end.deflection:null,tipExtension:end.axial,tipSlope:equilibrium?end.slope:null,tipTwist:f.mode==='bendtorque'&&!torsionSupported?null:end.twist,ductile,yieldExceeded,geometryAvailable,small,compressionUnsupported,criticalCompression,referenceRatio:ductile&&mises!==null&&mises>0?f.strength/mises:null,phase,notice,peakDeflection,peakSlope,peakRotation,peakTwist},assumptions,[...(geometryAvailable&&!yieldExceeded?[]:[notice]),...(!torsionSupported?[notice]:[]),...(f.mode==='bendtorque'?['截面场为自由翘曲远场；不含实际完全夹紧端的翘曲约束应力。']:[])]);
}
export type CombinedValues=Extract<ReturnType<typeof calculateCombined>,{ok:true}>['values'];
export function combinedVertex(f:CombinedInput,x:number,y:number,z:number,amplification:number):[number,number,number] {
  const s=combinedStation(f,x),a=s.twist*amplification,c=Math.cos(a),d=Math.sin(a),rotatedY=y*c-z*d,rotatedZ=y*d+z*c,axialGradient=f.mode==='eccentric'?f.load/(f.modulusMPa*calculateSectionProperties(f.section).area):0,theta=Math.atan2(('rotation' in s?s.rotation:s.slope)*amplification,1+axialGradient*amplification),scale=560/f.lengthMm;
  // 端扭矩的圣维南翘曲分量沿局部杆轴加入。它沿等截面杆连续；
  // 集中剪力引起的局部翘曲变化另在截面检视展示，不伪造加载区实体解。
  const field=f.mode==='bendtorque'?combinedSectionField(f):null,warp=field?.ok?(field.at(y,z)?.omega??0)*f.torque*1000/(f.shearMPa*field.J)*amplification:0;
  return [(x+s.axial*amplification+warp*Math.cos(theta)-rotatedY*Math.sin(theta)-f.lengthMm/2)*scale,(s.deflection*amplification+warp*Math.sin(theta)+rotatedY*Math.cos(theta))*scale,rotatedZ*scale];
}
/** 应力场使用空间截面坐标：不能让弯曲拉压区随材料表面网格一起扭转。 */
export function combinedStressVertex(f:CombinedInput,x:number,y:number,z:number,amplification:number):[number,number,number] {
  const a=combinedStation(f,x).twist*amplification,c=Math.cos(a),s=Math.sin(a);
  return combinedVertex(f,x,y*c+z*s,-y*s+z*c,amplification);
}
