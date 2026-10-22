import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {FormulaWorkbench} from '../components/FormulaWorkbench';
import {FORMULA_REFERENCE_ENTRIES} from '../modules/FormulasModule';
import {FormulaArchDiagram} from '../components/FormulaArchDiagram';
import {buildFormulaArchSketch} from '../mechanics/formulaArchSketch';
import {FORMULA_BEAM_CALCULATORS} from '../mechanics/formulaBeamCalculators';

describe('梁拱图解使用实时模型且保留正确支承与铰',()=>{
 it('25 个条目均接入教材式实时图和截面读数，不使用旧静态占位',()=>{
  for(const entry of FORMULA_REFERENCE_ENTRIES.filter(e=>e.kind==='beam')){
   const html=renderToStaticMarkup(React.createElement(FormulaWorkbench,{entries:[entry]}));
   expect(html).toContain(entry.id.startsWith('arch-')?'fw-arch-textbook':'fw-beam-textbook');
   expect(html).toContain('图解截面读数');expect(html).toContain('截面位置 x');
   expect(html).not.toMatch(/NaN|Infinity|fw-arch-reactions/);
  }
 });
 for(const id of ['arch-3hinge-uniform','arch-3hinge-center','arch-half-uniform','arch-2hinge-uniform','arch-fixed-uniform'])it(`${id} 四类图保留正确铰与支承，不把拱脚画成滚动支座`,()=>{
  const config=FORMULA_BEAM_CALCULATORS[id],values=Object.fromEntries(config.inputs.map(i=>[i.key,i.default]));
  const a=buildFormulaArchSketch(id,values)!;
  for(const mode of ['fbd','sfd','bmd','nfd'] as const){
   const html=renderToStaticMarkup(React.createElement(FormulaArchDiagram,{sketch:a,mode,probe:a.length/4,side:'right',showReactions:true}));
   expect(html).not.toMatch(/NaN|Infinity/);
   expect(html.match(/data-support=/g)).toHaveLength(2);
   expect(html.includes('data-hinge="crown"')).toBe(a.kind==='three-hinged');
   expect(html.match(/data-kind="fixed"/g)?.length??0).toBe(a.kind==='fixed'?2:0);
   if(mode!=='fbd')expect(html).toContain(`data-field="${mode}"`);
  }
 });
});
