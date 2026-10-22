import React, {useId, useMemo, useRef, useState} from 'react';
import {Check, Copy, Maximize2, Minus, Plus, X} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../formula-display.css';

/** 同一公式只渲染一次；本地字体和 MathML 与视觉公式同时到达。 */
export function LatexRenderer({formula, label='数学公式', expandable=false,explanation}: {
  formula:string; label?:string; expandable?:boolean;explanation?:React.ReactNode;
}) {
  const rendered=useMemo(()=>{
    if(!formula.trim())return null;
    try {
      // 只处理说明性单词；x、y、i 等变量下标不改，复制仍保留原始 LaTeX。
      const displayFormula=formula.replace(/_\{(min|max|cr|true|trans|axial|eng|VM|eq|total)\}/g,'_{\\mathrm{$1}}');
      return {html:katex.renderToString(displayFormula,{displayMode:true,output:'htmlAndMathml',throwOnError:true,strict:false,trust:false,maxSize:20}),error:false};
    } catch {
      return {html:'',error:true};
    }
  },[formula]);
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),titleId=useId();
  const [size,setSize]=useState(26),[copied,setCopied]=useState<'idle'|'done'|'error'>('idle'),[reading,setReading]=useState(false);
  if(!rendered)return null;
  if(rendered.error)return <div className="math-renderer math-renderer-error"><span>公式暂无法排版</span><code>{formula}</code></div>;
  const math=<div className="math-scroll" tabIndex={expandable?0:undefined} role="group" aria-label={label} dangerouslySetInnerHTML={{__html:rendered.html}}/>;
  return <div className={`math-renderer${expandable?' math-expandable':''}`}>
    {math}
    {explanation}
    {expandable&&<>
      <button type="button" ref={trigger} className="math-expand" aria-label={`放大公式：${label}`} title="放大阅读" aria-haspopup="dialog" onClick={()=>{setCopied('idle');setSize(26);setReading(true);dialog.current?.showModal();}}><Maximize2 size={13}/></button>
      <dialog ref={dialog} className="math-dialog" aria-labelledby={titleId} onClose={()=>{setReading(false);trigger.current?.focus();}} onKeyDown={e=>{if(e.key==='Escape')e.stopPropagation();}} onClick={e=>{
        if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();
        if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();
      }}>
        <header className="math-dialog-heading"><h3 id={titleId}>{label}</h3><button type="button" aria-label="关闭公式阅读" onClick={()=>dialog.current?.close()}><X size={18}/></button></header>
        <div className="math-dialog-body" style={{'--math-size':`${size}px`} as React.CSSProperties}>{math}{reading&&explanation}</div>
        <footer className="math-dialog-footer"><div className="math-type-controls" role="group" aria-label="公式字号"><button type="button" aria-label="缩小公式字号" disabled={size<=18} onClick={()=>setSize(v=>Math.max(18,v-2))}><Minus size={15}/></button><output aria-label="当前公式字号">{size} px</output><button type="button" aria-label="增大公式字号" disabled={size>=40} onClick={()=>setSize(v=>Math.min(40,v+2))}><Plus size={15}/></button></div><span role="status" className="math-copy-status">{copied==='error'?'复制失败，请重试':''}</span><button type="button" className="math-copy" onClick={async()=>{try{await navigator.clipboard.writeText(formula);setCopied('done');}catch{setCopied('error');}}}>{copied==='done'?<Check size={14}/>:<Copy size={14}/>}<span>{copied==='done'?'已复制':'复制 LaTeX'}</span></button></footer>
      </dialog>
    </>}
  </div>;
}
