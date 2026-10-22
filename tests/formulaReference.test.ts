import {describe,it,expect} from 'vitest';
import {filterFormulaReferences,parseFormulaSymbols,formulaReferenceSymbols,formulaReferenceScope,type FormulaReferenceRecord} from '../mechanics/formulaReference';
const entries:FormulaReferenceRecord[]=[
  {id:'s',kind:'basic',name:'正应力',group:'应力与应变',params:'σ-正应力 N-轴力 A-截面积',formulas:[{label:'正应力定义',formula:String.raw`\sigma=\frac{N}{A}`}]},
  {id:'b',kind:'beam',name:'均布载荷',group:'简支梁',formulas:[{label:'最大挠度',formula:String.raw`\delta=\frac{5qL^4}{384EI}`}]},
  {id:'c',kind:'section',name:'矩形',group:'基本截面',formulas:[{label:'Ix',formula:String.raw`I_x=\frac{bh^3}{12}`}]},
];
describe('公式工作台检索与符号说明',()=>{
  it('组合检索名称、分类和公式正文，支持大小写与数学下标',()=>{
    expect(filterFormulaReferences(entries,{query:'简支 均布'}).map(f=>f.id)).toEqual(['b']);
    expect(filterFormulaReferences(entries,{query:'I_X'}).map(f=>f.id)).toEqual(['c']);
    expect(filterFormulaReferences(entries,{query:'σ'}).map(f=>f.id)).toEqual(['s']);
    expect(filterFormulaReferences(entries,{query:'sigma'}).map(f=>f.id)).toEqual(['s']);
    expect(filterFormulaReferences(entries,{query:'轴力'}).map(f=>f.id)).toEqual(['s']);
  });
  it('分类筛选和搜索叠加，空结果不返回无关条目',()=>{
    expect(filterFormulaReferences(entries,{kind:'beam'}).map(f=>f.id)).toEqual(['b']);
    expect(filterFormulaReferences(entries,{group:'应力与应变'}).map(f=>f.id)).toEqual(['s']);
    expect(filterFormulaReferences(entries,{kind:'beam',query:'矩形'})).toEqual([]);
    expect(filterFormulaReferences(entries,{query:'  '})).toHaveLength(3);
  });
  it('梁符号不把 frac 和 max 等排版指令误识别成尺寸',()=>{
    const symbols=formulaReferenceSymbols(entries[1]).map(s=>s.symbol);
    expect(symbols).toEqual(['q','L','E','I','δ']);
  });
  it('带负号的符号与带空格的描述不被截断，说明不混入下一个符号',()=>{
    expect(parseFormulaSymbols('σ-1-对称循环疲劳极限 σeq-等效应力(von Mises应力) τxy-剪应力分量')).toEqual([
      {symbol:'σ-1',description:'对称循环疲劳极限'},
      {symbol:'σeq',description:'等效应力(von Mises应力)'},
      {symbol:'τxy',description:'剪应力分量'},
    ]);
    expect(parseFormulaSymbols('')).toEqual([]);
  });
  it('拱明确局部剪力和参考梁内力，不套用直梁适用说明',()=>{
    const entry:FormulaReferenceRecord={...entries[1],id:'arch-half-uniform',group:'三铰拱'};
    expect(formulaReferenceSymbols(entry).map(s=>s.symbol)).toEqual(expect.arrayContaining(['N','V','V₀','M₀','φ']));
    expect(formulaReferenceScope(entry).join('')).toContain('水平投影');expect(formulaReferenceScope(entry).join('')).not.toContain('梁挠度');
  });
  it('两铰和无铰拱保留忽略轴向变形的模型边界',()=>{
    for(const id of ['arch-2hinge-uniform','arch-fixed-uniform'])expect(formulaReferenceScope({...entries[1],id}).join('')).toContain('EA、EI');
  });

});
