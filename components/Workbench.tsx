import React, { useEffect, useRef, useState } from 'react';
import { AITutor } from '../ai';
import { TheoryPanel } from '../components';
import { ModuleType, SimulationState } from '../types';

export function Workbench({ module, state, children, focus, onSettings, onBegin, onEnd }: {
  module: ModuleType; state: SimulationState; children: React.ReactNode; focus: boolean;
  onSettings: () => void; onBegin: () => void; onEnd: () => void;
}) {
  const [panel, setPanel] = useState('experiment');
  const [width, setWidth] = useState(65);
  const layout = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  useEffect(() => { setPanel('experiment'); }, [module]);
  useEffect(() => {
    const end = () => onEnd();
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
  }, [onEnd]);
  const changeWidth = (value: number) => setWidth(Math.max(50, Math.min(75, value)));
  const rangeEvent = (target: EventTarget) => target instanceof HTMLInputElement && target.type === 'range';
  return <div className={`experiment-workbench ${focus ? 'is-focused' : ''}`}>
    <div className="panel-tabs" role="tablist" aria-label="实验面板">
      {[['experiment', '实验'], ['theory', '理论'], ['ai', 'AI 助教']].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={panel === key} aria-controls={`panel-${key}`} id={`tab-${key}`} onClick={() => setPanel(key)}>{label}</button>)}
    </div>
    <div ref={layout} className="experiment-layout" data-panel={panel} style={{ '--experiment-width': `${width}%` } as React.CSSProperties}>
      <div id="panel-experiment" className="experiment-panel module-content" aria-labelledby="tab-experiment"
        onPointerDownCapture={event => { if (rangeEvent(event.target)) onBegin(); }}
        onKeyDownCapture={event => { if (rangeEvent(event.target) && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) onBegin(); }}
        onKeyUpCapture={event => { if (rangeEvent(event.target)) onEnd(); }} onBlurCapture={event => { if (rangeEvent(event.target)) onEnd(); }}>
        {children}
      </div>
      <div className="panel-divider" role="separator" aria-label="调整实验面板宽度" aria-orientation="vertical" aria-valuemin={50} aria-valuemax={75} aria-valuenow={Math.round(width)} tabIndex={0}
        onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); changeWidth(width + (event.key === 'ArrowLeft' ? -2 : 2)); } if (event.key === 'Home') changeWidth(50); if (event.key === 'End') changeWidth(75); }}
        onPointerDown={event => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { if (dragging.current && layout.current) { const rect = layout.current.getBoundingClientRect(); changeWidth((event.clientX - rect.left) / rect.width * 100); } }}
        onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}><span /></div>
      <div className="support-panels">
        <div id="panel-ai" className="ai-panel" aria-labelledby="tab-ai"><AITutor activeModule={module} state={state} onNavigateToSettings={onSettings} /></div>
        <div id="panel-theory" className="theory-panel" aria-labelledby="tab-theory"><TheoryPanel activeModule={module} /></div>
      </div>
    </div>
  </div>;
}
