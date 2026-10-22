import {texNumber as n} from './formulaExplanations';
import type {FormulaAxialInput,FormulaAxialResult} from './formulaAxial';
export interface FormulaWorkedStep {label:string;formula:string;ariaLabel?:string}
/** 参数代入与侧栏共用计算结果；弹性范围外不展示应变能代入。 */
export function formulaAxialSteps(input:FormulaAxialInput,result:FormulaAxialResult,energy=false):FormulaWorkedStep[]{
 if(result.ok===false)return [];
 const v=result.values,E=v.material.E*1000;
 const steps=[{label:'正应力 σ',ariaLabel:'当前正应力代入过程',formula:String.raw`\sigma=\frac{${n(input.forceKN*1000)}}{${n(v.area)}}=${n(v.stress)}\,\mathrm{MPa}`},{label:'伸长量 ΔL',ariaLabel:'当前伸长量代入过程',formula:String.raw`\Delta L=\frac{${n(v.stress)}\times${n(input.lengthMm)}}{${n(E)}}=${n(v.deformation)}\,\mathrm{mm}`}];
 if(energy&&v.energyApplicable)steps.push({label:'应变能密度 u',ariaLabel:'当前应变能密度代入过程',formula:String.raw`u=\frac{${n(v.stress)}^2}{2\times${n(E)}}\times1000=${n(v.strainEnergyDensityKJ)}\,\mathrm{kJ/m^3}`},{label:'总应变能 U',ariaLabel:'当前总应变能代入过程',formula:String.raw`U=\frac{${n(input.forceKN*1000)}^2\times${n(input.lengthMm)}}{2\times${n(E)}\times${n(v.area)}\times1000}=${n(v.totalStrainEnergyJ)}\,\mathrm J`});
 return steps;
}
