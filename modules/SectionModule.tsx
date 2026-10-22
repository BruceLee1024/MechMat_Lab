import "../section-draw.css";
import {NumericInput} from "../components/NumericInput";
import {SectionWorkspace} from "../components/SectionWorkspace";
import type { SectionModel } from "../experiments/schema";
import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Circle,
  Square,
  RectangleHorizontal,
  Hexagon,
  Triangle,
  Minus,
  Plus,
  Info,
  Calculator,
  RotateCcw,
  FileText,
  ChevronRight,
  X,
  Save,
  Trash2,
  Edit3,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Crosshair,
  RotateCcw as ResetIcon,
} from "lucide-react";

import { SECTION_TOOL_CONFIGS, SectionToolType as SectionType, SectionParams, SectionToolResult as SectionResult, Vertex, PolygonPath, calculatePolygonArea, calculatePolygonCentroid, calculatePolygonSection } from "../mechanics/sectionTool";

const SECTION_ICONS: Record<SectionType, React.ElementType> = { "rectangle": RectangleHorizontal, "circle": Circle, "hollow-circle": Circle, "hollow-rectangle": Square, "i-beam": Hexagon, "t-beam": Minus, "channel": Square, "angle": Triangle, "unequal-angle": Triangle, "double-channel": Square, "composite-rect": Square, "custom": Square, "draw": Hexagon };
const SECTION_CONFIGS = Object.fromEntries(Object.entries(SECTION_TOOL_CONFIGS).map(([key, config]) => [key, { ...config, icon: SECTION_ICONS[key as SectionType] }])) as Record<SectionType, typeof SECTION_TOOL_CONFIGS[SectionType] & { icon: React.ElementType }>;

// 截面绘制编辑器组件（表单输入模式，类似求解器）
const SectionDrawEditor: React.FC<{
  paths: PolygonPath[];
  setPaths: React.Dispatch<React.SetStateAction<PolygonPath[]>>;
  selectedPathId: string | null;
  setSelectedPathId: (id: string | null) => void;
  selectedVertexIdx: number | null;
  setSelectedVertexIdx: (idx: number | null) => void;
}> = ({ paths, setPaths, selectedPathId, setSelectedPathId, selectedVertexIdx, setSelectedVertexIdx }) => {
  // 添加顶点的输入状态
  const [newX, setNewX] = useState(0);
  const [newY, setNewY] = useState(0);
  const [isHoleMode, setIsHoleMode] = useState(false);
  
  const svgWidth = 400;
  const svgHeight = 300;
  const scale = 2.5;
  const originX = svgWidth / 2;
  const originY = svgHeight / 2;

  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;

  // 新建轮廓
  const createPath = () => {
    const newPath: PolygonPath = {
      id: `path_${Date.now()}`,
      vertices: [],
      isHole: isHoleMode,
      isClosed: false,
    };
    setPaths(prev => [...prev, newPath]);
    setSelectedPathId(newPath.id);
    setSelectedVertexIdx(null);
  };

  // 添加顶点到当前轮廓
  const addVertex = () => {
    if (!selectedPathId) {
      // 如果没有选中轮廓，先创建一个
      const newPath: PolygonPath = {
        id: `path_${Date.now()}`,
        vertices: [{ x: newX, y: newY }],
        isHole: isHoleMode,
        isClosed: false,
      };
      setPaths(prev => [...prev, newPath]);
      setSelectedPathId(newPath.id);
    } else {
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId && !p.isClosed) {
          return { ...p, vertices: [...p.vertices, { x: newX, y: newY }] };
        }
        return p;
      }));
    }
  };

  // 闭合轮廓
  const closePath = () => {
    if (!selectedPathId) return;
    setPaths(prev => prev.map(p => {
      if (p.id === selectedPathId && p.vertices.length >= 3) {
        return { ...p, isClosed: true };
      }
      return p;
    }));
  };

  // 删除轮廓
  const deletePath = (id: string) => {
    setPaths(prev => prev.filter(p => p.id !== id));
    if (selectedPathId === id) {
      setSelectedPathId(null);
      setSelectedVertexIdx(null);
    }
  };

  // 删除顶点
  const deleteVertex = (pathId: string, idx: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = p.vertices.filter((_, i) => i !== idx);
        return { ...p, vertices: newVertices, isClosed: newVertices.length >= 3 ? p.isClosed : false };
      }
      return p;
    }));
    setSelectedVertexIdx(null);
  };

  // 更新顶点
  const updateVertex = (pathId: string, idx: number, x: number, y: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = [...p.vertices];
        newVertices[idx] = { x, y };
        return { ...p, vertices: newVertices };
      }
      return p;
    }));
  };

  // 切换内孔
  const toggleHole = (id: string) => {
    setPaths(prev => prev.map(p => p.id === id ? { ...p, isHole: !p.isHole } : p));
  };

  const selectedPath = paths.find(p => p.id === selectedPathId);
  const sectionResult = calculatePolygonSection(paths);
  
  // 计算形心
  let centroidX = 0, centroidY = 0;
  if (sectionResult.A > 0) {
    const closedPaths = paths.filter(p => p.isClosed && p.vertices.length >= 3);
    let sumAx = 0, sumAy = 0, totalA = 0;
    closedPaths.forEach(path => {
      const A = calculatePolygonArea(path.vertices);
      const { cx, cy } = calculatePolygonCentroid(path.vertices);
      const sign = path.isHole ? -1 : 1;
      totalA += sign * A;
      sumAx += sign * A * cx;
      sumAy += sign * A * cy;
    });
    if (totalA > 0) {
      centroidX = sumAx / totalA;
      centroidY = sumAy / totalA;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 左侧：输入面板 */}
      <div className="space-y-3">
        {/* 添加顶点 */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1 text-xs">
            <Circle className="w-3 h-3" /> 添加顶点
          </h4>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] text-slate-500">X (mm)</label>
              <input
                type="number"
                value={newX}
                onChange={(e) => setNewX(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Y (mm)</label>
              <input
                type="number"
                value={newY}
                onChange={(e) => setNewY(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addVertex}
              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
            >
              添加顶点
            </button>
            <button
              onClick={closePath}
              disabled={!selectedPath || selectedPath.vertices.length < 3 || selectedPath.isClosed}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              闭合
            </button>
          </div>
        </div>

        {/* 轮廓管理 */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1 text-xs">
            <Hexagon className="w-3 h-3" /> 轮廓管理
          </h4>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isHoleMode}
                onChange={(e) => setIsHoleMode(e.target.checked)}
                className="rounded w-3 h-3"
              />
              <span className="text-slate-600">内孔模式</span>
            </label>
          </div>
          <button
            onClick={createPath}
            className="w-full px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300"
          >
            + 新建轮廓
          </button>
        </div>

        {/* 轮廓列表 */}
        <div className="bg-slate-50 p-3 rounded-lg border max-h-40 overflow-y-auto">
          <h4 className="font-semibold text-slate-700 mb-2 text-xs">轮廓列表 ({paths.length})</h4>
          {paths.length === 0 ? (
            <div className="text-center py-2 text-slate-400 text-xs">暂无轮廓</div>
          ) : (
            <div className="space-y-1">
              {paths.map((path, idx) => (
                <div 
                  key={path.id}
                  onClick={() => { setSelectedPathId(path.id); setSelectedVertexIdx(null); }}
                  className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                    path.id === selectedPathId ? 'bg-indigo-100 border border-indigo-300' : 'hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      轮廓 {idx + 1}
                      {path.isHole && <span className="text-red-500 ml-1">[孔]</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      {path.isClosed && (
                        <span className="text-green-600 text-[10px]">{calculatePolygonArea(path.vertices).toFixed(0)}mm²</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleHole(path.id); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${path.isHole ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {path.isHole ? '孔' : '实'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePath(path.id); }}
                        className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] hover:bg-red-200"
                      >
                        删
                      </button>
                    </div>
                  </div>
                  {!path.isClosed && <span className="text-amber-500 text-[10px]">[未闭合]</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 顶点列表 */}
        {selectedPath && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 max-h-32 overflow-y-auto">
            <h4 className="font-semibold text-amber-800 mb-2 text-xs">
              顶点列表 - 轮廓 {paths.findIndex(p => p.id === selectedPathId) + 1}
            </h4>
            <div className="space-y-1">
              {selectedPath.vertices.map((v, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 p-1 rounded text-xs ${
                    selectedVertexIdx === idx ? 'bg-amber-200' : 'hover:bg-amber-100'
                  }`}
                >
                  <span className="w-6 text-amber-700 font-medium">P{idx + 1}</span>
                  <input
                    type="number"
                    value={v.x}
                    onChange={(e) => updateVertex(selectedPath.id, idx, parseFloat(e.target.value) || 0, v.y)}
                    className="w-16 px-1 py-0.5 border rounded text-[10px]"
                    onClick={() => setSelectedVertexIdx(idx)}
                  />
                  <input
                    type="number"
                    value={v.y}
                    onChange={(e) => updateVertex(selectedPath.id, idx, v.x, parseFloat(e.target.value) || 0)}
                    className="w-16 px-1 py-0.5 border rounded text-[10px]"
                    onClick={() => setSelectedVertexIdx(idx)}
                  />
                  <button
                    onClick={() => deleteVertex(selectedPath.id, idx)}
                    className="px-1 py-0.5 rounded bg-red-100 text-red-600 text-[10px] hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 右侧：预览 */}
      <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
        <svg width={svgWidth} height={svgHeight} className="w-full">
          {/* 网格 */}
          <defs>
            <pattern id="drawGrid2" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#drawGrid2)" />
          
          {/* 坐标轴 */}
          <line x1="0" y1={originY} x2={svgWidth} y2={originY} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={originX} y1="0" x2={originX} y2={svgHeight} stroke="#cbd5e1" strokeWidth="1" />
          <text x={svgWidth - 15} y={originY - 5} fill="#94a3b8" fontSize="10">x</text>
          <text x={originX + 5} y="12" fill="#94a3b8" fontSize="10">y</text>
          
          {/* 刻度 */}
          {[-60, -40, -20, 20, 40, 60].map(v => (
            <g key={`tick-${v}`}>
              <line x1={toSvgX(v)} y1={originY - 2} x2={toSvgX(v)} y2={originY + 2} stroke="#94a3b8" strokeWidth="1" />
              <text x={toSvgX(v)} y={originY + 12} fill="#94a3b8" fontSize="8" textAnchor="middle">{v}</text>
              <line x1={originX - 2} y1={toSvgY(v)} x2={originX + 2} y2={toSvgY(v)} stroke="#94a3b8" strokeWidth="1" />
              <text x={originX - 8} y={toSvgY(v) + 3} fill="#94a3b8" fontSize="8" textAnchor="end">{v}</text>
            </g>
          ))}

          {/* 绘制轮廓 */}
          {paths.map(path => {
            const isSelected = path.id === selectedPathId;
            const fillColor = path.isHole ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.25)';
            const strokeColor = path.isHole ? '#ef4444' : '#6366f1';
            const points = path.vertices.map(v => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ');
            
            return (
              <g key={path.id}>
                {path.isClosed && path.vertices.length >= 3 && (
                  <polygon
                    points={points}
                    fill={fillColor}
                    stroke={isSelected ? '#f59e0b' : strokeColor}
                    strokeWidth={isSelected ? 2.5 : 2}
                    strokeDasharray={path.isHole ? '5,3' : 'none'}
                  />
                )}
                {!path.isClosed && path.vertices.length >= 2 && (
                  <polyline points={points} fill="none" stroke={isSelected ? '#f59e0b' : strokeColor} strokeWidth={2} />
                )}
                {path.vertices.map((v, idx) => (
                  <g key={idx}>
                    <circle
                      cx={toSvgX(v.x)}
                      cy={toSvgY(v.y)}
                      r={isSelected && selectedVertexIdx === idx ? 6 : 4}
                      fill={isSelected && selectedVertexIdx === idx ? '#f59e0b' : (path.isHole ? '#ef4444' : '#6366f1')}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    {isSelected && (
                      <text x={toSvgX(v.x) + 6} y={toSvgY(v.y) - 6} fill="#64748b" fontSize="8">P{idx + 1}</text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}

          {/* 形心 */}
          {sectionResult.A > 0 && (
            <g>
              <circle cx={toSvgX(centroidX)} cy={toSvgY(centroidY)} r="5" fill="#10b981" stroke="white" strokeWidth="1.5" />
              <text x={toSvgX(centroidX) + 8} y={toSvgY(centroidY) - 5} fill="#10b981" fontSize="9" fontWeight="bold">C</text>
            </g>
          )}

          {/* 当前输入点预览 */}
          <circle cx={toSvgX(newX)} cy={toSvgY(newY)} r="4" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
        </svg>
      </div>
    </div>
  );
};

// 截面绘制模态对话框（CAD风格）
type DrawTool = 'select' | 'draw' | 'pan';

const SectionDrawModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (paths: PolygonPath[], result: SectionResult) => void;
  initialPaths?: PolygonPath[];
}> = ({ isOpen, onClose, onSave, initialPaths = [] }) => {
  const [paths, setPaths] = useState<PolygonPath[]>(initialPaths);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);
  const [newX, setNewX] = useState(0);
  const [newY, setNewY] = useState(0);
  const [isHoleMode, setIsHoleMode] = useState(false);
  
  // CAD 功能状态
  const [tool, setTool] = useState<DrawTool>('draw');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // 当前鼠标位置（mm坐标）
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10); // 网格大小 mm
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用固定的 viewBox 尺寸，实际显示会自适应容器
  const svgWidth = 2000;
  const svgHeight = 1500;
  const baseScale = 2.5; // 基础缩放：1mm = 2.5px（在 zoom=1 时）
  const scale = baseScale * zoom;
  const originX = svgWidth / 2 + panOffset.x;
  const originY = svgHeight / 2 + panOffset.y;

  // 坐标转换
  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;
  const toMmX = (svgX: number) => (svgX - originX) / scale;
  const toMmY = (svgY: number) => (originY - svgY) / scale;
  
  // 吸附到网格
  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return Math.round(value * 10) / 10;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // 获取鼠标在SVG中的坐标（使用 SVG 原生坐标转换，更精确）
  const getMouseCoords = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // 使用 SVG 的 getScreenCTM 进行精确坐标转换
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const svgPoint = pt.matrixTransform(ctm.inverse());
    
    // 转换为 mm 坐标
    const mmX = (svgPoint.x - originX) / scale;
    const mmY = (originY - svgPoint.y) / scale;
    
    return {
      x: snapToGridValue(mmX),
      y: snapToGridValue(mmY)
    };
  }, [originX, originY, scale, snapToGridValue]);

  // 计算结果
  const sectionResult = calculatePolygonSection(paths);
  
  // 计算形心
  let centroidX = 0, centroidY = 0;
  if (sectionResult.A > 0) {
    const closedPaths = paths.filter(p => p.isClosed && p.vertices.length >= 3);
    let sumAx = 0, sumAy = 0, totalA = 0;
    closedPaths.forEach(path => {
      const A = calculatePolygonArea(path.vertices);
      const { cx, cy } = calculatePolygonCentroid(path.vertices);
      const sign = path.isHole ? -1 : 1;
      totalA += sign * A;
      sumAx += sign * A * cx;
      sumAy += sign * A * cy;
    });
    if (totalA > 0) {
      centroidX = sumAx / totalA;
      centroidY = sumAy / totalA;
    }
  }

  // 以视图中心缩放，适合画布用于完整显示所有轮廓。
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => {
      const newZoom = Math.max(0.1, Math.min(10, prev + delta));
      return newZoom;
    });
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 根据滚轮方向和速度计算缩放增量
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    handleZoom(delta);
  }, [handleZoom]);

  // 指针和偏移均转换为 SVG 单位，缩放显示时平移仍精确。
  const pointerInSvg=(e:React.MouseEvent<SVGSVGElement>)=>{
    const svg=svgRef.current,ctm=svg?.getScreenCTM();
    if(!svg||!ctm)return {x:0,y:0};
    const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    return pt.matrixTransform(ctm.inverse());
  };
  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'pan' || e.button === 1) { // 中键平移
      e.preventDefault();
      const point=pointerInSvg(e);
      setIsPanning(true);
      setPanStart({ x: point.x - panOffset.x, y: point.y - panOffset.y });
      return;
    }
  };

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // 平移优先处理
    if (isPanning) {
      const point=pointerInSvg(e);
      setPanOffset({x:point.x-panStart.x,y:point.y-panStart.y});
      return;
    }
    
    const coords = getMouseCoords(e);
    // 只有坐标变化时才更新状态
    setMousePos(prev => {
      if (prev.x === coords.x && prev.y === coords.y) return prev;
      return coords;
    });
  }, [isPanning, panStart, getMouseCoords]);

  // 鼠标松开
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // 点击画布
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool !== 'draw' || isPanning || e.button!==0 || e.detail>1) return;
    
    const coords = getMouseCoords(e);
    
    // 查找当前未闭合的轮廓
    const currentPath = paths.find(p => p.id === selectedPathId && !p.isClosed);
    
    if (!currentPath) {
      // 创建新轮廓
      const newPath: PolygonPath = {
        id: `path_${Date.now()}`,
        vertices: [{ x: coords.x, y: coords.y }],
        isHole: isHoleMode,
        isClosed: false,
      };
      setPaths(prev => [...prev, newPath]);
      setSelectedPathId(newPath.id);
    } else {
      // 添加顶点到当前轮廓
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId && !p.isClosed) {
          return { ...p, vertices: [...p.vertices, { x: coords.x, y: coords.y }] };
        }
        return p;
      }));
    }
  };

  // 双击闭合轮廓
  const handleDoubleClick = () => {
    if (tool !== 'draw') return;
    const currentPath = paths.find(p => p.id === selectedPathId && !p.isClosed);
    if (currentPath && currentPath.vertices.length >= 3) {
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId) {
          return { ...p, isClosed: true };
        }
        return p;
      }));
    }
  };

  // 新建轮廓
  const createPath = () => {
    const newPath: PolygonPath = {
      id: `path_${Date.now()}`,
      vertices: [],
      isHole: isHoleMode,
      isClosed: false,
    };
    setPaths(prev => [...prev, newPath]);
    setSelectedPathId(newPath.id);
    setSelectedVertexIdx(null);
    setTool('draw');
  };

  // 添加顶点（通过输入框）
  const addVertex = () => {
    if (!paths.some(p=>p.id===selectedPathId&&!p.isClosed)) {
      const newPath: PolygonPath = {
        id: `path_${Date.now()}`,
        vertices: [{ x: newX, y: newY }],
        isHole: isHoleMode,
        isClosed: false,
      };
      setPaths(prev => [...prev, newPath]);
      setSelectedPathId(newPath.id);
    } else {
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId && !p.isClosed) {
          return { ...p, vertices: [...p.vertices, { x: newX, y: newY }] };
        }
        return p;
      }));
    }
  };

  // 闭合轮廓
  const closePath = () => {
    if (!selectedPathId) return;
    setPaths(prev => prev.map(p => {
      if (p.id === selectedPathId && p.vertices.length >= 3) {
        return { ...p, isClosed: true };
      }
      return p;
    }));
  };

  // 删除轮廓
  const deletePath = (id: string) => {
    setPaths(prev => prev.filter(p => p.id !== id));
    if (selectedPathId === id) {
      setSelectedPathId(null);
      setSelectedVertexIdx(null);
    }
  };

  // 删除顶点
  const deleteVertex = (pathId: string, idx: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = p.vertices.filter((_, i) => i !== idx);
        return { ...p, vertices: newVertices, isClosed: newVertices.length >= 3 ? p.isClosed : false };
      }
      return p;
    }));
    setSelectedVertexIdx(null);
  };

  // 更新顶点
  const updateVertex = (pathId: string, idx: number, x: number, y: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = [...p.vertices];
        newVertices[idx] = { x, y };
        return { ...p, vertices: newVertices };
      }
      return p;
    }));
  };

  // 切换内孔
  const toggleHole = (id: string) => {
    setPaths(prev => prev.map(p => p.id === id ? { ...p, isHole: !p.isHole } : p));
  };

  // 清空所有
  const clearAll = () => {
    setPaths([]);
    setSelectedPathId(null);
    setSelectedVertexIdx(null);
  };

  // 保存并关闭
  const handleSave = () => {
    if(paths.some(p=>!p.isClosed)||sectionResult.A<=0||![sectionResult.A,sectionResult.Ix,sectionResult.Iy].every(Number.isFinite))return;
    onSave(paths, sectionResult);
    onClose();
  };

  // 输入框保留 Enter / Escape 的数值编辑语义，快捷键仅作用于画布工具。
  const handleKeyDown = useCallback((e:KeyboardEvent)=>{
    if(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,[contenteditable="true"]'))return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='Escape'){setTool('select');setIsPanning(false);}
    else if(e.key==='Enter'){if(e.target instanceof HTMLElement&&e.target.closest('button'))return;e.preventDefault();closePath();}
    else if(e.key.toLowerCase()==='s')setTool('select');
    else if(e.key.toLowerCase()==='d')setTool('draw');
    else if(e.key.toLowerCase()==='p')setTool('pan');
  },[paths,selectedPathId]);

  // 键盘事件监听
  React.useEffect(() => {
    if (isOpen) {
      const svg=svgRef.current;
      window.addEventListener('keydown', handleKeyDown);
      svg?.addEventListener('wheel',handleWheel,{passive:false});
      return () => {window.removeEventListener('keydown',handleKeyDown);svg?.removeEventListener('wheel',handleWheel);};
    }
  }, [isOpen, handleKeyDown, handleWheel]);

  const selectedPath = paths.find(p => p.id === selectedPathId);
  const currentDrawingPath = paths.find(p => p.id === selectedPathId && !p.isClosed);

  if (!isOpen) return null;

  const tickStep=gridSize*Math.max(1,Math.ceil(70/(gridSize*scale)));
  const xTicks=Array.from({length:Math.ceil(svgWidth/scale/tickStep)+2},(_,i)=>(Math.floor(-originX/scale/tickStep)+i)*tickStep);
  const yTicks=Array.from({length:Math.ceil(svgHeight/scale/tickStep)+2},(_,i)=>(Math.floor((originY-svgHeight)/scale/tickStep)+i)*tickStep);
  const pointCount = paths.reduce((sum,p)=>sum+p.vertices.length,0);
  const unfinished = paths.some(p=>!p.isClosed);
  const canSave = !unfinished && sectionResult.A>0 && [sectionResult.A,sectionResult.Ix,sectionResult.Iy].every(Number.isFinite);
  const saveHint = unfinished ? '请先闭合或删除未完成的轮廓' : sectionResult.A>0 ? '外轮廓与内孔按净截面计算' : '绘制并闭合外轮廓后，即可计算截面';
  const formatValue=(value:number)=>!Number.isFinite(value)?'—':value===0?'0':Math.abs(value)>=1e7||Math.abs(value)<.001?value.toExponential(3):value.toLocaleString('zh-CN',{maximumFractionDigits:3});
  const fitDrawing=()=>{
    const vertices=paths.flatMap(p=>p.vertices);
    if(!vertices.length){resetView();return;}
    const xs=vertices.map(v=>v.x),ys=vertices.map(v=>v.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const rect=svgRef.current?.getBoundingClientRect();
    const screenRatio=rect?Math.max(rect.width/svgWidth,rect.height/svgHeight):1;
    const visibleW=rect?rect.width/screenRatio:svgWidth,visibleH=rect?rect.height/screenRatio:svgHeight;
    const next=Math.max(0.1,Math.min(10,Math.min(visibleW/Math.max(40,maxX-minX)/baseScale,visibleH/Math.max(40,maxY-minY)/baseScale)*0.65));
    setZoom(next);setPanOffset({x:-(minX+maxX)/2*baseScale*next,y:(minY+maxY)/2*baseScale*next});
  };
  return (
    <div className="section-draw-editor" role="dialog" aria-modal="true" aria-labelledby="section-draw-title" onKeyDown={e=>{
      if(e.key!=='Tab')return;
      const items=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]')).filter(el=>el.getClientRects().length);
      if(!items.length)return;
      if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus();}
      else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus();}
    }}>
      <header className="draw-header">
        <div className="draw-brand"><span className="draw-brand-mark"><Hexagon size={23}/></span><div><h2 id="section-draw-title">截面绘制器</h2><p>定义轮廓，探索截面的几何特性</p></div></div>
        <div className="draw-document-state"><span className="draw-status-dot"/>本地草稿<span>单位 mm</span></div>
        <div className="draw-header-actions"><button className="draw-quiet" onClick={clearAll} disabled={!paths.length}><Trash2 size={15}/>清空</button><button className="draw-primary" onClick={handleSave} disabled={!canSave} title={saveHint}><Save size={15}/>保存并使用</button><button className="draw-icon" onClick={onClose} aria-label="关闭截面绘制器"><X size={19}/></button></div>
      </header>
      <div className="draw-workspace">
        <aside className="draw-inspector" aria-label="轮廓与顶点编辑">
          <section className="draw-coordinate-section">
            <div className="draw-section-heading"><h3><Crosshair size={15}/>精确落点</h3><span>mm</span></div>
            <div className="draw-coordinate-inputs"><NumericInput compact domain="signed" label="X 坐标" value={newX} onChange={setNewX}/><NumericInput compact domain="signed" label="Y 坐标" value={newY} onChange={setNewY}/></div>
            <div className="draw-point-actions"><button className="draw-secondary" onClick={addVertex}><Plus size={15}/>添加顶点</button><button className="draw-quiet" onClick={closePath} disabled={!selectedPath||selectedPath.isClosed||selectedPath.vertices.length<3}><Hexagon size={14}/>闭合</button></div>
          </section>
          <section className="draw-contours-section">
            <div className="draw-section-heading"><h3><Hexagon size={15}/>轮廓</h3><span>{paths.length.toString().padStart(2,'0')}</span></div>
            <div className="draw-contour-create"><label><input type="checkbox" checked={isHoleMode} onChange={e=>setIsHoleMode(e.target.checked)}/>新轮廓为内孔</label><button className="draw-icon" onClick={createPath} aria-label="新建轮廓"><Plus size={17}/></button></div>
            {!paths.length?<div className="draw-outline-empty"><Hexagon size={28}/><p>从第一个顶点开始</p><span>点击画布，或输入精确坐标</span></div>:<div className="draw-contour-list">{paths.map((path,index)=><div key={path.id} className={`draw-contour-item ${path.id===selectedPathId?'is-selected':''}`}>
              <button className="draw-contour-select" onClick={()=>{setSelectedPathId(path.id);setSelectedVertexIdx(null);}} aria-pressed={path.id===selectedPathId}><span className={`draw-contour-symbol ${path.isHole?'is-hole':''}`}><Hexagon size={17}/></span><span><strong>轮廓 {index+1}</strong><small>{path.vertices.length} 个顶点 · {path.isClosed?'已闭合':'绘制中'}</small></span></button>
              <button className={`draw-kind ${path.isHole?'is-hole':''}`} onClick={()=>toggleHole(path.id)} aria-label={`轮廓 ${index+1} 切换实体或内孔`}>{path.isHole?'内孔':'实体'}</button><button className="draw-icon" onClick={()=>deletePath(path.id)} aria-label={`删除轮廓 ${index+1}`}><Trash2 size={13}/></button>
            </div>)}</div>}
          </section>
          {selectedPath&&<section className="draw-vertices-section"><div className="draw-section-heading"><h3><Edit3 size={15}/>顶点坐标</h3><span>{selectedPath.vertices.length} 点</span></div><div className="draw-vertex-list">{selectedPath.vertices.map((v,i)=><div key={i} className={`draw-vertex-row ${selectedVertexIdx===i?'is-selected':''}`} onClick={()=>setSelectedVertexIdx(i)}><span>P{i+1}</span><NumericInput compact domain="signed" label={`P${i+1} X`} value={v.x} onChange={x=>updateVertex(selectedPath.id,i,x,v.y)}/><NumericInput compact domain="signed" label={`P${i+1} Y`} value={v.y} onChange={y=>updateVertex(selectedPath.id,i,v.x,y)}/><button className="draw-icon" onClick={()=>deleteVertex(selectedPath.id,i)} aria-label={`删除顶点 P${i+1}`}><X size={13}/></button></div>)}</div></section>}
          <div className="draw-inspector-note"><Info size={14}/><p>外轮廓之间保持分离，内孔应完全位于实体内部。截面特性按闭合多边形积分。</p></div>
        </aside>
        <main className="draw-main" ref={containerRef}>
          <div className="draw-toolbar">
            <div className="draw-tool-switch" role="group" aria-label="绘图工具">{([{id:'select',label:'选择',key:'S',Icon:MousePointer},{id:'draw',label:'绘制',key:'D',Icon:Edit3},{id:'pan',label:'平移',key:'P',Icon:Move}] as const).map(t=><button key={t.id} autoFocus={t.id==='draw'} onClick={()=>setTool(t.id)} aria-pressed={tool===t.id} title={`${t.label}工具 (${t.key})`}><t.Icon size={15}/><span>{t.label}</span><kbd>{t.key}</kbd></button>)}</div>
            <div className="draw-snap-settings"><label><input type="checkbox" checked={snapToGrid} onChange={e=>setSnapToGrid(e.target.checked)}/>网格吸附</label><select aria-label="网格间距" value={gridSize} onChange={e=>setGridSize(Number(e.target.value))}><option value={5}>5 mm</option><option value={10}>10 mm</option><option value={20}>20 mm</option></select></div>
            <div className="draw-cursor-position"><Crosshair size={14}/><span>X <b>{mousePos.x.toFixed(1)}</b></span><span>Y <b>{mousePos.y.toFixed(1)}</b></span><small>mm</small></div>
          </div>
          <div className="draw-canvas">
              <svg 
                ref={svgRef}
                role="img" aria-label="截面绘图画布，坐标单位毫米"
                className={`absolute inset-0 w-full h-full ${tool === 'draw' ? 'cursor-crosshair' : tool === 'pan' ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                preserveAspectRatio="xMidYMid slice"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
                onDoubleClick={handleDoubleClick}
              >
                {/* 背景 */}
                <rect width="100%" height="100%" fill="#0b1723" />
                
                {/* 动态网格 */}
                <defs>
                  <pattern 
                    id="cadGridSmall" 
                    width={gridSize * scale} 
                    height={gridSize * scale} 
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${originX % (gridSize * scale)}, ${originY % (gridSize * scale)})`}
                  >
                    <path d={`M ${gridSize * scale} 0 L 0 0 0 ${gridSize * scale}`} fill="none" stroke="#1a3040" strokeWidth="0.6"/>
                  </pattern>
                  <pattern 
                    id="cadGridLarge" 
                    width={gridSize * scale * 5} 
                    height={gridSize * scale * 5} 
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${originX % (gridSize * scale * 5)}, ${originY % (gridSize * scale * 5)})`}
                  >
                    <path d={`M ${gridSize * scale * 5} 0 L 0 0 0 ${gridSize * scale * 5}`} fill="none" stroke="#274250" strokeWidth="0.8"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cadGridSmall)" />
                <rect width="100%" height="100%" fill="url(#cadGridLarge)" />
                
                {/* 坐标轴 */}
                <line x1="0" y1={originY} x2={svgWidth} y2={originY} stroke="#64748b" strokeWidth="1" />
                <line x1={originX} y1="0" x2={originX} y2={svgHeight} stroke="#64748b" strokeWidth="1" />
                
                {/* 原点标记 */}
                <circle cx={originX} cy={originY} r="4" fill="#64748b" />
                <text x={originX + 8} y={originY - 8} fill="#94a3b8" fontSize="16">O</text>

                {/* 刻度随视图范围更新，坐标始终为毫米。 */}
                {xTicks.filter(v=>v!==0).map(v=><g key={`x-${v}`}><line x1={toSvgX(v)} y1={originY-4} x2={toSvgX(v)} y2={originY+4} stroke="#486376"/><text x={toSvgX(v)} y={originY+23} fill="#6d879b" fontSize="15" textAnchor="middle">{v}</text></g>)}
                {yTicks.filter(v=>v!==0).map(v=><g key={`y-${v}`}><line x1={originX-4} y1={toSvgY(v)} x2={originX+4} y2={toSvgY(v)} stroke="#486376"/><text x={originX-12} y={toSvgY(v)+5} fill="#6d879b" fontSize="15" textAnchor="end">{v}</text></g>)}

                {/* 绘制轮廓 */}
                {[...paths].sort((a,b)=>Number(a.isHole)-Number(b.isHole)).map(path => {
                  const isSelected = path.id === selectedPathId;
                  const fillColor = path.isHole ? 'rgba(11, 23, 35, 0.95)' : 'rgba(102, 190, 231, 0.13)';
                  const strokeColor = path.isHole ? '#edab93' : '#80c8ed';
                  const points = path.vertices.map(v => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ');
                  
                  return (
                    <g key={path.id}>
                      {path.isClosed && path.vertices.length >= 3 && (
                        <polygon
                          onClick={e=>{if(tool==='select'){e.stopPropagation();setSelectedPathId(path.id);setSelectedVertexIdx(null);}}}
                          style={{cursor:tool==='select'?'pointer':undefined}}
                          points={points}
                          fill={fillColor}
                          stroke={isSelected ? '#82d9c6' : strokeColor}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeDasharray={path.isHole ? '8,4' : 'none'}
                        />
                      )}
                      {!path.isClosed && path.vertices.length >= 2 && (
                        <polyline points={points} fill="none" stroke={isSelected ? '#82d9c6' : strokeColor} strokeWidth={2} strokeLinecap="round" />
                      )}
                      
                      {/* 绘制中的预览线 */}
                      {!path.isClosed && path.vertices.length > 0 && path.id === selectedPathId && tool === 'draw' && (
                        <line
                          x1={toSvgX(path.vertices[path.vertices.length - 1].x)}
                          y1={toSvgY(path.vertices[path.vertices.length - 1].y)}
                          x2={toSvgX(mousePos.x)}
                          y2={toSvgY(mousePos.y)}
                          stroke="#82d9c6"
                          strokeWidth="1.5"
                          strokeDasharray="5,5"
                        />
                      )}
                      
                      {/* 顶点 */}
                      {path.vertices.map((v, idx) => (
                        <g key={idx}>
                          <circle
                            cx={toSvgX(v.x)}
                            cy={toSvgY(v.y)}
                            r={isSelected && selectedVertexIdx === idx ? 8 : 5}
                            fill={isSelected && selectedVertexIdx === idx ? '#82d9c6' : (path.isHole ? '#edab93' : '#80c8ed')}
                            stroke="#fff"
                            strokeWidth="2"
                            style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                            onClick={(e) => {
                              if(tool==='draw'&&isSelected&&idx===0&&!path.isClosed&&path.vertices.length>=3){e.stopPropagation();closePath();return;}
                              if (tool === 'select') {
                                e.stopPropagation();
                                setSelectedPathId(path.id);
                                setSelectedVertexIdx(idx);
                              }
                            }}
                          />
                          {isSelected && (
                            <text x={toSvgX(v.x) + 10} y={toSvgY(v.y) - 8} fill="#94a3b8" fontSize="16" fontWeight="500">
                              P{idx + 1}
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  );
                })}

                {/* 形心 */}
                {sectionResult.A > 0 && (
                  <g>
                    <line x1={toSvgX(centroidX) - 10} y1={toSvgY(centroidY)} x2={toSvgX(centroidX) + 10} y2={toSvgY(centroidY)} stroke="#10b981" strokeWidth="2" />
                    <line x1={toSvgX(centroidX)} y1={toSvgY(centroidY) - 10} x2={toSvgX(centroidX)} y2={toSvgY(centroidY) + 10} stroke="#10b981" strokeWidth="2" />
                    <circle cx={toSvgX(centroidX)} cy={toSvgY(centroidY)} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" />
                    <text x={toSvgX(centroidX) + 12} y={toSvgY(centroidY) - 10} fill="#10b981" fontSize="16" fontWeight="bold">C</text>
                  </g>
                )}

                {/* 鼠标位置十字线 */}
                {tool === 'draw' && (
                  <g>
                    <line x1={toSvgX(mousePos.x)} y1="0" x2={toSvgX(mousePos.x)} y2={svgHeight} stroke="#82d9c6" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
                    <line x1="0" y1={toSvgY(mousePos.y)} x2={svgWidth} y2={toSvgY(mousePos.y)} stroke="#82d9c6" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
                    <circle cx={toSvgX(mousePos.x)} cy={toSvgY(mousePos.y)} r="5" fill="none" stroke="#82d9c6" strokeWidth="2" />
                  </g>
                )}
              </svg>
            {!pointCount&&<div className="draw-canvas-empty"><span><Hexagon size={42}/></span><h3>绘制你的截面</h3><p>沿边界依次落点，回到起点即可闭合</p><small>也可以在左侧输入 X / Y 坐标精确绘制</small></div>}
            <div className="draw-canvas-caption"><span className={tool==='draw'?'is-drawing':''}/>{tool==='draw'?(currentDrawingPath?`轮廓绘制中 · ${currentDrawingPath.vertices.length} 点`:'点击画布添加顶点'):tool==='select'?'点击轮廓或顶点，编辑精确坐标':'拖动画布平移视图'}</div>
            <div className="draw-zoom-controls"><button className="draw-icon" onClick={()=>handleZoom(-0.2)} aria-label="缩小画布"><ZoomOut size={16}/></button><span>{Math.round(zoom*100)}%</span><button className="draw-icon" onClick={()=>handleZoom(0.2)} aria-label="放大画布"><ZoomIn size={16}/></button><i/><button className="draw-icon" onClick={fitDrawing} aria-label="适合画布" title="适合画布"><Crosshair size={16}/></button><button className="draw-icon" onClick={resetView} aria-label="重置画布" title="重置画布"><ResetIcon size={16}/></button></div>
            <div className="draw-canvas-help"><span>Enter 闭合</span><span>Esc 结束工具</span><span>滚轮缩放 · 中键平移</span></div>
          </div>
          <footer className="draw-results" aria-label="截面实时计算结果"><div className="draw-results-heading"><Calculator size={18}/><span>截面特性<small>{unfinished?'待闭合':'实时计算'}</small></span></div><div><span>净面积 A</span><strong>{sectionResult.A>0?formatValue(sectionResult.A):'—'}<small>mm²</small></strong></div><div><span>惯性矩 Iₓ</span><strong>{sectionResult.A>0?formatValue(sectionResult.Ix):'—'}<small>mm⁴</small></strong></div><div><span>惯性矩 Iᵧ</span><strong>{sectionResult.A>0?formatValue(sectionResult.Iy):'—'}<small>mm⁴</small></strong></div><div><span>形心 Cₓ / Cᵧ</span><strong>{sectionResult.A>0?`${formatValue(centroidX)} / ${formatValue(centroidY)}`:'—'}<small>mm</small></strong></div></footer>
          <div className="draw-statusbar"><span>{saveHint}</span><span>{paths.length} 轮廓 <i/> {pointCount} 顶点</span></div>
        </main>
      </div>
    </div>
  );
};

// 单位系统
type UnitSystem = "mm" | "cm" | "m";

const UNIT_CONFIG: Record<UnitSystem, {
  label: string;
  length: string;
  area: string;
  inertia: string;
  modulus: string;
  // 从mm转换的系数
  lengthFactor: number;
  areaFactor: number;
  inertiaFactor: number;
  modulusFactor: number;
}> = {
  mm: {
    label: "毫米 (mm)",
    length: "mm",
    area: "mm²",
    inertia: "mm⁴",
    modulus: "mm³",
    lengthFactor: 1,
    areaFactor: 1,
    inertiaFactor: 1,
    modulusFactor: 1,
  },
  cm: {
    label: "厘米 (cm)",
    length: "cm",
    area: "cm²",
    inertia: "cm⁴",
    modulus: "cm³",
    lengthFactor: 0.1,        // mm -> cm
    areaFactor: 0.01,         // mm² -> cm²
    inertiaFactor: 0.0001,    // mm⁴ -> cm⁴
    modulusFactor: 0.001,     // mm³ -> cm³
  },
  m: {
    label: "米 (m)",
    length: "m",
    area: "m²",
    inertia: "m⁴",
    modulus: "m³",
    lengthFactor: 0.001,           // mm -> m
    areaFactor: 0.000001,          // mm² -> m²
    inertiaFactor: 0.000000000001, // mm⁴ -> m⁴
    modulusFactor: 0.000000001,    // mm³ -> m³
  },
};

// 格式化数值显示
const formatValue = (value: number): string => {
  if (value === 0) return "0";
  const absValue = Math.abs(value);
  if (absValue < 0.001) return value.toExponential(3);
  if (absValue < 0.01) return value.toFixed(4);
  if (absValue < 1) return value.toFixed(3);
  if (absValue < 100) return value.toFixed(2);
  if (absValue < 10000) return value.toFixed(1);
  return value.toExponential(3);
};

// 结果显示组件
const ResultItem: React.FC<{ label: string; value: number; unit: string; formula?: string }> = ({ label, value, unit, formula }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2">
      <span className="text-slate-700 text-sm">{label}</span>
      {formula && (
        <span className="text-xs text-slate-400 font-mono">({formula})</span>
      )}
    </div>
    <span className="font-mono font-medium" style={{ color: 'var(--color-1)' }}>
      {formatValue(value)}
      <span className="text-slate-500 text-xs ml-1">{unit}</span>
    </span>
  </div>
);

// 计算步骤组件
const StepBox: React.FC<{ step: number; title: string; children: React.ReactNode }> = ({ step, title, children }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--color-1)' }}>
        {step}
      </span>
      <span className="text-slate-800 font-medium">{title}</span>
    </div>
    <div className="pl-8 space-y-2">
      {children}
    </div>
  </div>
);

const FormulaLine: React.FC<{ formula: string; result?: string; highlight?: boolean }> = ({ formula, result, highlight }) => (
  <div className={`font-mono text-sm py-1 ${highlight ? '' : 'text-slate-500'}`} style={highlight ? { color: 'var(--color-2)' } : {}}>
    <span>{formula}</span>
    {result && (
      <>
        <span className="text-slate-400 mx-2">=</span>
        <span className={highlight ? 'font-semibold' : 'text-slate-600'} style={highlight ? { color: 'var(--color-1)' } : {}}>{result}</span>
      </>
    )}
  </div>
);

// 计算过程演示组件
const CalculationSteps: React.FC<{ 
  type: SectionType; 
  params: SectionParams;
  rawResult: SectionResult;
}> = ({ type, params, rawResult }) => {
  const renderSteps = () => {
    switch (type) {
      case "rectangle": {
        const { b, h } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = b × h" />
              <FormulaLine formula={`A = ${b} × ${h}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算对x轴惯性矩 Ix">
              <FormulaLine formula="Ix = b × h³ / 12" />
              <FormulaLine formula={`Ix = ${b} × ${h}³ / 12`} />
              <FormulaLine formula={`Ix = ${b} × ${Math.pow(h, 3)} / 12`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算对y轴惯性矩 Iy">
              <FormulaLine formula="Iy = h × b³ / 12" />
              <FormulaLine formula={`Iy = ${h} × ${b}³ / 12`} />
              <FormulaLine formula={`Iy = ${h} × ${Math.pow(b, 3)} / 12`} result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算惯性半径 ix, iy">
              <FormulaLine formula="ix = √(Ix / A)" />
              <FormulaLine formula={`ix = √(${formatValue(rawResult.Ix)} / ${formatValue(rawResult.A)})`} result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" />
              <FormulaLine formula={`iy = √(${formatValue(rawResult.Iy)} / ${formatValue(rawResult.A)})`} result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算抗弯截面模量 Wx, Wy">
              <FormulaLine formula="Wx = Ix / ymax = Ix / (h/2)" />
              <FormulaLine formula={`Wx = ${formatValue(rawResult.Ix)} / ${h/2}`} result={`${formatValue(rawResult.Wx)} mm³`} highlight />
              <FormulaLine formula="Wy = Iy / xmax = Iy / (b/2)" />
              <FormulaLine formula={`Wy = ${formatValue(rawResult.Iy)} / ${b/2}`} result={`${formatValue(rawResult.Wy)} mm³`} highlight />
            </StepBox>
            
            <StepBox step={6} title="计算极惯性矩 Ip">
              <FormulaLine formula="Ip = Ix + Iy" />
              <FormulaLine formula={`Ip = ${formatValue(rawResult.Ix)} + ${formatValue(rawResult.Iy)}`} result={`${formatValue(rawResult.Ip)} mm⁴`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "circle": {
        const { d } = params;
        const r = d / 2;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = π × r²" />
              <FormulaLine formula={`A = π × ${r}²`} />
              <FormulaLine formula={`A = π × ${r * r}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算惯性矩 Ix = Iy">
              <FormulaLine formula="I = π × d⁴ / 64" />
              <FormulaLine formula={`I = π × ${d}⁴ / 64`} />
              <FormulaLine formula={`I = π × ${Math.pow(d, 4)} / 64`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">圆形截面对任意直径轴的惯性矩相等</p>
            </StepBox>
            
            <StepBox step={3} title="计算极惯性矩 Ip">
              <FormulaLine formula="Ip = π × d⁴ / 32" />
              <FormulaLine formula={`Ip = π × ${d}⁴ / 32`} result={`${formatValue(rawResult.Ip)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">或 Ip = 2 × I</p>
            </StepBox>
            
            <StepBox step={4} title="计算惯性半径 i">
              <FormulaLine formula="i = √(I / A) = d / 4" />
              <FormulaLine formula={`i = ${d} / 4`} result={`${formatValue(rawResult.ix)} mm`} highlight />
              <p className="text-xs text-slate-500 mt-1">圆形截面惯性半径等于直径的1/4</p>
            </StepBox>
            
            <StepBox step={5} title="计算抗弯截面模量 W">
              <FormulaLine formula="W = π × d³ / 32" />
              <FormulaLine formula={`W = π × ${d}³ / 32`} result={`${formatValue(rawResult.Wx)} mm³`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "hollow-circle": {
        const { D, d } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = π × (D² - d²) / 4" />
              <FormulaLine formula={`A = π × (${D}² - ${d}²) / 4`} />
              <FormulaLine formula={`A = π × (${D*D} - ${d*d}) / 4`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算惯性矩 I">
              <FormulaLine formula="I = π × (D⁴ - d⁴) / 64" />
              <FormulaLine formula={`I = π × (${D}⁴ - ${d}⁴) / 64`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算极惯性矩 Ip">
              <FormulaLine formula="Ip = π × (D⁴ - d⁴) / 32" />
              <FormulaLine formula={`Ip = π × (${Math.pow(D,4)} - ${Math.pow(d,4)}) / 32`} result={`${formatValue(rawResult.Ip)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算惯性半径 i">
              <FormulaLine formula="i = √(I / A)" />
              <FormulaLine formula={`i = √(${formatValue(rawResult.Ix)} / ${formatValue(rawResult.A)})`} result={`${formatValue(rawResult.ix)} mm`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算抗弯截面模量 W">
              <FormulaLine formula="W = I / (D/2)" />
              <FormulaLine formula={`W = ${formatValue(rawResult.Ix)} / ${D/2}`} result={`${formatValue(rawResult.Wx)} mm³`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "hollow-rectangle": {
        const { B, H, t } = params;
        const b = B - 2 * t;
        const h = H - 2 * t;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算内部尺寸">
              <FormulaLine formula="内宽 b = B - 2t" />
              <FormulaLine formula={`b = ${B} - 2×${t}`} result={`${b} mm`} highlight />
              <FormulaLine formula="内高 h = H - 2t" />
              <FormulaLine formula={`h = ${H} - 2×${t}`} result={`${h} mm`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = B×H - b×h" />
              <FormulaLine formula={`A = ${B}×${H} - ${b}×${h}`} />
              <FormulaLine formula={`A = ${B*H} - ${b*h}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算对x轴惯性矩 Ix">
              <FormulaLine formula="Ix = (B×H³ - b×h³) / 12" />
              <FormulaLine formula={`Ix = (${B}×${H}³ - ${b}×${h}³) / 12`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算对y轴惯性矩 Iy">
              <FormulaLine formula="Iy = (H×B³ - h×b³) / 12" />
              <FormulaLine formula={`Iy = (${H}×${B}³ - ${h}×${b}³) / 12`} result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "i-beam": {
        const { H, B, tw, tf } = params;
        const hw = H - 2 * tf;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算腹板高度">
              <FormulaLine formula="hw = H - 2×tf" />
              <FormulaLine formula={`hw = ${H} - 2×${tf}`} result={`${hw} mm`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = 2×B×tf + hw×tw" />
              <FormulaLine formula={`A = 2×${B}×${tf} + ${hw}×${tw}`} />
              <FormulaLine formula={`A = ${2*B*tf} + ${hw*tw}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算对x轴惯性矩 Ix">
              <FormulaLine formula="Ix = [B×H³ - (B-tw)×hw³] / 12" />
              <FormulaLine formula={`Ix = [${B}×${H}³ - ${B-tw}×${hw}³] / 12`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">工字钢对x轴惯性矩远大于对y轴</p>
            </StepBox>
            
            <StepBox step={4} title="计算对y轴惯性矩 Iy">
              <FormulaLine formula="Iy = (2×tf×B³ + hw×tw³) / 12" />
              <FormulaLine formula={`Iy = (2×${tf}×${B}³ + ${hw}×${tw}³) / 12`} result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
              <p className="text-xs text-slate-500 mt-1">ix 远大于 iy，说明工字钢适合承受绕x轴的弯矩</p>
            </StepBox>
            
            <StepBox step={6} title="计算抗弯截面模量">
              <FormulaLine formula="Wx = Ix / (H/2)" result={`${formatValue(rawResult.Wx)} mm³`} highlight />
              <FormulaLine formula="Wy = Iy / (B/2)" result={`${formatValue(rawResult.Wy)} mm³`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "angle": {
        const { L, t } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="分解截面">
              <p className="text-xs text-slate-400 mb-2">将等边角钢分解为两个矩形：</p>
              <FormulaLine formula={`水平肢: ${L} × ${t} mm`} />
              <FormulaLine formula={`垂直肢: ${t} × ${L - t} mm`} />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = t × (2L - t)" />
              <FormulaLine formula={`A = ${t} × (2×${L} - ${t})`} />
              <FormulaLine formula={`A = ${t} × ${2*L - t}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算形心位置">
              <FormulaLine formula="xc = yc (等边角钢对称)" />
              <p className="text-xs text-slate-500 mt-1">形心在45°对角线上</p>
            </StepBox>
            
            <StepBox step={4} title="计算惯性矩 (平行轴定理)">
              <FormulaLine formula="Ix = Iy (等边角钢)" />
              <FormulaLine formula="I = Σ(I₀ + A×d²)" result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性半径">
              <FormulaLine formula="ix = iy = √(I / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "unequal-angle": {
        const { B, b, t } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="分解截面">
              <p className="text-xs text-slate-400 mb-2">将不等边角钢分解为两个矩形：</p>
              <FormulaLine formula={`水平肢 (长边): ${B} × ${t} mm`} />
              <FormulaLine formula={`垂直肢 (短边): ${t} × ${b - t} mm`} />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = A₁ + A₂" />
              <FormulaLine formula={`A₁ = ${B} × ${t} = ${B * t} mm²`} />
              <FormulaLine formula={`A₂ = ${t} × ${b - t} = ${t * (b - t)} mm²`} />
              <FormulaLine formula={`A = ${B * t} + ${t * (b - t)}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算形心位置">
              <FormulaLine formula="xc = (A₁×x₁ + A₂×x₂) / A" />
              <FormulaLine formula="yc = (A₁×y₁ + A₂×y₂) / A" />
              <p className="text-xs text-slate-500 mt-1">不等边角钢形心不在对角线上</p>
            </StepBox>
            
            <StepBox step={4} title="计算惯性矩 Ix (平行轴定理)">
              <FormulaLine formula="Ix = Σ(I₀ + A×dy²)" />
              <FormulaLine formula="Ix = I₁ + A₁×(y₁-yc)² + I₂ + A₂×(y₂-yc)²" result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性矩 Iy (平行轴定理)">
              <FormulaLine formula="Iy = Σ(I₀ + A×dx²)" />
              <FormulaLine formula="Iy = I₁ + A₁×(x₁-xc)² + I₂ + A₂×(x₂-xc)²" result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">Ix ≠ Iy，长边方向惯性矩更大</p>
            </StepBox>
            
            <StepBox step={6} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
          </div>
        );
      }
      
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = ∫ dA" result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算惯性矩">
              <FormulaLine formula="Ix = ∫ y² dA" result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
              <FormulaLine formula="Iy = ∫ x² dA" result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算抗弯截面模量">
              <FormulaLine formula="Wx = Ix / ymax" result={`${formatValue(rawResult.Wx)} mm³`} highlight />
              <FormulaLine formula="Wy = Iy / xmax" result={`${formatValue(rawResult.Wy)} mm³`} highlight />
            </StepBox>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-2)' }} />
        <span>当前截面：<span className="text-slate-800 font-medium">{SECTION_CONFIGS[type].name}</span></span>
      </div>
      {renderSteps()}
    </div>
  );
};

// 主组件
export const SectionModule = ({model,onModelChange}:{model:SectionModel;onModelChange:(model:SectionModel)=>void})=>{
  const [isDrawModalOpen,setIsDrawModalOpen]=useState(false);
  const config=SECTION_TOOL_CONFIGS[model.sectionType];
  const rawResult=useMemo(()=>model.sectionType==='draw'?calculatePolygonSection(model.paths):config.calculate(model.parameters),[model.sectionType,model.parameters,model.paths]);
  const handleTypeChange=(type:SectionType)=>{
    onModelChange({...model,sectionType:type,parameters:Object.fromEntries(SECTION_TOOL_CONFIGS[type].params.map(p=>[p.key,p.default]))});
    if(type==='draw'&&!model.paths.length)setIsDrawModalOpen(true);
  };
  return <><SectionWorkspace model={model} onModelChange={onModelChange} rawResult={rawResult} onTypeChange={handleTypeChange} onDraw={()=>setIsDrawModalOpen(true)} steps={<CalculationSteps type={model.sectionType} params={model.parameters} rawResult={rawResult}/>}/>
    <SectionDrawModal key={isDrawModalOpen?'open':'closed'} isOpen={isDrawModalOpen} onClose={()=>setIsDrawModalOpen(false)} onSave={paths=>onModelChange({...model,paths})} initialPaths={model.paths}/>
  </>;
};
