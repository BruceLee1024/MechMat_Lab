import type {SectionProperties} from '../types';
import {calculateSectionProperties} from './sections';
import {bendingProfile} from './sectionOutline';
export interface BucklingField {load:number;lengthMm:number;modulusMPa:number;section:SectionProperties;initialBow:number}
export function bucklingGeometry(f:BucklingField) {
  const p=calculateSectionProperties(f.section),weakAxis=p.Iz<=p.Iy?'z':'y',inertia=Math.min(p.Iz,p.Iy);
  const critical=Math.PI**2*f.modulusMPa*inertia/f.lengthMm**2,ratio=f.load/critical;
  const precritical=ratio<1,amplitude=precritical?f.initialBow/(1-ratio):null;
  const small=amplitude!==null&&Number.isFinite(amplitude)&&amplitude/f.lengthMm<=.03&&amplitude*Math.PI/f.lengthMm<=.1;
  return {weakAxis,inertia,critical,ratio,precritical,amplitude,small,area:p.area,edge:weakAxis==='z'?p.yMax:p.zMax,equalAxes:Math.abs(p.Iz-p.Iy)<1e-8*Math.max(p.Iz,p.Iy)};
}
export function bucklingStation(f:BucklingField,xMm:number,amplitude:number) {
  const x=Math.max(0,Math.min(f.lengthMm,xMm)),phase=Math.PI*x/f.lengthMm;
  return {xMm:x,offset:amplitude*Math.sin(phase),slope:amplitude*Math.PI/f.lengthMm*Math.cos(phase)};
}
/** 拉为正、压为负。初始曲率无应力，加载产生的弯矩为 P·w，而非 P·(w−w0)。 */
export function bucklingStressAt(f:BucklingField,xMm:number,y:number,z:number) {
  const g=bucklingGeometry(f);
  if(g.amplitude===null)return null;
  return -f.load/g.area+f.load*bucklingStation(f,xMm,g.amplitude).offset*(g.weakAxis==='z'?y:z)/g.inertia;
}
/** 仅为平面弯曲模型的名义应力；不包含扭转、局部屈曲或端部集中效应。 */
export function bucklingStressExtrema(f:BucklingField) {
  const profile=bendingProfile(f.section),g=bucklingGeometry(f);
  if(profile.schematic||g.amplitude===null)return null;
  const stresses=profile.contours.flat().map(([y,z])=>bucklingStressAt(f,f.lengthMm/2,y,z)!);
  return {min:Math.min(-f.load/g.area,...stresses),max:Math.max(-f.load/g.area,...stresses)};
}
/** 固定采样位置、沿局部应力方向闪动的标记，不把应力画成真实材料运动。 */
export function bucklingStressGlyphs(f:BucklingField,time:number) {
  const g=bucklingGeometry(f),profile=bendingProfile(f.section);
  if(!f.load||!g.precritical||!g.small||profile.schematic||!Number.isFinite(time))return [];
  const vertices=profile.contours.flat(),fibers=vertices.filter((_,i)=>i%Math.max(1,Math.ceil(vertices.length/8))===0);
  return fibers.flatMap(([y,z])=>Array.from({length:12},(_,i)=>{
    const u=(i+.5)/12,x=u*f.lengthMm,stress=bucklingStressAt(f,x,y,z)!;
    const direction=(u<.5?-1:1)*Math.sign(stress);
    const pulse=.6+.4*Math.sin(time*3-direction*u*20);
    return {x,y,z,stress,tailX:x-direction*f.lengthMm*.012,opacity:(.15+.75*Math.abs(stress)/(Math.abs(stress)+60))*pulse};
  })).filter(p=>Math.abs(p.stress)>1e-10);
}
/** 截面坐标 y/z 与梁共用；x 为竖向杆轴。截面绕弱轴随挠曲线转角转动。 */
export function bucklingVertex(f:BucklingField,x:number,y:number,z:number,amplitude:number):[number,number,number] {
  const weak=bucklingGeometry(f).weakAxis,p=bucklingStation(f,x,amplitude),a=Math.atan(p.slope),s=500/f.lengthMm;
  return weak==='z'?[(x-y*Math.sin(a)-f.lengthMm/2)*s,(p.offset+y*Math.cos(a))*s,z*s]:[(x-z*Math.sin(a)-f.lengthMm/2)*s,y*s,(p.offset+z*Math.cos(a))*s];
}
