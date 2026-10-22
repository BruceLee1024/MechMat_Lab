import {calculateAxial} from './calculations';
import {DEFAULT_MATERIALS} from './materials';
export interface FormulaAxialInput {forceKN:number;diameter:number;area:number;lengthMm:number;materialName:string;mode:'diameter'|'area'}
export const DEFAULT_FORMULA_AXIAL:FormulaAxialInput={forceKN:45,diameter:18,area:Math.PI*18**2/4,lengthMm:1000,materialName:'Q235钢',mode:'diameter'};
export const FORMULA_AXIAL_MATERIALS=DEFAULT_MATERIALS.filter(m=>['Q235钢','Q345钢','6061-T6铝合金'].includes(m.name));
export function calculateFormulaAxial(input:FormulaAxialInput){
  const material=FORMULA_AXIAL_MATERIALS.find(m=>m.name===input.materialName);
  if(!material)return {ok:false as const,diagnostics:[{field:'materialName',message:'请选择有效的材料参考参数'}]};
  const size=input.mode==='diameter'?input.diameter:input.area;
  if(!Number.isFinite(size)||size<=0)return {ok:false as const,diagnostics:[{field:'section',message:'截面尺寸须为有限正数'}]};
  const area=input.mode==='diameter'?Math.PI*input.diameter**2/4:input.area;
  const result=calculateAxial({force:input.forceKN*1000,area,length:input.lengthMm/1000,modulus:material.E});
  if(result.ok===false)return result;
  const stress=result.values.stress,extrapolated=Math.abs(stress)>=material.yield;
  const ratio=stress===0?null:material.yield/Math.abs(stress);
  return {...result,values:{...result.values,area,material,extrapolated,energyApplicable:!extrapolated,referenceRatio:ratio!==null&&Number.isFinite(ratio)?ratio:null,transverseStrain:-material.poisson*result.values.strain}};
}
export type FormulaAxialResult=ReturnType<typeof calculateFormulaAxial>;
