import React,{useEffect,useRef,useState} from 'react';
import {Box,Square,RotateCcw,Maximize2,ZoomIn,ZoomOut,Scan,Layers2,MoveUpRight} from 'lucide-react';
import {stressRotate,stressFaceTraction,stressNumber as num,type PlaneStressValues,type StressVector} from '../mechanics/stressState';
type P=[number,number];
export function StressElementScene({values:v,angle}:{values:PlaneStressValues;angle:number}) {
  const [view,setView]=useState<'3d'|'front'>('3d'),[zoom,setZoom]=useState(1),[ghost,setGhost]=useState(false),[shear,setShear]=useState(true);
  const canvas=useRef<HTMLCanvasElement>(null),figure=useRef<HTMLElement>(null),camera=useRef({yaw:.57,pitch:.38}),drag=useRef<{x:number;y:number}|null>(null),redraw=useRef(()=>{});
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const draw=()=>{
      const {width:w,height:h}=el.getBoundingClientRect();if(!w||!h)return;const dpr=Math.min(window.devicePixelRatio||1,2);el.width=w*dpr;el.height=h*dpr;
      const ctx=el.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);
      const yaw=view==='front'?0:camera.current.yaw,pitch=view==='front'?0:camera.current.pitch,c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
      const project=([x,y,z]:StressVector):P=>[x*c+z*s,-y*cp+(z*c-x*s)*sp],depth=([x,y,z]:StressVector)=>y*sp+(z*c-x*s)*cp;
      const scale=Math.max(.25,Math.min((w-100)/355,(h-160)/300))*zoom,cx=w/2,cy=h*.48;
      const screen=(q:StressVector):P=>{const p=project(q);return[cx+p[0]*scale,cy+p[1]*scale];},rot=(p:StressVector)=>stressRotate(p,angle),at=(p:StressVector)=>screen(rot(p));
      const line=(ps:P[],color:string,width=1,dash:number[]=[])=>{ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
      const text=(label:string,p:P,color='#b6d1e5',align:CanvasTextAlign='center')=>{ctx.font=`${w<450?10:12}px ui-monospace,"PingFang SC",sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(label,...p);};
      const arrow=(a:P,b:P,color:string,width=2)=>{if(Math.hypot(b[0]-a[0],b[1]-a[1])<.4)return;line([a,b],color,width);const t=Math.atan2(b[1]-a[1],b[0]-a[0]),r=Math.min(7,Math.hypot(b[0]-a[0],b[1]-a[1])*.4);ctx.beginPath();ctx.moveTo(...b);ctx.lineTo(b[0]-r*Math.cos(t-.4),b[1]-r*Math.sin(t-.4));ctx.lineTo(b[0]-r*Math.cos(t+.4),b[1]-r*Math.sin(t+.4));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
      const a=55,faces:StressVector[][]=[[[a,-a,-a],[a,a,-a],[a,a,a],[a,-a,a]],[[-a,-a,a],[-a,a,a],[-a,a,-a],[-a,-a,-a]],[[-a,a,-a],[-a,a,a],[a,a,a],[a,a,-a]],[[-a,-a,a],[-a,-a,-a],[a,-a,-a],[a,-a,a]],[[-a,-a,a],[a,-a,a],[a,a,a],[-a,a,a]],[[-a,a,-a],[a,a,-a],[a,-a,-a],[-a,-a,-a]]];
      const ground=-100;for(let i=-250;i<=250;i+=25){line([screen([i,ground,-220]),screen([i,ground,220])],'#22495a44',.6);line([screen([-250,ground,i]),screen([250,ground,i])],'#22495a44',.6);}
      if(ghost)for(const face of faces)line([...face,face[0]].map(screen),'#92a8c579',.9,[4,5]);
      faces.map((ps,i)=>({ps:ps.map(rot),i})).sort((a,b)=>a.ps.reduce((s,p)=>s+depth(p),0)-b.ps.reduce((s,p)=>s+depth(p),0)).forEach(({ps,i})=>{
        const points=ps.map(screen);ctx.beginPath();points.forEach((p,j)=>j?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();const gradient=ctx.createLinearGradient(points[0][0],points[0][1],points[2][0],points[2][1]);gradient.addColorStop(0,i<2?'#5daeff27':i<4?'#75d1bb22':'#5791d319');gradient.addColorStop(1,'#2b598d11');ctx.fillStyle=gradient;ctx.fill();
        for(let k=1;k<5;k++){const t=k/5,mix=(p:StressVector,q:StressVector):StressVector=>p.map((x,i)=>x+(q[i]-x)*t) as StressVector;line([screen(mix(ps[0],ps[1])),screen(mix(ps[3],ps[2]))],'#78bded25',.7);line([screen(mix(ps[0],ps[3])),screen(mix(ps[1],ps[2]))],'#78bded25',.7);}
        ctx.shadowColor='#62aaff';ctx.shadowBlur=6;line([...points,points[0]],i<2?'#9dcff8':i<4?'#9ce2d2':'#91bce8',1.5);ctx.shadowBlur=0;
      });
      const max=Math.max(Math.abs(v.sig1),Math.abs(v.sig2)),length=(n:number)=>max?65*Math.abs(n)/max:0,show=(n:number)=>max>0&&Math.abs(n)>max*1e-12;
      for(const axis of ['x','y'] as const)for(const side of [-1,1]){
        const traction=stressFaceTraction(v,axis,side),normal=traction[axis==='x'?0:1]*side,color=axis==='x'?'#a9cffa':'#8ce2c9',q:StressVector=axis==='x'?[side*a,0,14]:[0,side*a,14],index=axis==='x'?0:1;
        if(show(normal)){const out=[...q] as StressVector;out[index]+=side*length(normal);arrow(at(normal>0?q:out),at(normal>0?out:q),color);if(side===1){const p=at(out);text(`${axis==='x'?'σx′':'σy′'} ${num(normal)}`,[p[0],p[1]+(axis==='x'?33:-12)],color);}}
        if(shear&&show(v.tauXY_prime)){const center:StressVector=axis==='x'?[side*(a+12),0,-26]:[0,side*(a+12),-26],tangent=axis==='x'?1:0,len=length(v.tauXY_prime),sign=Math.sign(traction[tangent]),from=[...center] as StressVector,to=[...center] as StressVector;from[tangent]-=sign*len/2;to[tangent]+=sign*len/2;arrow(at(from),at(to),'#c5a8e6',1.7);if(axis==='x'&&side===1){const p=at(center);text(`τ′ ${num(v.tauXY_prime)}`,[p[0]+18,p[1]-14],'#d1baee','left');}}
      }
      if(max===0)text('零应力 · 各面无牵引',[cx,cy+100*scale],'#a3bed4');
      const zFace=at([0,0,a]);text('z 面自由',[zFace[0],zFace[1]+12],'#88a9c5');
      const ox=38,oy=h-73;for(const [axis,q,color] of [['x',[30,0,0],'#96c5e9'],['y',[0,30,0],'#8bd7bf'],['z',[0,0,30],'#b5a2d9']] as const){const p=project([...q] as StressVector);arrow([ox,oy],[ox+p[0],oy+p[1]],color,1);text(axis,[ox+p[0]*1.25,oy+p[1]*1.25+4],color);}
    };
    redraw.current=draw;const observer=new ResizeObserver(draw);observer.observe(el);draw();return()=>observer.disconnect();
  },[v,angle,view,zoom,ghost,shear]);
  return <section ref={figure} className="lab-surface poisson-figure stress-element-scene"><div className="lab-section-head"><div><h3>旋转截面的三维应力单元体</h3><p>平面应力 · 旋转方位，不表示材料形变</p></div><div className="scene-view-controls" role="group" aria-label="应力单元体视角">{([['3d','3D 视图',Box],['front','正视图',Square]] as const).map(([key,label,Icon])=><button key={key} aria-pressed={view===key} onClick={()=>setView(key)}><Icon size={13}/><span>{label}</span></button>)}<button aria-label="复位应力视角" onClick={()=>{camera.current={yaw:.57,pitch:.38};setView('3d');setZoom(1);redraw.current();}}><RotateCcw size={14}/></button><button aria-label="全屏查看应力单元体" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void figure.current?.requestFullscreen().catch(()=>{});}}><Maximize2 size={14}/></button></div></div>
    <div className="stress-scene-band"><span>σz = τyz = τzx = 0</span><small>相机拖动只改变观察角度</small></div><div className="poisson-canvas-wrap stress-element-stage"><div className="scene-legend"><span className="stress-x-key"><i/>x′ 面正应力</span><span className="stress-y-key"><i/>y′ 面正应力</span><span className="stress-tau-key"><i/>互等剪应力</span></div><div className="stress-scene-angle"><span>截面方位 θ</span><strong>{num(angle)}<small>°</small></strong></div>
      <canvas ref={canvas} role="img" aria-label={`平面应力三维单元体，θ=${num(angle)}度，σx′=${num(v.sigX_prime)}，σy′=${num(v.sigY_prime)}，τx′y′=${num(v.tauXY_prime)} MPa，z面自由`} data-stress-angle={angle} data-stress-x={v.sigX_prime} data-stress-y={v.sigY_prime} data-stress-shear={v.tauXY_prime} onPointerDown={e=>{if(view==='3d'){drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}} onPointerMove={e=>{if(drag.current){camera.current.yaw=Math.max(-1.2,Math.min(1.2,camera.current.yaw+(e.clientX-drag.current.x)*.006));camera.current.pitch=Math.max(-.8,Math.min(.8,camera.current.pitch+(e.clientY-drag.current.y)*.004));drag.current={x:e.clientX,y:e.clientY};redraw.current();}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
      <div className="scene-camera-dock" role="toolbar" aria-label="应力视图显示控制"><button aria-label="缩小应力单元体" disabled={zoom<=.65} onClick={()=>setZoom(z=>Math.max(.65,z-.1))}><ZoomOut size={15}/></button><output aria-label="应力视图缩放比例">{Math.round(zoom*100)}%</output><button aria-label="放大应力单元体" disabled={zoom>=1.45} onClick={()=>setZoom(z=>Math.min(1.45,z+.1))}><ZoomIn size={15}/></button><button aria-label="适应应力画布" onClick={()=>setZoom(1)}><Scan size={15}/></button><span className="camera-dock-divider"/><button aria-label="显示零度参考轮廓" aria-pressed={ghost} onClick={()=>setGhost(!ghost)}><Layers2 size={15}/></button><button aria-label="显示剪应力箭头" aria-pressed={shear} onClick={()=>setShear(!shear)}><MoveUpRight size={15}/></button></div><div className="scene-caption"><span>箭头拉出为正、压入为负 · 同一应力比例尺</span><span>单元体为示意尺寸</span></div>
    </div></section>;
}
