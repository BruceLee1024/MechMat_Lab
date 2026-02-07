import React, { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { LatexRenderer } from "../../../components";
import { BeamFormula } from "../types";
import { CALCULATOR_CONFIG } from "../data/calculatorConfig";

// 模态框组件
export const FormulaModal: React.FC<{ formula: BeamFormula; onClose: () => void }> = ({ formula, onClose }) => {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const config = CALCULATOR_CONFIG[formula.id];
  
  // 初始化输入值
  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    if (!config) return {};
    const initial: Record<string, number> = {};
    config.inputs.forEach(inp => { initial[inp.key] = inp.default; });
    return initial;
  });
  
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopiedFormula(text); setTimeout(() => setCopiedFormula(null), 2000); };
  
  // 计算结果
  const results = config ? config.calculate(inputs) : [];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: 'linear-gradient(to right, var(--color-1), var(--color-2))', borderColor: 'var(--color-4)' }}>
          <div>
            <span className="text-white/70 text-xs font-medium">{formula.group}</span>
            <h2 className="text-lg font-bold text-white">{formula.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {config && (
              <button 
                onClick={() => setShowCalculator(!showCalculator)} 
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={showCalculator ? { backgroundColor: 'white', color: 'var(--color-1)' } : { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                {showCalculator ? '📊 查看公式' : '🧮 在线计算'}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* 内容区 */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!showCalculator ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* 左侧：图示 (3/5) */}
              <div className="lg:col-span-3 space-y-3">
                {/* FBD - 主图 */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.2)', borderColor: 'var(--color-4)' }}>
                  <h3 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-2)' }}>受力图 FBD</h3>
                  {formula.fbd}
                </div>
                {/* SFD + BMD 并排 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.2)', borderColor: 'var(--color-4)' }}>
                    <h3 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-2)' }}>剪力图 SFD</h3>
                    {formula.sfd}
                  </div>
                  <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.2)', borderColor: 'var(--color-4)' }}>
                    <h3 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-2)' }}>弯矩图 BMD</h3>
                    {formula.bmd}
                  </div>
                </div>
              </div>
              
              {/* 右侧：公式 (2/5) */}
              <div className="lg:col-span-2 space-y-2.5">
                {formula.formulas.map((f, i) => (
                  <div key={i} className="rounded-xl border group transition-all hover:shadow-md overflow-hidden" style={{ borderColor: 'var(--color-4)' }}>
                    <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: 'rgba(var(--color-1-rgb), 0.08)' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-2)' }}>{i + 1}</span>
                      <span className="text-xs font-medium flex-1" style={{ color: 'var(--color-1)' }}>{f.label}</span>
                      <button
                        onClick={() => handleCopy(f.formula)}
                        className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        style={{ backgroundColor: 'rgba(var(--color-1-rgb), 0.1)' }}
                        title="复制 LaTeX"
                      >
                        {copiedFormula === f.formula ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--color-2)' }} />}
                      </button>
                    </div>
                    <div className="px-3 py-3 flex items-center justify-center bg-white">
                      <div className="text-lg"><LatexRenderer formula={f.formula} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* 左侧：图示 (3/5) - 计算器模式也保留 */}
              <div className="lg:col-span-3 space-y-3">
                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.2)', borderColor: 'var(--color-4)' }}>
                  <h3 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-2)' }}>受力图 FBD</h3>
                  {formula.fbd}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.2)', borderColor: 'var(--color-4)' }}>
                    <h3 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-2)' }}>剪力图 SFD</h3>
                    {formula.sfd}
                  </div>
                  <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.2)', borderColor: 'var(--color-4)' }}>
                    <h3 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-2)' }}>弯矩图 BMD</h3>
                    {formula.bmd}
                  </div>
                </div>
              </div>
              
              {/* 右侧：计算器 (2/5) */}
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-1-rgb), 0.06)', borderColor: 'var(--color-1)' }}>
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-1)' }}>📥 输入参数</h3>
                  <div className="space-y-2">
                    {config?.inputs.map((inp) => (
                      <div key={inp.key} className="bg-white rounded-lg p-2 border flex items-center gap-2" style={{ borderColor: 'var(--color-4)' }}>
                        <label className="text-xs text-slate-500 w-20 flex-shrink-0">{inp.label}</label>
                        <input
                          type="number"
                          value={inputs[inp.key] || 0}
                          onChange={(e) => setInputs({ ...inputs, [inp.key]: parseFloat(e.target.value) || 0 })}
                          className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none min-w-0"
                          style={{ borderColor: 'var(--color-4)' }}
                        />
                        <span className="text-xs text-slate-400 w-14 flex-shrink-0 text-right">{inp.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-3-rgb), 0.06)', borderColor: 'var(--color-3)' }}>
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-3)' }}>📤 计算结果</h3>
                  <div className="space-y-1.5">
                    {results.map((r, i) => (
                      <div key={i} className="bg-white rounded-lg px-3 py-2 border flex items-center justify-between" style={{ borderColor: 'var(--color-4)' }}>
                        <div className="min-w-0">
                          <span className="text-xs text-slate-500 block truncate">{r.label}</span>
                          <span className="text-xs text-slate-400">({r.formula})</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="text-base font-bold" style={{ color: 'var(--color-1)' }}>{r.value.toFixed(3)}</span>
                          <span className="text-xs text-slate-500 ml-1">{r.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="rounded-lg p-2 border text-xs text-center" style={{ backgroundColor: 'rgba(var(--color-5-rgb), 0.08)', borderColor: 'var(--color-5)', color: 'var(--color-5)' }}>
                  💡 修改参数后结果自动更新
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 卡片组件
export const FormulaCard: React.FC<{ formula: BeamFormula }> = ({ formula }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all w-full" style={{ borderColor: 'var(--color-4)' }}>
        <div className="aspect-[4/3] p-2 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.3)' }}>
          <div className="w-full flex-1 flex items-center justify-center">{formula.fbd}</div>
          <h3 className="font-semibold text-xs text-center" style={{ color: 'var(--color-1)' }}>{formula.name}</h3>
        </div>
      </button>
      {showModal && <FormulaModal formula={formula} onClose={() => setShowModal(false)} />}
    </>
  );
};
