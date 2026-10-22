import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, ChevronDown, SquareFunction } from 'lucide-react';

// 基础理论的四个主题共用泊松效应分析栏的结构和交互。
export function AnalysisRail({ title, analysis, theory, reference, className = '' }: {
  title: string; analysis: React.ReactNode; theory: React.ReactNode; reference: React.ReactNode; className?: string;
}) {
  const [panel, setPanel] = useState<'analysis' | 'theory'>('analysis');
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => { if (expanded) content.current?.scrollIntoView({ block: 'nearest' }); }, [expanded]);
  return <aside className={`fundamentals-inspector analysis-rail unified-analysis-rail ${className}`} aria-label={`${title}分析`}>
    <div className="analysis-tabs" role="tablist" aria-label={`${title}分析工具`} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'analysis' : event.key === 'End' ? 'theory' : panel === 'analysis' ? 'theory' : 'analysis';
      setPanel(next); document.getElementById(`${id}-tab-${next}`)?.focus();
    }}>
      {([['analysis', '结果分析', ChartNoAxesCombined], ['theory', '理论', BookOpen]] as const).map(([key, label, Icon]) => <button key={key} id={`${id}-tab-${key}`} role="tab" aria-selected={panel === key} tabIndex={panel === key ? 0 : -1} aria-controls={`${id}-panel-${key}`} onClick={() => setPanel(key)}><Icon size={14} />{label}</button>)}
    </div>
    <div className="analysis-tab-panel analysis-results" role="tabpanel" id={`${id}-panel-analysis`} aria-labelledby={`${id}-tab-analysis`} hidden={panel !== 'analysis'}>
      {analysis}
      <section className="analysis-reference" aria-label="实验参考" onKeyDown={event => {
        if (event.key === 'Escape' && expanded) { event.preventDefault(); setExpanded(false); trigger.current?.focus(); }
      }}>
        <div className="reference-actions">
          <button ref={trigger} id={`${id}-reference-trigger`} aria-expanded={expanded} aria-controls={`${id}-reference`} onClick={() => setExpanded(open => !open)}><SquareFunction size={15} /><span>计算依据</span><ChevronDown className="reference-chevron" size={13} /></button>
          <button onClick={() => { setPanel('theory'); document.getElementById(`${id}-tab-theory`)?.focus(); }}><BookOpen size={15} /><span>理论解读</span><ArrowUpRight size={13} /></button>
        </div>
        <div ref={content} id={`${id}-reference`} className="reference-content" role="region" aria-labelledby={`${id}-reference-trigger`} hidden={!expanded}>{reference}</div>
      </section>
    </div>
    <div className="analysis-tab-panel theory-reading" role="tabpanel" id={`${id}-panel-theory`} aria-labelledby={`${id}-tab-theory`} hidden={panel !== 'theory'}>{theory}</div>
  </aside>;
}

export function AnalysisReadout({ label, value, unit }: { label: React.ReactNode; value: string; unit?: string }) {
  return <div className="result-row stress result-primary"><span>{label}</span><output aria-live="off">{value} {unit ? <small>{unit}</small> : null}</output></div>;
}
export function AnalysisSecondary({ label, value, unit }: { label: React.ReactNode; value: string; unit?: string }) {
  return <div className="true-stress-reading"><span>{label}</span><output>{value} {unit ? <small>{unit}</small> : null}</output></div>;
}
export function AnalysisPair({ children }: { children: React.ReactNode }) { return <div className="strain-result-pair">{children}</div>; }
export function AnalysisCard({ label, value, unit, accent = false, text = false }: { label: React.ReactNode; value: string; unit?: string; accent?: boolean; text?: boolean }) {
  return <div className={`result-row${accent ? ' transverse' : ''}${text ? ' analysis-text-value' : ''}`}><span>{label}</span><output>{value} {unit ? <small>{unit}</small> : null}</output></div>;
}
