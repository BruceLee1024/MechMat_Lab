import { describe, expect, it } from 'vitest';
import { deformSpecimen, planeDrag, projectConcept, strainPoint, type Vec3 } from '../graphics/conceptGeometry';

describe('教学三维几何与拖动', () => {
  it('三维和正视相机将拖动正确还原到单元平面，俯视不伪造竖向位移', () => {
    for (const view of ['3d', 'front'] as const) for (const yaw of [-.45, .2, .8]) {
      const d = projectConcept([12, -8, 0], view, yaw).map(v => v * .72) as [number, number];
      const restored = planeDrag(d, view, yaw, .72)!;
      expect(restored[0]).toBeCloseTo(12); expect(restored[1]).toBeCloseTo(-8);
    }
    expect(planeDrag([12, 8], 'top', .2, 1)).toBeNull();
  });
  it('零幅度下四种变形均恢复原始实体', () => {
    const p: Vec3 = [132, 24, -37];
    for (const form of ['axial', 'shear', 'torsion', 'bending'] as const) {
      const q = deformSpecimen(p, form, 0); q.forEach((v, i) => expect(v).toBeCloseTo(p[i]));
    }
  });
  it('扭转保持每个截面距离，弯曲截面垂直于轴线切向', () => {
    const t = deformSpecimen([225, 30, 40], 'torsion', 1);
    expect(t[0]).toBe(225); expect(Math.hypot(t[1], t[2])).toBeCloseTo(50);
    const x = 130, slope = 130 * x / (225 * 225);
    const a = deformSpecimen([x, 40, 0], 'bending', 1), b = deformSpecimen([x, -40, 0], 'bending', 1);
    expect((a[0] - b[0]) + slope * (a[1] - b[1])).toBeCloseTo(0);
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeCloseTo(80);
  });
  it('单元变形沿用真实位移场的八倍放大，刚体平移不放大', () => {
    const p = strainPoint([100, 100, 18], false, .006, .02, 12, 8);
    expect(p[0]).toBeCloseTo((100 + 8 * (.6 + 2) - 50) * 2.5);
    expect(p[1]).toBe(125);
    const rigid = strainPoint([100, 100, 18], true, .006, .02, 12, 8);
    expect(rigid).toEqual([155, 145, 18]);
  });
});
