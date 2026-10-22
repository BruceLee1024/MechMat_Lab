import { calculateAxialTeaching, calculateBendingTeaching, calculateBucklingTeaching, calculatePlaneStress, calculateTorsionTeaching } from '../mechanics/calculations';
import { calculateSectionProperties, SECTION_FIELDS } from '../mechanics/sections';
import { calculatePolygonSection, SECTION_TOOL_CONFIGS } from '../mechanics/sectionTool';
import { solveUnified } from '../solver/UnifiedSolver';
import { CalculationResult } from '../mechanics/validation';
import { ExperimentDocument, ExperimentModule, getSimulation } from './schema';
import { SectionProperties, THEORY_INFO } from '../types';
import {calculateCombined,combinedInput} from '../mechanics/combined';
import { calculateFundamentals } from '../mechanics/fundamentals';

export interface Metric { label: string; value: number; unit: string }
export interface ExperimentResults { valid: boolean; metrics: Metric[]; assumptions: string[]; warnings: string[]; diagnostics: string[]; formulas: string[] }
const metric = (label: string, value: number, unit: string): Metric => ({ label, value, unit });
function from<T>(result: CalculationResult<T>, metrics: (value: T) => Metric[], formulas: string[]): ExperimentResults {
  if (result.ok === false) return { valid: false, metrics: [], assumptions: [], warnings: [], diagnostics: result.diagnostics.map(d => d.message), formulas };
  return { valid: true, metrics: metrics(result.values), assumptions: result.assumptions, warnings: result.warnings, diagnostics: [], formulas };
}
export function getResults(document: ExperimentDocument): ExperimentResults {
  const s = getSimulation(document), model = document.model;
  if (model.kind === 'solver') {
    const result = solveUnified(model.nodes, model.elements, model.loads);
    return { valid: result.success, metrics: result.success ? [metric('最大节点位移绝对值', Math.max(0, ...result.nodes.flatMap(n => [Math.abs(n.displacement.dx), Math.abs(n.displacement.dy)])), 'mm'), metric('最大等效应力', Math.max(0, ...result.elements.map(e => e.maxVonMises)), 'MPa'), metric('总应变能', result.totalStrainEnergy, 'mJ')] : [], assumptions: ['二维梁/桁架，线弹性小变形，使用生产统一求解入口。'], warnings: [], diagnostics: result.success ? [] : [result.message], formulas: ['K u = F'] };
  }
  if (model.kind === 'section') {
    const v = model.sectionType === 'draw' ? calculatePolygonSection(model.paths) : SECTION_TOOL_CONFIGS[model.sectionType].calculate(model.parameters);
    const valid = Object.values(v).every(Number.isFinite) && v.A > 0;
    return { valid, metrics: valid ? [metric('面积', v.A, 'mm²'), metric('惯性矩 Ix', v.Ix, 'mm⁴'), metric('惯性矩 Iy', v.Iy, 'mm⁴'), metric('抗弯截面模量 Wx', v.Wx, 'mm³'), metric('抗弯截面模量 Wy', v.Wy, 'mm³')] : [], assumptions: ['报告统一使用 mm 几何单位，显示单位选择不改变保存的坐标。'], warnings: [], diagnostics: valid ? [] : ['尚未形成有效截面，请检查尺寸或闭合轮廓'], formulas: ['A = ∫ dA', 'I_x = ∫ y² dA', 'I_y = ∫ x² dA'] };
  }
  switch (document.module) {
    case 'fundamentals': return from(calculateFundamentals(s), v => [metric('泊松比', s.poissonRatio, ''), metric('轴向应变', v.strain * 100, '%'), metric('横向应变', v.transverseStrain * 100, '%'), metric('工程应力', v.stress, 'MPa'), metric('真应力', v.trueStress, 'MPa')], ['ν = −ε横向/ε轴向', 'σ = Eε （线弹性范围）', 'σ真 = F/A当前']);
    case 'axial': return from(calculateAxialTeaching({ materialName: s.materialName, force: s.axialForce, area: s.axialArea, length: s.axialLength, modulus: s.bendModulus, yieldStrength: s.materialYield }), v => [metric('应力', v.stress, 'MPa'), metric(v.strainMode === 'elastic-estimate' ? '线弹性估算应变' : '应变', v.strain, ''), metric(v.strainMode === 'elastic-estimate' ? '线弹性估算伸长' : '伸长', v.deformation, 'mm'), ...(v.energyApplicable ? [metric('应变能', v.totalStrainEnergyJ, 'J')] : [])], ['σ = F/A', 'ε 由所选材料教学响应确定；未标定时仅作 σ/E 估算', 'ΔL = εL', 'U = FΔL/2 （线弹性范围）']);
    case 'bending': return from(calculateBendingTeaching({ materialName:s.materialName,yieldStrength:s.materialYield,load: s.bendLoad, length: s.bendLength, position: s.bendLoadPos, modulus: s.bendModulus, section: s.bendSection }), v => [metric('左支反力', v.R1, 'N'), metric('右支反力', v.R2, 'N'), metric('最大弯矩', v.maxMoment, 'N·m'), ...(v.maxStress!==null?[metric('最大应力', v.maxStress, 'MPa')]:[]), metric('载荷点挠度', v.deflectionAtLoad, 'mm'), metric('全梁最大挠度', v.maxDeflection, 'mm'), metric('最大挠度位置', v.maxDeflectionPosition, 'mm'), ...(v.energyApplicable ? [metric('应变能', v.strainEnergy, 'mJ')] : [])], ['b = L − a', 'R左 = Pb/L，R右 = Pa/L', 'Mmax = Pab/L', 'σmax = Mmax ymax/I', 'w载荷点 = Pa²b²/(3EIL)', 'U = P²a²b²/(6EIL)']);
    case 'torsion': return from(calculateTorsionTeaching({ materialName:s.materialName,yieldStrength:s.materialYield,torque: s.torqTorque, radius: s.torqRadius, length: s.torqLength, modulus: s.torqModulus, loadRatio: s.torqLoadRatio }), v => [metric('最大切应力', v.maxShear, 'MPa'), metric('总扭转角', v.phi_total_deg, '°'), ...(v.energyApplicable?[metric('应变能', v.U_total_J, 'J')]:[])], ['J = πr⁴/2', 'τmax = Tr/J', 'φ = Σ TiLi/(GJ)', 'U = Σ Ti²Li/(2GJ)']);
    case 'buckling': return from(calculateBucklingTeaching({materialName:s.materialName,initialBow:s.buckleInitialBow,load:s.buckleLoad,length:s.buckleLength,modulus:s.buckleModulus,section:s.buckleSection,yieldStrength:s.materialYield}),v=>[metric(!v.stabilityVerified?'弱轴弯曲参考':v.eulerApplicable===false?'欧拉外推参考':'临界压力',v.Pcr,'N'),metric('长细比',v.lambda,''),metric('惯性半径',v.radiusOfGyration,'mm'),metric('临界平均应力',v.criticalStress,'MPa'),metric('初弯曲',s.buckleInitialBow,'mm'),...(v.displacementAvailable&&v.minNormalStress!==null&&v.maxNormalStress!==null?[metric('最小纤维正应力',v.minNormalStress,'MPa'),metric('最大纤维正应力',v.maxNormalStress,'MPa')]:[]),...(v.displacementAvailable&&v.totalBow!==null?[metric('总侧移',v.totalBow,'mm')]:[])],['I弱轴 = min(Iy, Iz)','λ = L/i','Pcr = π²EI/L² （μ=1）','亚临界 e = e0/(1−P/Pcr)；超临界不计算实际位移']);
    case 'stress': return from(calculatePlaneStress({ sigmaX: s.stressSigX, sigmaY: s.stressSigY, tauXY: s.stressTauXY, angle: s.stressAngle }), v => [metric('平面主应力 1', v.sig1, 'MPa'), metric('平面主应力 2', v.sig2, 'MPa'), metric('面内最大切应力', v.maxShear, 'MPa'), metric('空间最大切应力', v.absoluteMaxShear, 'MPa'), ...(v.principalAngle===null?[]:[metric('最大面内主应力方向',v.principalAngle,'°')]), metric('旋转后 σx', v.sigX_prime, 'MPa'), metric('旋转后 σy', v.sigY_prime, 'MPa'), metric('旋转后 τxy', v.tauXY_prime, 'MPa')], ['σ1,2 = (σx+σy)/2 ± √[((σx−σy)/2)²+τxy²]']);
    case 'combined': {
      const a=calculateCombined(combinedInput(s,'eccentric')),b=calculateCombined(combinedInput(s,'bendtorque'));
      if(a.ok===false||b.ok===false)return {valid:false,metrics:[],assumptions:[],warnings:[],diagnostics:[...(a.ok===false?a.diagnostics.map(d=>d.message):[]),...(b.ok===false?b.diagnostics.map(d=>d.message):[])],formulas:[]};
      return {valid:true,metrics:[metric('A端横向剪力',b.values.rootShear,'N'),...(a.values.topStress!==null?[metric('偏心加载上表面应力',a.values.topStress,'MPa')]:[]),...(a.values.bottomStress!==null?[metric('偏心加载下表面应力',a.values.bottomStress,'MPa')]:[]),...(b.values.maxNormal!==null?[metric('弯扭组合正应力',b.values.maxNormal,'MPa')]:[]),...(b.values.tau!==null?[metric('弯扭组合端扭矩剪应力分量',b.values.tau,'MPa')]:[]),...(b.values.totalShearMax!==null?[metric('弯扭组合总剪应力',b.values.totalShearMax,'MPa')]:[]),...(b.values.transverseMax!==null?[metric('弯扭组合横向剪应力分量',b.values.transverseMax,'MPa')]:[]),...(b.values.torsionConstant!==null?[metric('弯扭截面抗扭常数J',b.values.torsionConstant,'mm⁴')]:[]),...(b.values.mises!==null?[metric('弯扭组合 von Mises',b.values.mises,'MPa')]:[]),...(a.values.geometryAvailable&&!a.values.yieldExceeded&&a.values.tipDeflection!==null?[metric('偏心组合端部侧移',a.values.tipDeflection,'mm')]:[]),...(b.values.geometryAvailable&&!b.values.yieldExceeded&&b.values.tipDeflection!==null?[metric('弯扭端部侧移',b.values.tipDeflection,'mm'),...(b.values.tipTwist!==null?[metric('弯扭端部转角',b.values.tipTwist*180/Math.PI,'°')]:[])]:[])],assumptions:[...new Set([...a.assumptions,...b.assumptions])],warnings:[...a.warnings,...b.warnings],diagnostics:[],formulas:['N=F，Mz(x)=F[e+v(x)−vB]；拉为正、压为负','σx=F/A−Mzy/Iz','悬臂集中力 Mz(x)=−P(a−x)，x≤a','截面柔度 Cij=∫si·sj dA；[γ,φ′]=C[V,T]/G','σVM=√(σx²+3(τxy²+τxz²))（同一点矢量叠加；网格采样最大值）']};
    }
    default: return { valid: true, metrics: [metric('泊松比', s.poissonRatio, '')], assumptions: ['基础理论模块的动画是概念演示，报告记录材料参数。'], warnings: [], diagnostics: [], formulas: ['ν = −ε横向/ε轴向', 'σ = Eε （线弹性范围）'] };
  }
}

const LABELS: Record<string, [string, string]> = {
  materialName: ['材料', ''], materialYield: ['参考屈服强度', 'MPa'], poissonRatio: ['泊松比', ''], bendModulus: ['弹性模量', 'GPa'],
  axialForce: ['轴向力', 'N'], axialArea: ['横截面积', 'mm²'], axialLength: ['原长', 'm'], axialObliqueAngle: ['斜截面角', '°'],
  bendLoad: ['弯曲载荷', 'N'], bendLength: ['梁跨度', 'm'], bendLoadPos: ['载荷位置', 'm'], bendWidth: ['截面参考宽度', 'mm'], bendHeight: ['截面参考高度', 'mm'],
  torqTorque: ['输入扭矩', 'N·m'], torqRadius: ['圆轴半径', 'mm'], torqLength: ['轴长', 'm'], torqModulus: ['剪切模量', 'GPa'], torqLoadRatio: ['中间输出比例', ''],
  buckleInitialBow: ['初弯曲幅值', 'mm'], buckleLoad: ['压力', 'N'], buckleLength: ['压杆长度', 'm'], buckleModulus: ['压杆弹性模量', 'GPa'], buckleWidth: ['参考宽度', 'mm'], buckleHeight: ['参考高度', 'mm'],
  stressSigX: ['σx', 'MPa'], stressSigY: ['σy', 'MPa'], stressSigZ: ['σz（当前平面视图不使用）', 'MPa'], stressTauXY: ['τxy', 'MPa'], stressTauYZ: ['τyz（当前平面视图不使用）', 'MPa'], stressTauZX: ['τzx（当前平面视图不使用）', 'MPa'], stressAngle: ['旋转角', '°'],
  combinedLoad: ['偏心加载力', 'N'], combinedEccentricity: ['偏心距', 'mm'], combinedWidth: ['参考宽度', 'mm'], combinedHeight: ['参考高度', 'mm'], combinedLength: ['参考长度', 'm'], bendTorque: ['组合扭矩', 'N·m'], bendTorqueLength: ['组合构件长度', 'm'], bendTorqueBendLoad: ['组合弯曲载荷', 'N'], bendTorqueBendPos: ['组合载荷位置', 'm'], bendTorqueModulus: ['组合弹性模量', 'GPa'], bendTorqueShearModulus: ['组合剪切模量', 'GPa'],
};
export interface InputRow { label: string; value: number | string; unit: string }
export function getModuleLabel(module: ExperimentModule): string { return THEORY_INFO[module].title.split('(')[0].trim(); }
const SECTION_LABELS = { rectangle: '矩形', circle: '实心圆', hollow_circle: '空心圆', i_beam: '工字形', t_beam: 'T 形', channel: '槽形', composite: '组合截面', custom: '自定义截面' };
const SECTION_ROLES: Record<string, string> = { bendSection: '弯曲截面', buckleSection: '压杆截面', combinedSection: '偏心加载截面', bendTorqueSection: '弯扭截面' };
const SUPPORTS = { fixed: '固定', pinned: '铰支', roller: '滚动', none: '无支座' };
const LOADS = { point: '集中力', distributed: '均布荷载', triangular: '线性分布荷载', moment: '力矩' };
export function getInputs(document: ExperimentDocument): InputRow[] {
  const m = document.model;
  if (m.kind === 'simulation') return Object.entries(m.parameters).flatMap(([key, value]) => {
    // 旧参考尺寸为动画兼容保留；参数表使用实际参与计算的截面尺寸。
    if (['bendWidth', 'bendHeight', 'buckleWidth', 'buckleHeight', 'combinedWidth', 'combinedHeight'].includes(key)) return [];
    if (typeof value === 'object') {
      const section = value as SectionProperties, prefix = SECTION_ROLES[key];
      return [{ label: `${prefix} · 类型`, value: SECTION_LABELS[section.type], unit: '' }, ...SECTION_FIELDS[section.type].map(field => ({ label: `${prefix} · ${field.label.replace(/ \(mm[^)]*\)/, '')}`, value: section[field.key] ?? field.defaultValue, unit: field.key.startsWith('customI') ? 'mm⁴' : field.key === 'customArea' ? 'mm²' : 'mm' }))];
    }
    const [label, unit] = LABELS[key] || [key, '']; return [{ label, value: value as number | string, unit }];
  });
  if (m.kind === 'section') return [{ label: '截面类型', value: SECTION_TOOL_CONFIGS[m.sectionType].name, unit: '' }, { label: '显示单位', value: m.displayUnit, unit: '' }, ...SECTION_TOOL_CONFIGS[m.sectionType].params.map(field => ({ label: field.label, value: m.parameters[field.key], unit: field.unit })), ...m.paths.flatMap(path => [{ label: `轮廓 ${path.id}`, value: `${path.isHole ? '内孔' : '外轮廓'} / ${path.isClosed ? '已闭合' : '未闭合'}`, unit: '' }, ...path.vertices.map((v, i) => ({ label: `${path.id} 顶点 ${i + 1}`, value: `(${v.x}, ${v.y})`, unit: 'mm' }))])];
  return [...m.nodes.map(n => ({ label: `节点 ${n.id}`, value: `(${n.x}, ${n.y}) / ${SUPPORTS[n.support]}；约束：水平${n.fixedDOF.dx ? '固定' : '自由'}，竖直${n.fixedDOF.dy ? '固定' : '自由'}，转角${n.fixedDOF.rz ? '固定' : '自由'}`, unit: 'mm' })), ...m.elements.map(e => ({ label: `${e.type === 'beam' ? '梁' : '桁架'}单元 ${e.id}`, value: `${e.nodeStart} → ${e.nodeEnd}；A=${e.section.A} mm²，I=${e.section.I} mm⁴，b=${e.section.width} mm，h=${e.section.height} mm，E=${e.material.E} MPa，G=${e.material.G} MPa，σy=${e.material.yield} MPa`, unit: '' })), ...m.loads.map(l => ({ label: `荷载 ${l.id}`, value: `${LOADS[l.type]} / ${l.targetType === 'node' ? '节点' : '单元'} ${l.targetId} / 相对起止位置 ${l.position ?? 0}–${l.positionEnd ?? 1} / 角度 ${l.angle}° / ${l.value}${l.valueEnd === undefined ? '' : ` → ${l.valueEnd}`}`, unit: l.type === 'moment' ? 'N·m' : ['distributed', 'triangular'].includes(l.type) ? 'N/m' : 'N' }))];
}
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '不适用';
  return value !== 0 && (Math.abs(value) < 1e-5 || Math.abs(value) >= 1e8) ? value.toExponential(5) : value.toLocaleString('zh-CN', { maximumFractionDigits: 6 });
}
export function difference(value: number, baseline: number) {
  return { absolute: value - baseline, relative: baseline === 0 ? null : (value - baseline) / Math.abs(baseline) * 100 };
}
export function validateComparison(documents: ExperimentDocument[]) {
  if (!documents.length || documents.length > 4) throw new Error('请选择 1 至 4 个工况');
  if (documents.some(d => d.module !== documents[0].module || d.calculationVersion !== documents[0].calculationVersion)) throw new Error('仅能比较同模块、同计算版本的工况');
  if (documents.some(d => !getResults(d).valid)) throw new Error('存在无法计算的工况，请先修正参数');
}
