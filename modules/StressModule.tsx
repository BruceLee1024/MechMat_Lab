import {stressFormulas} from '../mechanics/formulaExplanations';
import {FormulaList} from '../components/FormulaCard';
import React from 'react';
import {Cuboid,CircleDot} from 'lucide-react';
import {calculatePlaneStress} from '../mechanics/calculations';
import {stressNumber as num,stressAngle180} from '../mechanics/stressState';
import {AnalysisRail,AnalysisReadout,AnalysisPair,AnalysisCard} from '../components/AnalysisRail';
import {TheoryLesson,TheoryRelation,TheoryArrow} from '../components/TheoryLesson';
import {InvalidCalculation} from '../components/CalculationNotice';
import {StressElementScene} from '../components/StressElementScene';
import {StressMohrCircle} from '../components/StressMohrCircle';
import {StressControlDock} from '../components/StressControlDock';
import {LatexRenderer} from '../components';
import {DEFAULT_STATE,type SimulationState} from '../types';
export function StressModule({state:s,onChange}:{state:SimulationState;onChange:(s:Partial<SimulationState>)=>void}) {
  const result=calculatePlaneStress({sigmaX:s.stressSigX,sigmaY:s.stressSigY,tauXY:s.stressTauXY,angle:s.stressAngle});
  if(result.ok===false)return <InvalidCalculation diagnostics={result.diagnostics} onReset={()=>onChange({stressSigX:DEFAULT_STATE.stressSigX,stressSigY:DEFAULT_STATE.stressSigY,stressTauXY:DEFAULT_STATE.stressTauXY,stressAngle:0})}/>;
  const angle=s.stressAngle>=0&&s.stressAngle<=180?s.stressAngle:stressAngle180(s.stressAngle);
  const v=result.values,onAngle=(n:number)=>onChange({stressAngle:n}),angleLabel=v.principalAngle===null?'任意方向':`${num(v.principalAngle)}°`;
  const formulas=stressFormulas(s,v);
  const theory=<TheoryLesson context="应力状态" first="旋转截面，改变分量" second="同一点的应力状态保持不变" lead="单元体上的箭头、莫尔圆状态点和右侧读数来自同一次应力变换。" diagram={<svg viewBox="0 0 280 150" role="img" aria-label="正剪应力符号与旋转截面方向"><g transform="translate(103 75) rotate(-22)"><rect x="-32" y="-32" width="64" height="64" fill="#80bdf01b" stroke="#9ccaf2"/><TheoryArrow x1={32} y1={0} x2={68} y2={0}/><TheoryArrow x1={-32} y1={0} x2={-68} y2={0}/><path d="M43 22V-22M-43-22V22M-22-43H22M22 43H-22" stroke="#c7ace1" strokeWidth="2" fill="none"/></g><text x="192" y="58">σ 拉为正</text><text x="192" y="82">τ 剪应力互等</text><path d="M65 127H144M65 127L137 100" stroke="#94ddc8"/><text x="100" y="119">θ</text></svg>} caption="正τxy在+x面沿+y，在+y面沿+x，负面箭头反向。三维模型的z面无牵引，不展示材料形变。" readings={[{label:'当前截面 θ',value:num(angle),unit:'°'},{label:'最大面内主应力方向',value:angleLabel,accent:true}]} formulas={formulas} scope={result.assumptions.join(' ')}>
    <TheoryRelation title="截面转θ，圆上转2θ"><p>采用莫尔圆 τ 轴向上为正。X′=(σx′,τx′y′)，Y′=(σy′,−τx′y′)，两点始终是直径两端。θ 逆时针增加时，圆上状态点顺时针转 2θ。拖动 X′ 可反向控制截面。</p></TheoryRelation>
    <TheoryRelation title="主平面上剪应力为零"><p>{v.principalAngle===null?'当前圆半径为零，面内正应力各向相同，主方向不唯一。':`转至 θ=${angleLabel}，x′面正应力达到面内最大主应力 ${num(v.sig1)} MPa，剪应力为零。最大剪切平面与主平面相差45°。`} 截面旋转不改变圆心、半径和主应力。</p></TheoryRelation>
    <TheoryRelation title="面内最大剪应力与空间值要分开"><p>蓝色主圆半径 R={num(v.R)} MPa，仅表示面内最大剪应力。平面应力另有一个零主应力：空间主应力为 {num(v.principalMax)}、{num(v.principalMid)}、{num(v.principalMin)} MPa，空间最大剪应力为 {num(v.absoluteMaxShear)} MPa。等双向拉伸时，面内圆会退化，但空间最大剪应力仍可非零。</p></TheoryRelation>
    <TheoryRelation title="单元体是受力表达，不是变形模拟"><p>只输入 σx、σy、τxy，不引入材料刚度；箭头大小使用同一应力比例尺，正应力拉出、负应力压入，互等剪应力成对出现。相机旋转与截面方位 θ 独立，观察角度不进入计算。</p></TheoryRelation>
  </TheoryLesson>;
  return <div className="fundamentals-lab taste-lab axial-lab stress-lab"><div className="axial-workbench-heading"><div className="stress-workbench-label"><Cuboid size={15}/><span>平面应力单元体</span><i/><CircleDot size={14}/><small>莫尔圆联动</small></div><div className="axial-specimen-summary"><span>拉为正 · 逆时针 θ</span><span>σz = τyz = τzx = 0</span></div></div><div className="fundamentals-grid axial-grid stress-grid"><div className="fundamentals-main"><StressElementScene values={v} angle={angle}/><StressControlDock state={{...s,stressAngle:angle}} values={v} onChange={onChange}/></div><AnalysisRail title="应力状态" className="stress-analysis" theory={theory} reference={<><FormulaList formulas={formulas}/><p className="reference-assumption">{result.assumptions.join(' ')}</p></>} analysis={<><section className="result-panel stress-current-results"><div className="analysis-panel-heading"><h3>当前截面应力</h3><span className="result-model-status">θ {num(angle)}°</span></div><AnalysisReadout label="x′ 面正应力 σx′" value={num(v.sigX_prime)} unit="MPa"/><AnalysisPair><AnalysisCard label="y′ 面正应力 σy′" value={num(v.sigY_prime)} unit="MPa" accent/><AnalysisCard label="互等剪应力 τx′y′" value={num(v.tauXY_prime)} unit="MPa"/></AnalysisPair></section><StressMohrCircle values={v} angle={angle} tauXY={s.stressTauXY} onAngle={onAngle}/><section className="stress-principals" aria-label="应力不变量与极值"><h3>不随截面旋转改变</h3><dl><div><dt>面内主应力 σⅠ / σⅡ</dt><dd>{num(v.sig1)} / {num(v.sig2)} <small>MPa</small></dd></div><div><dt>面内最大剪应力 R</dt><dd>{num(v.R)} <small>MPa</small></dd></div><div><dt>最大面内主应力方向</dt><dd>{angleLabel}</dd></div><div><dt>空间最大剪应力</dt><dd>{num(v.absoluteMaxShear)} <small>MPa</small></dd></div></dl><p>空间值包含零主应力；蓝色莫尔圆只描述 x–y 面内变换。</p></section></>}/></div></div>;
}
