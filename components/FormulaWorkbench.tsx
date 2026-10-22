import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {BookOpen, Check, ChevronRight, Copy, Calculator, Search, X, RotateCcw, Shapes, ListFilter, Menu, ChevronDown} from 'lucide-react';
import {LatexRenderer} from './LatexRenderer';
import {NumericInput} from './NumericInput';
import {filterFormulaReferences, formulaReferenceScope, formulaReferenceSymbols, type FormulaReferenceKind, type FormulaReferenceRecord} from '../mechanics/formulaReference';
import {FORMULA_BEAM_UNIT_GUIDE, type FormulaBeamCalculator} from '../mechanics/formulaBeamCalculators';
import {FormulaAxialDiagram} from './FormulaAxialDiagram';
import {FormulaBeamDiagram} from './FormulaBeamDiagram';
import {FormulaArchDiagram,type ArchDiagramMode} from './FormulaArchDiagram';
import {buildFormulaArchSketch,type SectionSide} from '../mechanics/formulaArchSketch';
import {buildFormulaBeamSketch} from '../mechanics/formulaBeamSketch';
import {FormulaAxialSandbox} from './FormulaAxialSandbox';
import {calculateFormulaAxial,DEFAULT_FORMULA_AXIAL} from '../mechanics/formulaAxial';
import {FORMULA_STUDIES,studyDefaults,evaluateStudy} from '../mechanics/formulaStudies';
import {formulaAxialSteps,type FormulaWorkedStep} from '../mechanics/formulaAxialSteps';
import {formulaBeamSubstitution} from '../mechanics/formulaBeamSubstitution';
import {FormulaStudyDiagram,FormulaStudySandbox} from './FormulaStudy';
import '../formula-workbench.css';

export interface FormulaWorkbenchEntry extends FormulaReferenceRecord {
  diagram?:React.ReactNode; diagrams?:{fbd:React.ReactNode;sfd:React.ReactNode;bmd:React.ReactNode};
  calculator?:FormulaBeamCalculator; conditions?:string[];
}
const families:{id:'all'|FormulaReferenceKind;label:string}[]=[{id:'all',label:'全部'},{id:'basic',label:'基础公式'},{id:'beam',label:'梁与拱'},{id:'section',label:'截面特性'}];
const keyOf=(entry:FormulaReferenceRecord)=>`${entry.kind}:${entry.id}`;
const numberText=(value:number)=>value===0?'0':Math.abs(value)>=1e7||Math.abs(value)<0.0001?value.toExponential(4):new Intl.NumberFormat('zh-CN',{maximumFractionDigits:5}).format(value);

function Diagram({entry,values}:{entry:FormulaWorkbenchEntry;values:Record<string,number>}){
  const [mode,setMode]=useState<ArchDiagramMode>('fbd');
  const [fraction,setFraction]=useState(.25),[side,setSide]=useState<SectionSide>('right');
  const [showReactions,setShowReactions]=useState(false);
  const arch=entry.id.startsWith('arch-'),straight=entry.kind==='beam'&&!arch;
  const sketch=straight?buildFormulaBeamSketch(entry.id,values):null;
  const archSketch=arch?buildFormulaArchSketch(entry.id,values):null;
  const length=sketch?.length??archSketch?.length??0;
  const position=fraction*length;
  const sectionSide=fraction===1?'left':fraction===0?'right':side;
  const archValues=archSketch?.sectionAt(position,sectionSide);
  const shear=archValues?.shear??sketch?.shearAt(position,sectionSide)??0;
  const moment=archValues?.moment??sketch?.momentAt(position,sectionSide)??0;
  const valid=!!(sketch||archSketch);
  const caption=arch?(mode==='fbd'?'抛物线拱轴 · 均布载荷按水平投影计':mode==='sfd'?'V = V₀cosφ − Hsinφ · 正值向拱外':mode==='nfd'?'N = −Hcosφ − V₀sinφ · 拉正压负':'M = M₀ − Hy · 正弯矩画在拱内受拉侧'):mode==='fbd'?'结构简图 · 尺寸与当前参数对应':mode==='sfd'?'剪力正值向上 · 内力纵标自动缩放':'弯矩画在受拉侧 · 正弯矩向下 · 内力纵标自动缩放';
  const format=(n:number)=>Number(n.toPrecision(6)).toString();
  const boundaryPositions=sketch?.breaks??archSketch?.breaks??[];
  const jump=sketch?Math.abs(sketch.shearAt(position,'left')-sketch.shearAt(position,'right'))+Math.abs(sketch.momentAt(position,'left')-sketch.momentAt(position,'right'))>1e-9:archSketch?.point?.x===position;
  const choosePosition=(p:number)=>setFraction(Math.min(1,Math.max(0,p/length)));
  const slide=(value:number)=>{const p=length*value,close=boundaryPositions.find(b=>Math.abs(b-p)<=length*.00051);choosePosition(close??p);};
  return <section className={`fw-diagram${entry.diagram?' fw-section-diagram':''}`} aria-label="公式示意图">
    <header><span><Shapes size={14}/>{entry.diagram?'截面与尺寸':'支承与载荷'}</span>{entry.diagrams&&<div className="fw-segment" role="group" aria-label="切换示意图">{(['fbd','sfd','bmd',...(arch?['nfd']:[])] as ArchDiagramMode[]).map(value=><button type="button" aria-pressed={mode===value} key={value} onClick={()=>setMode(value)}>{value==='fbd'?'受力图':value==='sfd'?'剪力图':value==='nfd'?'轴力图':'弯矩图'}</button>)}</div>}</header>
    <div className={`fw-diagram-drawing${straight||arch?' fw-textbook-drawing':''}`}>
      {sketch?<FormulaBeamDiagram sketch={sketch} mode={mode==='nfd'?'fbd':mode} probe={position} side={sectionSide} showReactions={showReactions}/>:archSketch?<FormulaArchDiagram sketch={archSketch} mode={mode} probe={position} side={sectionSide} showReactions={showReactions}/>:straight||arch?<p className="fw-error" role="status">请修正右侧参数后查看结构简图。</p>:entry.diagram??entry.diagrams?.[mode==='nfd'?'fbd':mode]}
      {valid&&<div className="fw-diagram-inspector" aria-label="图解截面读数" data-probe-position={position}>
        <div className="fw-diagram-probe-controls"><NumericInput compact label="截面位置 x" value={position} unit="m" domain="nonnegative" minimum={0} maximum={length} displayDecimals={3} onChange={choosePosition}/><select aria-label="截面取值侧" value={sectionSide} disabled={fraction===0||fraction===1} onChange={e=>setSide(e.target.value as SectionSide)}><option value="left">x⁻ 左侧</option><option value="right">x⁺ 右侧</option></select>{mode==='fbd'&&<button className="fw-reaction-toggle" type="button" aria-pressed={showReactions} onClick={()=>setShowReactions(v=>!v)}>支座反力</button>}</div>
        <input type="range" aria-label="沿构件移动截面" min="0" max="1" step="0.001" value={fraction} onChange={e=>slide(Number(e.target.value))}/>
        <div className="fw-diagram-values" aria-live="polite">{archValues&&<div><span>轴力 N</span><strong data-value="normal">{format(archValues.normal)} <small>kN</small></strong></div>}<div><span>剪力 V</span><strong data-value="shear">{format(shear)} <small>kN</small></strong></div><div><span>弯矩 M</span><strong data-value="moment">{format(moment)} <small>kN·m</small></strong></div></div>
        {jump&&fraction>0&&fraction<1&&<p className="fw-probe-note">该位置有内力跃变；切换 x⁻ / x⁺ 查看截面两侧。</p>}
        {showReactions&&mode==='fbd'&&<div className="fw-diagram-reactions" aria-label="当前支座反力">{archSketch?<><span>A：↑ {format(archSketch.leftReaction)} kN · → {format(archSketch.thrust)} kN</span><span>C：↑ {format(archSketch.rightReaction)} kN · ← {format(archSketch.thrust)} kN</span></>:sketch?.supports.map(s=><span key={s.name}>{s.name}：{s.reaction<0?'↓':'↑'} {format(Math.abs(s.reaction))} kN{s.clockwiseMoment!==0?` · ${s.clockwiseMoment<0?'↺':'↻'} ${format(Math.abs(s.clockwiseMoment))} kN·m`:''}</span>)}</div>}
        {archValues&&<details className="fw-section-substitution"><summary>当前截面计算</summary><p>φ = {format(Math.atan(archValues.slope)*180/Math.PI)}°；y = {format(archValues.height)} m；V₀ = {format(archValues.verticalShear)} kN</p><LatexRenderer formula={String.raw`V=V_0\cos\varphi-H\sin\varphi=${format(archValues.verticalShear)}\cos(${format(Math.atan(archValues.slope)*180/Math.PI)}^\circ)-${format(archSketch!.thrust)}\sin(${format(Math.atan(archValues.slope)*180/Math.PI)}^\circ)=${format(shear)}\,\mathrm{kN}`}/><LatexRenderer formula={String.raw`N=-H\cos\varphi-V_0\sin\varphi=-${format(archSketch!.thrust)}\cos(${format(Math.atan(archValues.slope)*180/Math.PI)}^\circ)-\left(${format(archValues.verticalShear)}\right)\sin(${format(Math.atan(archValues.slope)*180/Math.PI)}^\circ)=${format(archValues.normal)}\,\mathrm{kN}`}/><LatexRenderer formula={String.raw`M=M_0-Hy=${format(archValues.moment+archSketch!.thrust*archValues.height)}-${format(archSketch!.thrust)}\times${format(archValues.height)}=${format(moment)}\,\mathrm{kN\!\cdot\!m}`}/></details>}
      </div>}
    </div>
    <p>{entry.diagram&&!arch&&!straight?'尺寸符号与下方公式对应':caption}{archSketch&&archSketch.kind!=='three-hinged'?'；当前仅弯曲理论，忽略轴向与剪切变形':''}</p>
  </section>;
}
function FittedEquation({name,formula,primary,copied,onCopy}:{name:string;formula:{label:string;formula:string};primary:boolean;copied:boolean;onCopy:()=>void}){
  const root=useRef<HTMLElement>(null);
  useLayoutEffect(()=>{
    const section=root.current;
    if(!section)return;
    const scroll=section.querySelector<HTMLElement>('.math-scroll');
    const math=section.querySelector<HTMLElement>('.math-scroll .katex');
    const renderer=section.querySelector<HTMLElement>('.math-renderer');
    if(!scroll||!math||!renderer)return;
    // 根据真实排版宽度适配字号，长公式在手机上也能完整阅读；放大层仍独立控制字号。
    const fit=()=>{
      const style=getComputedStyle(scroll);
      const available=scroll.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
      const bases=Array.from(math.querySelectorAll<HTMLElement>('.katex-html > .base'));
      const width=bases.reduce((sum,base)=>sum+base.getBoundingClientRect().width,0)||math.getBoundingClientRect().width;
      if(available<=0||width<=0)return;
      const base=parseFloat(getComputedStyle(section).getPropertyValue('--fw-equation-base'));
      const current=parseFloat(getComputedStyle(renderer).fontSize);
      const size=Math.max(16,Math.min(base,Math.floor(current*available/width*100)/100));
      const next=`${size}px`;
      if(section.style.getPropertyValue('--fw-equation-fit')!==next)section.style.setProperty('--fw-equation-fit',next);
    };
    fit();
    const observer=new ResizeObserver(fit);observer.observe(scroll);
    return ()=>observer.disconnect();
  },[formula.formula]);
  return <section ref={root} className={`fw-equation${primary?' fw-equation-primary':''}`}>
    <header><h3>{formula.label}</h3><button type="button" className="fw-copy" aria-label={`复制 LaTeX：${formula.label}`} title="复制 LaTeX" onClick={onCopy}>{copied?<Check size={14}/>:<Copy size={14}/>}<span>{copied?'已复制':'复制'}</span></button></header>
    <LatexRenderer formula={formula.formula} label={`${name} · ${formula.label}`} expandable/>
  </section>;
}
function EquationControl({name,formula,primary=false}:{name:string;formula:{label:string;formula:string};primary?:boolean}){
  const [copied,setCopied]=useState(false),[failed,setFailed]=useState(false);
  return <><FittedEquation name={name} formula={formula} primary={primary} copied={copied} onCopy={async()=>{
    try{await navigator.clipboard.writeText(formula.formula);setCopied(true);setFailed(false);}catch{setFailed(true);}
  }}/>{failed&&<p role="status" className="fw-error">复制失败，可放大公式后手动选择。</p>}</>;
}
function BeamCalculator({id,config,values,setValues}:{id:string;config:FormulaBeamCalculator;values:Record<string,number>;setValues:React.Dispatch<React.SetStateAction<Record<string,number>>>}){
  const defaults=()=>Object.fromEntries(config.inputs.map(input=>[input.key,input.default]));
  const [revision,setRevision]=useState(0);
  const error=config.validate(values),results=error?[]:config.calculate(values);
  return <section className="fw-calculator fw-study-sandbox" aria-label="当前算例参数计算"><header><div><h3><Calculator size={15}/>参数计算</h3><p>当前支承与载荷工况</p></div><button type="button" className="fw-text-button" onClick={()=>{setValues(defaults());setRevision(v=>v+1);}}><RotateCcw size={13}/>重置</button></header><div className="fw-input-grid" key={revision}>{config.inputs.map(input=><NumericInput key={input.key} label={input.label} unit={input.unit} value={values[input.key]} domain={['L','E','I','f'].includes(input.key)?'positive':'nonnegative'} onChange={value=>setValues(old=>({...old,[input.key]:value}))}/>)}</div>{error?<p className="fw-error" role="alert">{error}</p>:<><section className="fw-study-primary" aria-label="主要计算结果" aria-live="polite"><span>{results[0].label}</span><strong>{numberText(results[0].value)} <small>{results[0].unit}</small></strong><p>当前参数 · 等刚度线弹性参考</p></section><div className="fw-study-results" aria-live="polite">{results.slice(1).map(row=><div key={row.label}><span>{row.label}</span><strong>{numberText(row.value)} <small>{row.unit}</small></strong></div>)}</div><details className="fw-study-steps" open><summary>当前参数代入 <ChevronDown size={13}/></summary><p>先换算为 N、mm、MPa、mm⁴，末步换回结果标注单位。</p>{results.map(row=><section key={row.label}><h4>{row.label} · {row.formula}</h4><LatexRenderer formula={formulaBeamSubstitution(id,config,values,row)} label={`${row.label}数值代入`} expandable/></section>)}</details></>}<details className="fw-unit-guide"><summary>输入单位与符号约定</summary>{FORMULA_BEAM_UNIT_GUIDE.map(line=><p key={line}>{line}</p>)}</details></section>;
}
function FormulaDetail({entry,entries,onSelect}:{entry:FormulaWorkbenchEntry;entries:readonly FormulaWorkbenchEntry[];onSelect:(entry:FormulaWorkbenchEntry)=>void}){
  const [section,setSection]=useState<'formulas'|'substitution'|'conditions'>('formulas');
  const [axial,setAxial]=useState(()=>({...DEFAULT_FORMULA_AXIAL})),[revision,setRevision]=useState(0);
  const axialEntry=entry.kind==='basic'&&['stress-basic','axial-deform','strain-energy'].includes(entry.id);
  const axialResult=axialEntry?calculateFormulaAxial(axial):null;
  const [beamValues,setBeamValues]=useState(()=>Object.fromEntries(entry.calculator?.inputs.map(f=>[f.key,f.default])??[]));
  const study=FORMULA_STUDIES[entry.kind==='section'?`section:${entry.id}`:entry.id];
  const [studyParams,setStudyParams]=useState(()=>study?studyDefaults(study):{});
  const studyResult=study?evaluateStudy(study,studyParams):null;
  const symbols=formulaReferenceSymbols(entry);
  const conditions=study?.scope??entry.conditions??entry.calculator?.assumptions??formulaReferenceScope(entry);
  const related=entries.filter(e=>e.kind===entry.kind&&e.group===entry.group&&e.id!==entry.id);
  const extra=entry.id==='stress-basic'?[{label:'等截面杆的伸长量',formula:String.raw`\Delta L=\frac{NL}{EA}`},{label:'线弹性应变能密度',formula:String.raw`u=\frac{\sigma^2}{2E}`}]:[];
  const primaryIndex=entry.id==='deflection-common'?studyParams.case:entry.id==='buckling-factor'?[1,2,.5,.7].indexOf(studyParams.mu):entry.id==='torsion-section'&&studyParams.d>0?1:0;
  const primaryFormula=entry.id==='torsion-section'&&studyParams.d===0?{label:'实心圆（D 为直径）',formula:String.raw`I_p=\frac{\pi D^4}{32},\quad W_p=\frac{\pi D^3}{16}`} :entry.id==='buckling-factor'&&studyParams.mu===.7?{label:'一端固定一端铰支',formula:String.raw`\mu\approx0.7`}:entry.formulas[primaryIndex]??entry.formulas[0];
  const rows=[...entry.formulas.filter((_,i)=>i!==primaryIndex),...extra];
  const workedSteps:FormulaWorkedStep[]=studyResult?.ok?studyResult.rows.map(row=>({label:row.label,formula:row.substitution})):axialResult?formulaAxialSteps(axial,axialResult,entry.id==='strain-energy'):entry.calculator&&!entry.calculator.validate(beamValues)?entry.calculator.calculate(beamValues).map(row=>({label:row.label,formula:formulaBeamSubstitution(entry.id,entry.calculator!,beamValues,row)})):[];
  const visibleRows=section==='substitution'?workedSteps:rows;
  return <article className="fw-detail" aria-label={`${entry.name}详情`}>
    <div className="fw-stage">
      <header className="fw-stage-header"><div><div className="fw-detail-breadcrumb"><span>{families.find(f=>f.id===entry.kind)?.label}</span><ChevronRight size={12}/><span>{entry.group}</span></div><h2>{entry.name}</h2></div><span className="fw-scope-badge">{axialEntry?'轴向线弹性参考':study?'参数联动教学算例':entry.calculator?'等刚度线弹性参考':'公式速查'}</span></header>
      <section className={`fw-hero${axialEntry||study||entry.diagram||entry.diagrams?' fw-hero-visual':''}`} aria-label="核心公式与图解">
        <div className="fw-governing"><span className="fw-eyebrow">核心关系式</span><div className="fw-primary-slot"><EquationControl name={entry.name} formula={primaryFormula} primary/></div><div className="fw-governing-notes"><p className="fw-hero-description">{formulaReferenceScope(entry)[0]}</p>{axialEntry&&<div className="fw-unit-tags"><span>1 MPa = 1 N/mm²</span><span>拉伸 + / 压缩 −</span></div>}</div></div>
        {study&&studyResult?<FormulaStudyDiagram studyId={entry.id} config={study} result={studyResult} params={studyParams} onChange={patch=>setStudyParams(v=>({...v,...patch}))}/>:axialEntry&&axialResult?<FormulaAxialDiagram input={axial} result={axialResult}/>:entry.diagram||entry.diagrams?<Diagram entry={entry} values={beamValues}/>:null}
      </section>
      <section className="fw-matrix" aria-label="关联公式与适用条件"><header><div role="group" aria-label="公式资料"><button type="button" aria-pressed={section==='formulas'} onClick={()=>setSection('formulas')}><BookOpen size={14}/>关联公式</button><button type="button" aria-pressed={section==='substitution'} onClick={()=>setSection('substitution')}><Calculator size={14}/>当前代入</button><button type="button" aria-pressed={section==='conditions'} onClick={()=>setSection('conditions')}>适用条件</button></div><span>{section==='substitution'?`${workedSteps.length} 个计算步骤`:`${rows.length} 条关联公式`}</span></header>
        {section!=='conditions'?<div className="fw-matrix-body"><div className="fw-matrix-labels"><span>{section==='substitution'?'计算步骤':'物理关系'}</span><span>{section==='substitution'?'当前参数代入 · N、mm、MPa':'解析公式'}</span><span>操作</span></div><div className="fw-equations">{visibleRows.map((formula,i)=><EquationControl key={`${i}-${formula.label}`} name={entry.name} formula={formula}/>)}</div>{visibleRows.length===0&&<p className="fw-model-note">{section==='substitution'?'当前参数无法计算，请先修正右侧参数。':'当前条目仅含上方核心关系式。'}</p>}</div>:<section className="fw-conditions"><h3>适用条件</h3><ul>{conditions.map(condition=><li key={condition}>{condition}</li>)}</ul></section>}
        {related.length>0&&<footer className="fw-related"><span>相关条目</span>{related.slice(0,4).map(item=><button type="button" key={keyOf(item)} onClick={()=>onSelect(item)}>{item.name}<ChevronRight size={12}/></button>)}</footer>}
      </section>
    </div>
    <aside className="fw-reference-rail" aria-label="参数计算与公式说明">
      {study&&studyResult?<FormulaStudySandbox key={revision} config={study} result={studyResult} params={studyParams} onChange={patch=>setStudyParams(v=>({...v,...patch}))} onReset={()=>{setStudyParams(studyDefaults(study));setRevision(v=>v+1);}}/>:axialEntry&&axialResult?<FormulaAxialSandbox focus={entry.id==='axial-deform'?'deformation':entry.id==='strain-energy'?'energy':'stress'} key={revision} input={axial} result={axialResult} onChange={patch=>setAxial(v=>({...v,...patch}))} onReset={()=>{setAxial({...DEFAULT_FORMULA_AXIAL});setRevision(v=>v+1);}}/>:entry.calculator?<BeamCalculator id={entry.id} config={entry.calculator} values={beamValues} setValues={setBeamValues}/>:<header className="fw-reference-heading"><BookOpen size={16}/>公式说明</header>}
      <details className="fw-glossary" open={!axialEntry&&!entry.calculator&&!study}><summary>符号说明 <ChevronDown size={13}/></summary><section className="fw-symbols"><h3>符号说明</h3><dl>{symbols.map((symbol,i)=><div key={`${symbol.symbol}-${i}`}><dt>{symbol.symbol}</dt><dd>{symbol.description}</dd></div>)}</dl></section></details>
      <section className="fw-conditions fw-inspector-conditions"><h3>模型范围</h3><ul>{conditions.map(condition=><li key={condition}>{condition}</li>)}</ul></section>
    </aside>
  </article>;
}
export function FormulaWorkbench({entries}:{entries:readonly FormulaWorkbenchEntry[]}){
  const [family,setFamily]=useState<'all'|FormulaReferenceKind>('basic'),[group,setGroup]=useState('all'),[query,setQuery]=useState(''),[selected,setSelected]=useState(keyOf(entries[0]));
  const dialog=useRef<HTMLDialogElement>(null),search=useRef<HTMLInputElement>(null),opener=useRef<HTMLButtonElement|null>(null);
  const familyEntries=useMemo(()=>filterFormulaReferences(entries,{kind:family,query}),[entries,family,query]);
  const groups=useMemo(()=>Array.from(new Set(familyEntries.map(e=>`${e.kind}/${e.group}`))),[familyEntries]);
  const filtered=useMemo(()=>filterFormulaReferences(familyEntries,{group}),[familyEntries,group]);
  // 搜索只筛目录，不用空搜索结果替换正在阅读的工作台。
  const entry=entries.find(e=>keyOf(e)===selected)??entries[0];
  const openCatalog=(button?:HTMLButtonElement)=>{opener.current=button??null;dialog.current?.showModal();search.current?.focus();};
  const choose=(item:FormulaWorkbenchEntry)=>{setSelected(keyOf(item));setFamily(item.kind);setQuery('');setGroup('all');dialog.current?.close();};
  const selectFamily=(kind:typeof family)=>{setFamily(kind);setGroup('all');setQuery('');const first=entries.find(e=>kind==='all'||e.kind===kind);if(first)setSelected(keyOf(first));};
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.current?.open)openCatalog();}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
  return <div className="formula-workbench">
    <div className="fw-topbar"><div className="fw-families" role="group" aria-label="公式库分类">{families.map(f=><button type="button" key={f.id} aria-pressed={family===f.id} onClick={()=>selectFamily(f.id)}>{f.label}<span>{entries.filter(e=>f.id==='all'||e.kind===f.id).length}</span></button>)}</div><div className="fw-catalog-actions"><button type="button" className="fw-catalog-button" aria-haspopup="dialog" onClick={e=>openCatalog(e.currentTarget)}><Menu size={15}/>公式目录<ChevronDown size={13}/></button><button type="button" className="fw-search-trigger" aria-label="搜索公式、符号或知识点" aria-haspopup="dialog" onClick={e=>openCatalog(e.currentTarget)}><Search size={15}/><span>搜索公式 / 符号 / 工况</span><kbd>⌘ K</kbd></button></div></div>
    <FormulaDetail key={keyOf(entry)} entry={entry} entries={entries} onSelect={choose}/>
    <dialog ref={dialog} className="fw-catalog-dialog" aria-label="公式目录" onClose={()=>opener.current?.focus()} onClick={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();}}>
      <header><h2>公式目录</h2><button type="button" aria-label="关闭公式目录" onClick={()=>dialog.current?.close()}><X size={18}/></button></header>
      <div className="fw-catalog-search"><Search size={17}/><input ref={search} type="search" aria-label="搜索公式、符号或知识点" placeholder="搜索公式、符号或知识点" value={query} onChange={e=>{setQuery(e.target.value);if(e.target.value.trim())setFamily('all');setGroup('all');}}/>{query&&<button type="button" aria-label="清空公式搜索" onClick={()=>setQuery('')}><X size={15}/></button>}</div>
      <nav className="fw-category-filter" aria-label="公式知识目录"><ListFilter size={14}/><select aria-label="筛选知识分类" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">全部知识点</option>{groups.map(id=><option key={id} value={id}>{id.split('/')[1]}</option>)}</select><select aria-label="筛选公式库" value={family} onChange={e=>{setFamily(e.target.value as typeof family);setGroup('all');}}>{families.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select><span>{filtered.length} 个条目</span></nav>
      <section className="fw-list" aria-label="公式条目"><div className="fw-list-items">{filtered.map(item=><button type="button" key={keyOf(item)} className="fw-entry" aria-current={entry===item?'true':undefined} onClick={()=>choose(item)}><span className="fw-entry-top"><small>{item.group}</small><span>{item.formulas.length} 式</span></span><strong>{item.name}</strong><div className="fw-entry-preview"><LatexRenderer formula={item.formulas[0].formula} label={`${item.name}预览`}/><ChevronRight size={14}/></div></button>)}</div>{!filtered.length&&<div className="fw-empty"><Search size={25}/><h3>没有找到相关公式</h3><p>试试“弯曲”、σ 或 I_x</p></div>}</section>
    </dialog>
  </div>;
}
