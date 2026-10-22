import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {LatexRenderer} from '../components';

describe('公式阅读与可访问性',()=>{
  it('首次渲染即显示分式，并保留 MathML 供阅读器读取',()=>{
    const html=renderToStaticMarkup(React.createElement(LatexRenderer,{formula:String.raw`P_{cr}=\frac{\pi^2EI}{L^2}`}));
    expect(html).toContain('class="katex"');expect(html).toContain('<math');expect(html).toContain('<mfrac>');
    expect(html).toContain('math-renderer');
  });
  it('错误公式使用中文提示和转义后的源码，不作为 HTML 注入',()=>{
    const html=renderToStaticMarkup(React.createElement(LatexRenderer,{formula:String.raw`\frac{<img src=x onerror=alert(1)>}`}));
    expect(html).toContain('公式暂无法排版');expect(html).toContain('&lt;img');expect(html).not.toContain('<img');
  });
  it('空公式没有残留内容，放大功能按场景显式开启',()=>{
    expect(renderToStaticMarkup(React.createElement(LatexRenderer,{formula:''}))).toBe('');
    const formula=String.raw`\sigma=\frac{N}{A}`;
    const normal=renderToStaticMarkup(React.createElement(LatexRenderer,{formula}));
    expect(normal).not.toContain('<button');
    const expanded=renderToStaticMarkup(React.createElement(LatexRenderer,{formula,label:'截面正应力',expandable:true}));
    expect(expanded).toContain('放大公式：截面正应力');
  });
  it('说明性下标用正体，坐标及变量下标仍保留数学斜体',()=>{
    const html=renderToStaticMarkup(React.createElement(LatexRenderer,{formula:String.raw`P_{cr}=I_{min}+\sigma_{true}+I_y`}));
    expect(html).toContain(String.raw`P_{\mathrm{cr}}`);
    expect(html).toContain(String.raw`I_{\mathrm{min}}`);
    expect(html).toContain(String.raw`\sigma_{\mathrm{true}}`);
    expect(html).toContain('I_y');
  });
});
