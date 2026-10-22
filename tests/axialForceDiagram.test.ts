import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AxialForceDiagram } from '../components/AxialForceDiagram';

it('超出破坏参考点不画成贯通全杆的静力解，也不伪造零承载力', () => {
  const html = renderToStaticMarkup(React.createElement(AxialForceDiagram, { force: 21000, lengthMm: 1000, failureTeaching: true }));
  expect(html).toContain('无有效静力解');
  expect(html).not.toContain('沿杆长恒定');
  expect(html).not.toContain('<svg');
  expect(html).toContain('21.00');
});
it('有效均匀直杆仍展示由端力确定的常轴力图', () => {
  const html = renderToStaticMarkup(React.createElement(AxialForceDiagram, { force: 5000, lengthMm: 1000 }));
  expect(html).toContain('沿杆长恒定');
  expect(html).toContain('5.000 kN');
});
