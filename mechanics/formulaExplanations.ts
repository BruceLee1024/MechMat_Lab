import type {SimulationState} from '../types';
import type {calculateAxialTeaching,calculateBendingTeaching,calculateBucklingTeaching,calculateTorsionTeaching,calculatePlaneStress} from './calculations';
import type {calculateFundamentals} from './fundamentals';
import {combinedSectionField,type CombinedInput,type CombinedValues} from './combined';
import {getAxialMaterialResponse} from './axialResponse';
import {calculateSectionProperties} from './sections';
import {bendingProfile} from './sectionOutline';
import type {sectionStudy} from './conceptStudies';

export interface FormulaSymbol {symbol:string;name:string;value?:number|null;unit?:string}
export interface FormulaValue {key:string;symbol:string;value:number;unit:string}
export interface FormulaDetails {symbols:FormulaSymbol[];steps:string[];results:FormulaValue[];note?:string;status?:'reference'|'unavailable'}
export interface FormulaEntry {label:string;formula:string;details?:FormulaDetails}
type Values<T> = T extends {ok:true;values:infer V}?V:never;
type Axial=Values<ReturnType<typeof calculateAxialTeaching>>;
type Bending=Values<ReturnType<typeof calculateBendingTeaching>>;
type Torsion=Values<ReturnType<typeof calculateTorsionTeaching>>;
type Buckling=Values<ReturnType<typeof calculateBucklingTeaching>>;
type Stress=Values<ReturnType<typeof calculatePlaneStress>>;
type Fundamentals=Values<ReturnType<typeof calculateFundamentals>>;

/** 代入数字保留8位有效数字；正负号、量纲与计算层一致，不从界面舍入读数反算。 */
export function texNumber(n:number):string {
  if(!Number.isFinite(n))return String.raw`\text{未计算}`;
  if(n===0)return '0';
  const text=Number(n.toPrecision(8)).toString(),parts=text.split('e');
  const body=parts.length===2?`${parts[0]}\\times10^{${Number(parts[1])}}`:text;
  return n<0?`\\left(${body}\\right)`:body;
}
const n=texNumber;
const symbol=(symbol:string,name:string,value?:number|null,unit=''):FormulaSymbol=>({symbol,name,value,unit});
const value=(key:string,symbol:string,value:number,unit=''):FormulaValue=>({key,symbol,value,unit});
const entry=(label:string,formula:string,symbols:FormulaSymbol[],steps:string[],results:FormulaValue[]=[],note?:string,status?:FormulaDetails['status']):FormulaEntry=>({label,formula,details:{symbols,steps,results,note,status}});
const ESymbol=(E:number)=>symbol('E','弹性模量',E,'MPa');
const LSymbol=(L:number)=>symbol('L','杆长 / 跨度',L,'mm');
const area=(A:number)=>symbol('A','截面积',A,'mm²');
const inertia=(I:number)=>symbol('I_z','绕 z 轴截面惯性矩',I,'mm⁴');
const unitE=(E:number)=>`E=${n(E/1000)}\\,\\mathrm{GPa}=${n(E)}\\,\\mathrm{MPa}`;
const unitL=(L:number,label='L')=>`${label}=${n(L/1000)}\\,\\mathrm{m}=${n(L)}\\,\\mathrm{mm}`;

export function bendingFormulas(s:SimulationState,v:Bending):FormulaEntry[] {
  const P=s.bendLoad,L=v.L_mm,a=v.a_mm,b=v.b_mm,E=v.E_MPa,I=v.inertia;
  const common=[symbol('P','集中载荷，向下为正',P,'N'),LSymbol(L),symbol('a','左支座至载荷距离',a,'mm'),symbol('b','载荷至右支座距离',b,'mm')];
  const reference=v.extrapolated?'reference':undefined,note=v.extrapolated?`${v.phase}：以下为 EB 平面弯曲参考值。`:undefined;
  return [
    entry('支座反力',String.raw`R_A=\frac{Pb}{L},\quad R_B=\frac{Pa}{L}`,[...common,symbol('R_A,R_B','左右支反力，向上为正')],[unitL(L),`b=${n(L)}-${n(a)}=${n(b)}\\,\\mathrm{mm}`,`R_A=\\frac{${n(P)}\\times${n(b)}}{${n(L)}}=${n(v.R1)}\\,\\mathrm N`,`R_B=\\frac{${n(P)}\\times${n(a)}}{${n(L)}}=${n(v.R2)}\\,\\mathrm N`],[value('RA','R_A',v.R1,'N'),value('RB','R_B',v.R2,'N')]),
    entry('最大弯矩',String.raw`M_{max}=\frac{Pab}{L}`,[...common,symbol('M_{max}','加载截面弯矩，保留符号')],[`M_{max}=\\frac{${n(P)}\\times${n(a)}\\times${n(b)}}{${n(L)}}=${n(v.momentNmm)}\\,\\mathrm{N\\cdot mm}`,`M_{max}=${n(v.momentNmm)}\\div1000=${n(v.maxMoment)}\\,\\mathrm{N\\cdot m}`],[value('moment','M_{max}',v.maxMoment,'N·m')]),
    entry('加载点挠度',String.raw`w(a)=\frac{Pa^2b^2}{3EI_zL}`,[...common,ESymbol(E),inertia(I),symbol('w(a)','加载点挠度，向下为正')],[unitE(E),`w(a)=\\frac{${n(P)}\\times${n(a)}^2\\times${n(b)}^2}{3\\times${n(E)}\\times${n(I)}\\times${n(L)}}`, `w(a)=${n(v.deflectionAtLoad)}\\,\\mathrm{mm}`],[value('loadDeflection','w(a)',v.deflectionAtLoad,'mm')],note??'这是载荷点挠度；偏置加载时，不等于全梁最大挠度。',reference),
    entry('截面正应力',String.raw`\sigma_x=-\frac{M_zy}{I_z}`,[symbol('M_z','截面弯矩',v.momentNmm,'N·mm'),symbol('y','相对形心的带符号纤维坐标'),symbol('c','形心至最远边缘的绝对距离',v.yMax,'mm'),inertia(I),symbol('\\sigma_x','正应力，拉正压负')],v.maxStress===null?[]:[`|\\sigma|_{max}=\\frac{|${n(v.momentNmm)}|\\times${n(v.yMax!)}}{${n(I)}}=${n(v.maxStress)}\\,\\mathrm{MPa}`],v.maxStress===null?[]:[value('edgeStress','|\\sigma|_{max}',v.maxStress,'MPa')],v.maxStress===null?'缺少真实边缘坐标，不代入示意距离计算应力。':note??'结果栏对应最远纤维的应力绝对值；单点正负号仍按 −My/I。',v.maxStress===null?'unavailable':reference),
    entry('弯曲应变能',String.raw`U=\frac{P^2a^2b^2}{6EI_zL}`,[...common,ESymbol(E),inertia(I),symbol('U','线弹性弯曲应变能')],v.energyApplicable?[unitE(E),`U=\\frac{${n(P)}^2\\times${n(a)}^2\\times${n(b)}^2}{6\\times${n(E)}\\times${n(I)}\\times${n(L)}}=${n(v.strainEnergy)}\\,\\mathrm{N\\cdot mm}`,`U=${n(v.strainEnergy)}\\div1000=${n(v.strainEnergy/1000)}\\,\\mathrm J`]:[],v.energyApplicable?[value('energy','U',v.strainEnergy/1000,'J')]:[],v.energyApplicable?undefined:'当前模型适用性未验证，不代入并输出有效弹性应变能。',v.energyApplicable?undefined:'unavailable'),
  ];
}

export function bucklingFormulas(s:SimulationState,v:Buckling):FormulaEntry[] {
  const p=calculateSectionProperties(s.buckleSection),P=s.buckleLoad,L=v.L_mm,E=v.E,I=v.I_min;
  const ILabel=String.raw`I_{min}`,reference=!v.stabilityVerified||v.eulerApplicable!==true?'reference':undefined;
  const e=v.displacementAvailable?v.totalBow:null,profile=bendingProfile(s.buckleSection),coords=profile.contours.flat().map(q=>v.weakAxis==='z'?q[0]:q[1]);
  const qMin=coords.length?Math.min(...coords):null,qMax=coords.length?Math.max(...coords):null;
  const bowSymbols=[symbol('e_0','无应力初弯曲中跨幅值',s.buckleInitialBow,'mm'),symbol('P','轴向压力，非负',P,'N'),symbol('P_{cr}','弱轴欧拉参考力',v.Pcr,'N'),symbol('e','加载后中跨总侧移',e,'mm')];
  const bowNote=e===null?`${v.notice}。不代入亚临界公式计算有效侧移。`:undefined;
  return [
    entry('弱轴惯性矩',String.raw`I_{min}=\min(I_y,I_z)`,[symbol('I_y','绕 y 轴截面惯性矩',p.Iy,'mm⁴'),inertia(p.Iz),symbol(ILabel,'弱轴截面惯性矩',I,'mm⁴')],[`I_{min}=\\min(${n(p.Iy)},${n(p.Iz)})=${n(I)}\\,\\mathrm{mm}^4`],[value('weakInertia',ILabel,I,'mm⁴')]),
    entry('欧拉临界力',String.raw`P_{cr}=\frac{\pi^2 EI_{min}}{(\mu L)^2}`,[ESymbol(E),LSymbol(L),symbol(ILabel,'弱轴截面惯性矩',I,'mm⁴'),symbol('\\mu','两端铰支计算长度系数',1),symbol('P_{cr}','弱轴弯曲欧拉参考力')],[unitE(E),unitL(L),`P_{cr}=\\frac{\\pi^2\\times${n(E)}\\times${n(I)}}{(1\\times${n(L)})^2}=${n(v.Pcr)}\\,\\mathrm N`,`P_{cr}=${n(v.Pcr/1000)}\\,\\mathrm{kN}`],[value('critical','P_{cr}',v.Pcr/1000,'kN')],reference?v.notice:undefined,reference),
    entry('惯性半径与长细比',String.raw`i=\sqrt{I_{min}/A},\quad\lambda=\mu L/i`,[symbol(ILabel,'弱轴惯性矩',I,'mm⁴'),area(v.Area),LSymbol(L),symbol('i','惯性半径'),symbol('\\lambda','无量纲长细比'),symbol('\\mu','计算长度系数',1)],[`i=\\sqrt{\\frac{${n(I)}}{${n(v.Area)}}}=${n(v.radiusOfGyration)}\\,\\mathrm{mm}`,`\\lambda=\\frac{1\\times${n(L)}}{${n(v.radiusOfGyration)}}=${n(v.lambda)}`],[value('gyration','i',v.radiusOfGyration,'mm'),value('slenderness','\\lambda',v.lambda)]),
    entry('亚临界初弯曲放大',String.raw`e=\frac{e_0}{1-P/P_{cr}},\quad P<P_{cr}`,bowSymbols,[`P/P_{cr}=\\frac{${n(P)}}{${n(v.Pcr)}}=${n(v.loadRatio)}`,...(e===null?[]:[`e=\\frac{${n(s.buckleInitialBow)}}{1-${n(v.loadRatio)}}=${n(e)}\\,\\mathrm{mm}`])],e===null?[]:[value('totalBow','e',e,'mm')],bowNote,e===null?'unavailable':undefined),
    entry('横向形态',String.raw`w(x)=e\sin\frac{\pi x}{L}`,[symbol('x','沿杆长坐标，本次取中跨',L/2,'mm'),LSymbol(L),symbol('e','中跨总侧移',e,'mm'),symbol('w','横向侧移')],e===null?[]:[`w(L/2)=${n(e)}\\sin\\frac{\\pi\\times${n(L/2)}}{${n(L)}}=${n(e)}\\,\\mathrm{mm}`],e===null?[]:[value('midBow','w(L/2)',e,'mm')],bowNote??'核对位置为中跨；形变显示倍率不参与代入。',e===null?'unavailable':undefined),
    entry('纤维拉压正应力',String.raw`\sigma_x=-\frac{P}{A}+\frac{Pw(x)q}{I_{min}}`,[symbol('P','轴向压力',P,'N'),area(v.Area),symbol('w(L/2)','中跨总侧移',e,'mm'),symbol('q_{min}','弱轴侧移方向的最小纤维坐标',qMin,'mm'),symbol('q_{max}','弱轴侧移方向的最大纤维坐标',qMax,'mm'),symbol(ILabel,'弱轴惯性矩',I,'mm⁴')],e===null||qMin===null||qMax===null?[]:[`\\sigma_{min}=-\\frac{${n(P)}}{${n(v.Area)}}+\\frac{${n(P)}\\times${n(e)}\\times${n(qMin)}}{${n(I)}}=${n(v.minNormalStress!)}\\,\\mathrm{MPa}`,`\\sigma_{max}=-\\frac{${n(P)}}{${n(v.Area)}}+\\frac{${n(P)}\\times${n(e)}\\times${n(qMax)}}{${n(I)}}=${n(v.maxNormalStress!)}\\,\\mathrm{MPa}`],e===null||v.minNormalStress===null||v.maxNormalStress===null?[]:[value('sigmaMin','\\sigma_{min}',v.minNormalStress,'MPa'),value('sigmaMax','\\sigma_{max}',v.maxNormalStress,'MPa')],e===null?`${v.notice}；不代入参考模态幅值生成有效应力。`:'中跨纤维应力，拉正压负；使用总侧移，不是新增侧移。',e===null?'unavailable':undefined),
  ];
}

export function torsionFormulas(s:SimulationState,v:Torsion):FormulaEntry[] {
  const J=v.Ip,G=v.G_MPa,L=v.L_total_mm,T1=v.T_AB_Nm*1000,T2=v.T_BC_Nm*1000;
  const torques=[symbol('T_{AB}','AB 段内扭矩',T1,'N·mm'),symbol('T_{BC}','BC 段内扭矩',T2,'N·mm'),symbol('\\eta','B 输出比例',s.torqLoadRatio),symbol('J','实心圆极惯性矩',J,'mm⁴')];
  const ref=v.extrapolated?'reference':undefined;
  return [
    entry('实心圆极惯性矩',String.raw`J=\frac{\pi r^4}{2}`,[symbol('r','圆轴半径',s.torqRadius,'mm'),symbol('J','极惯性矩')],[`J=\\frac{\\pi\\times${n(s.torqRadius)}^4}{2}=${n(J)}\\,\\mathrm{mm}^4`],[value('polar','J',J,'mm⁴')]),
    entry('切应力沿半径分布',String.raw`\tau(\rho)=\frac{T\rho}{J}`,[...torques,symbol('\\rho','径向距离，当前取表面',s.torqRadius,'mm')],[`T_{AB}=${n(s.torqTorque)}\\times1000=${n(T1)}\\,\\mathrm{N\\cdot mm}`,`T_{BC}=${n(T1)}(1-${n(s.torqLoadRatio)})=${n(T2)}\\,\\mathrm{N\\cdot mm}`,`|\\tau|_{max}=\\frac{|${n(T1)}|\\times${n(s.torqRadius)}}{${n(J)}}=${n(v.maxShear)}\\,\\mathrm{MPa}`],[value('tau','|\\tau|_{max}',v.maxShear,'MPa')],v.extrapolated?v.notice:undefined,ref),
    entry('分段相对扭转角',String.raw`\varphi_C=\frac{T_{AB}L_{AB}+T_{BC}L_{BC}}{GJ}`,[...torques,symbol('G','剪切模量',G,'MPa'),symbol('L_{AB},L_{BC}','两个等长轴段',L/2,'mm'),symbol('\\varphi_C','C 相对于 A 的转角')],[`G=${n(s.torqModulus)}\\,\\mathrm{GPa}=${n(G)}\\,\\mathrm{MPa}`,unitL(L),`\\varphi_C=\\frac{${n(T1)}\\times${n(L/2)}+${n(T2)}\\times${n(L/2)}}{${n(G)}\\times${n(J)}}=${n(v.phi_total_rad)}\\,\\mathrm{rad}`,`\\varphi_C=${n(v.phi_total_rad)}\\times\\frac{180}{\\pi}=${n(v.phi_total_deg)}^\\circ`],[value('angle','\\varphi_C',v.phi_total_deg,'°')],v.extrapolated?v.notice:'A 只作为角度参考，不是固定支座；转角保留正负号。',ref),
    entry('弹性扭转应变能',String.raw`U=\frac{T_{AB}^2L_{AB}+T_{BC}^2L_{BC}}{2GJ}`,[...torques,symbol('G','剪切模量',G,'MPa'),symbol('L_{AB},L_{BC}','轴段长度',L/2,'mm'),symbol('U','弹性应变能')],v.energyApplicable?[`U=\\frac{${n(T1)}^2\\times${n(L/2)}+${n(T2)}^2\\times${n(L/2)}}{2\\times${n(G)}\\times${n(J)}}\\div1000`, `U=${n(v.U_total_J)}\\,\\mathrm J`]:[],v.energyApplicable?[value('energy','U',v.U_total_J,'J')]:[],v.energyApplicable?'N·mm 除以1000换算为 J。':'当前为外推工况，不代入有效弹性应变能。',v.energyApplicable?undefined:'unavailable'),
  ];
}

export function axialFormulas(s:SimulationState,v:Axial,section=false):FormulaEntry[] {
  const F=s.axialForce,A=s.axialArea,E=v.modulusMPa,L=v.lengthMm;
  const sig=symbol('\\sigma','工程应力',v.stress,'MPa');
  if(section){
    const a=s.axialObliqueAngle*Math.PI/180,normal=v.stress*Math.cos(a)**2,shear=v.stress*Math.sin(2*a)/2;
    const symbols=[sig,symbol('\\alpha','截面法线与杆轴夹角',s.axialObliqueAngle,'°')];
    return [entry('截面正应力',String.raw`\sigma_\alpha=\sigma\cos^2\alpha`,symbols,[`\\sigma_\\alpha=${n(v.stress)}\\cos^2(${n(s.axialObliqueAngle)}^\\circ)=${n(normal)}\\,\\mathrm{MPa}`],[value('normal','\\sigma_\\alpha',normal,'MPa')]),entry('截面切应力',String.raw`\tau_\alpha=\frac{\sigma}{2}\sin2\alpha`,symbols,[`\\tau_\\alpha=\\frac{${n(v.stress)}}{2}\\sin(2\\times${n(s.axialObliqueAngle)}^\\circ)=${n(shear)}\\,\\mathrm{MPa}`],[value('shear','\\tau_\\alpha',shear,'MPa')])];
  }
  const material=getAxialMaterialResponse({materialName:s.materialName,modulus:s.bendModulus,yieldStrength:s.materialYield});
  const smooth=v.strainMode==='teaching'&&v.modelFamily==='smooth',plateau=v.strainMode==='teaching'&&v.modelFamily==='plateau';
  const strainFormula=smooth?String.raw`\varepsilon=\frac{\sigma}{E}+0.002\left(\frac{\sigma}{R_{p0.2}}\right)^n`:plateau?String.raw`\varepsilon=\varepsilon_p+\frac{\sigma/\sigma_y-1}{k-1}(\varepsilon_u-\varepsilon_p)`:String.raw`\varepsilon=\frac{\sigma}{E}`;
  const strainStep=smooth?`\\varepsilon=\\frac{${n(v.stress)}}{${n(E)}}+0.002\\left(\\frac{${n(v.stress)}}{${n(s.materialYield)}}\\right)^{${material.exponent}}`:plateau?`\\varepsilon=${n(material.plateauEnd)}+\\frac{${n(v.stress)}/${n(s.materialYield)}-1}{${n(material.peakRatio)}-1}(${n(material.peakStrain)}-${n(material.plateauEnd)})`:`\\varepsilon=\\frac{${n(v.stress)}}{${n(E)}}`;
  const ref=v.strainMode==='elastic-estimate'?'reference':undefined;
  const materialSymbols=smooth?[symbol('R_{p0.2}','0.2% 偏移参考强度',s.materialYield,'MPa'),symbol('n','所选材料的教学指数',material.exponent)]:plateau?[symbol('\\sigma_y','屈服参考',s.materialYield,'MPa'),symbol('\\varepsilon_p','教学平台末端应变',material.plateauEnd),symbol('\\varepsilon_u','教学峰值应变',material.peakStrain),symbol('k','教学峰值应力 / 屈服参考',material.peakRatio)]:[];
  return [
    entry('工程应力',String.raw`\sigma=\frac{F}{A_0}`,[symbol('F','轴向力，拉正压负',F,'N'),symbol('A_0','初始截面积',A,'mm²')],[`\\sigma=\\frac{${n(F)}}{${n(A)}}=${n(v.stress)}\\,\\mathrm{MPa}`],[value('stress','\\sigma',v.stress,'MPa')]),
    entry(smooth?'连续屈服教学应变':plateau?'平台后强化教学应变':ref?'线弹性估算应变':'弹性应变',strainFormula,[sig,ESymbol(E),...materialSymbols,symbol('\\varepsilon','无量纲轴向应变；结果以%显示')],[unitE(E),`${strainStep}=${n(v.strain)}`,`\\varepsilon=${n(v.strain)}\\times100\\%=${n(v.strain*100)}\\%`],[value('strain','\\varepsilon',v.strain*100,'%')],ref?'仅为线弹性估算，不能对应材料实际破坏后的变形。':smooth||plateau?'当前材料教学曲线的同一加载分支，不是实测本构。':material.family==='plateau'&&v.stress===s.materialYield?'力控制平台应变不唯一；当前结果取平台起点。':undefined,ref),
    entry('杆件伸长',String.raw`\Delta L=\varepsilon L_0`,[symbol('\\varepsilon','当前材料模型输出的无量纲应变',v.strain),symbol('L_0','初始杆长',L,'mm')],[unitL(L,'L_0'),`\\Delta L=${n(v.strain)}\\times${n(L)}=${n(v.deformation)}\\,\\mathrm{mm}`],[value('extension','\\Delta L',v.deformation,'mm')],ref?'使用估算应变；结果不作为真实非线性伸长。':undefined,ref),
    entry('弹性应变能',String.raw`U=\frac{F^2L_0}{2EA_0}`,[symbol('F','轴向力',F,'N'),symbol('L_0','初始杆长',L,'mm'),ESymbol(E),symbol('A_0','初始面积',A,'mm²')],v.energyApplicable?[`U=\\frac{${n(F)}^2\\times${n(L)}}{2\\times${n(E)}\\times${n(A)}}\\div1000=${n(v.totalStrainEnergyJ)}\\,\\mathrm J`]:[],v.energyApplicable?[value('energy','U',v.totalStrainEnergyJ,'J')]:[],v.energyApplicable?'内部能量 N·mm 除以1000换算为 J。':'当前材料分支或工况不适用线弹性应变能，不代入有效值。',v.energyApplicable?undefined:'unavailable'),
  ];
}

export function fundamentalsFormulas(s:SimulationState,v:Fundamentals):FormulaEntry[] {
  const A=v.currentWidth**2,E=v.modulusMPa,reference=Math.abs(v.stress)>s.materialYield?'reference':undefined;
  const note=reference?'当前为超过参考强度的线弹性外推。':undefined;
  return [
    entry('工程应力',String.raw`\sigma=E\varepsilon_{axial}`,[ESymbol(E),symbol('\\varepsilon_{axial}','轴向应变，无量纲',v.strain)],[unitE(E),`\\sigma=${n(E)}\\times${n(v.strain)}=${n(v.stress)}\\,\\mathrm{MPa}`],[value('stress','\\sigma',v.stress,'MPa')],note,reference),
    entry('真应力',String.raw`\sigma_{true}=\frac{F}{A}`, [symbol('F','当前轴向力',s.axialForce,'N'),symbol('w','当前截面边长，未放大',v.currentWidth,'mm'),symbol('A','当前截面积，未放大',A,'mm²'),symbol('A_0','初始面积',s.axialArea,'mm²')],[`A=${n(v.currentWidth)}^2=${n(A)}\\,\\mathrm{mm}^2`,`\\sigma_{true}=\\frac{${n(s.axialForce)}}{${n(A)}}=${n(v.trueStress)}\\,\\mathrm{MPa}`],[value('trueStress','\\sigma_{true}',v.trueStress,'MPa')],note??'当前面积来自未放大的泊松变形，不能使用画面放大尺寸。',reference),
    entry('横向应变',String.raw`\varepsilon_{trans}=-\nu\varepsilon_{axial}`,[symbol('\\nu','泊松比',s.poissonRatio),symbol('\\varepsilon_{axial}','轴向应变，无量纲',v.strain),symbol('\\varepsilon_{trans}','横向应变，无量纲')],[`\\varepsilon_{trans}=-${n(s.poissonRatio)}\\times${n(v.strain)}=${n(v.transverseStrain)}`,`\\varepsilon_{trans}=${n(v.transverseStrain*100)}\\%`],[value('transverse','\\varepsilon_{trans}',v.transverseStrain*100,'%')],note,reference),
  ];
}

export function stressFormulas(s:SimulationState,v:Stress):FormulaEntry[] {
  const C=v.avg,D=v.diff,theta=((s.stressAngle%180)+180)%180;
  const inputs=[symbol('\\sigma_x','x 面正应力，拉正压负',s.stressSigX,'MPa'),symbol('\\sigma_y','y 面正应力',s.stressSigY,'MPa'),symbol('\\tau_{xy}','带符号互等剪应力',s.stressTauXY,'MPa'),symbol('\\theta','截面逆时针角度，按180°约化',theta,'°'),symbol('C','莫尔圆圆心',C,'MPa'),symbol('D','半差 (σx−σy)/2',D,'MPa')];
  return [
    entry('旋转截面正应力',String.raw`\sigma_{x'}=C+D\\cos2\\theta+\\tau_{xy}\\sin2\\theta`,inputs,[`\\sigma_{x'}=${n(C)}+${n(D)}\\cos(2\\times${n(theta)}^\\circ)+${n(s.stressTauXY)}\\sin(2\\times${n(theta)}^\\circ)`,`\\sigma_{x'}=${n(v.sigX_prime)}\\,\\mathrm{MPa}`],[value('sigmaXPrime',"\\sigma_{x'}",v.sigX_prime,'MPa')]),
    entry('互等剪应力',String.raw`\tau_{x'y'}=-D\sin2\theta+\tau_{xy}\cos2\theta`,inputs,[`\\tau_{x'y'}=-${n(D)}\\sin(2\\times${n(theta)}^\\circ)+${n(s.stressTauXY)}\\cos(2\\times${n(theta)}^\\circ)`,`\\tau_{x'y'}=${n(v.tauXY_prime)}\\,\\mathrm{MPa}`],[value('tauPrime',"\\tau_{x'y'}",v.tauXY_prime,'MPa')]),
    entry('圆心、半径与面内主应力',String.raw`C=\frac{\sigma_x+\sigma_y}{2},\quad R=\sqrt{D^2+\tau_{xy}^2},\quad\sigma_{\mathrm{I,II}}=C\pm R`,[...inputs,symbol('R','面内莫尔圆半径',v.R,'MPa'),symbol('\\sigma_{\\mathrm I}','面内较大主应力',v.sig1,'MPa'),symbol('\\sigma_{\\mathrm{II}}','面内较小主应力',v.sig2,'MPa')],[`C=\\frac{${n(s.stressSigX)}+${n(s.stressSigY)}}2=${n(C)}\\,\\mathrm{MPa}`,`D=\\frac{${n(s.stressSigX)}-${n(s.stressSigY)}}2=${n(D)}\\,\\mathrm{MPa}`,`R=\\sqrt{${n(D)}^2+${n(s.stressTauXY)}^2}=${n(v.R)}\\,\\mathrm{MPa}`,`\\sigma_{\\mathrm I}=${n(C)}+${n(v.R)}=${n(v.sig1)}\\,\\mathrm{MPa}`,`\\sigma_{\\mathrm{II}}=${n(C)}-${n(v.R)}=${n(v.sig2)}\\,\\mathrm{MPa}`],[value('principal1','\\sigma_{\\mathrm I}',v.sig1,'MPa'),value('principal2','\\sigma_{\\mathrm{II}}',v.sig2,'MPa')]),
    entry('最大主应力方向',String.raw`\theta_p=\left[\frac12\operatorname{atan2}(\tau_{xy},D)\frac{180^\circ}{\pi}\right]\pmod{180^\circ}`,inputs,v.principalAngle===null?[]:[`\\theta_p=\\left[\\tfrac12\\operatorname{atan2}(${n(s.stressTauXY)},${n(D)})\\frac{180^\\circ}{\\pi}\\right]\\pmod{180^\\circ}`,`\\theta_p=${n(v.principalAngle)}^\\circ`],v.principalAngle===null?[]:[value('principalAngle','\\theta_p',v.principalAngle,'°')],v.principalAngle===null?'R=0，面内主方向任意；不代入 atan2(0,0) 生成唯一方向。':'atan2 返回弧度，换算成度后约化到 [0°,180°)。',v.principalAngle===null?'unavailable':undefined),
    entry('空间最大剪应力（平面应力条件）',String.raw`\tau_{\max,3D}=\frac{\max(\sigma_{\mathrm I},0)-\min(\sigma_{\mathrm{II}},0)}2`,[symbol('\\sigma_{\\mathrm I}','面内较大主应力',v.sig1,'MPa'),symbol('\\sigma_{\\mathrm{II}}','面内较小主应力',v.sig2,'MPa'),symbol('\\sigma_z','第三主应力，平面应力条件',0,'MPa')],[`\\tau_{\\max,3D}=\\frac{\\max(${n(v.sig1)},0)-\\min(${n(v.sig2)},0)}2=${n(v.absoluteMaxShear)}\\,\\mathrm{MPa}`],[value('spaceShear','\\tau_{\\max,3D}',v.absoluteMaxShear,'MPa')],'空间主应力包含0；不要把面内莫尔圆半径直接当作空间最大剪应力。'),
  ];
}

export function combinedFormulas(f:CombinedInput,v:CombinedValues):FormulaEntry[] {
  const F=f.load,E=f.modulusMPa,G=f.shearMPa,L=f.lengthMm,I=v.inertia,A=v.area;
  const ref=!v.geometryAvailable||v.yieldExceeded?'reference':undefined;
  const base=[ESymbol(E),inertia(I),LSymbol(L)],note=ref?v.notice:undefined;
  if(f.mode==='eccentric'){
    const x=v.criticalX,M=x===0?v.rootMoment:v.tipMoment,vx=x===0?0:v.tipDeflection;
    const symbols=[symbol('F','偏心轴力，拉正压负',F,'N'),symbol('e','偏心距，沿全局−y为正',f.eccentricity,'mm'),symbol('x_*','求解器控制截面位置',x,'mm'),symbol('v(x_*)','控制截面横向位移',vx,'mm'),symbol('v_B','自由端横向位移',v.tipDeflection,'mm')];
    return [
      entry('轴力与偏心弯矩',String.raw`N=F,\quad M_z(x)=F[e+v(x)-v_B]`,symbols,M===null?[]:[`N=${n(F)}\\,\\mathrm N`,`M_z(x_*)=${n(F)}[${n(f.eccentricity)}+${n(vx!)}-${n(v.tipDeflection!)}]=${n(M)}\\,\\mathrm{N\\cdot mm}`],M===null?[]:[value('criticalMoment','M_z(x_*)',M,'N·mm')],M===null?'当前无稳定平衡，不代入占位位移或弯矩。':`${v.criticalLabel}，使用含轴力效应的梁柱弯矩。${note??''}`,M===null?'unavailable':ref),
      entry('正应力叠加',String.raw`\sigma_x(y)=\frac FA-\frac{M_z(x)y}{I_z}`,[...symbols,area(A),inertia(I),symbol('y_t','相对形心的上边缘坐标',v.edgeKnown?v.top:null,'mm'),symbol('y_b','相对形心的下边缘坐标',v.edgeKnown?v.bottom:null,'mm')],M===null||v.topStress===null||v.bottomStress===null?[]:[`\\sigma_t=\\frac{${n(F)}}{${n(A)}}-\\frac{${n(M)}\\times${n(v.top)}}{${n(I)}}=${n(v.topStress)}\\,\\mathrm{MPa}`,`\\sigma_b=\\frac{${n(F)}}{${n(A)}}-\\frac{${n(M)}\\times${n(v.bottom)}}{${n(I)}}=${n(v.bottomStress)}\\,\\mathrm{MPa}`],v.topStress===null||v.bottomStress===null?[]:[value('topStress','\\sigma_t',v.topStress,'MPa'),value('bottomStress','\\sigma_b',v.bottomStress,'MPa')],!v.edgeKnown?'未提供边缘几何，不代入虚构纤维坐标。':!v.equilibrium?'当前无稳定平衡，不输出有效纤维应力。':note,v.topStress===null?'unavailable':ref),
      entry('端部轴向伸缩',String.raw`u_B=\frac{FL}{EA}`,[symbol('F','带符号轴力',F,'N'),area(A),...base],[unitE(E),unitL(L),`u_B=\\frac{${n(F)}\\times${n(L)}}{${n(E)}\\times${n(A)}}=${n(v.tipExtension)}\\,\\mathrm{mm}`],[value('extension','u_B',v.tipExtension,'mm')],note??'轴向弹性分量；拉为伸长，压为缩短。',ref),
      entry('梁柱平衡',String.raw`EI_zv^{\prime\prime}=F[e+v(x)-v_B]`,[...base,...symbols],M===null?[]:[`EI_z=${n(E)}\\times${n(I)}=${n(E*I)}\\,\\mathrm{N\\cdot mm}^2`,`v^{\\prime\\prime}(x_*)=\\frac{${n(M)}}{${n(E)}\\times${n(I)}}=${n(M/(E*I))}\\,\\mathrm{mm}^{-1}`],[],M===null?'无稳定平衡，不输出曲率代入。':`核对截面 x=${x} mm；不是将整杆弯矩统一取为 Fe。`,M===null?'unavailable':ref),
    ];
  }
  const q=combinedSectionField(f),h=v.hotspot;
  const point=h?`控制采样点 x=${Number(h.x.toPrecision(8))} mm，y=${Number(h.y.toPrecision(8))} mm，z=${Number(h.z.toPrecision(8))} mm。`:'';
  const stressSymbols=[symbol('\\tau_{xy}^{V}','该点横剪的 xy 分量',h?.shearY??null,'MPa'),symbol('\\tau_{xy}^{T}','该点扭转的 xy 分量',h?.torsionY??null,'MPa'),symbol('\\tau_{xz}^{V}','该点横剪的 xz 分量',h?.shearZ??null,'MPa'),symbol('\\tau_{xz}^{T}','该点扭转的 xz 分量',h?.torsionZ??null,'MPa'),symbol('s_y,s_z','单位横向剪力对应的截面应力场'),symbol('t_y,t_z','单位扭矩对应的截面应力场')];
  return [
    entry('A端弯矩',String.raw`M_{z,A}=-Pa`,[symbol('P','横向集中力，沿−y为正',F,'N'),symbol('a','A端至加载点距离',f.positionMm,'mm')],[`M_{z,A}=-${n(F)}\\times${n(f.positionMm)}=${n(v.rootMoment!)}\\,\\mathrm{N\\cdot mm}`,`M_{z,A}=${n(v.rootMoment!/1000)}\\,\\mathrm{N\\cdot m}`],[value('rootMoment','M_{z,A}',v.rootMoment!/1000,'N·m')]),
    entry('截面剪应力矢量叠加',String.raw`\tau_{xy}=Vs_y+Tt_y,\quad\tau_{xz}=Vs_z+Tt_z`,stressSymbols,h?[`\\tau_{xy}=${n(h.shearY)}+${n(h.torsionY)}=${n(h.tauXY)}\\,\\mathrm{MPa}`,`\\tau_{xz}=${n(h.shearZ)}+${n(h.torsionZ)}=${n(h.tauXZ)}\\,\\mathrm{MPa}`]:[],h?[value('tauXY','\\tau_{xy}',h.tauXY,'MPa'),value('tauXZ','\\tau_{xz}',h.tauXZ,'MPa')]:[],h?`${point} 与求解器同一单元侧采样；不拼接分量独立最大值。`:'截面场不可用，不代入圆轴近似或占位零值。',h?ref:'unavailable'),
    entry('含横剪与耦合的端部侧移',String.raw`v_B=-\frac{Pa^2(3L-a)}{6EI_z}+\frac{-PaC_{VV}+TL C_{VT}}G`,[...base,symbol('P','横向集中力',F,'N'),symbol('a','加载距离',f.positionMm,'mm'),symbol('T','对形心的总扭矩',f.torque*1000,'N·mm'),symbol('G','剪切模量',G,'MPa'),symbol('C_{VV}','截面横剪柔度积分',q.ok?q.complianceVV:null,'mm⁻²'),symbol('C_{VT}','截面横剪—扭转互等柔度积分',q.ok?q.complianceVT:null,'mm⁻³')],q.ok&&v.tipDeflection!==null?[unitE(E),unitL(L),`T=${n(f.torque)}\\times1000=${n(f.torque*1000)}\\,\\mathrm{N\\cdot mm}`,`v_B=-\\frac{${n(F)}\\times${n(f.positionMm)}^2(3\\times${n(L)}-${n(f.positionMm)})}{6\\times${n(E)}\\times${n(I)}}`, `\\phantom{v_B={}}+\\frac{-${n(F)}\\times${n(f.positionMm)}\\times${n(q.complianceVV)}+${n(f.torque*1000)}\\times${n(L)}\\times${n(q.complianceVT)}}{${n(G)}}`, `v_B=${n(v.tipDeflection)}\\,\\mathrm{mm}`]:[],q.ok&&v.tipDeflection!==null?[value('tipDeflection','v_B',v.tipDeflection,'mm')]:[],q.ok?note??'截面柔度来自与应力计算相同的二维场；含横剪位移和互等耦合。':'缺少可用截面场，不能把单独弯曲分量写成完整侧移。',q.ok?ref:'unavailable'),
    entry('同一点等效应力',String.raw`\sigma_{VM}=\sqrt{\sigma_x^2+3(\tau_{xy}^2+\tau_{xz}^2)}`,[symbol('\\sigma_x','控制采样点正应力',h?.sigma??null,'MPa'),symbol('\\tau_{xy}','同一点总 xy 剪应力',h?.tauXY??null,'MPa'),symbol('\\tau_{xz}','同一点总 xz 剪应力',h?.tauXZ??null,'MPa')],h?[`\\sigma_{VM}=\\sqrt{${n(h.sigma)}^2+3[${n(h.tauXY)}^2+${n(h.tauXZ)}^2]}=${n(v.mises!)}\\,\\mathrm{MPa}`]:[],h&&v.mises!==null?[value('mises','\\sigma_{VM}',v.mises,'MPa')]:[],h?`${point} 对应截面最大 VM 采样值。${note??''}`:'没有控制采样点，不输出有效等效应力。',h?ref:'unavailable'),
  ];
}

export function overviewFormulas(s:SimulationState,v:Fundamentals):FormulaEntry[] {
  const F=s.axialForce,A=s.axialArea,L=v.lengthMm,E=v.modulusMPa;
  const ref=Math.abs(v.stress)>s.materialYield?'reference':undefined;
  const note=ref?'当前为线弹性外推，不代表真实材料响应。':undefined;
  return [
    entry('力与应力',String.raw`N=F,\quad\sigma=N/A_0`,[symbol('F','端部外力',F,'N'),symbol('N','截面轴力，拉正压负',F,'N'),symbol('A_0','初始截面积',A,'mm²')],[`N=${n(F)}\\,\\mathrm N`,`\\sigma=\\frac{${n(F)}}{${n(A)}}=${n(v.stress)}\\,\\mathrm{MPa}`],[value('stress','\\sigma',v.stress,'MPa')],note,ref),
    entry('伸长与应变',String.raw`\varepsilon=\Delta L/L_0,\quad\sigma=E\varepsilon`,[symbol('\\Delta L','未放大轴向伸长',v.deformation,'mm'),symbol('L_0','初始长度',L,'mm'),ESymbol(E)],[`\\varepsilon=\\frac{${n(v.deformation)}}{${n(L)}}=${n(v.strain)}=${n(v.strain*100)}\\%`,`\\sigma=${n(E)}\\times${n(v.strain)}=${n(v.stress)}\\,\\mathrm{MPa}`],[value('strain','\\varepsilon',v.strain*100,'%')],note,ref),
    entry('轴向伸长',String.raw`\Delta L=FL_0/(EA_0)`,[symbol('F','轴向力',F,'N'),symbol('L_0','初始长度',L,'mm'),symbol('A_0','初始截面积',A,'mm²'),ESymbol(E)],[unitE(E),unitL(L,'L_0'),`\\Delta L=\\frac{${n(F)}\\times${n(L)}}{${n(E)}\\times${n(A)}}=${n(v.deformation)}\\,\\mathrm{mm}`],[value('extension','\\Delta L',v.deformation,'mm')],note,ref),
  ];
}

export function sectionFormulas(v:ReturnType<typeof sectionStudy>):FormulaEntry[] {
  return [
    entry('水平方向平衡','N=F',[symbol('F','右端轴向外力',v.axialKN,'kN'),symbol('N','切面轴力，按右段图示方向读取')],[`N=F=${n(v.axialKN)}\\,\\mathrm{kN}`],[value('axial','N',v.axialKN,'kN')]),
    entry('竖向方向平衡','Q=P',[symbol('P','右端向下外力',v.shearKN,'kN'),symbol('Q','切面向上剪力')],[`Q=P=${n(v.shearKN)}\\,\\mathrm{kN}`],[value('shear','Q',v.shearKN,'kN')]),
    entry('对截面取矩','M=P(L-x)',[symbol('P','右端横向力',v.shearKN,'kN'),symbol('L','示例杆长',1,'m'),symbol('x','当前截面位置',v.positionM,'m'),symbol('L-x','剩余力臂',v.remainingM,'m')],[`L-x=1-${n(v.positionM)}=${n(v.remainingM)}\\,\\mathrm m`,`M=${n(v.shearKN)}\\times${n(v.remainingM)}=${n(v.momentKNm)}\\,\\mathrm{kN\\cdot m}`],[value('moment','M',v.momentKNm,'kN·m')],'kN × m 直接得到 kN·m；本页使用右段隔离体的图示方向。'),
  ];
}

export function strainFormulas({rigid,ex,gamma,tx,ty}:{rigid:boolean;ex:number;gamma:number;tx:number;ty:number}):FormulaEntry[] {
  if(rigid){ex=0;gamma=0;}
  const ux=rigid?tx:100*(ex+gamma),vy=rigid?ty:0;
  return [
    entry('水平位移场',rigid?String.raw`u(x,y)=u_0`:String.raw`u(x,y)=\varepsilon_x x+\gamma_{xy}y`,[symbol('x_C,y_C','C 点初始坐标',100,'mm'),symbol('\\varepsilon_x','轴向应变，无量纲',ex),symbol('\\gamma_{xy}','小角度剪应变',gamma,'rad'),...(rigid?[symbol('u_0','整体水平平移',tx,'mm')]:[])],[rigid?`u_C=${n(tx)}\\,\\mathrm{mm}`:`u_C=${n(ex)}\\times100+${n(gamma)}\\times100=${n(ux)}\\,\\mathrm{mm}`],[value('cornerU','u_C',ux,'mm')],'使用未放大的位移；画面的 ×8 不进入计算。'),
    entry('竖向位移场',rigid?String.raw`v(x,y)=v_0`:'v(x,y)=0',[symbol('v_0','整体竖向平移',rigid?ty:0,'mm')],[`v_C=${n(vy)}\\,\\mathrm{mm}`],[value('cornerV','v_C',vy,'mm')]),
    entry('轴向应变',String.raw`\varepsilon_x=\frac{\partial u}{\partial x}`,[symbol('\\Delta u_{AB}','AB两点水平位移差',ex*100,'mm'),symbol('L_{AB}','初始材料线长度',100,'mm')],[`\\varepsilon_x=\\frac{${n(ex*100)}}{100}=${n(ex)}=${n(ex*100)}\\%`],[value('strain','\\varepsilon_x',ex*100,'%')]),
    entry('剪应变',String.raw`\gamma_{xy}=\frac{\partial u}{\partial y}+\frac{\partial v}{\partial x}`,[symbol('\\Delta u_{AD}','AD两点水平位移差',gamma*100,'mm'),symbol('L_{AD}','初始材料线长度',100,'mm'),symbol('\\partial v/\\partial x','本例竖向位移的空间导数',0)],[`\\gamma_{xy}=\\frac{${n(gamma*100)}}{100}+0=${n(gamma)}\\,\\mathrm{rad}`],[value('gamma','\\gamma_{xy}',gamma,'rad')],rigid?'刚体平移为常量，两个空间导数都为0，不产生应变。':'这里的 γ 为小角度近似，不是有限变形角度。'),
  ];
}

export function formTeachingFormula(form:'axial'|'shear'|'torsion'|'bending',amount:number,label:string,formula:string):FormulaEntry[] {
  const fields={axial:[symbol('\\varepsilon','材料线相对伸长'),symbol('\\Delta L','实际伸长量',null,'mm'),symbol('L_0','实际原长',null,'mm')],shear:[symbol('\\gamma','剪应变，小角度近似'),symbol('\\Delta u','相邻层实际位移差',null,'mm'),symbol('h','层间实际距离',null,'mm')],torsion:[symbol('\\varphi','两端截面实际相对转角',null,'rad'),symbol('\\theta_{right},\\theta_{left}','两端实际转角',null,'rad')],bending:[symbol('\\kappa','轴线实际曲率',null,'mm⁻¹'),symbol('\\rho','实际曲率半径',null,'mm')]};
  return [entry(label,formula,[...fields[form],symbol('a_{demo}','归一化演示幅度，不是物理应变',amount*100,'%')],[`a_{demo}=${n(amount)}\\times100\\%=${n(amount*100)}\\%`],[],'本页只有归一化几何演示幅度，缺少实际量纲标定；不能把演示百分比代入 ε、γ、φ 或 κ 得到定量响应。','reference')];
}
