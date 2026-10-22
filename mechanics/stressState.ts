import type {calculatePlaneStress} from './calculations';
export type PlaneStressValues=Extract<ReturnType<typeof calculatePlaneStress>,{ok:true}>['values'];
export type StressVector=[number,number,number];
export const stressAngle180=(angle:number)=>((angle%180)+180)%180;
/** 三维视图中单元体绕全局z旋转；相机旋转不参与应力变换。 */
export function stressRotate([x,y,z]:StressVector,angle:number):StressVector {const t=stressAngle180(angle)*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return [c*x-s*y,s*x+c*y,z];}
/** 正、负截面的局部牵引，后续由同一旋转映射到全局。 */
export function stressFaceTraction(v:PlaneStressValues,axis:'x'|'y',side:number):StressVector {
  return axis==='x'?[side*v.sigX_prime,side*v.tauXY_prime,0]:[side*v.tauXY_prime,side*v.sigY_prime,0];
}
/** 拖动X′状态点反解θ；零半径时没有可识别的主方向。 */
export function stressAngleFromMohr(diff:number,tau:number,relativeSigma:number,shear:number):number|null {
  if(Math.hypot(diff,tau)===0||Math.hypot(relativeSigma,shear)===0)return null;
  return stressAngle180((Math.atan2(tau,diff)-Math.atan2(shear,relativeSigma))*90/Math.PI);
}
export function stressMohrPoints(v:PlaneStressValues) {return {x:[v.sigX_prime,v.tauXY_prime] as const,y:[v.sigY_prime,-v.tauXY_prime] as const};}
export const stressNumber=(n:number,d=2)=>Math.abs(n)<1e-10?'0.00':Math.abs(n)>=1e5||Math.abs(n)<.001?n.toExponential(2):n.toFixed(d);
