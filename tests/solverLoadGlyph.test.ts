import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {SolverLoadGlyph} from '../solver/components/SolverLoadGlyph';
import {SIMPLY_SUPPORTED_BEAM} from '../solver/SolverTypes';
import type {SolverLoad} from '../solver/SolverTypes';
const base:SolverLoad={id:'L1',type:'point',targetType:'element',targetId:'e1',position:.5,value:10000,angle:90};
const render=(load:SolverLoad,viewScale=1)=>renderToStaticMarkup(React.createElement(SolverLoadGlyph,{load,nodes:SIMPLY_SUPPORTED_BEAM.nodes,elements:SIMPLY_SUPPORTED_BEAM.elements,viewScale,selected:false,onPointerDown:()=>{},onClick:()=>{}}));
describe('荷载符号的物理方向与显示比例',()=>{
  it('负集中力反向，零荷载不画非零力箭头',()=>{
    expect(render({...base,value:-10000})).toContain(',-1"');
    expect(render({...base,value:0})).not.toContain('marker-end');
  });
  it('均布荷载以同一全局角度表达，并区分向上与向右',()=>{
    expect(render({...base,type:'distributed',position:0,positionEnd:1,angle:0})).toContain('data-force-direction="1,0"');
    expect(render({...base,type:'distributed',position:0,positionEnd:1,angle:90,value:-2000})).toContain(',-1"');
    expect(render({...base,type:'distributed',position:.2,positionEnd:.8})).toContain('q = 10 kN/m');
  });
  it('缩小十倍时文字与力箭头仍保持屏幕尺寸，作用点不变',()=>{
    expect(render(base,.1)).toContain('font-size="110"');
    expect(render(base)).toContain('font-size="11"');
    expect(render(base,.1)).toContain('x2="300');
  });
});
