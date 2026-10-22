import { SimulationState } from '../types';
import { calculateAxial } from './calculations';
import { calculation } from './validation';

// 与轴向计算共用单位和胡克定律；加载由已有文档字段 axialForce 保存。
export function calculateFundamentals(state: SimulationState) {
  const elastic = calculateAxial({ force: state.axialForce, area: state.axialArea, length: state.axialLength, modulus: state.bendModulus });
  if (elastic.ok === false) return elastic;
  if (!Number.isFinite(state.poissonRatio) || state.poissonRatio < 0 || state.poissonRatio >= 0.5) {
    return { ok: false as const, diagnostics: [{ field: 'poissonRatio', message: '泊松比须位于 0（含）与 0.5（不含）之间' }] };
  }
  const { strain, stress, lengthMm } = elastic.values;
  const transverseStrain = -state.poissonRatio * strain;
  const width = Math.sqrt(state.axialArea);
  const currentWidth = width * (1 + transverseStrain);
  if (1 + strain <= 0 || currentWidth <= 0) return { ok: false as const, diagnostics: [{ field: 'axialForce', message: '加载超出该变形演示的几何适用范围' }] };
  return calculation({ ...elastic.values, transverseStrain, width, currentWidth, currentLength: lengthMm * (1 + strain), trueStress: stress / (1 + transverseStrain) ** 2 },
    ['均匀、各向同性材料，单轴小变形线弹性演示；截面取等面积正方形。', '真应力按当前截面积 F/A 计算；变形放大仅用于显示。'],
    Math.abs(stress) > state.materialYield ? ['已超过参考屈服强度，当前弹性外推不代表材料实际响应。'] : []);
}
