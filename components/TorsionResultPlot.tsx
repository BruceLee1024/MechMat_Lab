import React,{useState} from 'react';
import {torsionStation,type TorsionField} from '../mechanics/torsionField';
export function TorsionResultPlot({field:f}:{field:TorsionField}) {
  const [type,setType]=useState<'torque'|'angle'|'stress'>('torque');
  const a=torsionStation(f,0),b=torsionStation(f,f.lengthMm/2),c=torsionStation(f,f.lengthMm);
  const title={torque:'分段扭矩',angle:'相对转角',stress:'径向切应力'}[type],unit=type==='torque'?'N·m':type==='angle'?'°':'MPa';
  const points=type==='torque'?[[0,a.torqueNmm/1000],[.5,a.torqueNmm/1000],[.5,b.torqueNmm/1000],[1,b.torqueNmm/1000]]:type==='angle'?[[0,0],[.5,b.angleRad*180/Math.PI],[1,c.angleRad*180/Math.PI]]:[[0,0],[1,a.surfaceShear]];
  const max=Math.max(...points.map(p=>Math.abs(p[1])),1e-9),axis=f.torqueNm===0?1:max,x=(u:number)=>38+u*226,y=(v:number)=>94-v/axis*54;
  const path=points.map(([u,v],i)=>`${i?'L':'M'}${x(u)} ${y(v)}`).join(' ');
  return <section className="bending-result-plot torsion-result-plot" aria-label="圆轴扭矩与变形图表"><div className="axial-chart-switch" role="group" aria-label="切换扭转结果图表">{([['torque','扭矩图'],['angle','转角图'],['stress','切应力']] as const).map(([key,label])=><button key={key} aria-pressed={type===key} onClick={()=>setType(key)}>{label}</button>)}</div><header><h3>{title}</h3><span>{unit}</span></header>
    <svg viewBox="0 0 285 174" role="img" aria-label={`${title}，AB 内扭矩 ${a.torqueNmm/1000} N·m，BC 内扭矩 ${b.torqueNmm/1000} N·m，C 相对 A 转角 ${(c.angleRad*180/Math.PI).toFixed(3)} 度`}>
      {[-1,0,1].map(v=><g key={v}><path d={`M38 ${y(v*axis)}H264`} stroke={v===0?'#6d899e':'#2d4054'} strokeWidth=".7"/><text x="30" y={y(v*axis)+3} textAnchor="end">{(v*axis).toFixed(type==='angle'?2:1)}</text></g>)}
      {[0,.5,1].map(u=><g key={u}><path d={`M${x(u)} 30V151`} stroke="#354b5f66" strokeDasharray="3 4"/><text x={x(u)} y="167" textAnchor="middle">{type==='stress'?(u*f.radiusMm).toFixed(1):`${['A','B','C'][u*2]} ${(u*f.lengthMm/1000).toFixed(2)}`}</text></g>)}
      <path d={`${path}L264 94H38Z`} fill="#80c5f415"/><path d={path} stroke={type==='angle'?'#a3e0ca':'#94c8ff'} strokeWidth="1.8" fill="none"/>
      {type==='stress'&&<path d={`M38 94L264 ${y(b.surfaceShear)}`} stroke="#c0a8e2" strokeWidth="1.4" strokeDasharray="4 3"/>}
    </svg><p>{type==='torque'?'AB 承担全部输入扭矩，B 分流后 BC 承担剩余扭矩；纵轴为实际值。':type==='angle'?'φA = 0 为角度参考；B 处转角连续，斜率按该段 T/(GJ) 改变。':'从中心到表面，τ = Tρ/J 线性增大。实线 AB，虚线 BC；ρ 单位 mm。'}</p>
  </section>;
}
