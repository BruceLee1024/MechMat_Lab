import {LoadControl} from './ControlConsole';
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, Settings2, X } from 'lucide-react';
import { MaterialSelector, SectionSelector } from '../components';
import { NumericInput } from './NumericInput';
import { SimulationState } from '../types';
import { getAxialMaterialResponse } from '../mechanics/axialResponse';

export function ExperimentControls({ state, onChange, strain, valid, control = 'strain' }: {
  state: SimulationState;
  onChange: (value: Partial<SimulationState>) => void;
  strain: number;
  valid: boolean;
  control?: 'strain' | 'force' | 'bending';
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const forceMode = control !== 'strain';
  const bendingMode = control === 'bending';
  const materialResponse = getAxialMaterialResponse({ materialName: state.materialName, modulus: state.bendModulus, yieldStrength: state.materialYield });
  const loadValue = forceMode ? (bendingMode ? state.bendLoad : state.axialForce) / 1000 : Number((strain * 100).toFixed(6));
  const maximum = forceMode ? Math.max(50, Math.ceil(Math.abs(loadValue) / 10) * 10) : .2;
  const minimum = bendingMode ? -maximum : 0;
  const step = bendingMode ? .1 : forceMode ? 1 : .001;
  const unit = forceMode ? 'kN' : '%';
  const label = bendingMode ? '集中载荷 P' : forceMode ? '轴向拉力 F' : '轴向应变 ε';
  const changeLoad = (value: number) => onChange(bendingMode ? { bendLoad: value * 1000 } : { axialForce: forceMode ? value * 1000 : value / 100 * state.bendModulus * 1000 * state.axialArea });
  useEffect(() => {
    if (settingsOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!settingsOpen && dialog.current?.open) dialog.current.close();
  }, [settingsOpen]);

  return <>
    <section className={`parameter-panel experiment-control-dock control-console control-quick-strip${bendingMode ? ' bending-loading-strip' : ''}`} aria-label="实验参数控制">
      <header className="control-console-heading"><span><SlidersHorizontal size={14}/>加载控制</span><button className="control-settings" aria-haspopup="dialog" onClick={()=>setSettingsOpen(true)}><Settings2 size={14}/>试件设置</button></header>
      <LoadControl unloadLabel={control==='force'?'载荷回零':undefined} label={label} rangeLabel={bendingMode?'集中载荷滑块':forceMode?'轴向拉力滑块':'轴向应变滑块'} value={loadValue} unit={unit} minimum={minimum} maximum={maximum} inputMaximum={forceMode?undefined:.2} step={step} precision={forceMode?2:3} direction={bendingMode?'向下为正':'拉伸为正'} disabled={!valid} onChange={changeLoad}/>
      {bendingMode && <div className="bending-position-control"><NumericInput label="载荷位置 a" compact value={state.bendLoadPos} unit="m" domain="nonnegative" maximum={state.bendLength} onChange={v => onChange({ bendLoadPos: v })} /><input type="range" aria-label="载荷位置滑块" min={0} max={state.bendLength} step={state.bendLength/200} value={state.bendLoadPos} onChange={e => onChange({ bendLoadPos:Number(e.target.value) })} /><button onClick={() => onChange({ bendLoadPos:state.bendLength/2 })}>跨中加载</button></div>}
    </section>
    {createPortal(<dialog ref={dialog} className="specimen-dialog" aria-labelledby={titleId} onCancel={() => setSettingsOpen(false)} onClose={() => setSettingsOpen(false)}
      onClick={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
      <div className="specimen-sheet">
        <header className="specimen-header"><div><span className="specimen-eyebrow">实验设置</span><h2 id={titleId}>材料与试件</h2></div><button autoFocus aria-label="关闭试件设置" onClick={() => setSettingsOpen(false)}><X size={18} /></button></header>
        <div className="specimen-body">
          <section className="specimen-material"><h3>材料属性</h3>
            <MaterialSelector currentName={forceMode ? state.materialName : undefined} currentE={state.bendModulus} currentYield={state.materialYield} currentPoisson={state.poissonRatio}
              onSelect={m => onChange({ materialName: m.name, bendModulus: m.E, materialYield: m.yield, poissonRatio: m.poisson })} />
            <div className="specimen-fields">
              <NumericInput label="弹性模量 E" value={state.bendModulus} unit="GPa" onChange={v => onChange({ bendModulus: v, ...(forceMode ? { materialName: '自定义材料' } : {}) })} />
              {forceMode ? <NumericInput label={materialResponse.referenceLabel} value={state.materialYield} unit="MPa" onChange={v => onChange({ materialYield: v, materialName: '自定义材料' })} /> : <NumericInput label="泊松比 ν" value={state.poissonRatio} domain="nonnegative" validate={v => v >= .5 ? '泊松比必须小于 0.5' : null} onChange={v => onChange({ poissonRatio: v })} />}
            </div>
            {forceMode && !bendingMode && <p className="specimen-model-hint">{materialResponse.name} · {materialResponse.label}。{materialResponse.description}</p>}
            {!forceMode && <div className="specimen-yield"><span>参考屈服强度</span><span>{state.materialYield} <small>MPa</small></span></div>}
          </section>
          <section className="specimen-geometry"><h3>试件尺寸</h3><div className="specimen-fields">
            {bendingMode ? <NumericInput label="梁跨度 L" value={state.bendLength} unit="m" onChange={v => onChange({ bendLength:v })} /> : <><NumericInput label="原长 L₀" value={state.axialLength * 1000} unit="mm" onChange={v => onChange({ axialLength: v / 1000 })} />
            <NumericInput label="截面积 A₀" value={state.axialArea} unit="mm²" onChange={v => onChange({ axialArea: v })} /></>}
          </div>{bendingMode && <div className="bending-section-settings"><SectionSelector section={state.bendSection} onChange={section => onChange({ bendSection:section })} /><p className="specimen-model-hint">梁变形按当前 E 与 Iz 的线弹性模型计算，不包含塑性铰、混凝土开裂或材料损伤。</p></div>}</section>
        </div>
        <footer className="specimen-footer"><span>修改后实时更新实验</span><button onClick={() => setSettingsOpen(false)}>完成设置</button></footer>
      </div>
    </dialog>, document.body)}
  </>;
}
