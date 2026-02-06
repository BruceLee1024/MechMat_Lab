import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Circle,
  Minus,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Trash2,
  Settings,
  Calculator,
} from "lucide-react";
import {
  SolverState,
  SolverNode,
  SolverLoad,
  SupportType,
  DEFAULT_SOLVER_STATE,
  SOLVER_TEMPLATES,
  SolverTemplate,
} from "./SolverTypes";
import { solveUnified } from "./UnifiedSolver";
import { IconButton } from "./components/IconButton";
import { ModelingPanel } from "./components/ModelingPanel";
import { CalculationPanel } from "./components/CalculationPanel";
import { DiagramPanel } from "./components/DiagramPanel";


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
            <ModelingPanel state={state} onChange={onChange} />
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

                {/* 变形形状叠加 */}
                {state.result?.success && (() => {
                  const { result } = state;
                  // 自动计算放大系数: 最大位移占结构尺寸的约10%
                  let maxDisp = 0;
                  for (const nr of result.nodes) {
                    const d = Math.sqrt(nr.displacement.dx ** 2 + nr.displacement.dy ** 2);
                    if (d > maxDisp) maxDisp = d;
                  }
                  let maxSpan = 0;
                  for (const elem of state.elements) {
                    const na = state.nodes.find(n => n.id === elem.nodeStart);
                    const nb = state.nodes.find(n => n.id === elem.nodeEnd);
                    if (na && nb) maxSpan = Math.max(maxSpan, Math.sqrt((nb.x-na.x)**2 + (nb.y-na.y)**2));
                  }
                  const scale = maxDisp > 1e-10 ? (maxSpan * 0.1) / maxDisp : 1;

                  return state.elements.map((elem) => {
                    const n1 = state.nodes.find(n => n.id === elem.nodeStart);
                    const n2 = state.nodes.find(n => n.id === elem.nodeEnd);
                    if (!n1 || !n2) return null;
                    const nr1 = result.nodes.find(nr => nr.nodeId === n1.id);
                    const nr2 = result.nodes.find(nr => nr.nodeId === n2.id);
                    const er = result.elements.find(er => er.elementId === elem.id);
                    if (!nr1 || !nr2 || !er) return null;

                    const dx = n2.x - n1.x, dy = n2.y - n1.y;
                    const L = Math.sqrt(dx*dx + dy*dy);
                    if (L < 1e-6) return null;
                    const cos = dx / L, sin = dy / L;

                    // 局部轴向位移
                    const uAxial1 = nr1.displacement.dx * cos + nr1.displacement.dy * sin;
                    const uAxial2 = nr2.displacement.dx * cos + nr2.displacement.dy * sin;

                    const points = er.deflectionCurve.map(d => {
                      const xi = d.position;
                      const origX = n1.x + xi * dx;
                      const origY = n1.y + xi * dy;
                      const uLocal = (1 - xi) * uAxial1 + xi * uAxial2;
                      const vLocal = d.dy;
                      const gx = uLocal * cos - vLocal * sin;
                      const gy = uLocal * sin + vLocal * cos;
                      return `${origX + scale * gx},${origY + scale * gy}`;
                    });

                    return (
                      <polyline
                        key={`deform-${elem.id}`}
                        points={points.join(' ')}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        opacity={0.7}
                        pointerEvents="none"
                      />
                    );
                  });
                })()}

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
              {/* 轴力图 */}
              <div className="flex-1 border-r border-slate-100 p-1 overflow-hidden">
                <DiagramPanel state={state} diagramType="axial" />
              </div>
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
