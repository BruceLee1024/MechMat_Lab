import { describe, expect, it } from 'vitest';
import { getAxialMaterialResponse, sampleMaterialCurve } from '../mechanics/axialResponse';
import { calculateAxialTeaching } from '../mechanics/calculations';
import { DEFAULT_MATERIALS } from '../mechanics/materials';
import { getCalculationContext } from '../mechanics/aiContext';
import { DEFAULT_STATE } from '../types';
import { createExperiment, parseExperimentJSON, serializeExperiment } from '../experiments/schema';
import { getResults } from '../experiments/results';

const material = (name: string) => {
  const m = DEFAULT_MATERIALS.find(item => item.name === name)!;
  return { materialName: m.name, modulus: m.E, yieldStrength: m.yield };
};
const response = (name: string, stress: number) => {
  const result = calculateAxialTeaching({ ...material(name), force: stress * 100, area: 100, length: 1 });
  if (result.ok === false) throw new Error('无效工况');
  return result;
};

describe('材料对应的轴向教学曲线', () => {
  it('Q235 与 Q345 有屈服平台，不套用到铝合金', () => {
    for (const name of ['Q235钢', 'Q345钢']) {
      const curve = sampleMaterialCurve(material(name));
      expect(curve.model.family).toBe('plateau');
      const plateau = curve.points.filter(p => p.stage === '屈服平台');
      expect(plateau.length).toBeGreaterThanOrEqual(2);
      expect(plateau[0].stress).toBe(plateau[1].stress);
      expect(plateau[1].strain).toBeGreaterThan(plateau[0].strain);
    }
    const aluminium = sampleMaterialCurve(material('6061-T6铝合金'));
    expect(aluminium.model.family).toBe('smooth');
    expect(aluminium.points.some(p => p.stage === '屈服平台')).toBe(false);
  });
  it('连续屈服金属采用 0.2% 偏移参考，材料 E 和参考强度决定曲线位置', () => {
    for (const name of ['304不锈钢', '6061-T6铝合金', 'Ti-6Al-4V钛合金']) {
      const m = material(name), r = response(name, m.yieldStrength);
      expect(r.values.strain).toBeCloseTo(m.yieldStrength / (m.modulus * 1000) + .002, 10);
    }
    expect(response('6061-T6铝合金', 100).values.strain).toBeGreaterThan(response('304不锈钢', 100).values.strain);
  });
  it('玻璃、铸铁和纤维复合材料没有虚假的塑性平台', () => {
    for (const name of ['玻璃', '铸铁HT200', 'GFRP玻璃钢', 'CFRP碳纤维']) {
      const m = material(name), curve = sampleMaterialCurve(m), r = response(name, m.yieldStrength * 1.1);
      expect(curve.model.family).toBe('brittle');
      expect(curve.points.some(p => p.stage === '屈服平台')).toBe(false);
      expect(r.values.isPlastic).toBe(false);
      expect(r.values.isFailure).toBe(true);
      expect(r.values.energyApplicable).toBe(false);
      expect(r.values.strainMode).toBe('elastic-estimate');
    }
  });
  it('混凝土压缩值不能冒充拉伸屈服、强度或断裂阈值', () => {
    const m = material('C30混凝土'), model = getAxialMaterialResponse(m), r = response('C30混凝土', 20);
    expect(model.quantitative).toBe(false);
    expect(model.referenceRole).toBe('compression');
    expect(r.values.isPlastic).toBe(false);
    expect(r.values.isFailure).toBe(false);
    expect(r.warnings.join()).toContain('抗拉');
  });
  it('橡胶与 PA66 区分非线性弹性和黏塑性形态，不能从 E 伪造实测响应', () => {
    expect(getAxialMaterialResponse(material('橡胶')).family).toBe('elastomer');
    expect(getAxialMaterialResponse(material('尼龙PA66')).family).toBe('polymer');
    expect(response('橡胶', 1).values.strainMode).toBe('elastic-estimate');
    expect(response('橡胶', 1).values.energyApplicable).toBe(false);
  });
  it('手动修改参数或自定义材料不会继承原牌号的屈服后特性', () => {
    expect(getAxialMaterialResponse({ ...material('Q235钢'), modulus: 100 }).family).toBe('elastic');
    expect(getAxialMaterialResponse({ materialName: '自定义材料', modulus: 206, yieldStrength: 235 }).family).toBe('elastic');
  });
  it('曲线采样点与主实验在上升支的读数一致', () => {
    for (const name of ['Q235钢','Q345钢','6061-T6铝合金','304不锈钢','玻璃']) {
      const m = material(name), curve = sampleMaterialCurve(m);
      for (const point of curve.points.filter(p => p.branch === 'loading' && p.stage !== '屈服平台')) {
        const r = response(name, point.stress);
        expect(r.values.strain).toBeCloseTo(point.strain, 9);
      }
    }
  });
  it('零载荷为零，且应变能只在适用的线弹性段显示', () => {
    const zero = response('Q235钢', 0);
    expect(zero.values.strain).toBe(0);
    expect(zero.values.totalStrainEnergyJ).toBe(0);
    expect(zero.values.energyApplicable).toBe(true);
    expect(response('Q235钢', 300).values.energyApplicable).toBe(false);
  });
  it('AI 摘要使用同一材料响应，并隐藏不适用应变能', () => {
    const m = material('玻璃');
    const context = getCalculationContext('axial', { ...DEFAULT_STATE, ...m, bendModulus: m.modulus, materialYield: m.yieldStrength, axialForce: 6000 });
    expect(context).toContain('脆性');
    expect(context).toContain('不适用');
  });
  it.each(DEFAULT_MATERIALS)('$name 的教学曲线有限且从原点开始', m => {
    const curve = sampleMaterialCurve(material(m.name));
    expect(curve.model.name).toBe(m.name);
    expect(curve.model.family).not.toBe('elastic');
    expect(curve.points[0].strain).toBe(0);
    expect(curve.points[0].stress).toBe(0);
    expect(curve.points.every(p => Number.isFinite(p.strain) && Number.isFinite(p.stress) && p.strain >= 0 && p.stress >= 0)).toBe(true);
  });
  it('材料身份在文档恢复后保留，报告复用连续屈服应变且不输出伪弹性能', () => {
    const document = createExperiment('axial');
    if (document.model.kind !== 'simulation') throw new Error('模型类型不符');
    Object.assign(document.model.parameters, { materialName: '6061-T6铝合金', bendModulus: 68.9, materialYield: 276, poissonRatio: .33, axialForce: 27600, axialArea: 100, axialLength: 1 });
    const restored = parseExperimentJSON(serializeExperiment(document));
    const r = getResults(restored);
    expect(r.valid).toBe(true);
    expect(r.metrics.find(m => m.label === '应变')?.value).toBeCloseTo(276/68900+.002,10);
    expect(r.metrics.some(m => m.label === '应变能')).toBe(false);
    expect(r.assumptions.join()).toContain('连续屈服');
  });

});
