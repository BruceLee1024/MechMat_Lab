import { ExperimentDocument, serializeExperiment } from './schema';
import { difference, getInputs, getModuleLabel, getResults, validateComparison } from './results';

export function safeFilename(name: string): string { return (name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 80) || '实验记录'); }
export function downloadFile(content: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportJSON(document: ExperimentDocument) { downloadFile(serializeExperiment(document), 'application/json;charset=utf-8', `${safeFilename(document.name)}.json`); }
function cell(value: number | string): string {
  let text = String(value); if (typeof value === 'string' && /^[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function createCSV(documents: ExperimentDocument[]): string {
  validateComparison(documents);
  const baseline = [...getInputs(documents[0]).map(row => ({ ...row, label: `输入：${row.label}` })), ...getResults(documents[0]).metrics];
  const rows: (string | number)[][] = [['工况', '模块', '计算版本', '指标', '单位', '数值', '绝对变化', '相对变化 (%)']];
  for (const document of documents) {
    for (const row of [...getInputs(document).map(r => ({ ...r, label: `输入：${r.label}` })), ...getResults(document).metrics]) {
      const reference = baseline.find(item => item.label === row.label && item.unit === row.unit);
      const delta = typeof row.value === 'number' && typeof reference?.value === 'number' ? difference(row.value, reference.value) : null;
      rows.push([document.name, getModuleLabel(document.module), document.calculationVersion, row.label, row.unit, row.value, delta?.absolute ?? '不适用', delta?.relative ?? '不适用']);
    }
  }
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
export function exportCSV(documents: ExperimentDocument[]) { downloadFile(createCSV(documents), 'text/csv;charset=utf-8', `${safeFilename(documents[0].name)}_工况数据.csv`); }
