import React from 'react';
import type { AxialField } from '../mechanics/axialField';
import { axialMaterialPoint } from '../mechanics/axialField';
import { LatexRenderer } from './LatexRenderer';

export type AxialFieldMode = 'deformation' | 'traction' | 'displacement';
export function AxialFieldReadout({ field, mode, station }: { field: AxialField | null; mode: AxialFieldMode; station: number }) {
  if (!field) return <div className="axial-field-readout is-unavailable" role="status"><strong>当前仅显示未变形参考体</strong><p>载荷超出曲线或材料尚未标定，当前长度、截面面力及位移场未求解。没有断裂参数，不构造裂缝开口。</p></div>;
  const x = (station - .5) * field.lengthMm;
  const displacement = axialMaterialPoint(field, [x, 0, 0]).displacement[0];
  return <div className="axial-field-readout" data-field-mode={mode} data-current-area={field.currentArea} data-true-stress={field.trueStress}>
    <div className="axial-field-principle"><span>{mode === 'traction' ? '截面平衡 · 当前构形' : mode === 'displacement' ? '变形协调 · 中点为位移基准' : '均匀单轴场 · 自由侧面无面力'}</span>
      <LatexRenderer formula={mode === 'traction' ? String.raw`\boldsymbol{t}(\boldsymbol{n})=\boldsymbol{\sigma}\boldsymbol{n},\quad N=\int_A t_x\,\mathrm{d}A=F` : mode === 'displacement' ? String.raw`u_x=\varepsilon X,\quad u_y=\varepsilon_t Y,\quad u_z=\varepsilon_t Z` : String.raw`\sigma_{xx}=\frac{F}{A},\quad\sigma_{yy}=\sigma_{zz}=\tau_{ij}=0`} />
    </div>
    <dl>{mode === 'displacement' ? <><div><dt>参考坐标 X</dt><dd>{x.toFixed(1)} <small>mm</small></dd></div><div><dt>轴向位移 uₓ</dt><dd>{displacement.toFixed(4)} <small>mm</small></dd></div><div><dt>横向应变 εₜ</dt><dd>{(field.transverseStrain*100).toFixed(4)} <small>%</small></dd></div></> : <><div><dt>截面合力 N</dt><dd>{(field.force/1000).toFixed(3)} <small>kN</small></dd></div><div><dt>当前面积 A</dt><dd>{field.currentArea.toFixed(3)} <small>mm²</small></dd></div><div><dt>真实应力 F/A</dt><dd>{field.trueStress.toFixed(3)} <small>MPa</small></dd></div></>}</dl>
    <p>{mode === 'displacement' ? '颜色表示有符号轴向位移，非应力梯度；中点为零不代表支座约束。' : '右栏工程应力用 A₀；此处真实应力用当前面积 A。截面面力均匀；单调加载模型不包含卸载残余。'}</p>
  </div>;
}
