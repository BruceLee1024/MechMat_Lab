import { describe, expect, it } from 'vitest';
import { calculateAxial, calculateAxialTeaching, calculateBending, calculateBuckling, calculatePlaneStress, calculateTorsion } from '../mechanics/calculations';
import { evaluateSection } from '../mechanics/sections';
import { updateSimulationState } from '../mechanics/simulationState';
import { parseNumericInput, validateNumber, CalculationResult } from '../mechanics/validation';
import { kNToN, mToMm, gPaToMPa, nmToNmm, nmmToNm, mjToJ } from '../mechanics/units';
import { DEFAULT_STATE } from '../types';

function values<T>(result: CalculationResult<T>): T {
  if (result.ok === false) throw new Error(JSON.stringify(result.diagnostics));
  return result.values;
}

describe('单位与输入边界', () => {
  it('正确转换物理量，弯矩与能量不混淆', () => {
    expect([kNToN(1), mToMm(1), gPaToMPa(1), nmToNmm(1)]).toEqual([1000, 1000, 1000, 1000]);
    expect(nmmToNm(250000)).toBe(250);
    expect(mjToJ(625)).toBe(0.625);
  });
  it.each(['', ' ', '-', '.', '1e', '1e-', '1x', '0x10', 'Infinity', '1e400'])('草稿 %s 不能提交', text => {
    expect(parseNumericInput(text)).toBeNull();
  });
  it('十进制科学计数法与负数可解析', () => {
    expect(parseNumericInput('-2.5e2')).toBe(-250);
    expect(parseNumericInput('+.5')).toBe(0.5);
  });
  it('区分零载荷、正尺寸和带符号参数', () => {
    expect(validateNumber(0, { domain: 'nonnegative' })).toBeNull();
    expect(validateNumber(0)).not.toBeNull();
    expect(validateNumber(-25, { domain: 'signed' })).toBeNull();
    expect(validateNumber(2, { domain: 'nonnegative', maximum: 1 })).not.toBeNull();
  });
  it('缩短梁长时限制两个模块的载荷位置，拒绝无效状态', () => {
    const next = updateSimulationState(DEFAULT_STATE, { bendLength: 0.5, bendTorqueLength: 0.25 });
    expect(next.bendLoadPos).toBe(0.5);
    expect(next.bendTorqueBendPos).toBe(0.25);
    expect(DEFAULT_STATE.bendLength).toBe(2);
    expect(updateSimulationState(next, { bendLength: 0 })).toBe(next);
    expect(updateSimulationState(next, { stressSigX: NaN })).toBe(next);
    expect(updateSimulationState(next, { poissonRatio: 0 }).poissonRatio).toBe(0);
  });
});

describe('独立解析参考值', () => {
  it('拉伸：5 kN、100 mm²、1 m、200 GPa', () => {
    const r = values(calculateAxial({ force: 5000, area: 100, length: 1, modulus: 200 }));
    expect(r.stress).toBe(50);
    expect(r.strain).toBe(0.00025);
    expect(r.deformation).toBe(0.25);
    expect(r.totalStrainEnergyJ).toBe(0.625);
  });
  it('零载荷各模块结果有限且为零', () => {
    expect(values(calculateAxial({ force: 0, area: 100, length: 1, modulus: 200 })).totalStrainEnergyJ).toBe(0);
    expect(values(calculateBending({ load: 0, length: 2, position: 1, modulus: 200, section: { type: 'rectangle', width: 100, height: 200 } })).deflectionAtLoad).toBe(0);
    expect(values(calculateTorsion({ torque: 0, radius: 10, length: 1, modulus: 80, loadRatio: 0.6 })).phi_total_rad).toBe(0);
  });
  it('教学塑性状态明确标记，计算模型不冒充实测曲线', () => {
    const r = calculateAxialTeaching({ force: 30000, area: 100, length: 1, modulus: 200, yieldStrength: 250 });
    expect(values(r).isPlastic).toBe(true);
    if (r.ok === true) expect(r.warnings.join()).toContain('停止显示线弹性应变能');
  });
  it('简支梁跨中集中力：1000 N、2 m、100×200 mm、200 GPa', () => {
    const r = values(calculateBending({ load: 1000, length: 2, position: 1, modulus: 200, section: { type: 'rectangle', width: 100, height: 200 } }));
    expect(r.R1).toBe(500); expect(r.R2).toBe(500);
    expect(r.momentNmm).toBe(500000); expect(r.maxMoment).toBe(500);
    expect(r.maxStress).toBeCloseTo(0.75, 10);
    expect(r.deflectionAtLoad).toBeCloseTo(0.0125, 10);
    expect(r.strainEnergy).toBeCloseTo(6.25, 10);
  });
  it('偏置载荷反力平衡，支座端点不产生弯曲', () => {
    const input = { load: 1000, length: 2, position: 0.5, modulus: 200, section: { type: 'rectangle' as const, width: 100, height: 200 } };
    const r = values(calculateBending(input));
    expect(r.R1).toBe(750); expect(r.R2).toBe(250); expect(r.R1 + r.R2).toBe(1000);
    for (const position of [0, 2]) {
      const endpoint = values(calculateBending({ ...input, position }));
      expect(endpoint.deflectionAtLoad).toBe(0); expect(endpoint.maxStress).toBe(0);
    }
  });
  it('矩形高度翻倍：惯性矩八倍，应力四分之一，挠度八分之一', () => {
    const input = { load: 1000, length: 2, position: 1, modulus: 200, section: { type: 'rectangle' as const, width: 100, height: 100 } };
    const a = values(calculateBending(input));
    const b = values(calculateBending({ ...input, section: { ...input.section, height: 200 } }));
    expect(b.inertia / a.inertia).toBe(8); expect(a.maxStress / b.maxStress).toBe(4); expect(a.deflectionAtLoad / b.deflectionAtLoad).toBe(8);
  });
  it('圆轴全长传递 1 N·m：r=10 mm、L=1 m、G=80 GPa', () => {
    const r = values(calculateTorsion({ torque: 1, radius: 10, length: 1, modulus: 80, loadRatio: 0 }));
    expect(r.Ip).toBeCloseTo(15707.963267948966, 7);
    expect(r.maxShear).toBeCloseTo(0.6366197723675814, 10);
    expect(r.phi_total_rad).toBeCloseTo(0.0007957747154594767, 12);
    expect(r.U_total_J).toBeCloseTo(0.0003978873577297383, 12);
    const split = values(calculateTorsion({ torque: 1, radius: 10, length: 1, modulus: 80, loadRatio: 1 }));
    expect(split.phi_total_rad).toBeCloseTo(r.phi_total_rad / 2, 12);
  });
  it('圆截面铰支压杆临界载荷与长度平方反比', () => {
    const input = { load: 1000, length: 1, modulus: 200, section: { type: 'circle' as const, radius: 10 } };
    const r = values(calculateBuckling(input));
    expect(r.Pcr).toBeCloseTo(15503.138340149908, 6);
    expect(values(calculateBuckling({ ...input, length: 2 })).Pcr).toBeCloseTo(r.Pcr / 4, 8);
  });
  it('純剪切：±30 MPa 主应力，45° 平面切应力为零', () => {
    const r = values(calculatePlaneStress({ sigmaX: 0, sigmaY: 0, tauXY: 30, angle: 45 }));
    expect(r.sig1).toBe(30); expect(r.sig2).toBe(-30); expect(r.maxShear).toBe(30);
    expect(r.sigX_prime).toBeCloseTo(30, 10); expect(r.tauXY_prime).toBeCloseTo(0, 10);
  });
  it('旋转前后应力迹和行列式保持不变', () => {
    const r = values(calculatePlaneStress({ sigmaX: -50, sigmaY: 20, tauXY: 30, angle: 37 }));
    expect(r.sigX_prime + r.sigY_prime).toBeCloseTo(-30, 10);
    expect(r.sigX_prime * r.sigY_prime - r.tauXY_prime ** 2).toBeCloseTo(-1900, 8);
  });
  it('基础截面解析几何量', () => {
    const rect = values(evaluateSection({ type: 'rectangle', width: 10, height: 20 }));
    expect(rect.area).toBe(200); expect(rect.Iz).toBeCloseTo(6666.666666666667, 8);
    const circle = values(evaluateSection({ type: 'circle', radius: 10 }));
    expect(circle.area).toBeCloseTo(314.1592653589793, 8); expect(circle.Iz).toBeCloseTo(7853.981633974483, 7);
    const hollow = values(evaluateSection({ type: 'hollow_circle', outerRadius: 10, innerRadius: 5 }));
    expect(hollow.area).toBeCloseTo(235.61944901923448, 8); expect(hollow.Iz).toBeCloseTo(7363.107781851078, 7);
    expect(values(evaluateSection({ type: 'hollow_circle', outerRadius: 10, innerRadius: 0 }))).toEqual(circle);
  });
  it('错误尺寸、越界位置、非有限数与溢出返回诊断', () => {
    expect(calculateAxial({ force: 1, area: 0, length: 1, modulus: 200 }).ok).toBe(false);
    expect(calculateBending({ load: 1, length: 1, position: 2, modulus: 200, section: { type: 'rectangle' } }).ok).toBe(false);
    expect(evaluateSection({ type: 'hollow_circle', outerRadius: 10, innerRadius: 10 }).ok).toBe(false);
    expect(evaluateSection({ type: 'rectangle', width: -10, height: 20 }).ok).toBe(false);
    expect(calculatePlaneStress({ sigmaX: Infinity, sigmaY: 0, tauXY: 0, angle: 0 }).ok).toBe(false);
    expect(calculateAxial({ force: 1e300, area: 1, length: 1, modulus: 1 }).ok).toBe(false);
  });
});
