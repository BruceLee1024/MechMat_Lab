import { DEFAULT_STATE, ModuleType, SimulationState, THEORY_INFO, SectionProperties } from '../types';
import { validateSection, SECTION_FIELDS } from '../mechanics/sections';
import { getCalculationContext } from '../mechanics/aiContext';
import { updateSimulationState } from '../mechanics/simulationState';
import { SECTION_TOOL_CONFIGS, SectionToolType, PolygonPath } from '../mechanics/sectionTool';
import { SolverNode, SolverElement, SolverLoad } from '../solver/SolverTypes';

export const EXPERIMENT_MODULES = ['fundamentals', 'axial', 'bending', 'torsion', 'buckling', 'stress', 'combined', 'solver', 'section'] as const;
export type ExperimentModule = typeof EXPERIMENT_MODULES[number];
export type SimulationModule = Exclude<ExperimentModule, 'solver' | 'section'>;
export const MODULE_FIELDS: Record<SimulationModule, readonly (keyof SimulationState)[]> = {
  fundamentals: ['materialName', 'materialYield', 'poissonRatio', 'axialForce', 'axialArea', 'axialLength', 'bendModulus'],
  axial: ['materialName', 'materialYield', 'poissonRatio', 'axialForce', 'axialArea', 'axialLength', 'axialObliqueAngle', 'bendModulus'],
  bending: ['materialName', 'materialYield', 'poissonRatio', 'bendLoad', 'bendLength', 'bendLoadPos', 'bendModulus', 'bendWidth', 'bendHeight', 'bendSection'],
  torsion: ['materialName', 'materialYield', 'poissonRatio', 'torqTorque', 'torqRadius', 'torqLength', 'torqModulus', 'torqLoadRatio'],
  buckling: ['materialName', 'materialYield', 'poissonRatio', 'buckleLoad', 'buckleLength', 'buckleModulus', 'buckleWidth', 'buckleHeight', 'buckleSection'],
  stress: ['stressSigX', 'stressSigY', 'stressSigZ', 'stressTauXY', 'stressTauYZ', 'stressTauZX', 'stressAngle'],
  combined: ['materialName', 'materialYield', 'poissonRatio', 'combinedLoad', 'combinedEccentricity', 'combinedWidth', 'combinedHeight', 'combinedLength', 'combinedSection', 'bendTorque', 'bendTorqueLength', 'bendTorqueSection', 'bendTorqueBendLoad', 'bendTorqueBendPos', 'bendTorqueModulus'],
};

export interface SimulationModel { kind: 'simulation'; parameters: Partial<SimulationState> }
export interface SolverModel { kind: 'solver'; coordinateUnit: 'mm'; nodes: SolverNode[]; elements: SolverElement[]; loads: SolverLoad[] }
export interface SectionModel { kind: 'section'; coordinateUnit: 'mm'; sectionType: SectionToolType; parameters: Record<string, number>; paths: PolygonPath[]; displayUnit: 'mm' | 'cm' | 'm' }
export type ExperimentModel = SimulationModel | SolverModel | SectionModel;
export interface ExperimentDocument {
  format: 'mechmat-experiment'; schemaVersion: 1; calculationVersion: 1;
  id: string; name: string; module: ExperimentModule; createdAt: string; updatedAt: string;
  model: ExperimentModel;
}

export function isExperimentModule(module: ModuleType | string): module is ExperimentModule {
  return (EXPERIMENT_MODULES as readonly string[]).includes(module);
}
export function simulationParameters(module: SimulationModule, state: SimulationState): Partial<SimulationState> {
  return Object.fromEntries(MODULE_FIELDS[module].map(key => [key, state[key]]));
}
export function getSimulation(document: ExperimentDocument): SimulationState {
  return { ...DEFAULT_STATE, ...(document.model.kind === 'simulation' ? document.model.parameters : {}) };
}
export function defaultModel(module: ExperimentModule): ExperimentModel {
  if (module === 'solver') return { kind: 'solver', coordinateUnit: 'mm', nodes: [], elements: [], loads: [] };
  if (module === 'section') return { kind: 'section', coordinateUnit: 'mm', sectionType: 'rectangle', parameters: { b: 100, h: 150 }, paths: [], displayUnit: 'mm' };
  return { kind: 'simulation', parameters: simulationParameters(module, structuredClone(DEFAULT_STATE)) };
}
export function createExperiment(module: ExperimentModule, name = THEORY_INFO[module].title.split(' (')[0], model = defaultModel(module)): ExperimentDocument {
  const now = new Date().toISOString();
  return { format: 'mechmat-experiment', schemaVersion: 1, calculationVersion: 1, id: crypto.randomUUID(), name, module, createdAt: now, updatedAt: now, model: structuredClone(model) };
}

function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  assert(Object.keys(value).every(key => allowed.includes(key)), '文件包含未支持的字段，请使用实验导出的 JSON');
}
function text(value: unknown, maximum = 120): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum; }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function array(value: unknown, maximum = 1000): asserts value is unknown[] { assert(Array.isArray(value) && value.length <= maximum, '模型列表无效或过大'); }
function checkSection(value: unknown) {
  assert(record(value) && typeof value.type === 'string' && Object.hasOwn(SECTION_FIELDS, value.type), '截面类型无效');
  keys(value, ['type', ...Object.values(SECTION_FIELDS).flatMap(fields => fields.map(field => field.key))]);
  assert(Object.entries(value).every(([key, item]) => key === 'type' || finite(item)), '截面尺寸必须是有限数值');
  assert(!validateSection(value as unknown as SectionProperties), '截面几何尺寸无效');
}
function validateModel(module: ExperimentModule, value: unknown): ExperimentModel {
  assert(record(value), '实验模型无效');
  if (module !== 'solver' && module !== 'section') {
    keys(value, ['kind', 'parameters']);
    assert(value.kind === 'simulation' && record(value.parameters), '实验参数结构无效');
    const parameters = value.parameters;
    keys(parameters, MODULE_FIELDS[module]);
    for (const key of MODULE_FIELDS[module]) {
      const item = parameters[key];
      if (key === 'materialName') assert(text(item), '材料名称无效');
      else if (key.endsWith('Section')) checkSection(item);
      else assert(finite(item), `${key} 必须是有限数值`);
    }
    const candidate = { ...DEFAULT_STATE, ...parameters } as SimulationState;
    const checked = updateSimulationState(DEFAULT_STATE, parameters as Partial<SimulationState>);
    assert(checked !== DEFAULT_STATE && JSON.stringify(simulationParameters(module, checked)) === JSON.stringify(simulationParameters(module, candidate)), '实验参数超出范围或载荷位置越界');
    if (['axialForce', 'bendLoad', 'torqTorque', 'combinedLoad', 'bendTorque', 'bendTorqueBendLoad'].some(key => finite(parameters[key]) && (parameters[key] as number) < 0)) throw new Error('载荷大小不能为负数');
    const context = getCalculationContext(module, candidate);
    assert(!context?.includes('当前本地计算无效'), '参数量级超出可计算范围');
    return { kind: 'simulation', parameters: simulationParameters(module, candidate) };
  }
  if (module === 'section') {
    keys(value, ['kind', 'coordinateUnit', 'sectionType', 'parameters', 'paths', 'displayUnit']);
    assert(value.kind === 'section' && value.coordinateUnit === 'mm' && typeof value.sectionType === 'string' && Object.hasOwn(SECTION_TOOL_CONFIGS, value.sectionType), '截面模型或坐标单位无效');
    assert(['mm', 'cm', 'm'].includes(String(value.displayUnit)) && record(value.parameters), '截面参数或显示单位无效');
    const config = SECTION_TOOL_CONFIGS[value.sectionType as SectionToolType];
    keys(value.parameters, config.params.map(p => p.key));
    config.params.forEach(p => assert(finite((value.parameters as Record<string, unknown>)[p.key]) && ((value.parameters as Record<string, number>)[p.key]) >= p.min, '截面参数超出范围'));
    const dimensions = value.parameters as Record<string, number>;
    if (value.sectionType === 'hollow-circle') assert(dimensions.D > dimensions.d, '外径必须大于内径');
    if (value.sectionType === 'hollow-rectangle') assert(2 * dimensions.t < Math.min(dimensions.B, dimensions.H), '壁厚必须小于宽高的一半');
    if (['i-beam', 'channel', 'double-channel'].includes(String(value.sectionType))) assert(dimensions.H > 2 * dimensions.tf && dimensions.B > dimensions.tw, '翼缘或腹板尺寸超出截面范围');
    if (value.sectionType === 't-beam') assert(dimensions.B > dimensions.tw, '腹板厚度必须小于翼缘宽度');
    if (value.sectionType === 'angle') assert(dimensions.L > dimensions.t, '厚度必须小于边长');
    if (value.sectionType === 'unequal-angle') assert(Math.min(dimensions.B, dimensions.b) > dimensions.t, '厚度必须小于两边长度');
    if (value.sectionType !== 'draw') {
      const result = config.calculate(value.parameters as Record<string, number>);
      assert(Object.values(result).every(Number.isFinite) && result.A > 0 && result.Ix > 0 && result.Iy > 0, '截面几何尺寸无效');
    }
    array(value.paths, 100);
    const ids = new Set<string>();
    for (const path of value.paths) {
      assert(record(path), '截面轮廓无效'); keys(path, ['id', 'vertices', 'isHole', 'isClosed']);
      assert(text(path.id) && !ids.has(path.id) && typeof path.isHole === 'boolean' && typeof path.isClosed === 'boolean', '截面轮廓标识或状态无效'); ids.add(path.id);
      array(path.vertices, 1000);
      assert(!path.isClosed || path.vertices.length >= 3, '闭合轮廓至少需要三个顶点');
      for (const vertex of path.vertices) { assert(record(vertex), '顶点无效'); keys(vertex, ['x', 'y']); assert(finite(vertex.x) && finite(vertex.y), '顶点坐标无效'); }
    }
    return structuredClone(value) as unknown as SectionModel;
  }
  keys(value, ['kind', 'coordinateUnit', 'nodes', 'elements', 'loads']);
  assert(value.kind === 'solver' && value.coordinateUnit === 'mm', '求解器模型或坐标单位无效');
  array(value.nodes); array(value.elements); array(value.loads);
  const nodeIds = new Set<string>(), elementIds = new Set<string>(), loadIds = new Set<string>();
  for (const node of value.nodes) {
    assert(record(node), '节点无效'); keys(node, ['id', 'x', 'y', 'support', 'fixedDOF']);
    assert(text(node.id) && !nodeIds.has(node.id) && finite(node.x) && finite(node.y) && ['fixed', 'pinned', 'roller', 'none'].includes(String(node.support)) && record(node.fixedDOF), '节点坐标、标识或支座无效');
    keys(node.fixedDOF, ['dx', 'dy', 'rz']); assert(['dx', 'dy', 'rz'].every(key => typeof (node.fixedDOF as Record<string, unknown>)[key] === 'boolean'), '节点约束无效'); nodeIds.add(node.id);
  }
  for (const element of value.elements) {
    assert(record(element), '单元无效'); keys(element, ['id', 'type', 'nodeStart', 'nodeEnd', 'section', 'material']);
    assert(text(element.id) && !elementIds.has(element.id) && ['beam', 'truss'].includes(String(element.type)) && nodeIds.has(String(element.nodeStart)) && nodeIds.has(String(element.nodeEnd)) && element.nodeStart !== element.nodeEnd && record(element.section) && record(element.material), '单元标识或节点引用无效');
    keys(element.section, ['A', 'I', 'width', 'height']); keys(element.material, ['E', 'G', 'yield']);
    assert(['A', 'width', 'height'].every(key => finite((element.section as Record<string, unknown>)[key]) && (element.section as Record<string, number>)[key] > 0) && finite(element.section.I) && (element.type === 'beam' ? element.section.I > 0 : element.section.I >= 0), '单元截面无效');
    assert(['E', 'G', 'yield'].every(key => finite((element.material as Record<string, unknown>)[key]) && (element.material as Record<string, number>)[key] > 0), '单元材料无效'); elementIds.add(element.id);
  }
  for (const load of value.loads) {
    assert(record(load), '荷载无效'); keys(load, ['id', 'type', 'targetType', 'targetId', 'position', 'positionEnd', 'value', 'valueEnd', 'angle']);
    assert(text(load.id) && !loadIds.has(load.id) && ['point', 'distributed', 'triangular', 'moment'].includes(String(load.type)) && ['node', 'element'].includes(String(load.targetType)) && (load.targetType === 'node' ? nodeIds : elementIds).has(String(load.targetId)) && finite(load.value) && finite(load.angle), '荷载标识、引用或数值无效');
    for (const key of ['position', 'positionEnd']) if (load[key] !== undefined) assert(finite(load[key]) && (load[key] as number) >= 0 && (load[key] as number) <= 1, '荷载位置越界');
    if (load.valueEnd !== undefined) assert(finite(load.valueEnd), '终点荷载无效'); loadIds.add(load.id);
  }
  return structuredClone(value) as unknown as SolverModel;
}

export function parseExperiment(value: unknown): ExperimentDocument {
  assert(record(value), '不是有效的实验文件');
  // 唯一旧版格式：版本 0 的单模块完整 SimulationState；迁移时只保留该模块字段。
  if (value.schemaVersion === 0) {
    keys(value, ['format', 'schemaVersion', 'module', 'name', 'state']);
    assert(value.format === 'mechmat-experiment' && isExperimentModule(String(value.module)) && !['solver', 'section'].includes(String(value.module)) && record(value.state), '旧版实验格式无效');
    const module = value.module as SimulationModule;
    const model = validateModel(module, { kind: 'simulation', parameters: simulationParameters(module, { ...DEFAULT_STATE, ...value.state } as SimulationState) });
    return createExperiment(module, text(value.name) ? value.name : undefined, model);
  }
  assert(value.format === 'mechmat-experiment' && value.schemaVersion === 1, '实验版本不受支持，请保留原文件并使用对应版本的应用');
  keys(value, ['format', 'schemaVersion', 'calculationVersion', 'id', 'name', 'module', 'createdAt', 'updatedAt', 'model']);
  assert(value.calculationVersion === 1 && text(value.id) && text(value.name) && isExperimentModule(String(value.module)), '计算版本、名称或模块无效');
  assert(typeof value.createdAt === 'string' && typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) && Number.isFinite(Date.parse(value.updatedAt)), '实验时间无效');
  const module = value.module as ExperimentModule;
  return { format: 'mechmat-experiment', schemaVersion: 1, calculationVersion: 1, id: value.id, name: value.name.trim(), module, createdAt: value.createdAt, updatedAt: value.updatedAt, model: validateModel(module, value.model) };
}
export function parseExperimentJSON(json: string): ExperimentDocument {
  assert(json.length <= 2 * 1024 * 1024, '实验文件超过 2 MB');
  let value: unknown; try { value = JSON.parse(json); } catch { throw new Error('实验 JSON 损坏，当前实验未改变'); }
  return parseExperiment(value);
}
export function serializeExperiment(document: ExperimentDocument): string { return JSON.stringify(parseExperiment(document), null, 2); }
