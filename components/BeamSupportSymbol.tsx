import React from 'react';
import { beamSupportGlyph, type BeamSupportKind } from '../graphics/beamSupport';

/** 理论图与三维画布使用同一套支座符号比例。 */
export function BeamSupportSymbol({kind,x,y,size=1}:{kind:BeamSupportKind;x:number;y:number;size?:number}) {
  const glyph=beamSupportGlyph(kind);
  return <g transform={`translate(${x} ${y}) scale(${size})`} fill="#102032" stroke="#b4c9d9" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round">
    <path d={`${glyph.triangle.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ')}Z`}/>
    {glyph.rollers.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={glyph.rollerRadius}/>)}
    <path d={`M${glyph.ground[0].join(' ')}L${glyph.ground[1].join(' ')}`} fill="none"/>
    <path d={glyph.hatches.map(([a,b])=>`M${a.join(' ')}L${b.join(' ')}`).join(' ')} fill="none" stroke="#8299ac" strokeWidth="1"/>
    <circle r={glyph.pinRadius}/>
  </g>;
}
