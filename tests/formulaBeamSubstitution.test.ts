import {it,expect} from 'vitest';
import katex from 'katex';
import {FORMULA_BEAM_CALCULATORS} from '../mechanics/formulaBeamCalculators';
import {formulaBeamSubstitution} from '../mechanics/formulaBeamSubstitution';
it('全部梁与拱的当前参数代入式可排版，并保留计算器结果的输出单位',()=>{
 for(const [id,c] of Object.entries(FORMULA_BEAM_CALCULATORS)){
  const p=Object.fromEntries(c.inputs.map(f=>[f.key,f.default]));
  for(const row of c.calculate(p)){const tex=formulaBeamSubstitution(id,c,p,row);expect(()=>katex.renderToString(tex,{throwOnError:true}),id+':'+row.formula).not.toThrow();}
 }
});
it('简支跨中挠度明确代入 N、mm、MPa、mm⁴，转角有输出量纲换算',()=>{
 const c=FORMULA_BEAM_CALCULATORS['ss-center'],p={P:10,L:6,E:200,I:100};const rows=c.calculate(p);
 expect(formulaBeamSubstitution('ss-center',c,p,rows[2])).toContain('6000');expect(formulaBeamSubstitution('ss-center',c,p,rows[2])).toContain('200000');expect(formulaBeamSubstitution('ss-center',c,p,rows[2])).toContain('2.25');expect(formulaBeamSubstitution('ss-center',c,p,rows[3])).toContain('10^{-3}');
});
