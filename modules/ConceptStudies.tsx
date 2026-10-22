import React, { useEffect, useId, useRef, useState } from 'react';
import { Layers, Move, Pause, Play, RotateCcw, Scissors } from 'lucide-react';
import { LatexRenderer } from '../components';
import { ConceptStudyShell } from '../components/ConceptStudyShell';
import { sectionStudy, strainStudy } from '../mechanics/conceptStudies';
import { ConceptScene3D } from '../components/ConceptScene3D';
import { AnalysisCard, AnalysisPair, AnalysisReadout, AnalysisSecondary } from '../components/AnalysisRail';
import { StudyResultPlot } from '../components/StudyResultPlot';
import { StrainTheory } from '../components/StrainTheory';
import { FormTheory, SectionTheory } from '../components/FundamentalsTheory';

export type StudyKind = 'sections' | 'strain' | 'forms';
type Form = 'axial' | 'shear' | 'torsion' | 'bending';
const forms = [
  { id: 'axial', title: '轴向拉伸', symbol: 'N', motion: '轴线方向伸长', key: '正应变 ε', formula: '\\varepsilon_x = \\frac{\\Delta L}{L_0}', explanation: '轴向力沿杆轴作用，引起轴向伸长或缩短。横向收缩与材料泊松比有关，本示意着重展示轴向变化。' },
  { id: 'shear', title: '剪切', symbol: 'Q', motion: '相邻截面发生错动', key: '剪应变 γ', formula: '\\gamma_{xy} = \\frac{\\partial u}{\\partial y} + \\frac{\\partial v}{\\partial x}', explanation: '剪切使原来正交的材料线夹角发生变化。示意中的网格随形体倾斜，可与位移与应变主题中的简单剪切对照。' },
  { id: 'torsion', title: '扭转', symbol: 'T', motion: '截面绕杆轴相对转动', key: '相对扭转角 φ', formula: '\\varphi = \\theta_{right} - \\theta_{left}', explanation: '扭矩使横截面绕杆轴相对转动。沿杆长观察截面转角，能把扭转与整体刚体转动区分开。' },
  { id: 'bending', title: '弯曲', symbol: 'M', motion: '杆的轴线变成曲线', key: '曲率 κ', formula: '\\kappa = \\frac{1}{\\rho}', explanation: '弯曲时杆轴线变弯，截面相对转动；一侧伸长、另一侧缩短。示意采用平截面运动，不计算特定材料的实际挠度。' },
] as const;

function StudySlider({ label, value, min, max, step, unit, onChange, digits = 0 }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void; digits?: number;
}) {
  const id = useId();
  return <div className="study-slider"><div><label htmlFor={id}>{label}</label><output htmlFor={id}>{value.toFixed(digits)} <small>{unit}</small></output></div><input id={id} aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ '--study-progress': `${(value - min) / (max - min) * 100}%` } as React.CSSProperties} /><div className="study-scale" aria-hidden="true"><span>{min}{unit}</span><span>{max}{unit}</span></div></div>;
}
export function ConceptStudies({ kind }: { kind: StudyKind }) {
  const [cut, setCut] = useState(55);
  const [load, setLoad] = useState(1);
  const [axialLoad, setAxialLoad] = useState(2);
  const [isolate, setIsolate] = useState(true);
  const [rigid, setRigid] = useState(false);
  const [axialPercent, setAxialPercent] = useState(.6);
  const [shear, setShear] = useState(.02);
  const [tx, setTx] = useState(12);
  const [ty, setTy] = useState(8);
  const [form, setForm] = useState<Form>('axial');
  const [amplitude, setAmplitude] = useState(55);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState(1);
  const animationElapsed = useRef(0);
  useEffect(() => {
    if (!playing || kind !== 'forms') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) { setPlaying(false); return; }
    let frame = 0;
    const start = performance.now() - animationElapsed.current;
    const tick = (now: number) => { animationElapsed.current = now - start; setPhase(.5 + .5 * Math.cos(animationElapsed.current / 3400 * Math.PI * 2)); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    const stop = () => { if (media.matches) setPlaying(false); };
    media.addEventListener('change', stop);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', stop); };
  }, [playing, kind]);
  const reset = () => {
    if (kind === 'sections') { setCut(55); setLoad(1); setAxialLoad(2); setIsolate(true); }
    if (kind === 'strain') { setAxialPercent(.6); setShear(.02); setTx(12); setTy(8); setRigid(false); }
    if (kind === 'forms') { setAmplitude(55); setPlaying(false); setPhase(1); animationElapsed.current = 0; }
  };
  const commonActions = <button aria-label="重置当前概念演示" title="重置演示" onClick={reset}><RotateCcw size={14} /></button>;

  if (kind === 'sections') {
    const values = sectionStudy(cut, load, axialLoad);
    return <ConceptStudyShell title="截面法与内力" subtitle="假想切开、选取隔离体，用平衡关系求内力" actions={commonActions}
      controls={<><StudySlider label="截面位置 x / L" value={cut} min={10} max={90} step={1} unit="%" onChange={setCut} /><StudySlider label="端部横向力 P" value={load} min={0} max={5} step={.1} digits={1} unit="kN" onChange={setLoad} /><StudySlider label="端部轴向力 F" value={axialLoad} min={0} max={5} step={.1} digits={1} unit="kN" onChange={setAxialLoad} /></>}
      analysis={<>
        <section className="result-panel">
          <div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">静力平衡</span></div>
          <AnalysisReadout label={<>截面弯矩 <em>M</em></>} value={values.momentKNm.toFixed(3)} unit="kN·m" />
          <AnalysisSecondary label={<>右段长度 <em>L − x</em></>} value={values.remainingM.toFixed(2)} unit="m" />
          <AnalysisPair><AnalysisCard label={<>轴力 <em>N</em></>} value={values.axialKN.toFixed(2)} unit="kN" /><AnalysisCard label={<>剪力 <em>Q</em></>} value={values.shearKN.toFixed(2)} unit="kN" accent /></AnalysisPair>
          <div className="result-model-note"><div className="analysis-meta-row"><span>当前截面 x / L</span><span>{cut} <small>%</small></span></div><p>{isolate ? '保留右段，以切面内力平衡端部外载。' : '完整构件受力，内力按右段约定读取。'}</p></div>
        </section>
        <StudyResultPlot title="弯矩沿杆长分布" xLabel="x / m" yLabel="M / (kN·m)" markerX={values.positionM} series={[{ label: '当前截面弯矩', points: [...new Set([...Array.from({ length: 21 }, (_, i) => i * 5), cut])].sort((a, b) => a - b).map(x => [x / 100, sectionStudy(x, load, axialLoad).momentKNm]), value: values.momentKNm.toFixed(3), color: '#9acbff', unit: 'kN·m' }]} />
      </>}
      reference={<>
        <div className="reference-formulas"><div><span>轴力平衡</span><LatexRenderer formula={'N=F'} /></div><div><span>剪力平衡</span><LatexRenderer formula={'Q=P'} /></div><div><span>弯矩平衡</span><LatexRenderer formula={'M=P(L-x)'} /></div></div>
        <dl className="reference-geometry"><div><dt>杆长 L</dt><dd>1.00 <small>m</small></dd></div><div><dt>截面位置 x</dt><dd>{values.positionM.toFixed(2)} <small>m</small></dd></div></dl>
        <p className="reference-assumption">端部集中力、无分布荷载。内力按右段图示方向读取；教学模型与泊松效应实验独立。</p>
      </>}
      theory={<SectionTheory cut={cut} transverse={load} axial={axialLoad} isolate={isolate} />}>
      <div className="overview-observation-tabs" role="group" aria-label="截面显示方式"><button aria-pressed={isolate} onClick={() => setIsolate(true)}><Scissors size={14} />右段隔离体</button><button aria-pressed={!isolate} onClick={() => setIsolate(false)}><Layers size={14} />整体构件</button></div>
      <ConceptScene3D scene={{ kind: 'sections', cut, axial: axialLoad, transverse: load, isolate }} label={`截面位置 ${cut}%，轴力 ${axialLoad} kN，剪力 ${load} kN，弯矩 ${values.momentKNm.toFixed(3)} kN·m`} caption="杆长 L = 1 m · 载荷方向示意" />
    </ConceptStudyShell>;
  }

  if (kind === 'strain') {
    const result = strainStudy({ rigid, axialPercent, shear, translationXmm: tx, translationYmm: ty });
    return <ConceptStudyShell title="位移与应变" subtitle="对比整体平移与局部变形，观察材料线长度和夹角" actions={commonActions}
      controls={rigid ? <><StudySlider label="水平平移 u" value={tx} min={-20} max={20} step={1} unit="mm" onChange={setTx} /><StudySlider label="竖向平移 v" value={ty} min={-20} max={20} step={1} unit="mm" onChange={setTy} /></> : <><StudySlider label="轴向应变 εx" value={axialPercent} min={-1} max={1} step={.01} digits={2} unit="%" onChange={setAxialPercent} /><StudySlider label="剪应变 γxy" value={shear} min={-.03} max={.03} step={.001} digits={3} unit="rad" onChange={setShear} /></>}
      analysis={<>
        <section className="result-panel">
          <div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">{rigid ? '刚体平移' : '小应变模型'}</span></div>
          <AnalysisReadout label={<>轴向应变 <em>ε<sub>x</sub></em></>} value={(result.ex * 100).toFixed(2)} unit="%" />
          <AnalysisSecondary label={<>剪应变 <em>γ<sub>xy</sub></em></>} value={result.gamma.toFixed(3)} unit="rad" />
          <AnalysisPair><AnalysisCard label={<>点 C 位移 <em>u<sub>C</sub></em></>} value={result.cornerUXmm.toFixed(2)} unit="mm" /><AnalysisCard label={<>点 C 位移 <em>v<sub>C</sub></em></>} value={result.cornerVYmm.toFixed(2)} unit="mm" accent /></AnalysisPair>
          <div className="result-model-note"><div className="analysis-meta-row"><span>参考单元边长</span><span>100 <small>mm</small></span></div><p>{rigid ? '各点位移相同，材料线长度与夹角保持不变。' : '数值来自位移场，图形放大 ×8 仅用于观察。'}</p></div>
        </section>
        <StudyResultPlot title="位移沿单元高度分布" xLabel="y / mm" yLabel="u / mm" markerX={100} series={[
          { label: '材料线 x = 0', points: Array.from({ length: 11 }, (_, i) => [i * 10, rigid ? tx : result.gamma * i * 10]), value: (rigid ? tx : result.gamma * 100).toFixed(2), color: '#9acbff', unit: 'mm', dashed: true },
          { label: '材料线 x = 100', points: Array.from({ length: 11 }, (_, i) => [i * 10, rigid ? tx : result.ex * 100 + result.gamma * i * 10]), value: result.cornerUXmm.toFixed(2), color: '#88ddc9', unit: 'mm' },
        ]} />
      </>}
      reference={<>
        <div className="reference-formulas"><div><span>水平位移场</span><LatexRenderer formula={rigid ? 'u=t_x' : String.raw`u=\varepsilon_x x+\gamma_{xy}y`} /></div><div><span>竖向位移场</span><LatexRenderer formula={rigid ? 'v=t_y' : 'v=0'} /></div><div><span>轴向应变</span><LatexRenderer formula={String.raw`\varepsilon_x=\frac{\partial u}{\partial x}`} /></div><div><span>剪应变</span><LatexRenderer formula={String.raw`\gamma_{xy}=\frac{\partial u}{\partial y}+\frac{\partial v}{\partial x}`} /></div></div>
        <p className="reference-assumption">100 mm 参考单元，采用线性小应变。曲线为未放大的位移；教学模型与泊松效应实验独立。</p>
      </>}
      theory={<StrainTheory rigid={rigid} ex={result.ex} gamma={result.gamma} tx={tx} ty={ty} />}>
      <div className="overview-observation-tabs" role="group" aria-label="位移模式"><button aria-pressed={!rigid} onClick={() => setRigid(false)}><Move size={14} />局部变形</button><button aria-pressed={rigid} onClick={() => setRigid(true)}><Layers size={14} />刚体平移</button></div>
      <ConceptScene3D scene={{ kind: 'strain', rigid, axialPercent, shear, tx, ty, onAxial: setAxialPercent, onShear: setShear, onTranslate: (x, y) => { setTx(x); setTy(y); } }} label={`${rigid ? '刚体平移' : '单元变形'}，轴向应变 ${(result.ex*100).toFixed(2)}%，剪应变 ${result.gamma.toFixed(3)} rad`} caption={rigid ? '实际比例 · 拖动 C 点平移' : '变形放大 ×8 · 拖动 B、D 调节'} />
    </ConceptStudyShell>;
  }

  const selected = forms.find(item=>item.id===form)!;
  const amount = amplitude * phase / 100;
  return <ConceptStudyShell title="变形基本形式" subtitle="观察四种基本变形的形态、内力与几何特征" actions={commonActions}
    controls={<><StudySlider label="演示幅度" value={amplitude} min={0} max={100} step={1} unit="%" onChange={value=>{setAmplitude(value);if(!playing){setPhase(1);animationElapsed.current=0;}}} /><button className="study-play" disabled={window.matchMedia('(prefers-reduced-motion: reduce)').matches} title={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '已启用减少动画，可拖动演示幅度观察' : undefined} aria-pressed={playing} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={15}/>:<Play size={15}/>}<span>{playing?'暂停演示':'播放演示'}</span></button><span className="study-control-hint">幅度用于观察形态，不代表材料应变</span></>}
    analysis={<>
      <section className="result-panel">
        <div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">几何演示</span></div>
        <AnalysisReadout label="当前演示幅度" value={(amount * 100).toFixed(0)} unit="%" />
        <AnalysisSecondary label="对应内力" value={selected.symbol} />
        <AnalysisPair><AnalysisCard label="几何特征" value={selected.key} text /><AnalysisCard label="演示状态" value={playing ? '连续演示' : '静态观察'} accent text /></AnalysisPair>
        <div className="result-model-note"><div className="analysis-meta-row"><span>当前变形形式</span><span>{selected.title}</span></div><p>演示幅度用于观察形态，不等同于材料实际应变。</p></div>
      </section>
      <section className="study-geometry-reading">
        <div className="analysis-panel-heading"><h3>几何观察</h3></div>
        <dl><div><dt>轴线</dt><dd>{form === 'bending' ? '轴线由直线变成曲线' : '轴线保持直线'}</dd></div><div><dt>截面</dt><dd>{form === 'torsion' ? '绕杆轴发生相对转动' : form === 'bending' ? '随轴线切向发生转动' : form === 'shear' ? '相邻材料层发生错动' : '沿杆轴方向伸长'}</dd></div><div><dt>材料线</dt><dd>{form === 'bending' ? '一侧伸长，另一侧缩短' : form === 'torsion' ? '随截面转角沿杆长扭曲' : form === 'shear' ? '原来的直角发生改变' : '轴向材料线长度增加'}</dd></div></dl>
        <p>{selected.explanation}</p>
      </section>
    </>}
    reference={<>
      <div className="reference-formulas"><div><span>{selected.key}</span><LatexRenderer formula={selected.formula} /></div></div>
      <p className="reference-assumption">几何教学示意；箭头表达作用形式，不表示实际载荷大小。定量分析需另行给定材料、截面和约束条件。</p>
    </>}
    theory={<FormTheory form={form} amount={amount} title={selected.title} symbol={selected.symbol} formula={selected.formula} explanation={selected.explanation} />}>
    <div className="overview-observation-tabs study-form-tabs" role="group" aria-label="基本变形形式">{forms.map(item=><button key={item.id} aria-pressed={form===item.id} onClick={()=>setForm(item.id)}>{item.title}</button>)}</div>
    <ConceptScene3D scene={{ kind: 'forms', form, amount }} label={`${selected.title}几何示意，演示幅度 ${(amount*100).toFixed(0)}%`} caption="几何教学示意 · 载荷方向示意" />
  </ConceptStudyShell>;
}
