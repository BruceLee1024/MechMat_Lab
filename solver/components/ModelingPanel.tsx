import { SECTION_FIELDS, validateSection } from "../../mechanics/sections";
import React, { useState, useEffect } from "react";
import { Circle, Minus, ArrowDown } from "lucide-react";
import { SolverState, SolverNode, SolverElement, SolverLoad, SupportType, ElementType } from "../SolverTypes";
import { SectionProperties, SectionType, calculateSectionProperties, NumericInput } from "../../components";

const SECTION_TYPES: { type: SectionType; label: string; icon: string }[] = [
  { type: 'rectangle', label: '矩形', icon: '▭' },
  { type: 'circle', label: '圆形', icon: '○' },
  { type: 'hollow_circle', label: '空心圆', icon: '◎' },
  { type: 'i_beam', label: '工字钢', icon: 'Ⅰ' },
  { type: 't_beam', label: 'T型', icon: '⊤' },
  { type: 'channel', label: '槽钢', icon: '⊏' },
  { type: 'custom', label: '自定义', icon: '✎' },
];

export const ModelingPanel = ({
  state,
  onChange,
}: {
  state: SolverState;
  onChange: (s: Partial<SolverState>) => void;
}) => {
  const [activeTool, setActiveTool] = useState<'node' | 'element' | 'load'>('node');
  const [nodeX, setNodeX] = useState(0);
  const [nodeY, setNodeY] = useState(300);
  const [nodeSupport, setNodeSupport] = useState<SupportType>('none');

  const [elemStart, setElemStart] = useState('');
  const [elemEnd, setElemEnd] = useState('');
  const [elemType, setElemType] = useState<ElementType>('beam');
  const [elemSection, setElemSection] = useState<SectionProperties>({ type: 'rectangle', width: 100, height: 100 });
  const [elemE, setElemE] = useState(200000);
  const [elemYield, setElemYield] = useState(250);

  const [loadTarget, setLoadTarget] = useState('');
  const [loadType, setLoadType] = useState<'point' | 'distributed' | 'triangular' | 'moment'>('point');
  const [loadValue, setLoadValue] = useState(10000);
  const [loadValueEnd, setLoadValueEnd] = useState(0);
  const [loadPosition, setLoadPosition] = useState(0.5);

  // 添加节点
  const addNode = () => {
    let sequence = state.nodes.length + 1;
    while (state.nodes.some(item => item.id === `N${sequence}`)) sequence++;
    const id = `N${sequence}`;
    const fixedDOF = {
      fixed: { dx: true, dy: true, rz: true },
      pinned: { dx: true, dy: true, rz: false },
      roller: { dx: false, dy: true, rz: false },
      none: { dx: false, dy: false, rz: false },
    }[nodeSupport];

    onChange({
      nodes: [...state.nodes, {
        id,
        x: nodeX,
        y: nodeY,
        support: nodeSupport,
        fixedDOF,
      }],
    });
    setNodeX(nodeX + 200); // 自动递增X坐标
  };

  // 从 SectionProperties 计算求解器所需的截面参数
  const computeSolverSection = (sp: SectionProperties) => {
    const props = calculateSectionProperties(sp);
    return { A: props.area, I: props.Iz, width: 2 * props.zMax, height: 2 * props.yMax };
  };

  // 添加单元
  const addElement = () => {
    if (!elemStart || !elemEnd) return;
    let sequence = state.elements.length + 1;
    while (state.elements.some(item => item.id === `E${sequence}`)) sequence++;
    const id = `E${sequence}`;
    const sec = elemType === 'truss'
      ? { A: computeSolverSection(elemSection).A, I: 0, width: 0, height: 0 }
      : computeSolverSection(elemSection);

    onChange({
      elements: [...state.elements, {
        id,
        type: elemType,
        nodeStart: elemStart,
        nodeEnd: elemEnd,
        section: sec,
        material: { E: elemE, G: Math.round(elemE / 2.6), yield: elemYield },
      }],
    });
  };

  const sectionProps = calculateSectionProperties(elemSection);

  // 添加荷载
  const addLoad = () => {
    if (!loadTarget) return;
    let sequence = state.loads.length + 1;
    while (state.loads.some(item => item.id === `L${sequence}`)) sequence++;
    const id = `L${sequence}`;
    const isElement = state.elements.some(e => e.id === loadTarget);

    onChange({
      loads: [...state.loads, {
        id,
        type: loadType,
        targetType: isElement ? 'element' : 'node',
        targetId: loadTarget,
        position: loadType === 'point' ? loadPosition : 0,
        positionEnd: loadType === 'distributed' || loadType === 'triangular' ? 1 : undefined,
        value: loadValue,
        valueEnd: loadType === 'triangular' ? loadValueEnd : undefined,
        angle: 90,
      }],
    });
  };

  // 删除选中项
  const deleteSelected = () => {
    if (!state.selectedId) return;
    const removedElements = state.elements.filter(element => element.id === state.selectedId || element.nodeStart === state.selectedId || element.nodeEnd === state.selectedId).map(element => element.id);
    onChange({
      nodes: state.nodes.filter(node => node.id !== state.selectedId),
      elements: state.elements.filter(element => !removedElements.includes(element.id)),
      loads: state.loads.filter(load => load.id !== state.selectedId && load.targetId !== state.selectedId && !removedElements.includes(load.targetId)),
      selectedId: null,
    });
  };

  // 选中项编辑用的截面状态
  const [editSection, setEditSection] = useState<SectionProperties>({ type: 'rectangle', width: 100, height: 100 });

  // 更新选中节点
  const selectedNode = state.nodes.find(n => n.id === state.selectedId);
  const selectedElement = state.elements.find(e => e.id === state.selectedId);
  const selectedLoad = state.loads.find(l => l.id === state.selectedId);

  // 选中单元变化时，同步截面编辑状态
  useEffect(() => {
    if (selectedElement) {
      setEditSection({
        type: 'custom',
        customArea: selectedElement.section.A,
        customIz: selectedElement.section.I > 0 ? selectedElement.section.I : undefined,
      });
    }
  }, [state.selectedId]);

  // 更新选中单元的截面
  const updateSelectedSection = (newSection: SectionProperties) => {
    setEditSection(newSection);
    if (!selectedElement) return;
    const sec = selectedElement.type === 'truss'
      ? { A: computeSolverSection(newSection).A, I: 0, width: 0, height: 0 }
      : computeSolverSection(newSection);
    onChange({ elements: state.elements.map(el =>
      el.id === selectedElement.id ? { ...el, section: sec } : el
    )});
  };

  return (
    <div className="solver-modeling text-xs">
      <div className="solver-segments solver-model-tools" role="group" aria-label="建模对象类型">
        {([['node', Circle, '节点'], ['element', Minus, '单元'], ['load', ArrowDown, '荷载']] as const).map(([tool, Icon, label]) => <button key={tool} aria-pressed={activeTool === tool} onClick={() => setActiveTool(tool)}><Icon size={13}/>{label}</button>)}
      </div>
      {/* 选中项编辑 */}
      {(selectedNode || selectedElement || selectedLoad) && (
        <div className="solver-selection-editor">
          <h4 className="font-semibold text-amber-800 mb-2">编辑选中项</h4>
          {selectedNode && (
            <div className="space-y-2">
              <div className="text-[10px] text-amber-700">节点 {selectedNode.id}</div>
              <div className="space-y-2">
                <NumericInput label="节点 X (mm)" value={selectedNode.x} domain="signed" onChange={value => onChange({nodes:state.nodes.map(node => node.id === selectedNode.id ? {...node,x:value} : node)})}/>
                <NumericInput label="节点 Y (mm)" value={selectedNode.y} domain="signed" onChange={value => onChange({nodes:state.nodes.map(node => node.id === selectedNode.id ? {...node,y:value} : node)})}/>
              </div>
              <select
                aria-label="选中节点支座" value={selectedNode.support}
                onChange={(e) => {
                  const support = e.target.value as SupportType;
                  const fixedDOF = {
                    fixed: { dx: true, dy: true, rz: true },
                    pinned: { dx: true, dy: true, rz: false },
                    roller: { dx: false, dy: true, rz: false },
                    none: { dx: false, dy: false, rz: false },
                  }[support];
                  onChange({
                    nodes: state.nodes.map(n => n.id === selectedNode.id ? { ...n, support, fixedDOF } : n)
                  });
                }}
                className="w-full px-2 py-1 border rounded text-xs"
              >
                <option value="none">无支座</option>
                <option value="pinned">铰支座</option>
                <option value="roller">滚动支座</option>
                <option value="fixed">固定端</option>
              </select>
            </div>
          )}
          {selectedElement && (
            <div className="space-y-2">
              <div className="text-[10px] text-amber-700">单元 {selectedElement.id} ({selectedElement.type === 'beam' ? '梁' : '桁架'})</div>
              {/* 截面类型选择 */}
              <div>
                <label className="text-[10px] text-slate-500">截面类型</label>
                <div className="solver-section-types grid grid-cols-7 gap-1 mt-1">
                  {SECTION_TYPES.map(st => (
                    <button key={st.type} onClick={() => updateSelectedSection({ ...editSection, type: st.type })}
                      className={`p-1 text-center rounded border text-[10px] ${editSection.type === st.type ? 'bg-indigo-100 border-indigo-400 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                      title={st.label} aria-label={st.label} aria-pressed={editSection.type === st.type}
                    >
                      <div className="text-sm leading-none">{st.icon}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* 截面参数 */}
              {SECTION_FIELDS[editSection.type].map(field => <NumericInput key={field.key} label={field.label}
                value={editSection[field.key] ?? field.defaultValue} domain={field.allowZero ? 'nonnegative' : 'positive'}
                validate={value => validateSection({ ...editSection, [field.key]: value })}
                onChange={value => updateSelectedSection({ ...editSection, [field.key]: value })} />)}
              {/* 计算后的截面属性 */}
              <div className="px-2 py-1 bg-white rounded border text-[10px] text-slate-500 font-mono flex gap-3">
                <span>A={Math.round(selectedElement.section.A)}</span>
                <span>Iz={(selectedElement.section.I/1e4).toFixed(1)}×10⁴</span>
              </div>
              {/* 材料 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <NumericInput label="选中单元 E (MPa)" domain="positive"  value={selectedElement.material.E}
                    onChange={(value) => onChange({ elements: state.elements.map(el => el.id === selectedElement.id ? { ...el, material: { ...el.material, E: value } } : el) })} /></div>
                <div><label className="text-[10px] text-slate-500">屈服 (MPa)</label>
                  <input type="number" value={selectedElement.material.yield}
                    onChange={(e) => onChange({ elements: state.elements.map(el => el.id === selectedElement.id ? { ...el, material: { ...el.material, yield: parseFloat(e.target.value) || 250 } } : el) })}
                    className="w-full px-2 py-1 border rounded text-xs" /></div>
              </div>
            </div>
          )}
          {selectedLoad && (
            <div className="space-y-2">
              <div className="text-[10px] text-amber-700">荷载 {selectedLoad.id}</div>
              <NumericInput label="选中荷载大小" domain="signed"

                value={selectedLoad.value}
                onChange={(value) => onChange({
                  loads: state.loads.map(l => l.id === selectedLoad.id ? { ...l, value: value } : l)
                })}
              />
            </div>
          )}
          <button
            onClick={deleteSelected}
            className="w-full mt-2 px-3 py-1 bg-rose-500 text-white rounded text-xs hover:bg-rose-600"
          >
            删除选中
          </button>
        </div>
      )}

      {/* 隐藏而不卸载表单，切换时保留输入草稿。 */}
      <div className="solver-model-form" hidden={activeTool !== 'node'}>
        <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <Circle className="w-3 h-3" /> 添加节点
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>

            <NumericInput label="X (mm)" value={nodeX} onChange={setNodeX} domain="signed" />
          </div>
          <div>

            <NumericInput label="Y (mm)" value={nodeY} onChange={setNodeY} domain="signed" />
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <select
            aria-label="新增节点支座" value={nodeSupport}
            onChange={(e) => setNodeSupport(e.target.value as SupportType)}
            className="flex-1 px-2 py-1 border rounded text-xs"
          >
            <option value="none">无支座</option>
            <option value="pinned">铰支座</option>
            <option value="roller">滚动支座</option>
            <option value="fixed">固定端</option>
          </select>
          <button
            onClick={addNode}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
          >
            添加
          </button>
        </div>
      </div>

      {/* 添加单元 */}
      <div className="solver-model-form" hidden={activeTool !== 'element'}>
        <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <Minus className="w-3 h-3" /> 添加单元
        </h4>
        {/* 节点选择 + 单元类型 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">起点节点</label>
            <select aria-label="起点节点" value={elemStart} onChange={(e) => setElemStart(e.target.value)} className="w-full px-2 py-1 border rounded text-xs">
              <option value="">选择...</option>
              {state.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">终点节点</label>
            <select aria-label="终点节点" value={elemEnd} onChange={(e) => setElemEnd(e.target.value)} className="w-full px-2 py-1 border rounded text-xs">
              <option value="">选择...</option>
              {state.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-2">
          <label className="text-[10px] text-slate-500">单元类型</label>
          <div className="flex gap-1 mt-1">
            {(['beam', 'truss'] as ElementType[]).map(t => (
              <button key={t} onClick={() => setElemType(t)}
                className={`flex-1 px-2 py-1 rounded text-xs border ${elemType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-100 border-slate-200'}`}
              >{t === 'beam' ? '梁' : '桁架'}</button>
            ))}
          </div>
        </div>
        {/* 截面类型选择 */}
        <div className="mb-2">
          <label className="text-[10px] text-slate-500">截面类型</label>
          <div className="solver-section-types grid grid-cols-7 gap-1 mt-1">
            {SECTION_TYPES.map(st => (
              <button key={st.type} onClick={() => setElemSection({ ...elemSection, type: st.type })}
                className={`p-1 text-center rounded border text-[10px] ${elemSection.type === st.type ? 'bg-indigo-100 border-indigo-400 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                title={st.label} aria-label={st.label} aria-pressed={elemSection.type === st.type}
              >
                <div className="text-sm leading-none">{st.icon}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 mb-2">
          {SECTION_FIELDS[elemSection.type].map(field => <NumericInput key={field.key} label={field.label}
            value={elemSection[field.key] ?? field.defaultValue} domain={field.allowZero ? 'nonnegative' : 'positive'}
            validate={value => validateSection({ ...elemSection, [field.key]: value })}
            onChange={value => setElemSection({ ...elemSection, [field.key]: value })} />)}
        </div>
        {/* 截面属性显示 */}
        <div className="solver-section-readout"><span>A <b>{sectionProps.area.toFixed(0)}</b> mm²</span><span>I <b>{sectionProps.Iz.toPrecision(4)}</b> mm⁴</span></div>
        {/* 材料 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <NumericInput label="E (MPa)" value={elemE} onChange={setElemE} domain="positive" /></div>
          <div>
            <NumericInput label="屈服强度 (MPa)" value={elemYield} onChange={setElemYield} domain="positive" /></div>
        </div>
        <button onClick={addElement} disabled={!elemStart || !elemEnd}
          className="w-full px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50">添加单元</button>
      </div>

      {/* 添加荷载 */}
      <div className="solver-model-form" hidden={activeTool !== 'load'}>
        <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <ArrowDown className="w-3 h-3" /> 添加荷载
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">作用位置</label>
            <select
              aria-label="荷载作用对象" value={loadTarget}
              onChange={(e) => setLoadTarget(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="">选择...</option>
              <optgroup label="节点">
                {state.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
              </optgroup>
              <optgroup label="单元">
                {state.elements.map(e => <option key={e.id} value={e.id}>{e.id}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">类型</label>
            <select
              aria-label="荷载类型" value={loadType}
              onChange={(e) => setLoadType(e.target.value as 'point' | 'distributed' | 'triangular' | 'moment')}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="point">集中力</option>
              <option value="distributed">均布荷载</option>
              <option value="triangular">三角形荷载</option>
              <option value="moment">力矩</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">
              {loadType === 'distributed' || loadType === 'triangular' ? '起点强度 (N/m)' : loadType === 'moment' ? '力矩 (Nm)' : '大小 (N)'}
            </label>
            <NumericInput label="荷载大小" value={loadValue} onChange={setLoadValue} domain="signed" />
          </div>
          {loadType === 'triangular' && (
            <div>
              <label className="text-[10px] text-slate-500">终点强度 (N/m)</label>
              <NumericInput label="终点强度 (N/m)" value={loadValueEnd} onChange={setLoadValueEnd} domain="signed" />
            </div>
          )}
          {loadType === 'point' && state.elements.some(e => e.id === loadTarget) && (
            <div>
              <label className="text-[10px] text-slate-500">位置 (0-1)</label>
              <NumericInput label="位置 (0-1)" value={loadPosition} onChange={setLoadPosition} domain="nonnegative" maximum={1} />
            </div>
          )}
        </div>
        <button
          onClick={addLoad}
          disabled={!loadTarget}
          className="w-full px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50"
        >
          添加荷载
        </button>
      </div>

      <section className="solver-object-tree" aria-label="模型对象">
        <header><strong>模型对象</strong><span>{state.nodes.length + state.elements.length + state.loads.length}</span></header>
        {([
          {label:'节点', items:state.nodes.map(n => ({id:n.id,detail:`(${n.x}, ${n.y}) mm`}))},
          {label:'单元', items:state.elements.map(e => ({id:e.id,detail:`${e.nodeStart} → ${e.nodeEnd}`}))},
          {label:'荷载', items:state.loads.map(l => ({id:l.id,detail:`${l.value} ${l.type === 'distributed' || l.type === 'triangular' ? 'N/m' : l.type === 'moment' ? 'N·m' : 'N'}`}))},
        ]).map(group => <div key={group.label} className="solver-object-group"><h5>{group.label}<span>{group.items.length}</span></h5>{group.items.map(item => <button key={item.id} aria-pressed={state.selectedId === item.id} onClick={() => onChange({selectedId:state.selectedId === item.id ? null : item.id})}><span>{item.id}</span><small>{item.detail}</small></button>)}</div>)}
        {!state.nodes.length && <p>尚无对象，先添加节点或载入示例。</p>}
      </section>
    </div>
  );
};
