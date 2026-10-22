import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '../types';
import { calculateFundamentals } from '../mechanics/fundamentals';
import { createExperiment, getSimulation, parseExperimentJSON, simulationParameters } from '../experiments/schema';
import { getResults } from '../experiments/results';
import { getCalculationContext } from '../mechanics/aiContext';

const specimen = { ...DEFAULT_STATE, axialForce: 20000, axialArea: 100, axialLength: .1 };
describe('泊松效应工作台的数据一致性', () => {
  it('200 GPa、0.1% 应变：正确换算长度、横向收缩和工程应力', () => {
    const result = calculateFundamentals(specimen);
    expect(result.ok).toBe(true);
    if (result.ok === false) throw new Error('无有效结果');
    expect(result.values.strain).toBeCloseTo(.001);
    expect(result.values.transverseStrain).toBeCloseTo(-.0003);
    expect(result.values.stress).toBe(200);
    expect(result.values.currentLength).toBeCloseTo(100.1);
    expect(result.values.currentWidth).toBeCloseTo(9.997);
    expect(result.values.trueStress).toBeCloseTo(20000 / 9.997 ** 2);
  });
  it('零载荷保留原始几何；零泊松比无横向收缩', () => {
    const unloaded = calculateFundamentals({ ...specimen, axialForce: 0 });
    const zeroNu = calculateFundamentals({ ...specimen, poissonRatio: 0 });
    if (unloaded.ok === false || zeroNu.ok === false) throw new Error('无有效结果');
    expect(unloaded.values.currentLength).toBe(100);
    expect(unloaded.values.currentWidth).toBe(10);
    expect(zeroNu.values.transverseStrain).toBe(-0);
    expect(zeroNu.values.trueStress).toBe(200);
  });
  it('使用已有文档字段保存，JSON 重开后参数、图形结果和报告保持一致', () => {
    const document = createExperiment('fundamentals', '泊松效应验证', { kind: 'simulation', parameters: simulationParameters('fundamentals', specimen) });
    const reopened = parseExperimentJSON(JSON.stringify(document));
    const restored = getSimulation(reopened);
    expect(calculateFundamentals(restored)).toEqual(calculateFundamentals(specimen));
    const report = getResults(reopened);
    expect(report.metrics.find(m => m.label === '轴向应变')).toEqual({ label: '轴向应变', value: .1, unit: '%' });
    expect(report.metrics.find(m => m.label === '工程应力')?.value).toBe(200);
    expect(getCalculationContext('fundamentals', restored)).toContain('200');
  });
  it('超屈服时图表和 AI 上下文都明确标示弹性外推', () => {
    const state = { ...specimen, axialForce: 40000 };
    const result = calculateFundamentals(state);
    expect(result.ok && result.warnings.join('')).toContain('不代表材料实际响应');
    expect(getCalculationContext('fundamentals', state)).toContain('超过参考屈服强度');
  });
  it('不把非法泊松比、不可行几何或溢出参数绘制为有效结果', () => {
    for (const poissonRatio of [.5, -1, NaN]) expect(calculateFundamentals({ ...specimen, poissonRatio }).ok).toBe(false);
    expect(calculateFundamentals({ ...specimen, axialArea: 0 }).ok).toBe(false);
    expect(calculateFundamentals({ ...specimen, axialForce: 1e300, bendModulus: 1 }).ok).toBe(false);
    expect(calculateFundamentals({ ...specimen, axialForce: 1e9 }).ok).toBe(false);
  });
});
