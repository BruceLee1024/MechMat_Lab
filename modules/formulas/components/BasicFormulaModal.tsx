import React, { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { LatexRenderer } from "../../../components";
import { BasicFormula } from "../types";

// 基础公式模态框
export const BasicFormulaModal: React.FC<{ formula: BasicFormula; onClose: () => void }> = ({ formula, onClose }) => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopiedFormula(text); setTimeout(() => setCopiedFormula(null), 2000); };
  
  // 解析参数说明
  const paramsList = formula.params.split(' ').filter(p => p.includes('-'));
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="px-6 py-4" style={{ background: 'linear-gradient(to right, var(--color-1), var(--color-2))' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white/70 text-xs font-medium">{formula.group}</span>
              <h2 className="text-xl font-bold text-white">{formula.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 公式列表 */}
          <div className="space-y-3 mb-6">
            {formula.formulas.map((f, idx) => (
              <div key={idx} className="group rounded-xl p-4 border hover:shadow-md transition-all" style={{ background: 'linear-gradient(to right, rgba(var(--color-4-rgb), 0.3), white)', borderColor: 'var(--color-4)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-1)' }}>{f.label}</span>
                  <button onClick={() => handleCopy(f.formula)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all" style={{ backgroundColor: 'rgba(var(--color-1-rgb), 0.1)' }} title="复制LaTeX">
                    {copiedFormula === f.formula ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" style={{ color: 'var(--color-2)' }} />}
                  </button>
                </div>
                <div className="text-lg bg-white rounded-lg p-3 border" style={{ borderColor: 'var(--color-4)' }}>
                  <LatexRenderer formula={f.formula} />
                </div>
              </div>
            ))}
          </div>
          
          {/* 参数说明 */}
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(var(--color-5-rgb), 0.1)', borderColor: 'var(--color-5)' }}>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-5)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              参数说明
            </h4>
            <div className="flex flex-wrap gap-2">
              {paramsList.map((param, idx) => {
                const [symbol, desc] = param.split('-');
                return (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs border" style={{ borderColor: 'var(--color-5)' }}>
                    <span className="font-mono font-semibold" style={{ color: 'var(--color-1)' }}>{symbol}</span>
                    <span className="text-slate-600">{desc}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 基础公式卡片组件
export const BasicFormulaCard: React.FC<{ formula: BasicFormula }> = ({ formula }) => {
  const [showModal, setShowModal] = useState(false);
  
  // 获取第一个公式用于预览
  const previewFormula = formula.formulas[0]?.formula || "";
  
  return (
    <>
      <button onClick={() => setShowModal(true)} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all w-full text-left" style={{ borderColor: 'var(--color-4)' }}>
        <div className="aspect-[4/3] p-3 flex flex-col" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.3)' }}>
          <span className="text-xs font-medium mb-1" style={{ color: 'var(--color-2)' }}>{formula.group}</span>
          <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-1)' }}>{formula.name}</h3>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="transform scale-90 opacity-70">
              <LatexRenderer formula={previewFormula} />
            </div>
          </div>
          <div className="text-xs text-slate-400 text-right">{formula.formulas.length} 个公式</div>
        </div>
      </button>
      {showModal && <BasicFormulaModal formula={formula} onClose={() => setShowModal(false)} />}
    </>
  );
};
