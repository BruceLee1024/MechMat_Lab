import React,{useEffect,useId,useMemo,useState} from 'react';
import {Layers,LocateFixed,ScanLine,Copy,Play,Pause,StepForward,BookmarkPlus,ZoomIn,ZoomOut,Maximize} from 'lucide-react';
import {LatexRenderer} from './LatexRenderer';
import {texNumber} from '../mechanics/formulaExplanations';
import {scanSection,type SectionTeachingData,type TeachingPart,type TeachingAxis,type TeachingMode} from '../mechanics/sectionTeaching';
import type {SectionToolGeometry} from '../mechanics/sectionToolGeometry';
import '../section-teaching.css';

const number=(v:number)=>!Number.isFinite(v)?'—':v===0?'0':Math.abs(v)>=1e7||Math.abs(v)<.001?v.toExponential(3):v.toLocaleString('zh-CN',{maximumFractionDigits:3});
const percent=(v:number)=>`${(v*100).toFixed(1)}%`;
const modes=[['parts','分块',Layers],['centroid','形心',LocateFixed],['inertia','惯性贡献',ScanLine],['compare','尺寸对比',Copy]] as const;
const captions:Record<TeachingMode,string>={parts:'点击分块，查看面积与原位惯性贡献',centroid:'分块形心 → 面积加权 → 整体形心',inertia:'颜色表示距形心轴的距离平方；扫描累计面积二次矩',compare:'比例尺锁定到基准，拖动下方尺寸查看影响'};

export function SectionTeachingCanvas({data,reference,zoom,axes,dimensions,label,mode,onMode,axis,onAxis,selectedId,onSelect,onBaseline,onZoom}:{
  data:SectionTeachingData;reference:SectionToolGeometry|null;zoom:number;axes:boolean;dimensions:boolean;label:string;
  mode:TeachingMode;onMode:(mode:TeachingMode)=>void;axis:TeachingAxis;onAxis:(axis:TeachingAxis)=>void;
  selectedId:string|null;onSelect:(id:string)=>void;onBaseline:()=>void;onZoom:(zoom:number)=>void;
}){
  const id=useId(),g=data.geometry,W=720,H=470,cx=W/2,cy=H/2-28;
  const [progress,setProgress]=useState(1),[playing,setPlaying]=useState(false),[reduced,setReduced]=useState(false);
  useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(mq.matches);update();mq.addEventListener('change',update);return()=>mq.removeEventListener('change',update);},[]);
  useEffect(()=>{setPlaying(false);setProgress(1);},[data,mode,axis]);
  useEffect(()=>{
    if(!playing||reduced||mode==='compare')return;
    let frame=0,last=performance.now();
    const tick=(time:number)=>{const delta=time-last;if(delta>=33){setProgress(p=>Math.min(1,p+Math.min(delta,100)/6000));last=time;}frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[playing,reduced,mode]);
  useEffect(()=>{if(progress>=1&&playing)setPlaying(false);},[progress,playing]);
  const activeIndex=Math.min(data.parts.length-1,Math.floor(progress*data.parts.length));
  useEffect(()=>{if(playing&&(mode==='parts'||mode==='centroid'))onSelect(data.parts[activeIndex].id);},[activeIndex,playing,mode,data,onSelect]);
  useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
  const selected=data.parts.find(p=>p.id===selectedId)??data.parts[0];
  const scan=useMemo(()=>scanSection(data,axis,progress),[data,axis,progress]);
  const frame=mode==='compare'&&reference?reference:g;
  const ex=Math.max(frame.maxX-frame.cx,frame.cx-frame.minX),ey=Math.max(frame.maxY-frame.cy,frame.cy-frame.minY);
  // 对比固定世界坐标原点与比例；尺寸改变不会把新截面自动缩回旧大小。
  const baseScale=Math.min((W-205)/(2*ex),(H-170)/(2*ey))*(mode==='compare'?.8:1),scale=baseScale*zoom,originX=frame.cx,originY=frame.cy;
  const fit=()=>{if(mode!=='compare'){onZoom(1);return;}const contentEx=Math.max(ex,g.maxX-originX,originX-g.minX),contentEy=Math.max(ey,g.maxY-originY,originY-g.minY);onZoom(Math.max(.1,Math.min(3,Math.min((W-205)/(2*contentEx),(H-170)/(2*contentEy))/baseScale)));};
  const X=(x:number)=>cx+(x-originX)*scale,Y=(y:number)=>cy-(y-originY)*scale;
  const partPath=(p:TeachingPart)=>`M${p.vertices.map(v=>`${X(v.x).toFixed(3)},${Y(v.y).toFixed(3)}`).join('L')}Z`;
  const geometryPath=(q:SectionToolGeometry)=>q.paths.map(p=>`M${p.vertices.map(v=>`${X(v.x).toFixed(3)},${Y(v.y).toFixed(3)}`).join('L')}Z`).join('');
  const path=geometryPath(g),l=X(g.minX),r=X(g.maxX),t=Y(g.maxY),b=Y(g.minY),xc=X(data.cx),yc=Y(data.cy);
  const split=mode==='parts'?Math.sin(Math.PI*progress)*25:0;
  const offset=(p:TeachingPart)=>({x:split*(p.sign<0?1.5:Math.sign(p.cx-data.cx)),y:-split*Math.sign(p.cy-data.cy)});
  const min=axis==='x'?g.minY:g.minX,max=axis==='x'?g.maxY:g.maxX,center=axis==='x'?data.cy:data.cx,maxDistance=Math.max(max-center,center-min);
  const focusValue=axis==='x'?data.Ix:data.Iy;
  const labelForMode=modes.find(m=>m[0]===mode)![1];
  const play=()=>{if(playing){setPlaying(false);return;}if(progress>=1)setProgress(0);setPlaying(true);};
  const choose=(next:TeachingMode)=>{setPlaying(false);setProgress(1);onMode(next);};
  return <>
    <div className={`section-geometry-canvas section-teaching-canvas is-${mode}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}等比例截面，宽 ${number(g.width)} mm，高 ${number(g.height)} mm，形心 (${number(data.cx)},${number(data.cy)}) mm；${labelForMode}演示`}>
        <defs>
          <pattern id={`${id}-grid`} width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#25415a" strokeWidth=".6"/></pattern>
          <pattern id={`${id}-hole`} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M-1 1L1-1M0 7L7 0M6 8L8 6" stroke="#e9ad93" strokeWidth=".65" opacity=".5"/></pattern>
          <clipPath id={`${id}-solid`}><path d={path} clipRule="evenodd"/></clipPath>
          <clipPath id={`${id}-scan`}><rect x={axis==='x'?0:l} y={axis==='x'?Y(scan.cut):0} width={axis==='x'?W:Math.max(0,X(scan.cut)-l)} height={axis==='x'?Math.max(0,b-Y(scan.cut)):H}/></clipPath>
          {reference&&<><mask id={`${id}-added`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><rect width={W} height={H} fill="black"/><path d={path} fill="white" fillRule="evenodd"/><path d={geometryPath(reference)} fill="black" fillRule="evenodd"/></mask><mask id={`${id}-removed`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><rect width={W} height={H} fill="black"/><path d={geometryPath(reference)} fill="white" fillRule="evenodd"/><path d={path} fill="black" fillRule="evenodd"/></mask></>}
          <linearGradient id={`${id}-heat`} gradientUnits="userSpaceOnUse" x1={axis==='x'?0:l} x2={axis==='x'?0:r} y1={axis==='x'?b:0} y2={axis==='x'?t:0}>
            {Array.from({length:21},(_,i)=>{const v=min+(max-min)*i/20,w=((v-center)/maxDistance)**2;return <stop key={i} offset={i/20} stopColor={`rgb(${Math.round(30+210*w)},${Math.round(111+76*w)},${Math.round(148-20*w)})`}/>;})}
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-grid)`} opacity=".34"/>
        {reference&&<path className="section-baseline-outline" d={geometryPath(reference)} fill="none" stroke="#b8a6d2" strokeWidth="1.4" strokeDasharray="6 5"/>}
        <path className="section-live-outline" d={path} fillRule="evenodd" opacity={mode==='parts'?.35:1}/>
        {mode==='compare'&&reference&&<g key={path} className="teaching-area-change"><path d={path} fill="#8fdfc5" fillRule="evenodd" mask={`url(#${id}-added)`}/><path d={geometryPath(reference)} fill="#e6ab91" fillRule="evenodd" mask={`url(#${id}-removed)`}/></g>}
        {mode==='inertia'?<>
          <g clipPath={`url(#${id}-solid)`}><rect x="0" y="0" width={W} height={H} fill={`url(#${id}-heat)`} opacity=".15"/><g clipPath={`url(#${id}-scan)`}><rect x="0" y="0" width={W} height={H} fill={`url(#${id}-heat)`} opacity=".75"/></g></g>
          {progress>0&&progress<1&&<g className="teaching-scan-line">{axis==='x'?<><path d={`M${l-15} ${Y(scan.cut)}H${r+15}`} strokeWidth="8" opacity=".1"/><path d={`M${l-15} ${Y(scan.cut)}H${r+15}`}/><circle cx={r+15} cy={Y(scan.cut)} r="3"/></>:<><path d={`M${X(scan.cut)} ${t-12}V${b+12}`} strokeWidth="8" opacity=".1"/><path d={`M${X(scan.cut)} ${t-12}V${b+12}`}/><circle cx={X(scan.cut)} cy={t-12} r="3"/></>}</g>}
        </>:null}
        {mode!=='compare'&&[...data.parts].sort((a,b)=>b.sign-a.sign).map((p,i)=>{
          const o=offset(p),active=p.id===selected.id,showSplit=mode==='parts',peers=data.parts.filter(q=>Math.abs(q.cy-p.cy)*scale<20),labelY=Y(p.cy)+(peers.findIndex(q=>q.id===p.id)-(peers.length-1)/2)*18,labelX=Math.min(r+48,W-95),reveal=playing?Math.min(1,Math.max(0,progress*data.parts.length-data.parts.findIndex(q=>q.id===p.id))):1;
          return <g key={p.id} className={`teaching-part ${active?'is-selected':''}`} style={{'--part-color':p.color} as React.CSSProperties}>
            <path d={partPath(p)} transform={`translate(${o.x} ${o.y})`} fill={mode==='inertia'?'transparent':p.sign<0?'#0b1827':p.color} fillOpacity={mode==='inertia'?0:p.sign<0?1:(active?.25:.12)*(mode==='parts'?reveal:1)} stroke={p.color} strokeWidth={active?2:1} strokeDasharray={p.sign<0?'4 3':undefined} onClick={()=>onSelect(p.id)} onMouseEnter={()=>{if(!playing)onSelect(p.id);}}/>
            {p.sign<0&&showSplit&&<path d={partPath(p)} transform={`translate(${o.x} ${o.y})`} fill={`url(#${id}-hole)`} pointerEvents="none"/>}
            {showSplit&&(data.parts.length<=8||active)&&<g transform={`translate(${o.x} ${o.y})`} pointerEvents="none"><path className="teaching-leader" d={`M${X(p.cx)} ${Y(p.cy)}L${labelX-16} ${labelY}H${labelX-6}`}/><text x={labelX} y={labelY+4} fill={p.color}>{p.label}</text></g>}
            {mode==='centroid'&&<g opacity={reveal} pointerEvents="none"><path className="teaching-centroid-link" d={`M${X(p.cx)} ${Y(p.cy)}H${xc}V${yc}`} stroke={p.color}/><circle cx={X(p.cx)} cy={Y(p.cy)} r={3+Math.sqrt(p.A/Math.max(data.A,p.A))*4} fill={p.color}/><text x={X(p.cx)+10} y={Y(p.cy)-9} fill={p.color}>C{i+1}</text></g>}
          </g>;
        })}
        {mode==='inertia'&&<g className="teaching-distance" pointerEvents="none">{axis==='x'?<><path d={`M${X(selected.cx)+18} ${Y(selected.cy)}V${yc}`}/><text x={X(selected.cx)+25} y={(Y(selected.cy)+yc)/2-5}>dᵧ = {number(Math.abs(selected.dy))} mm</text></>:<><path d={`M${X(selected.cx)} ${Y(selected.cy)-18}H${xc}`}/><text x={(X(selected.cx)+xc)/2} y={Y(selected.cy)-27} textAnchor="middle">dₓ = {number(Math.abs(selected.dx))} mm</text></>}</g>}
        {(axes||mode==='centroid'||mode==='inertia')&&<g className="section-centroid-axes">{axes&&<><path d={`M35 ${yc}H${W-35}`} stroke="#8bbcec" className={mode==='inertia'&&axis==='x'?'teaching-active-axis':''}/><path d={`M${xc} 38V${H-38}`} stroke="#8fdfca" className={mode==='inertia'&&axis==='y'?'teaching-active-axis':''}/><text x={W-30} y={yc-9}>x</text><text x={xc+10} y={38}>y</text></>}<g opacity={mode==='centroid'&&playing?Math.max(0,(progress-.65)/.35):1}><circle cx={xc} cy={yc} r="4"/><text x={xc+11} y={yc+19}>C</text></g></g>}
        {dimensions&&<g className="section-dimension-lines"><path d={`M${l} ${b+8}V${b+35}M${r} ${b+8}V${b+35}M${l} ${b+27}H${r}M${mode==='parts'?l-8:r+8} ${t}H${mode==='parts'?l-35:r+35}M${mode==='parts'?l-8:r+8} ${b}H${mode==='parts'?l-35:r+35}M${mode==='parts'?l-27:r+27} ${t}V${b}`}/><text x={(l+r)/2} y={b+50} textAnchor="middle">总宽 {number(g.width)} mm</text><text x={mode==='parts'?l-45:r+45} y={(t+b)/2} transform={`rotate(-90 ${mode==='parts'?l-45:r+45} ${(t+b)/2})`} textAnchor="middle">总高 {number(g.height)} mm</text></g>}
      </svg>
      <div className="teaching-scene-caption"><span>{labelForMode}</span><small>{mode==='compare'?'比例尺已锁定':mode==='parts'&&progress<1?'展开仅为演示，计算使用原位尺寸':'真实尺寸 · 原位积分'}</small></div>
      {mode==='inertia'&&<div className="teaching-axis-switch" role="group" aria-label="惯性贡献参考轴">{(['x','y'] as const).map(a=><button type="button" key={a} aria-pressed={axis===a} onClick={()=>{setPlaying(false);setProgress(1);onAxis(a);}}>I<sub>{a}</sub></button>)}</div>}
      {mode==='inertia'&&<div className="teaching-scan-readout"><span>已扫描 {Math.round(progress*100)}%</span><output>累计 I{axis==='x'?'ₓ':'ᵧ'} <b>{number(scan.I)}</b> mm⁴</output><small>占总值 {percent(scan.I/focusValue)}</small></div>}
      {mode==='compare'&&<div className="teaching-difference-key"><span><i/>增加面积</span><span><i/>减少面积</span></div>}
      {mode==='inertia'&&<div className="teaching-heat-key"><span>距轴近</span><i/><span>距轴远 · 贡献大</span></div>}
      <div className="section-canvas-tools" role="toolbar" aria-label="截面预览控制"><button type="button" aria-label="缩小截面预览" disabled={zoom<=.1} onClick={()=>onZoom(Math.max(.1,zoom-.2))}><ZoomOut size={15}/></button><output>{Math.round(zoom*100)}%</output><button type="button" aria-label="放大截面预览" disabled={zoom>=3} onClick={()=>onZoom(Math.min(3,zoom+.2))}><ZoomIn size={15}/></button><button type="button" aria-label="适应截面画布" onClick={fit}><Maximize size={15}/></button></div>
    </div>
    <div className="section-teaching-controls">
      <div className="teaching-control-top"><div role="group" aria-label="截面计算演示模式" className="teaching-mode-switch">{modes.map(([value,title,Icon])=><button type="button" key={value} aria-pressed={mode===value} onClick={()=>choose(value)}><Icon size={13}/>{title}</button>)}</div>{mode==='compare'?<button type="button" className="teaching-play" onClick={onBaseline}><BookmarkPlus size={13}/>更新基准</button>:<div className="teaching-playback"><button type="button" className="teaching-play" disabled={reduced} title={reduced?'已开启减少动态效果，可拖动进度或单步查看':undefined} aria-label={playing?'暂停计算演示':'播放计算演示'} onClick={play}>{playing?<Pause size={13}/>:<Play size={13}/>}<span>{playing?'暂停':'演示'}</span></button><button type="button" aria-label="计算演示单步前进" onClick={()=>{setPlaying(false);setProgress(v=>v>=1?0:Math.min(1,v+.2));}}><StepForward size={15}/></button></div>}</div>
      <div className="teaching-control-bottom"><p>{captions[mode]}</p>{mode!=='compare'&&<div className="teaching-progress"><input type="range" aria-label="计算演示进度" min="0" max="100" step="1" value={Math.round(progress*100)} style={{'--teaching-progress':`${progress*100}%`} as React.CSSProperties} onChange={e=>{setPlaying(false);setProgress(Number(e.target.value)/100);}}/><output>{Math.round(progress*100)}%</output></div>}</div>
    </div>
  </>;
}

function areaExpression(p:TeachingPart){
  return p.kind==='rectangle'?`${texNumber(p.width!)}\\times${texNumber(p.height!)}`:p.kind==='circle'?`\\pi\\times${texNumber(p.radius!)}^2`:String.raw`\frac12\left|\sum(x_i y_{i+1}-x_{i+1}y_i)\right|`;
}

/** 原位分块、负面积和总形心轴直接驱动画布与右栏说明。 */
export function SectionTeachingReadout({data,mode,axis,selectedId,onSelect}:{data:SectionTeachingData;mode:TeachingMode;axis:TeachingAxis;selectedId:string|null;onSelect:(id:string)=>void}){
  if(mode==='compare')return <div className="section-teaching-readout"><header><Copy size={13}/><span>尺寸对比</span></header><p>虚线为基准，实线为当前截面。保持同一坐标与比例，A / Iₓ / Iᵧ 的变化见尺寸控制区。</p></div>;
  const p=data.parts.find(q=>q.id===selectedId)??data.parts[0],I=axis==='x'?p.Ix:p.Iy,I0=axis==='x'?p.Ix0:p.Iy0,d=axis==='x'?p.dy:p.dx,totalI=axis==='x'?data.Ix:data.Iy;
  const flanges=data.parts.filter(q=>q.label.includes('翼缘')),flangeArea=flanges.reduce((sum,q)=>sum+q.sign*q.A,0),flangeI=flanges.reduce((sum,q)=>sum+(axis==='x'?q.Ix:q.Iy),0);
  const title=mode==='parts'?'分块与面积':mode==='centroid'?'面积加权求形心':`绕 ${axis} 轴的分块贡献`;
  const formula=mode==='parts'?`s_i A_i=${p.sign<0?'-':''}${areaExpression(p)}=${texNumber(p.sign*p.A)}\\,\\mathrm{mm}^2`:mode==='centroid'?String.raw`\bar x=\frac{\sum s_i A_i x_i}{\sum s_i A_i},\quad\bar y=\frac{\sum s_i A_i y_i}{\sum s_i A_i}`:`I_{${axis},i}=s_i\\left(I_{${axis},C_i}+A_i d^2\\right)`;
  return <section className="section-teaching-readout" aria-label="当前分块计算说明">
    <header><Layers size={13}/><span>{title}</span><small>推导使用 mm</small></header>
    <div className="teaching-part-choices" role="group" aria-label="选择计算分块">{data.parts.map(q=><button type="button" key={q.id} aria-pressed={q.id===p.id} onClick={()=>onSelect(q.id)} style={{'--part-color':q.color} as React.CSSProperties}><i/>{q.label}</button>)}</div>
    <LatexRenderer formula={formula} label={title}/>
    {mode==='inertia'?<><div className="teaching-contribution-terms"><span>自身 I<sub>{axis},Cᵢ</sub><b>{number(I0)}</b></span><span>平行轴 Aᵢd²<b>{number(p.A*d*d)}</b></span></div><p className="teaching-numeric-substitution">{p.sign<0?'−':''}({number(I0)} + {number(p.A)} × {number(Math.abs(d))}²) = <strong>{number(I)} mm⁴</strong></p><div className="teaching-share"><span>占净面积 <b>{percent(p.sign*p.A/data.A)}</b></span><span>贡献 I<sub>{axis}</sub> <b>{percent(I/totalI)}</b></span></div><small className="teaching-explanation">{p.sign<0?'内孔扣除自身惯性矩与平行轴项的整体贡献。':'距离取分块形心到整体形心轴的垂距；颜色表示距离平方。'}</small>{flanges.length>0&&<div className="teaching-flange-insight">翼缘合计 <span>面积 {percent(flangeArea/data.A)}</span><span>I<sub>{axis}</sub> {percent(flangeI/totalI)}</span></div>}</>:mode==='centroid'?<><div className="teaching-centroid-values"><span>分块 Cᵢ<b>({number(p.cx)}, {number(p.cy)})</b></span><span>整体 C<b>({number(data.cx)}, {number(data.cy)}) mm</b></span></div><p className="teaching-numeric-substitution">x̄ = {number(data.cx*data.A)} / {number(data.A)} = {number(data.cx)} mm<br/>ȳ = {number(data.cy*data.A)} / {number(data.A)} = {number(data.cy)} mm</p><p>Aᵢ = {number(p.A)} mm²，符号 sᵢ = {p.sign}；{p.sign<0?'内孔以负面积参与加权。':'各分块按有符号面积加权。'}</p></>:<><div className="teaching-area-sum"><span>合计 ΣsᵢAᵢ</span><strong>{number(data.A)} <small>mm²</small></strong></div><p>{p.sign<0?`内孔 Aᵢ = ${number(p.A)} mm² 取正值，sᵢ = −1，负项从总面积扣除。`:data.parts.some(q=>q.sign<0)?'实体项相加，内孔整项扣除；计算以原位轮廓为准。':'各实体分块互不重叠；组合后保持原截面的尺寸与位置。'}</p></>}
  </section>;
}
