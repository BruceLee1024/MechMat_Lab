import { describe, expect, it } from 'vitest';
import { calculateAxialTeaching } from '../mechanics/calculations';
import { DEFAULT_MATERIALS } from '../mechanics/materials';
import { deriveAxialSpecimen } from '../graphics/axialSpecimen';
import { axialField, axialMaterialPoint, axialTraction } from '../mechanics/axialField';

function make(name = 'Q235钢', stress = 100, area = 100, length = 1) {
  const m = DEFAULT_MATERIALS.find(item => item.name === name)!;
  const r = calculateAxialTeaching({ materialName: name, modulus: m.E, yieldStrength: m.yield, force: stress * area, area, length });
  if (!r.ok) throw Error('参数无效');
  return { v: r.values, specimen: deriveAxialSpecimen(r.values, area, m.poisson) };
}

describe('轴拉三维连续体场与材料响应共用数据', () => {
  it.each(['Q235钢', '6061-T6铝合金', '玻璃'])('材料 %s 的场满足截面平衡与位移协调', name => {
    const { v, specimen } = make(name, 20);
    const f = axialField(specimen);
    if (!f) throw Error('应有定量场');
    expect(f.force).toBeCloseTo(2000, 8);
    expect(f.trueStress * f.currentArea).toBeCloseTo(f.force, 8);
    const left = axialMaterialPoint(f, [-500, 0, 0]), right = axialMaterialPoint(f, [500, 0, 0]);
    expect(right.displacement[0] - left.displacement[0]).toBeCloseTo(v.deformation, 10);
    expect(right.current[0] - left.current[0]).toBeCloseTo(specimen.currentLength!, 10);
    expect(axialMaterialPoint(f, [0, 0, 0]).displacement.every(x => x === 0)).toBe(true);
    for (const x of [-400, 0, 350]) {
      expect(axialMaterialPoint(f, [x + 1, 0, 0]).displacement[0] - axialMaterialPoint(f, [x, 0, 0]).displacement[0]).toBeCloseTo(v.strain, 12);
    }
  });
  it('金属塑性教学上升支的当前面积与真实应力用同一横向伸长比', () => {
    const { specimen } = make('Q235钢', 300, 240, 2);
    const f = axialField(specimen)!;
    expect(f.currentArea).toBeCloseTo(specimen.geometry.currentWidth ** 2, 10);
    expect(f.trueStress).toBeGreaterThan(f.engineeringStress);
    expect(f.force).toBeCloseTo(72000, 8);
    expect(axialMaterialPoint(f, [0, Math.sqrt(240)/2, 0]).current[1]).toBeCloseTo(specimen.geometry.currentWidth/2, 10);
  });
  it('柯西面力满足自由侧面零面力、对面反向以及斜截面合力平衡', () => {
    const f = axialField(make().specimen)!;
    expect(axialTraction(f, [0, 1, 0])).toEqual([0, 0, 0]);
    expect(axialTraction(f, [0, 0, 1])).toEqual([0, 0, 0]);
    expect(axialTraction(f, [-1, 0, 0])[0]).toBe(-f.trueStress);
    const normal = [Math.cos(Math.PI/6), Math.sin(Math.PI/6), 0] as [number, number, number];
    const traction = axialTraction(f, normal);
    expect(traction[0] * f.currentArea / normal[0]).toBeCloseTo(f.force, 8);
    expect(traction[1]).toBe(0);
  });
  it('超过脆断参考点、金属峰值和未标定材料均不生成虚假的定量变形与贯通应力场', () => {
    for (const [name, stress] of [['玻璃', 210], ['Q235钢', 500], ['橡胶', 1]] as const) {
      expect(axialField(make(name, stress).specimen)).toBeNull();
    }
  });
  it('零载场的应力和位移为零，不引入刚体平移', () => {
    const f = axialField(make('Q235钢', 0).specimen)!;
    expect(f.force).toBe(0);
    expect(f.trueStress).toBe(0);
    expect(axialMaterialPoint(f, [500, 5, 5]).displacement.every(x => x === 0)).toBe(true);
  });
});
