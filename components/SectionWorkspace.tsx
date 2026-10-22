import {buildSectionTeaching,type TeachingMode,type TeachingAxis} from '../mechanics/sectionTeaching';
import {SectionTeachingCanvas,SectionTeachingReadout} from './SectionTeaching';
import React,{useId,useMemo,useState} from 'react';
import {Shapes,SlidersHorizontal,RotateCcw,BookmarkPlus,Trash2,PenTool,Calculator,FileText} from 'lucide-react';
import {FormulaList} from './FormulaCard';
import {sectionDerivedFormulas} from '../mechanics/sectionToolFormulas';
import {NumericInput} from './NumericInput';
import {ControlTabs} from './ControlConsole';
import type {SectionModel} from '../experiments/schema';
import {SECTION_TOOL_CONFIGS,type SectionToolResult,type SectionToolType} from '../mechanics/sectionTool';
import {sectionToolGeometry,sectionParameterProblem} from '../mechanics/sectionToolGeometry';

const number=(v:number)=>!Number.isFinite(v)?'—':v===0?'0':Math.abs(v)>=1e7||Math.abs(v)<.001?v.toExponential(3):v.toLocaleString('zh-CN',{maximumFractionDigits:3});
const units={mm:1,cm:.1,m:.001};
const presets:SectionToolType[]=['rectangle','circle','hollow-circle','hollow-rectangle','i-beam','t-beam','channel','angle','unequal-angle','double-channel','composite-rect','custom','draw'];

export function SectionWorkspace({model,onModelChange,rawResult,onTypeChange,onDraw,steps}:{
  model:SectionModel;onModelChange:(m:SectionModel)=>void;rawResult:SectionToolResult;
  onTypeChange:(type:SectionToolType)=>void;onDraw:()=>void;steps:React.ReactNode;
}) {
  const [tab,setTab]=useState<'results'|'steps'>('results'),id=useId();
  const [baseline,setBaseline]=useState<{model:SectionModel;result:SectionToolResult}|null>(null);
  const [teachingMode,setTeachingMode]=useState<TeachingMode>('parts'),[teachingAxis,setTeachingAxis]=useState<TeachingAxis>('x'),[teachingPart,setTeachingPart]=useState<string|null>(null);
  const [showAxes,setShowAxes]=useState(true),[showDimensions,setShowDimensions]=useState(true),[zoom,setZoom]=useState(1);
  const config=SECTION_TOOL_CONFIGS[model.sectionType],unit=model.displayUnit,factor=units[unit];
  const geometry=useMemo(()=>sectionToolGeometry(model.sectionType,model.parameters,model.paths),[model.sectionType,model.parameters,model.paths]);
  const teaching=useMemo(()=>buildSectionTeaching(model.sectionType,model.parameters,model.paths),[model.sectionType,model.parameters,model.paths]);
  const captureBaseline=()=>setBaseline({model:structuredClone(model),result:{...rawResult}});
  const reference=useMemo(()=>baseline?sectionToolGeometry(baseline.model.sectionType,baseline.model.parameters,baseline.model.paths):null,[baseline]);
  const chooseTeachingMode=(mode:TeachingMode)=>{if(mode==='compare'&&!reference)captureBaseline();setTeachingMode(mode);};
  const valid=rawResult.A>0&&Object.values(rawResult).every(v=>Number.isFinite(v)&&v>=0);
  const change=(key:string,v:number)=>onModelChange({...model,parameters:{...model.parameters,[key]:v}});
  const reset=()=>onModelChange({...model,parameters:Object.fromEntries(config.params.map(f=>[f.key,f.default]))});
  const output=(key:keyof SectionToolResult,power:number)=>valid?number(rawResult[key]*factor**power):'—';
  const compare=(key:'A'|'Ix'|'Iy')=>{
    if(!baseline||baseline.result[key]<=0||!valid)return '—';
    const ratio=rawResult[key]/baseline.result[key];return `${ratio>=1?'+':''}${((ratio-1)*100).toFixed(1)}%`;
  };
  return <div className="taste-lab section-workspace">
    <div className="section-library-bar"><label><Shapes size={16}/><span>截面库</span><select aria-label="截面类型" value={model.sectionType} onChange={e=>{onTypeChange(e.target.value as SectionToolType);setZoom(1);}}>{presets.map(type=><option key={type} value={type}>{SECTION_TOOL_CONFIGS[type].name}</option>)}</select></label><span className="section-library-summary">{model.sectionType==='draw'?'多边形轮廓与内孔':model.sectionType==='custom'?'直接输入特性':'参数化截面'}<i/>输入尺寸统一使用 mm</span></div>
    <div className="section-workspace-layout">
      <div className="section-workspace-main">
        <section className="section-preview-surface" aria-label="截面几何预览">
          <header><div><h3>{config.name}</h3><p>{config.description}</p></div><div className="section-view-toggles"><button type="button" aria-pressed={showAxes} disabled={!geometry} onClick={()=>setShowAxes(v=>!v)}>形心轴</button><button type="button" aria-pressed={showDimensions} disabled={!geometry} onClick={()=>setShowDimensions(v=>!v)}>尺寸</button>{model.sectionType==='draw'&&<button type="button" onClick={onDraw}><PenTool size={14}/>编辑轮廓</button>}</div></header>
          {geometry&&teaching?<SectionTeachingCanvas data={teaching!} reference={teachingMode==='compare'?reference:null} zoom={zoom} axes={showAxes} dimensions={showDimensions} label={config.name} mode={teachingMode} onMode={chooseTeachingMode} axis={teachingAxis} onAxis={setTeachingAxis} selectedId={teachingPart} onSelect={setTeachingPart} onBaseline={captureBaseline} onZoom={setZoom}/>:<div className="section-geometry-empty"><Shapes size={44}/><h4>{model.sectionType==='custom'?'仅提供截面特性':'建立截面轮廓'}</h4><p>{model.sectionType==='custom'?'特性数值不能唯一确定轮廓，预览不生成虚构形状。':'用顶点定义外边界和内孔，闭合后计算形心与截面特性。'}</p><button type="button" onClick={()=>model.sectionType==='draw'?onDraw():onTypeChange('draw')}><PenTool size={14}/>{model.sectionType==='draw'?'打开绘制器':'绘制真实轮廓'}</button></div>}
        </section>
        <section className="control-console section-dimension-console" aria-label="截面尺寸控制">
          <header className="control-console-heading"><span><SlidersHorizontal size={14}/>{model.sectionType==='custom'?'截面特性输入':'尺寸调整'}</span><div>{model.sectionType==='draw'?<button type="button" onClick={onDraw}><PenTool size={13}/>编辑截面</button>:<button type="button" onClick={reset}><RotateCcw size={13}/>恢复默认尺寸</button>}<button type="button" disabled={!valid} onClick={captureBaseline}><BookmarkPlus size={13}/>设为对比基准</button></div></header>
          {config.params.length>0?<div className="section-dimension-fields">{config.params.map(f=>{
            const value=model.parameters[f.key],max=Math.max(f.max,value),problem=(v:number)=>sectionParameterProblem(model.sectionType,{...model.parameters,[f.key]:v});
            return <div className="section-dimension-field" key={`${model.sectionType}-${f.key}`}><NumericInput compact label={f.label} value={value} unit={f.unit} minimum={f.min} domain="nonnegative" validate={problem} onChange={v=>change(f.key,v)}/><input type="range" aria-label={`${f.label}尺寸滑块`} min={f.min} max={max} step="any" value={value} onChange={e=>{const v=Number(e.target.value);if(!problem(v))change(f.key,v);}}/><div className="section-input-limits" aria-hidden="true"><span>{f.min}</span><span>{number(max)} {f.unit}</span></div></div>;
          })}</div>:<p className="section-draw-hint">{model.paths.filter(p=>p.isClosed).length} 个已闭合轮廓 · 图中坐标来自保存的绘制模型</p>}
          {baseline&&<div className="section-comparison-strip"><span>对比 {SECTION_TOOL_CONFIGS[baseline.model.sectionType].name}</span>{(['A','Ix','Iy'] as const).map(key=><span key={key}>{key}<output>{compare(key)}</output></span>)}<button type="button" aria-label="清除截面对比基准" onClick={()=>{setBaseline(null);if(teachingMode==='compare')setTeachingMode('parts');}}><Trash2 size={13}/></button></div>}
        </section>
      </div>
      <aside className="section-properties-rail control-console" aria-label="截面计算分析">
        <ControlTabs<'results'|'steps'> id={id} label="截面分析工具" value={tab} onChange={setTab} items={[["results","截面特性",Calculator],["steps","计算过程",FileText]]}/>
        <div role="tabpanel" id={`${id}-panel-results`} aria-labelledby={`${id}-results`} hidden={tab!=='results'} className="section-properties-body">
          <div className="section-result-heading"><h3>几何特性</h3><div role="group" aria-label="计算结果显示单位">{(['mm','cm','m'] as const).map(u=><button type="button" key={u} aria-pressed={unit===u} onClick={()=>onModelChange({...model,displayUnit:u})}>{u}</button>)}</div></div>
          {teaching&&<SectionTeachingReadout data={teaching} mode={teachingMode} axis={teachingAxis} selectedId={teachingPart} onSelect={setTeachingPart}/>}
          <div className={`section-area-result ${teachingMode==='parts'?'teaching-result-focus':''}`}><span>截面面积 A</span><output>{output('A',2)}<small>{unit}²</small></output></div>
          <section className={`section-property-group ${teachingMode==='inertia'?'teaching-result-focus':''}`}><h4>形心轴惯性矩</h4><div className="section-axis-result is-x"><span>I<sub>x</sub><small>水平形心轴</small></span><output>{output('Ix',4)}<small>{unit}⁴</small></output></div><div className="section-axis-result is-y"><span>I<sub>y</sub><small>竖直形心轴</small></span><output>{output('Iy',4)}<small>{unit}⁴</small></output></div><dl><div><dt>形心极惯性矩 I<sub>p</sub></dt><dd>{output('Ip',4)} <small>{unit}⁴</small></dd></div></dl></section>
          <section className="section-property-group"><h4>抗弯截面模量</h4><dl><div><dt>W<sub>x</sub> = I<sub>x</sub> / y<sub>max</sub></dt><dd>{output('Wx',3)} <small>{unit}³</small></dd></div><div><dt>W<sub>y</sub> = I<sub>y</sub> / x<sub>max</sub></dt><dd>{output('Wy',3)} <small>{unit}³</small></dd></div></dl></section>
          <section className="section-property-group"><h4>惯性半径</h4><dl><div><dt>i<sub>x</sub> = √(I<sub>x</sub>/A)</dt><dd>{output('ix',1)} <small>{unit}</small></dd></div><div><dt>i<sub>y</sub> = √(I<sub>y</sub>/A)</dt><dd>{output('iy',1)} <small>{unit}</small></dd></div></dl></section>
          {geometry&&<section className={`section-property-group ${teachingMode==='centroid'?'teaching-result-focus':''}`}><h4>形心与边缘距离</h4><dl><div><dt>形心 C<sub>x</sub> / C<sub>y</sub></dt><dd>{number(geometry.cx*factor)} / {number(geometry.cy*factor)} <small>{unit}</small></dd></div><div><dt>x<sub>max</sub> / y<sub>max</sub></dt><dd>{output('xmax',1)} / {output('ymax',1)} <small>{unit}</small></dd></div></dl><p>{model.sectionType==='draw'?'形心位置使用绘制器坐标。':'形心坐标以外包框左下角为原点。'}x/y 为水平与竖直形心轴，非对称截面未必是主轴。</p></section>}
          <p className="section-property-note">I<sub>p</sub> = I<sub>x</sub> + I<sub>y</sub> 是极二次矩，非圆截面不能直接作为扭转常数 J。组合截面的几何特性以各部分共同工作为前提。</p>
        </div>
        <div role="tabpanel" id={`${id}-panel-steps`} aria-labelledby={`${id}-steps`} hidden={tab!=='steps'} className="section-calculation-basis"><p>代入采用内部 mm 单位，结果栏可单独切换单位。</p>{valid?<><FormulaList formulas={sectionDerivedFormulas(rawResult)}/><details className="section-shape-derivation"><summary>面积与惯性矩的截面推导</summary>{steps}</details></>:<p>先建立有效截面后查看计算过程。</p>}</div>
      </aside>
    </div>
  </div>;
}
