import React, { useState } from "react";
import { Circle, Minus, ArrowDown } from "lucide-react";
import { SolverState, SolverNode, SolverElement, SolverLoad, SupportType } from "../SolverTypes";

export const ModelingPanel = ({
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
