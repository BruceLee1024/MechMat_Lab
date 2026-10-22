import { SectionProperties } from '../types';
import { maximumBendingDeflection, bendingSmallDeflection } from './bendingField';
import { torsionDisplay } from './torsionField';
import { bucklingGeometry, bucklingStressExtrema } from './bucklingField';
import { bendingProfile } from './sectionOutline';
import { DEFAULT_MATERIALS } from './materials';
import { AxialMaterialInput, getAxialMaterialResponse, materialStrainAtStress, sampleMaterialCurve } from './axialResponse';
import { evaluateSection } from './sections';
import { calculation, invalidParameters } from './validation';
import { degreesToRadians, gPaToMPa, mToMm, mjToJ, nmToNmm, nmmToNm, radiansToDegrees } from './units';

export function calculateAxial(input: { force: number; area: number; length: number; modulus: number }) {
  const errors = invalidParameters(input, ['area', 'length', 'modulus']);
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const modulusMPa = gPaToMPa(input.modulus);
  const lengthMm = mToMm(input.length);
  const stress = input.force / input.area;
  const strain = stress / modulusMPa;
  const deformation = strain * lengthMm;
  const strainEnergyDensityKJ = stress * stress / (2 * modulusMPa) * 1000;
  const totalStrainEnergyJ = mjToJ(input.force * deformation / 2);
  return calculation({ stress, strain, deformation, modulusMPa, lengthMm, strainEnergyDensityKJ, totalStrainEnergyJ }, ['均匀直杆、轴向载荷，胡克定律及应变能只适用于线弹性范围。']);
}

// 量化教学曲线与当前读数共用材料模型；缺少标定时只作线弹性估算。
export function calculateAxialTeaching(input: Parameters<typeof calculateAxial>[0] & AxialMaterialInput) {
  const elastic = calculateAxial({ force: input.force, area: input.area, length: input.length, modulus: input.modulus });
  if (elastic.ok === false) return elastic;
  const errors = invalidParameters({ yieldStrength: input.yieldStrength }, ['yieldStrength']);
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const model = getAxialMaterialResponse(input), curve = sampleMaterialCurve(input);
  const { stress, modulusMPa, lengthMm } = elastic.values;
  const strainAtYield = input.yieldStrength/modulusMPa;
  const outsideCurve = model.quantitative && curve.peakStress !== null && stress > curve.peakStress * (1+1e-12);
  const isFailure = outsideCurve && model.family !== 'elastic';
  const isPlastic = model.referenceRole === 'yield' && stress > input.yieldStrength;
  const estimated = !model.quantitative || outsideCurve || (model.family === 'elastic' && isPlastic) || stress < 0;
  const strainMode = estimated ? 'elastic-estimate' as const : ['plateau','smooth'].includes(model.family) && (stress > input.yieldStrength || model.family === 'smooth' && stress > 0) ? 'teaching' as const : 'elastic' as const;
  const strain = estimated ? elastic.values.strain : materialStrainAtStress(input, stress);
  const energyApplicable = stress === 0 || strainMode === 'elastic' && !isPlastic && !isFailure;
  const phase = estimated ? isFailure ? model.family === 'brittle' ? '超过脆断参考值' : '超过教学峰值' : '线弹性估算' : model.family === 'smooth' ? '连续屈服教学' : isPlastic ? '强化教学示意' : model.family === 'brittle' ? '脆性拉伸示意' : '线弹性范围';
  const warnings: string[] = [];
  if (estimated) warnings.push('当前应变与伸长仅为线弹性估算，不代表该材料实际非线性响应。');
  if (!energyApplicable) warnings.push('停止显示线弹性应变能：当前模型/工况不适用该公式。');
  if (model.referenceRole === 'compression') warnings.push('库内混凝土强度为压缩参考值，不能用作抗拉屈服或断裂判据。');
  if (stress === input.yieldStrength && model.family === 'plateau') warnings.push('理想屈服平台在力控制下应变不唯一，当前标记为平台起点。');
  return calculation({ ...elastic.values, strain, deformation: strain*lengthMm, strainAtYield, isPlastic, isFailure, energyApplicable, strainMode, phase, materialLabel: model.name, responseLabel: model.label, modelFamily: model.family, referenceLabel: model.referenceLabel, referenceRole: model.referenceRole, quantitative: model.quantitative },
    [...elastic.assumptions, `${model.name}：${model.description}`, '材料曲线为教学示意；只有参考参数，不代表特定批次、温度、应变率或方向的实测性能。'], warnings);
}

export function calculateBending(input: { load: number; length: number; position: number; modulus: number; section: SectionProperties }) {
  const { section, ...parameters } = input;
  const errors = invalidParameters(parameters, ['length', 'modulus']);
  if (input.position < 0 || input.position > input.length) errors.push({ field: 'position', message: '载荷位置必须位于 0 与梁跨度之间' });
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const props = evaluateSection(section);
  if (props.ok === false) return props;
  const L_mm = mToMm(input.length), a_mm = mToMm(input.position), b_mm = L_mm - a_mm;
  const E_MPa = gPaToMPa(input.modulus), inertia = props.values.Iz, yMax = section.type === 'custom' ? null : props.values.yMax;
  const R1 = input.load * b_mm / L_mm, R2 = input.load * a_mm / L_mm;
  const momentNmm = input.load * a_mm * b_mm / L_mm;
  const maxMoment = nmmToNm(momentNmm);
  const deflectionAtLoad = input.load * a_mm ** 2 * b_mm ** 2 / (3 * E_MPa * inertia * L_mm);
  const maxStress = yMax === null ? null : Math.abs(momentNmm) * yMax / inertia;
  const strainEnergy = input.load ** 2 * a_mm ** 2 * b_mm ** 2 / (6 * E_MPa * inertia * L_mm);
  const maxStrainEnergyDensity = maxStress === null ? null : maxStress ** 2 / (2 * E_MPa);
  const peak = maximumBendingDeflection({ load: input.load, lengthMm: L_mm, positionMm: a_mm, modulusMPa: E_MPa, inertia });
  return calculation({ L_mm, a_mm, b_mm, E_MPa, inertia, yMax, R1, R2, maxMoment, momentNmm, deflectionAtLoad, maxDeflection: peak.deflection, maxDeflectionPosition: peak.xMm, maxStress, strainEnergy, maxStrainEnergyDensity },
    ['简支梁、单点载荷，Euler–Bernoulli 线弹性小变形模型；不计算剪切挠度。', '仅计算平面弯曲，假定侧向及扭转稳定，不计算侧扭屈曲。', '载荷点挠度与全梁最大挠度分别计算；偏置载荷点挠度通常不等于全梁最大挠度。', '变形图为放大示意，弯矩显示为 N·m，应变能为 mJ。'], [...props.warnings,...(yMax===null?['未提供边缘几何，不计算边缘应力或应变能密度。']:[])]);
}

/** 视图、报告与 AI 共用材料适用范围；不把轴向非线性曲线直接套成梁本构。 */
export function calculateBendingTeaching(input: Parameters<typeof calculateBending>[0] & AxialMaterialInput) {
  const result=calculateBending({load:input.load,length:input.length,position:input.position,modulus:input.modulus,section:input.section});
  if(result.ok === false)return result;
  const errors=invalidParameters({yieldStrength:input.yieldStrength},['yieldStrength']);
  if(errors.length)return {ok:false as const,diagnostics:errors};
  const v=result.values,material=getAxialMaterialResponse(input);
  const small=bendingSmallDeflection({load:input.load,lengthMm:v.L_mm,positionMm:v.a_mm,modulusMPa:v.E_MPa,inertia:v.inertia});
  const profile=bendingProfile(input.section),depth=profile.top-profile.bottom;
  const spanDepthRatio=depth>0?v.L_mm/depth:null;
  // 10 仅为教学筛查值，不是规范限值，也不声称高于10即剪切影响可忽略。
  const shortBeam=spanDepthRatio!==null&&spanDepthRatio<10;
  const separated=input.section.type==='composite'&&(input.section.compSpacing??0)>0;
  const coupled=input.section.type==='channel';
  const loadedSpan=input.load!==0&&input.position>0&&input.position<input.length;
  const scopeLimited=loadedSpan&&(shortBeam||separated||coupled);
  const exceeded=v.maxStress!==null&&['yield','tensile'].includes(material.referenceRole)&&v.maxStress>input.yieldStrength;
  const extrapolated=exceeded||!small||scopeLimited;
  const geometryAvailable=small&&!scopeLimited;
  const phase=scopeLimited?'模型范围外 · 弯曲参考':!small?'大挠度 · 线性外推':exceeded?'超参考范围 · 弹性外推':v.maxStress===null?'弹性轴线 · 应力未验证':material.quantitative?'线弹性梁模型':'等效弹性梁模型';
  const notice=separated?'截面存在间隙，缺少连接刚度；共同工作 EI 仅为假设参考':coupled?'槽形截面形心与剪心不重合；未求解偏心横载引起的扭转，仅保留平面弯曲参考':shortBeam?'跨度/截面高小于10，剪切变形影响未计；仅作 EB 弯曲参考，10为教学筛查值':exceeded?'未模拟塑性、开裂或断裂后的真实形态':input.section.type==='custom'?'未提供边缘几何，仅求轴线；不计算边缘应力与材料超限':input.section.type==='composite'?'组合截面按完全共同工作计算':/GFRP|CFRP/.test(material.name)?'采用库内方向的等效 E，未计算其他纤维方向':!material.quantitative?'仅采用当前 E；未标定开裂、方向性或非线性响应':'材料 E、截面 Iz 与挠曲线同步';
  return calculation({...v,spanDepthRatio,geometryAvailable,energyApplicable:!extrapolated&&v.maxStress!==null,extrapolated,phase,notice},[...result.assumptions,notice], [...result.warnings,...(extrapolated?['当前仅为平面线弹性参考，不输出有效弹性应变能；不表示完整空间响应或材料真实非线性形态。']:[])]);
}

export function calculateTorsion(input: { torque: number; radius: number; length: number; modulus: number; loadRatio: number }) {
  const errors = invalidParameters(input, ['radius', 'length', 'modulus']);
  if (input.loadRatio < 0 || input.loadRatio > 1) errors.push({ field: 'loadRatio', message: '中间输出比例必须位于 0 与 1 之间' });
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const Ip = Math.PI * input.radius ** 4 / 2;
  const G_MPa = gPaToMPa(input.modulus);
  const L_total_mm = mToMm(input.length), L_AB_mm = L_total_mm / 2, L_BC_mm = L_total_mm / 2;
  const T_in_Nm = input.torque, T_out1_Nm = input.torque * input.loadRatio, T_out2_Nm = input.torque * (1 - input.loadRatio);
  const T_AB_Nm = T_in_Nm, T_BC_Nm = T_out2_Nm;
  const maxShear = Math.abs(nmToNmm(T_AB_Nm)) * input.radius / Ip;
  const phi_AB_rad = nmToNmm(T_AB_Nm) * L_AB_mm / (G_MPa * Ip);
  const phi_BC_rad = nmToNmm(T_BC_Nm) * L_BC_mm / (G_MPa * Ip);
  const phi_total_rad = phi_AB_rad + phi_BC_rad, phi_total_deg = radiansToDegrees(phi_total_rad);
  const U_AB_J = mjToJ(nmToNmm(T_AB_Nm) ** 2 * L_AB_mm / (2 * G_MPa * Ip));
  const U_BC_J = mjToJ(nmToNmm(T_BC_Nm) ** 2 * L_BC_mm / (2 * G_MPa * Ip));
  const U_total_J = U_AB_J + U_BC_J;
  const stiffnessGIp = input.modulus * Ip * 0.001;
  const u_max_density = maxShear ** 2 / (2 * G_MPa) * 1000;
  return calculation({ Ip, G_MPa, L_total_mm, L_AB_mm, L_BC_mm, T_in_Nm, T_out1_Nm, T_out2_Nm, T_AB_Nm, T_BC_Nm, maxShear, phi_AB_rad, phi_BC_rad, phi_total_rad, phi_total_deg, U_AB_J, U_BC_J, U_total_J, stiffnessGIp, u_max_density },
    ['实心圆轴、线弹性材料；传动轴由两个等长段组成。', '中间齿轮分流输入扭矩，AB 和 BC 段的内扭矩不同。']);
}

export function calculateTorsionTeaching(input:Parameters<typeof calculateTorsion>[0]&{materialName:string;yieldStrength:number}) {
  const result=calculateTorsion({torque:input.torque,radius:input.radius,length:input.length,modulus:input.modulus,loadRatio:input.loadRatio});
  const invalid=invalidParameters({yieldStrength:input.yieldStrength},['yieldStrength']);
  if(invalid.length)return {ok:false as const,diagnostics:invalid};
  if(result.ok===false)return result;
  const v=result.values,material=DEFAULT_MATERIALS.find(m=>m.name===input.materialName);
  const ductile=(material?.category==='metal'&&!input.materialName.includes('铸铁'))||input.materialName==='结构钢 (Structural Steel)';
  const shearReference=ductile?input.yieldStrength/Math.sqrt(3):null;
  const smallStrain=torsionDisplay({torqueNm:input.torque,radiusMm:input.radius,lengthMm:v.L_total_mm,modulusMPa:v.G_MPa,loadRatio:input.loadRatio},1).smallStrain;
  const exceeded=shearReference!==null&&v.maxShear>shearReference;
  const extrapolated=exceeded||!smallStrain;
  const phase=!smallStrain?'大剪应变 · 线性外推':exceeded?'超参考范围 · 弹性外推':ductile?'线弹性圆轴模型':'等效剪切模量模型';
  const notice=extrapolated?'只计算线弹性外推，未模拟塑性扭转或断裂':ductile?'G、半径与分段扭矩共同决定扭转角':'使用当前等效 G；未标定非线性、开裂或材料方向性';
  return calculation({...v,shearReference,smallStrain,extrapolated,phase,notice,energyApplicable:!extrapolated},[...result.assumptions,'转角以 A 截面为参考，φA=0 不是固定支座约束。',...(ductile?['延性金属按 von Mises 的 σy/√3 估算剪切屈服参考值，不是设计验算。']:['该材料不套用金属剪切屈服判据。'])],extrapolated?['超适用范围，转角与应力仅作线性外推，应变能不作为有效值。']:[]);
}

export function calculateBuckling(input: { load: number; length: number; modulus: number; section: SectionProperties; yieldStrength?: number }) {
  const errors = invalidParameters({ load: input.load, length: input.length, modulus: input.modulus }, ['length', 'modulus']);
  if (input.load < 0) errors.push({ field: 'load', message: '压杆载荷以非负压力输入' });
  if (input.yieldStrength !== undefined) errors.push(...invalidParameters({ yieldStrength: input.yieldStrength }, ['yieldStrength']));
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const props = evaluateSection(input.section);
  if (props.ok === false) return props;
  const E = gPaToMPa(input.modulus), L_mm = mToMm(input.length);
  const I_min = Math.min(props.values.Iz, props.values.Iy), Area = props.values.area;
  const radiusOfGyration = Math.sqrt(I_min / Area), lambda = L_mm / radiusOfGyration;
  const Pcr = Math.PI ** 2 * E * I_min / L_mm ** 2;
  const criticalStress = Pcr / Area;
  const isBuckled = input.load >= Pcr;
  const ratio = input.load / Pcr;
  const warnings = [...props.warnings];
  if (input.yieldStrength !== undefined && criticalStress >= input.yieldStrength) warnings.push('欧拉临界应力已达到材料参考屈服强度，不能将此结果作为有效弹性临界承载力。');
  return calculation({ E, L_mm, I_min, Area, radiusOfGyration, lambda, Pcr, criticalStress, isBuckled, ratio }, ['理想直杆、两端铰支，计算长度系数 μ=1，使用弱轴惯性矩。', '欧拉公式适用于细长压杆的弹性失稳；超临界变形仅为教学示意。'], warnings);
}

export function calculateBucklingTeaching(input:{load:number;length:number;modulus:number;section:SectionProperties;materialName:string;yieldStrength:number;initialBow:number}) {
  const errors=invalidParameters({initialBow:input.initialBow,yieldStrength:input.yieldStrength},['yieldStrength']);
  if(input.initialBow<0)errors.push({field:'initialBow',message:'初弯曲幅值不能为负数'});
  if(errors.length)return {ok:false as const,diagnostics:errors};
  // 基础欧拉公式不带材料判据，由本层按材料类别区分适用范围。
  const result=calculateBuckling({load:input.load,length:input.length,modulus:input.modulus,section:input.section});if(result.ok===false)return result;
  const v=result.values,field={load:input.load,lengthMm:v.L_mm,modulusMPa:v.E,section:input.section,initialBow:input.initialBow},g=bucklingGeometry(field);
  const metal=DEFAULT_MATERIALS.find(m=>m.name===input.materialName)?.category==='metal'&&!input.materialName.includes('铸铁')||input.materialName==='结构钢 (Structural Steel)';
  const eulerApplicable=metal?v.criticalStress<input.yieldStrength:null;
  const stresses=bucklingStressExtrema(field);
  const averageStress=input.load/v.Area,edgeStress=stresses===null?null:Math.max(0,-stresses.min);
  const maxAbsStress=stresses===null?null:Math.max(Math.abs(stresses.min),Math.abs(stresses.max));
  const exceeded=metal&&maxAbsStress!==null&&maxAbsStress>=input.yieldStrength;
  // 开口截面还可能发生扭转/弯扭失稳；A/I 输入不足以验证空间稳定性。
  const stabilityVerified=['rectangle','circle','hollow_circle'].includes(input.section.type);
  const separated=input.section.type==='composite'&&(input.section.compSpacing??0)>0;
  const scopeNotice=separated?'分离组合截面缺少连接刚度，不能验证共同工作与空间稳定性':input.section.type==='custom'?'自定义截面缺少轮廓、抗扭及翘曲参数，不能验证空间稳定性':'开口截面未校核扭转及弯扭屈曲，弱轴欧拉力仅为弯曲参考';
  const displacementAvailable=g.precritical&&g.small&&eulerApplicable!==false&&!exceeded&&(stabilityVerified||input.load===0);
  const phase=!stabilityVerified?'空间稳定未验证 · 弯曲参考':!g.precritical?'临界及超临界 · 失稳模态':eulerApplicable===false?'欧拉临界应力超参考':exceeded?'应力超参考 · 弹性外推':!g.small?'小挠度范围外':eulerApplicable===null?'等效弹性参考':input.initialBow===0?'理想直杆 · 亚临界':'初弯曲 · 二阶弹性';
  const notice=!stabilityVerified?scopeNotice:!g.precritical?'欧拉理论不确定后屈曲幅值，仅显示归一化一阶模态':eulerApplicable===false?'临界应力达到屈服参考，欧拉弹性临界力不作为有效承载力':exceeded?'二阶纤维应力达到材料参考，不代表真实塑性位移':!g.small?'挠度或转角超出小变形范围，仅保留参考模态':eulerApplicable===null?'仅使用当前等效 E，未标定方向性、开裂或非线性承载力':input.initialBow===0?'理想直杆在临界前保持直线，缺陷为零不产生侧移':'按正弦初弯曲与 P–Δ 放大计算，非后屈曲求解';
  return calculation({...v,weakAxis:g.weakAxis,equalAxes:g.equalAxes,loadRatio:g.ratio,averageStress,initialBow:input.initialBow,totalBow:g.amplitude,edgeStress,minNormalStress:stresses?.min??null,maxNormalStress:stresses?.max??null,displacementAvailable,eulerApplicable,stabilityVerified,phase,notice},['两端铰接、等截面，计算长度系数 μ=1；只求平面弯曲分支，不含局部屈曲。','截面 y/z 为主轴；取 min(Iy,Iz) 确定弱轴；连接条件未建模的组合截面只作参考。','亚临界：正弦初弯曲总侧移 e=e0/(1−P/Pcr)。忽略轴向缩短，只显示横向形态。','名义纤维应力 σ=−P/A+P·w(x)·q/Imin；q 为侧移方向截面坐标，拉正压负。',notice],displacementAvailable&&stabilityVerified?[]:[notice]);
}

export function calculatePlaneStress(input: { sigmaX: number; sigmaY: number; tauXY: number; angle: number }) {
  const errors = invalidParameters(input);
  if (errors.length) return { ok: false as const, diagnostics: errors };
  // 平面方位每180°重复；先约化角度，避免有限但巨大的输入在换算中溢出。
  const thetaRad = (input.angle % 180) * Math.PI / 180, cos2 = Math.cos(2 * thetaRad), sin2 = Math.sin(2 * thetaRad);
  const avg = input.sigmaX / 2 + input.sigmaY / 2, diff = input.sigmaX / 2 - input.sigmaY / 2;
  const sigX_prime = avg + diff * cos2 + input.tauXY * sin2;
  const sigY_prime = avg - diff * cos2 - input.tauXY * sin2;
  const tauXY_prime = -diff * sin2 + input.tauXY * cos2;
  const R = Math.hypot(diff, input.tauXY), sig1 = avg + R, sig2 = avg - R, maxShear = R;
  const principalAngle = R === 0 ? null : ((Math.atan2(input.tauXY, diff) * 90 / Math.PI) % 180 + 180) % 180;
  const maxShearAngle = principalAngle === null ? null : (principalAngle + 45) % 180;
  const principalMax = Math.max(sig1, 0), principalMin = Math.min(sig2, 0), principalMid = [sig1, sig2, 0].sort((a,b)=>a-b)[1];
  const absoluteMaxShear = principalMax / 2 - principalMin / 2;
  const mises = Math.hypot(avg, Math.sqrt(3) * diff, Math.sqrt(3) * input.tauXY);
  return calculation({ thetaRad, cos2, sin2, avg, diff, sigX_prime, sigY_prime, tauXY_prime, R, sig1, sig2, maxShear, principalAngle, maxShearAngle, principalMax, principalMid, principalMin, absoluteMaxShear, mises },
    ['平面应力：σz=τyz=τzx=0；三维单元体仅表达该平面应力状态，不计算应变或形变。', '正应力拉为正；正τxy在+x面沿+y，在+y面沿+x，相对面反向，满足剪应力互等。', 'θ表示x′轴从x轴逆时针旋转；莫尔圆τ轴向上，X′=(σx′,τx′y′)，对应圆上顺时针转2θ。', '面内主应力为C±R；空间主应力另含0并排序。R是面内最大切应力，空间最大切应力取(σ最大−σ最小)/2。']);
}
