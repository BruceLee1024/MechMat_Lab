import {strainFormulas} from '../mechanics/formulaExplanations';
import {FormulaList} from './FormulaCard';
import React, { useId } from 'react';
import { ArrowDownRight, ChevronDown, MoveUpRight } from 'lucide-react';

const format = (value: number, digits = 2) => (Math.abs(value) < .5 * 10 ** -digits ? 0 : value).toFixed(digits);

/** 理论图与左侧单元使用同一位移场；放大只用于图形。 */
export function StrainTheory({ rigid, ex, gamma, tx, ty }: {
  rigid: boolean; ex: number; gamma: number; tx: number; ty: number;
}) {
  const id = useId().replace(/:/g, '');
  const scale = rigid ? 1 : 8;
  const position = (x: number, y: number) => [84 + 1.12 * (x + scale * (rigid ? tx : ex * x + gamma * y)), 164 - 1.12 * (y + (rigid ? ty : 0))];
  const initial = (x: number, y: number) => [84 + 1.12 * x, 164 - 1.12 * y];
  const corners = [[0, 0], [100, 0], [100, 100], [0, 100]];
  const deformed = corners.map(([x, y]) => position(x, y).join(',')).join(' ');
  const ux = rigid ? tx : 100 * (ex + gamma);
  const vy = rigid ? ty : 0;
  const unstrained = ex === 0 && gamma === 0;

  return <article className="strain-theory" aria-label="位移与应变概念图解">
    <header className="strain-theory-intro">
      <div className="strain-theory-context"><span className="strain-theory-dot" />随实验解读<span>{rigid ? '刚体平移' : '局部变形'}</span></div>
      <h3><span>位移</span>看位置<br /><span>应变</span>看相对变化</h3>
      <p>{rigid ? '各点一起移动，材料线的长度与夹角保持不变。' : unstrained ? '当前位移差为零，单元保持初始形态。' : '相邻点的位移不同，材料线随之伸缩或改变夹角。'}</p>
    </header>

    <figure className="strain-theory-figure">
      <div className="strain-theory-legend"><span>初始单元</span><span>当前单元</span><span>点的位移</span></div>
      <svg viewBox="0 0 280 211" role="img" aria-label={`${rigid ? '刚体平移，各点位移相同' : '局部变形，相邻点位移差决定应变'}。点 C 水平位移 ${format(ux)} mm，竖向位移 ${format(vy)} mm。${rigid ? '实际比例' : '变形放大八倍'}`}>
        <defs><marker id={`${id}-arrow`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 6 3 0 6" fill="#f6ac9d" /></marker></defs>
        {[0, 25, 50, 75, 100].map(n => <g key={n} className="strain-theory-grid"><path d={`M${initial(n, 0)} L${initial(n, 100)}`} /><path d={`M${initial(0, n)} L${initial(100, n)}`} /></g>)}
        <rect x="84" y="52" width="112" height="112" className="strain-theory-ghost" />
        <polygon points={deformed} className="strain-theory-unit" />
        {[25, 50, 75].map(n => <g key={n} className="strain-theory-mesh"><path d={`M${position(n, 0)} L${position(n, 100)}`} /><path d={`M${position(0, n)} L${position(100, n)}`} /></g>)}
        {corners.map(([x, y], i) => {
          const [px, py] = position(x, y);
          const [ix, iy] = initial(x, y);
          return <g key={i}>
            {Math.hypot(px - ix, py - iy) > .5 && <path d={`M${ix} ${iy} L${px} ${py}`} className="strain-theory-vector" markerEnd={`url(#${id}-arrow)`} />}
            <circle cx={px} cy={py} r={3} className="strain-theory-point" />
            <text x={px + (i === 0 || i === 3 ? -13 : 10)} y={py + (i < 2 ? 17 : -9)}>{'ABCD'[i]}</text>
          </g>;
        })}
        <path d="M84 189v5 M84 192H196 M196 189v5" className="strain-theory-dimension" />
        <text x="140" y="206" textAnchor="middle" className="strain-theory-dimension-label">参考边长 100 mm</text>
      </svg>
      <figcaption><MoveUpRight size={12} /><span>{rigid ? '各点箭头相同 · 实际比例' : '变形放大 ×8 · 读数为实际值'}</span></figcaption>
    </figure>

    <section className="strain-theory-motion" aria-label="当前点的位移">
      <div className="strain-theory-section-title"><MoveUpRight size={14} /><h4>一个点，移动了多少</h4><span>点 C</span></div>
      <div className="strain-theory-coordinates"><div><span>水平 u<sub>C</sub></span><output>{format(ux)}<small>mm</small></output></div><div><span>竖向 v<sub>C</sub></span><output>{format(vy)}<small>mm</small></output></div></div>
    </section>

    <section className="strain-theory-relative" aria-label="当前材料线的相对运动">
      <div className="strain-theory-section-title"><ArrowDownRight size={14} /><h4>两点之间，改变了多少</h4></div>
      <div className="strain-theory-relation"><div><span>沿 AB 的水平位移差</span><output>{format(ex * 100)} <small>mm</small></output></div><div><span>轴向应变 ε<sub>x</sub></span><output>{format(ex * 100)} <small>%</small></output></div></div>
      <div className="strain-theory-relation"><div><span>沿 AD 的水平位移差</span><output>{format(gamma * 100)} <small>mm</small></output></div><div><span>剪应变 γ<sub>xy</sub></span><output>{format(gamma, 3)} <small>rad</small></output></div></div>
    </section>

    <details className="strain-theory-equations">
      <summary><span>从位移场到应变</span><ChevronDown size={13} /></summary>
      <FormulaList formulas={strainFormulas({rigid,ex,gamma,tx,ty})}/>
    </details>
    <p className="strain-theory-scope">线性小应变模型。γ 使用小角度近似；不计算有限转动与材料应力。</p>
  </article>;
}
