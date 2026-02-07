import React, { useEffect, useState } from "react";
import {
  ArrowRight, MoveVertical, RotateCw, Minimize2, MoveDiagonal,
  BookOpen, Lightbulb, X, Layers, Beaker, GraduationCap, Calculator, Home, Settings, Library, Shapes,
  MessageCircle, Lock, Scissors, Shield
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

// --- Slider + Input Control (无限制) ---
export const SliderInputControl = ({
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
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onChange(num);
    }
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num <= 0) {
      setInputValue(value.toString());
    }
  };

  // 动态调整滑块范围：当值超出范围时扩展，否则使用原始范围
  const sliderMax = value > max ? value * 1.2 : max;
  const sliderMin = value < min ? value * 0.8 : min;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            step={step}
            className="w-20 px-2 py-0.5 text-sm font-bold text-right border rounded outline-none focus:ring-1"
            style={{ color: 'var(--color-1)', borderColor: 'var(--color-3)', focusRing: 'var(--color-1)' }}
          />
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

// --- 截面类型定义 ---
export type SectionType = 'rectangle' | 'circle' | 'hollow_circle' | 'i_beam' | 't_beam' | 'channel' | 'composite' | 'custom';

export interface SectionProperties {
  type: SectionType;
  // 矩形
  width?: number;  // mm
  height?: number; // mm
  // 圆形
  radius?: number; // mm
  // 空心圆
  outerRadius?: number; // mm
  innerRadius?: number; // mm
  // 工字钢
  flangeWidth?: number;  // mm
  flangeThickness?: number; // mm
  webHeight?: number; // mm
  webThickness?: number; // mm
  // T型截面
  tFlangeWidth?: number; // mm
  tFlangeThickness?: number; // mm
  tWebHeight?: number; // mm
  tWebThickness?: number; // mm
  // 槽钢
  channelWidth?: number; // mm
  channelHeight?: number; // mm
  channelFlange?: number; // mm
  channelWeb?: number; // mm
  // 组合截面 (矩形+矩形)
  comp1Width?: number; // mm
  comp1Height?: number; // mm
  comp2Width?: number; // mm
  comp2Height?: number; // mm
  compSpacing?: number; // mm (两个矩形之间的间距)
  // 自定义
  customArea?: number; // mm²
  customIz?: number; // mm⁴
  customIy?: number; // mm⁴
}

// 计算截面属性
export const calculateSectionProperties = (section: SectionProperties): { area: number; Iz: number; Iy: number; yMax: number; zMax: number } => {
  switch (section.type) {
    case 'rectangle': {
      const b = section.width || 100;
      const h = section.height || 150;
      return {
        area: b * h,
        Iz: (b * Math.pow(h, 3)) / 12,
        Iy: (h * Math.pow(b, 3)) / 12,
        yMax: h / 2,
        zMax: b / 2,
      };
    }
    case 'circle': {
      const r = section.radius || 50;
      return {
        area: Math.PI * r * r,
        Iz: (Math.PI * Math.pow(r, 4)) / 4,
        Iy: (Math.PI * Math.pow(r, 4)) / 4,
        yMax: r,
        zMax: r,
      };
    }
    case 'hollow_circle': {
      const ro = section.outerRadius || 50;
      const ri = section.innerRadius || 40;
      return {
        area: Math.PI * (ro * ro - ri * ri),
        Iz: (Math.PI * (Math.pow(ro, 4) - Math.pow(ri, 4))) / 4,
        Iy: (Math.PI * (Math.pow(ro, 4) - Math.pow(ri, 4))) / 4,
        yMax: ro,
        zMax: ro,
      };
    }
    case 'i_beam': {
      const bf = section.flangeWidth || 100;
      const tf = section.flangeThickness || 10;
      const hw = section.webHeight || 100;
      const tw = section.webThickness || 6;
      const h = hw + 2 * tf;
      // 工字钢惯性矩 = 外矩形 - 两侧空白矩形
      const Iz = (bf * Math.pow(h, 3)) / 12 - 2 * ((bf - tw) / 2 * Math.pow(hw, 3)) / 12;
      const Iy = 2 * (tf * Math.pow(bf, 3)) / 12 + (hw * Math.pow(tw, 3)) / 12;
      const area = 2 * bf * tf + hw * tw;
      return { area, Iz, Iy, yMax: h / 2, zMax: bf / 2 };
    }
    case 't_beam': {
      // T型截面: 翼缘在上，腹板在下
      const bf = section.tFlangeWidth || 100;
      const tf = section.tFlangeThickness || 10;
      const hw = section.tWebHeight || 80;
      const tw = section.tWebThickness || 8;
      const h = tf + hw;
      const area = bf * tf + hw * tw;
      // 计算形心位置 (从底部算起)
      const yc = (bf * tf * (hw + tf / 2) + hw * tw * (hw / 2)) / area;
      // 平行轴定理计算Iz
      const Iz_flange = (bf * Math.pow(tf, 3)) / 12 + bf * tf * Math.pow((hw + tf / 2) - yc, 2);
      const Iz_web = (tw * Math.pow(hw, 3)) / 12 + hw * tw * Math.pow((hw / 2) - yc, 2);
      const Iz = Iz_flange + Iz_web;
      const Iy = (tf * Math.pow(bf, 3)) / 12 + (hw * Math.pow(tw, 3)) / 12;
      return { area, Iz, Iy, yMax: Math.max(yc, h - yc), zMax: bf / 2 };
    }
    case 'channel': {
      const b = section.channelWidth || 50;
      const h = section.channelHeight || 100;
      const tf = section.channelFlange || 8;
      const tw = section.channelWeb || 5;
      const area = 2 * b * tf + (h - 2 * tf) * tw;
      const Iz = (tw * Math.pow(h, 3)) / 12 + 2 * (b * Math.pow(tf, 3) / 12 + b * tf * Math.pow((h - tf) / 2, 2));
      const Iy = 2 * (tf * Math.pow(b, 3)) / 12 + ((h - 2 * tf) * Math.pow(tw, 3)) / 12;
      return { area, Iz, Iy, yMax: h / 2, zMax: b };
    }
    case 'composite': {
      // 组合截面: 两个矩形上下排列
      const b1 = section.comp1Width || 100;
      const h1 = section.comp1Height || 20;
      const b2 = section.comp2Width || 40;
      const h2 = section.comp2Height || 80;
      const spacing = section.compSpacing || 0;
      const totalH = h1 + spacing + h2;
      const area = b1 * h1 + b2 * h2;
      // 形心位置 (从底部算起)
      const yc = (b1 * h1 * (h2 + spacing + h1 / 2) + b2 * h2 * (h2 / 2)) / area;
      // 平行轴定理
      const Iz1 = (b1 * Math.pow(h1, 3)) / 12 + b1 * h1 * Math.pow((h2 + spacing + h1 / 2) - yc, 2);
      const Iz2 = (b2 * Math.pow(h2, 3)) / 12 + b2 * h2 * Math.pow((h2 / 2) - yc, 2);
      const Iz = Iz1 + Iz2;
      const Iy = (h1 * Math.pow(b1, 3)) / 12 + (h2 * Math.pow(b2, 3)) / 12;
      return { area, Iz, Iy, yMax: Math.max(yc, totalH - yc), zMax: Math.max(b1, b2) / 2 };
    }
    case 'custom': {
      return {
        area: section.customArea || 1000,
        Iz: section.customIz || 1e6,
        Iy: section.customIy || 1e6,
        yMax: 50,
        zMax: 50,
      };
    }
    default:
      return { area: 1000, Iz: 1e6, Iy: 1e6, yMax: 50, zMax: 50 };
  }
};

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

          {/* 截面参数输入 */}
          <div className="space-y-2">
        {section.type === 'rectangle' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">宽度 b (mm)</label>
              <input
                type="number"
                value={section.width || 100}
                onChange={(e) => onChange({ ...section, width: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">高度 h (mm)</label>
              <input
                type="number"
                value={section.height || 150}
                onChange={(e) => onChange({ ...section, height: parseFloat(e.target.value) || 150 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {section.type === 'circle' && (
          <div>
            <label className="text-xs text-slate-500">半径 r (mm)</label>
            <input
              type="number"
              value={section.radius || 50}
              onChange={(e) => onChange({ ...section, radius: parseFloat(e.target.value) || 50 })}
              className="w-full px-2 py-1 text-sm border rounded"
            />
          </div>
        )}

        {section.type === 'hollow_circle' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">外半径 R (mm)</label>
              <input
                type="number"
                value={section.outerRadius || 50}
                onChange={(e) => onChange({ ...section, outerRadius: parseFloat(e.target.value) || 50 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">内半径 r (mm)</label>
              <input
                type="number"
                value={section.innerRadius || 40}
                onChange={(e) => onChange({ ...section, innerRadius: parseFloat(e.target.value) || 40 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {section.type === 'i_beam' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">翼缘宽 bf (mm)</label>
              <input
                type="number"
                value={section.flangeWidth || 100}
                onChange={(e) => onChange({ ...section, flangeWidth: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">翼缘厚 tf (mm)</label>
              <input
                type="number"
                value={section.flangeThickness || 10}
                onChange={(e) => onChange({ ...section, flangeThickness: parseFloat(e.target.value) || 10 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">腹板高 hw (mm)</label>
              <input
                type="number"
                value={section.webHeight || 100}
                onChange={(e) => onChange({ ...section, webHeight: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">腹板厚 tw (mm)</label>
              <input
                type="number"
                value={section.webThickness || 6}
                onChange={(e) => onChange({ ...section, webThickness: parseFloat(e.target.value) || 6 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {section.type === 'channel' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">宽度 b (mm)</label>
              <input
                type="number"
                value={section.channelWidth || 50}
                onChange={(e) => onChange({ ...section, channelWidth: parseFloat(e.target.value) || 50 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">高度 h (mm)</label>
              <input
                type="number"
                value={section.channelHeight || 100}
                onChange={(e) => onChange({ ...section, channelHeight: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">翼缘厚 tf (mm)</label>
              <input
                type="number"
                value={section.channelFlange || 8}
                onChange={(e) => onChange({ ...section, channelFlange: parseFloat(e.target.value) || 8 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">腹板厚 tw (mm)</label>
              <input
                type="number"
                value={section.channelWeb || 5}
                onChange={(e) => onChange({ ...section, channelWeb: parseFloat(e.target.value) || 5 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {section.type === 't_beam' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">翼缘宽 bf (mm)</label>
              <input
                type="number"
                value={section.tFlangeWidth || 100}
                onChange={(e) => onChange({ ...section, tFlangeWidth: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">翼缘厚 tf (mm)</label>
              <input
                type="number"
                value={section.tFlangeThickness || 10}
                onChange={(e) => onChange({ ...section, tFlangeThickness: parseFloat(e.target.value) || 10 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">腹板高 hw (mm)</label>
              <input
                type="number"
                value={section.tWebHeight || 80}
                onChange={(e) => onChange({ ...section, tWebHeight: parseFloat(e.target.value) || 80 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">腹板厚 tw (mm)</label>
              <input
                type="number"
                value={section.tWebThickness || 8}
                onChange={(e) => onChange({ ...section, tWebThickness: parseFloat(e.target.value) || 8 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {section.type === 'composite' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-500 font-medium">上部矩形</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">宽度 b1 (mm)</label>
                <input
                  type="number"
                  value={section.comp1Width || 100}
                  onChange={(e) => onChange({ ...section, comp1Width: parseFloat(e.target.value) || 100 })}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">高度 h1 (mm)</label>
                <input
                  type="number"
                  value={section.comp1Height || 20}
                  onChange={(e) => onChange({ ...section, comp1Height: parseFloat(e.target.value) || 20 })}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">下部矩形</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">宽度 b2 (mm)</label>
                <input
                  type="number"
                  value={section.comp2Width || 40}
                  onChange={(e) => onChange({ ...section, comp2Width: parseFloat(e.target.value) || 40 })}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">高度 h2 (mm)</label>
                <input
                  type="number"
                  value={section.comp2Height || 80}
                  onChange={(e) => onChange({ ...section, comp2Height: parseFloat(e.target.value) || 80 })}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">间距 (mm)</label>
              <input
                type="number"
                value={section.compSpacing || 0}
                onChange={(e) => onChange({ ...section, compSpacing: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {section.type === 'custom' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500">面积 A (mm²)</label>
              <input
                type="number"
                value={section.customArea || 1000}
                onChange={(e) => onChange({ ...section, customArea: parseFloat(e.target.value) || 1000 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Iz (mm⁴)</label>
              <input
                type="number"
                value={section.customIz || 1e6}
                onChange={(e) => onChange({ ...section, customIz: parseFloat(e.target.value) || 1e6 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Iy (mm⁴)</label>
              <input
                type="number"
                value={section.customIy || 1e6}
                onChange={(e) => onChange({ ...section, customIy: parseFloat(e.target.value) || 1e6 })}
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}
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
export interface MaterialData {
  name: string;
  E: number;      // 弹性模量 GPa
  G: number;      // 剪切模量 GPa
  yield: number;  // 屈服强度 MPa
  poisson: number; // 泊松比
  density?: number; // 密度 kg/m³
  category: 'metal' | 'concrete' | 'wood' | 'polymer' | 'composite' | 'custom';
}

// 预设材料库（常见工程材料的真实参数）
const DEFAULT_MATERIALS: MaterialData[] = [
  // 钢材
  { name: "Q235钢", E: 206, G: 79, yield: 235, poisson: 0.3, density: 7850, category: 'metal' },
  { name: "Q345钢", E: 206, G: 79, yield: 345, poisson: 0.3, density: 7850, category: 'metal' },
  { name: "Q460高强钢", E: 206, G: 79, yield: 460, poisson: 0.3, density: 7850, category: 'metal' },
  { name: "304不锈钢", E: 193, G: 77, yield: 205, poisson: 0.29, density: 7930, category: 'metal' },
  { name: "316不锈钢", E: 193, G: 77, yield: 290, poisson: 0.29, density: 7980, category: 'metal' },
  // 铝合金
  { name: "6061-T6铝合金", E: 68.9, G: 26, yield: 276, poisson: 0.33, density: 2700, category: 'metal' },
  { name: "7075-T6铝合金", E: 71.7, G: 26.9, yield: 503, poisson: 0.33, density: 2810, category: 'metal' },
  { name: "2024-T3铝合金", E: 73.1, G: 28, yield: 345, poisson: 0.33, density: 2780, category: 'metal' },
  // 其他金属
  { name: "Ti-6Al-4V钛合金", E: 113.8, G: 44, yield: 880, poisson: 0.34, density: 4430, category: 'metal' },
  { name: "H62黄铜", E: 105, G: 39, yield: 250, poisson: 0.35, density: 8430, category: 'metal' },
  { name: "T2紫铜", E: 108, G: 40, yield: 70, poisson: 0.34, density: 8900, category: 'metal' },
  { name: "铸铁HT200", E: 100, G: 40, yield: 200, poisson: 0.26, density: 7200, category: 'metal' },
  // 混凝土
  { name: "C20混凝土", E: 25.5, G: 10.6, yield: 9.6, poisson: 0.2, density: 2400, category: 'concrete' },
  { name: "C30混凝土", E: 30, G: 12.5, yield: 14.3, poisson: 0.2, density: 2400, category: 'concrete' },
  { name: "C40混凝土", E: 32.5, G: 13.5, yield: 19.1, poisson: 0.2, density: 2400, category: 'concrete' },
  { name: "C50混凝土", E: 34.5, G: 14.4, yield: 23.1, poisson: 0.2, density: 2450, category: 'concrete' },
  // 木材
  { name: "松木", E: 12, G: 0.7, yield: 30, poisson: 0.35, density: 500, category: 'wood' },
  { name: "橡木", E: 12.5, G: 0.8, yield: 40, poisson: 0.35, density: 700, category: 'wood' },
  { name: "胶合板", E: 8.5, G: 0.5, yield: 25, poisson: 0.3, density: 600, category: 'wood' },
  // 高分子/复合材料
  { name: "环氧树脂", E: 3.5, G: 1.3, yield: 80, poisson: 0.35, density: 1200, category: 'polymer' },
  { name: "尼龙PA66", E: 3.0, G: 1.1, yield: 85, poisson: 0.4, density: 1140, category: 'polymer' },
  { name: "GFRP玻璃钢", E: 25, G: 4, yield: 200, poisson: 0.25, density: 1900, category: 'composite' },
  { name: "CFRP碳纤维", E: 135, G: 5, yield: 1500, poisson: 0.3, density: 1600, category: 'composite' },
  // 其他
  { name: "玻璃", E: 70, G: 28, yield: 50, poisson: 0.22, density: 2500, category: 'polymer' },
  { name: "橡胶", E: 0.01, G: 0.003, yield: 15, poisson: 0.49, density: 1100, category: 'polymer' },
];

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customE, setCustomE] = useState(currentE || 200);
  const [customG, setCustomG] = useState(currentG || 77);
  const [customYield, setCustomYield] = useState(currentYield || 250);
  const [customPoisson, setCustomPoisson] = useState(currentPoisson || 0.3);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const materials = DEFAULT_MATERIALS;

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'metal', label: '金属' },
    { id: 'concrete', label: '混凝土' },
    { id: 'wood', label: '木材' },
    { id: 'polymer', label: '高分子' },
    { id: 'composite', label: '复合材料' },
  ];

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(m => m.category === selectedCategory);

  const activeMat = materials.find(m => 
    currentE && Math.abs(m.E - currentE) < 0.5 &&
    currentYield && Math.abs(m.yield - currentYield) < 1
  );

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
    if (currentPoisson) setCustomPoisson(currentPoisson);
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
            E={currentE}GPa | σy={currentYield}MPa
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
                      <span>σy:{mat.yield}</span>
                      <span>ν:{mat.poisson}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* 自定义参数输入 */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">弹性模量 E (GPa)</label>
                  <input
                    type="number"
                    value={customE}
                    onChange={(e) => {
                      const E = parseFloat(e.target.value) || 200;
                      setCustomE(E);
                      setCustomG(parseFloat(calculateG(E, customPoisson).toFixed(1)));
                    }}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">剪切模量 G (GPa)</label>
                  <input
                    type="number"
                    value={customG}
                    onChange={(e) => setCustomG(parseFloat(e.target.value) || 77)}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">屈服强度 σy (MPa)</label>
                  <input
                    type="number"
                    value={customYield}
                    onChange={(e) => setCustomYield(parseFloat(e.target.value) || 250)}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                    step="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">泊松比 ν</label>
                  <input
                    type="number"
                    value={customPoisson}
                    onChange={(e) => {
                      const nu = Math.min(0.5, Math.max(0, parseFloat(e.target.value) || 0.3));
                      setCustomPoisson(nu);
                      setCustomG(parseFloat(calculateG(customE, nu).toFixed(1)));
                    }}
                    className="w-full px-2 py-1.5 text-sm border rounded"
                    step="0.01"
                    min="0"
                    max="0.5"
                  />
                </div>
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
            <span>G: {currentG || calculateG(currentE || 200, currentPoisson || 0.3).toFixed(1)} GPa</span>
            <span>σy: {currentYield} MPa</span>
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
    { id: "shear", label: "梁的剪应力", icon: <Scissors className="w-5 h-5" /> },
    { id: "strength", label: "强度理论", icon: <Shield className="w-5 h-5" /> },
    { id: "solver", label: "结构求解器", icon: <Calculator className="w-5 h-5" /> },
    { id: "section", label: "截面计算", icon: <Shapes className="w-5 h-5" /> },
    { id: "formulas", label: "常用公式", icon: <BookOpen className="w-5 h-5" /> },
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