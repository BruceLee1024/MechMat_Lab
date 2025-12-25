import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Play,
  RotateCcw,
  MousePointer,
  Circle,
  Minus,
  ArrowDown,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Trash2,
  Settings,
  Anchor,
  Calculator,
  TrendingDown,
  Activity,
} from "lucide-react";
import { LatexRenderer } from "../components";
import {
  SolverState,
  SolverNode,
  SolverElement,
  SolverLoad,
  SupportType,
  DEFAULT_SOLVER_STATE,
  SOLVER_TEMPLATES,
  SolverTemplate,
} from "./SolverTypes";
import { solveUnified } from "./UnifiedSolver";

// ==========================================
// 工具栏按钮组件 - 带悬浮提示
// ==========================================
const IconButton = ({
  icon: Icon,
  label,
  tooltip,
  active,
  onClick,
  disabled,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  tooltip?: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) => {
  const baseClass = "p-2 rounded-lg transition-all flex items-center justify-center relative group";
  const variantClass = {
    default: active 
      ? "bg-indigo-600 text-white shadow-sm" 
      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    danger: "bg-rose-100 text-rose-600 hover:bg-rose-200",
  }[variant];
  const disabledClass = disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${disabledClass}`}
    >
      <Icon className="w-4 h-4" />
      {/* 悬浮提示 - 改为显示在下方 */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 9999 }}>
        {tooltip || label}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
      </div>
    </button>
  );
};

// ==========================================
// 建模面板组件 - 通过输入坐标建模
// ==========================================
const ModelingPanel = ({
  state,
  onChange,
}: {
  state: SolverState;
  onChange: (s: Partial<SolverState>) => void;
}) => {
  const [nodeX, setNodeX] = useState(0);
  const [nodeY, setNodeY] = useState(300);
  const [nodeSupport, setNodeSupport] = useState<SupportType>('none');
  
  const [elemStart, setElemStart] = useState('');
  const [elemEnd, setElemEnd] = useState('');
  const [elemWidth, setElemWidth] = useState(100);
  const [elemHeight, setElemHeight] = useState(100);
  const [elemE, setElemE] = useState(200000);
  
  const [loadTarget, setLoadTarget] = useState('');
  const [loadType, setLoadType] = useState<'point' | 'distributed' | 'triangular' | 'moment'>('point');
  const [loadValue, setLoadValue] = useState(10000);
  const [loadValueEnd, setLoadValueEnd] = useState(0);
  const [loadPosition, setLoadPosition] = useState(0.5);

  // 添加节点
  const addNode = () => {
    const id = `N${state.nodes.length + 1}`;
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

  // 添加单元
  const addElement = () => {
    if (!elemStart || !elemEnd) return;
    const id = `E${state.elements.length + 1}`;
    const A = elemWidth * elemHeight;
    const I = (elemWidth * Math.pow(elemHeight, 3)) / 12;
    
    onChange({
      elements: [...state.elements, {
        id,
        type: 'beam',
        nodeStart: elemStart,
        nodeEnd: elemEnd,
        section: { A, I, width: elemWidth, height: elemHeight },
        material: { E: elemE, G: 77000, yield: 250 },
      }],
    });
  };

  // 添加荷载
  const addLoad = () => {
    if (!loadTarget) return;
    const id = `L${state.loads.length + 1}`;
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
    onChange({
      nodes: state.nodes.filter(n => n.id !== state.selectedId),
      elements: state.elements.filter(e => e.id !== state.selectedId),
      loads: state.loads.filter(l => l.id !== state.selectedId),
      selectedId: null,
    });
  };

  // 更新选中节点
  const selectedNode = state.nodes.find(n => n.id === state.selectedId);
  const selectedElement = state.elements.find(e => e.id === state.selectedId);
  const selectedLoad = state.loads.find(l => l.id === state.selectedId);

  return (
    <div className="space-y-4 text-xs">
      {/* 添加节点 */}
      <div className="bg-slate-50 p-3 rounded-lg border">
        <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <Circle className="w-3 h-3" /> 添加节点
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">X (mm)</label>
            <input
              type="number"
              value={nodeX}
              onChange={(e) => setNodeX(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Y (mm)</label>
            <input
              type="number"
              value={nodeY}
              onChange={(e) => setNodeY(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <select
            value={nodeSupport}
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
      <div className="bg-slate-50 p-3 rounded-lg border">
        <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <Minus className="w-3 h-3" /> 添加单元
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">起点节点</label>
            <select
              value={elemStart}
              onChange={(e) => setElemStart(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="">选择...</option>
              {state.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">终点节点</label>
            <select
              value={elemEnd}
              onChange={(e) => setElemEnd(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="">选择...</option>
              {state.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">宽 (mm)</label>
            <input
              type="number"
              value={elemWidth}
              onChange={(e) => setElemWidth(parseFloat(e.target.value) || 100)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">高 (mm)</label>
            <input
              type="number"
              value={elemHeight}
              onChange={(e) => setElemHeight(parseFloat(e.target.value) || 100)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">E (MPa)</label>
            <input
              type="number"
              value={elemE}
              onChange={(e) => setElemE(parseFloat(e.target.value) || 200000)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
        </div>
        <button
          onClick={addElement}
          disabled={!elemStart || !elemEnd}
          className="w-full px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50"
        >
          添加单元
        </button>
      </div>

      {/* 添加荷载 */}
      <div className="bg-slate-50 p-3 rounded-lg border">
        <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <ArrowDown className="w-3 h-3" /> 添加荷载
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-500">作用位置</label>
            <select
              value={loadTarget}
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
              value={loadType}
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
            <input
              type="number"
              value={loadValue}
              onChange={(e) => setLoadValue(parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          {loadType === 'triangular' && (
            <div>
              <label className="text-[10px] text-slate-500">终点强度 (N/m)</label>
              <input
                type="number"
                value={loadValueEnd}
                onChange={(e) => setLoadValueEnd(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs"
              />
            </div>
          )}
          {loadType === 'point' && state.elements.some(e => e.id === loadTarget) && (
            <div>
              <label className="text-[10px] text-slate-500">位置 (0-1)</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={loadPosition}
                onChange={(e) => setLoadPosition(parseFloat(e.target.value) || 0.5)}
                className="w-full px-2 py-1 border rounded text-xs"
              />
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

      {/* 选中项编辑 */}
      {(selectedNode || selectedElement || selectedLoad) && (
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">编辑选中项</h4>
          {selectedNode && (
            <div className="space-y-2">
              <div className="text-[10px] text-amber-700">节点 {selectedNode.id}</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={Math.round(selectedNode.x)}
                  onChange={(e) => onChange({
                    nodes: state.nodes.map(n => n.id === selectedNode.id ? { ...n, x: parseFloat(e.target.value) || 0 } : n)
                  })}
                  className="px-2 py-1 border rounded text-xs"
                  placeholder="X"
                />
                <input
                  type="number"
                  value={Math.round(selectedNode.y)}
                  onChange={(e) => onChange({
                    nodes: state.nodes.map(n => n.id === selectedNode.id ? { ...n, y: parseFloat(e.target.value) || 0 } : n)
                  })}
                  className="px-2 py-1 border rounded text-xs"
                  placeholder="Y"
                />
              </div>
              <select
                value={selectedNode.support}
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
          {selectedLoad && (
            <div className="space-y-2">
              <div className="text-[10px] text-amber-700">荷载 {selectedLoad.id}</div>
              <input
                type="number"
                value={selectedLoad.value}
                onChange={(e) => onChange({
                  loads: state.loads.map(l => l.id === selectedLoad.id ? { ...l, value: parseFloat(e.target.value) || 0 } : l)
                })}
                className="w-full px-2 py-1 border rounded text-xs"
                placeholder="荷载值"
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

      {/* 模型概览 */}
      <div className="bg-slate-100 p-2 rounded text-[10px] text-slate-600">
        <div>节点: {state.nodes.map(n => `${n.id}(${n.x},${n.y})`).join(', ') || '无'}</div>
        <div>单元: {state.elements.map(e => `${e.id}(${e.nodeStart}-${e.nodeEnd})`).join(', ') || '无'}</div>
        <div>荷载: {state.loads.map(l => `${l.id}:${l.value}${l.type === 'distributed' ? 'N/m' : 'N'}`).join(', ') || '无'}</div>
      </div>
    </div>
  );
};

// ==========================================
// 属性面板组件（保留用于兼容）
// ==========================================
const PropertyPanel = ({
  state,
  onChange,
}: {
  state: SolverState;
  onChange: (s: Partial<SolverState>) => void;
}) => {
  return <ModelingPanel state={state} onChange={onChange} />;
};

// 占位，不再使用旧的属性面板
const OldPropertyPanel = ({
  state,
  onChange,
}: {
  state: SolverState;
  onChange: (s: Partial<SolverState>) => void;
}) => {
  const selectedNode = state.nodes.find((n) => n.id === state.selectedId);
  const selectedElement = state.elements.find((e) => e.id === state.selectedId);
  const selectedLoad = state.loads.find((l) => l.id === state.selectedId);

  const updateNode = (updates: Partial<SolverNode>) => {
    if (!selectedNode) return;
    onChange({
      nodes: state.nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, ...updates } : n
      ),
    });
  };

  const updateElement = (updates: Partial<SolverElement>) => {
    if (!selectedElement) return;
    onChange({
      elements: state.elements.map((e) =>
        e.id === selectedElement.id ? { ...e, ...updates } : e
      ),
    });
  };

  const updateLoad = (updates: Partial<SolverLoad>) => {
    if (!selectedLoad) return;
    onChange({
      loads: state.loads.map((l) =>
        l.id === selectedLoad.id ? { ...l, ...updates } : l
      ),
    });
  };

  if (selectedNode) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-indigo-900 text-sm">节点属性</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-16">ID:</label>
            <span className="text-xs font-mono">{selectedNode.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-16">X (mm):</label>
            <input
              type="number"
              value={Math.round(selectedNode.x)}
              onChange={(e) => updateNode({ x: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-2 py-1 text-xs border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-16">Y (mm):</label>
            <input
              type="number"
              value={Math.round(selectedNode.y)}
              onChange={(e) => updateNode({ y: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-2 py-1 text-xs border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-16">支座:</label>
            <select
              value={selectedNode.support}
              onChange={(e) => {
                const support = e.target.value as SupportType;
                const fixedDOF = {
                  fixed: { dx: true, dy: true, rz: true },
                  pinned: { dx: true, dy: true, rz: false },
                  roller: { dx: false, dy: true, rz: false },
                  none: { dx: false, dy: false, rz: false },
                }[support];
                updateNode({ support, fixedDOF });
              }}
              className="flex-1 px-2 py-1 text-xs border rounded"
            >
              <option value="none">无</option>
              <option value="pinned">铰支座</option>
              <option value="roller">滚动支座</option>
              <option value="fixed">固定端</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (selectedElement) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-indigo-900 text-sm">单元属性</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20">类型:</label>
            <select
              value={selectedElement.type}
              onChange={(e) => updateElement({ type: e.target.value as 'beam' | 'truss' })}
              className="flex-1 px-2 py-1 text-xs border rounded"
            >
              <option value="beam">梁单元</option>
              <option value="truss">桁架单元</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20">宽度 (mm):</label>
            <input
              type="number"
              value={selectedElement.section.width}
              onChange={(e) => {
                const width = parseFloat(e.target.value) || 50;
                const height = selectedElement.section.height;
                const A = width * height;
                const I = (width * Math.pow(height, 3)) / 12;
                updateElement({ section: { ...selectedElement.section, width, A, I } });
              }}
              className="flex-1 px-2 py-1 text-xs border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20">高度 (mm):</label>
            <input
              type="number"
              value={selectedElement.section.height}
              onChange={(e) => {
                const height = parseFloat(e.target.value) || 50;
                const width = selectedElement.section.width;
                const A = width * height;
                const I = (width * Math.pow(height, 3)) / 12;
                updateElement({ section: { ...selectedElement.section, height, A, I } });
              }}
              className="flex-1 px-2 py-1 text-xs border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20">E (MPa):</label>
            <input
              type="number"
              value={selectedElement.material.E}
              onChange={(e) =>
                updateElement({
                  material: { ...selectedElement.material, E: parseFloat(e.target.value) || 200000 },
                })
              }
              className="flex-1 px-2 py-1 text-xs border rounded"
            />
          </div>
        </div>
      </div>
    );
  }

  if (selectedLoad) {
    const isDistributed = selectedLoad.type === 'distributed';
    const isMoment = selectedLoad.type === 'moment';
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-indigo-900 text-sm">荷载属性</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20">类型:</label>
            <select
              value={selectedLoad.type}
              onChange={(e) => updateLoad({ type: e.target.value as 'point' | 'distributed' | 'moment' })}
              className="flex-1 px-2 py-1 text-xs border rounded"
            >
              <option value="point">集中力</option>
              <option value="distributed">均布荷载</option>
              <option value="moment">力矩</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-20">
              {isDistributed ? '强度:' : isMoment ? '力矩:' : '大小:'}
            </label>
            <input
              type="number"
              value={selectedLoad.value}
              onChange={(e) => updateLoad({ value: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-2 py-1 text-xs border rounded"
            />
            <span className="text-xs text-slate-400">
              {isDistributed ? 'N/m' : isMoment ? 'Nm' : 'N'}
            </span>
          </div>
          {!isDistributed && !isMoment && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 w-20">角度 (°):</label>
              <input
                type="number"
                value={selectedLoad.angle}
                onChange={(e) => updateLoad({ angle: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-2 py-1 text-xs border rounded"
              />
            </div>
          )}
          {selectedLoad.targetType === 'element' && !isDistributed && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 w-20">位置 (0-1):</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={selectedLoad.position ?? 0.5}
                onChange={(e) => updateLoad({ position: parseFloat(e.target.value) || 0.5 })}
                className="flex-1 px-2 py-1 text-xs border rounded"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-400 text-center py-4">
      选择节点、单元或荷载以编辑属性
    </div>
  );
};

// ==========================================
// 计算过程面板组件 - 显示公式和数据
// ==========================================
const CalculationPanel = ({ state }: { state: SolverState }) => {
  if (!state.result || !state.result.success) {
    return (
      <div className="text-xs text-slate-400 text-center py-8">
        {state.result?.message || "点击「求解」按钮查看计算过程"}
      </div>
    );
  }

  const { result } = state;
  
  // 计算总跨度
  let totalLength = 0;
  for (const elem of state.elements) {
    const n1 = state.nodes.find(n => n.id === elem.nodeStart);
    const n2 = state.nodes.find(n => n.id === elem.nodeEnd);
    if (n1 && n2) {
      totalLength += Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
    }
  }

  // 找最大内力
  let maxM = 0, maxV = 0, maxStress = 0, maxDeflection = 0;
  for (const elemResult of result.elements) {
    for (const f of elemResult.internalForces) {
      if (Math.abs(f.M) > Math.abs(maxM)) maxM = f.M;
      if (Math.abs(f.V) > Math.abs(maxV)) maxV = f.V;
    }
    if (elemResult.maxStress > maxStress) maxStress = elemResult.maxStress;
  }
  for (const nodeResult of result.nodes) {
    const dy = Math.abs(nodeResult.displacement.dy);
    if (dy > maxDeflection) maxDeflection = dy;
  }

  // 尝试识别简单情况以显示公式
  let formulaContent = null;
  if (state.elements.length === 1 && state.loads.length === 1) {
    const elem = state.elements[0];
    const load = state.loads[0];
    const n1 = state.nodes.find(n => n.id === elem.nodeStart);
    const n2 = state.nodes.find(n => n.id === elem.nodeEnd);
    
    if (n1 && n2) {
      const L = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
      const isFixedFixed = n1.support === 'fixed' && n2.support === 'fixed';
      const isSimplySupported = (n1.support === 'pinned' && n2.support === 'roller') ||
                                (n1.support === 'roller' && n2.support === 'pinned');
      const isCantilever = (n1.support === 'fixed' && n2.support === 'none') ||
                           (n1.support === 'none' && n2.support === 'fixed');
      const isProppedCantilever = (n1.support === 'fixed' && (n2.support === 'pinned' || n2.support === 'roller')) ||
                                  ((n1.support === 'pinned' || n1.support === 'roller') && n2.support === 'fixed');

      const a = load.position !== undefined ? load.position * L : (load.targetType === 'node' && load.targetId === n1.id ? 0 : L);
      const b = L - a;
      
      if (isSimplySupported && load.type === 'point') {
        const P = load.value;
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">简支梁集中力公式:</div>
            <LatexRenderer formula={`R_A = \\frac{Pb}{L} = ${(P * b / L).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`R_B = \\frac{Pa}{L} = ${(P * a / L).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_{max} = \\frac{Pab}{L} = ${(P * a * b / L / 1000).toFixed(2)} \\text{ Nm}`} />
          </div>
        );
      } else if (isSimplySupported && load.type === 'distributed') {
        const q = load.value;
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">简支梁均布荷载公式:</div>
            <LatexRenderer formula={`R_A = R_B = \\frac{qL}{2} = ${(q * L / 2000).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_{max} = \\frac{qL^2}{8} = ${(q * L * L / 8 / 1000000).toFixed(2)} \\text{ Nm}`} />
            <LatexRenderer formula={`w_{max} = \\frac{5qL^4}{384EI}`} />
          </div>
        );
      } else if (isCantilever && load.type === 'point') {
        const P = load.value;
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">悬臂梁集中力公式:</div>
            <LatexRenderer formula={`R_A = P = ${P.toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_A = -Pa = ${(-P * a / 1000).toFixed(2)} \\text{ Nm}`} />
            <LatexRenderer formula={`w_{max} = \\frac{Pa^3}{3EI}`} />
          </div>
        );
      } else if (isCantilever && load.type === 'distributed') {
        const q = load.value;
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">悬臂梁均布荷载公式:</div>
            <LatexRenderer formula={`R_A = qL = ${(q * L / 1000).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_A = -\\frac{qL^2}{2} = ${(-q * L * L / 2 / 1000000).toFixed(2)} \\text{ Nm}`} />
            <LatexRenderer formula={`w_{max} = \\frac{qL^4}{8EI}`} />
          </div>
        );
      } else if (isFixedFixed && load.type === 'distributed') {
        const q = load.value;
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">两端固定梁均布荷载公式:</div>
            <LatexRenderer formula={`M_A = M_B = -\\frac{qL^2}{12}`} />
            <LatexRenderer formula={`M_{center} = \\frac{qL^2}{24}`} />
            <LatexRenderer formula={`w_{max} = \\frac{qL^4}{384EI}`} />
          </div>
        );
      } else if (isFixedFixed && load.type === 'point') {
        const P = load.value;
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">两端固定梁集中力公式:</div>
            <LatexRenderer formula={`M_A = -\\frac{Pab^2}{L^2}`} />
            <LatexRenderer formula={`M_B = -\\frac{Pa^2b}{L^2}`} />
            <LatexRenderer formula={`w_{max} = \\frac{2Pa^3b^2}{3EI(3a+b)^2}`} />
          </div>
        );
      }
    }
  }
  
  // 如果没有匹配到标准公式，显示通用截面法公式
  if (!formulaContent) {
    formulaContent = (
      <div className="mt-2 pt-2 border-t border-indigo-200">
        <div className="text-[10px] text-indigo-800 mb-1">计算原理 (截面法 & 平衡方程):</div>
        <div className="space-y-1 text-[10px] text-slate-600">
          <div className="text-xs font-semibold text-indigo-600 mb-1">1. 整体平衡方程</div>
          <LatexRenderer formula={`\\sum F_y = 0, \\quad \\sum M = 0`} />
          
          <div className="text-xs font-semibold text-indigo-600 mt-2 mb-1">2. 内力微分关系</div>
          <LatexRenderer formula={`\\frac{dV}{dx} = -q(x)`} />
          <LatexRenderer formula={`\\frac{dM}{dx} = V(x)`} />
          
          <div className="text-xs font-semibold text-indigo-600 mt-2 mb-1">3. 截面内力计算</div>
          <div className="pl-1">
            <div>剪力 V: 截面左侧所有外力的代数和</div>
            <LatexRenderer formula={`V(x) = \\sum F_{y, left}`} />
            <div className="mt-1">弯矩 M: 截面左侧所有外力对截面力矩的代数和</div>
            <LatexRenderer formula={`M(x) = \\sum M_{left}`} />
          </div>
          
          <div className="text-xs font-semibold text-indigo-600 mt-2 mb-1">4. 应力与变形</div>
          <LatexRenderer formula={`\\sigma = \\frac{M \\cdot y}{I_{z}}`} />
          <LatexRenderer formula={`EI \\frac{d^2w}{dx^2} = M(x)`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs overflow-y-auto">
      {/* 结构概览 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">📐 结构概览</h4>
        <div className="bg-slate-50 p-2 rounded border text-[11px] space-y-1">
          <div>节点: {state.nodes.length} 个 | 单元: {state.elements.length} 个 | 荷载: {state.loads.length} 个</div>
          <div>总跨度: {totalLength.toFixed(0)} mm</div>
        </div>
      </div>

      {/* 支座反力 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">⚖️ 支座反力</h4>
        <div className="bg-indigo-50 p-2 rounded border border-indigo-100 space-y-1">
          {result.nodes.filter(n => n.reaction).map(n => (
            <div key={n.nodeId} className="text-[11px] flex justify-between">
              <span className="font-medium">{n.nodeId}:</span>
              <span>
                {n.reaction!.Fx !== 0 && `Fx = ${n.reaction!.Fx.toFixed(1)} N, `}
                Fy = {n.reaction!.Fy.toFixed(1)} N
                {n.reaction!.Mz !== 0 && `, M = ${(n.reaction!.Mz / 1000).toFixed(2)} Nm`}
              </span>
            </div>
          ))}
          {formulaContent}
        </div>
      </div>

      {/* 最大内力 - 区分梁和桁架 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">📊 最大内力</h4>
        <div className="bg-amber-50 p-2 rounded border border-amber-100 space-y-1 text-[11px]">
          {/* 显示轴力（桁架） */}
          {result.elements.some(e => {
            const elem = state.elements.find(el => el.id === e.elementId);
            return elem?.type === 'truss';
          }) && (
            <div className="border-b border-amber-200 pb-1 mb-1">
              <div className="font-medium text-amber-700 mb-1">桁架杆轴力:</div>
              {result.elements.map(e => {
                const elem = state.elements.find(el => el.id === e.elementId);
                if (elem?.type !== 'truss') return null;
                const N = e.internalForces[0]?.N ?? 0;
                return (
                  <div key={e.elementId} className="flex justify-between">
                    <span>{e.elementId}:</span>
                    <span className={N > 0 ? 'text-red-600' : N < 0 ? 'text-blue-600' : ''}>
                      N = {N.toFixed(1)} N {N > 0 ? '(拉)' : N < 0 ? '(压)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {/* 显示剪力和弯矩（梁） */}
          {(maxV !== 0 || maxM !== 0) && (
            <>
              <div className="flex justify-between">
                <span>最大剪力:</span>
                <span className="font-medium">{maxV.toFixed(1)} N</span>
              </div>
              <div className="flex justify-between">
                <span>最大弯矩:</span>
                <span className="font-medium">{(maxM / 1000).toFixed(2)} Nm</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 位移 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">📉 节点位移</h4>
        <div className="bg-cyan-50 p-2 rounded border border-cyan-100 space-y-1">
          {result.nodes.map(n => (
            <div key={n.nodeId} className="text-[11px] flex justify-between">
              <span>{n.nodeId}:</span>
              <span>
                δy = {n.displacement.dy.toFixed(4)} mm
                {n.displacement.rz !== 0 && `, θ = ${(n.displacement.rz * 1000).toFixed(3)}‰`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 应力分析 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">⚡ 应力分析</h4>
        <div className="bg-rose-50 p-2 rounded border border-rose-100 text-[11px] space-y-1">
          {result.elements.map(elem => {
            const element = state.elements.find(e => e.id === elem.elementId);
            const yieldStrength = element?.material.yield ?? 250;
            return (
              <div key={elem.elementId} className="space-y-1">
                {result.elements.length > 1 && (
                  <div className="font-medium text-rose-700">{elem.elementId}:</div>
                )}
                <div className="flex justify-between">
                  <span>最大拉应力 σ_max:</span>
                  <span className="font-medium">{elem.maxStress.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>最大压应力 σ_min:</span>
                  <span className="font-medium">{elem.minStress.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>最大剪应力 τ_max:</span>
                  <span className="font-medium">{elem.maxShearStress.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>von Mises应力:</span>
                  <span className="font-medium">{elem.maxVonMises.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-rose-200">
                  <span>安全系数:</span>
                  <span className={`font-bold ${elem.safetyFactor >= 2 ? 'text-green-600' : elem.safetyFactor >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                    {elem.safetyFactor === Infinity ? '∞' : elem.safetyFactor.toFixed(2)}
                    {elem.safetyFactor < 1 && ' ⚠️ 超过屈服'}
                    {elem.safetyFactor >= 1 && elem.safetyFactor < 2 && ' ⚠️ 偏低'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  (屈服强度: {yieldStrength} MPa)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 应变能 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">🔋 应变能</h4>
        <div className="bg-emerald-50 p-2 rounded border border-emerald-100 text-[11px]">
          <div className="flex justify-between">
            <span>总应变能:</span>
            <span className="font-medium">{result.totalStrainEnergy.toFixed(4)} mJ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 内力图组件
// ==========================================
const DiagramPanel = ({ state, diagramType }: { state: SolverState; diagramType: 'shear' | 'moment' | 'deflection' }) => {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!state.result?.success || state.elements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        求解后显示内力图
      </div>
    );
  }

  const { result } = state;
  
  // 收集所有单元的内力数据
  const allForces: { x: number; V: number; M: number; elemIdx: number }[] = [];
  let totalLength = 0;
  const elemLengths: number[] = [];
  
  for (let i = 0; i < state.elements.length; i++) {
    const elem = state.elements[i];
    const n1 = state.nodes.find(n => n.id === elem.nodeStart);
    const n2 = state.nodes.find(n => n.id === elem.nodeEnd);
    if (!n1 || !n2) continue;
    
    const L = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
    elemLengths.push(L);
    
    // 使用 elementId 匹配，而不是索引
    const elemResult = result.elements.find(er => er.elementId === elem.id);
    if (elemResult) {
      const forces = elemResult.internalForces;
      
      // 直接添加所有内力点，不做插值
      // 内力数据已经包含了足够的采样点和突变点
      for (const f of forces) {
        allForces.push({
          x: totalLength + f.position * L,
          V: f.V,
          M: f.M,
          elemIdx: i,
        });
      }
    }
    totalLength += L;
  }
  
  // 收集节点位移用于挠度图
  const nodeDisplacements: { x: number; dy: number }[] = [];
  let xPos = 0;
  for (let i = 0; i < state.elements.length; i++) {
    const elem = state.elements[i];
    const n1 = state.nodes.find(n => n.id === elem.nodeStart);
    const n2 = state.nodes.find(n => n.id === elem.nodeEnd);
    if (!n1 || !n2) continue;
    
    const L = elemLengths[i];
    const nr1 = result.nodes.find(nr => nr.nodeId === n1.id);
    const nr2 = result.nodes.find(nr => nr.nodeId === n2.id);
    
    if (i === 0 && nr1) {
      nodeDisplacements.push({ x: xPos, dy: nr1.displacement.dy });
    }
    if (nr2) {
      nodeDisplacements.push({ x: xPos + L, dy: nr2.displacement.dy });
    }
    xPos += L;
  }

  // 找最大值用于缩放
  const maxV = Math.max(...allForces.map(f => Math.abs(f.V)), 1);
  const maxM = Math.max(...allForces.map(f => Math.abs(f.M)), 1);
  const maxDy = Math.max(...nodeDisplacements.map(d => Math.abs(d.dy)), 0.0001);

  const width = 500;
  const height = 120;
  const padding = 40;
  const plotWidth = width - padding * 2;
  const plotHeight = height - 30;

  const getColor = () => {
    switch (diagramType) {
      case 'shear': return { fill: 'rgba(79, 70, 229, 0.2)', stroke: '#4f46e5' };
      case 'moment': return { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b' };
      case 'deflection': return { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981' };
    }
  };
  const colors = getColor();

  const getTitle = () => {
    switch (diagramType) {
      case 'shear': return '剪力图 (V)';
      case 'moment': return '弯矩图 (M)';
      case 'deflection': return '挠度图 (w)';
    }
  };

  // 构建路径
  let pathData = `M ${padding} ${height / 2}`;
  
  if (diagramType === 'deflection') {
    // 挠度图使用节点位移
    nodeDisplacements.forEach((d, i) => {
      const x = padding + (d.x / totalLength) * plotWidth;
      const y = height / 2 + (d.dy / maxDy) * (plotHeight / 2) * 0.8;
      if (i === 0) {
        pathData = `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
  } else if (diagramType === 'shear') {
    // 剪力图 - 智能绘制
    // 对于集中力处的突变：先画水平线再画垂直线（阶梯状）
    // 对于均布荷载：直接连线（斜线）
    
    allForces.forEach((f, i) => {
      const x = padding + (f.x / totalLength) * plotWidth;
      const y = height / 2 - (f.V / maxV) * (plotHeight / 2) * 0.8;
      
      if (i === 0) {
        // 第一个点：从基线开始
        pathData = `M ${padding} ${height / 2} L ${x} ${y}`;
      } else {
        const prevF = allForces[i - 1];
        const prevX = padding + (prevF.x / totalLength) * plotWidth;
        const prevY = height / 2 - (prevF.V / maxV) * (plotHeight / 2) * 0.8;
        const xDiff = Math.abs(f.x - prevF.x);
        
        if (xDiff < 0.1) {
          // 突变点（集中力处）：x 位置几乎相同但 V 值不同
          // 只画垂直线
          pathData += ` L ${x} ${y}`;
        } else {
          // 检查是否是阶梯变化（剪力值相同）还是线性变化（剪力值不同）
          const vDiff = Math.abs(f.V - prevF.V);
          if (vDiff < 0.1) {
            // 剪力值相同：画水平线
            pathData += ` L ${x} ${y}`;
          } else {
            // 剪力值不同：直接连线（均布荷载导致的线性变化）
            pathData += ` L ${x} ${y}`;
          }
        }
      }
    });
    
    // 最后画回基线
    if (allForces.length > 0) {
      const lastX = padding + (allForces[allForces.length - 1].x / totalLength) * plotWidth;
      pathData += ` L ${lastX} ${height / 2} Z`;
    }
  } else {
    // 弯矩图 - 直接连线
    allForces.forEach((f, i) => {
      const x = padding + (f.x / totalLength) * plotWidth;
      const y = height / 2 + (f.M / maxM) * (plotHeight / 2) * 0.8;
      pathData += ` L ${x} ${y}`;
    });
    pathData += ` L ${padding + plotWidth} ${height / 2} Z`;
  }

  // 鼠标交互逻辑
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = width / rect.width; // SVG 缩放比例
    const svgMouseX = mouseX * scaleX;
    
    if (svgMouseX < padding || svgMouseX > padding + plotWidth) {
      setHoverX(null);
      return;
    }
    const relX = (svgMouseX - padding) / plotWidth;
    setHoverX(relX * totalLength);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  // 计算当前 hover 值
  let hoverValue = 0;
  let hoverY = height / 2;
  let hoverSvgX = 0;
  
  if (hoverX !== null) {
    hoverSvgX = padding + (hoverX / totalLength) * plotWidth;
    
    if (diagramType === 'deflection') {
      // 线性插值
      for (let i = 0; i < nodeDisplacements.length - 1; i++) {
        const p1 = nodeDisplacements[i];
        const p2 = nodeDisplacements[i + 1];
        if (hoverX >= p1.x && hoverX <= p2.x) {
          const t = (hoverX - p1.x) / (p2.x - p1.x);
          hoverValue = p1.dy + t * (p2.dy - p1.dy);
          hoverY = height / 2 + (hoverValue / (maxDy || 1)) * (plotHeight / 2) * 0.8;
          break;
        }
      }
    } else {
      // 查找最近点
      if (allForces.length > 0) {
        const p = allForces.reduce((prev, curr) => 
          Math.abs(curr.x - hoverX!) < Math.abs(prev.x - hoverX!) ? curr : prev
        );
        hoverValue = diagramType === 'shear' ? p.V : p.M;
        if (diagramType === 'shear') {
          hoverY = height / 2 - (hoverValue / (maxV || 1)) * (plotHeight / 2) * 0.8;
        } else {
          hoverY = height / 2 + (hoverValue / (maxM || 1)) * (plotHeight / 2) * 0.8;
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-xs font-semibold text-slate-600 mb-1 px-2 flex justify-between items-center">
        <span>{getTitle()}</span>
        {hoverX !== null && (
          <span className="text-[10px] font-normal text-indigo-600 bg-indigo-50 px-1 rounded">
            x={hoverX.toFixed(0)}mm, val={diagramType === 'moment' ? (hoverValue/1000).toFixed(2) + ' Nm' : hoverValue.toFixed(2) + (diagramType === 'shear' ? ' N' : ' mm')}
          </span>
        )}
      </div>
      <svg 
        ref={svgRef}
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      >
        {/* 基线 */}
        <line x1={padding} y1={height / 2} x2={padding + plotWidth} y2={height / 2} stroke="#94a3b8" strokeWidth="1" />
        
        {/* 节点分隔线 */}
        {elemLengths.slice(0, -1).reduce((acc: number[], L, i) => {
          const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
          acc.push(prev + L);
          return acc;
        }, []).map((pos, i) => (
          <line
            key={i}
            x1={padding + (pos / totalLength) * plotWidth}
            y1={height / 2 - 8}
            x2={padding + (pos / totalLength) * plotWidth}
            y2={height / 2 + 8}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ))}
        
        {/* 左右端点 */}
        <line x1={padding} y1={height / 2 - 5} x2={padding} y2={height / 2 + 5} stroke="#64748b" strokeWidth="2" />
        <line x1={padding + plotWidth} y1={height / 2 - 5} x2={padding + plotWidth} y2={height / 2 + 5} stroke="#64748b" strokeWidth="2" />
        
        {/* 内力图 */}
        <path d={pathData} fill={diagramType === 'deflection' ? 'none' : colors.fill} stroke={colors.stroke} strokeWidth="2" />
        
        {/* 悬停指示线和点 */}
        {hoverX !== null && (
          <g pointerEvents="none">
            <line 
              x1={hoverSvgX} 
              y1={10} 
              x2={hoverSvgX} 
              y2={height-10} 
              stroke="#6366f1" 
              strokeWidth="1" 
              strokeDasharray="4 2" 
              opacity="0.5"
            />
            <circle 
              cx={hoverSvgX} 
              cy={hoverY} 
              r="3" 
              fill="white" 
              stroke="#6366f1" 
              strokeWidth="2" 
            />
          </g>
        )}
        
        {/* 标注 */}
        <text x={padding - 5} y={height / 2 + 4} fontSize="10" fill="#64748b" textAnchor="end">0</text>
        
        {/* 最大值标注 (仅当没有 hover 时显示) */}
        {hoverX === null && (
          <>
            {diagramType === 'shear' && (
              <text x={padding + 10} y={height / 2 - plotHeight / 2 * 0.8 - 5} fontSize="10" fill={colors.stroke}>
                ±{maxV.toFixed(0)} N
              </text>
            )}
            {diagramType === 'moment' && (
              <text x={width / 2} y={height / 2 + plotHeight / 2 * 0.8 + 12} fontSize="10" fill={colors.stroke} textAnchor="middle">
                {(maxM / 1000).toFixed(2)} Nm
              </text>
            )}
            {diagramType === 'deflection' && (
              <text x={width / 2} y={height / 2 + plotHeight / 2 * 0.8 + 12} fontSize="10" fill={colors.stroke} textAnchor="middle">
                {maxDy.toFixed(4)} mm
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
};

// ==========================================
// 主求解器模块
// ==========================================
export const SolverModule = () => {
  const [state, setState] = useState<SolverState>(DEFAULT_SOLVER_STATE);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: string; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [firstNodeId, setFirstNodeId] = useState<string | null>(null);

  // 内力图高度调整
  const [diagramHeight, setDiagramHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);

  // 处理高度调整
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // 计算新高度：使用鼠标垂直移动量，反向（向上拖动增加高度）
      setDiagramHeight(prev => {
        const newHeight = prev - e.movementY;
        return Math.max(100, Math.min(600, newHeight)); // 限制高度范围 100-600px
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);

  const onChange = useCallback((updates: Partial<SolverState>) => {
    setState((prev) => {
      // 如果修改了节点、单元或荷载，清除之前的结果
      const modelChanged = updates.nodes || updates.elements || updates.loads;
      return { 
        ...prev, 
        ...updates,
        // 模型改变时清除结果，强制重新求解
        ...(modelChanged ? { result: null } : {})
      };
    });
  }, []);

  // 加载模板
  const loadTemplate = (template: SolverTemplate) => {
    setState({
      ...DEFAULT_SOLVER_STATE,
      nodes: JSON.parse(JSON.stringify(template.nodes)),
      elements: JSON.parse(JSON.stringify(template.elements)),
      loads: JSON.parse(JSON.stringify(template.loads)),
    });
  };

  // 求解
  const handleSolve = () => {
    const result = solveUnified(state.nodes, state.elements, state.loads);
    setState(prev => ({ ...prev, result, showResults: true }));
  };

  // 重置
  const handleReset = () => {
    setState(DEFAULT_SOLVER_STATE);
  };

  // 删除选中项
  const handleDelete = () => {
    if (!state.selectedId) return;
    
    // 检查是否是节点
    if (state.nodes.find((n) => n.id === state.selectedId)) {
      // 删除相关的单元和荷载
      const elementsToRemove = state.elements
        .filter((e) => e.nodeStart === state.selectedId || e.nodeEnd === state.selectedId)
        .map((e) => e.id);
      
      onChange({
        nodes: state.nodes.filter((n) => n.id !== state.selectedId),
        elements: state.elements.filter((e) => !elementsToRemove.includes(e.id)),
        loads: state.loads.filter((l) => l.targetId !== state.selectedId && !elementsToRemove.includes(l.targetId)),
        selectedId: null,
      });
      return;
    }
    
    // 检查是否是单元
    if (state.elements.find((e) => e.id === state.selectedId)) {
      onChange({
        elements: state.elements.filter((e) => e.id !== state.selectedId),
        loads: state.loads.filter((l) => l.targetId !== state.selectedId),
        selectedId: null,
      });
      return;
    }
    
    // 检查是否是荷载
    if (state.loads.find((l) => l.id === state.selectedId)) {
      onChange({
        loads: state.loads.filter((l) => l.id !== state.selectedId),
        selectedId: null,
      });
    }
  };

  // 获取SVG坐标
  const getSvgPoint = (e: React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.viewOffset.x) / state.viewScale;
    const y = (e.clientY - rect.top - state.viewOffset.y) / state.viewScale;
    
    // 对齐网格
    if (state.showGrid) {
      return {
        x: Math.round(x / state.gridSize) * state.gridSize,
        y: Math.round(y / state.gridSize) * state.gridSize,
      };
    }
    return { x, y };
  };

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // 中键或Alt+左键：平移视图
      setIsPanning(true);
      setPanStart({ x: e.clientX - state.viewOffset.x, y: e.clientY - state.viewOffset.y });
      return;
    }

    const point = getSvgPoint(e);

    if (state.editMode === 'node') {
      // 添加节点
      const newNode: SolverNode = {
        id: `n${Date.now()}`,
        x: point.x,
        y: point.y,
        support: 'none',
        fixedDOF: { dx: false, dy: false, rz: false },
      };
      onChange({ nodes: [...state.nodes, newNode], selectedId: newNode.id });
    } else if (state.editMode === 'element') {
      // 添加单元：需要选择两个节点
      const clickedNode = state.nodes.find(
        (n) => Math.abs(n.x - point.x) < 20 && Math.abs(n.y - point.y) < 20
      );
      
      if (clickedNode) {
        if (!firstNodeId) {
          setFirstNodeId(clickedNode.id);
          setTempLine({ x1: clickedNode.x, y1: clickedNode.y, x2: clickedNode.x, y2: clickedNode.y });
        } else if (clickedNode.id !== firstNodeId) {
          // 创建单元
          const newElement: SolverElement = {
            id: `e${Date.now()}`,
            type: 'beam',
            nodeStart: firstNodeId,
            nodeEnd: clickedNode.id,
            section: { A: 10000, I: 833333, width: 100, height: 100 },
            material: { E: 200000, G: 77000, yield: 250 },
          };
          onChange({ elements: [...state.elements, newElement], selectedId: newElement.id });
          setFirstNodeId(null);
          setTempLine(null);
        }
      }
    } else if (state.editMode === 'load') {
      // 添加荷载
      const clickedNode = state.nodes.find(
        (n) => Math.abs(n.x - point.x) < 20 && Math.abs(n.y - point.y) < 20
      );
      
      if (clickedNode) {
        const newLoad: SolverLoad = {
          id: `l${Date.now()}`,
          type: 'point',
          targetType: 'node',
          targetId: clickedNode.id,
          value: 10000,
          angle: 90,
        };
        onChange({ loads: [...state.loads, newLoad], selectedId: newLoad.id });
      } else {
        // 检查是否点击在单元上
        for (const elem of state.elements) {
          const n1 = state.nodes.find((n) => n.id === elem.nodeStart);
          const n2 = state.nodes.find((n) => n.id === elem.nodeEnd);
          if (!n1 || !n2) continue;

          // 计算点到线段的距离
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const L = Math.sqrt(dx * dx + dy * dy);
          const t = Math.max(0, Math.min(1, ((point.x - n1.x) * dx + (point.y - n1.y) * dy) / (L * L)));
          const projX = n1.x + t * dx;
          const projY = n1.y + t * dy;
          const dist = Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2));

          if (dist < 15) {
            const newLoad: SolverLoad = {
              id: `l${Date.now()}`,
              type: 'point',
              targetType: 'element',
              targetId: elem.id,
              position: t,
              value: 10000,
              angle: 90,
            };
            onChange({ loads: [...state.loads, newLoad], selectedId: newLoad.id });
            break;
          }
        }
      }
    } else if (state.editMode === 'support') {
      // 添加/修改支座
      const clickedNode = state.nodes.find(
        (n) => Math.abs(n.x - point.x) < 20 && Math.abs(n.y - point.y) < 20
      );
      
      if (clickedNode) {
        // 循环切换支座类型
        const types: SupportType[] = ['none', 'pinned', 'roller', 'fixed'];
        const currentIdx = types.indexOf(clickedNode.support);
        const nextType = types[(currentIdx + 1) % types.length];
        const fixedDOF = {
          fixed: { dx: true, dy: true, rz: true },
          pinned: { dx: true, dy: true, rz: false },
          roller: { dx: false, dy: true, rz: false },
          none: { dx: false, dy: false, rz: false },
        }[nextType];
        
        onChange({
          nodes: state.nodes.map((n) =>
            n.id === clickedNode.id ? { ...n, support: nextType, fixedDOF } : n
          ),
          selectedId: clickedNode.id,
        });
      }
    }
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onChange({
        viewOffset: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        },
      });
      return;
    }

    if (isDragging && dragTarget) {
      const point = getSvgPoint(e);
      
      if (dragTarget.type === 'node') {
        onChange({
          nodes: state.nodes.map((n) =>
            n.id === dragTarget.id ? { ...n, x: point.x, y: point.y } : n
          ),
        });
      } else if (dragTarget.type === 'load') {
        const load = state.loads.find((l) => l.id === dragTarget.id);
        if (load && load.targetType === 'element') {
          const elem = state.elements.find((el) => el.id === load.targetId);
          if (elem) {
            const n1 = state.nodes.find((n) => n.id === elem.nodeStart);
            const n2 = state.nodes.find((n) => n.id === elem.nodeEnd);
            if (n1 && n2) {
              const dx = n2.x - n1.x;
              const dy = n2.y - n1.y;
              const L = Math.sqrt(dx * dx + dy * dy);
              const t = Math.max(0, Math.min(1, ((point.x - n1.x) * dx + (point.y - n1.y) * dy) / (L * L)));
              onChange({
                loads: state.loads.map((l) =>
                  l.id === dragTarget.id ? { ...l, position: t } : l
                ),
              });
            }
          }
        }
      }
    }

    // 更新临时线
    if (tempLine && firstNodeId) {
      const point = getSvgPoint(e);
      setTempLine({ ...tempLine, x2: point.x, y2: point.y });
    }
  };

  // 鼠标释放
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    setIsPanning(false);
  };

  // 开始拖拽
  const startDrag = (type: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.editMode === 'select') {
      setIsDragging(true);
      setDragTarget({ type, id });
      onChange({ selectedId: id });
    }
  };

  // 选择项目
  const selectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ selectedId: id });
  };

  // 缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, state.viewScale * delta));
    onChange({ viewScale: newScale });
  };

  // 渲染支座
  const renderSupport = (node: SolverNode) => {
    const size = 20;
    switch (node.support) {
      case 'fixed':
        return (
          <g>
            <rect x={-size/2} y={-size} width={size} height={size} fill="url(#hatchPattern)" stroke="#64748b" strokeWidth="2" />
            <line x1={-size/2} y1={0} x2={size/2} y2={0} stroke="#64748b" strokeWidth="3" />
          </g>
        );
      case 'pinned':
        return (
          <g>
            <polygon points={`0,0 ${-size/2},${size} ${size/2},${size}`} fill="url(#hatchPattern)" stroke="#64748b" strokeWidth="2" />
            <circle cx={0} cy={0} r={4} fill="white" stroke="#64748b" strokeWidth="2" />
          </g>
        );
      case 'roller':
        return (
          <g>
            <polygon points={`0,0 ${-size/2},${size*0.7} ${size/2},${size*0.7}`} fill="url(#hatchPattern)" stroke="#64748b" strokeWidth="2" />
            <circle cx={0} cy={0} r={4} fill="white" stroke="#64748b" strokeWidth="2" />
            <circle cx={-size/3} cy={size*0.85} r={4} fill="#cbd5e1" stroke="#64748b" />
            <circle cx={size/3} cy={size*0.85} r={4} fill="#cbd5e1" stroke="#64748b" />
            <line x1={-size/2} y1={size} x2={size/2} y2={size} stroke="#64748b" strokeWidth="2" />
          </g>
        );
      default:
        return null;
    }
  };

  // 渲染荷载
  const renderLoad = (load: SolverLoad) => {
    const isSelected = state.selectedId === load.id;
    const color = isSelected ? "#4f46e5" : "#e11d48";
    const momentColor = isSelected ? "#4f46e5" : "#f59e0b";
    const markerId = isSelected ? "url(#arrowForceSelected)" : "url(#arrowForce)";
    
    // 均布荷载或三角形荷载
    if (load.type === 'distributed' || load.type === 'triangular') {
      const elem = state.elements.find((e) => e.id === load.targetId);
      if (!elem) return null;
      const n1 = state.nodes.find((n) => n.id === elem.nodeStart);
      const n2 = state.nodes.find((n) => n.id === elem.nodeEnd);
      if (!n1 || !n2) return null;
      
      const arrowCount = 8;
      const baseArrowLength = 30;
      const q1 = load.value;
      const q2 = load.valueEnd ?? (load.type === 'distributed' ? load.value : 0);
      const maxQ = Math.max(q1, q2, 1);
      
      return (
        <g
          key={load.id}
          onClick={(e) => selectItem(load.id, e)}
          className="cursor-pointer"
        >
          {/* 顶部连线 - 对于三角形荷载是斜线 */}
          <line
            x1={n1.x}
            y1={n1.y - (q1 / maxQ) * baseArrowLength}
            x2={n2.x}
            y2={n2.y - (q2 / maxQ) * baseArrowLength}
            stroke={color}
            strokeWidth={2}
          />
          {/* 箭头阵列 */}
          {Array.from({ length: arrowCount }, (_, i) => {
            const t = i / (arrowCount - 1);
            const ax = n1.x + t * (n2.x - n1.x);
            const ay = n1.y + t * (n2.y - n1.y);
            const qAtT = q1 + (q2 - q1) * t;
            const arrowLen = (qAtT / maxQ) * baseArrowLength;
            if (arrowLen < 5) return null;
            return (
              <line
                key={i}
                x1={ax}
                y1={ay - arrowLen}
                x2={ax}
                y2={ay - 5}
                stroke={color}
                strokeWidth={1.5}
                markerEnd={markerId}
              />
            );
          })}
          {/* 标注 */}
          <text
            x={(n1.x + n2.x) / 2}
            y={Math.min(n1.y, n2.y) - baseArrowLength - 8}
            fontSize="10"
            fill={color}
            fontWeight="bold"
            textAnchor="middle"
          >
            {load.type === 'triangular' 
              ? `q: ${q1}→${q2} N/m`
              : `q = ${load.value} N/m`}
          </text>
        </g>
      );
    }
    
    let x = 0, y = 0;
    
    if (load.targetType === 'node') {
      const node = state.nodes.find((n) => n.id === load.targetId);
      if (!node) return null;
      x = node.x;
      y = node.y;
    } else {
      const elem = state.elements.find((e) => e.id === load.targetId);
      if (!elem) return null;
      const n1 = state.nodes.find((n) => n.id === elem.nodeStart);
      const n2 = state.nodes.find((n) => n.id === elem.nodeEnd);
      if (!n1 || !n2) return null;
      const t = load.position ?? 0.5;
      x = n1.x + t * (n2.x - n1.x);
      y = n1.y + t * (n2.y - n1.y);
    }

    const arrowLength = 50;
    const rad = (load.angle * Math.PI) / 180;
    const dx = arrowLength * Math.cos(rad);
    const dy = arrowLength * Math.sin(rad);

    // 力矩 - 使用弧形箭头
    if (load.type === 'moment') {
      const r = 18;
      const direction = load.value >= 0 ? 1 : -1; // 正为逆时针
      return (
        <g
          key={load.id}
          transform={`translate(${x}, ${y})`}
          onMouseDown={(e) => startDrag('load', load.id, e)}
          onClick={(e) => selectItem(load.id, e)}
          className="cursor-pointer"
        >
          {/* 弧形 */}
          <path
            d={`M ${r},0 A ${r},${r} 0 1,${direction > 0 ? 1 : 0} ${-r},0`}
            fill="none"
            stroke={momentColor}
            strokeWidth={isSelected ? 3 : 2}
          />
          {/* 箭头 */}
          <polygon
            points={direction > 0 ? `${-r-6},-4 ${-r},0 ${-r-6},4` : `${-r+6},-4 ${-r},0 ${-r+6},4`}
            fill={momentColor}
          />
          {/* 中心点 */}
          <circle cx={0} cy={0} r={3} fill={momentColor} />
          {/* 标注 */}
          <text x={0} y={-r - 8} fontSize="10" fill={momentColor} fontWeight="bold" textAnchor="middle">
            M = {Math.abs(load.value)} Nm
          </text>
        </g>
      );
    }

    // 集中力
    return (
      <g
        key={load.id}
        onMouseDown={(e) => startDrag('load', load.id, e)}
        onClick={(e) => selectItem(load.id, e)}
        className="cursor-pointer"
      >
        <line
          x1={x - dx}
          y1={y - dy}
          x2={x}
          y2={y}
          stroke={isSelected ? "#4f46e5" : "#e11d48"}
          strokeWidth={isSelected ? 3 : 2}
          markerEnd={markerId}
        />
        <text
          x={x - dx + 10}
          y={y - dy - 5}
          fontSize="10"
          fill={isSelected ? "#4f46e5" : "#e11d48"}
          fontWeight="bold"
        >
          {load.value} N
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 工具栏 */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* 操作按钮 */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button
            onClick={handleSolve}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
            title="计算结构响应"
          >
            <Play className="w-4 h-4" />
            求解
          </button>
          <IconButton icon={RotateCcw} label="重置" tooltip="清空所有内容，重新开始" onClick={handleReset} />
          <IconButton
            icon={Trash2}
            label="删除"
            tooltip="删除选中的项目"
            onClick={handleDelete}
            disabled={!state.selectedId}
            variant="danger"
          />
        </div>

        {/* 视图控制 */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <IconButton
            icon={Grid3X3}
            label="网格"
            tooltip="显示/隐藏网格"
            active={state.showGrid}
            onClick={() => onChange({ showGrid: !state.showGrid })}
          />
          <IconButton
            icon={ZoomOut}
            label="缩小"
            tooltip="缩小视图"
            onClick={() => onChange({ viewScale: Math.max(0.2, state.viewScale / 1.2) })}
          />
          <span className="text-xs text-slate-500 font-mono w-10 text-center">{(state.viewScale * 100).toFixed(0)}%</span>
          <IconButton
            icon={ZoomIn}
            label="放大"
            tooltip="放大视图"
            onClick={() => onChange({ viewScale: Math.min(3, state.viewScale * 1.2) })}
          />
        </div>

        {/* 模板选择 */}
        <select
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 shadow-sm"
          onChange={(e) => {
            const template = SOLVER_TEMPLATES.find((t) => t.name === e.target.value);
            if (template) loadTemplate(template);
          }}
          defaultValue=""
        >
          <option value="" disabled>📋 加载模板</option>
          {SOLVER_TEMPLATES.map((t) => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>

        <div className="flex-1" />
        
        {/* 状态信息 */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Circle className="w-3 h-3" /> {state.nodes.length} 节点
          </span>
          <span className="flex items-center gap-1">
            <Minus className="w-3 h-3" /> {state.elements.length} 单元
          </span>
        </div>
      </div>

      {/* 主内容区 - 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左栏：结构建模 */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" /> 结构建模
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <PropertyPanel state={state} onChange={onChange} />
          </div>
        </div>

        {/* 中栏：结构图 + 内力图 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 结构图 */}
          <div className="flex-1 bg-slate-100 relative overflow-hidden">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="cursor-crosshair"
              style={{ touchAction: 'none' }}
            >
              <defs>
                <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2" />
                </pattern>
                {/* 普通状态的箭头 */}
                <marker id="arrowForce" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#e11d48" />
                </marker>
                {/* 选中状态的箭头 */}
                <marker id="arrowForceSelected" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#4f46e5" />
                </marker>
              </defs>

              <g transform={`translate(${state.viewOffset.x}, ${state.viewOffset.y}) scale(${state.viewScale})`}>
                {/* 网格 */}
                {state.showGrid && (
                  <g opacity={0.3}>
                    {Array.from({ length: 30 }, (_, i) => (
                      <line
                        key={`v${i}`}
                        x1={i * state.gridSize}
                        y1={0}
                        x2={i * state.gridSize}
                        y2={1000}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />
                    ))}
                    {Array.from({ length: 20 }, (_, i) => (
                      <line
                        key={`h${i}`}
                        x1={0}
                        y1={i * state.gridSize}
                        x2={1500}
                        y2={i * state.gridSize}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />
                    ))}
                  </g>
                )}

                {/* 单元 */}
                {state.elements.map((elem) => {
                  const n1 = state.nodes.find((n) => n.id === elem.nodeStart);
                  const n2 = state.nodes.find((n) => n.id === elem.nodeEnd);
                  if (!n1 || !n2) return null;
                  
                  const isSelected = state.selectedId === elem.id;
                  
                  return (
                    <g key={elem.id}>
                      <line
                        x1={n1.x}
                        y1={n1.y}
                        x2={n2.x}
                        y2={n2.y}
                        stroke={isSelected ? "#4f46e5" : "#475569"}
                        strokeWidth={isSelected ? 8 : 6}
                        strokeLinecap="round"
                        onClick={(e) => selectItem(elem.id, e)}
                        className="cursor-pointer"
                      />
                      {elem.type === 'beam' && (
                        <line
                          x1={n1.x}
                          y1={n1.y}
                          x2={n2.x}
                          y2={n2.y}
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  );
                })}

                {/* 临时连线 */}
                {tempLine && (
                  <line
                    x1={tempLine.x1}
                    y1={tempLine.y1}
                    x2={tempLine.x2}
                    y2={tempLine.y2}
                    stroke="#4f46e5"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    pointerEvents="none"
                  />
                )}

                {/* 节点 */}
                {state.nodes.map((node) => {
                  const isSelected = state.selectedId === node.id;
                  const isFirstNode = firstNodeId === node.id;
                  
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => startDrag('node', node.id, e)}
                      onClick={(e) => selectItem(node.id, e)}
                      className="cursor-move"
                    >
                      {/* 支座 */}
                      {renderSupport(node)}
                      
                      {/* 节点圆 */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isSelected || isFirstNode ? 10 : 8}
                        fill={isFirstNode ? "#f59e0b" : isSelected ? "#4f46e5" : "#1e293b"}
                        stroke="white"
                        strokeWidth={2}
                      />
                      
                      {/* 节点标签 */}
                      <text
                        x={12}
                        y={-12}
                        fontSize="10"
                        fill="#64748b"
                        fontWeight="bold"
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}

                {/* 荷载 */}
                {state.loads.map(renderLoad)}
              </g>
            </svg>

            {/* 操作提示 */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs text-slate-500">
              点击选择 | 拖拽移动 | Alt+拖拽平移 | 滚轮缩放
            </div>
          </div>

          {/* 内力图区域 */}
          <div 
            className="border-t border-slate-200 bg-white flex-shrink-0 relative"
            style={{ height: diagramHeight }}
          >
            {/* 拖拽手柄 */}
            <div
              className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-indigo-500 z-10 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
            
            <div className="h-full flex">
              {/* 剪力图 */}
              <div className="flex-1 border-r border-slate-100 p-1 overflow-hidden">
                <DiagramPanel state={state} diagramType="shear" />
              </div>
              {/* 弯矩图 */}
              <div className="flex-1 border-r border-slate-100 p-1 overflow-hidden">
                <DiagramPanel state={state} diagramType="moment" />
              </div>
              {/* 挠度图 */}
              <div className="flex-1 p-1 overflow-hidden">
                <DiagramPanel state={state} diagramType="deflection" />
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：计算结果 */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-500" /> 计算结果
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <CalculationPanel state={state} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolverModule;
