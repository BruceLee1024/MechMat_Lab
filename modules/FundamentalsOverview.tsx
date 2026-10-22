import React, { useState } from 'react';
import { ArrowLeftRight, Move, ShieldCheck } from 'lucide-react';
import { LatexRenderer } from '../components';
import { AnalysisCard, AnalysisPair, AnalysisRail, AnalysisReadout, AnalysisSecondary } from '../components/AnalysisRail';
import { ExperimentControls } from '../components/ExperimentControls';
import { FundamentalsChart } from '../components/FundamentalsChart';
import { PoissonScene } from '../components/PoissonScene';
import { calculateFundamentals } from '../mechanics/fundamentals';
import { SimulationState } from '../types';
import { OverviewTheory } from '../components/FundamentalsTheory';

type Topic = 'forces' | 'strain' | 'design';
const topics = [
  { id: 'forces', title: '外力与内力', icon: ArrowLeftRight, lead: '外力作用于物体，内力在截面上传递。', formula: 'N = F, \\qquad \\sigma = \\frac{N}{A_0}', explanation: '对等截面直杆作假想截面，截面轴力 N 平衡端部外力 F。平均正应力 σ 描述单位面积上的内力。' },
  { id: 'strain', title: '应力与应变', icon: Move, lead: '应力描述受力程度，应变描述相对变形。', formula: '\\varepsilon = \\frac{\\Delta L}{L_0}, \\qquad \\sigma = E\\varepsilon', explanation: '轴向应变是伸长量与原长之比，没有量纲。在线弹性范围内，弹性模量 E 将应力与应变联系起来。' },
  { id: 'design', title: '强度与刚度', icon: ShieldCheck, lead: '既要承受载荷，也要控制变形。', formula: '\\sigma = \\frac{F}{A_0}, \\qquad \\Delta L = \\frac{FL_0}{EA_0}', explanation: '强度关注材料是否发生失效，刚度关注变形是否满足使用要求。本例给出参考屈服强度和轴向变形，不代替工程设计验算。' },
] as const;

export function FundamentalsOverview({ state, onChange, onContinue }: {
  state: SimulationState; onChange: (value: Partial<SimulationState>) => void; onContinue: () => void;
}) {
  const [topic, setTopic] = useState<Topic>('forces');
  const result = calculateFundamentals(state);
  const values = result.ok ? result.values : null;
  const force = (state.axialForce / 1000).toFixed(3);
  return <div className="fundamentals-grid overview-grid">
    <div className="fundamentals-main">
      {values ? <PoissonScene values={values} title="材料受力与变形" subtitle="通过一根受拉直杆，理解材料力学的基本问题" showSection={topic === 'forces'}>
        <div className="overview-observation-tabs" role="group" aria-label="基本概念观察主题">
          {topics.map(({ id: key, title, icon: Icon }) => <button key={key} aria-pressed={topic === key} onClick={() => setTopic(key)}><Icon size={14} /><span>{title}</span></button>)}
        </div>
      </PoissonScene> : <section className="lab-surface lab-error" role="alert"><h3>当前参数无法计算</h3><p>请检查材料与试件参数，或重置实验。</p></section>}
      <ExperimentControls state={state} onChange={onChange} strain={values?.strain ?? 0} valid={!!values} />
    </div>
    <AnalysisRail title="绪论与基本概念" className="overview-rail"
      analysis={<>
        <section className="result-panel">
          <div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">{values ? '单轴线弹性' : '参数待检查'}</span></div>
          {values ? <>
            <AnalysisReadout label={topic === 'forces' ? <>截面轴力 <em>N</em></> : topic === 'strain' ? <>轴向应变 <em>ε</em></> : <>平均正应力 <em>σ</em></>} value={topic === 'forces' ? force : topic === 'strain' ? (values.strain * 100).toFixed(3) : values.stress.toFixed(1)} unit={topic === 'forces' ? 'kN' : topic === 'strain' ? '%' : 'MPa'} />
            <AnalysisSecondary label={topic === 'design' ? <>端部外力 <em>F</em></> : <>平均正应力 <em>σ</em></>} value={topic === 'design' ? force : values.stress.toFixed(1)} unit={topic === 'design' ? 'kN' : 'MPa'} />
            <AnalysisPair>
              <AnalysisCard label={topic === 'forces' ? <>轴向应变 <em>ε</em></> : <>轴向伸长 <em>ΔL</em></>} value={topic === 'forces' ? (values.strain * 100).toFixed(3) : values.deformation.toFixed(3)} unit={topic === 'forces' ? '%' : 'mm'} />
              <AnalysisCard label={topic === 'design' ? <>初始面积 <em>A₀</em></> : <>横向应变 <em>ε<sub>trans</sub></em></>} value={topic === 'design' ? state.axialArea.toFixed(1) : (values.transverseStrain * 100).toFixed(3)} unit={topic === 'design' ? 'mm²' : '%'} accent />
            </AnalysisPair>
            <div className="result-model-note"><div className="analysis-meta-row"><span>参考屈服强度</span><span>{state.materialYield} <small>MPa</small></span></div><p role="status">{result.ok && result.warnings.length ? '当前超过参考屈服，弹性外推不代表实际响应。' : '当前结果位于参考屈服范围内。'}</p></div>
          </> : <p className="lab-error">检查参数后显示结果。</p>}
        </section>
        <FundamentalsChart state={state} />
      </>}
      reference={<>
        <div className="reference-formulas">
          <div><span>轴力与应力</span><LatexRenderer formula={'N=F,\\quad \\sigma=N/A_0'} /></div>
          <div><span>轴向伸长</span><LatexRenderer formula={'\\Delta L=FL_0/(EA_0)'} /></div>
          <div><span>轴向应变</span><LatexRenderer formula={'\\varepsilon=\\Delta L/L_0'} /></div>
        </div>
        <dl className="reference-geometry"><div><dt>试件原长 L₀</dt><dd>{values ? values.lengthMm.toFixed(1) : '—'} <small>mm</small></dd></div><div><dt>初始面积 A₀</dt><dd>{state.axialArea.toFixed(3)} <small>mm²</small></dd></div></dl>
        <p className="reference-assumption">等截面直杆、无分布荷载；图形放大不参与数值计算。超过参考屈服强度时，弹性外推不代表实际响应。</p>
      </>}
      theory={<OverviewTheory topic={topic} values={values} state={state} onContinue={onContinue} />}
    />
  </div>;
}
