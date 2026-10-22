import { ModuleType, SimulationState } from '../types';
import { calculateAxialTeaching, calculateBendingTeaching, calculateBucklingTeaching, calculatePlaneStress, calculateTorsionTeaching } from './calculations';
import { CalculationResult } from './validation';
import {calculateCombined,combinedInput} from './combined';
import { calculateFundamentals } from './fundamentals';

function describe<T>(result: CalculationResult<T>, summary: (values: T) => Record<string, number | string>) {
  if (result.ok === false) return `当前本地计算无效：${JSON.stringify(result.diagnostics)}。请引导调整参数，不给出有效数值结论。`;
  return `本地计算结果（与当前视图共用计算函数，版本 1）：${JSON.stringify(summary(result.values))}\n计算假设：${result.assumptions.join(' ')}\n适用范围警告：${result.warnings.join(' ') || '无'}。`;
}

// 仅包含实验参数和本地结果；凭据及对话不会进入计算上下文。
export function getCalculationContext(module: ModuleType, state: SimulationState): string | null {
  switch (module) {
    case 'fundamentals':
      return describe(calculateFundamentals(state), v => ({ '轴向应变': v.strain, '横向应变': v.transverseStrain, '工程应力 (MPa)': v.stress, '真应力 (MPa)': v.trueStress, '泊松比': state.poissonRatio }));
    case 'axial':
      return describe(calculateAxialTeaching({ materialName: state.materialName, force: state.axialForce, area: state.axialArea, length: state.axialLength, modulus: state.bendModulus, yieldStrength: state.materialYield }), v => ({
        '轴向力 (N)': state.axialForce, '面积 (mm²)': state.axialArea, '长度 (m)': state.axialLength,
        '材料模型': v.materialLabel + ' · ' + v.responseLabel + ' · ' + v.phase, '应力 (MPa)': v.stress, '应变口径': v.strainMode, [v.strainMode === 'elastic-estimate' ? '线弹性估算应变' : '应变']: v.strain, [v.strainMode === 'elastic-estimate' ? '线弹性估算伸长 (mm)' : '伸长 (mm)']: v.deformation,
        '应变能 (J)': !v.energyApplicable ? '超出弹性范围，不适用' : v.totalStrainEnergyJ,
      }));
    case 'bending':
      return describe(calculateBendingTeaching({materialName:state.materialName,yieldStrength:state.materialYield,load: state.bendLoad, length: state.bendLength, position: state.bendLoadPos, modulus: state.bendModulus, section: state.bendSection }), v => ({
        '载荷 (N)': state.bendLoad, '跨度 (m)': state.bendLength, '载荷位置 (m)': state.bendLoadPos,
        '截面': JSON.stringify(state.bendSection), '左反力 (N)': v.R1, '右反力 (N)': v.R2,
        '最大弯矩 (N·m)': v.maxMoment, '载荷点挠度 (mm)': v.deflectionAtLoad, '全梁最大挠度 (mm)': v.maxDeflection, '最大挠度位置 (mm)': v.maxDeflectionPosition,
        '最大应力 (MPa)': v.maxStress??'未提供边缘几何，不计算', '计算模型': v.phase, '应变能 (mJ)': v.energyApplicable ? v.strainEnergy : '当前外推工况不适用',
      }));
    case 'torsion':
      return describe(calculateTorsionTeaching({ materialName:state.materialName,yieldStrength:state.materialYield,torque: state.torqTorque, radius: state.torqRadius, length: state.torqLength, modulus: state.torqModulus, loadRatio: state.torqLoadRatio }), v => ({
        '输入扭矩 (N·m)': state.torqTorque, '半径 (mm)': state.torqRadius, '长度 (m)': state.torqLength,
        '剪切模量 (GPa)': state.torqModulus, '中间输出比例': state.torqLoadRatio,
        '最大切应力 (MPa)': v.maxShear, '总扭转角 (°)': v.phi_total_deg, '计算模型':v.phase, '应变能 (J)': v.energyApplicable?v.U_total_J:'当前外推工况不适用',
      }));
    case 'buckling':
      return describe(calculateBucklingTeaching({ materialName:state.materialName,initialBow:state.buckleInitialBow,load:state.buckleLoad,length:state.buckleLength,modulus:state.buckleModulus,section:state.buckleSection,yieldStrength:state.materialYield }), v => ({
        '压力 (N)':state.buckleLoad,'杆长 (m)':state.buckleLength,'材料 E (GPa)':state.buckleModulus,'截面':JSON.stringify(state.buckleSection),
        '弱轴':v.weakAxis,'临界压力 (N)':v.Pcr,'欧拉参考适用性':!v.stabilityVerified?'仅弯曲参考，未验证扭转/弯扭及连接稳定性':v.eulerApplicable===null?'仅等效弹性参考':v.eulerApplicable?'低于屈服参考，仍需比例极限验证':'临界应力达到屈服参考，不作为有效承载力',
        '名义最小正应力 (MPa)':v.minNormalStress??'未提供边缘几何或超临界，不计算','名义最大正应力 (MPa)':v.maxNormalStress??'未提供边缘几何或超临界，不计算','长细比':v.lambda,'载荷比':v.loadRatio,'初弯曲 (mm)':state.buckleInitialBow,'总侧移 (mm)':v.displacementAvailable&&v.totalBow!==null?v.totalBow:'未计算实际位移，仅参考模态','模型':v.phase,
      }));
    case 'combined':
      return (['eccentric','bendtorque'] as const).map(mode=>`${mode==='eccentric'?'偏心拉压':'弯扭组合'}：\n`+describe(calculateCombined(combinedInput(state,mode)),v=>({
        '材料':state.materialName,'E (GPa)':state.bendTorqueModulus,'G (GPa)':state.bendTorqueShearModulus,'模型':v.phase,'名义截面':v.criticalLabel,'A端横向剪力 (N)':v.rootShear,'应力口径':mode==='bendtorque'?(v.torsionSupported?'同一点σx、τxy、τxz叠加；全截面网格采样，非端部局部验算':'截面场不可用'):'平面梁柱名义应力',
        '上缘正应力 (MPa)':v.topStress??'缺少边缘几何，未计算','下缘正应力 (MPa)':v.bottomStress??'缺少边缘几何，未计算','扭转剪应力 (MPa)':v.tau??'缺少可用截面场',
        '最大总剪应力 (MPa)':v.totalShearMax??'未计算','最大横剪分量 (MPa)':v.transverseMax??'未计算','抗扭常数 J (mm4)':v.torsionConstant??'未计算','能量剪心 zS (mm)':v.shearCenterZ??'未计算','von Mises 采样最大值 (MPa)':v.mises??'未计算','扭转边界':mode==='bendtorque'?'自由翘曲，不含完全夹紧端约束翘曲':'无扭矩','端部侧移 (mm)':v.geometryAvailable&&!v.yieldExceeded?v.tipDeflection:'仅线性外推，不作为实际位移',
        '端部转角 (rad)':v.tipTwist===null?'扭转未求解':v.geometryAvailable&&!v.yieldExceeded?v.tipTwist:'仅线性外推，不作为实际转角',
      }))).join('\n');
    case 'stress':
      return describe(calculatePlaneStress({ sigmaX: state.stressSigX, sigmaY: state.stressSigY, tauXY: state.stressTauXY, angle: state.stressAngle }), v => ({
        'σx (MPa)': state.stressSigX, 'σy (MPa)': state.stressSigY, 'τxy (MPa)': state.stressTauXY,
        '旋转角 (°)': state.stressAngle, '平面主应力 1 (MPa)': v.sig1, '平面主应力 2 (MPa)': v.sig2,
        '面内最大切应力 (MPa)': v.maxShear, '空间最大切应力 (MPa)':v.absoluteMaxShear, '旋转后 σx′ (MPa)':v.sigX_prime, '旋转后 σy′ (MPa)':v.sigY_prime, '旋转后 τx′y′ (MPa)':v.tauXY_prime, '最大面内主应力方向 (°)':v.principalAngle??'任意方向',
      }));
    default: return null;
  }
}
