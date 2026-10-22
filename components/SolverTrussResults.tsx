import React from 'react';
import type { SolverResult } from '../solver/SolverTypes';

/** 桁架结果按杆件和节点表达，不能沿杆件编号拼出一条梁的挠曲线。 */
export function SolverTrussResults({ result }: { result: SolverResult | null }) {
  if (!result?.success) return <p className="p-4 text-xs text-slate-400">求解后显示杆件轴力与节点位移。</p>;
  const max = Math.max(1, ...result.elements.map(e => Math.abs(e.internalForces[0]?.N ?? 0)));
  return <section aria-label="桁架轴力与节点位移" className="h-full grid grid-cols-2 gap-4 p-3 text-xs overflow-auto">
    <div><h4 className="mb-2 text-slate-700">杆件轴力 N · 拉正压负</h4>
      {result.elements.map(e => { const n = e.internalForces[0]?.N ?? 0; return <div key={e.elementId} className="mb-2">
        <div className="flex justify-between gap-2"><span>{e.elementId}</span><span>{n.toFixed(1)} N · {n > 0 ? '拉' : n < 0 ? '压' : '零杆'}</span></div>
        <div className="h-1 mt-1 bg-slate-200 rounded"><div style={{ width: `${Math.abs(n) / max * 100}%`, height: '100%', background: n >= 0 ? '#69c8b6' : '#b99bde' }}/></div>
      </div>; })}
      <p className="text-[10px] text-slate-500">理想铰接桁架杆仅承受轴力，横向剪力与弯矩为零。</p>
    </div>
    <div><h4 className="mb-2 text-slate-700">节点位移 · mm</h4>
      <table className="w-full text-right"><thead><tr><th className="text-left">节点</th><th>dx</th><th>dy</th></tr></thead><tbody>
        {result.nodes.map(n => <tr key={n.nodeId}><th className="text-left font-normal py-1">{n.nodeId}</th><td>{n.displacement.dx.toFixed(4)}</td><td>{n.displacement.dy.toFixed(4)}</td></tr>)}
      </tbody></table><p className="mt-2 text-[10px] text-slate-500">全局坐标：x 向右、y 向下；正负表示位移方向。</p>
    </div>
  </section>;
}
