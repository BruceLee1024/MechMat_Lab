import React, { useEffect, useRef, useState } from 'react';
import { Box, Square, PanelsTopLeft, RotateCcw, Maximize2, ZoomIn, ZoomOut, Scan, Layers2, Waves } from 'lucide-react';
import { bendingStation, type BendingField } from '../mechanics/bendingField';
import { bendingDisplay, bendingProfile, bendingVertex } from '../graphics/bendingGeometry';
import type { SectionProperties } from '../types';
import { drawBeamSupport } from '../graphics/beamSupport';

type Vec=[number,number,number];
type Point=[number,number];
export function BendingScene({field,section,material,status,notice,geometryAvailable=true,extrapolated=false}:{field:BendingField;section:SectionProperties;material:string;status:string;notice:string;geometryAvailable?:boolean;extrapolated?:boolean}) {
  const [view,setView]=useState<'3d'|'front'|'top'>('3d'),[zoom,setZoom]=useState(1),[requested,setRequested]=useState(100);
  const [original,setOriginal]=useState(true),[flowOn,setFlowOn]=useState(true);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),figure=useRef<HTMLElement>(null);
  const orbit=useRef(0),drag=useRef<number|null>(null),redraw=useRef(()=>{}),drawFlow=useRef((time:number)=>{}),time=useRef(0);
  const profile=bendingProfile(section),baseDisplay=bendingDisplay(field,requested),display={...baseDisplay,available:baseDisplay.available&&geometryAvailable},amplification=display.available?display.amplification:0;
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const draw=()=>{
      const rect=el.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(window.devicePixelRatio||1,2);
      if(!w||!h)return;el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);
      const ctx=el.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);
      const yaw=view==='3d'?.18+orbit.current:0;
      const project=([x,y,z]:Vec):Point=>{
        if(view==='front')return[x,-y];if(view==='top')return[x,z];
        const rx=x*Math.cos(yaw)+z*Math.sin(yaw),rz=-x*Math.sin(yaw)+z*Math.cos(yaw);
        return[rx+.55*rz,-y-.42*rz];
      };
      const vertex=(x:number,y:number,z:number,amp=amplification)=>bendingVertex(field,x,y,z,amp);
      const n=40,stations=Array.from(new Set([...Array.from({length:n+1},(_,i)=>field.lengthMm*i/n),field.positionMm,display.peak.xMm])).sort((a,b)=>a-b);
      const all=stations.flatMap(x=>profile.contours.flatMap(c=>c.map(([y,z])=>project(vertex(x,y,z)))));
      all.push(project([-310,90,0]),project([310,-75,0]));
      const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
      const scale=Math.max(.01,Math.min((w-40)/Math.max(620,maxX-minX),(h-145)/Math.max(180,maxY-minY)))*zoom;
      const cx=w/2-(minX+maxX)/2*scale,cy=h*.52-(minY+maxY)/2*scale;
      const screen=(v:Vec):Point=>{const p=project(v);return[cx+p[0]*scale,cy+p[1]*scale];};
      const line=(points:Point[],color:string,width=1,dash:number[]=[])=>{if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
      const label=(text:string,p:Point,color='#a9c6dd',align:CanvasTextAlign='center')=>{ctx.font='11px ui-monospace, "PingFang SC", sans-serif';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(text,...p);};
      // 网格、试件和粒子共用投影，画布缩放保持等比。
      for(let i=-600;i<=600;i+=40){line([screen([i,-65,-350]),screen([i,-65,350])],'#17334b',.6);line([screen([-600,-65,i]),screen([600,-65,i])],'#17334b',.6);}
      const strokeContour=(x:number,c:typeof profile.contours[number],amp:number,color:string,width:number,dash:number[]=[])=>line([...c,c[0]].map(([y,z])=>screen(vertex(x,y,z,amp))),color,width,dash);
      if(original){
        for(const c of profile.contours){strokeContour(0,c,0,'#91aeca88',1,[4,5]);strokeContour(field.lengthMm,c,0,'#91aeca88',1,[4,5]);
          const stride=c.length>16?8:1;c.forEach(([y,z],i)=>{if(i%stride===0)line([screen(vertex(0,y,z,0)),screen(vertex(field.lengthMm,y,z,0))],'#91aeca66',1,[4,5]);});}
        line([screen(vertex(0,0,0,0)),screen(vertex(field.lengthMm,0,0,0))],'#91aeca66',1,[4,5]);
      }
      const faces:{points:Vec[];depth:number;top:boolean}[]=[];
      for(const c of profile.contours)for(let j=0;j<c.length;j++)for(let i=0;i<stations.length-1;i++){
        const p=c[j],q=c[(j+1)%c.length],points=[vertex(stations[i],...p),vertex(stations[i+1],...p),vertex(stations[i+1],...q),vertex(stations[i],...q)];
        faces.push({points,depth:points.reduce((sum,p)=>sum+p[2]*Math.cos(yaw)-p[0]*Math.sin(yaw),0),top:(p[0]+q[0])/2>0});
      }
      faces.sort((a,b)=>a.depth-b.depth).forEach(face=>{ctx.beginPath();face.points.map(screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=face.top?'#68b9ff24':'#3879cb22';ctx.fill();});
      // 端面以奇偶填充保留空心孔洞，组合截面保留独立轮廓。
      for(const x of [0,field.lengthMm]){
        ctx.beginPath();for(const c of profile.contours){c.map(([y,z])=>screen(vertex(x,y,z))).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
        ctx.fillStyle='#8bcfff25';ctx.fill('evenodd');
      }
      for(const c of profile.contours){
        stations.filter((_,i)=>i%3===0).forEach(x=>strokeContour(x,c,amplification,'#81caff33',.7));
        const stride=c.length>16?4:1;c.forEach(([y,z],i)=>{if(i%stride===0){ctx.shadowColor='#54b8ff';ctx.shadowBlur=5;line(stations.map(x=>screen(vertex(x,y,z))),'#8acfff',1.2);ctx.shadowBlur=0;}});
        strokeContour(0,c,amplification,'#a5e1ff',1.5);strokeContour(field.lengthMm,c,amplification,'#a5e1ff',1.5);
      }
      line(stations.map(x=>screen(vertex(x,0,0))),profile.schematic?'#91d8ff':'#8ee3d3',profile.schematic?2:1,[5,5]);
      const arrow=(from:Point,to:Point,color:string)=>{line([from,to],color,2);const a=Math.atan2(to[1]-from[1],to[0]-from[0]);ctx.beginPath();ctx.moveTo(...to);ctx.lineTo(to[0]-9*Math.cos(a-.4),to[1]-9*Math.sin(a-.4));ctx.lineTo(to[0]-9*Math.cos(a+.4),to[1]-9*Math.sin(a+.4));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
      for(const [x,reaction,roller] of [[0,field.load*(field.lengthMm-field.positionMm)/field.lengthMm,false],[field.lengthMm,field.load*field.positionMm/field.lengthMm,true]] as const){
        // 接触点取端面可见下缘，避免在三维投影中支座穿进梁体。
        const end=profile.contours.flat().map(([y,z])=>screen(vertex(x,y,z)));
        const p:Point=end.length?end.reduce((lowest,p)=>p[1]>lowest[1]?p:lowest):screen(vertex(x,0,0));
        const size=w<500?.8:1,kind=roller?'roller':'pinned';
        const glyph=drawBeamSupport(ctx,kind,p,size);
        const labelY=p[1]+glyph.labelY*size;
        const name=roller?'B  滚动支座':'A  铰支座',reading=`${roller?'R_B':'R_A'} = ${(reaction/1000).toFixed(2)} kN`;
        const nameFont=`${w<500?9:10}px "PingFang SC",sans-serif`,valueFont=`${w<500?9:10}px ui-monospace,monospace`;
        ctx.font=nameFont;const nameWidth=ctx.measureText(name).width;ctx.font=valueFont;
        const textWidth=Math.max(nameWidth,ctx.measureText(reading).width);
        const labelX=Math.max(textWidth/2+7,Math.min(w-textWidth/2-7,p[0]));
        ctx.textAlign='center';ctx.font=nameFont;ctx.fillStyle='#c3d3df';ctx.fillText(name,labelX,labelY);
        ctx.font=valueFont;ctx.fillStyle='#97d8cb';ctx.fillText(reading,labelX,labelY+14);
      }
      if(field.load!==0){const p=screen(vertex(field.positionMm,field.load>0?profile.top:profile.bottom,0));const sign=Math.sign(field.load);arrow([p[0],p[1]-sign*58],[p[0],p[1]-sign*8],'#efa3b3');label(`P ${(field.load/1000).toFixed(2)} kN`,[p[0]+10,p[1]-sign*42],'#efb3c0','left');}
      if(display.available&&Math.abs(display.peak.deflection)>1e-12){const x=display.peak.xMm,p=screen(vertex(x,0,0)),o=screen(vertex(x,0,0,0));line([o,p],'#90dcce',1,[3,4]);ctx.beginPath();ctx.arc(...p,3,0,Math.PI*2);ctx.fillStyle='#a1ead9';ctx.fill();}
      const axis:Point=[28,h-(w<500?43:76)];arrow(axis,[axis[0]+30,axis[1]],'#85abc5');arrow(axis,[axis[0],axis[1]-28],'#85abc5');label('x',[axis[0]+39,axis[1]+3]);label(view==='top'?'z':'y',[axis[0],axis[1]-36]);
      const flow=overlay.current?.getContext('2d');
      if(overlay.current&&flow){overlay.current.width=el.width;overlay.current.height=el.height;
        const fibers=profile.contours.flatMap(c=>c.flatMap((p,j)=>[p,[(p[0]+c[(j+1)%c.length][0])/2,(p[1]+c[(j+1)%c.length][1])/2] as [number,number]])).filter(p=>Math.abs(p[0])>Math.max(profile.top,-profile.bottom)*.15).filter((_,i,a)=>i%Math.max(1,Math.ceil(a.length/16))===0);
        drawFlow.current=seconds=>{
          flow.setTransform(dpr,0,0,dpr,0,0);flow.clearRect(0,0,w,h);
          if(!flowOn||!display.available||profile.schematic||!field.load)return;
          for(const [y,z] of fibers)for(const side of [-1,1])for(let i=0;i<9;i++){
            const sign=Math.sign(-field.load*y),t=(i/9+seconds*.11+(z+y)*.0003)%1;
            const u=side<0?(sign>0?1-t:t)/2:(sign>0?1+t:2-t)/2;
            const x=u*field.lengthMm,station=bendingStation(field,x),stress=-station.moment*y/field.inertia;
            const strength=Math.min(1,Math.abs(stress)/80);if(strength<.002)continue;
            const head=screen(vertex(x,y,z)),tail=screen(vertex(Math.max(0,Math.min(field.lengthMm,x-side*sign*field.lengthMm*.014)),y,z));
            const color=stress>0?'#f1c092':'#81dcca';flow.globalAlpha=.25+strength*.65;flow.strokeStyle=color;flow.lineWidth=1;flow.beginPath();flow.moveTo(...tail);flow.lineTo(...head);flow.stroke();flow.fillStyle=color;flow.beginPath();flow.arc(...head,1.25,0,Math.PI*2);flow.fill();
          }flow.globalAlpha=1;
        };drawFlow.current(time.current);
      }
    };
    redraw.current=draw;draw();const observer=new ResizeObserver(draw);observer.observe(el);return()=>{observer.disconnect();redraw.current=()=>{};drawFlow.current=()=>{};};
  },[field,section,view,zoom,requested,original,flowOn,amplification,display.available]);
  useEffect(()=>{
    if(!flowOn||reduced||!display.available||profile.schematic||field.load===0)return;
    let frame:number|null=null,last=0,painted=0,visible=false;
    const stop=()=>{if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;};
    const tick=(now:number)=>{if(last)time.current+=Math.min(.1,(now-last)/1000);last=now;if(now-painted>32){drawFlow.current(time.current);painted=now;}frame=requestAnimationFrame(tick);};
    const update=()=>{if(!visible||document.visibilityState!=='visible')stop();else if(frame===null)frame=requestAnimationFrame(tick);};
    const observer=new IntersectionObserver(e=>{visible=e.some(x=>x.isIntersecting);update();});if(overlay.current)observer.observe(overlay.current);document.addEventListener('visibilitychange',update);return()=>{stop();observer.disconnect();document.removeEventListener('visibilitychange',update);};
  },[flowOn,reduced,display.available,profile.schematic,field.load]);
  return <section ref={figure} className="lab-surface poisson-figure bending-scene">
    <div className="lab-section-head"><div><h3>简支梁弯曲实验</h3><p>{material} · {profile.label} · 点载荷作用</p></div><div className="scene-view-controls" aria-label="实验视角">
      {([['3d','3D 视图',Box],['front','正视图',Square],['top','俯视图',PanelsTopLeft]] as const).map(([key,label,Icon])=><button key={key} aria-label={label} title={label} aria-pressed={view===key} onClick={()=>setView(key)}><Icon size={13}/><span>{label}</span></button>)}
      <button aria-label="复位实验视角" onClick={()=>{setView('3d');setZoom(1);orbit.current=0;redraw.current();}}><RotateCcw size={14}/></button><button aria-label="全屏查看实验" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void figure.current?.requestFullscreen().catch(()=>{});}}><Maximize2 size={14}/></button>
    </div></div>
    <div className="axial-deformation-bar"><div><span className={display.available?'is-coupled':'is-reference'}>{status}</span><small>{profile.schematic?'无轮廓参数，仅显示中性轴':notice}</small></div><label>形变显示<select aria-label="形变放大倍率" value={requested} disabled={!display.available} onChange={e=>setRequested(Number(e.target.value))}><option value={1}>真实 ×1</option><option value={100}>放大 ×100</option><option value={1000}>放大 ×1000</option><option value={5000}>放大 ×5000</option></select></label></div>
    <div className="poisson-canvas-wrap bending-stage"><div className="scene-legend">{original&&<span><i className="original-line"/>初始轮廓</span>}<span><i/>{display.available?'当前弹性形态':'参考形态'}</span><span className="bending-tension-key"><i/>受拉纤维</span><span className="bending-compression-key"><i/>受压纤维</span></div>
      <div className="bending-scene-readings"><span>L <b>{(field.lengthMm/1000).toFixed(2)}</b> m</span><span>a <b>{(field.positionMm/1000).toFixed(2)}</b> m</span><span>{display.available?'|w|max':'外推 w'} <b>{Math.abs(display.peak.deflection)>=10000?Math.abs(display.peak.deflection).toExponential(2):Math.abs(display.peak.deflection).toFixed(3)}</b> mm</span></div>
      <canvas ref={canvas} data-bending-deflection={display.peak.deflection} data-bending-position={display.peak.xMm} data-bending-modulus={field.modulusMPa} data-bending-inertia={field.inertia} data-geometry-status={display.available?(extrapolated?'extrapolated':'elastic'):'reference'} data-display-amplification={amplification} aria-label={`梁弯曲${view==='3d'?'三维':view==='front'?'正视':'俯视'}图：${material}，${display.available?(extrapolated?'线弹性外推形态':'计算弹性形态'):'仅参考轮廓，未求完整响应'}，最大挠度 ${Math.abs(display.peak.deflection).toFixed(3)} mm，位置 ${(display.peak.xMm/1000).toFixed(3)} m，A 为铰支座，B 为滚动支座`}
        onPointerDown={e=>{if(view==='3d'){drag.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);}}} onPointerMove={e=>{if(drag.current!==null){orbit.current=Math.max(-.5,Math.min(.5,orbit.current+(e.clientX-drag.current)*.003));drag.current=e.clientX;redraw.current();}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
      <canvas ref={overlay} className="stress-flow-canvas" aria-hidden="true"/>
      <div className="scene-camera-dock" role="toolbar" aria-label="视图显示控制"><button aria-label="缩小试件视图" disabled={zoom<=.65} onClick={()=>setZoom(z=>Math.max(.65,z-.1))}><ZoomOut size={15}/></button><output aria-label="视图缩放比例">{Math.round(zoom*100)}%</output><button aria-label="放大试件视图" disabled={zoom>=1.45} onClick={()=>setZoom(z=>Math.min(1.45,z+.1))}><ZoomIn size={15}/></button><button aria-label="适应画布" onClick={()=>setZoom(1)}><Scan size={15}/></button><span className="camera-dock-divider"/><button aria-label="显示原始轮廓" aria-pressed={original} onClick={()=>setOriginal(!original)}><Layers2 size={15}/></button><button aria-label="显示应力粒子流" disabled={!display.available||profile.schematic} aria-pressed={flowOn&&display.available&&!profile.schematic} onClick={()=>setFlowOn(!flowOn)}><Waves size={15}/></button></div>
      <div className="scene-caption"><span>{display.available?`形变 ×${Number(amplification.toFixed(1))}${amplification<requested?'（显示倍率自动调低）':''} · 标注为未放大计算值`:'参考轮廓 · 读数为 EB 平面弯曲参考'}</span><span>{view==='top'?'支座符号按立面示意':'粒子表示应力 · 非材料流动'}</span></div>
    </div>
  </section>;
}
