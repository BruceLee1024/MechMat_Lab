import { describe, expect, it } from 'vitest';
import { sampleConceptFlow, type ConceptFlowScene } from '../graphics/conceptFlow';

describe('概念场景的受力粒子流', () => {
  it('刚体平移、零幅度和零载荷不生成粒子', () => {
    const scenes: ConceptFlowScene[] = [
      { kind: 'strain', rigid: true, axialPercent: 1, shear: .03, tx: 20, ty: -20 },
      { kind: 'strain', rigid: false, axialPercent: 0, shear: 0, tx: 0, ty: 0 },
      { kind: 'sections', cut: 55, axial: 0, transverse: 0, isolate: true },
      ...(['axial', 'shear', 'torsion', 'bending'] as const).map(form => ({ kind: 'forms' as const, form, amount: 0 })),
    ];
    for (const scene of scenes) expect(sampleConceptFlow(scene, 1)).toEqual([]);
  });
  it('局部轴向伸长向外、缩短向内，剪应变单独控制剪切流', () => {
    for (const axialPercent of [-.6, .6]) {
      const particles = sampleConceptFlow({ kind: 'strain', rigid: false, axialPercent, shear: 0, tx: 0, ty: 0 }, 1);
      expect(particles.length).toBeGreaterThan(0);
      expect(particles.every(p => p.family === 'axial')).toBe(true);
      for (const p of particles) {
        const a = p.trail[0], b = p.trail[p.trail.length - 1];
        const centerX = 8 * (axialPercent / 100 * 50) * 2.5;
        expect(Math.sign((b[0] - a[0]) * (b[0] - centerX))).toBe(Math.sign(axialPercent));
      }
    }
  });
  it('右段隔离体的所有流线留在所选截面右侧', () => {
    for (const cut of [10, 55, 90]) {
      const particles = sampleConceptFlow({ kind: 'sections', cut, axial: 2, transverse: 2, isolate: true }, 1);
      expect(new Set(particles.map(p => p.family))).toEqual(new Set(['axial', 'shear', 'bending']));
      for (const p of particles) for (const point of p.trail) expect(point[0]).toBeGreaterThanOrEqual(-225 + 450 * cut / 100 - 1e-8);
    }
  });
  it('轴向力与横向力各自控制对应流线，不引入无关分量', () => {
    const scene = { kind: 'sections' as const, cut: 55, isolate: true };
    expect(new Set(sampleConceptFlow({ ...scene, axial: 2, transverse: 0 }, 1).map(p => p.family))).toEqual(new Set(['axial']));
    expect(new Set(sampleConceptFlow({ ...scene, axial: 0, transverse: 2 }, 1).map(p => p.family))).toEqual(new Set(['shear', 'bending']));
  });
  it('切开只截取原有场，不因隔离段缩短而压密粒子', () => {
    const scene = { kind: 'sections' as const, cut: 55, axial: 2, transverse: 2 };
    const head = (p: ReturnType<typeof sampleConceptFlow>[number]) => p.trail[p.trail.length - 1];
    const expected = sampleConceptFlow({ ...scene, isolate: false }, 1).filter(p => head(p)[0] >= 22.5).map(head);
    expect(sampleConceptFlow({ ...scene, isolate: true }, 1).map(head)).toEqual(expected);
  });
  it('弯曲两侧方向相反，中性层不生成弯曲粒子', () => {
    const scene: ConceptFlowScene = { kind: 'sections', cut: 30, axial: 0, transverse: 3, isolate: false };
    for (const p of sampleConceptFlow(scene, 1).filter(p => p.family === 'bending')) {
      const a = p.trail[0], b = p.trail[p.trail.length - 1];
      expect(Math.abs(b[1])).toBeGreaterThan(0);
      expect(Math.sign((b[0] - a[0]) * b[0])).toBe(Math.sign(b[1]));
    }
  });
  it('扭转粒子沿截面环向运动，两端方向相反', () => {
    const particles = sampleConceptFlow({ kind: 'forms', form: 'torsion', amount: .7 }, 1);
    expect(particles.length).toBeGreaterThan(0);
    for (const p of particles) {
      const a = p.trail[0], b = p.trail[p.trail.length - 1];
      expect(a[0]).toBeCloseTo(b[0]); expect(Math.hypot(a[1], a[2])).toBeCloseTo(Math.hypot(b[1], b[2]));
      expect(Math.sign(b[0] * (a[1] * b[2] - a[2] * b[1]))).toBe(1);
    }
  });
  it('各变形的粒子随时间变化，映射后坐标与亮度始终有限', () => {
    for (const form of ['axial', 'shear', 'torsion', 'bending'] as const) {
      const scene: ConceptFlowScene = { kind: 'forms', form, amount: 1 };
      expect(sampleConceptFlow(scene, 1)).not.toEqual(sampleConceptFlow(scene, 2));
      for (const p of sampleConceptFlow(scene, 1e8)) {
        expect(p.trail.flat().every(Number.isFinite)).toBe(true);
        expect(p.opacity).toBeGreaterThanOrEqual(0); expect(p.opacity).toBeLessThanOrEqual(1);
      }
    }
  });
});
