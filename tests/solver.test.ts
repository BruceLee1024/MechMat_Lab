import { describe, expect, it } from 'vitest';
import { solveUnified } from '../solver/UnifiedSolver';
import { calculateElementStress } from '../solver/StressCalculator';
import type { SolverNode, SolverElement, SolverLoad } from '../solver/SolverTypes';

function beam() {
  const nodes: SolverNode[] = [
    { id: 'a', x: 0, y: 0, support: 'pinned', fixedDOF: { dx: true, dy: true, rz: false } },
    { id: 'b', x: 1000, y: 0, support: 'roller', fixedDOF: { dx: false, dy: true, rz: false } },
  ];
  const elements: SolverElement[] = [{ id: 'e', type: 'beam', nodeStart: 'a', nodeEnd: 'b', section: { A: 1000, I: 1e6, width: 50, height: 20 }, material: { E: 200000, G: 77000, yield: 250 } }];
  const loads: SolverLoad[] = [{ id: 'p', type: 'point', targetType: 'element', targetId: 'e', position: 0.5, value: 1000, angle: 90 }];
  return { nodes, elements, loads };
}

describe('生产统一求解入口', () => {
  it('简支梁支反力、内力、应力和能量符合解析结果', () => {
    const m = beam(), result = solveUnified(m.nodes, m.elements, m.loads);
    expect(result.success).toBe(true);
    expect(result.nodes[0].reaction?.Fy).toBeCloseTo(-500, 8);
    expect(result.nodes[1].reaction?.Fy).toBeCloseTo(-500, 8);
    expect(Math.max(...result.elements[0].internalForces.map(f => f.M))).toBeCloseTo(250000, 2);
    expect(result.elements[0].maxStress).toBeCloseTo(2.5, 6);
    expect(result.totalStrainEnergy).toBeCloseTo(52.083333333333336, 4); // U=P²L³/(96EI)
    expect(result.elements[0].stressDistribution.length).toBeGreaterThan(0);
  });
  it.each([90, -90])('解析与矩阵路径采用同一全局反力符号，荷载方向 %s°', angle => {
    const m = beam(); m.loads[0].angle = angle;
    const analytical = solveUnified(m.nodes, m.elements, m.loads);
    const matrix = solveUnified(m.nodes, m.elements, [{ ...m.loads[0], value: 500 }, { ...m.loads[0], id: 'p2', value: 500 }]);
    const appliedY = 1000 * Math.sin(angle * Math.PI / 180);
    expect(analytical.success && matrix.success).toBe(true);
    expect(analytical.nodes.reduce((sum, n) => sum + (n.reaction?.Fy ?? 0), appliedY)).toBeCloseTo(0, 8);
    analytical.nodes.forEach((n, i) => expect(n.reaction?.Fy).toBeCloseTo(matrix.nodes[i].reaction?.Fy!, 6));
  });
  it('向上均布荷载的反力与弯矩不能沿用向下方向', () => {
    const m = beam(); m.loads[0] = { ...m.loads[0], type: 'distributed', value: 1000, angle: -90 };
    const r = solveUnified(m.nodes, m.elements, m.loads);
    expect(r.nodes[0].reaction?.Fy).toBeCloseTo(500, 8);
    for (const f of r.elements[0].internalForces) {
      const x = f.position * 1000;
      expect(f.M).toBeCloseTo(-x * (1000 - x) / 2, 5);
    }
  });
  it('斜向集中力保留水平分量，不误入纯竖向解析模型', () => {
    const m = beam(); m.loads[0].angle = 45;
    const r = solveUnified(m.nodes, m.elements, m.loads);
    expect(r.success).toBe(true);
    expect(r.nodes.reduce((sum, n) => sum + (n.reaction?.Fx ?? 0), 1000 / Math.sqrt(2))).toBeCloseTo(0, 6);
  });
  it('简支梁节点位移为零，但跨内挠度不能画成零直线', () => {
    const m = beam(), r = solveUnified(m.nodes, m.elements, m.loads);
    const curve = r.elements[0].deflectionCurve!;
    expect(r.nodes.every(n => n.displacement.dy === 0)).toBe(true);
    expect(curve.find(p => p.position === .5)!.dy).toBeCloseTo(1000 * 1000 ** 3 / (48 * 200000 * 1e6), 8);
    const matrix = solveUnified(m.nodes, m.elements, [{...m.loads[0],value:500},{...m.loads[0],id:'p2',value:500}]);
    expect(matrix.elements[0].deflectionCurve!.find(p => p.position === .5)!.dy).toBeCloseTo(curve.find(p => p.position === .5)!.dy, 8);
  });
  it('均布荷载挠曲线满足端位移，采样积分误差小于0.3%，反向载荷反向挠曲', () => {
    const m = beam();m.loads[0]={...m.loads[0],type:'distributed',value:1000,angle:-90};
    const curve=solveUnified(m.nodes,m.elements,m.loads).elements[0].deflectionCurve!;
    const expected=-5 * 1 * 1000 ** 4 / (384 * 200000 * 1e6);
    expect(Math.abs(curve.find(p=>p.position===.5)!.dy/expected-1)).toBeLessThan(.003);
    expect(curve[0].dy).toBe(0);expect(curve.at(-1)!.dy).toBeCloseTo(0,10);
  });
  it('右端固定的悬臂不套用左端固定公式', () => {
    const m = beam();
    m.nodes[0].support = 'none'; m.nodes[0].fixedDOF = {dx:false,dy:false,rz:false};
    m.nodes[1].support = 'fixed'; m.nodes[1].fixedDOF = {dx:true,dy:true,rz:true};
    m.loads[0].position = 0;
    const r = solveUnified(m.nodes, m.elements, m.loads);
    expect(r.success).toBe(true);
    expect(r.nodes[1].reaction?.Fy).toBeCloseTo(-1000, 6);
    expect(r.nodes[1].reaction?.Mz).toBeCloseTo(1000000, 5);
    expect(r.nodes[0].displacement.dy).toBeCloseTo(1000 * 1000 ** 3 / (3 * 200000 * 1e6), 8);
  });
  it('悬臂梁端部集中力：位移、固定端弯矩与应变能', () => {
    const m = beam();
    m.nodes[0].support = 'fixed'; m.nodes[0].fixedDOF.rz = true;
    m.nodes[1].support = 'none'; m.nodes[1].fixedDOF.dy = false;
    m.loads[0].position = 1;
    const r = solveUnified(m.nodes, m.elements, m.loads);
    expect(r.success).toBe(true);
    expect(Math.abs(r.nodes[0].reaction?.Mz ?? 0)).toBeCloseTo(1000000, 6);
    expect(Math.abs(r.nodes[1].displacement.dy)).toBeCloseTo(1.6666666666666667, 9);
    expect(r.totalStrainEnergy).toBeCloseTo(833.3333333333334, 5);
  });
  it('矩阵路径叠加两个半载荷时与解析路径一致', () => {
    const m = beam(); m.loads[0].value = 500;
    m.loads.push({ ...m.loads[0], id: 'p2' });
    const r = solveUnified(m.nodes, m.elements, m.loads);
    expect(r.success).toBe(true);
    expect(Math.abs(r.nodes[0].reaction?.Fy ?? 0)).toBeCloseTo(500, 5);
    expect(r.elements[0].maxStress).toBeCloseTo(2.5, 4);
  });
  it('矩形截面真实应力指标由 N、V、M 推导', () => {
    const r = calculateElementStress([{ position: 0.5, N: 10000, V: 2000, M: 500000 }], 1000, 1e6, 50, 20, 250);
    expect(r.maxStress).toBe(15); expect(r.minStress).toBe(5);
    expect(r.maxVonMises).toBe(15); expect(r.safetyFactor).toBeCloseTo(250 / 15, 9);
  });
  it.each(['zero-length', 'missing-node', 'negative-area', 'nan-load', 'outside-load', 'no-support'] as const)('拒绝无效模型 %s', problem => {
    const m = beam();
    if (problem === 'zero-length') m.nodes[1].x = 0;
    if (problem === 'missing-node') m.elements[0].nodeEnd = 'missing';
    if (problem === 'negative-area') m.elements[0].section.A = -1;
    if (problem === 'nan-load') m.loads[0].value = NaN;
    if (problem === 'outside-load') m.loads[0].position = 1.1;
    if (problem === 'no-support') m.nodes.forEach(n => { n.support = 'none'; n.fixedDOF = { dx: false, dy: false, rz: false }; });
    expect(solveUnified(m.nodes, m.elements, m.loads).success).toBe(false);
  });
  it('有支座但仍为机构时返回奇异诊断', () => {
    const m = beam();
    m.nodes.forEach(n => { n.support = 'roller'; n.fixedDOF = { dx: false, dy: true, rz: false }; });
    m.loads.push({ ...m.loads[0], id: 'p2' });
    expect(solveUnified(m.nodes, m.elements, m.loads).success).toBe(false);
  });
});
