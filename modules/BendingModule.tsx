import {bendingFormulas} from '../mechanics/formulaExplanations';
import {FormulaList} from '../components/FormulaCard';
import React from 'react';
import { MoveVertical } from 'lucide-react';
import { calculateBendingTeaching } from '../mechanics/calculations';
import { InvalidCalculation } from '../components/CalculationNotice';
import { LatexRenderer } from '../components';
import { AnalysisRail, AnalysisReadout, AnalysisSecondary, AnalysisPair, AnalysisCard } from '../components/AnalysisRail';
import { TheoryLesson, TheoryRelation, TheoryArrow } from '../components/TheoryLesson';
import { BendingControlDock } from '../components/BendingControlDock';
import { BendingScene } from '../components/BendingScene';
import { BeamSupportSymbol } from '../components/BeamSupportSymbol';
import { BendingResultPlot } from '../components/BendingResultPlot';
import { bendingProfile } from '../graphics/bendingGeometry';
import { SimulationState, DEFAULT_STATE } from '../types';

export const BendingModule = ({state,onChange}:{state:SimulationState;onChange:(s:Partial<SimulationState>)=>void}) => {
  const result=calculateBendingTeaching({materialName:state.materialName,yieldStrength:state.materialYield,load:state.bendLoad,length:state.bendLength,position:state.bendLoadPos,modulus:state.bendModulus,section:state.bendSection});
  if(result.ok === false)return <InvalidCalculation diagnostics={result.diagnostics} onReset={()=>onChange({bendLoad:DEFAULT_STATE.bendLoad,bendLength:DEFAULT_STATE.bendLength,bendLoadPos:DEFAULT_STATE.bendLoadPos,bendModulus:DEFAULT_STATE.bendModulus,bendSection:DEFAULT_STATE.bendSection})}/>;
  const format=(value:number,digits=3)=>Math.abs(value)>=10000?value.toExponential(2):value.toFixed(digits);
  const v=result.values,field={load:state.bendLoad,lengthMm:v.L_mm,positionMm:v.a_mm,modulusMPa:v.E_MPa,inertia:v.inertia};
  const profile=bendingProfile(state.bendSection);
  const {extrapolated,phase:status,notice}=v;
  const scope=[...result.assumptions,...result.warnings].join(' ');
  const formulas=bendingFormulas(state,v);
  const theory=<TheoryLesson context="梁的弯曲" first="内力决定应力" second="刚度决定挠度" lead="同一简支梁，用受力、截面与材料把弯矩、纤维应力和整条挠曲线联系起来。"
    diagram={<svg viewBox="0 0 280 145" role="img" aria-label="简支梁集中载荷、上压下拉与弹性中性轴"><path d="M25 62Q140 88 255 62L255 83Q140 110 25 83Z" fill="#68b5ee1a" stroke="#8ec9f5"/><path d="M25 73Q140 99 255 73" fill="none" stroke="#95dcca" strokeDasharray="4 4"/><TheoryArrow x1={140} y1={15} x2={140} y2={65}/><text x="151" y="33">P</text><BeamSupportSymbol kind="pinned" x={25} y={83} size={.8}/><BeamSupportSymbol kind="roller" x={255} y={83} size={.8}/><text x="25" y="128" textAnchor="middle">A</text><text x="255" y="128" textAnchor="middle">B</text><text x="140" y="56" textAnchor="middle">上缘受压</text><text x="140" y="125" textAnchor="middle">下缘受拉</text></svg>}
    caption="A 为铰支座，B 为滚动支座。正弯矩区上压下拉，反向载荷时受拉、受压位置对换。"
    readings={[{label:'最大弯矩绝对值',value:(Math.abs(v.maxMoment)/1000).toFixed(3),unit:'kN·m'},{label:'最大挠度绝对值',value:Math.abs(v.maxDeflection).toFixed(3),unit:'mm',accent:true}]} formulas={formulas} scope={scope}>
    <TheoryRelation title="同一载荷，材料决定变形"><p>当前 {state.materialName} 的 E={state.bendModulus} GPa。保持截面与载荷不变，挠度与 E 成反比；静定梁的反力和弯矩不随 E 改变。</p></TheoryRelation>
    <TheoryRelation title="截面高度影响刚度"><p>当前 Iz={(v.inertia/1e4).toFixed(2)} cm⁴。矩形截面 Iz=bh³/12，高度翻倍时挠度降为八分之一。三维截面轮廓与计算尺寸保持一致。</p></TheoryRelation>
    <TheoryRelation title="最大挠度与加载点分开看"><p>加载点挠度为 {v.deflectionAtLoad.toFixed(3)} mm；全梁最大绝对挠度为 {Math.abs(v.maxDeflection).toFixed(3)} mm，位置 x={(v.maxDeflectionPosition/1000).toFixed(3)} m。</p></TheoryRelation>
    <TheoryRelation title="弹性模型的边界"><p>{extrapolated?'当前只显示线弹性外推结果，不能据此判断真实塑性变形或断裂。':'采用均匀材料、等截面与小挠度假设。'} 混凝土开裂、复合材料方向性、剪切变形和塑性铰均未纳入该模型。</p></TheoryRelation>
  </TheoryLesson>;
  return <div className="fundamentals-lab taste-lab axial-lab bending-lab">
    <div className="axial-workbench-heading"><div className="bending-workbench-context"><MoveVertical size={15}/><span>简支梁</span><i/><span>集中载荷</span></div><div className="axial-specimen-summary"><span>{state.materialName} · {profile.label}</span><span>E {state.bendModulus} GPa</span><span>Iz {(v.inertia/1e4).toFixed(1)} cm⁴</span><span>L {state.bendLength} m</span></div></div>
    <div className="fundamentals-grid axial-grid bending-grid"><div className="fundamentals-main">
      <BendingScene field={field} section={state.bendSection} material={state.materialName} status={status} notice={notice} geometryAvailable={v.geometryAvailable} extrapolated={extrapolated}/>
      <BendingControlDock state={state} onChange={onChange}/>
    </div><AnalysisRail title="梁的弯曲" className="axial-analysis bending-analysis" theory={theory} reference={<>
      <FormulaList formulas={formulas}/>
      <dl className="reference-geometry"><div><dt>惯性矩 Iz</dt><dd>{v.inertia.toExponential(4)} mm⁴</dd></div><div><dt>最大边缘距离</dt><dd>{v.yMax===null?'—（缺少边缘几何）':`${v.yMax.toFixed(2)} mm`}</dd></div><div><dt>弯曲应变能</dt><dd>{v.energyApplicable?`${(v.strainEnergy/1000).toFixed(4)} J`:'未验证适用性'}</dd></div><div><dt>最大应变能密度</dt><dd>{v.energyApplicable&&v.maxStrainEnergyDensity!==null?`${(v.maxStrainEnergyDensity*1000).toFixed(4)} kJ/m³`:'—（未验证）'}</dd></div></dl><p className="reference-assumption">{scope}</p>
    </>} analysis={<>
      <section className="result-panel"><div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">{status}</span></div>
        <AnalysisReadout label={extrapolated?"EB参考挠度 |w|max":"最大挠度 |w|max"} value={format(Math.abs(v.maxDeflection))} unit="mm"/>
        <AnalysisSecondary label="最大挠度位置 x" value={(v.maxDeflectionPosition/1000).toFixed(3)} unit="m"/>
        <AnalysisPair><AnalysisCard label="最大弯矩 |M|max" value={(Math.abs(v.maxMoment)/1000).toFixed(3)} unit="kN·m"/><AnalysisCard label="边缘应力 |σ|max" value={v.maxStress===null?'—':v.maxStress.toFixed(2)} unit="MPa" accent/></AnalysisPair>
        <dl className="bending-secondary-readings">{v.spanDepthRatio!==null&&<div><dt>跨度 / 截面高</dt><dd>{v.spanDepthRatio.toFixed(2)}</dd></div>}<div><dt>左支反力 RA</dt><dd>{(v.R1/1000).toFixed(3)} <small>kN</small></dd></div><div><dt>右支反力 RB</dt><dd>{(v.R2/1000).toFixed(3)} <small>kN</small></dd></div><div><dt>加载点挠度 w(a)</dt><dd>{v.deflectionAtLoad.toFixed(3)} <small>mm</small></dd></div></dl>
        <p className="bending-model-note">{notice}。{!profile.schematic&&'图形倍率只影响显示，计算数值不放大。'}</p>
      </section><BendingResultPlot field={field}/>
    </>}/></div>
  </div>;
};
