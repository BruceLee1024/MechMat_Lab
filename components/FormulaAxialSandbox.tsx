import React from 'react';
import {Calculator,RotateCcw} from 'lucide-react';
import {NumericInput} from './NumericInput';
import {LatexRenderer} from './LatexRenderer';
import {formulaAxialSteps} from '../mechanics/formulaAxialSteps';
import {FORMULA_AXIAL_MATERIALS,type FormulaAxialInput,type FormulaAxialResult} from '../mechanics/formulaAxial';

export function FormulaAxialSandbox({input,result,onChange,onReset,focus='stress'}:{focus?:'stress'|'deformation'|'energy';input:FormulaAxialInput;result:FormulaAxialResult;onChange:(patch:Partial<FormulaAxialInput>)=>void;onReset:()=>void}){
  const material=FORMULA_AXIAL_MATERIALS.find(m=>m.name===input.materialName)!;
  const values=result.ok?result.values:null;
  const title=focus==='deformation'?'轴向变形':focus==='energy'?'轴向应变能':'正应力';
  return <section className="fw-sandbox" aria-label={`${title}实时计算`}>
    <header><span><Calculator size={16}/>参数计算</span><button type="button" onClick={onReset} aria-label={`重置${title}参数`}><RotateCcw size={13}/>重置</button></header>
    <label className="fw-material-field">材料参考参数<select aria-label="计算材料" value={input.materialName} onChange={e=>onChange({materialName:e.target.value})}>{FORMULA_AXIAL_MATERIALS.map(m=><option key={m.name} value={m.name}>{m.name}</option>)}</select></label>
    <p className="fw-material-meta">E {material.E} GPa <span>σy {material.yield} MPa</span></p>
    <div className="fw-sandbox-inputs"><NumericInput label="轴力 N" value={input.forceKN} unit="kN" domain="signed" onChange={forceKN=>onChange({forceKN})}/><input type="range" aria-label="轴力滑块" min={Math.min(-150,input.forceKN)} max={Math.max(250,input.forceKN)} step="1" value={input.forceKN} onChange={e=>onChange({forceKN:Number(e.target.value)})}/><div className="fw-range-labels"><span>压缩</span><span>拉伸</span></div>
      <div className="fw-mode-switch" role="group" aria-label="截面输入方式"><button type="button" aria-pressed={input.mode==='diameter'} onClick={()=>onChange({mode:'diameter',diameter:values?Math.sqrt(4*values.area/Math.PI):input.diameter})}>圆截面 d</button><button type="button" aria-pressed={input.mode==='area'} onClick={()=>onChange({mode:'area',area:values?.area??input.area})}>直接面积 A</button></div>
      {input.mode==='diameter'?<><NumericInput label="直径 d" value={input.diameter} unit="mm" domain="positive" onChange={diameter=>onChange({diameter})}/><input type="range" aria-label="直径滑块" min={Math.min(5,input.diameter)} max={Math.max(60,input.diameter)} step=".5" value={input.diameter} onChange={e=>onChange({diameter:Number(e.target.value)})}/></>:<NumericInput label="截面积 A" value={input.area} unit="mm²" domain="positive" onChange={area=>onChange({area})}/>}
      <div className="fw-area-output"><span>当前截面积 A</span><strong>{values?values.area.toFixed(2):'—'} <small>mm²</small></strong></div>
      <NumericInput label="原长 L" value={input.lengthMm} unit="mm" domain="positive" onChange={lengthMm=>onChange({lengthMm})}/>
    </div>
    {result.ok===false?<p role="alert" className="fw-error">{result.diagnostics.map(d=>d.message).join('；')}</p>:<section className="fw-live-results" aria-label={`当前${title}计算结果`}>
      <div className="fw-stress-output"><span>{focus==='deformation'?'伸长量 ΔL':focus==='energy'?'应变能密度 u':'正应力 σ'}</span><output>{focus==='energy'&&!values!.energyApplicable?'—':(focus==='deformation'?values!.deformation:focus==='energy'?values!.strainEnergyDensityKJ:values!.stress).toFixed(focus==='deformation'?4:2)} <small>{focus==='deformation'?'mm':focus==='energy'?'kJ/m³':'MPa'}</small></output><span className={values!.extrapolated?'fw-extrapolated':'fw-linear'}>{values!.extrapolated?'达到或超过参考屈服 · 弹性外推':'线弹性参考'}</span></div>
      <dl>{focus!=='stress'&&<div><dt>正应力 σ</dt><dd>{values!.stress.toFixed(4)} MPa</dd></div>}{focus==='energy'&&<div><dt>杆件总应变能 U</dt><dd>{values!.energyApplicable?`${values!.totalStrainEnergyJ.toFixed(4)} J`:'—（弹性外推）'}</dd></div>}<div><dt>参考屈服比 σy / |σ|</dt><dd>{values!.referenceRatio===null?(values!.stress===0?'—（零载荷）':'—（极小应力）'):values!.referenceRatio.toFixed(2)}</dd></div><div><dt>轴向应变 ε</dt><dd>{(values!.strain*100).toFixed(4)} %</dd></div><div><dt>伸长量 ΔL</dt><dd>{values!.deformation.toFixed(4)} mm</dd></div><div><dt>应变能密度 u</dt><dd>{values!.energyApplicable?`${values!.strainEnergyDensityKJ.toFixed(2)} kJ/m³`:'—（弹性外推）'}</dd></div></dl>
      <div className="fw-substitution"><span>当前参数代入 · N、mm、MPa</span>{formulaAxialSteps(input,result,focus==='energy').map(step=><LatexRenderer key={step.label} label={step.ariaLabel} formula={step.formula}/>)}</div>
      {focus!=='stress'&&<p className="fw-model-note">{focus==='energy'?'当前算例只计等截面轴向杆应变能；弯曲与扭转能量须使用各自内力、刚度与沿程积分。':'当前为等截面、无温度变化的轴向杆；阶梯杆、自重与温度约束公式需另配相应载荷条件。'}</p>}
      <p className="fw-rounding-note">代入保留 8 位有效数字，计算使用完整值。</p><p className="fw-model-note">{values!.extrapolated?'应变与伸长为弹性外推，不表示真实塑性响应。参考屈服比不是设计安全系数。':'均匀直杆的小变形线弹性参考；压缩时未验算稳定性。参考屈服比不是设计安全系数。'}</p>
    </section>}
  </section>;
}
