import React from 'react';
import { CalculationDiagnostic } from '../mechanics/validation';

export function InvalidCalculation({ diagnostics, onReset }: { diagnostics: CalculationDiagnostic[]; onReset: () => void }) {
  return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
    <p className="font-semibold">当前参数无法计算</p>
    {diagnostics.map((item, i) => <p key={`${item.field}-${i}`} className="mt-1">{item.message}</p>)}
    <button type="button" onClick={onReset} className="mt-3 rounded-lg bg-white px-3 py-2 font-medium text-rose-700 border border-rose-200">
      恢复当前实验默认参数
    </button>
  </div>;
}

export function CalculationNotice({ assumptions, warnings = [] }: { assumptions: string[]; warnings?: string[] }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
    <p className="font-semibold text-slate-700">计算模型与适用范围</p>
    {assumptions.map(text => <p key={text} className="mt-1">{text}</p>)}
    {warnings.map(text => <p key={text} className="mt-2 font-medium text-amber-700">{text}</p>)}
  </div>;
}
