import {fundamentalsFormulas,overviewFormulas,sectionFormulas,formTeachingFormula} from '../mechanics/formulaExplanations';
import React from 'react';
import { ArrowUpRight, ArrowRight, Box } from 'lucide-react';
import { TheoryArrow, TheoryLesson, TheoryRelation } from './TheoryLesson';
import { calculateFundamentals } from '../mechanics/fundamentals';
import { sectionStudy } from '../mechanics/conceptStudies';
import { SimulationState } from '../types';

type Values = Extract<ReturnType<typeof calculateFundamentals>, { ok: true }>['values'];
const number = (value: number | undefined, digits = 2) => value === undefined || !Number.isFinite(value) ? '—' : (Math.abs(value) < .5 * 10 ** -digits ? 0 : value).toFixed(digits);
const bound = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function RodDiagram({ strain = 0, transverse = 0, section = false, valid = true }: { strain?: number; transverse?: number; section?: boolean; valid?: boolean }) {
  const dx = valid ? bound(strain * 80 * 150, -30, 35) : 0;
  const dy = valid ? bound(transverse * 80 * 35, -12, 12) : 0;
  return <svg viewBox="0 0 280 180" role="img" aria-label={valid ? `${section ? '直杆中部假想截面与两端轴向作用' : '直杆轴向与横向尺寸变化'}，形变放大示意` : '参考直杆示意，当前无有效计算结果'}>
    <path className="lesson-axis" d="M25 95H258" />
    <rect className="lesson-ghost" x="65" y="60" width="150" height="70" />
    <rect className="lesson-body" x={65 - dx / 2} y={60 - dy} width={150 + dx} height={70 + dy * 2} />
    {[1, 2, 3, 4, 5].map(i => <path key={i} className="lesson-mesh" d={`M${65 - dx / 2 + (150 + dx) * i / 6} ${60 - dy}v${70 + dy * 2}`} />)}
    {section ? <><path className="lesson-cut" d="M140 43V145" /><text x="146" y="43" className="mint">截面 A₀</text>{valid && strain !== 0 && <><TheoryArrow x1={strain > 0 ? 163 : 121} y1={95} x2={strain > 0 ? 137 : 147} y2={95} mint /><text x="152" y="82" className="mint">N</text></>}</> : <><path className="lesson-measure" d={`M${65 - dx / 2} 38v-5M${65 - dx / 2} 35H${215 + dx / 2}M${215 + dx / 2} 38v-5`} /><text x="140" y="24" textAnchor="middle">轴向尺寸 L</text><path className="lesson-measure" d={`M244 ${60 - dy}h6M247 ${60 - dy}V${130 + dy}M244 ${130 + dy}h6`} /><text x="250" y="101" className="mint">w</text></>}
    {valid && strain !== 0 && <><TheoryArrow x1={51 - dx / 2} y1={95} x2={strain > 0 ? 23 - dx / 2 : 63 - dx / 2} y2={95} /><TheoryArrow x1={229 + dx / 2} y1={95} x2={strain > 0 ? 257 + dx / 2 : 217 + dx / 2} y2={95} /></>}
    <text x="65" y="160" className="muted">虚线：初始尺寸</text><text x="167" y="160" className="mint">实线：当前形态</text>
  </svg>;
}

export function PoissonTheory({ values, state, beyondYield, onRead }: { values: Values | null; state: SimulationState; beyondYield: boolean; onRead: () => void }) {
  const strain = values?.strain ?? 0;
  const lead = !values ? '当前参数无法计算。检查材料与尺寸后，图解和读数会同步恢复。' : strain === 0 ? '当前尚未加载，轴向与横向尺寸均保持初始值。' : state.poissonRatio === 0 ? '当前泊松比为零，轴向变形不引起横向尺寸变化。' : strain > 0 ? '拉伸使试件变长，同时沿横向收缩；两者由泊松比联系。' : '压缩使试件缩短，同时沿横向扩张；两者由泊松比联系。';
  return <TheoryLesson context="泊松效应" first="纵向有伸缩" second="横向也响应" lead={lead}
    diagram={<RodDiagram strain={strain} transverse={values?.transverseStrain} valid={!!values} />} caption="形变放大示意 · 下方读数为实际值"
    readings={[{ label: '轴向应变 ε', value: number(values ? strain * 100 : undefined, 3), unit: '%' }, { label: '横向应变 εtrans', value: number(values ? values.transverseStrain * 100 : undefined, 3), unit: '%', accent: true }]}
    formulas={values?fundamentalsFormulas(state,values):[]}
    scope={beyondYield ? '当前已超过参考屈服强度。弹性外推不代表材料实际响应。' : '均匀、各向同性、小变形线弹性模型；截面取等面积正方形。'}
    action={<button onClick={onRead}>阅读完整章节<ArrowUpRight size={13} /></button>}>
    <TheoryRelation title="泊松比连接两个方向"><div className="lesson-value-row"><span>当前泊松比 ν</span><strong>{number(state.poissonRatio)}</strong></div><p>横向应变 = −ν × 轴向应变。负号表示常见材料在两个方向发生相反的尺寸变化。</p></TheoryRelation>
    <TheoryRelation title="同一载荷，两种应力"><div className="lesson-value-row"><span>工程应力 · 初始面积</span><strong>{number(values?.stress, 1)} <small>MPa</small></strong></div><div className="lesson-value-row coral"><span>真应力 · 当前面积</span><strong>{number(values?.trueStress, 3)} <small>MPa</small></strong></div><p>小变形时面积变化很小，两种应力接近。</p></TheoryRelation>
  </TheoryLesson>;
}

export function OverviewTheory({ topic, values, state, onContinue }: { topic: 'forces' | 'strain' | 'design'; values: Values | null; state: SimulationState; onContinue: () => void }) {
  const content = {
    forces: { context: '外力与内力', first: '外力施加作用', second: '内力在截面传递', lead: '假想切开直杆，截面上的轴力平衡端部外力；应力描述内力的分布。' },
    strain: { context: '应力与应变', first: '应力看受力', second: '应变看相对变形', lead: '伸长量除以原长得到轴向应变；在线弹性范围内，应力与应变成正比。' },
    design: { context: '强度与刚度', first: '强度关注失效', second: '刚度关注变形', lead: '承受载荷与控制变形是两类问题，需要分别观察应力和伸长量。' },
  }[topic];
  const force = values ? state.axialForce / 1000 : undefined;
  return <TheoryLesson {...content} diagram={<RodDiagram section={topic === 'forces'} strain={values?.strain} transverse={values?.transverseStrain} valid={!!values} />} caption="等截面直杆示意 · 图形放大不改变读数"
    readings={topic === 'forces' ? [{ label: '端部外力 F', value: number(force, 3), unit: 'kN' }, { label: '截面轴力 N', value: number(force, 3), unit: 'kN', accent: true }] : topic === 'strain' ? [{ label: '轴向伸长 ΔL', value: number(values?.deformation, 3), unit: 'mm' }, { label: '轴向应变 ε', value: number(values ? values.strain * 100 : undefined, 3), unit: '%', accent: true }] : [{ label: '平均正应力 σ', value: number(values?.stress, 1), unit: 'MPa' }, { label: '轴向伸长 ΔL', value: number(values?.deformation, 3), unit: 'mm', accent: true }]}
    formulas={values?overviewFormulas(state,values):[]}
    scope={!values ? '当前参数无有效计算结果，请先检查材料与尺寸。' : Math.abs(values.stress) > state.materialYield ? '已超过参考屈服，当前数值为弹性外推，不代表实际响应。' : '均匀、各向同性、等截面直杆的线弹性演示；不进行稳定性验算。'}
    action={<button onClick={onContinue}><Box size={13} />探索变形固体假设<ArrowRight size={13} /></button>}>
    <TheoryRelation title={topic === 'forces' ? '从截面轴力到平均应力' : topic === 'strain' ? '从伸长量到相对应变' : '两个指标，分别判断'}>
      {topic === 'forces' ? <><div className="lesson-value-row"><span>初始截面积 A₀</span><strong>{number(state.axialArea, 1)} <small>mm²</small></strong></div><div className="lesson-value-row"><span>平均正应力 N / A₀</span><strong>{number(values?.stress, 1)} <small>MPa</small></strong></div><p>内力是相邻部分之间传递的作用，切开后才在隔离体上显露出来。</p></> : topic === 'strain' ? <><div className="lesson-value-row"><span>试件原长 L₀</span><strong>{number(values?.lengthMm, 1)} <small>mm</small></strong></div><div className="lesson-value-row"><span>弹性模量 E</span><strong>{number(state.bendModulus, 0)} <small>GPa</small></strong></div><p>相同伸长量，对不同原长的试件意味着不同的应变。</p></> : <><div className="lesson-value-row"><span>参考屈服强度</span><strong>{number(state.materialYield, 0)} <small>MPa</small></strong></div><p>应力可与参考屈服强度比较；变形是否满足使用要求，还需要给定允许变形。本演示未设置该限值。</p></>}
    </TheoryRelation>
    <TheoryRelation title="从载荷到响应"><div className="lesson-chain"><span>外力 F</span><ArrowRight size={12} /><span>内力 N</span><ArrowRight size={12} /><span>应力 σ</span></div><p>材料的弹性模量决定应力如何对应应变，试件原长再把应变转换为伸长量。</p></TheoryRelation>
  </TheoryLesson>;
}

export function SectionTheory({ cut, transverse, axial, isolate }: { cut: number; transverse: number; axial: number; isolate: boolean }) {
  const values = sectionStudy(cut, transverse, axial);
  const x = 30 + 2.2 * cut;
  return <TheoryLesson context={isolate ? '右段隔离体' : '整体构件'} first="切开显露内力" second="平衡求出结果" lead="选取切面右侧作为隔离体，用切面内力平衡端部外载；移动截面，力臂随之改变。"
    diagram={<svg viewBox="0 0 280 180" role="img" aria-label={`右段自由体，切面位于杆长的 ${cut}%，剩余长度 ${number(values.remainingM)} m，轴力 ${number(axial)} kN，剪力 ${number(transverse)} kN，弯矩 ${number(values.momentKNm, 3)} kN·m`}>
      <rect className="lesson-ghost" x="30" y="78" width="220" height="27" /><rect className="lesson-body" x={x} y="78" width={250 - x} height="27" /><path className="lesson-cut" d={`M${x} 55V128`} /><text x={x} y="45" textAnchor="middle" className="mint">切面</text>
      <path className="lesson-measure" d={`M${x} 145v6M${x} 148H250M250 145v6`} /><text x={(x + 250) / 2} y="166" textAnchor="middle">L − x = {number(values.remainingM)} m</text>
      {axial > 0 && <><TheoryArrow x1={x - 3} y1={92} x2={x - 30} y2={92} mint /><text x={x - 22} y="80" className="mint">N</text><TheoryArrow x1={253} y1={92} x2={278} y2={92} /><text x="264" y="78" className="coral">F</text></>}
      {transverse > 0 && <><TheoryArrow x1={x + 9} y1={72} x2={x + 9} y2={48} mint /><text x={x + 18} y="58" className="mint">Q</text><TheoryArrow x1={250} y1={108} x2={250} y2={134} /><text x="260" y="127" className="coral">P</text><path className="lesson-torque" d={`M${x - 24} 119a20 20 0 1 0 0-40m6 2-6-2 2-6`} /><text x={x - 38} y="133" className="mint">M</text></>}
    </svg>} caption="右段受力示意 · 箭头仅表达作用方向"
    readings={[{ label: '截面弯矩 M', value: number(values.momentKNm, 3), unit: 'kN·m' }, { label: '剩余长度 L − x', value: number(values.remainingM), unit: 'm', accent: true }]}
    formulas={sectionFormulas(values)}
    scope="杆长 1 m，端部集中力、无分布荷载。内力按右段图示方向读取；改取左段时切面作用反向。">
    <TheoryRelation title="力平衡，得到轴力与剪力"><div className="lesson-value-row"><span>轴力 N = F</span><strong>{number(axial)} <small>kN</small></strong></div><div className="lesson-value-row mint"><span>剪力 Q = P</span><strong>{number(transverse)} <small>kN</small></strong></div></TheoryRelation>
    <TheoryRelation title="力矩平衡，得到当前弯矩"><div className="lesson-calculation">{number(transverse)} <small>kN</small><span>×</span>{number(values.remainingM)} <small>m</small></div><p>横向力不变时，切面越靠近端部，力臂越短，弯矩越小。内力代表被移去部分对保留部分的作用。</p></TheoryRelation>
  </TheoryLesson>;
}

type Form = 'axial' | 'shear' | 'torsion' | 'bending';
function FormDiagram({ form, amount }: { form: Form; amount: number }) {
  const d = amount * 25;
  // 由中性轴的法向偏移得到两侧材料线，弯曲时两侧弧长随之改变。
  const bendingEdge = (offset: number) => Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    const slope = 4 * d * (1 - 2 * t) / 196;
    const normal = Math.hypot(slope, 1);
    return [42 + 196 * t - offset * slope / normal, 95 + 4 * d * t * (1 - t) + offset / normal].join(',');
  });
  const upper = form === 'bending' ? bendingEdge(-15) : [];
  const lower = form === 'bending' ? bendingEdge(15) : [];
  const rotate = (x: number, y: number) => {
    const angle = amount * .85;
    return [220 + x * Math.cos(angle) - y * Math.sin(angle), 92 + x * Math.sin(angle) + y * Math.cos(angle)].join(',');
  };
  return <svg viewBox="0 0 280 180" role="img" aria-label={`${amount === 0 ? '当前为初始形态' : { axial: '轴向材料线伸长', shear: '原本正交的材料线夹角改变', torsion: '两端截面相对转动', bending: '弯曲时一侧伸长、另一侧缩短' }[form]}，当前演示幅度 ${number(amount * 100, 0)}%，几何示意`}>
    <path className="lesson-axis" d="M24 95H258" />
    {form === 'axial' ? <><rect className="lesson-ghost" x="65" y="67" width="150" height="56" /><rect className="lesson-body" x={65 - d / 2} y="67" width={150 + d} height="56" />{[0, 1, 2, 3, 4].map(i => <path key={i} className="lesson-mesh" d={`M${65 - d / 2 + i * (150 + d) / 4} 67v56`} />)}{amount > 0 && <><TheoryArrow x1={52 - d / 2} y1={95} x2={25 - d / 2} y2={95} /><TheoryArrow x1={228 + d / 2} y1={95} x2={255 + d / 2} y2={95} /></>}<text x="140" y="155" textAnchor="middle" className="mint">{amount > 0 ? '沿轴线方向伸长' : '轴线长度保持初始值'}</text></> : null}
    {form === 'shear' ? <><rect className="lesson-ghost" x="65" y="58" width="140" height="76" /><polygon className="lesson-body" points={`65,134 205,134 ${205 + d},58 ${65 + d},58`} /><path className="lesson-cut" d={`M65 134L${65 + d} 58M65 116h18v18`} />{amount > 0 && <TheoryArrow x1={96} y1={44} x2={131 + d} y2={44} />}<text x="140" y="159" textAnchor="middle" className="mint">{amount > 0 ? '直角改变 · 相邻材料层错动' : '初始直角 · 材料层无错动'}</text></> : null}
    {form === 'torsion' ? <><rect className="lesson-ghost" x="198" y="70" width="44" height="44" /><path className="lesson-axis" d="M60 92H220" />{[[-22, -22], [22, -22], [22, 22], [-22, 22]].map(([x, y], i) => <path key={i} className="lesson-mesh" d={`M${60 + x},${92 + y}L${rotate(x, y)}`} />)}<rect className="lesson-body" x="38" y="70" width="44" height="44" /><polygon className="lesson-body" points={[[-22, -22], [22, -22], [22, 22], [-22, 22]].map(([x, y]) => rotate(x, y)).join(' ')} /><text x="60" y="143" textAnchor="middle">左端截面</text><text x="220" y="143" textAnchor="middle" className="mint">右端截面</text><text x="140" y="36" textAnchor="middle" className="mint">相对转角 φ</text></> : null}
    {form === 'bending' ? <><rect className="lesson-ghost" x="42" y="80" width="196" height="30" /><path className="lesson-body" d={`M${upper.join('L')}L${[...lower].reverse().join('L')}Z`} /><path className="lesson-bend-inner" d={`M${upper.join('L')}`} /><path className="lesson-bend-outer" d={`M${lower.join('L')}`} /><text x="140" y="33" textAnchor="middle" className="mint">{amount > 0 ? '上侧缩短' : '上侧材料线'}</text><text x="140" y="160" textAnchor="middle" className="coral">{amount > 0 ? '下侧伸长' : '下侧材料线'}</text></> : null}
  </svg>;
}

export function FormTheory({ form, amount, title, symbol, formula, explanation }: { form: Form; amount: number; title: string; symbol: string; formula: string; explanation: string }) {
  const content = {
    axial: { first: '沿轴线伸缩', second: '观察材料线长度', lead: '轴向力使杆件沿轴线伸长或缩短，轴向应变衡量材料线的相对长度变化。', key: '轴向应变 ε', geometry: '轴线保持直线；沿轴向的材料线长度改变。' },
    shear: { first: '材料层错动', second: '观察直角的变化', lead: '相邻材料层相对滑移，原本正交的材料线改变夹角，形成剪切变形。', key: '剪应变 γ', geometry: '本示意表现简单剪切，用网格倾斜观察夹角变化。' },
    torsion: { first: '截面相对转动', second: '沿杆长观察扭转', lead: '两截面绕杆轴转过不同角度，角度之差就是相对扭转角。', key: '相对扭转角 φ', geometry: '各截面绕轴线转动，沿杆长的材料线随之扭曲。' },
    bending: { first: '轴线逐渐弯曲', second: '两侧伸缩有别', lead: '弯矩使轴线变弯，截面相对转动；一侧材料线伸长，另一侧缩短。', key: '曲率 κ', geometry: '曲率描述轴线弯曲的程度；示意按平截面运动绘制。' },
  }[form];
  return <TheoryLesson context={title} first={content.first} second={content.second} lead={amount === 0 ? '当前演示幅度为零，形体处于初始状态。增加演示幅度，观察这一变形的几何特征。' : content.lead}
    diagram={<FormDiagram form={form} amount={amount} />} caption="几何教学示意 · 幅度不等同于实际应变"
    readings={[{ label: '当前演示幅度', value: number(amount * 100, 0), unit: '%' }, { label: '对应内力', value: symbol, accent: true }]}
    formulas={formTeachingFormula(form,amount,content.key,formula)}
    scope="演示幅度只控制图形，不表示实际载荷或应变。定量分析需给定材料、截面和约束条件。">
    <TheoryRelation title={`观察${content.key}`}><p>{content.geometry}</p></TheoryRelation>
    <TheoryRelation title="从形态理解受力"><p>{explanation}</p></TheoryRelation>
    <TheoryRelation title="对比观察"><p>保持演示幅度，切换左侧的四种基本形式，对比轴线、截面与材料线的变化。</p></TheoryRelation>
  </TheoryLesson>;
}
