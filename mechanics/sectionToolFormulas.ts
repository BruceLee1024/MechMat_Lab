import type {SectionToolResult} from './sectionTool';
import {texNumber as n,type FormulaEntry} from './formulaExplanations';

/** 通用派生量直接读取本次截面计算；完整的类型推导在界面中单独展开。 */
export function sectionDerivedFormulas(v:SectionToolResult):FormulaEntry[]{
  return [
    {label:'形心极惯性矩',formula:String.raw`I_p=I_x+I_y`,details:{symbols:[{symbol:'I_x',name:'水平形心轴惯性矩',value:v.Ix,unit:'mm⁴'},{symbol:'I_y',name:'竖直形心轴惯性矩',value:v.Iy,unit:'mm⁴'}],steps:[`I_p=${n(v.Ix)}+${n(v.Iy)}=${n(v.Ip)}\\,\\mathrm{mm}^4`],results:[{key:'Ip',symbol:'I_p',value:v.Ip,unit:'mm⁴'}],note:'极二次矩，不是任意截面的 Saint-Venant 扭转常数。'}},
    ...(['x','y'] as const).map(axis=>{
      const I=axis==='x'?v.Ix:v.Iy,r=axis==='x'?v.ix:v.iy;
      return {label:`绕 ${axis} 轴惯性半径`,formula:`i_${axis}=\\sqrt{I_${axis}/A}`,details:{symbols:[{symbol:`I_${axis}`,name:'对应形心轴惯性矩',value:I,unit:'mm⁴'},{symbol:'A',name:'当前截面积',value:v.A,unit:'mm²'}],steps:[`i_${axis}=\\sqrt{\\frac{${n(I)}}{${n(v.A)}}}=${n(r)}\\,\\mathrm{mm}`],results:[{key:`i${axis}`,symbol:`i_${axis}`,value:r,unit:'mm'}]}};
    }),
    ...(['x','y'] as const).map(axis=>{
      const I=axis==='x'?v.Ix:v.Iy,c=axis==='x'?v.ymax:v.xmax,W=axis==='x'?v.Wx:v.Wy,edge=axis==='x'?'y':'x';
      return {label:`绕 ${axis} 轴抗弯截面模量`,formula:`W_${axis}=\\frac{I_${axis}}{${edge}_{max}}`,details:{symbols:[{symbol:`I_${axis}`,name:'对应形心轴惯性矩',value:I,unit:'mm⁴'},{symbol:`${edge}_{max}`,name:'形心轴至最远边缘的距离',value:c,unit:'mm'}],steps:[`W_${axis}=\\frac{${n(I)}}{${n(c)}}=${n(W)}\\,\\mathrm{mm}^3`],results:[{key:`W${axis}`,symbol:`W_${axis}`,value:W,unit:'mm³'}],note:'对非对称截面取两侧边缘距离的较大值，对应较小的抗弯截面模量。'}};
    }),
  ];
}
