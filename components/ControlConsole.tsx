import React from 'react';
import {Minus,Plus,RotateCcw,type LucideIcon} from 'lucide-react';
import {NumericInput} from './NumericInput';

/** 共用控制台导航，切换参数页不修改实验数据。 */
export function ControlTabs<T extends string>({id,label,value,onChange,items,meta}:{
  id:string;label:string;value:T;onChange:(tab:T)=>void;
  items:readonly (readonly [T,string,LucideIcon])[];meta?:string;
}) {
  return <div className="bending-control-tabs control-console-tabs" role="tablist" aria-label={label} onKeyDown={e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const i=items.findIndex(t=>t[0]===value);
    const next=items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowLeft'?items.length-1:1))%items.length][0];
    onChange(next);document.getElementById(`${id}-${next}`)?.focus();
  }}>{items.map(([key,title,Icon])=><button type="button" key={key} id={`${id}-${key}`} role="tab" aria-selected={value===key} tabIndex={value===key?0:-1} aria-controls={`${id}-panel-${key}`} onClick={()=>onChange(key)}><Icon size={14}/>{title}</button>)}{meta&&<span>{meta}</span>}</div>;
}

/** 输入、连续调节和复位共用一行，单位转换仍由模块负责。 */
export function LoadControl({label,rangeLabel,value,unit,minimum,maximum,step,precision=3,direction,disabled=false,onChange,onUnload,unloadDisabled,inputMaximum,unloadLabel='卸载'}:{
  label:string;rangeLabel:string;value:number;unit:string;minimum:number;maximum:number;
  step:number|'any';precision?:number;direction?:string;disabled?:boolean;
  onChange:(value:number)=>void;onUnload?:()=>void;unloadDisabled?:boolean;inputMaximum?:number;unloadLabel?:string;
}) {
  const fine=step==='any'?10**Math.floor(Math.log10((maximum-minimum)/1000)):step;
  const progress=Math.max(0,Math.min(100,(value-minimum)/(maximum-minimum)*100));
  const shift=(delta:number)=>onChange(Math.max(minimum,Math.min(maximum,Number((value+delta).toPrecision(12)))));
  const number=(n:number)=>Number(n.toPrecision(4)).toLocaleString('zh-CN',{maximumFractionDigits:4});
  return <div className="control-load-row">
    <div className="control-load-value"><NumericInput compact label={label} value={value} unit={unit} displayDecimals={precision} domain={minimum<0?'signed':'nonnegative'} maximum={inputMaximum} onChange={onChange}/></div>
    <div className="control-load-track"><div className="control-track-caption"><span>拖动调节</span><span>{direction}</span></div><input type="range" aria-label={rangeLabel} aria-description={step==='any'?undefined:`方向键每次调节 ${step}${unit}。`} min={minimum} max={maximum} step={step} value={value} disabled={disabled} onChange={e=>onChange(Number(e.target.value))} style={{'--control-progress':`${progress}%`} as React.CSSProperties}/><div className="control-track-scale" aria-hidden="true"><span>{number(minimum)}</span><span>{number(maximum)} {unit}</span></div></div>
    <div className="control-load-actions"><div className="control-stepper" role="group" aria-label={`${label}微调`}><button type="button" aria-label={`减小${label} ${fine}${unit}`} disabled={disabled||value<=minimum} onClick={()=>shift(-fine)}><Minus size={14}/></button><button type="button" aria-label={`增大${label} ${fine}${unit}`} disabled={disabled||value>=maximum} onClick={()=>shift(fine)}><Plus size={14}/></button></div><button type="button" className="control-unload" disabled={unloadDisabled??value===0} onClick={()=>onUnload?onUnload():onChange(0)}><RotateCcw size={12}/>{unloadLabel}</button></div>
  </div>;
}
