import { describe, expect, it } from 'vitest';
import { FORMULA_BEAM_CALCULATORS } from '../mechanics/formulaBeamCalculators';

const defaults = (id: string) => Object.fromEntries(FORMULA_BEAM_CALCULATORS[id].inputs.map(input => [input.key, input.default]));
const values = (id: string, overrides: Record<string, number> = {}) => FORMULA_BEAM_CALCULATORS[id].calculate({ ...defaults(id), ...overrides });

describe('常用公式计算器的单位与解析结果', () => {
  it('简支均布梁以 N、m、Pa、m⁴ 独立计算得到 4.21875 mm 和 2.25 mrad', () => {
    const result = values('ss-uniform');
    expect(result[2].value).toBeCloseTo(4.21875, 10);
    expect(result[3].value).toBeCloseTo(2.25, 10);
  });

  it('悬臂端力与端矩使用真实 kN / kN·m 单位', () => {
    expect(values('cant-end')[2].value).toBeCloseTo(9, 10);
    expect(values('cant-end')[3].value).toBeCloseTo(4.5, 10);
    expect(values('cant-moment')[2].value).toBeCloseTo(9, 10);
    expect(values('cant-moment')[3].value).toBeCloseTo(6, 10);
  });

  it('两个对称力合并到跨中时与单个双倍集中力完全一致', () => {
    const two = values('ss-two-point', { a: 3 });
    const one = values('ss-center', { P: 20 });
    expect(two[0].value).toBeCloseTo(one[0].value, 10);
    expect(two[1].value).toBeCloseTo(one[1].value, 10);
    expect(two[2].value).toBeCloseTo(one[2].value, 10);
    expect(two[3].value).toBeCloseTo(one[3].value, 10);
  });

  it('简支三角载荷最大挠度满足积分挠曲线的零转角位置', () => {
    // 对 EI v'''' = qx/L 积分并施加两端 v = v'' = 0。
    const q = 10000, L = 6, EI = 200e9 * 100e-6;
    const x = L * Math.sqrt(1 - Math.sqrt(480) / 30);
    const expectedMm = q * x * (7 * L ** 4 - 10 * L * L * x * x + 3 * x ** 4) / (360 * L * EI) * 1000;
    expect(values('ss-triangular')[3].value).toBeCloseTo(expectedMm, 10);
  });

  it('抛物线三铰拱跨中集中力的最大弯矩幅值位于四分点', () => {
    // M = M0 - Hy；拱顶是铰，不能将拱顶零弯矩称为全拱最大值。
    const P = 100, L = 20, f = 5, x = L / 4;
    const H = P * L / (4 * f);
    const y = 4 * f * x * (L - x) / (L * L);
    expect(values('arch-3hinge-center')[2].value).toBeCloseTo(Math.abs(P * x / 2 - H * y), 10);
  });

  it('半跨均布三铰拱在两侧四分点得到等幅反号峰值', () => {
    const w = 10, L = 20, f = 5, x = L / 4;
    const H = w * L * L / (16 * f), RA = 3 * w * L / 8;
    const M = RA * x - w * x * x / 2 - H * 4 * f * x * (L - x) / (L * L);
    expect(values('arch-half-uniform')[3].value).toBeCloseTo(Math.abs(M), 10);
  });

  it('固端抛物线拱不能将直梁固端矩与拱推力叠加为不平衡结果', () => {
    const result = values('arch-fixed-uniform');
    const { w, L, f } = defaults('arch-fixed-uniform');
    const H = result[1].value, Mend = result[2].value, Mmid = result[3].value;
    expect(Mmid).toBeCloseTo(Mend + w * L * L / 8 - H * f, 10);
  });

  it.each([
    ['ss-point', 3, 16 / 9],
    ['ss-two-point', 2, 23 / 6],
    ['ss-two-point', 3, 2],
    ['cant-uniform', 2, 5.0625],
    ['cant-uniform', 3, 2.25],
    ['cant-point', 2, 8 / 3],
    ['cant-point', 3, 14 / 3],
    ['cant-triangular', 2, 2.7],
    ['cant-triangular', 3, 1.125],
    ['fixed-center', 3, 0.5625],
    ['fixed-uniform', 3, 0.84375],
    ['overhang', 3, 16 / 3],
    ['overhang-uniform', 3, 2.5],
    ['ss-moment', 2, 2],
    ['ss-moment', 3, 1],
  ] as const)('%s 结果 %s 与独立 SI 解析值一致', (id, index, expected) => {
    expect(values(id)[index].value).toBeCloseTo(expected, 10);
  });

  it('任意位置两端固定梁同时满足竖向及整体力矩平衡', () => {
    const [R1, R2, M1, M2] = values('fixed-point', { a: 1.7 });
    expect(R1.value + R2.value).toBeCloseTo(10, 10);
    expect(R2.value * 6 + M1.value - M2.value).toBeCloseTo(10 * 1.7, 10);
  });

  it('连续梁与外伸梁均满足整体平衡', () => {
    const [RA, RB] = values('continuous');
    expect(2 * RA.value + RB.value).toBeCloseTo(2 * 5 * 6, 10);
    const [R1, R2] = values('overhang');
    expect(R1.value + R2.value).toBeCloseTo(10, 10);
    expect(R2.value * 6).toBeCloseTo(10 * 8, 10);
  });

  it('部分均布缩减为全跨载荷时与全跨均布梁内力一致', () => {
    const [R1, R2, x, M] = values('ss-partial', { a: 0, c: 6, q: 5 });
    const full = values('ss-uniform');
    expect(R1.value).toBeCloseTo(full[0].value, 10);
    expect(R2.value).toBeCloseTo(full[0].value, 10);
    expect(x.value).toBeCloseTo(3, 10);
    expect(M.value).toBeCloseTo(full[1].value, 10);
  });
});

describe('计算器参数诊断', () => {
  it.each(Object.keys(FORMULA_BEAM_CALCULATORS))('%s 默认参数及零载荷均得到有限值', (id) => {
    const config = FORMULA_BEAM_CALCULATORS[id];
    expect(config.validate(defaults(id))).toBeNull();
    const unloaded = { ...defaults(id) };
    for (const key of ['P', 'q', 'w', 'M']) if (key in unloaded) unloaded[key] = 0;
    expect(config.validate(unloaded)).toBeNull();
    expect(config.calculate(unloaded).every(row => Number.isFinite(row.value))).toBe(true);
  });

  it.each(['L', 'E', 'I'])('拒绝零/负 %s，不返回假结果', (key) => {
    const config = FORMULA_BEAM_CALCULATORS['ss-center'];
    for (const value of [0, -1, Infinity, NaN]) {
      const input = { ...defaults('ss-center'), [key]: value };
      expect(config.validate(input)).toBeTypeOf('string');
      expect(() => config.calculate(input)).toThrow(RangeError);
    }
  });

  it('区分跨内载荷位置、对称距离和不限于跨度的外伸长度', () => {
    expect(FORMULA_BEAM_CALCULATORS['ss-point'].validate({ ...defaults('ss-point'), a: 7 })).toBeTypeOf('string');
    expect(FORMULA_BEAM_CALCULATORS['ss-two-point'].validate({ ...defaults('ss-two-point'), a: 4 })).toBeTypeOf('string');
    expect(FORMULA_BEAM_CALCULATORS['ss-partial'].validate({ ...defaults('ss-partial'), a: 4, c: 3 })).toBeTypeOf('string');
    expect(FORMULA_BEAM_CALCULATORS['overhang'].validate({ ...defaults('overhang'), a: 7 })).toBeNull();
  });

  it('诊断刚度和变形计算溢出，不能显示零变形或 Infinity', () => {
    const config = FORMULA_BEAM_CALCULATORS['ss-center'];
    expect(config.validate({ ...defaults('ss-center'), E: 1e300, I: 1e300 })).toBeTypeOf('string');
    expect(config.validate({ ...defaults('ss-center'), L: 1e150 })).toBeTypeOf('string');
    expect(config.validate({ ...defaults('ss-center'), E: 1e-300, I: 1e-300 })).toBeTypeOf('string');
  });
});
