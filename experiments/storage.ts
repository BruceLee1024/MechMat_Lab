import { EXPERIMENT_MODULES, parseExperiment } from './schema';
import { Workspace } from './history';

export const WORKSPACE_KEY = 'mechmat_workspace_v1';
export function parseWorkspace(value: unknown): Workspace {
  if (!value || typeof value !== 'object') throw new Error('自动恢复数据损坏，未覆盖原数据');
  const input = value as Record<string, unknown>;
  if (input.format !== 'mechmat-workspace' || input.schemaVersion !== 1 || !input.documents || typeof input.documents !== 'object' || !Array.isArray(input.library) || input.library.length > 50) throw new Error('自动恢复版本或数据无效，未覆盖原数据');
  const source = input.documents as Record<string, unknown>;
  const documents = Object.fromEntries(EXPERIMENT_MODULES.map(module => {
    const document = parseExperiment(source[module]);
    if (document.module !== module) throw new Error('自动恢复模块不匹配');
    return [module, document];
  })) as Workspace['documents'];
  const library = input.library.map(parseExperiment);
  if (new Set(library.map(item => item.id)).size !== library.length) throw new Error('存档标识重复');
  const allowed = ['home', 'settings', 'formulas', 'resources', ...EXPERIMENT_MODULES];
  const activeModule = allowed.includes(String(input.activeModule)) ? input.activeModule as Workspace['activeModule'] : 'home';
  return { format: 'mechmat-workspace', schemaVersion: 1, activeModule, documents, library };
}
export function writeWorkspace(storage: Pick<Storage, 'setItem'>, workspace: Workspace) {
  // 校验、白名单重建后再写入；失败不替换现有存档。
  storage.setItem(WORKSPACE_KEY, JSON.stringify(parseWorkspace(workspace)));
}
