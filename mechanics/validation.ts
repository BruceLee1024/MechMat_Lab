export type NumericDomain = 'positive' | 'nonnegative' | 'signed';

export interface NumericConstraints {
  domain?: NumericDomain;
  minimum?: number;
  maximum?: number;
}

export function validateNumber(value: number, { domain = 'positive', minimum, maximum }: NumericConstraints = {}): string | null {
  if (!Number.isFinite(value)) return '请输入有限数值';
  if (domain === 'positive' && value <= 0) return '必须大于 0';
  if (domain === 'nonnegative' && value < 0) return '不能小于 0';
  if (minimum !== undefined && value < minimum) return `不能小于 ${minimum}`;
  if (maximum !== undefined && value > maximum) return `不能大于 ${maximum}`;
  return null;
}

// Number() 接受空白与十六进制，参数输入仅接受十进制及科学计数法。
export function parseNumericInput(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export interface CalculationDiagnostic {
  field: string;
  message: string;
}

export type CalculationResult<T> =
  | { ok: true; values: T; assumptions: string[]; warnings: string[] }
  | { ok: false; diagnostics: CalculationDiagnostic[] };

export function invalidParameters(values: Record<string, number>, positiveFields: string[] = []): CalculationDiagnostic[] {
  return Object.entries(values).flatMap(([field, value]) => {
    const message = validateNumber(value, { domain: positiveFields.includes(field) ? 'positive' : 'signed' });
    return message ? [{ field, message: `${field}：${message}` }] : [];
  });
}

export function calculation<T>(values: T, assumptions: string[], warnings: string[] = []): CalculationResult<T> {
  // 极端但有限的参数仍可能在乘方、除法时溢出，不能将这些结果用于展示。
  const nonfinite = Object.entries(values).filter(([, value]) => typeof value === 'number' && !Number.isFinite(value));
  if (nonfinite.length) return { ok: false, diagnostics: nonfinite.map(([field]) => ({ field, message: '参数量级超出可计算范围，请调整输入' })) };
  return { ok: true, values, assumptions, warnings };
}
