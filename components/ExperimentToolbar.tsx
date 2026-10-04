import React, { useEffect, useRef, useState } from 'react';
import { Save, FolderOpen, Undo2, Redo2, RotateCcw, Maximize2, X, Copy, GitCompareArrows, Download } from 'lucide-react';
import type { useWorkspace } from '../experiments/useWorkspace';
import { ExperimentDocument, parseExperimentJSON } from '../experiments/schema';
import { EXAMPLES, loadExample } from '../experiments/examples';
import { difference, formatNumber, getInputs, getResults, validateComparison } from '../experiments/results';
import { exportCSV, exportJSON, downloadFile, safeFilename } from '../experiments/export';

type Store = ReturnType<typeof useWorkspace>;
interface Entry { key: string; document: ExperimentDocument }
export function ExperimentToolbar({ store, focus, onFocus }: { store: Store; focus: boolean; onFocus: () => void }) {
  const document = store.current;
  const [name, setName] = useState(document?.name || '');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('archives');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [baseline, setBaseline] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => { setName(document?.name || ''); }, [document?.id, document?.name]);
  useEffect(() => {
    if (!open) return;
    const previousFocus = window.document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key !== 'Tab' || !dialog.current) return;
      const controls = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first || !last) return;
      const active = window.document.activeElement;
      if (event.shiftKey && (active === first || !dialog.current.contains(active))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (active === last || !dialog.current.contains(active))) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => { window.removeEventListener('keydown', keyboard); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [open]);
  if (!document) return null;
  const archive = store.workspace.library.filter(d => d.module === document.module).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const reference = entries.find(e => e.key === baseline) || entries[0];
  const compared = reference ? [reference.document, ...entries.filter(e => e.key !== reference.key).map(e => e.document)] : [document];
  const metrics = reference ? getResults(reference.document).metrics : [];
  const manage = (next = 'archives') => { setTab(next); setOpen(true); setError(''); setNotice(''); };
  const add = (candidate: ExperimentDocument) => {
    try {
      validateComparison([...entries.map(e => e.document), candidate]);
      const key = crypto.randomUUID();
      setEntries([...entries, { key, document: structuredClone(candidate) }]);
      if (!entries.length) setBaseline(key);
      setError(''); setNotice('已加入固定快照；修改当前实验不会改变该工况。');
    } catch (problem) { setError(problem instanceof Error ? problem.message : '无法加入对比'); }
  };
  const exported = async (kind: 'json' | 'csv' | 'pdf') => {
    const snapshot = structuredClone(document), comparison = structuredClone(compared);
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'json') exportJSON(snapshot);
      else if (kind === 'csv') exportCSV(comparison);
      else {
        const { createExperimentPDF } = await import('../experiments/report');
        const blob = await createExperimentPDF(snapshot, entries.length ? comparison : []);
        downloadFile(blob, 'application/pdf', `${safeFilename(snapshot.name)}_实验记录.pdf`);
      }
      setNotice('文件已生成；JSON 可导入复现实验，CSV/PDF 使用导出时的参数快照。');
    } catch (problem) { setError(problem instanceof Error ? problem.message : '导出失败，请重试'); }
    finally { setBusy(false); }
  };
  const imported = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('实验文件超过 2 MB');
      const parsed = parseExperimentJSON(await file.text());
      store.load(parsed); setOpen(false); setError('');
    } catch (problem) { setError(problem instanceof Error ? problem.message : '导入失败，当前实验未改变'); }
  };
  return <>
    <div className="experiment-toolbar" aria-label="实验工具栏">
      <input className="experiment-title" aria-label="实验名称" value={name} onChange={e => setName(e.target.value)} maxLength={120} onKeyDown={e => { if (e.key === 'Enter') store.save(document.module, name); }} />
      <button className="tool-button primary" onClick={() => { if (store.save(document.module, name)) setNotice('实验已存档'); }}><Save size={14} />存档</button>
      <button className="tool-button" onClick={() => manage()}><FolderOpen size={14} />实验管理</button>
      <button className="tool-button" aria-label="撤销实验修改" title="撤销" disabled={!store.canUndo} onClick={store.undo}><Undo2 size={15} /></button>
      <button className="tool-button" aria-label="重做实验修改" title="重做" disabled={!store.canRedo} onClick={store.redo}><Redo2 size={15} /></button>
      <button className="tool-button" aria-label="重置当前实验" title="重置当前实验，可撤销" onClick={() => store.reset(document.module)}><RotateCcw size={15} /></button>
      <button className="tool-button desktop-only" aria-pressed={focus} onClick={onFocus}><Maximize2 size={14} />{focus ? '退出专注' : '专注实验'}</button>
      <button className="tool-button desktop-only" onClick={() => manage('compare')}><GitCompareArrows size={14} />对比</button>
      <button className="tool-button desktop-only" onClick={() => manage('files')}><Download size={14} />导入导出</button>
      <span role="status" className={`save-status ${store.status === 'error' ? 'error' : ''}`}>{store.status === 'saved' ? '已自动保存最近实验' : store.status === 'saving' ? '正在自动保存…' : '自动保存失败'}</span>
    </div>
    <div className="workspace-modal-backdrop" style={{ display: open ? undefined : 'none' }} onPointerDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div ref={dialog} className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-dialog-title">
        <header><h3 id="workspace-dialog-title">实验管理 · {document.name}</h3><button ref={closeButton} className="tool-button" aria-label="关闭实验管理" onClick={() => setOpen(false)}><X size={18} /></button></header>
        <div className="manager-tabs" role="tablist" aria-label="实验管理页面">{[['archives', '我的存档'], ['examples', '例题库'], ['compare', '工况对比'], ['files', '导入导出']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => { setTab(key); setError(''); }}>{label}</button>)}</div>
        <div className="workspace-modal-body">
          {error ? <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p> : null}
          {notice ? <p role="status" className="mb-4 text-sm text-emerald-700">{notice}</p> : null}
          <div hidden={tab !== 'archives'}>
            <p className="text-sm text-slate-500 mb-4">当前修改会自动恢复。命名存档固定保存工况，更新时点击“存档”。每个模块保留自己的材料和参数。</p>
            <button className="tool-button mb-4" onClick={() => { if (store.save(document.module, name, true)) setNotice('已另存为独立实验'); }}><Copy size={14} />另存为</button>
            {archive.length ? archive.map(item => <div className="archive-card" key={item.id}><div><h4>{item.name}</h4><p>{new Date(item.updatedAt).toLocaleString('zh-CN')} · 计算版本 {item.calculationVersion}</p></div><div className="actions"><button className="tool-button" onClick={() => { store.load(item); setOpen(false); }}>打开存档</button><button className="tool-button" onClick={() => { add(item); setTab('compare'); }}>加入对比</button><button className="tool-button" aria-label={`删除存档 ${item.name}`} onClick={() => store.remove(item.id)}>删除</button></div></div>) : <p className="text-sm text-slate-500">该模块还没有命名存档，修改参数后点击“存档”保存第一个工况。</p>}
          </div>
          <div hidden={tab !== 'examples'}>
            <p className="text-sm text-slate-500 mb-4">加载可复现参数并重新计算；可撤销恢复加载前的实验。</p>
            {EXAMPLES.filter(example => example.module === document.module).map(example => <div className="archive-card" key={example.name}><div><h4>{example.name}</h4><p>{example.description}</p></div><div className="actions"><button className="tool-button primary" onClick={() => { store.load(loadExample(example)); setOpen(false); }}>加载例题</button></div></div>)}
            {!EXAMPLES.some(e => e.module === document.module) ? <p className="text-sm text-slate-500">首批例题覆盖拉伸、弯曲、扭转和压杆；该模块可使用已有模板或自行创建实验。</p> : null}
          </div>
          <div hidden={tab !== 'compare'}>
            <div className="flex flex-wrap gap-2 mb-4"><button className="tool-button primary" disabled={entries.length >= 4} onClick={() => add(document)}>加入当前工况 ({entries.length}/4)</button><button className="tool-button" onClick={() => { setEntries([]); setBaseline(''); }}>清空对比</button><button className="tool-button" disabled={!entries.length || busy} onClick={() => exported('csv')}>导出对比 CSV</button></div>
            <p className="text-sm text-slate-500 mb-4">只比较同模块、同计算版本。参考值为 0 时，相对变化显示“不适用”。对比使用固定快照，不改变当前实验或原存档。</p>
            {entries.length ? <>
              <div className="comparison-scroll"><table className="comparison-table"><caption className="sr-only">工况关键输入与计算结果</caption><thead><tr><th>指标 / 单位</th>{entries.map(entry => <th key={entry.key}><div>{entry.document.name}</div><button className="tool-button mt-2" onClick={() => setBaseline(entry.key)}>{entry.key === reference?.key ? '参考工况' : '设为参考'}</button><button className="tool-button mt-2" aria-label={`移除对比 ${entry.document.name}`} onClick={() => setEntries(entries.filter(e => e.key !== entry.key))}>移除</button></th>)}</tr></thead><tbody>
                <tr><th>关键输入</th>{entries.map(entry => <td key={entry.key}>{getInputs(entry.document).filter(row => typeof row.value === 'number' || !row.label.includes('参考')).map(row => <small key={row.label}>{row.label}：{typeof row.value === 'number' ? formatNumber(row.value) : row.value} {row.unit}</small>)}</td>)}</tr>
                {metrics.map(row => <tr key={row.label}><th>{row.label}<small>{row.unit || '无量纲'}</small></th>{entries.map(entry => { const value = getResults(entry.document).metrics.find(m => m.label === row.label && m.unit === row.unit); const delta = value ? difference(value.value, row.value) : null; return <td key={entry.key}>{value ? formatNumber(value.value) : '不适用'}{delta ? <small>Δ {formatNumber(delta.absolute)} {row.unit}<br />相对 {delta.relative === null ? '不适用' : `${formatNumber(delta.relative)}%`}</small> : null}</td>; })}</tr>)}
              </tbody></table></div>
              {entries.flatMap(entry => getResults(entry.document).warnings.map(w => <p className="text-xs text-amber-700 mt-3" key={`${entry.key}-${w}`}>{entry.document.name}：{w}</p>))}
            </> : <p className="text-sm text-slate-500">先加入参考工况，再调整参数，返回这里加入新的工况进行比较。</p>}
          </div>
          <div hidden={tab !== 'files'}>
            <p className="text-sm text-slate-500 mb-4">JSON 保存可复现参数；CSV 包含输入、结果、单位和变化量；中文 PDF 包含参数、公式、图示、结果及模型说明。已加入的对比工况会纳入 CSV/PDF。</p>
            <div className="flex flex-wrap gap-2 mb-6"><button className="tool-button" disabled={busy} onClick={() => exported('json')}>导出实验 JSON</button><button className="tool-button" disabled={busy} onClick={() => exported('csv')}>导出工况 CSV</button><button className="tool-button primary" disabled={busy} onClick={() => exported('pdf')}>{busy ? '正在生成…' : '导出实验 PDF'}</button></div>
            <label className="block text-sm font-medium mb-2" htmlFor="experiment-import">导入实验 JSON（最大 2 MB）</label><input id="experiment-import" type="file" accept=".json,application/json" className="text-sm max-w-full" onChange={event => { imported(event.target.files?.[0]); event.target.value = ''; }} />
            <p className="text-xs text-slate-500 mt-3">先校验版本、数值、单位和引用关系。导入失败保留当前实验；导入成功后可撤销。文件不包含 API Key 或激活信息。</p>
          </div>
        </div>
      </div>
    </div>
  </>;
}
