import React from "react";
import { LatexRenderer } from "../../components";
import { SolverState } from "../SolverTypes";

export const CalculationPanel = ({ state }: { state: SolverState }) => {
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
