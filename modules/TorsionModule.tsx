import {torsionFormulas} from '../mechanics/formulaExplanations';
import {FormulaList} from '../components/FormulaCard';
import React from 'react';
import {Rotate3D} from 'lucide-react';
import {calculateTorsionTeaching} from '../mechanics/calculations';
import {torsionStation,type TorsionField} from '../mechanics/torsionField';
import {InvalidCalculation} from '../components/CalculationNotice';
import {AnalysisRail,AnalysisReadout,AnalysisSecondary,AnalysisPair,AnalysisCard} from '../components/AnalysisRail';
import {TheoryLesson,TheoryRelation} from '../components/TheoryLesson';
import {LatexRenderer} from '../components';
import {TorsionScene} from '../components/TorsionScene';
import {TorsionControlDock} from '../components/TorsionControlDock';
import {TorsionResultPlot} from '../components/TorsionResultPlot';
import {SimulationState,DEFAULT_STATE} from '../types';
export const TorsionModule=({state:s,onChange}:{state:SimulationState;onChange:(s:Partial<SimulationState>)=>void})=>{
  const result=calculateTorsionTeaching({materialName:s.materialName,yieldStrength:s.materialYield,torque:s.torqTorque,radius:s.torqRadius,length:s.torqLength,modulus:s.torqModulus,loadRatio:s.torqLoadRatio});
  if(result.ok===false)return <InvalidCalculation diagnostics={result.diagnostics} onReset={()=>onChange({torqTorque:DEFAULT_STATE.torqTorque,torqRadius:DEFAULT_STATE.torqRadius,torqLength:DEFAULT_STATE.torqLength,torqModulus:DEFAULT_STATE.torqModulus,torqLoadRatio:DEFAULT_STATE.torqLoadRatio,materialYield:DEFAULT_STATE.materialYield})}/>;
  const v=result.values,field:TorsionField={torqueNm:s.torqTorque,radiusMm:s.torqRadius,lengthMm:v.L_total_mm,modulusMPa:v.G_MPa,loadRatio:s.torqLoadRatio};
  const c=torsionStation(field,v.L_total_mm),scope=[...result.assumptions,...result.warnings].join(' ');
  const f=(x:number,d=3)=>Math.abs(x)>1e5?x.toExponential(2):x.toFixed(d);
  const formulas=torsionFormulas(s,v);
  const theory=<TheoryLesson context="圆轴扭转" first="扭矩决定切应力" second="GJ 决定转角梯度" lead="沿轴看分段扭矩，沿半径看切应力；表面母线的旋转角与右侧计算使用同一组参数。" diagram={<svg viewBox="0 0 280 142" role="img" aria-label="实心圆轴分流扭矩与截面相对转动"><path d="M25 48Q140 40 255 58V92Q140 74 25 84Z" fill="#7ec8ff17" stroke="#8ecaf3"/><ellipse cx="25" cy="66" rx="8" ry="18" fill="none" stroke="#a1d8f4"/><ellipse cx="255" cy="75" rx="8" ry="18" fill="none" stroke="#a1d8f4"/><path d="M25 48Q140 61 255 92" stroke="#9de5ce" fill="none"/><path d="M140 47V85" stroke="#c3abe4" strokeDasharray="3 3"/><text x="25" y="114" textAnchor="middle">A 输入</text><text x="140" y="114" textAnchor="middle">B 分流</text><text x="248" y="114" textAnchor="middle">C 输出</text><text x="140" y="28" textAnchor="middle">φ 连续，转角梯度分段改变</text></svg>} caption="A 仅为角度参考；三个外扭矩平衡，未设置固定端。圆截面保持平面与圆形，扭转由母线和角度标记显示。" readings={[{label:'B 相对 A',value:f(v.phi_AB_rad*180/Math.PI),unit:'°'},{label:'C 相对 A',value:f(v.phi_total_deg),unit:'°',accent:true}]} formulas={formulas} scope={scope}>
    <TheoryRelation title="材料改变转角，不改变静力扭矩"><p>当前 {s.materialName} 的 G={s.torqModulus} GPa。相同尺寸与扭矩下，φ 与 G 成反比；切应力与 G 无关。</p></TheoryRelation>
    <TheoryRelation title="半径的四次方效应"><p>当前 r={s.torqRadius} mm，J={f(v.Ip/1e4,2)} cm⁴。同轴长与工况下，半径翻倍使转角降至1/16，表面切应力降至1/8。底部可直接调节半径并对比基准。</p></TheoryRelation>
    <TheoryRelation title="B 处的转角不会跳变"><p>AB 内扭矩为 {f(v.T_AB_Nm,1)} N·m，BC 为 {f(v.T_BC_Nm,1)} N·m。两段转角累加为 φC；B 处改变的是斜率 T/(GJ)。</p></TheoryRelation>
    <TheoryRelation title="粒子与真实材料运动分开理解"><p>切向粒子用于显示横截面上剪应力的方向和强弱，不代表轴体在持续旋转。表面网格是静态加载后的弹性几何，标注角度未放大。</p></TheoryRelation>
    <TheoryRelation title="线弹性适用范围"><p>{v.shearReference!==null?`延性金属采用 σy/√3=${f(v.shearReference,1)} MPa 作为剪切屈服教学参考。`:'仅采用当前等效 G，不套用金属剪切屈服判据。'} 未模拟塑性、损伤、开裂、非圆截面翘曲或真实破坏；各向异性材料需要额外标定。</p></TheoryRelation>
  </TheoryLesson>;
  return <div className="fundamentals-lab taste-lab axial-lab torsion-lab"><div className="axial-workbench-heading"><div className="bending-workbench-context"><Rotate3D size={15}/><span>传动圆轴</span><i/><span>两段分流</span></div><div className="axial-specimen-summary"><span>{s.materialName} · 实心圆</span><span>G {s.torqModulus} GPa</span><span>r {s.torqRadius} mm</span><span>L {s.torqLength} m</span></div></div>
    <div className="fundamentals-grid axial-grid torsion-grid"><div className="fundamentals-main"><TorsionScene field={field} material={s.materialName} status={v.phase} notice={v.notice} extrapolated={v.extrapolated}/><TorsionControlDock state={s} onChange={onChange}/></div>
      <AnalysisRail title="圆轴扭转" className="axial-analysis torsion-analysis" theory={theory} reference={<><FormulaList formulas={formulas}/><dl className="reference-geometry"><div><dt>极惯性矩 J</dt><dd>{v.Ip.toExponential(4)} mm⁴</dd></div><div><dt>抗扭截面模量 Wp</dt><dd>{(v.Ip/s.torqRadius).toExponential(4)} mm³</dd></div><div><dt>弹性应变能</dt><dd>{v.energyApplicable?`${f(v.U_total_J,4)} J`:'超范围，不作为有效值'}</dd></div><div><dt>最大能量密度</dt><dd>{v.energyApplicable?`${f(v.u_max_density,2)} kJ/m³`:'超范围，不作为有效值'}</dd></div></dl><p className="reference-assumption">{scope}</p></>} analysis={<><section className="result-panel"><div className="analysis-panel-heading"><h3>实时结果</h3><span className="result-model-status">{v.phase}</span></div><AnalysisReadout label={v.extrapolated?'外推转角 φC / A':'相对转角 φC / A'} value={f(v.phi_total_deg)} unit="°"/><AnalysisSecondary label="最大切应力 |τ|max · AB" value={f(v.maxShear,2)} unit="MPa"/><AnalysisPair><AnalysisCard label="AB 段转角" value={f(v.phi_AB_rad*180/Math.PI)} unit="°"/><AnalysisCard label="BC 段转角" value={f(v.phi_BC_rad*180/Math.PI)} unit="°" accent/></AnalysisPair><dl className="bending-secondary-readings"><div><dt>AB 内扭矩</dt><dd>{f(v.T_AB_Nm,1)} <small>N·m</small></dd></div><div><dt>BC 内扭矩</dt><dd>{f(v.T_BC_Nm,1)} <small>N·m</small></dd></div><div><dt>BC 表面切应力</dt><dd>{f(Math.abs(c.surfaceShear),2)} <small>MPa</small></dd></div><div><dt>极惯性矩 J</dt><dd>{f(v.Ip/1e4,2)} <small>cm⁴</small></dd></div>{v.shearReference!==null&&<div><dt>剪切屈服教学参考</dt><dd>{f(v.shearReference,1)} <small>MPa</small></dd></div>}</dl><p className="bending-model-note">{v.notice}。{v.extrapolated?'当前几何仅作弹性外推，不能据此判断真实变形。':'转角以 A 为参考，显示倍率只影响网格与截面角度标记。'}</p></section><TorsionResultPlot field={field}/></>}/>
    </div>
  </div>;
};
