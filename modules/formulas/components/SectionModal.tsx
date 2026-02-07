import React, { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { LatexRenderer } from "../../../components";
import { SectionFormula } from "../types";

// 截面模态框
export const SectionModal: React.FC<{ section: SectionFormula; onClose: () => void }> = ({ section, onClose }) => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopiedFormula(text); setTimeout(() => setCopiedFormula(null), 2000); };
  
  // 截面参数说明
  const sectionParams: Record<string, string> = {
    "rect": "b-宽度 h-高度 A-面积 Ix-惯性矩 Wx-截面模量",
    "circle": "r-半径 A-面积 I-惯性矩 W-截面模量",
    "hollow": "R-外半径 r-内半径 A-面积 I-惯性矩",
    "i-beam": "B-翼缘宽 H-总高度 tf-翼缘厚 tw-腹板厚 A-面积 Ix-惯性矩",
  };
  const params = sectionParams[section.id] || "";
  const paramsList = params.split(' ').filter(p => p.includes('-'));
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="px-6 py-4" style={{ background: 'linear-gradient(to right, var(--color-1), var(--color-2))' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white/70 text-xs font-medium">{section.group}</span>
              <h2 className="text-xl font-bold text-white">{section.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 截面图示 */}
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 rounded-xl border p-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.3)', borderColor: 'var(--color-4)' }}>
              {section.diagram}
            </div>
          </div>
          
          {/* 公式列表 */}
          <div className="space-y-3 mb-6">
            {section.formulas.map((f, idx) => (
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
          {paramsList.length > 0 && (
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(var(--color-5-rgb), 0.1)', borderColor: 'var(--color-5)' }}>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-5)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          )}
        </div>
      </div>
    </div>
  );
};

export const SectionCard: React.FC<{ section: SectionFormula }> = ({ section }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all w-full" style={{ borderColor: 'var(--color-4)' }}>
        <div className="aspect-[4/3] p-3 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.3)' }}>
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="w-16 h-16">{section.diagram}</div>
          </div>
          <h3 className="font-semibold text-xs text-center" style={{ color: 'var(--color-1)' }}>{section.name}</h3>
        </div>
      </button>
      {showModal && <SectionModal section={section} onClose={() => setShowModal(false)} />}
    </>
  );
};
