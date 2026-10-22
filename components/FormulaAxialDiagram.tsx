import React,{useId,useState} from 'react';
import {Layers,MoveHorizontal} from 'lucide-react';
import type {FormulaAxialInput,FormulaAxialResult} from '../mechanics/formulaAxial';

export function FormulaAxialDiagram({input,result}:{input:FormulaAxialInput;result:FormulaAxialResult}){
  const id=useId().replace(/:/g,''),[cut,setCut]=useState(true);
  const stress=result.ok?result.values.stress:0,loaded=input.forceKN!==0&&result.ok,sign=input.forceKN>=0?1:-1;
  const arrow=(x:number,y:number,direction:number,color:string,length=48)=><g stroke={color} fill={color}><line x1={x} y1={y} x2={x+direction*length} y2={y} strokeWidth="2"/><path d={`M${x+direction*length},${y} l${-direction*8},-4 v8 z`} stroke="none"/></g>;
  const end=410,top=86,bottom=172;
  return <section className="fw-axial-figure" aria-label="轴向正应力图解">
    <header><span>受力与截面图解</span><div className="fw-segment" role="group" aria-label="图解方式"><button type="button" aria-pressed={!cut} onClick={()=>setCut(false)}><MoveHorizontal size={12}/>整体受力</button><button type="button" aria-pressed={cut} onClick={()=>setCut(true)}><Layers size={12}/>截面应力</button></div></header>
    <svg viewBox="0 0 550 270" role="img" aria-label={`${cut?'截面法局部示意':'整体轴向受力'}，${input.forceKN===0?'零载荷':sign>0?'拉伸':'压缩'}，${result.ok?`正应力 ${stress.toFixed(2)} MPa`:'参数无效'}`}>
      <defs><pattern id={`${id}-grid`} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#163047" strokeWidth=".6"/></pattern><linearGradient id={`${id}-body`} x2="0" y2="1"><stop stopColor="#174268" stopOpacity=".85"/><stop offset="1" stopColor="#0d2338" stopOpacity=".6"/></linearGradient><pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="#3edbc2" strokeWidth=".8"/></pattern></defs>
      <rect width="550" height="270" fill={`url(#${id}-grid)`}/>
      {input.mode==='diameter'?<>
        <path d="M116 86H410A18 43 0 0 1 410 172H116Z" fill={`url(#${id}-body)`} stroke="#5491b4" strokeWidth="1.5"/>
        <ellipse cx="116" cy="129" rx="18" ry="43" fill="#15354d" stroke="#5491b4"/>
        <ellipse cx="410" cy="129" rx="18" ry="43" fill={cut?`url(#${id}-hatch)`:'#19425c'} stroke={cut?'#51d7bf':'#5491b4'} strokeWidth="1.5"/>
      </>:<>
        <path d={`M116 ${top}L145 64H${end+29}L${end} ${top}Z`} fill="#183e5a" stroke="#427c9e"/>
        <path d={`M116 ${top}H${end}V${bottom}H116Z`} fill={`url(#${id}-body)`} stroke="#5491b4" strokeWidth="1.5"/>
        <path d={`M${end} ${top}L${end+29} 64V150L${end} ${bottom}Z`} fill={cut?`url(#${id}-hatch)`:'#19425c'} stroke={cut?'#51d7bf':'#5491b4'} strokeWidth="1.5"/>
      </>}
      <line x1="101" y1="130" x2="457" y2="130" stroke="#739ab1" strokeDasharray="5 6" opacity=".5"/>
      <g fill="#8da9bc" fontSize="11"><text x="125" y="115">形心轴</text><text x="410" y="43" fill="#68ddc3">截面 A</text><path d="M435 48L425 76" stroke="#68ddc3"/></g>
      {loaded&&<>
        {arrow(sign>0?112:56,130,-sign,'#64bcec',54)}<text x="57" y="107" fill="#77c8f3" fontSize="15" fontStyle="italic">N</text>
        {cut?<>{[92,110,128,146,164].map(y=><g key={y}>{arrow(sign>0?426:478,y,sign,'#3bdbc0',48)}</g>)}<text x="487" y="133" fill="#6fe0c9" fontSize="15" fontStyle="italic">σ</text></>:<>{arrow(sign>0?441:495,130,sign,'#64bcec',54)}<text x="480" y="107" fill="#77c8f3" fontSize="15" fontStyle="italic">N</text></>}
      </>}
      <g fill="#9ab1c6" fontSize="11"><text x="118" y="211">{cut?'截面法局部示意 · 等长矢量表示均匀应力':`杆长 L = ${input.lengthMm} mm`}</text><text x="118" y="233">{input.mode==='diameter'?`圆截面 d = ${input.diameter} mm`:'仅指定面积 · 形状为示意'}</text><text x="352" y="233" fill="#6ddfc5">{result.ok?`A = ${result.values.area.toFixed(2)} mm²`:'参数无效'}</text></g>
    </svg>
    <footer><span className="fw-legend"><i/>{input.forceKN===0?'零载荷':sign>0?'拉伸为正':'压缩为负'}</span><span>几何与矢量长度为示意</span></footer>
  </section>;
}
