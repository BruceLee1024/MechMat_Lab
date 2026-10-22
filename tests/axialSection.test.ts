import { describe, expect, it } from 'vitest';
import { axialSectionPlane } from '../graphics/axialSection';

describe('轴向试件斜截面的几何一致性', () => {
  it.each([0, 30, 45, 89.999, 90])('%s° 的截面留在试件内，且符合应力分解使用的法向', angle => {
    const plane = axialSectionPlane(200, 60, angle), radians = angle * Math.PI / 180;
    for (const [x, y, z] of plane) {
      expect([x, y, z].every(Number.isFinite)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(200);
      expect(Math.abs(y)).toBeLessThanOrEqual(60);
      expect(Math.abs(z)).toBe(60);
      expect(x * Math.cos(radians) + y * Math.sin(radians)).toBeCloseTo(0, 8);
    }
  });
  it('两种极限截面分别垂直及平行于杆轴，均保持非零面积', () => {
    expect(axialSectionPlane(200, 60, 0)).toEqual([[0,-60,-60],[-0,60,-60],[-0,60,60],[0,-60,60]]);
    const parallel = axialSectionPlane(200, 60, 90);
    expect(parallel[0][0] - parallel[1][0]).toBe(400);
    expect(parallel[3][2] - parallel[0][2]).toBe(120);
    expect(Math.abs(parallel[0][1])).toBeLessThan(1e-10);
  });
});
