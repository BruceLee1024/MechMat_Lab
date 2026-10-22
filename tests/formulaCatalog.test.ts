import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import katex from 'katex';
import {describe,it,expect} from 'vitest';
import {FORMULA_STUDIES} from '../mechanics/formulaStudies';
import {FORMULA_REFERENCE_ENTRIES,FormulasModule} from '../modules/FormulasModule';

describe('公式工作台目录完整性',()=>{
  it('保留三类全部 49 个条目，梁与拱均有计算器和受力图',()=>{
    const entries=FORMULA_REFERENCE_ENTRIES;
    expect(entries).toHaveLength(49);
    expect(new Set(entries.map(e=>`${e.kind}:${e.id}`)).size).toBe(49);
    expect(entries.filter(e=>e.kind==='basic')).toHaveLength(20);
    expect(entries.filter(e=>e.kind==='section')).toHaveLength(4);
    for(const entry of entries.filter(e=>e.kind==='beam')){
      expect(entry.calculator).toBeDefined();expect(entry.diagrams?.fbd).toBeDefined();
      const values=Object.fromEntries(entry.calculator!.inputs.map(input=>[input.key,input.default]));
      expect(entry.calculator!.validate(values)).toBeNull();
    }
  });
  it('49 个目录条目均有对应计算模型，不再回退到纯文字说明',()=>{
    for(const e of FORMULA_REFERENCE_ENTRIES){const model=e.kind==='beam'?e.calculator:e.kind==='basic'&&['stress-basic','axial-deform','strain-energy'].includes(e.id)?true:FORMULA_STUDIES[e.kind==='section'?`section:${e.id}`:e.id];expect(model,`${e.kind}:${e.id}`).toBeTruthy();}
  });
  it('所有公式可排版且不残留失效公式占位',()=>{
    for(const entry of FORMULA_REFERENCE_ENTRIES)for(const formula of entry.formulas){
      expect(()=>katex.renderToString(formula.formula,{throwOnError:true,strict:false,trust:false})).not.toThrow();
    }
    const html=renderToStaticMarkup(React.createElement(FormulasModule));
    expect(html).toContain('公式知识目录');expect(html).toContain('正应力详情');
    expect(html).toContain('符号说明');expect(html).toContain('适用条件');expect(html).not.toContain('公式暂无法排版');
  });
});
