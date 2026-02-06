import React, { useState, useRef } from "react";
import { SolverState } from "../SolverTypes";

export const DiagramPanel = ({ state, diagramType }: { state: SolverState; diagramType: 'axial' | 'shear' | 'moment' | 'deflection' }) => {
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
  const allForces: { x: number; N: number; V: number; M: number; elemIdx: number }[] = [];
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
          N: f.N,
          V: f.V,
          M: f.M,
          elemIdx: i,
        });
      }
    }
    totalLength += L;
  }
  
  // 收集挠度曲线数据（使用单元的详细挠度曲线，而非仅节点位移）
  const allDeflections: { x: number; dy: number }[] = [];
  let deflOffset = 0;
  for (let i = 0; i < state.elements.length; i++) {
    const L = elemLengths[i];
    const elemResult = result.elements.find(er => er.elementId === state.elements[i].id);
    if (elemResult && elemResult.deflectionCurve.length > 0) {
      for (let j = 0; j < elemResult.deflectionCurve.length; j++) {
        // 跳过单元边界重复点
        if (j === 0 && allDeflections.length > 0) continue;
        const d = elemResult.deflectionCurve[j];
        allDeflections.push({
          x: deflOffset + d.position * L,
          dy: d.dy,
        });
      }
    }
    deflOffset += L;
  }

  // 找最大值用于缩放
  const maxN = Math.max(...allForces.map(f => Math.abs(f.N)), 1);
  const maxV = Math.max(...allForces.map(f => Math.abs(f.V)), 1);
  const maxM = Math.max(...allForces.map(f => Math.abs(f.M)), 1);
  const maxDy = allDeflections.length > 0
    ? Math.max(...allDeflections.map(d => Math.abs(d.dy)), 0.0001)
    : 0.0001;

  const width = 500;
  const height = 120;
  const padding = 40;
  const plotWidth = width - padding * 2;
  const plotHeight = height - 30;

  const getColor = () => {
    switch (diagramType) {
      case 'axial': return { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' };
      case 'shear': return { fill: 'rgba(79, 70, 229, 0.2)', stroke: '#4f46e5' };
      case 'moment': return { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b' };
      case 'deflection': return { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981' };
    }
  };
  const colors = getColor();

  const getTitle = () => {
    switch (diagramType) {
      case 'axial': return '轴力图 (N)';
      case 'shear': return '剪力图 (V)';
      case 'moment': return '弯矩图 (M)';
      case 'deflection': return '挠度图 (w)';
    }
  };

  // 构建路径
  let pathData = `M ${padding} ${height / 2}`;
  
  if (diagramType === 'deflection') {
    // 挠度图使用单元的详细挠度曲线
    allDeflections.forEach((d, i) => {
      const x = padding + (d.x / totalLength) * plotWidth;
      const y = height / 2 + (d.dy / maxDy) * (plotHeight / 2) * 0.8;
      if (i === 0) {
        pathData = `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
  } else if (diagramType === 'axial') {
    // 轴力图
    allForces.forEach((f, i) => {
      const x = padding + (f.x / totalLength) * plotWidth;
      const y = height / 2 - (f.N / maxN) * (plotHeight / 2) * 0.8;
      if (i === 0) {
        pathData = `M ${padding} ${height / 2} L ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    if (allForces.length > 0) {
      const lastX = padding + (allForces[allForces.length - 1].x / totalLength) * plotWidth;
      pathData += ` L ${lastX} ${height / 2} Z`;
    }
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
      // 从详细挠度曲线线性插值
      for (let i = 0; i < allDeflections.length - 1; i++) {
        const p1 = allDeflections[i];
        const p2 = allDeflections[i + 1];
        if (hoverX >= p1.x && hoverX <= p2.x) {
          const t = p2.x > p1.x ? (hoverX - p1.x) / (p2.x - p1.x) : 0;
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
        hoverValue = diagramType === 'axial' ? p.N : diagramType === 'shear' ? p.V : p.M;
        if (diagramType === 'axial') {
          hoverY = height / 2 - (hoverValue / (maxN || 1)) * (plotHeight / 2) * 0.8;
        } else if (diagramType === 'shear') {
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
            x={hoverX.toFixed(0)}mm, val={diagramType === 'moment' ? (hoverValue/1000).toFixed(2) + ' Nm' : hoverValue.toFixed(2) + (diagramType === 'axial' || diagramType === 'shear' ? ' N' : ' mm')}
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
            {diagramType === 'axial' && (
              <text x={padding + 10} y={height / 2 - plotHeight / 2 * 0.8 - 5} fontSize="10" fill={colors.stroke}>
                ±{maxN.toFixed(0)} N
              </text>
            )}
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
