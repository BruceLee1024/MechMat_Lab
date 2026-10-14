import { useEffect, useReducer, useRef, useState } from 'react';
import { DEFAULT_STATE, ModuleType, SimulationState } from '../types';
import { updateSimulationState } from '../mechanics/simulationState';
import { ExperimentDocument, ExperimentModule, ExperimentModel, getSimulation, simulationParameters, defaultModel, parseExperiment, isExperimentModule } from './schema';
import { Workspace, emptyWorkspace, historyReducer, initialHistory } from './history';
import { parseWorkspace, WORKSPACE_KEY, writeWorkspace } from './storage';

function restore() {
  try {
    const json = localStorage.getItem(WORKSPACE_KEY);
    return { workspace: json ? parseWorkspace(JSON.parse(json)) : emptyWorkspace(), blocked: false, message: '' };
  } catch {
    return { workspace: emptyWorkspace(), blocked: true, message: '自动恢复数据无法读取，已保留原数据。可导入有效实验，或重新启用自动恢复。' };
  }
}
export function useWorkspace() {
  const [restored] = useState(restore);
  const [history, dispatch] = useReducer(historyReducer, restored.workspace, initialHistory);
  const [blocked, setBlocked] = useState(restored.blocked);
  const [status, setStatus] = useState<'saving' | 'saved' | 'error'>(restored.blocked ? 'error' : 'saved');
  const [message, setMessage] = useState(restored.message);
  const latest = useRef(history.workspace); latest.current = history.workspace;
  const blockedRef = useRef(blocked); blockedRef.current = blocked;

  const persist = (workspace: Workspace) => {
    if (blockedRef.current) return false;
    try { writeWorkspace(localStorage, workspace); setStatus('saved'); setMessage(''); return true; }
    catch (error) { setStatus('error'); setMessage(`保存失败：${error instanceof Error ? error.message : '存储不可用或空间不足'}。当前实验保留在页面中，可导出 JSON 备份。`); return false; }
  };
  useEffect(() => {
    if (blocked) return;
    setStatus('saving');
    const timer = window.setTimeout(() => persist(latest.current), 350);
    return () => window.clearTimeout(timer);
  }, [history.workspace, blocked]);
  useEffect(() => {
    const flush = () => {
      if (!blockedRef.current) { try { writeWorkspace(localStorage, latest.current); } catch { /* 页面离开时保留已有存档，不让异常中断导航。 */ } }
    };
    const hide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', hide); };
  }, []);
  const editModel = (module: ExperimentModule, model: ExperimentModel) => dispatch({ type: 'edit', module, model });
  const editSimulation = (module: ExperimentModule, changes: Partial<SimulationState>) => {
    const document = latest.current.documents[module];
    if (document.model.kind !== 'simulation' || module === 'solver' || module === 'section') return;
    const previous = getSimulation(document), next = updateSimulationState(previous, changes);
    if (next !== previous) editModel(module, { kind: 'simulation', parameters: simulationParameters(module, next) });
  };
  const save = (module: ExperimentModule, name: string, asNew = false) => {
    try {
      const current = latest.current, original = current.documents[module], now = new Date().toISOString();
      const document = parseExperiment({ ...original, name: name.trim(), ...(asNew ? { id: crypto.randomUUID(), createdAt: now } : {}), updatedAt: now });
      if (current.library.length >= 50 && !current.library.some(item => item.id === document.id)) throw new Error('最多保留 50 个存档，请先删除不需要的存档');
      const library = [...current.library.filter(item => item.id !== document.id), structuredClone(document)];
      const workspace = { ...current, library, documents: { ...current.documents, [module]: document } };
      if (persist(workspace)) { dispatch({ type: 'library', workspace }); return true; }
    } catch (error) { setMessage(error instanceof Error ? error.message : '存档失败'); }
    return false;
  };
  const remove = (id: string) => {
    const workspace = { ...latest.current, library: latest.current.library.filter(item => item.id !== id) };
    if (persist(workspace)) dispatch({ type: 'library', workspace });
  };
  const load = (document: ExperimentDocument) => { dispatch({ type: 'replace', document: parseExperiment(document) }); dispatch({ type: 'navigate', module: document.module }); };
  const reset = (module: ExperimentModule) => editModel(module, defaultModel(module));
  const retryStorage = () => {
    try { writeWorkspace(localStorage, latest.current); setBlocked(false); setStatus('saved'); setMessage(''); }
    catch { setStatus('error'); setMessage('存储仍不可用或空间不足，请导出 JSON 备份'); }
  };
  const module = history.workspace.activeModule;
  const current = isExperimentModule(module) ? history.workspace.documents[module] : null;
  return { workspace: history.workspace, current, status, message, blocked, setMessage, editModel, editSimulation, save, remove, load, reset, retryStorage,
    navigate: (module: ModuleType) => dispatch({ type: 'navigate', module }),
    begin: (module: ExperimentModule) => dispatch({ type: 'begin', module }), end: (module: ExperimentModule) => dispatch({ type: 'end', module }),
    undo: () => { if (current) dispatch({ type: 'undo', module: current.module }); }, redo: () => { if (current) dispatch({ type: 'redo', module: current.module }); },
    canUndo: current ? !!history.past[current.module]?.length : false, canRedo: current ? !!history.future[current.module]?.length : false,
  };
}
