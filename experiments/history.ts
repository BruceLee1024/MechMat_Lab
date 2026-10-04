import { ExperimentDocument, ExperimentModule, EXPERIMENT_MODULES, createExperiment, ExperimentModel } from './schema';
import { ModuleType } from '../types';

export interface Workspace {
  format: 'mechmat-workspace'; schemaVersion: 1; activeModule: ModuleType;
  documents: Record<ExperimentModule, ExperimentDocument>; library: ExperimentDocument[];
}
export interface HistoryState {
  workspace: Workspace;
  past: Partial<Record<ExperimentModule, ExperimentDocument[]>>;
  future: Partial<Record<ExperimentModule, ExperimentDocument[]>>;
  groups: Partial<Record<ExperimentModule, ExperimentDocument>>;
}
export function emptyWorkspace(): Workspace {
  return { format: 'mechmat-workspace', schemaVersion: 1, activeModule: 'home', documents: Object.fromEntries(EXPERIMENT_MODULES.map(module => [module, createExperiment(module)])) as Workspace['documents'], library: [] };
}
export function initialHistory(workspace: Workspace): HistoryState { return { workspace, past: {}, future: {}, groups: {} }; }
export type HistoryAction =
  | { type: 'edit'; module: ExperimentModule; model: ExperimentModel }
  | { type: 'replace'; document: ExperimentDocument }
  | { type: 'begin' | 'end' | 'undo' | 'redo'; module: ExperimentModule }
  | { type: 'navigate'; module: ModuleType }
  | { type: 'library'; workspace: Workspace };

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'navigate') return { ...state, workspace: { ...state.workspace, activeModule: action.module } };
  if (action.type === 'library') return { ...state, workspace: action.workspace };
  const module = action.type === 'replace' ? action.document.module : action.module;
  const current = state.workspace.documents[module];
  const past = state.past[module] || [], future = state.future[module] || [];
  const withDocument = (document: ExperimentDocument) => ({ ...state.workspace, documents: { ...state.workspace.documents, [module]: document } });
  if (action.type === 'begin') return state.groups[module] ? state : { ...state, groups: { ...state.groups, [module]: current } };
  if (action.type === 'end') {
    const before = state.groups[module];
    const groups = { ...state.groups }; delete groups[module];
    if (!before || JSON.stringify(before.model) === JSON.stringify(current.model)) return { ...state, groups };
    return { ...state, groups, past: { ...state.past, [module]: [...past, before].slice(-50) }, future: { ...state.future, [module]: [] } };
  }
  if (action.type === 'undo' || action.type === 'redo') {
    if (state.groups[module]) return historyReducer(historyReducer(state, { type: 'end', module }), action);
    const from = action.type === 'undo' ? past : future;
    if (!from.length) return state;
    const restored = { ...from[from.length - 1], updatedAt: new Date().toISOString() };
    return { ...state, workspace: withDocument(restored), past: { ...state.past, [module]: action.type === 'undo' ? past.slice(0, -1) : [...past, current].slice(-50) }, future: { ...state.future, [module]: action.type === 'redo' ? future.slice(0, -1) : [...future, current].slice(-50) } };
  }
  if (action.type !== 'edit' && action.type !== 'replace') return state;
  const next = action.type === 'replace' ? structuredClone(action.document) : { ...current, model: action.model, updatedAt: new Date().toISOString() };
  if (JSON.stringify(current.model) === JSON.stringify(next.model) && current.id === next.id && current.name === next.name) return state;
  return { ...state, workspace: withDocument(next), past: { ...state.past, [module]: state.groups[module] ? past : [...past, current].slice(-50) }, future: { ...state.future, [module]: [] } };
}
