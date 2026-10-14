import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ExperimentDocument, getSimulation } from './schema';
import { formatNumber, getInputs, getModuleLabel, getResults, InputRow, validateComparison } from './results';
import { renderPagesToPdf } from '../utils/exportPdf';
import { SectionSVG } from '../components/SectionPreview';

const styles = `
.report-page{box-sizing:border-box;width:794px;height:1123px;padding:48px 52px;background:#fff;color:#0f172a;font:14px/1.6 "Microsoft YaHei","Noto Sans CJK SC",sans-serif;position:relative;overflow:hidden;overflow-wrap:anywhere}
.report-page h1{font-size:28px;font-weight:700;line-height:1.35;margin:0 0 12px;color:#334155}.report-page h2{font-size:19px;font-weight:700;margin:24px 0 12px;color:#1d4ed8}.report-page h3{font-weight:600;margin:14px 0 6px}.report-meta{font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:18px}.report-page table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:13px}.report-page td,.report-page th{border:1px solid #e2e8f0;padding:9px 12px;text-align:left;vertical-align:top}.report-page th{background:#f8fafc}.report-page p{margin:6px 0}.report-footer{position:absolute;bottom:30px;left:52px;right:52px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:11px;color:#64748b;display:flex;justify-content:space-between}.report-figure{height:235px;margin:18px 0;border:1px solid #e2e8f0;background:#f8fafc;border-radius:12px}.report-formula{padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;font-family:serif;font-size:17px}.report-warning{color:#92400e}.report-caption{font-size:12px;color:#64748b}
`;
function Figure({ document }: { document: ExperimentDocument }) {
  const s = getSimulation(document), model = document.model;
  if (model.kind === 'section' && model.sectionType !== 'draw') return <div className="report-figure"><SectionSVG type={model.sectionType} params={model.parameters} /></div>;
  if (model.kind === 'solver') {
    const minX = Math.min(0, ...model.nodes.map(n => n.x)), maxX = Math.max(1, ...model.nodes.map(n => n.x));
    const minY = Math.min(0, ...model.nodes.map(n => n.y)), maxY = Math.max(1, ...model.nodes.map(n => n.y));
    const x = (v: number) => 60 + (v - minX) / (maxX - minX) * 570, y = (v: number) => 35 + (v - minY) / (maxY - minY) * 160;
    const supports = { fixed: '固定', pinned: '铰支', roller: '滚动', none: '自由' };
    return <svg className="report-figure" width="100%" viewBox="0 0 690 235">{model.elements.map(e => { const a = model.nodes.find(n => n.id === e.nodeStart), b = model.nodes.find(n => n.id === e.nodeEnd); return a && b ? <line key={e.id} x1={x(a.x)} y1={y(a.y)} x2={x(b.x)} y2={y(b.y)} stroke="#61A2DA" strokeWidth={5} /> : null; })}{model.nodes.map(n => <g key={n.id}><circle cx={x(n.x)} cy={y(n.y)} r={6} fill="#D77186" /><text x={x(n.x) + 9} y={y(n.y) - 9} fontSize={12}>{n.id} · {supports[n.support]}</text></g>)}<text x={60} y={222} fontSize={12}>结构几何示意；各荷载及方向详见参数表。</text></svg>;
  }
  if (model.kind === 'section' && model.sectionType === 'draw' && model.paths.some(p => p.vertices.length)) {
    const vertices = model.paths.flatMap(p => p.vertices), minX = Math.min(...vertices.map(v => v.x)), maxX = Math.max(...vertices.map(v => v.x)), minY = Math.min(...vertices.map(v => v.y)), maxY = Math.max(...vertices.map(v => v.y));
    const scale = Math.min(490 / Math.max(1, maxX - minX), 170 / Math.max(1, maxY - minY));
    const x = (v: number) => 345 + (v - (minX + maxX) / 2) * scale, y = (v: number) => 117 - (v - (minY + maxY) / 2) * scale;
    return <svg className="report-figure" width="100%" viewBox="0 0 690 235">{[...model.paths].sort((a, b) => Number(a.isHole) - Number(b.isHole)).filter(p => p.isClosed).map(p => <polygon key={p.id} points={p.vertices.map(v => `${x(v.x)},${y(v.y)}`).join(' ')} fill={p.isHole ? '#fff' : '#dbeafe'} stroke="#61A2DA" strokeWidth={2} />)}</svg>;
  }
  if (document.module === 'buckling') return <svg className="report-figure" width="100%" viewBox="0 0 690 235"><line x1={345} y1={45} x2={345} y2={190} stroke="#61A2DA" strokeWidth={10} /><circle cx={345} cy={45} r={5} fill="#fff" stroke="#475569" /><circle cx={345} cy={190} r={5} fill="#fff" stroke="#475569" /><path d="M345 195 L330 215 L360 215 Z" fill="#cbd5e1" /><line x1={345} y1={8} x2={345} y2={32} stroke="#D77186" strokeWidth={3} /><path d="M339 26 L345 36 L351 26" fill="#D77186" /><text x={380} y={70}>P={s.buckleLoad} N</text><text x={380} y={110}>L={s.buckleLength} m</text><text x={380} y={150}>两端铰支，μ=1</text><path d="M350 45 L365 32 L365 58 Z" fill="#cbd5e1" /></svg>;
  if (document.module === 'stress') return <svg className="report-figure" width="100%" viewBox="0 0 690 235"><rect x={265} y={60} width={130} height={130} fill="#dbeafe" stroke="#61A2DA" strokeWidth={3} /><text x={415} y={115}>σx={s.stressSigX} MPa</text><text x={250} y={35}>σy={s.stressSigY} MPa</text><text x={60} y={130}>τxy={s.stressTauXY} MPa</text><text x={245} y={222}>平面应力；旋转角 {s.stressAngle}°</text></svg>;
  if (document.module === 'section') return <svg className="report-figure" width="100%" viewBox="0 0 690 235"><text x={210} y={120}>尚未保存有效闭合轮廓</text></svg>;
  if (document.module === 'fundamentals') return <svg className="report-figure" width="100%" viewBox="0 0 690 235"><path d="M150 30 V190 H565" fill="none" stroke="#64748b" strokeWidth={2} /><path d="M150 190 L410 50" fill="none" stroke="#61A2DA" strokeWidth={4} /><text x={122} y={28}>σ</text><text x={570} y={195}>ε</text><text x={300} y={140}>线弹性范围：σ=Eε</text><text x={235} y={220}>E={s.bendModulus} GPa；ν={s.poissonRatio}（概念示意）</text></svg>;
  if (document.module === 'combined') return <svg className="report-figure" width="100%" viewBox="0 0 690 235"><rect x={100} y={60} width={490} height={50} fill="#dbeafe" stroke="#61A2DA" /><line x1={90} y1={45} x2={620} y2={45} stroke="#D77186" strokeWidth={2} /><path d="M610 39 L624 45 L610 51" fill="#D77186" /><text x={240} y={30}>F={s.combinedLoad} N；偏心距 e={s.combinedEccentricity} mm</text><rect x={80} y={150} width={20} height={55} fill="#cbd5e1" /><line x1={100} y1={175} x2={590} y2={175} stroke="#61A2DA" strokeWidth={10} /><line x1={100 + s.bendTorqueBendPos / s.bendTorqueLength * 490} y1={135} x2={100 + s.bendTorqueBendPos / s.bendTorqueLength * 490} y2={166} stroke="#D77186" strokeWidth={3} /><text x={220} y={221}>弯扭：P={s.bendTorqueBendLoad} N，T={s.bendTorque} N·m，L={s.bendTorqueLength} m</text></svg>;
  const bending = document.module === 'bending', torsion = document.module === 'torsion';
  const loadX = bending ? 100 + s.bendLoadPos / s.bendLength * 490 : 590;
  return <svg className="report-figure" width="100%" viewBox="0 0 690 235">
    <line x1={100} y1={130} x2={590} y2={130} stroke="#61A2DA" strokeWidth={torsion ? 24 : 12} />
    {bending ? <><path d="M100 136 L84 159 L116 159 Z M590 136 L574 159 L606 159 Z" fill="#cbd5e1" /><line x1={loadX} y1={45} x2={loadX} y2={112} stroke="#D77186" strokeWidth={3} /><path d={`M${loadX - 6} 103 L${loadX} 116 L${loadX + 6} 103`} fill="#D77186" /><text x={loadX - 20} y={35} fontSize={15}>{s.bendLoad} N</text><text x={270} y={200} fontSize={15}>L={s.bendLength} m；a={s.bendLoadPos} m</text></> : torsion ? <>{[100, 345, 590].map((x, i) => <g key={x}><circle cx={x} cy={130} r={25} fill="none" stroke="#D77186" strokeWidth={2} /><text x={x} y={75} textAnchor="middle" fontSize={13}>{i === 0 ? `输入 ${s.torqTorque}` : `输出 ${formatNumber(s.torqTorque * (i === 1 ? s.torqLoadRatio : 1 - s.torqLoadRatio))}`} N·m</text></g>)}<text x={220} y={200} fontSize={15}>两个等长段；L={s.torqLength} m；r={s.torqRadius} mm</text></> : <><path d="M100 130 H55 M65 124 L53 130 L65 136 M590 130 H635 M625 124 L637 130 L625 136" fill="none" stroke="#D77186" strokeWidth={3} /><text x={215} y={70} fontSize={15}>轴向力 F={s.axialForce} N；A={s.axialArea} mm²</text><text x={270} y={200} fontSize={15}>原长 L={s.axialLength} m</text></>}
  </svg>;
}
function parameterPages(rows: InputRow[]): InputRow[][] {
  const pages: InputRow[][] = []; let page: InputRow[] = [], lines = 0;
  for (const row of rows) {
    const needed = Math.max(Math.ceil(row.label.length / 17), Math.ceil(String(row.value).length / 38)) + 1;
    if (page.length && lines + needed > 28) { pages.push(page); page = []; lines = 0; }
    page.push(row); lines += needed;
  }
  if (page.length) pages.push(page); return pages.length ? pages : [[]];
}
function Report({ snapshot, comparisons }: { snapshot: ExperimentDocument; comparisons: ExperimentDocument[] }) {
  const result = getResults(snapshot), parameters = parameterPages(getInputs(snapshot));
  const pages: React.ReactNode[] = [<React.Fragment key="summary"><h2>结果摘要</h2>{result.valid ? <table><thead><tr><th>指标</th><th>计算值</th><th>单位</th></tr></thead><tbody>{result.metrics.map(m => <tr key={m.label}><td>{m.label}</td><td>{formatNumber(m.value)}</td><td>{m.unit || '无量纲'}</td></tr>)}</tbody></table> : <p className="report-warning">{result.diagnostics.join('；')}</p>}<Figure document={snapshot} /><p className="report-caption">图示依据导出时的参数绘制，用于说明模型，变形比例不代表真实位移。</p><h3>计算假设与适用范围</h3>{result.assumptions.map(a => <p key={a}>{a}</p>)}{result.warnings.map(w => <p key={w} className="report-warning">{w}</p>)}</React.Fragment>];
  parameters.forEach((rows, i) => pages.push(<React.Fragment key={`inputs-${i}`}><h2>实验参数 {parameters.length > 1 ? `${i + 1}/${parameters.length}` : ''}</h2><table><thead><tr><th style={{ width: '32%' }}>参数</th><th style={{ width: '53%' }}>值</th><th style={{ width: '15%' }}>单位</th></tr></thead><tbody>{rows.map((row, j) => <tr key={j}><td>{row.label}</td><td>{typeof row.value === 'number' ? formatNumber(row.value) : row.value}</td><td>{row.unit || '—'}</td></tr>)}</tbody></table></React.Fragment>));
  pages.push(<React.Fragment key="formulas"><h2>公式与复现说明</h2>{result.formulas.map(f => <div className="report-formula" key={f}>{f}</div>)}<p>公式使用 N、mm、MPa、N·mm 的一致单位；输入和显示在边界换算。1 N·mm＝1 mJ。</p><p>该记录不包含 API Key、激活信息或 AI 回复。使用同批导出的实验 JSON 可重新计算与核对数值。</p><p>计算结果应结合模型假设使用，教学示意不代表材料实测曲线。</p></React.Fragment>);
  if (comparisons.length > 1) {
    validateComparison(comparisons);
    pages.push(<React.Fragment key="comparison"><h2>工况对比</h2><p>参考工况：{comparisons[0].name}。详细输入及变化量见同批 CSV。</p><table><thead><tr><th>指标</th>{comparisons.map((d, i) => <th key={i}>{d.name}</th>)}</tr></thead><tbody>{getResults(comparisons[0]).metrics.map(m => <tr key={m.label}><td>{m.label}<br />{m.unit}</td>{comparisons.map((d, i) => <td key={i}>{formatNumber(getResults(d).metrics.find(v => v.label === m.label)?.value ?? NaN)}</td>)}</tr>)}</tbody></table></React.Fragment>);
  }
  const exportedAt = new Date().toISOString();
  return <><style>{styles}</style>{pages.map((body, i) => <section className="report-page" key={i}><div className="report-body"><h1>{snapshot.name}</h1><div className="report-meta">材料力学可视化实验室 · {getModuleLabel(snapshot.module)} · 计算版本 {snapshot.calculationVersion} / 文件版本 {snapshot.schemaVersion}<br />实验更新：{snapshot.updatedAt}　导出：{exportedAt}</div>{body}</div><footer className="report-footer"><span>实验 ID：{snapshot.id}</span><span>{i + 1} / {pages.length}</span></footer></section>)}</>;
}
export async function createExperimentPDF(document: ExperimentDocument, comparisons: ExperimentDocument[] = []): Promise<Blob> {
  const snapshot = structuredClone(document), fixedComparisons = structuredClone(comparisons);
  const host = window.document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;'; window.document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(<Report snapshot={snapshot} comparisons={fixedComparisons} />));
    await window.document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return await renderPagesToPdf(Array.from(host.querySelectorAll<HTMLElement>('.report-page')));
  } finally { root.unmount(); host.remove(); }
}
