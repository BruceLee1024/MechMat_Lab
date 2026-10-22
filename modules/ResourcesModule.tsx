import React,{useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight,BookOpen,GraduationCap,FileText,Library,Search,SlidersHorizontal,Globe,Link2,FlaskConical,X,Calculator,Info} from 'lucide-react';
import type {ModuleType} from '../types';
import {RESOURCE_CATALOG,filterResources,type LearningResource,type ResourceCategory,type ResourceDifficulty} from '../resources/catalog';
import '../resources-library.css';

const categories:{id:ResourceCategory|'all';label:string;icon:React.ElementType}[]=[
 {id:'all',label:'全部资源',icon:Library},{id:'course',label:'课程与课堂',icon:GraduationCap},{id:'reading',label:'教材与讲义',icon:BookOpen},{id:'practice',label:'习题与训练',icon:FileText},{id:'tool',label:'在线工具',icon:Calculator},{id:'local',label:'站内实验',icon:FlaskConical},
];
const difficulty={beginner:'入门',intermediate:'进阶',advanced:'深入学习'};
const access={open:'开放使用',account:'登录 / 选课',catalog:'图书与配套',local:'站内模块'};
function ResourceAction({resource,onNavigate}:{resource:LearningResource;onNavigate?:(module:ModuleType)=>void}) {
 return resource.url?<a className="rl-action" href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`${resource.action}：${resource.title}（新标签页）`}>{resource.action}<ArrowUpRight size={15}/></a>:<button type="button" className="rl-action" disabled={!onNavigate} onClick={()=>{if(resource.module)onNavigate?.(resource.module);}}>{resource.action}<ArrowRight size={15}/></button>;
}

export function ResourcesModule({onNavigate}:{onNavigate?:(module:ModuleType)=>void}={}) {
 const [category,setCategory]=useState<ResourceCategory|'all'>('all'),[query,setQuery]=useState(''),[level,setLevel]=useState<ResourceDifficulty|'all'>('all'),[openOnly,setOpenOnly]=useState(false),[selected,setSelected]=useState<LearningResource|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
 const filters={query,difficulty:level,openOnly};
 const countable=filterResources(RESOURCE_CATALOG,filters),filtered=filterResources(RESOURCE_CATALOG,{...filters,category});
 const active=categories.find(c=>c.id===category)!;
 const filteredState=!!query.trim()||level!=='all'||openOnly||category!=='all';
 const reset=()=>{setQuery('');setLevel('all');setOpenOnly(false);setCategory('all');};
 return <div className="resource-library">
  <header className="rl-intro"><div><h2>精选学习资源</h2><p>课程、教材与计算工具，找到适合你的下一份资料。</p></div><div className="rl-curation"><Library size={19}/><strong>{RESOURCE_CATALOG.length}</strong><span>项精选入口</span></div></header>
  <div className="rl-search-row"><label className="rl-search"><Search size={17}/><input aria-label="搜索学习资源" placeholder="搜索资源、作者、机构或知识点" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="清除资源搜索" onClick={()=>setQuery('')}><X size={15}/></button>}</label><label className="rl-level"><SlidersHorizontal size={14}/><select aria-label="资源学习难度" value={level} onChange={e=>setLevel(e.target.value as ResourceDifficulty|'all')}><option value="all">所有难度</option><option value="beginner">入门</option><option value="intermediate">进阶</option><option value="advanced">深入学习</option></select></label><button className="rl-open-filter" type="button" aria-pressed={openOnly} onClick={()=>setOpenOnly(!openOnly)}><Globe size={14}/>仅开放资源</button></div>
  <nav className="rl-categories" aria-label="资源分类">{categories.map(({id,label,icon:Icon})=><button type="button" key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}><Icon size={15}/><span>{label}</span><small>{id==='all'?countable.length:countable.filter(r=>r.category===id).length}</small></button>)}</nav>
  <section className="rl-scroll-area" aria-label="学习资源目录">
   <div className="rl-list-heading"><div><h3>{active.label}</h3><span role="status">{filtered.length} 项资源{query.trim()?` · “${query.trim()}”`:''}</span></div>{filteredState?<button type="button" onClick={reset}>重置筛选<X size={12}/></button>:<span className="rl-check-note"><Link2 size={12}/>官方来源 · 入口已核对</span>}</div>
   {filtered.length?<div className="rl-card-grid">{filtered.map(r=>{const config=categories.find(c=>c.id===r.category)!,Icon=config.icon;return <article key={r.id} className={`rl-resource-card is-${r.category}`}>
    <div className="rl-card-heading"><div className="rl-resource-symbol"><Icon size={23} strokeWidth={1.5}/></div><span>{config.label}</span><span className={`rl-access is-${r.access}`}>{access[r.access]}</span></div>
    <h3>{r.title}</h3><p className="rl-card-subtitle">{r.subtitle}</p><p className="rl-card-description">{r.description}</p>
    <div className="rl-card-tags">{r.tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div>
    <div className="rl-card-meta"><span>{difficulty[r.difficulty]}</span><i/><span>{r.language}</span><button type="button" aria-label={`使用说明：${r.title}`} aria-haspopup="dialog" onClick={event=>{trigger.current=event.currentTarget;setSelected(r);dialog.current?.showModal();}}><Info size={12}/>使用说明</button></div>
    <footer><span className="rl-card-source" title={r.source}>{r.source}</span><ResourceAction resource={r} onNavigate={onNavigate}/></footer>
   </article>;})}</div>:<div className="rl-empty"><Search size={30} strokeWidth={1.3}/><h3>没有找到匹配的资料</h3><p>试试更短的关键词，或放宽分类与难度条件。</p><button type="button" onClick={reset}>清除全部筛选</button></div>}
   <footer className="rl-list-footer"><span>高校、出版社与工具官方入口 · 核对于 2026.10.21</span><span>登录、课程安排及授权条件以原站为准。</span></footer>
  </section>
  <dialog ref={dialog} className="rl-resource-dialog" aria-labelledby="resource-detail-title" onClose={()=>{setSelected(null);trigger.current?.focus();}} onClick={event=>{if(event.target===event.currentTarget){const b=event.currentTarget.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.current?.close();}}}>
   <header><span>资源使用说明</span><button type="button" aria-label="关闭资源说明" onClick={()=>dialog.current?.close()}><X size={18}/></button></header>
   {selected&&<div className="rl-dialog-body"><h3 id="resource-detail-title">{selected.title}</h3><p className="rl-dialog-subtitle">{selected.subtitle}</p><p>{selected.description}</p><dl><div><dt>来源</dt><dd>{selected.source}</dd></div><div><dt>作者 / 团队</dt><dd>{selected.author}</dd></div><div><dt>使用条件</dt><dd>{access[selected.access]}</dd></div></dl><div className="rl-access-note"><Info size={16}/><p>{selected.accessNote}</p></div><ResourceAction resource={selected} onNavigate={module=>{dialog.current?.close();onNavigate?.(module);}}/>{selected.url&&<span className="rl-dialog-source">{new URL(selected.url).hostname} · 入口核对 {selected.checkedOn}</span>}</div>}
  </dialog>
 </div>;
}
