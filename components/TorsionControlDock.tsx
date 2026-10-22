import {ControlTabs,LoadControl} from './ControlConsole';
import React,{useId,useState} from 'react';
import {SlidersHorizontal,Shapes} from 'lucide-react';
import {NumericInput} from './NumericInput';
import {DEFAULT_MATERIALS} from '../mechanics/materials';
import type {SimulationState} from '../types';
export function TorsionControlDock({state:s,onChange}:{state:SimulationState;onChange:(s:Partial<SimulationState>)=>void}) {
  const [tab,setTab]=useState<'load'|'specimen'>('load'),[baseline,setBaseline]=useState(()=>({radius:s.torqRadius,length:s.torqLength})),id=useId();
  const known=DEFAULT_MATERIALS.some(m=>m.name===s.materialName),maxTorque=Math.max(2000,Math.abs(s.torqTorque));
  const radiusRatio=s.torqRadius/baseline.radius,angleRatio=s.torqLength/baseline.length/radiusRatio**4;
  return <section className="control-console bending-control-console torsion-control-console" aria-label="扭转实验快捷控制">
    <ControlTabs<'load'|'specimen'> id={id} label="扭转控制工具" value={tab} onChange={setTab} items={([['load','扭矩加载',SlidersHorizontal],['specimen','材料与尺寸',Shapes]] as const)} meta="材料 · 截面 · 转角同步"/>
    <div className="torsion-load-controls" id={`${id}-panel-load`} role="tabpanel" aria-labelledby={`${id}-load`} hidden={tab!=='load'}>
      <LoadControl label="输入扭矩 T" rangeLabel="输入扭矩滑块" value={s.torqTorque} unit="N·m" minimum={-maxTorque} maximum={maxTorque} step={10} direction="正负切换旋向" onChange={v=>onChange({torqTorque:v})}/>

      <div className="torsion-ratio-row"><NumericInput label="B 输出占比" compact value={s.torqLoadRatio*100} domain="nonnegative" maximum={100} unit="%" onChange={v=>onChange({torqLoadRatio:v/100})}/><input type="range" aria-label="B 输出扭矩占比滑块" min={0} max={1} step={.01} value={s.torqLoadRatio} onChange={e=>onChange({torqLoadRatio:Number(e.target.value)})}/><span>C 输出 {((1-s.torqLoadRatio)*100).toFixed(0)}%</span></div>
      <p className="torsion-control-hint">正负扭矩可切换方向；B、C 的输出扭矩与 A 平衡。材料和轴径在“材料与尺寸”中调节。</p>
    </div>
    <div className="torsion-specimen-controls" id={`${id}-panel-specimen`} role="tabpanel" aria-labelledby={`${id}-specimen`} hidden={tab!=='specimen'}>
      <div className="torsion-material-row"><label><span>材料</span><select aria-label="扭转材料" value={s.materialName} onChange={e=>{const m=DEFAULT_MATERIALS.find(m=>m.name===e.target.value);if(m)onChange({materialName:m.name,torqModulus:m.G,materialYield:m.yield,poissonRatio:m.poisson});}}>{!known&&<option value={s.materialName}>{s.materialName}</option>}{DEFAULT_MATERIALS.map(m=><option key={m.name} value={m.name}>{m.name}</option>)}</select></label><NumericInput label="剪切模量 G" compact value={s.torqModulus} unit="GPa" onChange={v=>onChange({torqModulus:v,materialName:'自定义材料'})}/></div>
      <div className="torsion-dimension-grid"><div className="torsion-radius-figure"><svg viewBox="0 0 80 70" role="img" aria-label={`实心圆截面，半径 ${s.torqRadius} mm，虚线为基准半径 ${baseline.radius} mm`}><circle cx="35" cy="33" r={26*baseline.radius/Math.max(s.torqRadius,baseline.radius*2)} fill="none" stroke="#bdacd8" strokeDasharray="3 3"/><circle cx="35" cy="33" r={26*s.torqRadius/Math.max(s.torqRadius,baseline.radius*2)} fill="#83c9ff20" stroke="#91d0f7"/><path d={`M35 33h${26*s.torqRadius/Math.max(s.torqRadius,baseline.radius*2)}`} stroke="#99ead3"/><text x="38" y="28">r</text></svg><span>实心圆 · J ∝ r⁴</span></div>
        <div className="torsion-dimension-input"><NumericInput compact label="半径 r" value={s.torqRadius} unit="mm" onChange={v=>onChange({torqRadius:v})}/><input type="range" aria-label="圆轴半径滑块" min={Math.min(1,s.torqRadius/2)} max={Math.max(baseline.radius*2,s.torqRadius,50)} step={.1} value={s.torqRadius} onChange={e=>onChange({torqRadius:Number(e.target.value)})}/><div className="section-size-presets">{[.5,1,2].map(v=><button key={v} aria-label={`半径设为基准的${v}倍`} aria-pressed={s.torqRadius===baseline.radius*v} onClick={()=>onChange({torqRadius:baseline.radius*v})}>×{v}</button>)}</div></div>
        <div className="torsion-dimension-input"><NumericInput compact label="总轴长 L" value={s.torqLength} unit="m" onChange={v=>onChange({torqLength:v})}/><input type="range" aria-label="圆轴长度滑块" min={Math.min(.1,s.torqLength/2)} max={Math.max(3,s.torqLength)} step={.01} value={s.torqLength} onChange={e=>onChange({torqLength:Number(e.target.value)})}/><span>AB = BC = {(s.torqLength/2).toFixed(2)} m</span></div>
      </div><div className="section-impact-summary torsion-section-impact"><span>同 G、扭矩与分流比</span><span>J <output>×{(radiusRatio**4).toFixed(2)}</output></span><span>转角<output>{s.torqTorque===0?'均为 0':`${angleRatio>=1?'+':''}${((angleRatio-1)*100).toFixed(1)}%`}</output></span><button onClick={()=>setBaseline({radius:s.torqRadius,length:s.torqLength})}>设为基准</button><button onClick={()=>onChange({torqRadius:baseline.radius,torqLength:baseline.length})}>恢复</button></div>
    </div>
  </section>;
}
