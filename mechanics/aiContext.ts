import { ModuleType, SimulationState } from '../types';
import { calculateAxialTeaching, calculateBending, calculateBuckling, calculatePlaneStress, calculateTorsion } from './calculations';
import { CalculationResult } from './validation';

function describe<T>(result: CalculationResult<T>, summary: (values: T) => Record<string, number | string>) {
  if (result.ok === false) return `当前本地计算无效：${JSON.stringify(result.diagnostics)}。请引导调整参数，不给出有效数值结论。`;
  return `本地计算结果（与当前视图共用计算函数，版本 1）：${JSON.stringify(summary(result.values))}\n计算假设：${result.assumptions.join(' ')}\n适用范围警告：${result.warnings.join(' ') || '无'}。`;
}

// 仅包含实验参数和本地结果；凭据及对话不会进入计算上下文。
export function getCalculationContext(module: ModuleType, state: SimulationState): string | null {
  switch (module) {
    case 'axial':
      return describe(calculateAxialTeaching({ force: state.axialForce, area: state.axialArea, length: state.axialLength, modulus: state.bendModulus, yieldStrength: state.materialYield }), v => ({
        '轴向力 (N)': state.axialForce, '面积 (mm²)': state.axialArea, '长度 (m)': state.axialLength,
        '应力 (MPa)': v.stress, '应变': v.strain, '伸长 (mm)': v.deformation,
        '应变能 (J)': v.isPlastic ? '超出弹性范围，不适用' : v.totalStrainEnergyJ,
      }));
    case 'bending':
      return describe(calculateBending({ load: state.bendLoad, length: state.bendLength, position: state.bendLoadPos, modulus: state.bendModulus, section: state.bendSection }), v => ({
        '载荷 (N)': state.bendLoad, '跨度 (m)': state.bendLength, '载荷位置 (m)': state.bendLoadPos,
        '截面': JSON.stringify(state.bendSection), '左反力 (N)': v.R1, '右反力 (N)': v.R2,
        '最大弯矩 (N·m)': v.maxMoment, '载荷点挠度 (mm)': v.deflectionAtLoad,
        '最大应力 (MPa)': v.maxStress, '应变能 (mJ)': v.strainEnergy,
      }));
    case 'torsion':
      return describe(calculateTorsion({ torque: state.torqTorque, radius: state.torqRadius, length: state.torqLength, modulus: state.torqModulus, loadRatio: state.torqLoadRatio }), v => ({
        '输入扭矩 (N·m)': state.torqTorque, '半径 (mm)': state.torqRadius, '长度 (m)': state.torqLength,
        '剪切模量 (GPa)': state.torqModulus, '中间输出比例': state.torqLoadRatio,
        '最大切应力 (MPa)': v.maxShear, '总扭转角 (°)': v.phi_total_deg, '应变能 (J)': v.U_total_J,
      }));
    case 'buckling':
      return describe(calculateBuckling({ load: state.buckleLoad, length: state.buckleLength, modulus: state.buckleModulus, section: state.buckleSection, yieldStrength: state.materialYield }), v => ({
        '压力 (N)': state.buckleLoad, '长度 (m)': state.buckleLength, '弹性模量 (GPa)': state.buckleModulus,
        '截面': JSON.stringify(state.buckleSection), '临界压力 (N)': v.Pcr, '长细比': v.lambda,
      }));
    case 'stress':
      return describe(calculatePlaneStress({ sigmaX: state.stressSigX, sigmaY: state.stressSigY, tauXY: state.stressTauXY, angle: state.stressAngle }), v => ({
        'σx (MPa)': state.stressSigX, 'σy (MPa)': state.stressSigY, 'τxy (MPa)': state.stressTauXY,
        '旋转角 (°)': state.stressAngle, '平面主应力 1 (MPa)': v.sig1, '平面主应力 2 (MPa)': v.sig2,
        '面内最大切应力 (MPa)': v.maxShear,
      }));
    default: return null;
  }
}
