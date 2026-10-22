import React, { useEffect, useState } from "react";
import {
  ArrowRight, MoveVertical, RotateCw, Minimize2, MoveDiagonal,
  BookOpen, Lightbulb, X, Layers, Beaker, GraduationCap, Calculator, Home, Settings, Library, Shapes,
  MessageCircle, Lock, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { LatexRenderer } from "./components/LatexRenderer";
export { LatexRenderer } from "./components/LatexRenderer";
import { ModuleType, THEORY_INFO, SectionType, SectionProperties } from "./types";
import { NumericInput } from "./components/NumericInput";
import { NumericConstraints, validateNumber } from "./mechanics/validation";
import { calculateSectionProperties, validateSection, SECTION_FIELDS } from "./mechanics/sections";
import { ThemeName } from "./theme";
import { isActivated, isModuleAvailable } from "./activation";

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

export { NumericInput } from './components/NumericInput';
export { calculateSectionProperties } from './mechanics/sections';
export type { SectionType, SectionProperties } from './types';

interface SliderProps extends NumericConstraints {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

// 滑块范围是常用范围；只有 minimum / maximum 是硬边界。
export const SliderInputControl = ({ label, value, min, max, step, unit, onChange, domain = min < 0 ? 'signed' : min === 0 ? 'nonnegative' : 'positive', minimum, maximum }: SliderProps) => {
  const lower = minimum ?? (domain === 'positive' ? Math.min(min, value) : domain === 'nonnegative' ? 0 : Math.min(min, value));
  const upper = maximum ?? Math.max(max, value);
  return <div className="mb-4">
    <NumericInput label={label} value={value} unit={unit} onChange={onChange} domain={domain} minimum={minimum} maximum={maximum} compact />
    <input type="range" aria-label={`${label}滑块`} min={lower} max={upper} step={step} value={value}
      onChange={event => {
        const next = Number(event.target.value);
        if (!validateNumber(next, { domain, minimum, maximum })) onChange(next);
      }} className="w-full h-2 mt-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
  </div>;
};

export const SliderControl = (props: SliderProps) => <SliderInputControl {...props} minimum={props.minimum ?? props.min} maximum={props.maximum ?? props.max} />;

// --- 截面选择器组件 ---
export const SectionSelector = ({
  section,
  onChange,
}: {
  section: SectionProperties;
  onChange: (s: SectionProperties) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sectionTypes: { type: SectionType; label: string; icon: string }[] = [
    { type: 'rectangle', label: '矩形', icon: '▭' },
    { type: 'circle', label: '圆形', icon: '○' },
    { type: 'hollow_circle', label: '空心圆', icon: '◎' },
    { type: 'i_beam', label: '工字钢', icon: 'Ⅰ' },
    { type: 't_beam', label: 'T型', icon: '⊤' },
    { type: 'channel', label: '槽钢', icon: '⊏' },
    { type: 'composite', label: '组合', icon: '⊞' },
    { type: 'custom', label: '自定义', icon: '✎' },
  ];

  const props = calculateSectionProperties(section);
  const currentType = sectionTypes.find(st => st.type === section.type);

  return (
    <div className="mb-4 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      {/* 可点击的标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shapes className="w-4 h-4" style={{ color: 'var(--color-2)' }} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">截面类型</span>
          <span className="text-sm font-medium text-slate-700 ml-2">
            {currentType?.icon} {currentType?.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            A={props.area.toFixed(0)}mm² | Iz={(props.Iz/1e4).toFixed(1)}×10⁴mm⁴
          </span>
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* 可折叠内容 */}
      {isExpanded && (
        <div className="p-3 pt-0 border-t border-slate-200">
          {/* 截面类型选择 */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 mb-3 mt-3">
            {sectionTypes.map((st) => (
              <button
                key={st.type}
                onClick={() => onChange({ ...section, type: st.type })}
                className={`p-2 text-center rounded border transition-colors ${
                  section.type === st.type
                    ? 'border-2 bg-white shadow-sm'
                    : 'border-slate-200 hover:bg-white'
                }`}
                style={section.type === st.type ? { borderColor: 'var(--color-1)' } : {}}
              >
                <div className="text-lg">{st.icon}</div>
                <div className="text-xs text-slate-600">{st.label}</div>
              </button>
            ))}
          </div>

          {/* 截面参数按类型校验，错误草稿不会提交给计算层。 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTION_FIELDS[section.type].map(field => <NumericInput key={field.key} label={field.label}
              value={section[field.key] ?? field.defaultValue} domain={field.allowZero ? 'nonnegative' : 'positive'}
              onChange={value => onChange({ ...section, [field.key]: value })}
              validate={value => validateSection({ ...section, [field.key]: value })} />)}
          </div>

          {/* 计算结果显示 */}
          <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs text-slate-500 font-mono">
            <span>A: {props.area.toFixed(0)} mm²</span>
            <span>Iz: {(props.Iz / 1e4).toFixed(1)}×10⁴ mm⁴</span>
            <span>Iy: {(props.Iy / 1e4).toFixed(1)}×10⁴ mm⁴</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 材料数据库 ---
export type { MaterialData } from './mechanics/materials';
import { DEFAULT_MATERIALS } from './mechanics/materials';
import { getAxialMaterialResponse } from './mechanics/axialResponse';

// --- Material Selector ---
export const MaterialSelector = ({ 
  onSelect,
  currentE,
  currentG,
  currentYield,
  currentPoisson,
  currentName
}: { 
  onSelect: (mat: { name: string, E: number, G: number, yield: number, poisson: number }) => void;
  currentE?: number;
  currentG?: number;
  currentYield?: number;
  currentPoisson?: number;
  currentName?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customE, setCustomE] = useState(currentE || 200);
  const [customG, setCustomG] = useState(currentG || 77);
  const [customYield, setCustomYield] = useState(currentYield || 250);
  const [customPoisson, setCustomPoisson] = useState(currentPoisson ?? 0.3);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const materials = DEFAULT_MATERIALS;

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'metal', label: '金属' },
    { id: 'concrete', label: '混凝土' },
    { id: 'wood', label: '木材' },
    { id: 'polymer', label: '高分子' },
    { id: 'composite', label: '复合材料' },
    { id: 'other', label: '其他' },
  ];

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(m => m.category === selectedCategory);

  const activeMat = materials.find(m => 
    (currentName === undefined || m.name === currentName) &&
    currentE && Math.abs(m.E - currentE) < (currentName ? 1e-8 : 0.5) &&
    currentYield && Math.abs(m.yield - currentYield) < (currentName ? 1e-8 : 1)
  );

  const referenceSymbol = (name?: string, E = currentE || 200, strength = currentYield || 250) => {
    const response = getAxialMaterialResponse({ materialName: name, modulus: E, yieldStrength: strength });
    if (response.family === 'smooth') return 'Rp0.2';
    const role = response.referenceRole;
    return role === 'yield' ? 'σy' : role === 'tensile' ? 'σt,ref' : role === 'compression' ? 'σc,ref' : '参考';
  };
  const strengthSymbol = referenceSymbol(activeMat?.name);

  // 当泊松比改变时自动计算剪切模量 G = E / (2(1+ν))
  const calculateG = (E: number, poisson: number) => {
    return E / (2 * (1 + poisson));
  };

  const handleCustomApply = () => {
    onSelect({
      name: '自定义材料',
      E: customE,
      G: customG,
      yield: customYield,
      poisson: customPoisson
    });
    setIsCustomMode(false);
  };

  // 同步外部值到自定义输入
  useEffect(() => {
    if (currentE) setCustomE(currentE);
    if (currentG) setCustomG(currentG);
    if (currentYield) setCustomYield(currentYield);
    if (currentPoisson !== undefined) setCustomPoisson(currentPoisson);
  }, [currentE, currentG, currentYield, currentPoisson]);

  return (
    <div className="mb-4 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      {/* 可点击的标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4" style={{ color: 'var(--color-2)' }} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">材料</span>
          <span className="text-sm font-medium text-slate-700 ml-2">
            {activeMat?.name || '自定义材料'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            E={currentE}GPa | {strengthSymbol}={currentYield}MPa
          </span>
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 可折叠内容 */}
      {isExpanded && (
        <div className="p-3 pt-0 border-t border-slate-200">
          {/* 模式切换 */}
          <div className="flex gap-2 mt-3 mb-3">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                !isCustomMode 
                  ? 'bg-white shadow-sm border-2' 
                  : 'bg-slate-100 border border-slate-200 hover:bg-white'
              }`}
              style={!isCustomMode ? { borderColor: 'var(--color-1)', color: 'var(--color-1)' } : {}}
            >
              📚 材料库选择
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                isCustomMode 
                  ? 'bg-white shadow-sm border-2' 
                  : 'bg-slate-100 border border-slate-200 hover:bg-white'
              }`}
              style={isCustomMode ? { borderColor: 'var(--color-1)', color: 'var(--color-1)' } : {}}
            >
              ✏️ 自定义参数
            </button>
          </div>

          {!isCustomMode ? (
            <>
              {/* 分类筛选 */}
              <div className="flex flex-wrap gap-1 mb-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 材料列表 */}
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {filteredMaterials.map(mat => (
                  <button
                    key={mat.name}
                    onClick={() => onSelect(mat)}
                    className={`w-full p-2 text-left rounded border transition-colors ${
                      activeMat?.name === mat.name
                        ? 'bg-white border-2 shadow-sm'
                        : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                    style={activeMat?.name === mat.name ? { borderColor: 'var(--color-1)' } : {}}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{mat.name}</span>
                      {mat.density && (
                        <span className="text-xs text-slate-400">{mat.density} kg/m³</span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500 font-mono">
                      <span>E:{mat.E}</span>
                      <span>G:{mat.G}</span>
                      <span>{referenceSymbol(mat.name, mat.E, mat.yield)}:{mat.yield}</span>
                      <span>ν:{mat.poisson}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* 自定义参数输入 */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NumericInput label="弹性模量 E (GPa)" value={customE} onChange={E => { setCustomE(E); setCustomG(calculateG(E, customPoisson)); }} />
                <NumericInput label="剪切模量 G (GPa)" value={customG} onChange={setCustomG} />
                <NumericInput label="屈服强度 σy (MPa)" value={customYield} onChange={setCustomYield} />
                <NumericInput label="泊松比 ν" value={customPoisson} domain="nonnegative" maximum={0.4999}
                  onChange={nu => { setCustomPoisson(nu); setCustomG(calculateG(customE, nu)); }} />
              </div>
              
              <div className="text-xs text-slate-400 bg-slate-100 p-2 rounded">
                💡 提示：G = E / 2(1+ν)，修改 E 或 ν 时会自动计算 G
              </div>

              <button
                onClick={handleCustomApply}
                className="w-full py-2 text-sm font-medium text-white rounded transition-colors"
                style={{ backgroundColor: 'var(--color-1)' }}
              >
                应用自定义材料
              </button>
            </div>
          )}

          {/* 当前参数显示 */}
          <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-4 gap-2 text-xs text-slate-500 font-mono">
            <span>E: {currentE} GPa</span>
            <span>G: {currentG || calculateG(currentE || 200, currentPoisson ?? 0.3).toFixed(1)} GPa</span>
            <span>{strengthSymbol}: {currentYield} MPa</span>
            <span>ν: {currentPoisson}</span>
          </div>
        </div>
      )}
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
  const [collapsed, setCollapsed] = useState(false);
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
    { id: "formulas", label: "常用公式", icon: <BookOpen className="w-5 h-5" /> },
    { id: "resources", label: "资源库", icon: <Library className="w-5 h-5" /> },
    { id: "settings", label: "设置", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className={`app-sidebar ${isMenuOpen ? "sidebar-open" : ""}`} data-collapsed={collapsed}>
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <div className="sidebar-brand"><h1 className="text-lg font-bold tracking-tight text-white">材料力学<span style={{ color: 'var(--color-1)' }}>可视化</span>实验室</h1><p>MechMat Lab</p></div>
        <button type="button" aria-label="关闭导航菜单" onClick={() => setIsMenuOpen(false)} className="sidebar-close text-slate-400 hover:text-white">
           <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="sidebar-workspace-heading"><span>课程模块</span><button className="sidebar-collapse-toggle" aria-label={collapsed ? '展开课程导航' : '折叠课程导航'} title={collapsed ? '展开课程导航' : '折叠课程导航'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button></div>
      <nav className="flex-1 p-4 space-y-2 text-sm overflow-y-auto">
        {menuItems.map((item) => {
          const isLocked = !activated && !isModuleAvailable(item.id);
          return (
            <button
              key={item.id}
              aria-current={activeModule === item.id ? 'page' : undefined}
              data-module={item.id}
              aria-label={`${item.label}${isLocked ? '（需激活）' : ''}`}
              title={`${item.label}${isLocked ? '（需激活）' : ''}`}
              onClick={() => { setActiveModule(item.id); setIsMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border border-transparent ${activeModule === item.id ? "text-white shadow-lg" : "hover:bg-slate-800 hover:text-slate-200 text-slate-400"}`}
              style={activeModule === item.id ? { backgroundColor: 'var(--color-1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' } : {}}
            >
              {item.icon}
              <span className="nav-item-label flex-1 text-left">{item.label}</span>
              {isLocked && <Lock className="w-4 h-4 text-slate-500" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-lab-art"><img src={`${import.meta.env.BASE_URL}images/lab-cube.png`} alt=""/><div>探索材料<br/>看见力学<small>From Theory to Insight</small></div></div>
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
