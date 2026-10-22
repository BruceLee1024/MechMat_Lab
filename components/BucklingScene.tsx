import React,{useEffect,useRef,useState} from 'react';
import {Box,Square,Shapes,RotateCcw,Maximize2,ZoomIn,ZoomOut,Scan,Layers2,Waves} from 'lucide-react';
import {bucklingGeometry,bucklingVertex,bucklingStressAt,bucklingStressExtrema,bucklingStressGlyphs,type BucklingField} from '../mechanics/bucklingField';
import {bendingProfile} from '../graphics/bendingGeometry';
import {drawBeamSupport} from '../graphics/beamSupport';
type Point=[number,number];type Vec=[number,number,number];
export function BucklingScene({field,material,status,notice,available}:{field:BucklingField;material:string;status:string;notice:string;available:boolean}) {
  const [view,setView]=useState<'3d'|'weak'|'section'>('3d'),[zoom,setZoom]=useState(1),[requested,setRequested]=useState(20),[original,setOriginal]=useState(true),[flowOn,setFlowOn]=useState(true);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),figure=useRef<HTMLElement>(null),orbit=useRef(.55),drag=useRef<number|null>(null),redraw=useRef(()=>{}),drawFlow=useRef((time:number)=>{}),time=useRef(0);
  const g=bucklingGeometry(field),profile=bendingProfile(field.section),stressExtrema=bucklingStressExtrema(field),displayAmplitude=available?(g.amplitude??0)*requested:field.lengthMm*.035;
  useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update);},[]);
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const draw=()=>{
      const {width:w,height:h}=el.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);if(!w||!h)return;
      el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);const ctx=el.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);
      const projection=([x,y,z]:Vec):Point=>view==='weak'?[g.weakAxis==='z'?y:z,-x]:[y*Math.cos(orbit.current)+z*Math.sin(orbit.current),-x+(z*Math.cos(orbit.current)-y*Math.sin(orbit.current))*.25];
      const vertex=(x:number,y:number,z:number,a=displayAmplitude)=>bucklingVertex(field,x,y,z,a);
      const stations=Array.from({length:41},(_,i)=>i*field.lengthMm/40);
      const bounds=stations.flatMap(x=>profile.contours.flatMap(c=>c.map(([y,z])=>projection(vertex(x,y,z)))));bounds.push(...stations.map(x=>projection(vertex(x,0,0))));
      const minX=Math.min(...bounds.map(p=>p[0])),maxX=Math.max(...bounds.map(p=>p[0])),minY=Math.min(...bounds.map(p=>p[1])),maxY=Math.max(...bounds.map(p=>p[1]));
      const compact=h<320;
      const scale=Math.min((w-135)/Math.max(230,maxX-minX+120),(h-(compact?130:180))/Math.max(500,maxY-minY+10))*zoom;
      const cx=w*.5-(minX+maxX)/2*scale,cy=h*.5-(compact?10:35)-(minY+maxY)/2*scale;
      const screen=(p:Vec):Point=>{const v=projection(p);return[cx+v[0]*scale,cy+v[1]*scale];};
      const line=(points:Point[],color:string,width=1,dash:number[]=[])=>{if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.setLineDash([]);};
      const text=(label:string,p:Point,color='#a7c4da',align:CanvasTextAlign='center')=>{ctx.font=`${w<500?9:10}px ui-monospace,"PingFang SC",sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(label,...p);};
      const strokeContour=(x:number,c:typeof profile.contours[number],a:number,color:string,width=1,dash:number[]=[])=>line([...c,c[0]].map(([y,z])=>screen(vertex(x,y,z,a))),color,width,dash);
      const arrow=(a:Point,b:Point,color:string)=>{line([a,b],color,1.7);const t=Math.atan2(b[1]-a[1],b[0]-a[0]);line([[b[0]-7*Math.cos(t-.5),b[1]-7*Math.sin(t-.5)],b,[b[0]-7*Math.cos(t+.5),b[1]-7*Math.sin(t+.5)]],color,1.7);};
      if(view==='section'){
        const p=profile.contours.flat(),extent=Math.max(...p.map(([y,z])=>Math.max(Math.abs(y),Math.abs(z))),1),s=Math.min(w*.5,h*.42)/(2*extent),center:Point=[w*.5,h*.5];
        ctx.beginPath();for(const c of profile.contours){c.forEach(([y,z],i)=>{const q:Point=[center[0]+z*s,center[1]-y*s];i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();}ctx.save();ctx.clip('evenodd');
        if(available&&!profile.schematic){
          const coords=p.map(v=>g.weakAxis==='z'?v[0]:v[1]),lo=Math.min(...coords),hi=Math.max(...coords);
          const gradient=g.weakAxis==='z'?ctx.createLinearGradient(0,center[1]-lo*s,0,center[1]-hi*s):ctx.createLinearGradient(center[0]+lo*s,0,center[0]+hi*s,0);
          for(let i=0;i<=12;i++){const q=lo+(hi-lo)*i/12,stress=bucklingStressAt(field,field.lengthMm/2,g.weakAxis==='z'?q:0,g.weakAxis==='y'?q:0)!;gradient.addColorStop(i/12,`${stress>0?'rgba(241,192,146,':'rgba(129,220,202,'}${.12+.6*Math.abs(stress)/(Math.abs(stress)+60)})`);}
          ctx.fillStyle=gradient;
        }else ctx.fillStyle='#70bafa22';
        ctx.fillRect(0,0,w,h);ctx.restore();ctx.strokeStyle='#94d3f7';ctx.stroke();
        if(available&&stressExtrema){text('中跨截面 · 轴压 + P–Δ 弯曲',[w/2,h*.75],'#bfd8e9');text(`σmin ${stressExtrema.min.toFixed(2)} MPa   σmax ${stressExtrema.max.toFixed(2)} MPa`,[w/2,h*.75+20],'#a7e7d0');}else text('参考截面 · 不显示有效应力场',[w/2,h*.75],'#bda6e4');
        line([[center[0]-100,center[1]],[center[0]+100,center[1]]],g.weakAxis==='z'?'#aeebd1':'#8b9ab76b',1,[4,4]);line([[center[0],center[1]-100],[center[0],center[1]+100]],g.weakAxis==='y'?'#aeebd1':'#8b9ab76b',1,[4,4]);
        text('z',[center[0]+109,center[1]+3]);text('y',[center[0],center[1]-110]);text(profile.schematic?'未提供截面轮廓':`弱轴 ${g.weakAxis.toUpperCase()} · Imin ${(g.inertia/1e4).toFixed(3)} cm⁴`,[w/2,compact?30:Math.max(80,h*.18)],'#a0e7d2');
        if(profile.schematic)text('仅使用 A、Iy、Iz 计算',[w/2,h*.5]);
      }else{
        for(let i=-300;i<=300;i+=30){line([screen([-250,i,-250]),screen([-250,i,250])],'#18354c88',.6);line([screen([-250,-250,i]),screen([-250,250,i])],'#18354c88',.6);}
        if(original){const a=available?field.initialBow*requested:0;line(stations.map(x=>screen(vertex(x,0,0,a))),'#b7b3cc',1,[4,4]);for(const c of profile.contours){strokeContour(0,c,a,'#8faec066',.8,[3,4]);strokeContour(field.lengthMm,c,a,'#8faec066',.8,[3,4]);}}
        const faces:{p:Vec[];depth:number}[]=[];
        for(const c of profile.contours)for(let j=0;j<c.length;j++)for(let i=0;i<stations.length-1;i++){
          const p=[vertex(stations[i],...c[j]),vertex(stations[i+1],...c[j]),vertex(stations[i+1],...c[(j+1)%c.length]),vertex(stations[i],...c[(j+1)%c.length])];faces.push({p,depth:p.reduce((sum,v)=>sum+v[2]*Math.cos(orbit.current)-v[1]*Math.sin(orbit.current),0)});
        }
        faces.sort((a,b)=>a.depth-b.depth).forEach(f=>{ctx.beginPath();f.p.map(screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=available?'#579ce633':'#b69bdd25';ctx.fill();});
        for(const x of [0,field.lengthMm]){ctx.beginPath();for(const c of profile.contours){c.map(([y,z])=>screen(vertex(x,y,z))).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}ctx.fillStyle='#8ecbf52b';ctx.fill('evenodd');}
        for(const c of profile.contours){stations.filter((_,i)=>i%4===0).forEach(x=>strokeContour(x,c,displayAmplitude,'#8acaff3b',.7));c.forEach(([y,z],i)=>{if(i%Math.max(1,Math.ceil(c.length/12))===0){ctx.shadowColor='#55afff';ctx.shadowBlur=5;line(stations.map(x=>screen(vertex(x,y,z))),available?'#91cefa':'#bda6e4',1.2);ctx.shadowBlur=0;}});strokeContour(0,c,displayAmplitude,'#b0defb',1.3);strokeContour(field.lengthMm,c,displayAmplitude,'#b0defb',1.3);}
        line(stations.map(x=>screen(vertex(x,0,0))),available?'#98e1cd':'#bca3df',profile.schematic?2:1,[4,4]);
        const a=screen(vertex(0,0,0)),b=screen(vertex(field.lengthMm,0,0)),size=w<500?.65:.8;
        drawBeamSupport(ctx,'pinned',a,size);ctx.save();ctx.translate(...b);ctx.rotate(-Math.PI/2);drawBeamSupport(ctx,'roller',[0,0],size);ctx.restore();
        text('A 铰支座',[a[0],a[1]+45*size]);text('B 侧向约束',[b[0]+40,b[1]-13],'#a9bfd2','left');
        if(field.load>0){arrow([b[0],b[1]-44],[b[0],b[1]-9],'#efacbc');text(`P ${(field.load/1000).toFixed(2)} kN`,[b[0]-13,b[1]-27],'#efacbc','right');}
        const dimX=Math.max(32,Math.min(a[0],b[0])-72);line([[dimX,a[1]],[dimX,b[1]]],'#7298b3',.8);for(const p of [a,b])line([[dimX-4,p[1]],[dimX+4,p[1]]],'#7298b3');text(`L ${(field.lengthMm/1000).toFixed(2)} m`,[dimX-6,(a[1]+b[1])/2],'#a8c5da','right');
        const mid=screen(vertex(field.lengthMm/2,0,0)),chord=screen(vertex(field.lengthMm/2,0,0,0));line([chord,mid],'#a6e4cd',1,[3,3]);
        text(available?`e ${(g.amplitude??0).toFixed(3)} mm`:'一阶模态 · 非真实侧移',[Math.min(w-118,mid[0]+30),mid[1]],available?'#a3e6d1':'#c6b1e3','left');
      }
      const flow=overlay.current?.getContext('2d');if(overlay.current&&flow){overlay.current.width=el.width;overlay.current.height=el.height;drawFlow.current=seconds=>{flow.setTransform(dpr,0,0,dpr,0,0);flow.clearRect(0,0,w,h);if(!flowOn||!available||!field.load||view==='section'||profile.schematic)return;
        for(const glyph of bucklingStressGlyphs(field,seconds)){
          const {x,y,z,stress}=glyph,p=screen(vertex(x,y,z)),q=screen(vertex(glyph.tailX,y,z));
          flow.globalAlpha=glyph.opacity;flow.strokeStyle=stress>0?'#f1c092':'#a7e7d0';flow.beginPath();flow.moveTo(...q);flow.lineTo(...p);flow.stroke();flow.fillStyle=flow.strokeStyle;flow.beginPath();flow.arc(...p,1.2,0,Math.PI*2);flow.fill();}flow.globalAlpha=1;};drawFlow.current(time.current);}
    };
    redraw.current=draw;draw();const observer=new ResizeObserver(draw);observer.observe(el);return()=>{observer.disconnect();redraw.current=()=>{};drawFlow.current=()=>{};};
  },[field,view,zoom,requested,original,flowOn,available,displayAmplitude]);
  useEffect(()=>{if(!flowOn||reduced||!available||!field.load||profile.schematic||view==='section')return;
    let frame:number|null=null,last=0,painted=0,visible=false;const stop=()=>{if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;};
    const tick=(now:number)=>{if(last)time.current+=Math.min(.1,(now-last)/1000);last=now;if(now-painted>32){drawFlow.current(time.current);painted=now;}frame=requestAnimationFrame(tick);};const update=()=>{if(!visible||document.visibilityState!=='visible')stop();else if(frame===null)frame=requestAnimationFrame(tick);};
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);update();});if(overlay.current)observer.observe(overlay.current);document.addEventListener('visibilitychange',update);return()=>{stop();observer.disconnect();document.removeEventListener('visibilitychange',update);};
  },[flowOn,reduced,available,field.load,profile.schematic,view]);
  return <section ref={figure} className="lab-surface poisson-figure buckling-scene"><div className="lab-section-head"><div><h3>两端铰支压杆实验</h3><p>{material} · {profile.label} · 弱轴 {g.weakAxis.toUpperCase()}</p></div><div className="scene-view-controls" aria-label="实验视角">{([['3d','3D 视图',Box],['weak','弱轴平面',Square],['section','截面图',Shapes]] as const).map(([key,label,Icon])=><button key={key} aria-label={label} title={label} aria-pressed={view===key} onClick={()=>setView(key)}><Icon size={13}/><span>{label}</span></button>)}<button aria-label="复位实验视角" onClick={()=>{setView('3d');setZoom(1);orbit.current=.55;redraw.current();}}><RotateCcw size={14}/></button><button aria-label="全屏查看实验" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void figure.current?.requestFullscreen().catch(()=>{});}}><Maximize2 size={14}/></button></div></div>
    <div className="axial-deformation-bar"><div><span className={available?'is-coupled':'is-reference'}>{status}</span><small>{notice}</small></div><label>侧移显示<select aria-label="侧移放大倍率" disabled={!available} value={requested} onChange={e=>setRequested(Number(e.target.value))}>{[1,5,20,50,100].map(v=><option key={v} value={v}>{v===1?'真实':'放大'} ×{v}</option>)}</select></label></div>
    <div className="poisson-canvas-wrap buckling-stage"><div className="scene-legend">{original&&<span><i className="original-line"/>{available?'初始轴线':'参考直轴'}</span>}<span><i/>{available?'当前弹性形态':'归一化参考模态'}</span></div><div className="bending-scene-readings"><span>P / Pcr <b>{g.ratio.toFixed(3)}</b></span><span>弱轴 <b>{g.weakAxis.toUpperCase()}</b></span><span>e₀ <b>{field.initialBow}</b> mm</span></div>
      <canvas ref={canvas} data-buckling-critical={g.critical} data-stress-min={available?stressExtrema?.min:undefined} data-stress-max={available?stressExtrema?.max:undefined} data-buckling-ratio={g.ratio} data-buckling-weak-axis={g.weakAxis} data-buckling-bow={g.amplitude??''} data-geometry-status={available?'elastic':'mode'} data-display-amplification={available?requested:1} aria-label={`压杆${view==='3d'?'三维':view==='weak'?'弱轴平面':'截面'}图：${material}，弱轴 ${g.weakAxis.toUpperCase()}，${available?`总侧移 ${g.amplitude?.toFixed(3)} mm`:'归一化失稳模态，幅值不是实际位移'}`}
        onPointerDown={e=>{if(view==='3d'){drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}} onPointerMove={e=>{if(drag.current!==null){orbit.current=Math.max(-.5,Math.min(1.6,orbit.current+(e.clientX-drag.current)*.004));drag.current=e.clientX;redraw.current();}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
      <canvas ref={overlay} className="stress-flow-canvas" aria-hidden="true"/>
      <div className="scene-camera-dock" role="toolbar" aria-label="视图显示控制"><button aria-label="缩小试件视图" disabled={zoom<=.65} onClick={()=>setZoom(v=>Math.max(.65,v-.1))}><ZoomOut size={15}/></button><output aria-label="视图缩放比例">{Math.round(zoom*100)}%</output><button aria-label="放大试件视图" disabled={zoom>=1.45} onClick={()=>setZoom(v=>Math.min(1.45,v+.1))}><ZoomIn size={15}/></button><button aria-label="适应画布" onClick={()=>setZoom(1)}><Scan size={15}/></button><span className="camera-dock-divider"/><button aria-label="显示初始轴线" aria-pressed={original} onClick={()=>setOriginal(!original)}><Layers2 size={15}/></button><button aria-label="显示压力粒子流" disabled={!available||profile.schematic} aria-pressed={flowOn&&available&&!profile.schematic} onClick={()=>setFlowOn(!flowOn)}><Waves size={15}/></button></div><div className="scene-caption"><span>{available?`侧移 ×${requested} · 截面等比，读数未放大`:'模态幅值归一化 · 不计算后屈曲位移'}</span><span>{profile.schematic?'自定义截面无轮廓，仅显示轴线':'粒子表示轴压 + P–Δ 纤维应力 · 非材料运动'}</span></div>
    </div>
  </section>;
}
