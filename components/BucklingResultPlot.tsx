import React,{useState} from 'react';
import {bucklingGeometry,type BucklingField} from '../mechanics/bucklingField';
export function BucklingResultPlot({field:f,available}:{field:BucklingField;available:boolean}) {
  const [type,setType]=useState<'response'|'mode'>('response'),g=bucklingGeometry(f);
  const x=(r:number)=>35+r/1.2*230,y=(v:number)=>143-v*105;
  const response=f.initialBow>0?Array.from({length:101},(_,i)=>{const ratio=i*.0095;return[x(ratio),y(Math.min(1,(1/(1-ratio)-1)/19))];}):[[x(0),y(0)],[x(1),y(0)]];
  const path=type==='response'?response.map(([a,b],i)=>`${i?'L':'M'}${a} ${b}`).join(' '):Array.from({length:61},(_,i)=>`${i?'L':'M'}${35+i/60*230} ${143-Math.sin(i/60*Math.PI)*105}`).join(' ');
  return <section className="bending-result-plot buckling-result-plot" aria-label="压杆稳定图表"><div className="axial-chart-switch" role="group" aria-label="切换稳定图表"><button aria-pressed={type==='response'} onClick={()=>setType('response')}>缺陷放大</button><button aria-pressed={type==='mode'} onClick={()=>setType('mode')}>失稳模态</button></div><header><h3>{type==='response'?'亚临界缺陷放大':'一阶弱轴模态'}</h3><span>{type==='response'?(f.initialBow>0?'e / e₀':'侧移 / mm'):'归一化'}</span></header><svg viewBox="0 0 285 179" role="img" aria-label={type==='response'?`初弯曲 ${f.initialBow} mm，载荷比 ${g.ratio.toFixed(3)}，${available?'总侧移 '+g.amplitude?.toFixed(3)+' mm':'不输出有效实际侧移'}`:'两端铰支一阶正弦模态，幅值归一化，不是后屈曲位移'}>
    {[0,.5,1].map(v=><g key={v}><path d={`M35 ${y(v)}H265`} stroke="#2d4256" strokeWidth=".6"/><text x="27" y={y(v)+3} textAnchor="end">{type==='response'&&f.initialBow>0?(1+v*19).toFixed(1):v.toFixed(1)}</text></g>)}
    {[0,.25,.5,.75,1].map(v=><g key={v}><path d={`M${35+v*230} 28V143`} stroke="#2d425644"/><text x={35+v*230} y="162" textAnchor="middle">{type==='response'?(v*1.2).toFixed(2):(v*f.lengthMm/1000).toFixed(2)}</text></g>)}
    {type==='response'&&<><path d={`M${x(1)} 26V143`} stroke="#c3a7e3" strokeDasharray="4 4"/><text x={x(1)} y="18" textAnchor="middle">Pcr</text></>}
    <path d={path} fill="none" stroke={type==='response'?'#a4dfcb':'#bda5e5'} strokeWidth="1.8"/>
    {type==='response'&&g.precritical&&available&&f.initialBow>0&&g.ratio<=.95&&<circle cx={x(g.ratio)} cy={y(Math.min(1,((g.amplitude??0)/f.initialBow-1)/19))} r="3.3" fill="#0e2230" stroke="#b6e9d6" strokeWidth="1.5"/>}<text x="265" y="177" textAnchor="end">{type==='response'?'P / Pcr':'x / m'}</text></svg><p>{type==='mode'?'模态由弱轴与铰支边界确定。欧拉理论不确定临界及超临界的真实幅值。':f.initialBow===0?'当前为理想直杆；临界前侧移为零。引入初弯曲后可观察 e/e₀ = 1/(1−P/Pcr)。':'曲线为小变形弹性参考，e/e₀ = 1/(1−P/Pcr)。图示至20倍；超限侧移不作为有效预测。'}</p></section>;
}
