import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowLeftRight, BookOpen, Box, Calculator, Columns3, Folder, Layers, Maximize2, Pause, Play, RotateCw, Ruler, Spline, TextCursor, SquareFunction, X } from 'lucide-react';
import type { ModuleType } from '../types';
import { HomeMechanicsPreview } from '../components/HomeMechanicsPreview';
import { type HomePreviewMode } from '../mechanics/homePreview';
import { LatexRenderer } from '../components/LatexRenderer';
import '../home-lab.css';
import '../home-landing.css';

const asset = (name: string) => `${import.meta.env.BASE_URL}images/landing/${name}.webp`;
const experiments: { id: ModuleType; title: string; description: string; icon: React.ElementType; tone: string }[] = [
 { id: 'fundamentals', title: '理论基础', description: '从三维试件建立力学直觉。', icon: BookOpen, tone: 'cyan' },
 { id: 'axial', title: '轴向拉伸', description: '观察材料的变形与轴向应力。', icon: ArrowLeftRight, tone: 'cyan' },
 { id: 'bending', title: '梁的弯曲', description: '观察弯曲时的应力分布。', icon: Spline, tone: 'blue' },
 { id: 'torsion', title: '圆轴扭转', description: '理解剪应力与截面转角。', icon: RotateCw, tone: 'violet' },
 { id: 'buckling', title: '压杆稳定', description: '探索边界条件与失稳模式。', icon: Columns3, tone: 'amber' },
 { id: 'combined', title: '组合变形', description: '在同一截面叠加多种内力。', icon: Layers, tone: 'coral' },
 { id: 'stress', title: '应力状态', description: '认识主应力与应力变换。', icon: Box, tone: 'cyan' },
];
const tools: { id: ModuleType; title: string; description: string; icon: React.ElementType }[] = [
 { id: 'solver', title: '结构求解器', description: '快速建立模型，求解内力与变形。', icon: Calculator },
 { id: 'section', title: '截面计算', description: '计算截面惯性与截面特性。', icon: TextCursor },
 { id: 'formulas', title: '常用公式', description: '力学公式与实用参考。', icon: SquareFunction },
 { id: 'resources', title: '学习资源', description: '课程、教材与扩展阅读。', icon: Folder },
];
const modes: { id: HomePreviewMode; label: string; icon: React.ElementType; formula: string }[] = [
 { id: 'axial', label: '拉伸', icon: ArrowLeftRight, formula: '\\sigma=\\frac{N}{A}' },
 { id: 'bending', label: '弯曲', icon: Ruler, formula: '\\sigma=\\frac{My}{I}' },
 { id: 'torsion', label: '扭转', icon: RotateCw, formula: '\\tau=\\frac{T\\rho}{J}' },
];
type InfoType = 'about' | 'guide' | 'contact';

export const HomeModule: React.FC<{ onNavigate: (module: ModuleType) => void }> = ({ onNavigate }) => {
 const [mode, setMode] = useState<HomePreviewMode>('axial');
 const [factor, setFactor] = useState(.72);
 const [motion, setMotion] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [demoOpen, setDemoOpen] = useState(false), [info, setInfo] = useState<InfoType>('about');
 const demo = useRef<HTMLDialogElement>(null), infoDialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLElement | null>(null);
 const title = mode === 'axial' ? '轴向拉伸' : mode === 'bending' ? '梁的弯曲' : '圆轴扭转';
 const showDemo = (event: React.MouseEvent<HTMLElement>) => { trigger.current = event.currentTarget; setDemoOpen(true); demo.current?.showModal(); };
 const showInfo = (type: InfoType, event: React.MouseEvent<HTMLElement>) => { trigger.current = event.currentTarget; setInfo(type); infoDialog.current?.showModal(); };
 const closeOnBackdrop = (event: React.MouseEvent<HTMLDialogElement>) => { if (event.target !== event.currentTarget) return; const b = event.currentTarget.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) event.currentTarget.close(); };
 const card = ({ id, title, description, icon: Icon, tone }: typeof experiments[number]) => <button key={id} type="button" className={`ml-module ml-module-${id} ml-tone-${tone}`} onClick={() => onNavigate(id)}>
  <img src={asset(id)} className="ml-module-image" alt="" width="1536" height="1024" loading="eager" decoding="async"/>
  <span className="ml-module-icon"><Icon size={25} strokeWidth={1.5}/></span>
  <span className="ml-module-copy"><strong>{title}</strong><span>{description}</span></span>
  <span className="ml-module-enter" aria-hidden="true"><ArrowRight size={19}/></span>
 </button>;
 return <div id="home-top" className={`home-landing ml-mode-${mode}`} data-motion={motion ? 'running' : 'paused'}>
  <div className="ml-backdrop" aria-hidden="true">{modes.map(m => <img key={m.id} src={asset(`hero-${m.id}`)} className={mode === m.id ? 'is-active' : ''} alt="" width="1586" height="992" fetchPriority={m.id === 'axial' ? 'high' : 'auto'} decoding="async"/>)}</div>
  <header className="ml-header"><div className="ml-shell ml-header-inner">
   <a className="ml-brand" href="#home-top" aria-label="材料力学可视化实验室首页"><img src={asset('brand')} alt="" width="46" height="36"/><span>MechMat Lab<small>材料力学可视化实验室</small></span></a>
   <nav aria-label="首页快捷导航"><a href="#home-experiments" className="is-active">力学实验</a><a href="#home-tools">学习工具</a><button type="button" onClick={() => onNavigate('resources')}>学习资源</button></nav>
   <button type="button" className="ml-header-cta" onClick={() => onNavigate('fundamentals')}>进入实验室<ArrowRight size={18}/></button>
  </div></header>
  <div className="ml-shell ml-main">
   <section className="ml-hero" aria-label="材料力学可视化实验室">
    <div className="ml-hero-copy"><div className="ml-eyebrow">交互式力学探索空间</div><h1>材料力学<br/><span>可视化实验室</span></h1><p>改变参数，观察形态，让力学原理看得见。</p><div className="ml-hero-actions"><button type="button" className="ml-primary" onClick={() => onNavigate('fundamentals')}>开始探索<ArrowRight size={23}/></button><a href="#home-experiments">浏览实验<ArrowRight size={19}/></a></div></div>
    <div className="ml-hero-annotation" aria-hidden="true"><span>应力传递示意</span><LatexRenderer formula={modes.find(m => m.id === mode)!.formula}/><strong>{title}</strong><small>{mode === 'axial' ? '虚线：未变形状态' : mode === 'bending' ? '上压下拉 · 受力示意' : '圆轴截面相对转角'}</small></div>
    <div className="ml-scene-controls">
     <div className="ml-scene-modes" role="group" aria-label="首页受力示意">{modes.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => setMode(id)}><Icon size={18} strokeWidth={1.5}/>{label}</button>)}</div>
     <label className="ml-amplitude"><span>载荷幅值<output aria-live="polite">{Math.round(factor*100)}%</output></span><span><small>小</small><input type="range" min="0" max="100" value={Math.round(factor*100)} aria-label="首页演示载荷幅值" title={`${title} · ${Math.round(factor*100)}%`} onChange={event => setFactor(Number(event.target.value)/100)}/><small>大</small></span></label>
     <button type="button" className="ml-open-demo" aria-label="打开交互力学演示" title="打开交互力学演示" onClick={showDemo}><Maximize2 size={16}/></button>
    </div>
   </section>
   <section id="home-experiments" className="ml-experiments" aria-labelledby="ml-experiment-title">
    <header className="ml-section-heading"><span>探索力学</span><h2 id="ml-experiment-title">选择你的实验</h2><button type="button" className="ml-motion-toggle" aria-label={motion ? '暂停首页动效' : '开启首页动效'} aria-pressed={!motion} onClick={() => setMotion(!motion)}>{motion ? <Pause size={13}/> : <Play size={13}/>}</button></header>
    <div className="ml-experiment-row ml-first-row">{experiments.slice(0,3).map(card)}</div><div className="ml-experiment-row ml-second-row">{experiments.slice(3).map(card)}</div>
   </section>
  </div>
  <section id="home-tools" className="ml-tools" aria-label="学习工具"><div className="ml-shell ml-tools-inner"><div className="ml-tools-heading"><h2>学习工具</h2><p>提升计算与分析效率</p></div><div className="ml-tools-grid">{tools.map(({ id, title, description, icon: Icon }) => <button type="button" key={id} onClick={() => onNavigate(id)}><span className="ml-tool-icon"><Icon size={25} strokeWidth={1.5}/></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={15}/></button>)}</div></div></section>
  <footer className="ml-footer"><div className="ml-shell"><span>MechMat Lab <small>材料力学可视化实验室</small></span><nav aria-label="平台信息"><button type="button" onClick={event => showInfo('about',event)}>关于我们</button><button type="button" onClick={event => showInfo('guide',event)}>使用指南</button><button type="button" onClick={event => showInfo('contact',event)}>联系我们</button></nav></div></footer>
  <dialog ref={demo} className="ml-demo-dialog" aria-labelledby="ml-demo-title" onClose={() => { setDemoOpen(false); trigger.current?.focus(); }} onClick={closeOnBackdrop}><header><div><h2 id="ml-demo-title">交互力学演示</h2><p>圆杆线弹性教学模型 · 几何按标注倍率放大</p></div><button type="button" aria-label="关闭交互演示" onClick={() => demo.current?.close()}><X size={20}/></button></header>{demoOpen && <div className="home-lab ml-demo-body"><HomeMechanicsPreview mode={mode} onModeChange={setMode} motion={motion} factor={factor} onFactorChange={setFactor}/><button type="button" className="ml-demo-enter" onClick={() => { demo.current?.close(); onNavigate(mode); }}>进入{title}实验<ArrowRight size={16}/></button></div>}</dialog>
  <dialog ref={infoDialog} className="ml-info-dialog" aria-labelledby="ml-info-title" onClose={() => trigger.current?.focus()} onClick={closeOnBackdrop}><header><h2 id="ml-info-title">{info === 'about' ? '关于实验室' : info === 'guide' ? '使用指南' : '联系我们'}</h2><button type="button" aria-label="关闭平台信息" onClick={() => infoDialog.current?.close()}><X size={19}/></button></header><div>{info === 'about' ? <><p>MechMat Lab 材料力学可视化实验室，将三维受力、材料响应、截面特性与计算结果连接起来，帮助理解材料力学原理。</p><p>首页图像展示受力概念；交互演示与实验模块分别标明计算模型、参数和显示放大倍率。</p></> : info === 'guide' ? <ol><li>从“理论基础”建立应力、应变与变形的直觉。</li><li>选择实验，设置材料、截面与载荷，观察三维形态和计算结果。</li><li>结合公式代入、适用条件与理论说明核对结果。</li><li>用截面计算、常用公式和学习资源继续探索。</li></ol> : <><p>微信扫码联系作者</p><img className="ml-contact-qr" src={`${import.meta.env.BASE_URL}wechat-qr.png`} alt="作者微信二维码" width="220" height="220"/></>}</div></dialog>
 </div>;
};
