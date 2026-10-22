import { describe, expect, it } from 'vitest';
import { deriveAxialSpecimen, axialDisplayShape } from '../graphics/axialSpecimen';
import { calculateAxialTeaching } from '../mechanics/calculations';
import { DEFAULT_MATERIALS } from '../mechanics/materials';

const specimen = (name: string, stress: number) => {
  const m = DEFAULT_MATERIALS.find(item => item.name === name)!;
  const r = calculateAxialTeaching({ materialName: m.name, modulus: m.E, yieldStrength: m.yield, force: stress * 100, area: 100, length: 1 });
  if (!r.ok) throw new Error('无效工况');
  return { response: r.values, shape: deriveAxialSpecimen(r.values, 100, m.poisson) };
};

describe('材料曲线与三维试件的耦合', () => {
  it('弹性伸长和横向收缩来自同一材料，实际长度与曲线应变一致', () => {
    for (const name of ['Q235钢', '6061-T6铝合金', '玻璃']) {
      const { response: v, shape: s } = specimen(name, 20);
      expect(s.status).toBe('coupled');
      expect(s.geometry.strain).toBe(v.strain);
      expect(s.geometry.currentLength).toBeCloseTo(1000 + v.deformation, 10);
      expect(s.geometry.currentWidth).toBeCloseTo(10 * (1 + s.geometry.transverseStrain), 10);
    }
    const steel = specimen('Q235钢', 20).shape;
    expect(steel.geometry.transverseStrain).toBeCloseTo(-.3 * 20 / 206000, 12);
  });
  it('钢材强化和铝合金连续屈服的塑性部分按等体积教学收缩', () => {
    for (const [name, stress] of [['Q235钢', 300], ['6061-T6铝合金', 300]] as const) {
      const { response: v, shape: s } = specimen(name, stress);
      const m = DEFAULT_MATERIALS.find(item => item.name === name)!;
      const elastic = stress / (m.E * 1000), plasticStretch = (1 + v.strain) / (1 + elastic);
      expect(s.status).toBe('coupled');
      expect(s.geometry.strain).toBe(v.strain);
      expect(((1 + s.geometry.transverseStrain) / (1 - m.poisson * elastic)) ** 2 * plasticStretch).toBeCloseTo(1, 10);
    }
  });
  it('不同材料在同一应力下呈现不同的实际伸长', () => {
    expect(specimen('6061-T6铝合金', 250).shape.geometry.currentLength).toBeGreaterThan(specimen('Q345钢', 250).shape.geometry.currentLength);
  });
  it('归一化曲线和超过金属教学峰值时不把弹性估算画成材料变形', () => {
    for (const [name, stress] of [['橡胶', 1], ['C30混凝土', 20], ['尼龙PA66', 10], ['Q235钢', 500]] as const) {
      const s = specimen(name, stress).shape;
      expect(s.status).toBe('unavailable');
      expect(s.currentLength).toBeNull();
      expect(s.geometry.strain).toBe(0);
      expect(s.allowFlow).toBe(false);
    }
  });
  it('脆性超参考值仅显示断裂参考形态，不声明当前长度且停止内部粒子', () => {
    const s = specimen('玻璃', 60).shape;
    expect(s.status).toBe('fracture-reference');
    expect(s.currentLength).toBeNull();
    expect(s.allowFlow).toBe(false);
    expect(s.geometry.strain).toBe(0);
  });
  it('共同放大轴向及横向位移，保留应变差异，不再将大伸长统一截成40%', () => {
    const a = axialDisplayShape(.1, -.04, 10), b = axialDisplayShape(.15, -.06, 10);
    expect(b.halfLength).toBeGreaterThan(a.halfLength);
    expect(a.halfLength).toBeCloseTo(400);
    expect(a.halfWidth).toBeCloseTo(36);
    const safe = axialDisplayShape(.2, -.15, 80);
    expect(safe.halfWidth).toBeGreaterThan(0);
    expect(safe.amplification).toBeLessThan(80);
    expect((safe.halfLength / 200 - 1) / .2).toBeCloseTo(safe.amplification, 10);
    expect((safe.halfWidth / 60 - 1) / -.15).toBeCloseTo(safe.amplification, 10);
  });
  it('真实倍率保持实际应变，卸载恢复初始几何', () => {
    const s = specimen('Q235钢', 0).shape;
    expect(s.geometry.currentLength).toBe(1000);
    expect(s.geometry.currentWidth).toBe(10);
    expect(axialDisplayShape(.01, -.003, 1)).toEqual({ halfLength: 202, halfWidth: 59.82, amplification: 1 });
  });
  it('极端自定义材料不会把泊松外推的负宽度画成有效三维实体', () => {
    const r = calculateAxialTeaching({ modulus: .001, yieldStrength: 100, force: 1000, area: 100, length: 1 });
    if (!r.ok) throw new Error('无效工况');
    expect(deriveAxialSpecimen(r.values, 100, .3).status).toBe('unavailable');
  });
});
