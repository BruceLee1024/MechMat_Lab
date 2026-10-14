import type { SimulationState } from '../types';
import { validateSection } from './sections';

export function updateSimulationState(previous: SimulationState, changes: Partial<SimulationState>): SimulationState {
  const next = { ...previous, ...changes };
  const positive = ['materialYield', 'axialArea', 'axialLength', 'bendLength', 'bendModulus', 'bendWidth', 'bendHeight', 'torqRadius', 'torqLength', 'torqModulus', 'buckleLength', 'buckleModulus', 'buckleWidth', 'buckleHeight', 'combinedWidth', 'combinedHeight', 'combinedLength', 'bendTorqueLength', 'bendTorqueModulus'];
  for (const [key, value] of Object.entries(changes)) {
    if (typeof value === 'number' && (!Number.isFinite(value) || (positive.includes(key) && value <= 0))) return previous;
  }
  if (next.poissonRatio < 0 || next.poissonRatio >= 0.5 || next.buckleLoad < 0) return previous;
  if (next.torqLoadRatio < 0 || next.torqLoadRatio > 1) return previous;
  if (next.axialObliqueAngle < 0 || next.axialObliqueAngle > 90) return previous;
  for (const key of ['bendSection', 'buckleSection', 'combinedSection', 'bendTorqueSection'] as const) {
    if (changes[key] && validateSection(next[key])) return previous;
  }
  // 修改跨度后将载荷限制在梁内；缩短梁不会产生支座外的负反力工况。
  next.bendLoadPos = Math.max(0, Math.min(next.bendLength, next.bendLoadPos));
  next.bendTorqueBendPos = Math.max(0, Math.min(next.bendTorqueLength, next.bendTorqueBendPos));
  return next;
}
