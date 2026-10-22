import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, ChevronDown, Settings, X } from 'lucide-react';
import { AITutor } from '../ai';
import { ModuleType, SimulationState, THEORY_INFO } from '../types';

export function FloatingAITutor({ activeModule, state, onSettings }: {
  activeModule: ModuleType;
  state: SimulationState;
  onSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();
  useEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  return createPortal(<div className="floating-tutor" onKeyDown={event => {
    if (event.key === 'Escape' && open && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <section className="floating-tutor-window" role="dialog" aria-modal="false" id={panelId} aria-labelledby={titleId} hidden={!open}>
      <header className="floating-tutor-header">
        <div className="floating-tutor-mark"><Bot size={21} /></div>
        <div className="floating-tutor-title"><h2 id={titleId}>AI 助教</h2><p>{THEORY_INFO[activeModule].title}</p></div>
        <button aria-label="AI 助教设置" title="助教设置" onClick={onSettings}><Settings size={16} /></button>
        <button ref={closeButton} aria-label="收起 AI 助教" title="收起" onClick={close}><X size={18} /></button>
      </header>
      <div className="floating-tutor-body">
        {hasOpened ? <AITutor activeModule={activeModule} state={state} onNavigateToSettings={onSettings} embedded /> : null}
      </div>
    </section>
    <button ref={trigger} className="floating-tutor-trigger" aria-label={open ? '收起 AI 助教' : '打开 AI 助教'} aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId}
      onClick={() => { if (open) close(); else { setHasOpened(true); setOpen(true); } }}>
      {open ? <ChevronDown size={25} /> : <><Bot size={23} /><span>AI 助教</span></>}
    </button>
  </div>, document.body);
}
