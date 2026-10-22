import { describe, expect, it } from 'vitest';
import { buildSpecimenSurface, conceptViewDirection, dot } from '../graphics/conceptSurface';
import { deformSpecimen, projectConcept, type Vec3 } from '../graphics/conceptGeometry';
const ring = (x: number): Vec3[] => [[x, -48, 48], [x, 48, 48], [x, 48, -48], [x, -48, -48]];

describe('曲面遮挡与投影一致性', () => {
  it('观察方向沿投影核，不会把前后表面判断反向', () => {
    for (const view of ['3d', 'front', 'top'] as const) for (const yaw of [-.45, .2, .8]) {
      const direction = conceptViewDirection(view, yaw);
      const p = projectConcept(direction, view, yaw);
      expect(p[0]).toBeCloseTo(0); expect(p[1]).toBeCloseTo(0);
      expect(Math.hypot(...direction)).toBeCloseTo(1);
      if (view !== 'front') expect(direction[1]).toBeGreaterThan(0);
    }
  });
  it('封闭杆的侧面与两端外法线方向正确，正视只显示朝向观察者的面', () => {
    const patches = buildSpecimenSurface([ring(-225), ring(225)]);
    const expected: Vec3[] = [[0, 0, 1], [0, 1, 0], [0, 0, -1], [0, -1, 0], [-1, 0, 0], [1, 0, 0]];
    for (const patch of patches) expect(dot(patch.normal, expected[patch.side])).toBeCloseTo(1);
    const front = patches.filter(p => dot(p.normal, conceptViewDirection('front', .2)) > 1e-5);
    expect(new Set(front.map(p => p.side))).toEqual(new Set([0]));
    const perspective = patches.filter(p => dot(p.normal, conceptViewDirection('3d', .2)) > 1e-5);
    expect(new Set(perspective.map(p => p.side))).toEqual(new Set([1, 2, 5]));
  });
  it('扭转从零截面跨入正转角时，掠射的顶面不会整片误判为背面', () => {
    const patches = buildSpecimenSurface([ring(0), ring(9.375)].map(r => r.map(p => deformSpecimen(p, 'torsion', 1))), 4);
    for (const patch of patches.filter(p => p.side === 1)) expect(dot(patch.normal, [0, 0, 1])).toBeGreaterThan(0);
  });
  it('所有变形在零幅度和最大幅度下的曲面保持有限且有单位法线', () => {
    for (const form of ['axial', 'shear', 'torsion', 'bending'] as const) for (const amount of [0, 1]) {
      const rings = Array.from({ length: 49 }, (_, i) => ring(-225 + i * 450 / 48).map(p => deformSpecimen(p, form, amount)));
      for (const patch of buildSpecimenSurface(rings, 4)) {
        expect(Math.hypot(...patch.normal)).toBeCloseTo(1);
        expect(patch.points.flat().every(Number.isFinite)).toBe(true);
      }
    }
  });
});
