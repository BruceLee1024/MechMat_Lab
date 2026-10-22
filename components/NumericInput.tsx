import React, { useEffect, useId, useState, useRef } from 'react';
import { NumericConstraints, parseNumericInput, validateNumber } from '../mechanics/validation';

interface NumericInputProps extends NumericConstraints {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  validate?: (value: number) => string | null;
  compact?: boolean;
  displayDecimals?: number;
}

// 输入草稿与已提交参数分开：清空、负号和指数输入期间不污染计算状态。
export function NumericInput({ label, value, onChange, unit = '', validate, compact = false, displayDecimals, ...constraints }: NumericInputProps) {
  const id = useId();
  // 固定小数只影响显示，聚焦时恢复完整数值用于编辑。
  const format = (v: number) => displayDecimals === undefined ? String(v) : v.toFixed(displayDecimals);
  const [draft, setDraft] = useState(() => format(value));
  const dirty = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { dirty.current = false; setDraft(displayDecimals === undefined ? String(value) : value.toFixed(displayDecimals)); setError(null); }, [value, displayDecimals]);

  const commit = () => {
    // 显示用的舍入文本不能在二次失焦时回写，只有用户编辑过才提交。
    if (!dirty.current) { if (!error) setDraft(format(value)); return; }
    const next = parseNumericInput(draft);
    const problem = next === null ? '请输入完整数值，可使用科学计数法' : validateNumber(next, constraints) || validate?.(next);
    setError(problem || null);
    if (!problem && next !== null) {
      dirty.current = false;
      setDraft(format(next));
      if (next !== value) onChange(next);
    }
  };

  return (
    <div className={compact ? 'min-w-0' : 'mb-2 min-w-0'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-slate-600">{label}</label>
        <div className="flex items-center gap-1 min-w-0">
          <input id={id} type="text" inputMode="decimal" value={draft}
            aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
            onFocus={() => { if (displayDecimals !== undefined && !error) setDraft(String(value)); }}
            onChange={event => { dirty.current = true; setDraft(event.target.value); setError(null); }} onBlur={commit}
            onKeyDown={event => {
              if (event.key === 'Enter') { event.preventDefault(); commit(); }
              if (event.key === 'Escape') { dirty.current = false; setDraft(format(value)); setError(null); }
            }}
            className="w-24 max-w-full px-2 py-1 text-sm font-mono text-right border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-300"
            style={{ color: 'var(--color-1)', borderColor: error ? '#e11d48' : 'var(--color-3)' }} />
          {unit ? <span className="text-xs text-slate-500">{unit}</span> : null}
        </div>
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-600">{error}；计算保留上次有效值。</p> : null}
    </div>
  );
}
