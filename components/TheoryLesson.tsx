import React, { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {FormulaCard} from './FormulaCard';
import type {FormulaEntry} from '../mechanics/formulaExplanations';

export type TheoryReading = { label: string; value: string; unit?: string; accent?: boolean };

/** 理论页共用阅读层级，图解与读数由各主题的当前实验提供。 */
export function TheoryLesson({ context, first, second, lead, diagram, caption, readings, children, formulas, scope, action }: {
  context: string; first: string; second: string; lead: string; diagram: ReactNode; caption: string;
  readings: TheoryReading[]; children: ReactNode; formulas: FormulaEntry[];
  scope: string; action?: ReactNode;
}) {
  return <article className="theory-lesson" aria-label={`${context}概念图解`}>
    <header className="theory-lesson-intro">
      <div className="theory-lesson-context"><span>随实验解读</span><span>{context}</span></div>
      <h3><span>{first}</span><br /><span>{second}</span></h3><p>{lead}</p>
    </header>
    <figure className="theory-lesson-figure">{diagram}<figcaption>{caption}</figcaption></figure>
    <section className="theory-lesson-readings" aria-label="当前实验读数">{readings.map(item => <div key={item.label} className={item.accent ? 'is-accent' : ''}><span>{item.label}</span><output aria-live="off">{item.value}{item.unit && <small>{item.unit}</small>}</output></div>)}</section>
    <section className="theory-lesson-explanation">{children}</section>
    <details className="theory-lesson-equations"><summary><span>公式与计算关系</span><ChevronDown size={13} /></summary><div>{formulas.map(item => <FormulaCard key={item.label} entry={item}/>)}</div></details>
    <p className="theory-lesson-scope">{scope}</p>
    {action && <footer className="theory-lesson-action">{action}</footer>}
  </article>;
}

export function TheoryRelation({ title, children }: { title: string; children: ReactNode }) {
  return <div className="theory-lesson-relation"><h4>{title}</h4>{children}</div>;
}

/** 正负方向由调用方确定；箭头长度仅用于标识作用方向。 */
export function TheoryArrow({ x1, y1, x2, y2, mint = false }: { x1: number; y1: number; x2: number; y2: number; mint?: boolean }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const left = [x2 - 6 * Math.cos(angle - .5), y2 - 6 * Math.sin(angle - .5)];
  const right = [x2 - 6 * Math.cos(angle + .5), y2 - 6 * Math.sin(angle + .5)];
  return <g className={mint ? 'lesson-arrow mint' : 'lesson-arrow'}><path d={`M${x1} ${y1}L${x2} ${y2}`} /><path d={`M${left}L${x2} ${y2}L${right}`} /></g>;
}
