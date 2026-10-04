import { describe, expect, it } from 'vitest';
import { getCalculationContext } from '../mechanics/aiContext';
import { DEFAULT_STATE } from '../types';

function summary(text: string | null): Record<string, number | string> {
  if (!text) throw new Error('缺少本地计算上下文');
  const json = text.split('：')[1].split('\n')[0];
  return JSON.parse(json);
}

describe('AI 与实验计算使用同一工况', () => {
  it('弯曲使用已选择的截面与载荷位置，不使用遗留矩形尺寸', () => {
    const context = getCalculationContext('bending', { ...DEFAULT_STATE, bendLoad: 1000, bendSection: { type: 'circle', radius: 10 }, bendWidth: 999 });
    const values = summary(context);
    expect(values['截面']).toBe('{"type":"circle","radius":10}');
    expect(values['最大弯矩 (N·m)']).toBe(500);
    expect(values['最大应力 (MPa)']).toBeCloseTo(636.6197723675814, 9);
    expect(context).toContain('不等于全梁最大挠度');
  });
  it('塑性教学结果不把弹性应变能作为有效结论发送', () => {
    const context = getCalculationContext('axial', { ...DEFAULT_STATE, axialForce: 30000 });
    expect(summary(context)['应变能 (J)']).toBe('超出弹性范围，不适用');
    expect(context).toContain('教学示意');
  });
  it('扭矩分流比例改变时，AI 的总扭转角同步变化', () => {
    const state = { ...DEFAULT_STATE, torqTorque: 1, torqRadius: 10, torqModulus: 80, torqLoadRatio: 0 };
    const a = summary(getCalculationContext('torsion', state));
    const b = summary(getCalculationContext('torsion', { ...state, torqLoadRatio: 1 }));
    expect(a['总扭转角 (°)']).toBeCloseTo(0.045594532639052, 12);
    expect(b['总扭转角 (°)']).toBeCloseTo(0.022797266319526, 12);
    expect(b['中间输出比例']).toBe(1);
  });
  it('无效参数只提供诊断，不提供有效结果', () => {
    const context = getCalculationContext('axial', { ...DEFAULT_STATE, axialArea: 0 });
    expect(context).toContain('当前本地计算无效');
    expect(context).not.toContain('本地计算结果');
    expect(context).not.toContain('Infinity');
  });
});
