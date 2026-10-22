import React from 'react';
import {LatexRenderer} from './LatexRenderer';
import type {FormulaDetails,FormulaEntry} from '../mechanics/formulaExplanations';

const format=(n:number)=>n===0?'0':Math.abs(n)>=1e7||Math.abs(n)<1e-5?n.toExponential(5):Number(n.toPrecision(8)).toString();

export function FormulaExplanation({label,details}:{label:string;details:FormulaDetails}) {
  return <div className={`formula-explanation${details.status?` is-${details.status}`:''}`}>
    <div className="formula-detail-title">符号与当前值</div>
    <dl className="formula-symbols">{details.symbols.map((p,i)=><div key={`${p.symbol}-${i}`}><dt><LatexRenderer formula={p.symbol} label={p.name}/></dt><dd><span>{p.name}</span>{p.value!==undefined&&<strong>{p.value===null?'—':format(p.value)}{p.unit&&<small>{p.unit}</small>}</strong>}</dd></div>)}</dl>
    {details.steps.length>0&&<div className="formula-substitution" role="group" aria-label={`${label}当前参数代入`}><div className="formula-detail-title">当前参数代入{details.status==='reference'&&<span>参考计算</span>}</div>{details.steps.map((step,i)=><LatexRenderer key={i} formula={step} label={`${label}代入步骤${i+1}`}/>)}<p className="formula-rounding-note">显示值已取舍位，计算使用完整精度</p></div>}
    {details.note&&<p className="formula-detail-note" role={details.status==='unavailable'?'status':undefined}>{details.note}</p>}
  </div>;
}
export function FormulaCard({entry}:{entry:FormulaEntry}) {
  return <div className="reference-formula-row"><span>{entry.label}</span><LatexRenderer label={entry.label} expandable formula={entry.formula} explanation={entry.details?<FormulaExplanation label={entry.label} details={entry.details}/>:undefined}/></div>;
}
export function FormulaList({formulas}:{formulas:FormulaEntry[]}) {
  return <div className="reference-formulas">{formulas.map(entry=><FormulaCard key={entry.label} entry={entry}/>)}</div>;
}
