/** 两个等长实心圆轴段，x 从 A 到 C，扭转角均相对于 A，单位 N、mm、MPa、rad。 */
export interface TorsionField { torqueNm:number; radiusMm:number; lengthMm:number; modulusMPa:number; loadRatio:number }
/** 输入数值按 AB 内扭矩正号；外力偶沿全局轴的代数值与内扭矩/转角约定配套。 */
export function torsionAppliedTorques(f:TorsionField) {return [-f.torqueNm,f.torqueNm*f.loadRatio,f.torqueNm*(1-f.loadRatio)] as const;}
export function torsionStation(f:TorsionField,xMm:number,side:'left'|'right'='right') {
  const x=Math.max(0,Math.min(f.lengthMm,xMm)),middle=f.lengthMm/2,Ip=Math.PI*f.radiusMm**4/2;
  const ab=f.torqueNm*1000,bc=ab*(1-f.loadRatio);
  const torque=x<middle||(x===middle&&side==='left')?ab:bc;
  const angle=(ab*Math.min(x,middle)+bc*Math.max(0,x-middle))/(f.modulusMPa*Ip);
  return {xMm:x,torqueNmm:torque,angleRad:angle,twistRate:torque/(f.modulusMPa*Ip),surfaceShear:torque*f.radiusMm/Ip};
}
export function torsionVertex(f:TorsionField,x:number,rho:number,azimuth:number,amplification:number):[number,number,number] {
  const a=azimuth+torsionStation(f,x).angleRad*amplification,s=560/f.lengthMm;
  return [(x-f.lengthMm/2)*s,rho*Math.cos(a)*s,rho*Math.sin(a)*s];
}
/** 这是教学显示保护值，不是材料强度或工程设计限值。 */
export function torsionDisplay(f:TorsionField,requested:number) {
  const shear=Math.abs(torsionStation(f,0).surfaceShear/f.modulusMPa);
  const smallStrain=Number.isFinite(shear)&&shear<=.05;
  const angle=torsionStation(f,f.lengthMm).angleRad;
  const readable=Number.isFinite(angle*requested)&&Math.abs(angle*requested)<=Math.PI*6;
  return {smallStrain,readable,available:smallStrain&&readable,amplification:smallStrain&&readable?requested:0};
}
export function torsionShearAtRadius(f:TorsionField,x:number,rho:number) {
  return torsionStation(f,x).surfaceShear*Math.max(0,Math.min(f.radiusMm,rho))/f.radiusMm;
}

/** 横截面上的切向粒子显示剪应力方向；不沿螺旋线传送材料。 */
export function torsionFlow(f:TorsionField,time:number) {
  if(!f.torqueNm||!Number.isFinite(time))return [];
  return [.12,.3,.46,.58,.75,.91].flatMap(u=>[.55,1].flatMap(r=>{
    const x=u*f.lengthMm,stress=torsionShearAtRadius(f,x,r*f.radiusMm),sign=Math.sign(stress);
    if(!sign)return [];
    const opacity=Math.abs(stress)/(Math.abs(stress)+50);
    return Array.from({length:7},(_,i)=>({x,rho:r*f.radiusMm,azimuth:i*Math.PI*2/7+sign*time*.55,tail:i*Math.PI*2/7+sign*(time*.55-.08),opacity:.15+.75*opacity}));
  }));
}
