import {ControlTabs} from './ControlConsole';
import React, { useId, useRef, useState } from 'react';
import { ArrowLeftRight, BookmarkPlus, RotateCcw, Shapes, SlidersHorizontal } from 'lucide-react';
import type { SectionProperties, SectionType, SimulationState } from '../types';
import { ExperimentControls } from './ExperimentControls';
import { NumericInput } from './NumericInput';
import { bendingProfile } from '../graphics/bendingGeometry';
import { SECTION_NAMES, sectionDimensions, changeSectionDimension, compareBendingSections, defaultExplorationSection, type DimensionKey } from '../mechanics/sectionExploration';

type Props={state:SimulationState;onChange:(value:Partial<SimulationState>)=>void};
export function BendingControlDock({state,onChange}:Props) {
  const [panel,setPanel]=useState<'load'|'section'>('load');
  const id=useId();
  return <section className="control-console bending-control-console" aria-label="弯曲实验快捷控制">
    <ControlTabs<'load'|'section'> id={id} label="弯曲控制工具" value={panel} onChange={setPanel} items={([['load','加载控制',SlidersHorizontal],['section','截面尺寸',Shapes]] as const)} meta="参数改变后实时计算"/>
    <div className="bending-control-panel" id={`${id}-panel-load`} role="tabpanel" aria-labelledby={`${id}-load`} hidden={panel!=='load'}><ExperimentControls state={state} onChange={onChange} strain={0} valid control="bending"/></div>
    <div className="bending-control-panel" id={`${id}-panel-section`} role="tabpanel" aria-labelledby={`${id}-section`} hidden={panel!=='section'}><SectionExplorer key={state.bendSection.type} state={state} onChange={onChange}/></div>
  </section>;
}

function SectionExplorer({state,onChange}:Props) {
  const section=state.bendSection;
  const [baseline,setBaseline]=useState<SectionProperties>(()=>({...section}));
  const fields=sectionDimensions(section),baseFields=sectionDimensions(baseline);
  const [key,setKey]=useState<DimensionKey>(()=>section.type==='rectangle'?'height':section.type==='custom'?'customIz':section.type==='composite'?'comp2Height':fields.find(f=>/Height|height/.test(f.key))?.key??fields[0].key);
  const active=fields.find(f=>f.key===key)??fields[0],baseValue=baseFields.find(f=>f.key===active.key)?.value??active.value;
  const maximum=Math.min(active.maximum??Infinity,Math.max(baseValue*2,active.value*1.05,baseValue===0?20:0,active.minimum*2));
  const comparison=compareBendingSections(state,baseline);
  const same=fields.every(f=>Math.abs(f.value-(baseFields.find(b=>b.key===f.key)?.value??NaN))<1e-9*Math.max(1,f.value));
  const update=(dimension:DimensionKey,value:number)=>{const next=changeSectionDimension(section,dimension,value);if(next)onChange({bendSection:next});};
  const percentage=(value:number|null)=>value===null?'—':`${value>0?'+':''}${Math.abs(value)<.05?'0.0':value.toFixed(1)}%`;
  return <div className="section-explorer">
    <div className="section-explorer-heading"><label><span className="sr-only">快捷选择截面类型</span><select aria-label="快捷选择截面类型" value={section.type} onChange={e=>onChange({bendSection:defaultExplorationSection(e.target.value as SectionType)})}>{Object.entries(SECTION_NAMES).map(([type,name])=><option value={type} key={type}>{name}</option>)}</select></label>
      <span className="section-reference-label">同材料、载荷和跨度对比</span>
      <div><button title="将当前截面设为新的对比基准" aria-label="设为截面对比基准" disabled={same} onClick={()=>setBaseline({...section})}><BookmarkPlus size={12}/><span>设为基准</span></button><button aria-label="恢复基准截面" disabled={same} onClick={()=>onChange({bendSection:{...baseline}})}><RotateCcw size={12}/><span>恢复</span></button></div>
    </div>
    <div className="section-explorer-body">
      <SectionComparisonFigure section={section} baseline={baseline} active={active.key} onSelect={setKey} onChange={update}/>
      <div className="section-explorer-controls"><div className="section-dimension-choices" role="group" aria-label="选择要调节的截面尺寸">{fields.map(field=><button key={field.key} aria-pressed={field.key===active.key} onClick={()=>setKey(field.key)}>{field.label}</button>)}</div>
        <div className="section-dimension-value"><NumericInput compact label={active.label} unit={active.unit} value={active.value} minimum={active.minimum} maximum={active.maximum} domain="nonnegative" displayDecimals={active.unit==='mm'?1:0} validate={value=>changeSectionDimension(section,active.key,value)?null:'尺寸与其余截面参数不相容'} onChange={value=>update(active.key,value)}/>
          <div className="section-size-presets" role="group" aria-label="相对基准尺寸的倍率">{[.5,1,1.5,2].map(factor=><button key={factor} disabled={!changeSectionDimension(section,active.key,baseValue*factor)} aria-pressed={Math.abs(active.value-baseValue*factor)<1e-8} aria-label={`${active.label}设为基准的${factor}倍`} onClick={()=>update(active.key,baseValue*factor)}>×{factor}</button>)}</div>
        </div>
        <div className="section-dimension-track"><input type="range" aria-label={`截面${active.label}滑块`} min={active.minimum} max={maximum} step={active.unit==='mm'?.1:Math.max(1,Math.pow(10,Math.floor(Math.log10(Math.max(baseValue,1)/200))))} value={active.value} onChange={event=>update(active.key,Number(event.target.value))}/><span>基准 {Number(baseValue.toPrecision(5))} {active.unit}</span>
          {section.type==='rectangle'&&<button aria-label="互换矩形截面宽高" onClick={()=>onChange({bendSection:{...section,width:section.height??150,height:section.width??100}})}><ArrowLeftRight size={12}/><span>宽高互换</span></button>}
        </div>
      </div>
    </div>
    {comparison&&<div className="section-impact-summary" aria-label="截面尺寸影响对比"><span><i className="section-baseline-line"/>虚线为基准</span><span>I<sub>z</sub><output>×{comparison.inertiaRatio.toFixed(2)}</output></span><span>挠度<output className={comparison.deflectionChange!==null&&comparison.deflectionChange<-.05?'is-reduced':''}>{percentage(comparison.deflectionChange)}</output></span><span>应力<output className={comparison.stressChange!==null&&comparison.stressChange<-.05?'is-reduced':''}>{percentage(comparison.stressChange)}</output></span>{comparison.extrapolated&&<small>弹性外推比较</small>}</div>}
  </div>;
}

export function SectionComparisonFigure({section,baseline,active,onSelect,onChange}:{section:SectionProperties;baseline:SectionProperties;active:DimensionKey;onSelect:(key:DimensionKey)=>void;onChange:(key:DimensionKey,value:number)=>void}) {
  const now=bendingProfile(section),base=bendingProfile(baseline),drag=useRef<{key:DimensionKey;start:number;value:number;pixelsPerMm:number}|null>(null);
  const span=(profile:typeof now,axis:0|1)=>{const p=profile.contours.flat().map(v=>v[axis]);return p.length?Math.max(...p)-Math.min(...p):1;};
  const scale=66/Math.max(span(base,0)*2,span(base,1)*2,span(now,0)*1.1,span(now,1)*1.1,1);
  const path=(p:typeof now)=>p.contours.map(c=>c.map(([y,z],i)=>`${i?'L':'M'}${45+z*scale} ${48-y*scale}`).join(' ')+'Z').join(' ');
  const fields=sectionDimensions(section);
  return <figure className="section-comparison-figure"><svg viewBox="0 0 100 100" role={section.type==='rectangle'?'group':'img'} aria-label={now.schematic?'自定义截面未提供轮廓':`${SECTION_NAMES[section.type]}截面：实线为当前尺寸，虚线为基准尺寸`}>
    <path d="M7 48H86M45 8V88" fill="none" stroke="#36516a" strokeWidth=".6" strokeDasharray="2 3"/>
    {now.schematic?<text x="45" y="46" textAnchor="middle" fill="#aec5d9" fontSize="10">I<tspan dy="2" fontSize="7">z</tspan><tspan dy="-2"> 参数</tspan></text>:<><path d={path(base)} fill="none" stroke="#bdacd8" strokeWidth="1" strokeDasharray="3 3"/><path d={path(now)} fill="#6bbff126" fillRule="evenodd" stroke="#93d6ff" strokeWidth="1.2"/></>}
    {section.type==='rectangle'&&(['width','height'] as const).map(key=>{
      const field=fields.find(f=>f.key===key)!,vertical=key==='height',cx=vertical?45:45+field.value/2*scale,cy=vertical?48-field.value/2*scale:48;
      return <g key={key} role="slider" aria-label={`拖动调节截面${field.label}`} aria-valuemin={field.minimum} aria-valuenow={field.value} aria-orientation={vertical?'vertical':'horizontal'} tabIndex={0} data-experiment-gesture="section-size" className={`section-size-handle${active===key?' is-active':''}`}
        onPointerDown={event=>{event.preventDefault();onSelect(key);const svg=event.currentTarget.ownerSVGElement!;drag.current={key,start:vertical?event.clientY:event.clientX,value:field.value,pixelsPerMm:scale*svg.getBoundingClientRect().width/100};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event=>{const d=drag.current;if(!d||d.key!==key)return;const delta=((vertical?event.clientY:event.clientX)-d.start)*(vertical?-1:1);const value=Math.max(field.minimum,Math.min(d.value*2,Math.round((d.value+delta*2/d.pixelsPerMm)*10)/10));onChange(key,value);}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}
        onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();onSelect(key);onChange(key,Math.max(field.minimum,field.value+(['ArrowLeft','ArrowDown'].includes(event.key)?-1:1)*(event.shiftKey?10:1)));}}>
        <circle cx={cx} cy={cy} r="6" fill="transparent"/><circle cx={cx} cy={cy} r="3"/><text x={cx+7} y={cy-5}>{vertical?'h':'b'}</text>
      </g>;
    })}
  </svg><figcaption>{section.type==='rectangle'?'拖动 b / h 尺寸点':'切换尺寸，拖动滑块'}</figcaption></figure>;
}
