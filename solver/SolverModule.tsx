import { ModelingPanel as DetailedModelingPanel } from "./components/ModelingPanel";
import type { SolverModel } from "../experiments/schema";
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
  Scan,
  Layers,
  Hand,
  PencilLine,
  SlidersHorizontal,
  Magnet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LatexRenderer } from "../components";
import { SolverTrussResults } from "../components/SolverTrussResults";
import { DiagramPanel as ResultDiagramPanel } from './components/DiagramPanel';
import './solver-workbench.css';
import { SolverLoadGlyph } from './components/SolverLoadGlyph';
import { fitSolverView } from './view';
import { DEFAULT_MEMBER, drawMember, drawingPoint, ensureDrawingNode, nearestNode, nearestMember, placeDrawingLoad, supportDOF } from './drawing';
import type { DrawingPoint, DrawingLoad } from './drawing';
import { NumericInput } from '../components/NumericInput';
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
      aria-label={label}
      aria-pressed={active}
      title={tooltip || label}
      className={`solver-icon-button ${baseClass} ${variantClass} ${disabledClass}`}
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
  return <DetailedModelingPanel state={state} onChange={onChange} />;
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
      <div className="solver-empty-results" role="status"><Calculator size={26}/><strong>{state.result ? '模型需要检查' : '结果将在这里呈现'}</strong><p>{state.result?.message || '完成节点、单元与荷载设置后，点击「求解结构」。'}</p><span>支座反力 · 截面内力 · 应力与位移</span></div>
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
    
    if (n1 && n2 && elem.type === 'beam' && n2.x > n1.x && Math.abs(n2.y - n1.y) < 1e-9 && Math.abs(Math.cos(load.angle * Math.PI / 180)) < 1e-10 && !(n2.support === 'fixed' && n1.support === 'none')) {
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
        const P = load.value * Math.sin(load.angle * Math.PI / 180);
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">简支梁集中力公式:</div>
            <LatexRenderer formula={`R_A = \\frac{Pb}{L} = ${(P * b / L).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`R_B = \\frac{Pa}{L} = ${(P * a / L).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_{max} = \\frac{Pab}{L} = ${(P * a * b / L / 1000).toFixed(2)} \\text{ Nm}`} />
          </div>
        );
      } else if (isSimplySupported && load.type === 'distributed') {
        const q = load.value * Math.sin(load.angle * Math.PI / 180);
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">简支梁均布荷载公式:</div>
            <LatexRenderer formula={`R_A = R_B = \\frac{qL}{2} = ${(q * L / 2000).toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_{max} = \\frac{qL^2}{8} = ${(q * L * L / 8 / 1000000).toFixed(2)} \\text{ Nm}`} />
            <LatexRenderer formula={`w_{max} = \\frac{5qL^4}{384EI}`} />
          </div>
        );
      } else if (isCantilever && load.type === 'point') {
        const P = load.value * Math.sin(load.angle * Math.PI / 180);
        formulaContent = (
          <div className="mt-2 pt-2 border-t border-indigo-200">
            <div className="text-[10px] text-indigo-800 mb-1">悬臂梁集中力公式:</div>
            <LatexRenderer formula={`R_A = P = ${P.toFixed(1)} \\text{ N}`} />
            <LatexRenderer formula={`M_A = -Pa = ${(-P * a / 1000).toFixed(2)} \\text{ Nm}`} />
            <LatexRenderer formula={`w_{max} = \\frac{Pa^3}{3EI}`} />
          </div>
        );
      } else if (isCantilever && load.type === 'distributed') {
        const q = load.value * Math.sin(load.angle * Math.PI / 180);
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
  
  if (state.elements.every(e => e.type === 'truss')) {
    formulaContent = <div className="mt-2 pt-2 border-t border-indigo-200">
      <div className="text-[10px] text-indigo-800 mb-1">铰接桁架 · 节点平衡与杆件伸缩</div>
      <LatexRenderer formula={String.raw`\sum F_x=0,\quad\sum F_y=0`} />
      <LatexRenderer formula={String.raw`\sigma=\frac{N}{A},\qquad\Delta L=\frac{NL}{EA}`} />
      <p className="text-[10px] text-slate-500">杆端理想铰接，杆件为二力杆；不套用梁的弯曲、剪切挠度公式。</p>
    </div>;
  }
  // 没有匹配标准工况的梁或框架，显示通用截面关系。
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
    <div className="solver-calculations text-xs">
      {/* 结构概览 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">结构概览</h4>
        <div className="bg-slate-50 p-2 rounded border text-[11px] space-y-1">
          <div>节点: {state.nodes.length} 个 | 单元: {state.elements.length} 个 | 荷载: {state.loads.length} 个</div>
          <div>单元总长: {totalLength.toFixed(0)} mm</div>
        </div>
      </div>

      {/* 支座反力 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">支座反力</h4>
        <p className="text-[10px] text-slate-500 mb-2">全局 x 向右、y 向下；Fy 负值为向上。下列 R 公式以向上为正。</p>
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
        </div>
      </div>

      {/* 最大内力 - 区分梁和桁架 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">最大内力</h4>
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
        <h4 className="font-semibold text-slate-700 mb-2">节点位移</h4>
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
        <h4 className="font-semibold text-slate-700 mb-2">应力分析</h4>
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
                  <span>最大正应力 σ_max:</span>
                  <span className="font-medium">{elem.maxStress.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between">
                  <span>最小正应力 σ_min:</span>
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
                  <span>屈服参考比:</span>
                  <span className={`font-bold ${elem.safetyFactor >= 2 ? 'text-green-600' : elem.safetyFactor >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                    {elem.safetyFactor === Infinity ? '∞' : elem.safetyFactor.toFixed(2)}
                    {elem.safetyFactor < 1 && ' · 超参考'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  屈服参考: {yieldStrength} MPa；未含压杆失稳与局部稳定验算。
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <details className="solver-principle"><summary>计算原理与公式</summary>{formulaContent}</details>

      {/* 应变能 */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-2">应变能</h4>
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
    
    const elemResult = result.elements[i];
    if (elemResult) {
      const forces = elemResult.internalForces;
      
      // 如果只有一个点，直接添加
      if (forces.length < 2) {
        forces.forEach(f => {
          allForces.push({
            x: totalLength + f.position * L,
            V: f.V,
            M: f.M,
            elemIdx: i,
          });
        });
      } else {
        // 多点插值
        for (let j = 0; j < forces.length - 1; j++) {
          const f1 = forces[j];
          const f2 = forces[j+1];
          
          // 添加这一段的起始点
          // 只有当它是第一个点，或者它与上一个点位置不同时才添加（避免重复）
          if (j === 0 || f1.position > forces[j-1].position + 0.0001) {
             allForces.push({
              x: totalLength + f1.position * L,
              V: f1.V,
              M: f1.M,
              elemIdx: i,
            });
          }
          
          const segmentLen = (f2.position - f1.position) * L;
          
          // 如果两点重合（例如集中力处的突变），直接跳过插值，只添加点
          if (segmentLen <= 0.001) {
             continue;
          }

          // 自洽推导法：利用 M 和 V 的关系推导这一段的有效物理长度
          // M2 - M1 = Integral(V) ≈ Avg(V) * L_phys
          // => L_phys ≈ (M2 - M1) / ((V1 + V2) / 2)
          // 这种方法不需要知道外部单位制，直接利用内力数据的自洽性
          
          let slope0 = 0;
          let slope1 = 0;
          let useHermite = false;
          
          const deltaM = f2.M - f1.M;
          const avgV = (f1.V + f2.V) / 2;
          
          // 阈值：避免除以零
          if (Math.abs(avgV) > 0.1) { // V 不为 0
             // 计算等效物理长度
             const l_phys = deltaM / avgV;
             
             // 只有当计算出的物理长度为正值（方向一致）时才使用
             // 如果 l_phys < 0，说明 V 的方向定义与 dM/dx 相反，或者数据有噪声
             // 我们取绝对值，并根据 V 的符号调整斜率
             // m = V * L_phys
             // 验证：Integral = avgV * L_phys = avgV * (deltaM/avgV) = deltaM. 正确。
             
             // 实际上，直接用比例即可：
             // m0 = V1 * (deltaM / avgV)
             // m1 = V2 * (deltaM / avgV)
             slope0 = f1.V * (deltaM / avgV);
             slope1 = f2.V * (deltaM / avgV);
             useHermite = true;
          } else {
             // 如果 V ~ 0 (纯弯或弯矩极值点附近)
             // 尝试使用均布荷载 q 推导: V2 - V1 = -q * L_phys
             // L_phys = (V1 - V2) / q
             const elemLoads = state.loads.filter(l => l.targetId === elem.id && (l.type === 'distributed' || l.type === 'triangular'));
             let avgQ = 0;
             elemLoads.forEach(l => {
                const q1 = l.value;
                const q2 = l.valueEnd ?? l.value;
                avgQ += (q1 + q2) / 2;
             });
             
             if (Math.abs(avgQ) > 0.001 && Math.abs(f1.V - f2.V) > 0.001) {
                 const l_phys = Math.abs((f1.V - f2.V) / avgQ);
                 // 这种情况下 dM/dx = V (通常)
                 // 我们需要确定符号。如果 V 从正变负，M 应该是凸的（斜率从正变负）。
                 // l_phys 是正的。
                 // 还需要判断 V 和 dM/dx 的符号关系。通常是一致的。
                 slope0 = f1.V * l_phys;
                 slope1 = f2.V * l_phys;
                 useHermite = true;
             }
             // 如果都算不出来，useHermite = false，退化为线性插值
          }

          // 插值中间点
          const steps = 20;
          for (let k = 1; k < steps; k++) {
            const t = k / steps;
            const xLocal = t * segmentLen;
            
            // 剪力 V (线性插值)
            const V = f1.V + (f2.V - f1.V) * t;
            
            let M = 0;
            if (useHermite) {
                const t2 = t * t;
                const t3 = t2 * t;
                const h00 = 2 * t3 - 3 * t2 + 1;
                const h10 = t3 - 2 * t2 + t;
                const h01 = -2 * t3 + 3 * t2;
                const h11 = t3 - t2;
                
                M = h00 * f1.M + h10 * slope0 + h01 * f2.M + h11 * slope1;
            } else {
                // 线性插值
                M = f1.M + (f2.M - f1.M) * t;
            }
            
            allForces.push({
              x: totalLength + (f1.position * L) + xLocal,
              V: V,
              M: M,
              elemIdx: i,
            });
          }
        }
        
        // 添加最后一个点
        const lastF = forces[forces.length - 1];
        allForces.push({
          x: totalLength + lastF.position * L,
          V: lastF.V,
          M: lastF.M,
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
  } else {
    // 剪力图和弯矩图
    allForces.forEach((f, i) => {
      const x = padding + (f.x / totalLength) * plotWidth;
      let y: number;
      if (diagramType === 'shear') {
        y = height / 2 - (f.V / maxV) * (plotHeight / 2) * 0.8;
      } else {
        y = height / 2 + (f.M / maxM) * (plotHeight / 2) * 0.8;
      }
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
export const SolverModule = ({ model, onModelChange, onBeginGesture, onEndGesture }: { model: SolverModel; onModelChange: (model: SolverModel) => void; onBeginGesture?: () => void; onEndGesture?: () => void }) => {
  const [ui, setUI] = useState<Omit<SolverState, 'nodes' | 'elements' | 'loads'>>(DEFAULT_SOLVER_STATE);
  const resultModel = useRef<SolverModel | null>(null);
  const state: SolverState = { ...ui, nodes: model.nodes, elements: model.elements, loads: model.loads, result: resultModel.current === model ? ui.result : null };
  const latestState = useRef(state); latestState.current = state;
  const setState = (update: React.SetStateAction<SolverState>) => {
    const previous = latestState.current;
    const next = typeof update === 'function' ? update(previous) : update;
    latestState.current = next;
    if (next.result && next.result !== previous.result) resultModel.current = model;
    const { nodes, elements, loads, ...nextUI } = next;
    setUI(nextUI);
    if (nodes !== model.nodes || elements !== model.elements || loads !== model.loads) onModelChange({ kind: 'solver', coordinateUnit: 'mm', nodes, elements, loads });
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gestureActive=useRef(false);
  const endGesture=useRef(onEndGesture);endGesture.current=onEndGesture;
  useEffect(()=>()=>{if(gestureActive.current)endGesture.current?.();},[]);
  const [dragTarget, setDragTarget] = useState<{ type: string; id: string } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [drawStart, setDrawStart] = useState<DrawingPoint | null>(null);
  const [cursorPoint, setCursorPoint] = useState<DrawingPoint | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [memberDefaults, setMemberDefaults] = useState(DEFAULT_MEMBER);
  const [supportKind, setSupportKind] = useState<SupportType>('pinned');
  const [loadDefaults, setLoadDefaults] = useState<DrawingLoad>({type:'point',value:10000,angle:90});
  const [feedback, setFeedback] = useState('选择工具后直接在画布操作，或载入示例。');
  const [precisionOpen, setPrecisionOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'selection' | 'tree' | 'results'>('tree');
  const [chartOpen, setChartOpen] = useState(false);

  // 内力图高度调整
  const [diagramHeight, setDiagramHeight] = useState(248);
  const [diagramType, setDiagramType] = useState<'axial' | 'shear' | 'moment' | 'deflection'>('moment');
  const [isResizing, setIsResizing] = useState(false);

  const fitView = () => {
    const rect=svgRef.current?.getBoundingClientRect();
    if(rect)setUI(prev=>{const view=fitSolverView(latestState.current.nodes,rect.width,rect.height);if(rect.height<280)view.viewOffset.y-=24;return {...prev,...view};});
  };
  useEffect(() => {
    fitView();
    const canvas = svgRef.current;
    if (!canvas) return;
    let previousWidth = canvas.getBoundingClientRect().width;
    // 分栏、导航和小屏切换后重新适配；拖动图表高度不打断用户视角。
    const observer = new ResizeObserver(([entry]) => {
      if (Math.abs(entry.contentRect.width - previousWidth) < 1) return;
      previousWidth = entry.contentRect.width;
      fitView();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(()=>{fitView();},[chartOpen]);

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

  const onChange = (updates: Partial<SolverState>) => {
    setState((prev) => {
      // 如果修改了节点、单元或荷载，清除之前的结果
      const modelChanged = updates.nodes || updates.elements || updates.loads;
      if (modelChanged && !isDragging) setChartOpen(false);
      if (updates.selectedId) setInspectorTab('selection');
      return { 
        ...prev, 
        ...updates,
        // 模型改变时清除结果，强制重新求解
        ...(modelChanged ? { result: null } : {})
      };
    });
  };

  // 加载模板
  const loadTemplate = (template: SolverTemplate) => {
    setChartOpen(false);setDrawStart(null);setTempLine(null);setInspectorTab('tree');setFeedback(`已载入${template.name}，可直接点选修改或继续绘制。`);
    const rect=svgRef.current?.getBoundingClientRect();
    setState({
      ...DEFAULT_SOLVER_STATE,
      ...(rect?fitSolverView(template.nodes,rect.width,rect.height):{}),
      nodes: JSON.parse(JSON.stringify(template.nodes)),
      elements: JSON.parse(JSON.stringify(template.elements)),
      loads: JSON.parse(JSON.stringify(template.loads)),
    });
  };

  // 求解
  const handleSolve = () => {
    const result = solveUnified(state.nodes, state.elements, state.loads);
    setState(prev => ({ ...prev, result, showResults: true, editMode:'select' }));
    setDrawStart(null);setTempLine(null);setFeedback(result.success?'计算已更新，点选对象可继续修改模型。':result.message);
    setInspectorTab('results'); setChartOpen(result.success);
  };

  // 重置
  const handleReset = () => {
    setState(DEFAULT_SOLVER_STATE);
    setDrawStart(null); setTempLine(null); setChartOpen(false); setInspectorTab('tree');
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

  const rawSvgPoint = (event: {clientX:number;clientY:number}): DrawingPoint => {
    const rect=svgRef.current?.getBoundingClientRect();
    return rect ? {x:(event.clientX-rect.left-state.viewOffset.x)/state.viewScale,y:(event.clientY-rect.top-state.viewOffset.y)/state.viewScale} : {x:0,y:0};
  };
  const getSvgPoint = (event: {clientX:number;clientY:number;shiftKey?:boolean}) => {
    const raw=rawSvgPoint(event);
    if((state.editMode==='element'||state.editMode==='node')&&!event.shiftKey&&!nearestNode(state.nodes,raw,9/state.viewScale)){
      const hit=nearestMember(model,raw,9/state.viewScale);if(hit)return hit.point;
    }
    return drawingPoint(state.nodes,raw,snapEnabled?state.gridSize:null,9/state.viewScale,drawStart??undefined,!!event.shiftKey);
  };
  const setTool = (tool: SolverState['editMode']) => {
    onChange({editMode:tool}); setDrawStart(null); setTempLine(null);if(tool!=='select'&&tool!=='pan')setChartOpen(false);
    const hints = {select:'点击对象编辑；拖动节点或荷载；Delete 删除选中对象。',element:'点选两端画杆，自动连接已有节点；交叉无节点时不连接。Esc 结束，Shift 正交。',node:'点击空白位置添加节点，靠近已有节点时自动吸附。',support:'点击节点放置所选支座，可连续施加。',load:'点击节点或杆件放置荷载，空白处不会生成荷载。',pan:'拖动画布平移，滚轮缩放；V 返回选择。'};
    setFeedback(hints[tool]);
  };
  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button===1 || event.altKey || state.editMode==='pan') {
      event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true); setPanStart({x:event.clientX-state.viewOffset.x,y:event.clientY-state.viewOffset.y}); return;
    }
    if(event.button!==0) return;
    const raw=rawSvgPoint(event), point=getSvgPoint(event);
    if(state.editMode==='select') { onChange({selectedId:null}); return; }
    event.preventDefault();
    if(state.editMode==='element') {
      if(!drawStart) {setDrawStart(point);setTempLine({x1:point.x,y1:point.y,x2:point.x,y2:point.y});setFeedback('起点已选，点击终点；Shift 正交，Esc 取消。');return;}
      const next=drawMember(model,drawStart,point,memberDefaults,9/state.viewScale);
      setFeedback(next.message);
      if(next.model!==model) { onChange({nodes:next.model.nodes,elements:next.model.elements,loads:next.model.loads,selectedId:next.selectedId}); setDrawStart(next.end!); setTempLine({x1:next.end!.x,y1:next.end!.y,x2:next.end!.x,y2:next.end!.y}); }
      return;
    }
    if(state.editMode==='node') {
      const old=nearestNode(state.nodes,point,9/state.viewScale);
      if(old) {onChange({selectedId:old.id});setFeedback(`已吸附节点 ${old.id}。`);return;}
      const next=ensureDrawingNode(model,point,9/state.viewScale);onChange({nodes:next.model.nodes,elements:next.model.elements,loads:next.model.loads,selectedId:next.node.id});setFeedback(`已添加 ${next.node.id}，杆件中部的节点会自动连接。`);return;
    }
    if(state.editMode==='support') {
      const node=nearestNode(state.nodes,raw,14/state.viewScale);
      if(!node) {setFeedback('支座只能放在节点上，请点击已有节点。');return;}
      onChange({nodes:state.nodes.map(n=>n.id===node.id?{...n,support:supportKind,fixedDOF:supportDOF(supportKind)}:n),selectedId:node.id});setFeedback(`已更新 ${node.id} 的支座。`);return;
    }
    const next=placeDrawingLoad(model,raw,loadDefaults,12/state.viewScale);
    setFeedback(next.message);
    if(next.model!==model) onChange({nodes:next.model.nodes,elements:next.model.elements,loads:next.model.loads,selectedId:next.selectedId});
  };
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if(isPanning) {onChange({viewOffset:{x:event.clientX-panStart.x,y:event.clientY-panStart.y}});return;}
    const point=getSvgPoint(event);
    setCursorPoint(previous=>previous?.x===point.x&&previous?.y===point.y?previous:point);
    if(isDragging&&dragTarget) {
      if(dragTarget.type==='node') onChange({nodes:state.nodes.map(n=>n.id===dragTarget.id?{...n,...point}:n)});
      else {
        const load=state.loads.find(l=>l.id===dragTarget.id);
        const element=load?.targetType==='element' ? state.elements.find(e=>e.id===load.targetId) : undefined;
        if(element) {
          const hit=nearestMember({...model,elements:[element]},rawSvgPoint(event),Number.MAX_VALUE);
          if(hit) onChange({loads:state.loads.map(l=>l.id===load!.id?{...l,position:hit.position}:l)});
        }
      }
    }
    if(drawStart) setTempLine({x1:drawStart.x,y1:drawStart.y,x2:point.x,y2:point.y});
  };
  const handlePointerUp = () => {setIsDragging(false);setDragTarget(null);setIsPanning(false);if(gestureActive.current){gestureActive.current=false;endGesture.current?.();}};
  const startDrag = (type: string,id: string,event: React.PointerEvent) => {
    if(state.editMode!=='select'||event.altKey||event.button!==0) return;
    event.stopPropagation(); gestureActive.current=true;onBeginGesture?.();
    svgRef.current?.setPointerCapture(event.pointerId);
    setIsDragging(true);setDragTarget({type,id});onChange({selectedId:id});
  };
  const selectItem = (id: string,event: React.MouseEvent) => {
    if(state.editMode!=='select') return;
    event.stopPropagation();onChange({selectedId:id});
  };
  const handleWheel = (event: React.WheelEvent) => {
    const rect=svgRef.current?.getBoundingClientRect(); if(!rect)return;
    const previous=state.viewScale, scale=Math.max(.02,Math.min(5,previous*(event.deltaY>0?.9:1.1)));
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    onChange({viewScale:scale,viewOffset:{x:x-(x-state.viewOffset.x)*scale/previous,y:y-(y-state.viewOffset.y)*scale/previous}});
  };
  useEffect(()=>{
    const keyboard=(event:KeyboardEvent)=>{
      if(event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && (event.target.closest('input,textarea,select') || event.target.isContentEditable)))return;
      const keys:Record<string,SolverState['editMode']>={v:'select',d:'element',n:'node',s:'support',l:'load',h:'pan'};
      if(event.key==='Escape') {event.preventDefault();setTool('select');}
      else if(event.key==='Delete'||event.key==='Backspace') {if(state.selectedId){event.preventDefault();handleDelete();}}
      else if(keys[event.key.toLowerCase()]) {event.preventDefault();setTool(keys[event.key.toLowerCase()]);}
    };
    window.addEventListener('keydown',keyboard);window.addEventListener('pointerup',handlePointerUp);window.addEventListener('pointercancel',handlePointerUp);
    return ()=>{window.removeEventListener('keydown',keyboard);window.removeEventListener('pointerup',handlePointerUp);window.removeEventListener('pointercancel',handlePointerUp);};
  });

  // 工程教材式支承符号：三角形、滚轮与地基分层表达。
  const renderSupport = (node: SolverNode) => {
    const ground = (y: number) => <g stroke="var(--sw-muted)" strokeWidth="1.2"><line x1={-15} x2={15} y1={y} y2={y}/>{[-12,-6,0,6,12].map(x => <line key={x} x1={x} x2={x-4} y1={y} y2={y+5}/>)}</g>;
    if (node.support === 'fixed') {
      const element = state.elements.find(item => item.nodeStart === node.id || item.nodeEnd === node.id);
      const other = state.nodes.find(item => item.id === (element?.nodeStart === node.id ? element.nodeEnd : element?.nodeStart));
      const angle = other ? Math.atan2(other.y-node.y, other.x-node.x)*180/Math.PI : 0;
      return <g transform={`rotate(${angle})`}><rect x={-13} y={-24} width={11} height={48} fill="url(#hatchPattern)"/><line x1={-2} x2={-2} y1={-24} y2={24} stroke="var(--sw-structure)" strokeWidth="2"/></g>;
    }
    if (node.support === 'pinned') return <g><polygon points="0,2 -12,23 12,23" fill="var(--sw-bg)" stroke="var(--sw-structure)" strokeWidth="1.5"/>{ground(27)}</g>;
    if (node.support === 'roller') return <g><polygon points="0,2 -12,20 12,20" fill="var(--sw-bg)" stroke="var(--sw-structure)" strokeWidth="1.5"/>{[-7,7].map(x => <circle key={x} cx={x} cy={25} r={4} fill="none" stroke="var(--sw-structure)" strokeWidth="1.3"/>)}{ground(32)}</g>;
    return null;
  };

  const renderLoad = (load:SolverLoad) => <SolverLoadGlyph key={load.id} load={load} nodes={state.nodes} elements={state.elements} viewScale={state.viewScale} selected={state.selectedId===load.id} onPointerDown={event=>startDrag('load',load.id,event)} onClick={event=>selectItem(load.id,event)}/>;

  return (
    <div className="solver-workbench solver-draw-workbench flex flex-col h-full overflow-hidden" data-precision={precisionOpen}>
      <header className="solver-toolbar">
        <div className="solver-toolbar-title"><Layers size={17}/><strong>结构工作台</strong><span className="solver-unit-note">N · mm · MPa</span></div>
        <label className="solver-template-picker"><span>示例模型</span>
          <select aria-label="加载结构模板" value="" onChange={event => {
            const template = SOLVER_TEMPLATES.find(item => item.name === event.target.value);
            if (template) loadTemplate(template);
          }}>
            <option value="" disabled>选择工况</option>
            {SOLVER_TEMPLATES.map(template => <option key={template.name} value={template.name}>{template.name}</option>)}
          </select>
        </label>
        <button className="solver-precision-toggle" aria-pressed={precisionOpen} onClick={()=>setPrecisionOpen(value=>!value)}><SlidersHorizontal size={14}/>精确输入</button>
        <div className="solver-solve-state" role="status" data-state={state.result?.success ? 'success' : state.result ? 'error' : 'pending'}>
          <span/>{state.result?.success ? '计算已更新' : state.result ? '检查模型' : '等待求解'}
        </div>
        <div className="solver-primary-actions">
          <IconButton icon={RotateCcw} label="重置" tooltip="清空模型，可通过实验历史撤销" onClick={handleReset}/>
          <IconButton icon={Trash2} label="删除" tooltip="删除选中对象及关联对象" onClick={handleDelete} disabled={!state.selectedId} variant="danger"/>
          <button className="solver-solve-button" onClick={handleSolve}><Play size={14}/>求解结构</button>
        </div>
      </header>

      {/* 主内容区 - 三栏布局 */}
      <div className="solver-body flex-1 flex overflow-hidden">
        {/* 左栏：结构建模 */}
        <div className="solver-model-panel w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="solver-panel-heading">
            <h3>
              <Settings size={15}/> 结构建模
            </h3>
          </div>
          <div className="solver-panel-scroll">
            <PropertyPanel state={state} onChange={onChange} />
          </div>
        </div>

        {/* 中栏：结构图 + 内力图 */}
        <div className="solver-canvas-panel flex-1 flex flex-col min-w-0">
          <div className="solver-scene-heading">
            <div><strong>结构与荷载</strong><span>{state.nodes.length} 节点 · {state.elements.length} 单元 · {state.loads.length} 荷载</span></div>
            <div className="solver-view-actions">
              <IconButton icon={Grid3X3} label="网格" active={state.showGrid} onClick={() => onChange({showGrid: !state.showGrid})}/>
              <IconButton icon={ZoomOut} label="缩小" onClick={() => onChange({viewScale: Math.max(0.2, state.viewScale / 1.2)})}/>
              <span>{(state.viewScale * 100).toFixed(0)}%</span>
              <IconButton icon={ZoomIn} label="放大" onClick={() => onChange({viewScale: Math.min(3, state.viewScale * 1.2)})}/>
              <IconButton icon={Scan} label="适应画布" onClick={fitView} disabled={!state.nodes.length}/>
            </div>
          </div>
          <div className="solver-drawing-tools" role="group" aria-label="画布建模工具">
            {([['select',MousePointer,'选择','V'],['element',PencilLine,'画杆件','D'],['node',Circle,'节点','N'],['support',Anchor,'支座','S'],['load',ArrowDown,'荷载','L'],['pan',Hand,'平移','H']] as const).map(([tool,Icon,label,key])=><button key={tool} aria-label={`${label}工具`} aria-pressed={state.editMode===tool} onClick={()=>setTool(tool)} title={`${label} (${key})`}><Icon size={16}/><span>{label}</span><kbd>{key}</kbd></button>)}
          </div>
          <div className="solver-tool-options">
            {state.editMode==='element' ? <><select aria-label="绘制杆件类型" value={memberDefaults.type} onChange={e=>setMemberDefaults({...memberDefaults,type:e.target.value as 'beam'|'truss'})}><option value="beam">梁 / 刚架</option><option value="truss">桁架杆</option></select><NumericInput label="宽 b" value={memberDefaults.width} onChange={width=>setMemberDefaults({...memberDefaults,width})} unit="mm" domain="positive" compact/><NumericInput label="高 h" value={memberDefaults.height} onChange={height=>setMemberDefaults({...memberDefaults,height})} unit="mm" domain="positive" compact/><NumericInput label="E" value={memberDefaults.E/1000} onChange={E=>setMemberDefaults({...memberDefaults,E:E*1000})} unit="GPa" domain="positive" compact/><button disabled={!drawStart} className="solver-finish-drawing" onClick={()=>{setDrawStart(null);setTempLine(null);setFeedback('本段绘制已结束，点击新的起点可继续。');}}>结束连画</button></> :
              state.editMode==='support' ? <><span>支座类型</span><select aria-label="画布支座类型" value={supportKind} onChange={e=>setSupportKind(e.target.value as SupportType)}><option value="pinned">铰支座</option><option value="roller">滚动支座</option><option value="fixed">固定端</option><option value="none">移除支座</option></select><small>点击节点施加约束；滚动支座约束竖向位移</small></> :
              state.editMode==='load' ? <><select aria-label="画布荷载类型" value={loadDefaults.type} onChange={e=>setLoadDefaults({...loadDefaults,type:e.target.value as DrawingLoad['type']})}><option value="point">集中力</option><option value="distributed">均布荷载</option><option value="moment">集中力矩</option></select><NumericInput label="大小" value={loadDefaults.value/1000} onChange={v=>setLoadDefaults({...loadDefaults,value:v*1000})} unit={loadDefaults.type==='distributed'?'kN/m':loadDefaults.type==='moment'?'kN·m':'kN'} domain="signed" compact/>{loadDefaults.type==='moment'&&<small>正值顺时针，负值逆时针</small>}{loadDefaults.type!=='moment'&&<select aria-label="画布荷载方向" value={loadDefaults.angle} onChange={e=>setLoadDefaults({...loadDefaults,angle:Number(e.target.value)})}><option value={90}>↓ 向下</option><option value={270}>↑ 向上</option><option value={0}>→ 向右</option><option value={180}>← 向左</option></select>}</> : <span>{state.editMode==='pan'?'拖动画布移动视角':'点选对象查看属性，可用精确输入添加复杂截面与荷载'}</span>}
            <div className="solver-snap-options"><button aria-label="网格吸附" aria-pressed={snapEnabled} onClick={()=>setSnapEnabled(v=>!v)}><Magnet size={14}/><span>吸附</span></button><select aria-label="网格间距" value={state.gridSize} onChange={e=>onChange({gridSize:Number(e.target.value)})}>{[10,50,100,500].map(size=><option key={size} value={size}>{size} mm</option>)}</select></div>
          </div>
          {/* 结构图 */}
          <div className="solver-scene flex-1 relative overflow-hidden" data-grid={state.showGrid}>
            {!state.nodes.length && state.editMode==='select' && <div className="solver-empty-scene"><PencilLine size={30}/><strong>直接画出你的结构</strong><p>画杆件、放支座、加荷载，再查看计算结果。</p><button onClick={()=>setTool('element')}>开始画杆件 <kbd>D</kbd></button><button onClick={() => loadTemplate(SOLVER_TEMPLATES[0])}>或载入简支梁示例 →</button></div>}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDoubleClick={() => {if(state.editMode==='element'){setDrawStart(null);setTempLine(null);setFeedback('本段绘制已结束，点选新的起点可继续。');}}}
              onWheel={handleWheel}
              className={`solver-drawing-canvas mode-${state.editMode}`}
              aria-label="结构建模画布"
              style={{ touchAction: 'none' }}
            >
              <defs>
                <pattern id="solverGrid" patternUnits="userSpaceOnUse" width={state.gridSize} height={state.gridSize}>
                  <path d={`M ${state.gridSize} 0 L 0 0 L 0 ${state.gridSize}`} fill="none" stroke="var(--sw-muted)" strokeWidth=".5"/>
                </pattern>
                <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sw-muted)" strokeWidth="2" />
                </pattern>
                {/* 普通状态的箭头 */}
                <marker id="arrowForce" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--sw-load)" />
                </marker>
                {/* 选中状态的箭头 */}
                <marker id="arrowForceSelected" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--sw-accent)" />
                </marker>
              </defs>

              <g transform={`translate(${state.viewOffset.x}, ${state.viewOffset.y}) scale(${state.viewScale})`}>
                {/* 网格 */}
                {state.showGrid && <rect x={-state.viewOffset.x / state.viewScale} y={-state.viewOffset.y / state.viewScale} width={10000 / state.viewScale} height={10000 / state.viewScale} fill="url(#solverGrid)" opacity=".2" pointerEvents="none"/>}

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
                        stroke={isSelected ? "var(--sw-accent)" : "var(--sw-structure)"}
                        strokeWidth={(isSelected ? 5 : 3)/state.viewScale}
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
                          stroke="var(--sw-muted)"
                          strokeWidth={.8/state.viewScale}
                          strokeDasharray={`${4/state.viewScale} ${4/state.viewScale}`}
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  );
                })}

                {/* 尺寸直接来自节点坐标，不把显示缩放写入结构模型。 */}
                {state.elements.map(element => {
                  const a = state.nodes.find(node => node.id === element.nodeStart);
                  const b = state.nodes.find(node => node.id === element.nodeEnd);
                  if (!a || !b) return null;
                  const length = Math.hypot(b.x - a.x, b.y - a.y);
                  if (length * state.viewScale < 100) return null;
                  const direction = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
                  const angle = direction > 90 ? direction - 180 : direction < -90 ? direction + 180 : direction;
                  const offset = 46 / state.viewScale;
                  const tick = 4 / state.viewScale;
                  return <g key={`dimension-${element.id}`} transform={`translate(${(a.x+b.x)/2},${(a.y+b.y)/2}) rotate(${angle})`} pointerEvents="none" opacity=".75">
                    <line x1={-length/2} x2={length/2} y1={offset} y2={offset} stroke="var(--sw-muted)" strokeWidth={.7/state.viewScale}/>
                    {[-length/2,length/2].map(x => <line key={x} x1={x} x2={x} y1={offset-tick} y2={offset+tick} stroke="var(--sw-muted)" strokeWidth={.7/state.viewScale}/>)}
                    <text x={0} y={offset+15/state.viewScale} textAnchor="middle" fontSize={10/state.viewScale} fill="var(--sw-muted)">{element.id} · L = {Number(length.toFixed(2))} mm</text>
                  </g>;
                })}

                {/* 临时连线 */}
                {tempLine && (
                  <line
                    x1={tempLine.x1}
                    y1={tempLine.y1}
                    x2={tempLine.x2}
                    y2={tempLine.y2}
                    stroke="var(--sw-accent)"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                )}

                {drawStart && <g pointerEvents="none"><circle cx={drawStart.x} cy={drawStart.y} r={5/state.viewScale} fill="var(--sw-accent)"/>{tempLine&&Math.hypot(tempLine.x2-tempLine.x1,tempLine.y2-tempLine.y1)>0&&<text x={(tempLine.x1+tempLine.x2)/2} y={(tempLine.y1+tempLine.y2)/2-12/state.viewScale} fontSize={11/state.viewScale} fill="var(--sw-accent)" textAnchor="middle">L = {Math.hypot(tempLine.x2-tempLine.x1,tempLine.y2-tempLine.y1).toFixed(0)} mm</text>}</g>}

                {/* 节点 */}
                {state.nodes.map((node) => {
                  const isSelected = state.selectedId === node.id;
                  const isFirstNode = drawStart?.x===node.x && drawStart?.y===node.y;
                  
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onPointerDown={(e) => startDrag('node', node.id, e)}
                      onClick={(e) => selectItem(node.id, e)}
                      className="cursor-move"
                    >
                      {/* 支座 */}
                      <g transform={`scale(${1/state.viewScale})`}>{renderSupport(node)}</g>
                      
                      {/* 节点圆 */}
                      <circle
                        cx={0}
                        cy={0}
                        r={(isSelected ? 6 : 4)/state.viewScale}
                        fill={isFirstNode ? "var(--sw-load)" : isSelected ? "var(--sw-accent)" : "var(--sw-field)"}
                        stroke="var(--sw-structure)"
                        strokeWidth={1.5/state.viewScale}
                      />
                      
                      {/* 节点标签 */}
                      <text
                        x={10/state.viewScale}
                        y={-10/state.viewScale}
                        fontSize={11/state.viewScale}
                        fill="var(--sw-muted)"
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
            <div className="solver-canvas-feedback" role="status">{feedback}</div><div className="solver-scene-caption"><span>x → · y ↓ · mm{cursorPoint ? `　(${cursorPoint.x.toFixed(0)}, ${cursorPoint.y.toFixed(0)})` : ''}</span><span>Esc 结束 · Shift 正交 · Alt 平移</span></div>
          </div>

          {/* 内力图区域 */}
          <div 
            className="solver-diagram-region flex-shrink-0 relative"
            style={{ height: chartOpen ? diagramHeight : 48 }} data-open={chartOpen}
          >
            <button className="solver-chart-toggle" aria-expanded={chartOpen} onClick={()=>setChartOpen(value=>!value)}>{chartOpen?<ChevronDown size={14}/>:<ChevronUp size={14}/>}<span>{chartOpen?'收起图表':'内力与位移图'}</span></button>
            {/* 拖拽手柄 */}
            <div
              className="solver-diagram-resizer"
              title="上下拖动调整图表高度"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
            
            {chartOpen && (state.elements.length > 0 && state.elements.every(e => e.type === 'truss') ? <SolverTrussResults result={state.result}/> : <>
              <div className="solver-diagram-toolbar">
                <div className="solver-segments" role="group" aria-label="结果图类型">
                  {([['axial','轴力 N'],['shear','剪力 V'],['moment','弯矩 M'],['deflection','挠度 w']] as const).map(([type,label]) => <button key={type} aria-pressed={diagramType === type} onClick={() => setDiagramType(type)}>{label}</button>)}
                </div><span className="solver-diagram-hint">移动指针读取截面值</span>
              </div>
              <div className="solver-active-diagram"><ResultDiagramPanel key={diagramType} state={state} diagramType={diagramType}/></div>
            </>)}

          </div>
        </div>

        {/* 右栏：计算结果 */}
        <div className="solver-results-panel w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          <div className="solver-panel-heading">
            <h3>
              <SlidersHorizontal size={15}/> 模型与分析
            </h3>
          </div>
          <div className="solver-inspector-tabs solver-segments" role="group" aria-label="模型与分析面板">{([['tree','模型'],['selection','属性'],['results','结果']] as const).map(([tab,label])=><button key={tab} aria-pressed={inspectorTab===tab} onClick={()=>setInspectorTab(tab)}>{label}</button>)}</div>
          <div className="solver-panel-scroll">
            {inspectorTab==='results'?<CalculationPanel state={state}/>:<DetailedModelingPanel state={state} onChange={onChange} mode={inspectorTab}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolverModule;
