import { describe, expect, it } from 'vitest';
import { sampleStressFlow } from '../graphics/stressFlow';

describe('单轴应力粒子示意', () => {
  it('卸载或无效应力不产生粒子', () => {
    for (const stress of [0, NaN, Infinity, -Infinity]) expect(sampleStressFlow(stress, 1)).toEqual([]);
  });
  it('拉伸向两端、压缩向内，两侧始终成对平衡', () => {
    for (const stress of [200, -200]) {
      const particles = sampleStressFlow(stress, 1);
      expect(particles.length).toBeGreaterThan(0);
      expect(particles.filter(p => p.position[0] < 0).length).toBe(particles.length / 2);
      for (const p of particles) expect(Math.sign(p.direction * p.position[0])).toBe(Math.sign(stress));
    }
  });
  it('应力大小增加只改变示意密度，不改变材料尺寸或传播速度', () => {
    expect(sampleStressFlow(300, 1).length).toBeGreaterThan(sampleStressFlow(30, 1).length);
    expect(Math.max(...sampleStressFlow(1e-6, 1).map(p => p.opacity))).toBeLessThan(.001);
    const a = sampleStressFlow(100, 1)[0], b = sampleStressFlow(100, 1.1)[0];
    const c = sampleStressFlow(300, 1)[0], d = sampleStressFlow(300, 1.1)[0];
    expect(b.position[0] - a.position[0]).toBeCloseTo(d.position[0] - c.position[0]);
  });
  it('持续流动的粒子与拖尾都留在试件内部，极值保持有限', () => {
    for (const stress of [1e-6, -1e-6, 500, -500, Number.MAX_VALUE]) for (const time of [0, 1, 6.24, 6.26, 1e8]) {
      for (const particle of sampleStressFlow(stress, time)) {
        for (const value of [...particle.position, ...particle.tail]) { expect(Number.isFinite(value)).toBe(true); expect(Math.abs(value)).toBeLessThan(1); }
        expect(particle.opacity).toBeGreaterThanOrEqual(0); expect(particle.opacity).toBeLessThanOrEqual(1);
      }
    }
  });
});
