import {fundamentalsFormulas} from '../mechanics/formulaExplanations';
import {FormulaList} from '../components/FormulaCard';
import React, { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, Box, Scissors, Move, Layers, X, ArrowUpRight, ChartNoAxesCombined, SquareFunction, ChevronDown } from 'lucide-react';
import { LatexRenderer } from '../components';
import { ExperimentControls } from '../components/ExperimentControls';
import { PoissonScene } from '../components/PoissonScene';
import { FundamentalsChart } from '../components/FundamentalsChart';
import { calculateFundamentals } from '../mechanics/fundamentals';
import { FundamentalsConcepts } from './FundamentalsConcepts';
import { FundamentalsOverview } from './FundamentalsOverview';
import { ConceptStudies } from './ConceptStudies';
import { SimulationState } from '../types';
import { PoissonTheory } from '../components/FundamentalsTheory';

type Concept = 'overview' | 'assumptions' | 'sections' | 'strain' | 'forms';
type AnalysisTab = 'analysis' | 'theory';

function moveTab(event: React.KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]'));
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
    : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next]?.focus();
  buttons[next]?.click();
}

export const FundamentalsModule = ({ state, onChange }: {
  state: SimulationState;
  onChange: (s: Partial<SimulationState>) => void;
}) => {
  const [concept, setConcept] = useState<Concept>('assumptions');
  const [showConcepts, setShowConcepts] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('analysis');
  const [showCalculation, setShowCalculation] = useState(false);
  const chapterId = useId();
  const calculationId = useId();
  const calculationButton = useRef<HTMLButtonElement>(null);
  const calculationPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showCalculation) calculationPanel.current?.scrollIntoView({ block: 'nearest' });
  }, [showCalculation]);
  const result = calculateFundamentals(state);
  const values = result.ok ? result.values : null;
  const chapters = [
    ['assumptions', '变形固体假设', Box],
    ['sections', '截面法', Scissors],
    ['strain', '位移与应变', Move],
    ['forms', '变形基本形式', Layers],
  ] as const;
  const activeChapter = concept;
  const chapterTitle = concept === 'assumptions' ? '变形固体假设' : chapters.find(([key]) => key === concept)?.[1] || '理论基础';
  const panels = [['analysis', '结果分析', ChartNoAxesCombined], ['theory', '理论', BookOpen]] as const;

  return <div className="fundamentals-lab taste-lab">
    <div className="lab-chapter-tabs topic-nav" role="tablist" aria-label="基础理论主题" onKeyDown={moveTab}>
      <button id={`${chapterId}-overview`} role="tab" aria-selected={activeChapter === 'overview'} tabIndex={activeChapter === 'overview' ? 0 : -1} aria-controls={`${chapterId}-reader`}
        onClick={() => { setConcept('overview'); setShowConcepts(true); }}><BookOpen size={15} /><span>绪论与基本概念</span></button>
      {chapters.map(([key, label, Icon]) => <button key={key} id={`${chapterId}-${key}`} role="tab"
        aria-selected={activeChapter === key} tabIndex={activeChapter === key ? 0 : -1} aria-controls={`${chapterId}-${key === 'assumptions' && !(showConcepts && concept === 'assumptions') ? 'experiment' : 'reader'}`}
        onClick={() => { setConcept(key); setShowConcepts(key !== 'assumptions'); }}><Icon size={15} /><span>{label}</span></button>)}
    </div>

    {showConcepts && concept === 'overview' ? <div className="overview-workbench" role="tabpanel" id={`${chapterId}-reader`} aria-labelledby={`${chapterId}-overview`}>
      <FundamentalsOverview state={state} onChange={onChange} onContinue={() => { setConcept('assumptions'); setShowConcepts(false); }} />
    </div> : null}

    {showConcepts && concept !== 'overview' && concept !== 'assumptions' ? <div className="overview-workbench" role="tabpanel" id={`${chapterId}-reader`} aria-labelledby={`${chapterId}-${concept}`}>
      <ConceptStudies kind={concept} />
    </div> : null}

    {showConcepts && concept === 'assumptions' ? <div className="lab-concept-reader" role="tabpanel" id={`${chapterId}-reader`} aria-labelledby={`${chapterId}-${activeChapter}`}>
      <button className="tool-button" onClick={() => { setShowConcepts(false); setConcept('assumptions'); }}><X size={14} />返回泊松效应实验</button>
      <FundamentalsConcepts key={concept} initialTab={concept} title={chapterTitle} showNavigation={false} />
    </div> : null}

    <div className={`fundamentals-grid ${showConcepts ? 'is-reading' : ''}`} role="tabpanel" id={`${chapterId}-experiment`} aria-labelledby={`${chapterId}-assumptions`} hidden={showConcepts}>
      <div className="fundamentals-main">
        {values ? <PoissonScene values={values} /> : <section className="lab-surface lab-error" role="alert">
          <h3>当前参数无法计算</h3>
          <p>{result.ok === false ? result.diagnostics.map(d => d.message).join('；') : ''}</p>
          <p>请检查材料和几何参数，或使用工具栏重置实验。</p>
        </section>}

        <ExperimentControls state={state} onChange={onChange} strain={values?.strain ?? 0} valid={!!values} />
      </div>

      <aside className="fundamentals-inspector analysis-rail" aria-label="实验参数与分析">
        <div className="analysis-tabs" role="tablist" aria-label="分析工具" onKeyDown={moveTab}>
          {panels.map(([key, label, Icon]) => <button key={key} id={`analysis-tab-${key}`} role="tab" aria-selected={analysisTab === key}
            aria-controls={`analysis-panel-${key}`} tabIndex={analysisTab === key ? 0 : -1} onClick={() => setAnalysisTab(key)}>
            <Icon size={15} />{label}
          </button>)}
        </div>

        <div className="analysis-tab-panel analysis-results" id="analysis-panel-analysis" role="tabpanel" aria-labelledby="analysis-tab-analysis" hidden={analysisTab !== 'analysis'}>
          <section className="result-panel">
            <div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">{!values ? '参数待检查' : '线弹性模型'}</span></div>
            {values ? <div className="analysis-result-values" aria-live="polite" aria-atomic="true">
              <div className="result-row stress result-primary"><span>工程应力 <em>σ</em></span><output>{values.stress.toFixed(1)} <small>MPa</small></output></div>
              <div className="true-stress-reading"><span>真应力 <em>σ<sub>true</sub></em></span><output>{values.trueStress.toFixed(3)} <small>MPa</small></output></div>
              <div className="strain-result-pair">
                <div className="result-row"><span>轴向应变 <em>ε<sub>axial</sub></em></span><output>{(values.strain * 100).toFixed(3)} <small>%</small></output></div>
                <div className="result-row transverse"><span>横向应变 <em>ε<sub>trans</sub></em></span><output>{(values.transverseStrain * 100).toFixed(3)} <small>%</small></output></div>
              </div>
              <div className="result-model-note">
                <div className="analysis-meta-row"><span>参考屈服强度</span><span>{state.materialYield} <small>MPa</small></span></div>
                <p role="status">{result.ok && result.warnings.length ? '当前超过参考屈服，弹性外推不代表实际响应。' : '当前结果位于参考屈服范围内。'}</p>
              </div>
            </div> : <p className="lab-error">无有效结果，请检查参数。</p>}
          </section>
          <FundamentalsChart state={state} />
          <section className="analysis-reference" aria-label="实验参考" onKeyDown={event => {
            if (event.key === 'Escape' && showCalculation) { event.preventDefault(); setShowCalculation(false); calculationButton.current?.focus(); }
          }}>
            <div className="reference-actions">
              <button ref={calculationButton} id={`${calculationId}-trigger`} aria-expanded={showCalculation} aria-controls={calculationId} onClick={() => setShowCalculation(open => !open)}>
                <SquareFunction size={15} /><span>计算依据</span><ChevronDown className="reference-chevron" size={13} />
              </button>
              <button onClick={() => { setAnalysisTab('theory'); document.getElementById('analysis-tab-theory')?.focus(); }}><BookOpen size={15} /><span>理论解读</span><ArrowUpRight size={13} /></button>
            </div>
            <div ref={calculationPanel} id={calculationId} className="reference-content" role="region" aria-labelledby={`${calculationId}-trigger`} hidden={!showCalculation}>
              {values&&<FormulaList formulas={fundamentalsFormulas(state,values)}/>}
              {values ? <dl className="reference-geometry"><div><dt>初始面积 A₀</dt><dd>{state.axialArea.toFixed(3)} <small>mm²</small></dd></div><div><dt>当前面积 A</dt><dd>{(values.currentWidth ** 2).toFixed(3)} <small>mm²</small></dd></div></dl> : null}
              <p className="reference-assumption">适用于均匀、各向同性材料的小变形线弹性模型。</p>
            </div>
          </section>
        </div>

        <div className="analysis-tab-panel theory-reading" id="analysis-panel-theory" role="tabpanel" aria-labelledby="analysis-tab-theory" hidden={analysisTab !== 'theory'}>
          <PoissonTheory values={values} state={state} beyondYield={!!(result.ok && result.warnings.length)} onRead={() => { setConcept('assumptions'); setShowConcepts(true); }} />
        </div>


      </aside>
    </div>
  </div>;
};
