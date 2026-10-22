import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SolverTrussResults } from '../components/SolverTrussResults';
import { SIMPLE_TRUSS, SIMPLY_SUPPORTED_BEAM, SOLVER_TEMPLATES, DEFAULT_SOLVER_STATE } from '../solver/SolverTypes';
import { solveUnified } from '../solver/UnifiedSolver';
import { DiagramPanel } from '../solver/components/DiagramPanel';

describe('桁架结果与真实杆力、节点位移对应', () => {
  it('显示拉压杆力和全局节点位移，不按杆件顺序拼接梁图', () => {
    const r = solveUnified(SIMPLE_TRUSS.nodes, SIMPLE_TRUSS.elements, SIMPLE_TRUSS.loads);
    expect(r.success).toBe(true);
    const html = renderToStaticMarkup(React.createElement(SolverTrussResults, {result: r}));
    expect(html).toContain('3750.0 N · 拉');
    expect(html).toContain('-6250.0 N · 压');
    expect(html).toContain(r.nodes[2].displacement.dy.toFixed(4));
    expect(html).toContain('横向剪力与弯矩为零');
    expect(html).not.toContain('挠度图');
  });
  it('零载荷显示零杆与零位移，比例条不出现无穷值', () => {
    const r = solveUnified(SIMPLE_TRUSS.nodes, SIMPLE_TRUSS.elements, SIMPLE_TRUSS.loads.map(l => ({...l, value: 0})));
    const html = renderToStaticMarkup(React.createElement(SolverTrussResults, {result: r}));
    expect(r.success).toBe(true);
    expect(html).toContain('0.0 N · 零杆');
    expect(html).not.toMatch(/NaN|Infinity/);
  });
});

describe('梁图表使用计算曲线与真实截面', () => {
  it('梁模板的 A 和 I 与标注矩形宽高一致', () => {
    for (const template of SOLVER_TEMPLATES) for (const e of template.elements) if(e.type==='beam') {
      expect(e.section.A).toBeCloseTo(e.section.width*e.section.height,8);
      expect(e.section.I).toBeCloseTo(e.section.width*e.section.height**3/12,6);
    }
  });
  it('缺失详细曲线时给出不可用说明，不能伪造零挠度', () => {
    const t=SIMPLY_SUPPORTED_BEAM,result=solveUnified(t.nodes,t.elements,t.loads);
    for(const e of result.elements)delete e.deflectionCurve;
    const html=renderToStaticMarkup(React.createElement(DiagramPanel,{state:{...DEFAULT_SOLVER_STATE,...t,result},diagramType:'deflection'}));
    expect(html).toContain('未提供完整竖向挠曲线');expect(html).not.toContain('0.0001 mm');
  });
  it('零载荷的曲线与读数都为零，不把缩放下限当作计算值', () => {
    const t=SIMPLY_SUPPORTED_BEAM,result=solveUnified(t.nodes,t.elements,t.loads.map(l=>({...l,value:0})));
    const html=renderToStaticMarkup(React.createElement(DiagramPanel,{state:{...DEFAULT_SOLVER_STATE,...t,result},diagramType:'deflection'}));
    expect(html).toContain('0.0000');expect(html).not.toMatch(/NaN|Infinity|0\.0001/);
  });
});
