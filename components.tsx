import React, { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, MoveVertical, RotateCw, Minimize2, MoveDiagonal, 
  BookOpen, Lightbulb, X, Layers, Beaker, GraduationCap, Calculator, Palette
} from "lucide-react";
import katex from "katex";
import { ModuleType, THEORY_INFO } from "./types";
import { ThemeName, THEMES, THEME_NAMES } from "./theme";

// --- Latex Renderer ---
export const LatexRenderer = ({ formula }: { formula: string }) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (!formula) return;
    try {
      const rendered = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true,
        output: "html",
        strict: false,
      });
      setHtml(rendered);
    } catch (e: any) {
      console.error("KaTeX render error:", e);
      setHtml(`<div class="font-mono text-sm text-rose-600 bg-rose-50 p-2 rounded">Error: ${formula}</div>`);
    }
  }, [formula]);

  return (
    <div 
      className="overflow-x-auto overflow-y-hidden text-slate-800 py-1"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};

// --- Markdown Renderer ---
export const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  
  const flushList = () => {
      if (listItems.length > 0) {
          elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-outside ml-5 mb-4 space-y-1">{[...listItems]}</ul>);
          listItems = [];
      }
  };

  const parseInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-indigo-900">{part.slice(2, -2)}</strong>;
          }
          return part;
      });
  };

  lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) { flushList(); return; }

      if (trimmed.startsWith('###')) {
          flushList();
          elements.push(<h3 key={index} className="text-lg font-bold text-slate-800 mt-4 mb-2">{parseInline(trimmed.replace(/^#{3,}\s*/, ''))}</h3>);
      } else if (trimmed.startsWith('##')) {
           flushList();
          elements.push(<h2 key={index} className="text-xl font-bold text-slate-800 mt-5 mb-2">{parseInline(trimmed.replace(/^#{2,}\s*/, ''))}</h2>);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          listItems.push(<li key={index} className="text-slate-700 marker:text-indigo-400">{parseInline(trimmed.replace(/^[-*]\s*/, ''))}</li>);
      } else {
          flushList();
          elements.push(<p key={index} className="mb-2 text-slate-700 leading-relaxed">{parseInline(trimmed)}</p>);
      }
  });
  flushList();

  return <div className="text-sm">{elements}</div>;
};

// --- Slider Control ---
export const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm font-bold" style={{ color: 'var(--color-1)' }}>
        {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

// --- Material Selector ---
export const MaterialSelector = ({ 
  onSelect,
  currentE,
  currentG,
  currentYield,
  currentPoisson
}: { 
  onSelect: (mat: { name: string, E: number, G: number, yield: number, poisson: number }) => void;
  currentE?: number;
  currentG?: number;
  currentYield?: number;
  currentPoisson?: number;
}) => {
  const materials = [
    { name: "结构钢 (Structural Steel)", E: 200, G: 77, yield: 250, poisson: 0.3 },
    { name: "高强钢 (High Strength Steel)", E: 210, G: 80, yield: 700, poisson: 0.3 }, 
    { name: "铝合金 (Aluminum 6061)", E: 70, G: 26, yield: 276, poisson: 0.33 },
    { name: "钛合金 (Titanium)", E: 110, G: 42, yield: 830, poisson: 0.34 },
    { name: "黄铜 (Brass)", E: 100, G: 39, yield: 200, poisson: 0.34 },
    { name: "混凝土 (Concrete C30)", E: 30, G: 12.5, yield: 30, poisson: 0.2 },
    { name: "木材 (Timber - Oak)", E: 12, G: 0.8, yield: 40, poisson: 0.35 },
    { name: "玻璃 (Glass)", E: 70, G: 28, yield: 50, poisson: 0.22 },
    { name: "橡胶 (Rubber, Isoprene)", E: 0.01, G: 0.003, yield: 15, poisson: 0.49 }, 
  ];

  const activeMat = materials.find(m => 
    ((currentE && Math.abs(m.E - currentE) < 1) || (currentG && Math.abs(m.G - currentG) < 1)) &&
    (!currentYield || Math.abs(m.yield - currentYield) < 5)
  );

  return (
    <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        <Beaker className="w-3 h-3" style={{ color: 'var(--color-2)' }} /> 常用材料库 (Material Library)
      </label>
      <select 
        className="w-full p-2 text-sm border rounded bg-white text-slate-700 outline-none"
        style={{ borderColor: 'var(--color-3)', focusRing: 'var(--color-1)' }}
        value={activeMat ? activeMat.name : "custom"}
        onChange={(e) => {
          const mat = materials.find(m => m.name === e.target.value);
          if (mat) onSelect(mat);
        }}
      >
        <option value="custom" disabled>-- 自定义参数 (Custom) --</option>
        {materials.map(m => (
          <option key={m.name} value={m.name}>{m.name}</option>
        ))}
      </select>
      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500 font-mono">
         <span>E: {activeMat ? activeMat.E : currentE} GPa</span>
         <span>G: {activeMat ? activeMat.G : currentG} GPa</span>
         <span>σ_y: {activeMat ? activeMat.yield : currentYield} MPa</span>
         <span>ν: {activeMat ? activeMat.poisson : currentPoisson}</span>
      </div>
    </div>
  );
};

// --- Sidebar ---
export const Sidebar = ({ 
  activeModule, 
  setActiveModule, 
  isMenuOpen, 
  setIsMenuOpen,
  currentTheme,
  onThemeChange
}: { 
  activeModule: ModuleType;
  setActiveModule: (m: ModuleType) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (o: boolean) => void;
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}) => {
  const menuItems: { id: ModuleType; label: string; icon: React.ReactNode }[] = [
    { id: "fundamentals", label: "理论基础", icon: <GraduationCap className="w-5 h-5" /> },
    { id: "axial", label: "轴向拉伸", icon: <ArrowRight className="w-5 h-5" /> },
    { id: "bending", label: "梁的弯曲", icon: <MoveVertical className="w-5 h-5" /> },
    { id: "torsion", label: "圆轴扭转", icon: <RotateCw className="w-5 h-5" /> },
    { id: "buckling", label: "压杆稳定", icon: <Minimize2 className="w-5 h-5" /> },
    { id: "combined", label: "组合变形", icon: <Layers className="w-5 h-5" /> },
    { id: "stress", label: "应力状态", icon: <MoveDiagonal className="w-5 h-5" /> },
    { id: "solver", label: "结构求解器", icon: <Calculator className="w-5 h-5" /> },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h1 className="text-lg font-bold tracking-tight text-white">材料力学<span style={{ color: 'var(--color-1)' }}>可视化</span>实验室</h1>
        <button onClick={() => setIsMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
           <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 text-sm overflow-y-auto">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => { setActiveModule(item.id); setIsMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border border-transparent ${activeModule === item.id ? "text-white shadow-lg" : "hover:bg-slate-800 hover:text-slate-200 text-slate-400"}`}
            style={activeModule === item.id ? { backgroundColor: 'var(--color-1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' } : {}}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      {/* 主题切换器 */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Palette className="w-3 h-3" /> 主题配色
          </label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {(Object.keys(THEMES) as ThemeName[]).map((themeName) => (
              <button
                key={themeName}
                onClick={() => onThemeChange(themeName)}
                className={`h-10 rounded-lg transition-all flex items-center justify-center ${currentTheme === themeName ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: THEMES[themeName].color1 }}
                title={THEME_NAMES[themeName]}
              >
                <span className="text-xs font-semibold text-white drop-shadow">
                  {THEME_NAMES[themeName]}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500 text-center pt-3 border-t border-slate-800">
          <p className="mb-1 text-slate-400">工程设计</p>
          <p className="font-semibold text-slate-300">Engineer</p>
        </div>
      </div>
    </div>
  );
};

// --- Theory Panel ---
export const TheoryPanel = ({ activeModule, className }: { activeModule: ModuleType; className?: string }) => {
  const info = THEORY_INFO[activeModule];
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col ${className || 'h-[500px]'}`}>
      <div className="p-6 pb-0">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--color-2)' }} /> 核心概念与公式
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <div className="space-y-6">
            {info.formulas.map((item, idx) => (
                <div key={idx}>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    </div>
                    <div className="bg-slate-50 border rounded px-3 text-slate-800 mb-2 py-1" style={{ borderColor: 'var(--color-3)' }}>
                        <LatexRenderer formula={item.latex} />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-5)' }}>
                <Lightbulb className="w-4 h-4" /> 物理直觉
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed p-3 rounded border" style={{ backgroundColor: 'rgba(var(--color-5-rgb), 0.1)', borderColor: 'var(--color-5)' }}>
                {info.insight}
            </p>
        </div>
      </div>
    </div>
  );
};