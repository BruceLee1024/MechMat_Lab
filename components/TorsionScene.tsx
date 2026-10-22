import React, {useEffect,useRef,useState} from 'react';
import {Box,Square,Circle,RotateCcw,Maximize2,ZoomIn,ZoomOut,Scan,Layers2,Waves} from 'lucide-react';
import {torsionStation,torsionVertex,torsionDisplay,torsionFlow,torsionAppliedTorques,type TorsionField} from '../mechanics/torsionField';

type Point=[number,number];type Vec=[number,number,number];
export function TorsionScene({field,material,status,notice,extrapolated}:{field:TorsionField;material:string;status:string;notice:string;extrapolated:boolean}) {
  const [view,setView]=useState<'3d'|'front'|'end'>('3d'),[zoom,setZoom]=useState(1),[requested,setRequested]=useState(20);
  const [original,setOriginal]=useState(true),[flowOn,setFlowOn]=useState(true),[reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),figure=useRef<HTMLElement>(null);
  const orbit=useRef(.25),drag=useRef<number|null>(null),redraw=useRef(()=>{}),drawFlow=useRef((time:number)=>{}),time=useRef(0);
  const display=torsionDisplay(field,requested),amp=display.amplification,angle=torsionStation(field,field.lengthMm).angleRad;
  useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update);},[]);
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const draw=()=>{
      const {width:w,height:h}=el.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);if(!w||!h)return;
      el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);const ctx=el.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);
      const yaw=view==='3d'?orbit.current:0;
      const project=([x,y,z]:Vec):Point=>view==='end'?[z,-y]:view==='front'?[x,-y]:[x*Math.cos(yaw)+z*Math.sin(yaw)+.5*(-x*Math.sin(yaw)+z*Math.cos(yaw)),-y-.4*(-x*Math.sin(yaw)+z*Math.cos(yaw))];
      const radius=field.radiusMm*560/field.lengthMm;
      const compact=h<300,verticalSpan=(view==='3d'?560*.4*Math.abs(Math.sin(yaw)):0)+2*radius;
      const scale=(view==='end'?Math.min(w*.55,compact?Math.max(30,h-120):h*.45)/(2*radius):Math.min((w-74)/Math.max(660,radius*2+100),(h-(compact?95:150))/Math.max(compact?80:180,verticalSpan+(compact?20:80))))*zoom;
      const cx=w/2,cy=h*(compact?.44:.54);
      const screen=(p:Vec):Point=>{const v=project(p);return[cx+v[0]*scale,cy+v[1]*scale];};
      const vertex=(x:number,a:number,r=field.radiusMm,amplification=amp)=>torsionVertex(field,x,r,a,amplification);
      const line=(p:Point[],color:string,width=1,dash:number[]=[])=>{if(!p.length)return;ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
      const text=(label:string,p:Point,color='#afc9dd',align:CanvasTextAlign='center')=>{ctx.font=`${w<500?9:11}px ui-monospace,"PingFang SC",sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(label,...p);};
      const ring=(x:number,r=field.radiusMm)=>Array.from({length:49},(_,i)=>screen(vertex(x,i*Math.PI/24,r)));
      const stations=Array.from({length:49},(_,i)=>i*field.lengthMm/48);
      if(view!=='end')for(let i=-600;i<=600;i+=40){line([screen([i,-radius-26,-240]),screen([i,-radius-26,240])],'#18354b88',.6);line([screen([-600,-radius-26,i]),screen([600,-radius-26,i])],'#18354b88',.6);}
      if(view==='end') {
        const end=field.lengthMm;ctx.beginPath();ring(end).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.fillStyle='#398fda24';ctx.fill();line(ring(end),'#9ddcff',1.7);
        const c=screen(vertex(end,0,0));
        for(let i=0;i<12;i++)line([c,screen(vertex(end,i*Math.PI/6))],'#76bdef44',.7);
        if(original)line([c,screen(vertex(end,0,field.radiusMm,0))],'#b7b8d6',1.3,[4,4]);
        line([c,screen(vertex(end,0))],'#9aebcf',2.4);
        const points=Array.from({length:81},(_,i)=>screen(vertex(end,0,field.radiusMm*.62,amp*i/80)));line(points,'#b9a0e0',1.2);
        text('C 截面 · 相对 A 的转角',[w/2,compact?18:Math.max(80,h*.18)],'#c4daf0');
        text(`r = ${field.radiusMm} mm`,[w/2,compact?33:Math.max(99,h*.25)]);
      } else {
        // 圆轴保持圆截面；表面母线随积分转角形成螺旋标记，不改变圆柱包络。
        const faces:{p:Vec[];depth:number;shade:number}[]=[];
        for(let j=0;j<32;j++)for(let i=0;i<stations.length-1;i++){
          const a=j*Math.PI/16,b=(j+1)*Math.PI/16,p=[vertex(stations[i],a),vertex(stations[i+1],a),vertex(stations[i+1],b),vertex(stations[i],b)];
          faces.push({p,depth:p.reduce((s,v)=>s+v[2]*Math.cos(yaw)-v[0]*Math.sin(yaw),0),shade:Math.cos((a+b)/2)});
        }
        faces.sort((a,b)=>a.depth-b.depth).forEach(f=>{ctx.beginPath();f.p.map(screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=f.shade>0?'#68bfff18':'#367bd014';ctx.fill();});
        if(original){for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])line(stations.map(x=>screen(vertex(x,a,field.radiusMm,0))),'#a6afc46b',1,[4,5]);}
        for(let i=0;i<=12;i++)line(ring(i*field.lengthMm/12),'#86cfff47',.7);
        for(let i=0;i<12;i++){ctx.shadowColor='#56baff';ctx.shadowBlur=4;line(stations.map(x=>screen(vertex(x,i*Math.PI/6))),'#89caff',1);ctx.shadowBlur=0;}
        for(const x of [0,field.lengthMm]){ctx.beginPath();ring(x).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle='#88c9f12a';ctx.fill();}
        line(stations.map(x=>screen(vertex(x,0))),'#9ae4ce',2);
        const applied=torsionAppliedTorques(field);
        for(const [u,label,value] of [[0,'A',applied[0]],[.5,'B',applied[1]],[1,'C',applied[2]]] as const){
          const x=u*field.lengthMm,p=screen(vertex(x,0,0));line(ring(x),u===.5?'#bda6e2':'#b1e4ff',1.6);
          const marker=screen(vertex(x,0));ctx.beginPath();ctx.arc(...marker,3,0,Math.PI*2);ctx.fillStyle='#acedd7';ctx.fill();line([p,marker],'#a1e3d0',1.4);
          const labelX=Math.max(50,Math.min(w-50,p[0])),labelY=compact?Math.max(18,p[1]-radius*scale-35):p[1]+radius*scale+37;
          text(`${label}  ${u===0?'输入':'输出'}`,[labelX,labelY]);text(`${Math.abs(value).toFixed(1)} N·m`,[labelX,labelY+16],u===0?'#efb1bf':'#c9b8e4');
          if(value){const r=field.radiusMm+(compact?14:27)/Math.max(scale*560/field.lengthMm,.001),sgn=Math.sign(value);const path=Array.from({length:31},(_,i)=>screen(vertex(x,-.7+sgn*i/30*4.1,r,0)));line(path,u===0?'#ec9fb3':'#b9a0e0',1.7);
            const end=path[path.length-1],prev=path[path.length-2],a=Math.atan2(end[1]-prev[1],end[0]-prev[0]);line([[end[0]-7*Math.cos(a-.5),end[1]-7*Math.sin(a-.5)],end,[end[0]-7*Math.cos(a+.5),end[1]-7*Math.sin(a+.5)]],u===0?'#ec9fb3':'#b9a0e0',1.7);}
        }
        if(!compact){const a=screen([-280,radius+65,0]),c=screen([280,radius+65,0]);line([a,c],'#7198b3',.8);for(const p of [a,c])line([[p[0],p[1]-4],[p[0],p[1]+4]],'#7198b3');text(`L = ${(field.lengthMm/1000).toFixed(2)} m · d = ${(field.radiusMm*2).toFixed(1)} mm`,[(a[0]+c[0])/2,(a[1]+c[1])/2-10]);}
        // 端面局部放大单独标明，不改变主轴体的尺寸比例。
        if(w>=600&&h>=330){
          const p:Point=[w-112,130],r=36,a=angle*amp;
          ctx.beginPath();ctx.arc(...p,r,0,Math.PI*2);ctx.fillStyle='#16374c77';ctx.fill();ctx.strokeStyle='#85b9d6';ctx.lineWidth=1;ctx.stroke();
          if(original)line([p,[p[0],p[1]-r]],'#b3aecb',1,[3,4]);
          line([p,[p[0]+r*Math.sin(a),p[1]-r*Math.cos(a)]],'#a1e6ce',2);
          ctx.beginPath();ctx.arc(...p,r*.65,-Math.PI/2,-Math.PI/2+a,a<0);ctx.strokeStyle='#bea5e1';ctx.stroke();
          text('C 端面 · 局部放大',[p[0],p[1]-r-17]);text(`角度 ×${amp}`,[p[0],p[1]+r+18],'#9ddfc9');
        }
      }
      const flow=overlay.current?.getContext('2d');if(overlay.current&&flow){overlay.current.width=el.width;overlay.current.height=el.height;drawFlow.current=seconds=>{flow.setTransform(dpr,0,0,dpr,0,0);flow.clearRect(0,0,w,h);if(!flowOn||!display.available)return;
        const particles=view==='end'?torsionFlow(field,seconds).filter(p=>p.x===field.lengthMm*.91).map(p=>({...p,x:field.lengthMm})):torsionFlow(field,seconds);
        for(const p of particles){const head=screen(vertex(p.x,p.azimuth,p.rho)),tail=screen(vertex(p.x,p.tail,p.rho));flow.globalAlpha=p.opacity;flow.strokeStyle=p.x<field.lengthMm/2?'#9ae5cc':'#c5abe9';flow.fillStyle=flow.strokeStyle;flow.lineWidth=1.2;flow.beginPath();flow.moveTo(...tail);flow.lineTo(...head);flow.stroke();flow.beginPath();flow.arc(...head,1.3,0,Math.PI*2);flow.fill();}flow.globalAlpha=1;};drawFlow.current(time.current);}
    };
    redraw.current=draw;draw();const observer=new ResizeObserver(draw);observer.observe(el);return()=>{observer.disconnect();redraw.current=()=>{};drawFlow.current=()=>{};};
  },[field,material,view,zoom,amp,original,flowOn,display.available]);
  useEffect(()=>{
    if(!flowOn||reduced||!display.available||!field.torqueNm)return;
    let frame:number|null=null,last=0,painted=0,visible=false;
    const stop=()=>{if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;};
    const tick=(now:number)=>{if(last)time.current+=Math.min(.1,(now-last)/1000);last=now;if(now-painted>32){drawFlow.current(time.current);painted=now;}frame=requestAnimationFrame(tick);};
    const update=()=>{if(!visible||document.visibilityState!=='visible')stop();else if(frame===null)frame=requestAnimationFrame(tick);};
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);update();});if(overlay.current)observer.observe(overlay.current);document.addEventListener('visibilitychange',update);return()=>{stop();observer.disconnect();document.removeEventListener('visibilitychange',update);};
  },[flowOn,reduced,display.available,field.torqueNm]);
  return <section ref={figure} className="lab-surface poisson-figure torsion-scene">
    <div className="lab-section-head"><div><h3>传动圆轴扭转实验</h3><p>{material} · 实心圆截面 · A 输入，B / C 输出</p></div><div className="scene-view-controls" aria-label="实验视角">{([['3d','3D 视图',Box],['front','正视图',Square],['end','端面图',Circle]] as const).map(([key,label,Icon])=><button key={key} aria-label={label} title={label} aria-pressed={view===key} onClick={()=>setView(key)}><Icon size={13}/><span>{label}</span></button>)}<button aria-label="复位实验视角" onClick={()=>{setView('3d');setZoom(1);orbit.current=.25;redraw.current();}}><RotateCcw size={14}/></button><button aria-label="全屏查看实验" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void figure.current?.requestFullscreen().catch(()=>{});}}><Maximize2 size={14}/></button></div></div>
    <div className="axial-deformation-bar"><div><span className={display.available?'is-coupled':'is-reference'}>{display.available?status:'参考形态'}</span><small>{!display.smallStrain?'剪应变超出小变形显示范围':!display.readable?'显示转角超过3圈，请降低倍率':notice}</small></div><label>转角显示<select aria-label="转角放大倍率" value={requested} disabled={!display.smallStrain} onChange={e=>setRequested(Number(e.target.value))}>{[1,10,20,50,100].map(v=><option key={v} value={v}>{v===1?'真实':'放大'} ×{v}</option>)}</select></label></div>
    <div className="poisson-canvas-wrap torsion-stage"><div className="scene-legend">{original&&<span><i className="original-line"/>初始母线</span>}<span><i/>扭转后网格</span><span className="torsion-meridian-key"><i/>截面角度标记</span></div><div className="bending-scene-readings"><span>r <b>{field.radiusMm}</b> mm</span><span>G <b>{field.modulusMPa/1000}</b> GPa</span><span>φC <b>{(angle*180/Math.PI).toFixed(3)}</b> °</span></div>
      <canvas ref={canvas} data-torsion-angle={angle} data-torsion-radius={field.radiusMm} data-torsion-modulus={field.modulusMPa} data-display-amplification={amp} data-geometry-status={display.available?(extrapolated?'extrapolated':'elastic'):'reference'} aria-label={`圆轴扭转${view==='3d'?'三维':view==='front'?'正视':'端面'}图：${material}，半径 ${field.radiusMm} mm，C 相对 A 转角 ${(angle*180/Math.PI).toFixed(3)} 度，${display.available?(extrapolated?'线弹性外推形态':'按计算转角显示'):'仅参考轮廓'}`}
        onPointerDown={e=>{if(view==='3d'){drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}} onPointerMove={e=>{if(drag.current!==null){orbit.current=Math.max(-.3,Math.min(.7,orbit.current+(e.clientX-drag.current)*.003));drag.current=e.clientX;redraw.current();}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
      <canvas ref={overlay} className="stress-flow-canvas" aria-hidden="true"/>
      <div className="scene-camera-dock" role="toolbar" aria-label="视图显示控制"><button aria-label="缩小试件视图" disabled={zoom<=.65} onClick={()=>setZoom(z=>Math.max(.65,z-.1))}><ZoomOut size={15}/></button><output aria-label="视图缩放比例">{Math.round(zoom*100)}%</output><button aria-label="放大试件视图" disabled={zoom>=1.45} onClick={()=>setZoom(z=>Math.min(1.45,z+.1))}><ZoomIn size={15}/></button><button aria-label="适应画布" onClick={()=>setZoom(1)}><Scan size={15}/></button><span className="camera-dock-divider"/><button aria-label="显示原始母线" aria-pressed={original} onClick={()=>setOriginal(!original)}><Layers2 size={15}/></button><button aria-label="显示切应力粒子流" aria-pressed={flowOn&&display.available} disabled={!display.available} onClick={()=>setFlowOn(!flowOn)}><Waves size={15}/></button></div>
      <div className="scene-caption"><span>{display.available?`转角 ×${requested} · 尺寸等比，读数未放大`:'参考形态 · 不表示真实塑性扭转'}</span><span>粒子沿截面切向示意 · 非材料流动</span></div>
    </div>
  </section>;
}
