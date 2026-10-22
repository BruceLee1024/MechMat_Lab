import React, { useId, useState } from 'react';
import { calculateAxialTeaching } from '../mechanics/calculations';
import { sampleMaterialCurve } from '../mechanics/axialResponse';
import { SimulationState } from '../types';

/** 材料曲线及当前读数使用同一入口；条件不足的材料只绘制无量纲形态。 */
export function AxialResponseChart({ state }: { state: SimulationState }) {
  const [full, setFull] = useState(true);
  const id = useId().replace(/:/g, '');
  const input = { materialName: state.materialName, force: state.axialForce, area: state.axialArea, length: state.axialLength, modulus: state.bendModulus, yieldStrength: state.materialYield };
  const result = calculateAxialTeaching(input);
  if (result.ok === false) return null;
  const v = result.values, curve = sampleMaterialCurve(input), model = curve.model;
  const normalized = curve.normalized;
  const switchable = model.family === 'plateau' || model.family === 'smooth';
  const whole = normalized || model.family === 'brittle' || full || v.strainMode === 'teaching';
  const showMarker = !normalized && v.strainMode !== 'elastic-estimate';
  const referenceStrain = curve.referenceStrain ?? 1;
  const xmax = normalized ? 1.05 : whole ? Math.max(...curve.points.map(p => p.strain), showMarker ? v.strain : 0) * 1.08 : referenceStrain * 1.2;
  const ymax = normalized ? 1.12 : Math.max(...curve.points.map(p => p.stress), showMarker ? v.stress : 0) * 1.18;
  const x = (strain: number) => 38 + strain / xmax * 236;
  const y = (stress: number) => 207 - stress / ymax * 177;
  const points = curve.points.map(p => [x(p.strain), y(p.stress)]);
  const refText = model.referenceRole === 'yield' ? model.family === 'smooth' ? 'Rp0.2' : 'σy' : 'σt,ref';
  return <section className="axial-response-chart" aria-label="轴向应力–应变曲线">
    <div className="axial-chart-heading"><h3>应力–应变</h3>{switchable ? <button aria-pressed={whole} disabled={v.strainMode === 'teaching'} onClick={() => setFull(value => !value)}>{whole ? '全程示意' : '局部'}<span aria-hidden="true">↗</span></button> : <span className="material-curve-kind">{normalized ? '形态示意' : model.label}</span>}</div>
    <div className="material-curve-identity"><strong>{model.name}</strong><span>{model.label}</span></div>
    <div className="axial-chart-meta"><span>{normalized ? '无量纲坐标 · 不标当前计算点' : v.strainMode === 'elastic-estimate' ? '当前超出曲线/标定范围' : '当前应变'}</span>{!normalized && <output>{(v.strain * 100).toFixed(3)} % {v.strainMode === 'elastic-estimate' ? '（估算）' : ''}</output>}</div>
    <svg viewBox="0 0 290 247" role="img" aria-label={`${model.name}，${model.label}，${normalized ? '无量纲形态示意，无当前计算点' : `${whole ? '全程教学曲线' : '局部曲线'}，当前应力 ${v.stress.toFixed(1)} MPa${showMarker ? `，应变 ${(v.strain*100).toFixed(3)}%` : '，当前响应未标定，不绘制计算点'}`}。非实测曲线。`}>
      <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8fc1ff" stopOpacity=".17" /><stop offset="1" stopColor="#8fc1ff" stopOpacity="0" /></linearGradient><clipPath id={`${id}-clip`}><rect x="38" y="24" width="236" height="183" /></clipPath></defs>
      {Array.from({ length: 5 }, (_, i) => <g key={i}>
        <path d={`M38 ${y(ymax*i/4)}H274`} stroke="#8ea9c025" strokeWidth=".7" />
        <text x="30" y={y(ymax*i/4)+3} textAnchor="end">{normalized ? (ymax*i/4).toFixed(1) : Math.round(ymax*i/4)}</text>
        <text x={38+236*i/4} y="225" textAnchor="middle">{normalized ? (xmax*i/4).toFixed(2) : (xmax*100*i/4).toFixed(xmax < .01 ? 3 : 1)}</text>
      </g>)}
      <text x="38" y="15">{normalized ? '相对应力' : 'σ / MPa'}</text><text x="274" y="243" textAnchor="end">{normalized ? '相对应变' : 'ε / %'}</text>
      <g clipPath={`url(#${id}-clip)`}>
        <polygon points={[[38,207],...points,[points[points.length-1][0],207]].map(p=>p.join(',')).join(' ')} fill={`url(#${id}-area)`} />
        <polyline points={points.map(p=>p.join(',')).join(' ')} stroke="#9cc9ff" strokeWidth="1.8" fill="none" />
        {curve.points.some(p=>p.branch === 'post-peak') && <polyline points={curve.points.filter((p,i)=>p.branch === 'post-peak' || curve.points[i+1]?.branch === 'post-peak').map(p=>`${x(p.strain)},${y(p.stress)}`).join(' ')} stroke="#c2b1ea" strokeWidth="2" strokeDasharray="4 4" fill="none" />}
        {!normalized && <path d={`M38 ${y(state.materialYield)}H274`} stroke="#e3b47d66" strokeDasharray="3 4" />}
        {showMarker && <><path d={`M${x(v.strain)} ${y(v.stress)}V207`} stroke="#87a4c877" strokeDasharray="3 4" /><circle cx={x(v.strain)} cy={y(v.stress)} r="9" fill="#9cc9ff" opacity=".12" /><circle cx={x(v.strain)} cy={y(v.stress)} r="4" fill="#142033" stroke="#a6d3ff" strokeWidth="1.8" /></>}
      </g>
      {!normalized && <text x="272" y={Math.max(30,y(state.materialYield)-6)} textAnchor="end">{refText} {state.materialYield}</text>}
    </svg>
    <p className="material-curve-scope"><i />{model.description}</p>
    {!showMarker && <p className="material-curve-estimate">当前应变、伸长为线弹性估算，不与示意曲线上的点混用。</p>}
  </section>;
}
