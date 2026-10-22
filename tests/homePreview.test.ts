import { describe, expect, it } from 'vitest';
import { HOME_PREVIEW, homePreviewPoint, homePreviewResult, type HomePreviewMode } from '../mechanics/homePreview';

const { length: L, diameter: d, E, nu } = HOME_PREVIEW;
describe('首页教学预览的真实读数与放大形态', () => {
 it.each(['axial','bending','torsion'] as HomePreviewMode[])('%s 零载荷恢复原始坐标', mode => {
  expect(homePreviewResult(mode, 0).stress).toBe(0);
  expect(homePreviewResult(mode, 0).displacement).toBe(0);
  expect(homePreviewPoint(mode, 0, L * .43, 17, 23)).toEqual({ x: L * .43, y: 17, z: 23 });
 });
 it('拉伸满足胡克定律与泊松收缩，并显式应用显示倍率', () => {
  const r = homePreviewResult('axial', 1), p = homePreviewPoint('axial', 1, L, d/2, 0);
  expect(r.stress).toBeCloseTo(15.915494309, 7);
  expect(r.displacement / L).toBeCloseTo(r.stress / E, 12);
  expect((p.x-L)/r.amplification).toBeCloseTo(r.displacement, 10);
  expect((p.y-d/2)/(d/2)/r.amplification).toBeCloseTo(-nu*r.stress/E, 12);
 });
 it('简支梁端部挠度为零，跨中对称且挠度与最大弯曲应力一致', () => {
  const r = homePreviewResult('bending', .7), mid = homePreviewPoint('bending', .7, L/2, 0, 0);
  expect(homePreviewPoint('bending', .7, 0, 0, 0).y).toBe(0);
  expect(homePreviewPoint('bending', .7, L, 0, 0).y).toBe(0);
  expect(-mid.y/r.amplification).toBeCloseTo(r.displacement, 10);
  expect(homePreviewPoint('bending', .7, L*.3, 0, 0).y).toBeCloseTo(homePreviewPoint('bending', .7, L*.7, 0, 0).y, 10);
  expect(r.stress).toBeCloseTo(r.load*L/4*(d/2)/r.I, 10);
 });
 it('圆轴表面剪应力与相对扭转角由同一扭矩驱动，截面保持圆形', () => {
  const r = homePreviewResult('torsion', .8), p = homePreviewPoint('torsion', .8, L, d/2, 0);
  expect(r.G).toBeCloseTo(E/(2*(1+nu)), 10);
  expect(r.stress/r.G).toBeCloseTo((d/2)*r.displacement/L, 12);
  expect(Math.hypot(p.y,p.z)).toBeCloseTo(d/2, 10);
  expect(Math.atan2(p.z,p.y)/r.amplification).toBeCloseTo(r.displacement, 12);
  expect(homePreviewPoint('torsion', .8, 0, d/2, 0)).toEqual({ x:0, y:d/2, z:0 });
 });
});
