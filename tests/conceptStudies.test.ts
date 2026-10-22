import { describe, expect, it } from 'vitest';
import { sectionStudy, strainStudy } from '../mechanics/conceptStudies';

describe('截面隔离体的平衡与单位', () => {
  it('移动截面只改变力臂，轴力和剪力保持外载量值', () => {
    const a = sectionStudy(25, 2, 3);
    const b = sectionStudy(85, 2, 3);
    expect(a.momentKNm).toBeCloseTo(1.5);
    expect(b.momentKNm).toBeCloseTo(.3);
    for (const value of [a, b]) {
      expect(value.axialKN).toBe(3);
      expect(value.shearKN).toBe(2);
      expect(value.momentKNm - 2 * value.remainingM).toBeCloseTo(0);
    }
  });
  it('自由端力臂为零，纯轴向载荷不会产生弯矩和剪力', () => {
    expect(sectionStudy(100, 4, 2).momentKNm).toBe(0);
    const pureAxial = sectionStudy(50, 0, 5);
    expect(pureAxial.shearKN).toBe(0);
    expect(pureAxial.momentKNm).toBe(0);
    expect(pureAxial.axialKN).toBe(5);
  });
});
describe('位移场与小应变一致性', () => {
  const input = { rigid: false, axialPercent: .8, shear: .01, translationXmm: 18, translationYmm: -7 };
  it('有整体平移时应变仍为零，平移不会丢失位移读数', () => {
    const value = strainStudy({ ...input, rigid: true });
    expect(value.ex).toBe(0);
    expect(value.ey).toBe(0);
    expect(value.gamma).toBe(0);
    expect(value.cornerUXmm).toBe(18);
    expect(value.cornerVYmm).toBe(-7);
  });
  it('100 mm 单元的轴向伸长与简单剪切贡献共同形成 C 点位移', () => {
    const value = strainStudy(input);
    expect(value.ex).toBeCloseTo(.008);
    expect(value.gamma).toBeCloseTo(.01);
    expect(value.cornerUXmm).toBeCloseTo(.8 + 1);
    expect(value.cornerVYmm).toBe(0);
  });
  it('压缩与反向剪切保留符号，零变形回到参考单元', () => {
    const negative = strainStudy({ ...input, axialPercent: -.75, shear: -.015 });
    expect(negative.cornerUXmm).toBeCloseTo(-2.25);
    const zero = strainStudy({ ...input, axialPercent: 0, shear: 0 });
    expect(zero.cornerUXmm).toBe(0);
    expect(zero.cornerVYmm).toBe(0);
  });
});
