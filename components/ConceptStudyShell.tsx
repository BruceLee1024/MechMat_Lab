import React from 'react';
import { Maximize2 } from 'lucide-react';
import { AnalysisRail } from './AnalysisRail';

export function ConceptStudyShell({ title, subtitle, children, controls, analysis, theory, reference, actions }: {
  title: string; subtitle: string; children: React.ReactNode; controls: React.ReactNode;
  analysis: React.ReactNode; theory: React.ReactNode; reference: React.ReactNode; actions?: React.ReactNode;
}) {
  return <div className="fundamentals-grid concept-study-grid">
    <div className="fundamentals-main">
      <section className="lab-surface study-figure">
        <div className="lab-section-head"><div><h3>{title}</h3><p>{subtitle}</p></div><div className="study-figure-actions">{actions}<button aria-label="全屏查看概念演示" title="全屏查看" onClick={event => {
          const figure = event.currentTarget.closest('section');
          if (document.fullscreenElement) void document.exitFullscreen(); else void figure?.requestFullscreen().catch(() => {});
        }}><Maximize2 size={15} /></button></div></div>
        {children}
      </section>
      <section className="parameter-panel experiment-control-dock control-console study-controls" aria-label={`${title}操作`}>{controls}</section>
    </div>
    <AnalysisRail title={title} analysis={analysis} theory={theory} reference={reference} className="study-rail" />
  </div>;
}
