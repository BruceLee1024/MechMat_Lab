import { SectionProperties } from '../types';
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

// 保留原来的拉伸教学曲线；该曲线不是经过材料试验拟合的本构模型。
export function calculateAxialTeaching(input: Parameters<typeof calculateAxial>[0] & { yieldStrength: number }) {
  const elastic = calculateAxial(input);
  if (elastic.ok === false) return elastic;
  const errors = invalidParameters({ yieldStrength: input.yieldStrength }, ['yieldStrength']);
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const { stress, modulusMPa, lengthMm } = elastic.values;
  const strainAtYield = input.yieldStrength / modulusMPa;
  const utsStrength = input.yieldStrength * 1.5;
  const failureStrength = input.yieldStrength * 1.4;
  const strainAtUTS = strainAtYield * 10;
  const strainAtFailure = strainAtYield * 15;
  const isPlastic = stress > input.yieldStrength;
  const isFailure = stress > utsStrength;
  const ratio = (stress - input.yieldStrength) / (utsStrength - input.yieldStrength);
  const strain = isFailure ? strainAtFailure : isPlastic ? strainAtYield + (strainAtUTS - strainAtYield) * ratio ** 2 : elastic.values.strain;
  return calculation({ ...elastic.values, strain, deformation: strain * lengthMm, strainAtYield, strainAtUTS, strainAtFailure, utsStrength, failureStrength, isPlastic, isFailure },
    [...elastic.assumptions, '屈服后的曲线和断裂状态是教学示意，不代表特定材料的实测性能。'],
    isPlastic ? ['已超出弹性范围，停止显示线弹性应变能；变形量为教学模型示意。'] : []);
}

export function calculateBending(input: { load: number; length: number; position: number; modulus: number; section: SectionProperties }) {
  const { section, ...parameters } = input;
  const errors = invalidParameters(parameters, ['length', 'modulus']);
  if (input.position < 0 || input.position > input.length) errors.push({ field: 'position', message: '载荷位置必须位于 0 与梁跨度之间' });
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const props = evaluateSection(section);
  if (props.ok === false) return props;
  const L_mm = mToMm(input.length), a_mm = mToMm(input.position), b_mm = L_mm - a_mm;
  const E_MPa = gPaToMPa(input.modulus), inertia = props.values.Iz, yMax = props.values.yMax;
  const R1 = input.load * b_mm / L_mm, R2 = input.load * a_mm / L_mm;
  const momentNmm = input.load * a_mm * b_mm / L_mm;
  const maxMoment = nmmToNm(momentNmm);
  const deflectionAtLoad = input.load * a_mm ** 2 * b_mm ** 2 / (3 * E_MPa * inertia * L_mm);
  const maxStress = Math.abs(momentNmm) * yMax / inertia;
  const strainEnergy = input.load ** 2 * a_mm ** 2 * b_mm ** 2 / (6 * E_MPa * inertia * L_mm);
  const maxStrainEnergyDensity = maxStress ** 2 / (2 * E_MPa);
  return calculation({ L_mm, a_mm, b_mm, E_MPa, inertia, yMax, R1, R2, maxMoment, momentNmm, deflectionAtLoad, maxStress, strainEnergy, maxStrainEnergyDensity },
    ['简支梁、单点载荷，Euler–Bernoulli 线弹性小变形模型。', '显示的是载荷点挠度；偏置载荷时该值不等于全梁最大挠度。', '变形图为放大示意，弯矩显示为 N·m，应变能为 mJ。'], props.warnings);
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
  const isBuckled = input.load > Pcr;
  const ratio = Math.min(input.load / Pcr, 1.5), bowAmount = isBuckled ? (ratio - 1) * 100 : 0;
  const warnings = [...props.warnings];
  if (input.yieldStrength !== undefined && criticalStress >= input.yieldStrength) warnings.push('欧拉临界应力已达到材料参考屈服强度，不能将此结果作为有效弹性临界承载力。');
  return calculation({ E, L_mm, I_min, Area, radiusOfGyration, lambda, Pcr, criticalStress, isBuckled, ratio, bowAmount }, ['理想直杆、两端铰支，计算长度系数 μ=1，使用弱轴惯性矩。', '欧拉公式适用于细长压杆的弹性失稳；超临界变形仅为教学示意。'], warnings);
}

export function calculatePlaneStress(input: { sigmaX: number; sigmaY: number; tauXY: number; angle: number }) {
  const errors = invalidParameters(input);
  if (errors.length) return { ok: false as const, diagnostics: errors };
  const thetaRad = degreesToRadians(input.angle), cos2 = Math.cos(2 * thetaRad), sin2 = Math.sin(2 * thetaRad);
  const avg = (input.sigmaX + input.sigmaY) / 2, diff = (input.sigmaX - input.sigmaY) / 2;
  const sigX_prime = avg + diff * cos2 + input.tauXY * sin2;
  const sigY_prime = avg - diff * cos2 - input.tauXY * sin2;
  const tauXY_prime = -diff * sin2 + input.tauXY * cos2;
  const R = Math.hypot(diff, input.tauXY), sig1 = avg + R, sig2 = avg - R, maxShear = R;
  return calculation({ thetaRad, cos2, sin2, avg, diff, sigX_prime, sigY_prime, tauXY_prime, R, sig1, sig2, maxShear }, ['二维平面应力变换；莫尔圆半径表示面内最大切应力。', '此视图不包含 σz、τyz、τzx 的三维效应。']);
}
