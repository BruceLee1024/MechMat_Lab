import {axialFormulas} from '../mechanics/formulaExplanations';
import {FormulaList} from '../components/FormulaCard';
import React, { useId, useState } from 'react';
import { MoveHorizontal, Scissors } from 'lucide-react';
import { calculateAxialTeaching } from '../mechanics/calculations';
import { InvalidCalculation } from '../components/CalculationNotice';
import { LatexRenderer } from '../components';
import { SimulationState, DEFAULT_STATE } from '../types';
import { PoissonScene } from '../components/PoissonScene';
import { ExperimentControls } from '../components/ExperimentControls';
import { AnalysisRail, AnalysisReadout, AnalysisSecondary, AnalysisPair, AnalysisCard } from '../components/AnalysisRail';
import { TheoryLesson, TheoryRelation, TheoryArrow } from '../components/TheoryLesson';
import { AxialResponseChart } from '../components/AxialResponseChart';
import { AxialForceDiagram } from '../components/AxialForceDiagram';
import { NumericInput } from '../components/NumericInput';
import { deriveAxialSpecimen } from '../graphics/axialSpecimen';

export const AxialModule = ({ state, onChange }: { state: SimulationState; onChange: (s: Partial<SimulationState>) => void }) => {
  const [view, setView] = useState<'loading' | 'section'>('loading');
  const id = useId();
  const [resultChart, setResultChart] = useState<'force' | 'stress'>('force');
  const result = calculateAxialTeaching({ materialName: state.materialName, force: state.axialForce, area: state.axialArea, length: state.axialLength, modulus: state.bendModulus, yieldStrength: state.materialYield });
  if (result.ok === false) return <InvalidCalculation diagnostics={result.diagnostics} onReset={() => onChange({ axialForce: DEFAULT_STATE.axialForce, axialArea: DEFAULT_STATE.axialArea, axialLength: DEFAULT_STATE.axialLength, bendModulus: DEFAULT_STATE.bendModulus, materialYield: DEFAULT_STATE.materialYield })} />;
  const v = result.values, section = view === 'section';
  const alpha = state.axialObliqueAngle * Math.PI / 180;
  const normal = v.stress * Math.cos(alpha) ** 2, shear = v.stress * Math.sin(2 * alpha) / 2;
  const status = v.phase;
  const specimen = deriveAxialSpecimen(v, state.axialArea, state.poissonRatio);
  const geometry = specimen.geometry;
  const failed = v.isFailure;
  const brittleLimitKN = v.modelFamily === 'brittle' && v.quantitative ? state.materialYield * state.axialArea / 1000 : null;
  const formulas=axialFormulas(state,v,section);
  const theory = <TheoryLesson context={section ? '斜截面应力' : '轴向拉伸'} first={section ? '同一载荷' : '力引起应力'} second={section ? '不同截面方向' : '材料决定伸长'}
    lead={section ? '旋转截面法线，观察同一个轴向应力如何分解为正应力和切应力。' : '沿杆轴施加载荷，用当前试件把外力、应力、应变和伸长联系起来。'}
    diagram={<svg viewBox="0 0 280 140" role="img" aria-label={section ? `斜截面法线与杆轴夹角 ${state.axialObliqueAngle} 度` : '等大反向轴力作用于等截面直杆'}>
      <path d="M45 52H235V95H45Z" fill="#77bbff16" stroke="#91c6ff" strokeWidth="1.5" /><path d="M45 74H235" stroke="#9ab9d655" strokeDasharray="4 4" />
      <TheoryArrow x1={43} y1={74} x2={13} y2={74} /><TheoryArrow x1={237} y1={74} x2={267} y2={74} />
      <text x="15" y="56">F</text><text x="259" y="56">F</text>
      {section ? <g transform={`translate(140 74) rotate(${-state.axialObliqueAngle})`}><path d="M0 -43V43" stroke="#8ee6d2" strokeWidth="2" /><TheoryArrow x1={0} y1={0} x2={52} y2={0} mint /><text x="53" y="-8">n</text></g> : <><path d="M45 112H235M45 107V117M235 107V117" stroke="#84a9ce" /><text x="140" y="132" textAnchor="middle">L₀ → L₀ + ΔL</text><text x="140" y="38" textAnchor="middle">N = F　·　σ = F / A₀</text></>}
    </svg>}
    caption={section ? 'α 为截面法线与杆轴的夹角，切应力保留方向符号。' : '均匀等截面杆，两端等大反向轴力；图中变形经放大。'}
    readings={section ? [{ label: '正应力 σα', value: normal.toFixed(2), unit: 'MPa' }, { label: '切应力 τα', value: shear.toFixed(2), unit: 'MPa', accent: true }] : [{ label: '当前应力', value: v.stress.toFixed(1), unit: 'MPa' }, { label: v.strainMode === 'elastic-estimate' ? '估算伸长' : '当前伸长', value: v.deformation.toFixed(3), unit: 'mm', accent: true }]}
    formulas={formulas} scope={section ? '应力变换适用于均匀单轴应力状态；90° 为极限方向，此时两分量均为零。' : result.assumptions.join(' ')}>
    {section ? <><TheoryRelation title="正应力与切应力"><p>α = 0° 时截面正应力等于轴向应力，切应力为零。α = 45° 时，切应力绝对值达到 |σ| / 2。</p></TheoryRelation><TheoryRelation title="截面旋转，受力不变"><p>改变截面角度只改变力在截面上的分解，不改变杆件的轴向载荷、工程应力与伸长。</p></TheoryRelation></> : <><TheoryRelation title="同一载荷，截面越大应力越小"><p>当前 { (state.axialForce / 1000).toFixed(2) } kN 轴力作用于 {state.axialArea} mm² 截面，产生 {v.stress.toFixed(1)} MPa 工程应力。</p></TheoryRelation><TheoryRelation title="弹性阶段，伸长与载荷成正比"><p>保持截面与材料不变，增大原长会同比增大伸长。所选材料为 {v.materialLabel}，采用{v.responseLabel}；{v.strainMode === 'elastic-estimate' ? '当前数值只有线弹性估算意义。' : '曲线节点是教学设定，不代表实测响应。'}</p></TheoryRelation><TheoryRelation title="应变能的适用范围"><p>{!v.energyApplicable ? '当前模型或工况不适用线弹性应变能公式。' : `当前弹性应变能为 ${v.totalStrainEnergyJ.toFixed(3)} J，能量密度为 ${v.strainEnergyDensityKJ.toFixed(3)} kJ/m³。`}</p></TheoryRelation></>}
  </TheoryLesson>;

  return <div className="fundamentals-lab taste-lab axial-lab">
    <div className="axial-workbench-heading"><div className="lab-chapter-tabs topic-nav" role="tablist" aria-label="轴向拉伸主题" onKeyDown={event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault(); const next = event.key === 'Home' ? 'loading' : event.key === 'End' ? 'section' : section ? 'loading' : 'section'; setView(next); document.getElementById(`${id}-${next}`)?.focus();
    }}>
      {([['loading','拉伸实验',MoveHorizontal],['section','斜截面应力',Scissors]] as const).map(([key,label,Icon]) => <button key={key} id={`${id}-${key}`} role="tab" aria-selected={view === key} tabIndex={view === key ? 0 : -1} aria-controls={`${id}-workbench`} onClick={() => setView(key)}><Icon size={15} />{label}</button>)}
    </div><div className="axial-specimen-summary"><span>{v.materialLabel} · {v.responseLabel}</span><span>E {state.bendModulus} GPa</span><span>A₀ {state.axialArea} mm²</span><span>L₀ {v.lengthMm} mm</span></div></div>
    <div className="fundamentals-grid axial-grid" role="tabpanel" id={`${id}-workbench`} aria-labelledby={`${id}-${view}`}>
      <div className="fundamentals-main">
        <PoissonScene values={geometry} specimen={specimen} axial showSection={section} sectionAngle={section ? state.axialObliqueAngle : 0} title={section ? '斜截面 · 应力分解' : '轴向拉伸实验'} subtitle={section ? '同一应力场，观察不同截面上的正应力与切应力' : v.strainMode === 'elastic-estimate' ? '当前工况无定量变形解，三维区展示材料参考形态' : `${v.materialLabel} · ${v.responseLabel} · 材料响应教学示意`}>
          {section && <div className="axial-section-controls"><NumericInput compact label="截面法线夹角 α" value={state.axialObliqueAngle} unit="°" domain="signed" minimum={0} maximum={90} onChange={value => onChange({ axialObliqueAngle: value })} /><input type="range" aria-label="截面法线夹角滑块" min={0} max={90} step={1} value={state.axialObliqueAngle} onChange={event => onChange({ axialObliqueAngle: Number(event.target.value) })} /><div className="axial-angle-presets">{[0,45,90].map(value => <button key={value} aria-pressed={state.axialObliqueAngle === value} onClick={() => onChange({ axialObliqueAngle: value })}>{value}°</button>)}</div></div>}
        </PoissonScene>
        <ExperimentControls state={state} onChange={onChange} strain={v.strain} valid control="force" />
      </div>
      <AnalysisRail key={view} title={section ? '斜截面应力' : '轴向拉伸'} className="axial-analysis" theory={theory} reference={<>
        <FormulaList formulas={formulas}/>
        <dl className="reference-geometry"><div><dt>原始长度 L₀</dt><dd>{v.lengthMm.toFixed(1)} mm</dd></div><div><dt>当前长度 L</dt><dd>{specimen.currentLength === null ? '未确定' : `${specimen.currentLength.toFixed(3)} mm`}</dd></div><div><dt>截面积 A₀</dt><dd>{state.axialArea} mm²</dd></div><div><dt>能量密度</dt><dd>{!v.energyApplicable ? '当前不适用' : `${v.strainEnergyDensityKJ.toFixed(3)} kJ/m³`}</dd></div></dl><p className="reference-assumption">{result.assumptions.join(' ')}</p>
      </>} analysis={<>
        <section className="result-panel"><div className="analysis-panel-heading"><h3>{section ? '截面应力分量' : '实时结果'}</h3><span className="result-model-status">{section ? `α ${state.axialObliqueAngle}°` : status}</span></div>
          <AnalysisReadout label={section ? failed ? '试算正应力 σα' : '正应力 σα' : failed ? '试加载名义应力 F/A₀' : '工程应力 σ'} value={(section ? normal : v.stress).toFixed(1)} unit="MPa" />
          <AnalysisSecondary label={section ? '切应力 τα' : '弹性应变能 U'} value={section ? shear.toFixed(3) : !v.energyApplicable ? '不适用' : v.totalStrainEnergyJ.toFixed(3)} unit={section ? 'MPa' : !v.energyApplicable ? undefined : 'J'} />
          <AnalysisPair><AnalysisCard label={failed ? '轴向应变 ε' : v.strainMode === 'elastic-estimate' ? '估算应变 ε' : '轴向应变 ε'} value={failed ? '未求解' : (v.strain*100).toFixed(3)} unit={failed ? undefined : '%'} /><AnalysisCard label={failed ? '总伸长 ΔL' : v.strainMode === 'elastic-estimate' ? '估算伸长 ΔL' : '总伸长 ΔL'} value={failed ? '未求解' : v.deformation.toFixed(3)} unit={failed ? undefined : 'mm'} accent /></AnalysisPair>
          <div className={`axial-model-note ${v.isPlastic ? 'is-teaching' : ''}`}><div><span>{v.referenceLabel}</span><output>{state.materialYield} <small>MPa</small></output></div><div className={`axial-yield-meter ${!v.quantitative ? 'is-unrated' : ''}`} aria-hidden="true"><i style={{width:`${Math.min(100, Math.max(0,v.stress/state.materialYield*100))}%`}} /></div><p>{failed ? '已超出材料教学曲线；名义需求应力不代表破坏后的实际应力。' : v.strainMode === 'elastic-estimate' ? '当前应变与伸长仅作线弹性估算；不据此判断材料真实破坏。' : v.strainMode === 'teaching' ? '应变与曲线共用材料教学模型；不代表实测响应。' : '均匀直杆 · 线弹性计算；粒子流表示应力传递。'}</p></div>
        </section>
        {section ? <section className="axial-cut-analysis"><h3>方向与分量</h3><div className="axial-component-bars"><div><span>cos²α</span><i><b style={{width:`${Math.cos(alpha)**2*100}%`}} /></i><output>{(Math.cos(alpha)**2*100).toFixed(1)}%</output></div><div><span>½sin2α</span><i><b style={{width:`${Math.abs(Math.sin(2*alpha)/2)*100}%`}} /></i><output>{(Math.sin(2*alpha)/2*100).toFixed(1)}%</output></div></div><p>α 为截面法线与杆轴的夹角。45° 时切应力绝对值最大，90° 时两种应力分量均为零。</p><div className="lab-formula"><LatexRenderer formula={String.raw`\sigma_\alpha=\sigma\cos^2\alpha`} /><LatexRenderer formula={String.raw`\tau_\alpha=\frac{\sigma}{2}\sin 2\alpha`} /></div></section> : <section className="axial-result-charts" aria-label="实验结果图表">
          <div className="axial-chart-switch" role="group" aria-label="切换结果图表">
            <button aria-pressed={resultChart === 'force'} onClick={() => setResultChart('force')}>轴力图</button>
            <button aria-pressed={resultChart === 'stress'} onClick={() => setResultChart('stress')}>应力–应变</button>
          </div>
          {resultChart === 'force' ? <>
            <AxialForceDiagram force={state.axialForce} lengthMm={v.lengthMm} failureTeaching={v.isFailure} />
            {brittleLimitKN !== null && <dl className="axial-capacity-comparison"><div><dt>教学参考载荷 σₜ,ref A₀</dt><dd>{brittleLimitKN.toFixed(3)} <small>kN</small></dd></div><div><dt>试加载 / 参考载荷</dt><dd>{(state.axialForce/(brittleLimitKN*1000)).toFixed(2)}</dd></div></dl>}
            {!failed && <dl className="axial-force-explanation"><div><dt>分布区间</dt><dd>0 — {v.lengthMm.toLocaleString('zh-CN')} <small>mm</small></dd></div><div><dt>中间轴向荷载</dt><dd>0 <small>N/mm</small></dd></div></dl>}
          </> : <AxialResponseChart state={state} />}
        </section>}
      </>} />
    </div>
  </div>;
};
