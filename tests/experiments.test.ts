import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '../types';
import { createExperiment, EXPERIMENT_MODULES, getSimulation, parseExperiment, parseExperimentJSON, serializeExperiment, SolverModel, SectionModel, ExperimentDocument } from '../experiments/schema';
import { emptyWorkspace, historyReducer, initialHistory } from '../experiments/history';
import { parseWorkspace, WORKSPACE_KEY, writeWorkspace } from '../experiments/storage';
import { difference, getInputs, getResults, validateComparison } from '../experiments/results';
import { createCSV, safeFilename } from '../experiments/export';
import { EXAMPLES, loadExample } from '../experiments/examples';
import { SIMPLY_SUPPORTED_BEAM } from '../solver/SolverTypes';

describe('带版本的独立实验文档', () => {
  it.each(EXPERIMENT_MODULES)('%s 的默认文档可完整序列化和恢复', module => {
    const document = createExperiment(module);
    expect(parseExperimentJSON(serializeExperiment(document))).toEqual(document);
  });
  it('修改拉伸材料不会改变弯曲文档或其存档', () => {
    let state = initialHistory(emptyWorkspace());
    const bending = structuredClone(state.workspace.documents.bending);
    const document = state.workspace.documents.axial;
    if (document.model.kind !== 'simulation') throw new Error('模型不匹配');
    state = historyReducer(state, { type: 'edit', module: 'axial', model: { kind: 'simulation', parameters: { ...document.model.parameters, bendModulus: 70 } } });
    expect(getSimulation(state.workspace.documents.axial).bendModulus).toBe(70);
    expect(state.workspace.documents.bending).toEqual(bending);
    expect(state.workspace.documents.axial.model).not.toHaveProperty('torqTorque');
  });
  it('旧版只迁移模块参数，不保存附带的凭据或其它模块参数', () => {
    const migrated = parseExperiment({ format: 'mechmat-experiment', schemaVersion: 0, module: 'bending', name: '旧梁', state: { ...DEFAULT_STATE, apiKey: '不能导出', activated: true } });
    const json = serializeExperiment(migrated);
    expect(json).not.toContain('apiKey'); expect(json).not.toContain('activated'); expect(json).not.toContain('axialForce');
    expect(migrated.schemaVersion).toBe(1);
  });
  it.each(['version', 'secret', 'zero-length', 'outside-load', 'nonfinite'] as const)('拒绝无效文件 %s', problem => {
    const value = structuredClone(createExperiment('bending')) as unknown as Record<string, unknown>;
    if (problem === 'version') value.schemaVersion = 99;
    if (problem === 'secret') value.apiKey = '不能导出';
    const parameters = (value.model as { parameters: Record<string, unknown> }).parameters;
    if (problem === 'zero-length') parameters.bendLength = 0;
    if (problem === 'outside-load') parameters.bendLoadPos = 100;
    if (problem === 'nonfinite') parameters.bendLoad = Infinity;
    expect(() => parseExperiment(value)).toThrow();
  });
  it('求解器保存节点、单元和荷载，结果与视图状态不进入文件', () => {
    const t = SIMPLY_SUPPORTED_BEAM;
    const model: SolverModel = { kind: 'solver', coordinateUnit: 'mm', nodes: structuredClone(t.nodes), elements: structuredClone(t.elements), loads: structuredClone(t.loads) };
    const document = createExperiment('solver', '梁模型', model), roundtrip = parseExperimentJSON(serializeExperiment(document));
    expect(roundtrip.model).toEqual(model); expect(getResults(roundtrip).valid).toBe(true);
    expect(serializeExperiment(document)).not.toMatch(/selectedId|viewScale|result/);
    model.elements[0].nodeEnd = 'missing';
    expect(() => parseExperiment({ ...document, model })).toThrow(/引用/);
  });
  it('绘图保留闭合顶点、内孔标记和单位，重新计算面积', () => {
    const model: SectionModel = { kind: 'section', coordinateUnit: 'mm', displayUnit: 'cm', sectionType: 'draw', parameters: {}, paths: [{ id: 'rect', isHole: false, isClosed: true, vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] }] };
    const restored = parseExperimentJSON(serializeExperiment(createExperiment('section', '绘制矩形', model)));
    expect(restored.model).toEqual(model);
    expect(getResults(restored).metrics[0].value).toBe(10000);
    expect(() => parseExperiment({ ...restored, model: { ...model, coordinateUnit: 'm' } })).toThrow(/单位/);
  });
  it.each([-1, 91])('拒绝超出斜截面角范围的导入：%s°', angle => {
    const document = createExperiment('axial');
    if (document.model.kind !== 'simulation') throw new Error('模型不匹配');
    document.model.parameters.axialObliqueAngle = angle;
    expect(() => parseExperiment(document)).toThrow(/范围/);
  });
  it('拒绝翼缘总厚度超过截面高度的几何，即使计算式仍产生正面积', () => {
    const document = createExperiment('section', '无效工字形', { kind: 'section', coordinateUnit: 'mm', displayUnit: 'mm', sectionType: 'i-beam', parameters: { H: 50, B: 100, tw: 30, tf: 40 }, paths: [] });
    expect(() => parseExperiment(document)).toThrow(/截面范围/);
  });
});

describe('撤销、重做与存储失败', () => {
  const changed = (state: ReturnType<typeof initialHistory>, load: number) => {
    const model = state.workspace.documents.bending.model;
    if (model.kind !== 'simulation') throw new Error('模型不匹配');
    return historyReducer(state, { type: 'edit', module: 'bending', model: { ...model, parameters: { ...model.parameters, bendLoad: load } } });
  };
  it('一次拖动的多个值合并为一步，撤销与重做恢复端点', () => {
    let state = initialHistory(emptyWorkspace());
    state = historyReducer(state, { type: 'begin', module: 'bending' });
    for (const load of [1000, 2000, 3000]) state = changed(state, load);
    state = historyReducer(state, { type: 'end', module: 'bending' });
    expect(state.past.bending?.length).toBe(1);
    state = historyReducer(state, { type: 'undo', module: 'bending' }); expect(getSimulation(state.workspace.documents.bending).bendLoad).toBe(2000);
    state = historyReducer(state, { type: 'redo', module: 'bending' }); expect(getSimulation(state.workspace.documents.bending).bendLoad).toBe(3000);
  });
  it('撤销后新编辑清空重做分支，历史限制为 50 步', () => {
    let state = initialHistory(emptyWorkspace());
    for (let i = 0; i < 60; i++) state = changed(state, i);
    expect(state.past.bending?.length).toBe(50);
    state = historyReducer(state, { type: 'undo', module: 'bending' });
    state = changed(state, 1234); expect(state.future.bending?.length).toBe(0);
  });
  it('重置可撤销，载入文档不修改原存档', () => {
    let state = initialHistory(emptyWorkspace()); state = changed(state, 1000);
    const archived = structuredClone(state.workspace.documents.bending);
    state.workspace.library = [archived];
    state = changed(state, 2000);
    state = historyReducer(state, { type: 'undo', module: 'bending' });
    expect(getSimulation(state.workspace.documents.bending).bendLoad).toBe(1000);
    expect(state.workspace.library[0]).toEqual(archived);
  });
  it('完整工作区可恢复，配额不足或无效数据不覆盖原存储', () => {
    const workspace = emptyWorkspace(), map = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => map.set(key, value) };
    writeWorkspace(storage, workspace);
    const original = map.get(WORKSPACE_KEY)!;
    expect(parseWorkspace(JSON.parse(original))).toEqual(workspace);
    expect(() => writeWorkspace({ setItem: () => { throw new DOMException('空间不足', 'QuotaExceededError'); } }, workspace)).toThrow();
    expect(map.get(WORKSPACE_KEY)).toBe(original);
    const invalid = structuredClone(workspace); invalid.documents.bending.schemaVersion = 99 as 1;
    expect(() => writeWorkspace(storage, invalid)).toThrow(); expect(map.get(WORKSPACE_KEY)).toBe(original);
  });
});

describe('例题、比较与 CSV', () => {
  it('四个例题的结果来自真实参数，满足独立参考值', () => {
    const expected = [['应力', 50], ['载荷点挠度', 0.0125], ['最大切应力', 0.6366197723675814], ['临界压力', 15503.138340149908]] as const;
    EXAMPLES.forEach((example, i) => {
      const document = parseExperiment(loadExample(example)), result = getResults(document);
      expect(result.valid).toBe(true);
      expect(result.metrics.find(m => m.label === expected[i][0])?.value).toBeCloseTo(expected[i][1], 7);
    });
  });
  it('高度加倍对应四分之一应力与八分之一挠度，零基准不输出无穷百分比', () => {
    const base = loadExample(EXAMPLES[1]), next = structuredClone(base);
    if (next.model.kind !== 'simulation') throw new Error('模型不匹配');
    next.model.parameters.bendSection = { type: 'rectangle', width: 100, height: 400 };
    const a = getResults(base).metrics, b = getResults(next).metrics;
    expect(a.find(m => m.label === '最大应力')!.value / b.find(m => m.label === '最大应力')!.value).toBe(4);
    expect(a.find(m => m.label === '载荷点挠度')!.value / b.find(m => m.label === '载荷点挠度')!.value).toBe(8);
    expect(difference(1, 0)).toEqual({ absolute: 1, relative: null });
    expect(difference(0.1875, 0.75).relative).toBe(-75);
  });
  it('不同模块、计算版本和超过四个工况不能混比', () => {
    const a = loadExample(EXAMPLES[0]), b = loadExample(EXAMPLES[1]);
    expect(() => validateComparison([a, b])).toThrow(/同模块/);
    expect(() => validateComparison([a, { ...a, calculationVersion: 2 } as unknown as ExperimentDocument])).toThrow(/版本/);
    expect(() => validateComparison([a, a, a, a, a])).toThrow(/1 至 4/);
  });
  it('CSV 使用 UTF-8、完整单位、转义名称与有限数值，文件名安全', () => {
    const document = loadExample(EXAMPLES[1]); document.name = '=工况,"测试"';
    const csv = createCSV([document]);
    expect(csv.startsWith('\uFEFF')).toBe(true); expect(csv).toContain('相对变化 (%)'); expect(csv).toContain('mm'); expect(csv).toContain('MPa');
    expect(csv).toContain("'=工况,\"\"测试\"\""); expect(csv).not.toMatch(/NaN|Infinity|apiKey/);
    expect(safeFilename('../非法:名称/')).toBe('.._非法_名称_');
  });
  it('报告参数使用实际计算截面和中文名称，省略已失效的参考高度', () => {
    const document = loadExample(EXAMPLES[1]);
    if (document.model.kind !== 'simulation') throw new Error('模型不匹配');
    document.model.parameters.bendSection = { type: 'rectangle', width: 100, height: 400 };
    const inputs = getInputs(document);
    expect(inputs.find(row => row.label === '弯曲截面 · 高度 h')).toEqual({ label: '弯曲截面 · 高度 h', value: 400, unit: 'mm' });
    expect(JSON.stringify(inputs)).not.toMatch(/bendSection|rectangle|参考高度/);
    expect(createCSV([document])).toContain('平面弯曲');
  });
});
