import React, { useEffect, useState } from "react";
import {
  ArrowRight, MoveVertical, RotateCw, Minimize2, MoveDiagonal,
  BookOpen, Lightbulb, X, Layers, Beaker, GraduationCap, Calculator, Home, Settings, Library, Shapes,
  MessageCircle, Lock
} from "lucide-react";
import katex from "katex";
import { ModuleType, THEORY_INFO } from "./types";
import { ThemeName } from "./theme";
import { isActivated, isModuleAvailable } from "./activation";

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
  const [showQRCode, setShowQRCode] = useState(false);
  const activated = isActivated();

  const menuItems: { id: ModuleType; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "首页", icon: <Home className="w-5 h-5" /> },
    { id: "fundamentals", label: "理论基础", icon: <GraduationCap className="w-5 h-5" /> },
    { id: "axial", label: "轴向拉伸", icon: <ArrowRight className="w-5 h-5" /> },
    { id: "bending", label: "梁的弯曲", icon: <MoveVertical className="w-5 h-5" /> },
    { id: "torsion", label: "圆轴扭转", icon: <RotateCw className="w-5 h-5" /> },
    { id: "buckling", label: "压杆稳定", icon: <Minimize2 className="w-5 h-5" /> },
    { id: "combined", label: "组合变形", icon: <Layers className="w-5 h-5" /> },
    { id: "stress", label: "应力状态", icon: <MoveDiagonal className="w-5 h-5" /> },
    { id: "solver", label: "结构求解器", icon: <Calculator className="w-5 h-5" /> },
    { id: "section", label: "截面计算", icon: <Shapes className="w-5 h-5" /> },
    { id: "resources", label: "资源库", icon: <Library className="w-5 h-5" /> },
    { id: "settings", label: "设置", icon: <Settings className="w-5 h-5" /> },
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
        {menuItems.map((item) => {
          const isLocked = !activated && !isModuleAvailable(item.id);
          return (
            <button
              key={item.id}
              onClick={() => { setActiveModule(item.id); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border border-transparent ${activeModule === item.id ? "text-white shadow-lg" : "hover:bg-slate-800 hover:text-slate-200 text-slate-400"}`}
              style={activeModule === item.id ? { backgroundColor: 'var(--color-1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' } : {}}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {isLocked && <Lock className="w-4 h-4 text-slate-500" />}
            </button>
          );
        })}
      </nav>

      {/* 底部联系作者 */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <p className="text-xs text-slate-500 text-center mb-2">联系作者</p>
        <div className="flex items-center justify-center gap-2">
          {/* 微信 */}
          <button
            onClick={() => setShowQRCode(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-green-600/20 transition-colors group"
            title="微信"
          >
            <MessageCircle className="w-5 h-5 text-green-400 group-hover:text-green-300" />
          </button>
          {/* 抖音 */}
          <a
            href="https://www.douyin.com/user/self?from_tab_name=main"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-pink-600/20 transition-colors group"
            title="抖音"
          >
            <svg className="w-5 h-5 text-pink-400 group-hover:text-pink-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
          {/* 小红书 */}
          <a
            href="https://www.xiaohongshu.com/user/profile/67b884d2000000000e013859"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-red-600/20 transition-colors group"
            title="小红书"
          >
            <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* 微信二维码弹窗 */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 max-w-xs w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">微信扫码添加</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}wechat-qr.png`}
                alt="微信二维码"
                className="w-56 h-56 rounded-lg object-contain"
              />
            </div>
            <p className="text-sm text-slate-500 text-center mt-4">
              打开微信扫一扫，添加作者微信
            </p>
            <p className="text-xs text-slate-400 text-center mt-2">
              备注"材料力学"可优先通过
            </p>
          </div>
        </div>
      )}
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