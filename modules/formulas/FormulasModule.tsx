import React, { useState } from "react";
import { Search } from "lucide-react";
import { BEAM_FORMULAS } from "./data/beamFormulas";
import { BASIC_FORMULAS } from "./data/basicFormulas";
import { SECTION_FORMULAS } from "./data/sectionFormulas";
import { FormulaCard } from "./components/FormulaModal";
import { SectionCard } from "./components/SectionModal";
import { BasicFormulaCard } from "./components/BasicFormulaModal";

// 主组件
export const FormulasModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"basic" | "beam" | "section">("basic");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredBeamFormulas = BEAM_FORMULAS.filter((f) => !searchQuery || f.name.includes(searchQuery) || f.group.includes(searchQuery));
  const filteredSectionFormulas = SECTION_FORMULAS.filter((f) => !searchQuery || f.name.includes(searchQuery) || f.group.includes(searchQuery));
  const filteredBasicFormulas = BASIC_FORMULAS.filter((f) => !searchQuery || f.name.includes(searchQuery) || f.group.includes(searchQuery) || f.formulas.some(ff => ff.label.includes(searchQuery)));
  const beamGroups = ["简支梁", "悬臂梁", "两端固定梁", "外伸梁", "一端固定一端简支", "连续梁", "三铰拱", "两铰拱", "无铰拱"];
  const sectionGroups = ["基本截面", "型钢截面"];
  const basicGroups = ["应力与应变", "轴向载荷", "扭转", "弯曲", "弯曲变形", "应力状态", "强度理论", "组合变形", "压杆稳定", "能量法", "疲劳强度"];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 border-b pb-3" style={{ borderColor: 'var(--color-4)' }}>
        <button onClick={() => setActiveTab("basic")} className="px-4 py-2 rounded-lg font-medium text-sm transition-colors" style={activeTab === "basic" ? { backgroundColor: 'var(--color-1)', color: 'white' } : { backgroundColor: 'rgba(var(--color-4-rgb), 0.5)', color: 'var(--color-1)' }}>基础公式</button>
        <button onClick={() => setActiveTab("beam")} className="px-4 py-2 rounded-lg font-medium text-sm transition-colors" style={activeTab === "beam" ? { backgroundColor: 'var(--color-1)', color: 'white' } : { backgroundColor: 'rgba(var(--color-4-rgb), 0.5)', color: 'var(--color-1)' }}>梁与拱</button>
        <button onClick={() => setActiveTab("section")} className="px-4 py-2 rounded-lg font-medium text-sm transition-colors" style={activeTab === "section" ? { backgroundColor: 'var(--color-1)', color: 'white' } : { backgroundColor: 'rgba(var(--color-4-rgb), 0.5)', color: 'var(--color-1)' }}>截面特性</button>
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-2)' }} />
            <input type="text" placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.3)', borderColor: 'var(--color-4)', border: '1px solid' }} />
          </div>
        </div>
      </div>
      
      {activeTab === "basic" && (
        <div className="space-y-6">
          {basicGroups.map((group) => {
            const groupFormulas = filteredBasicFormulas.filter((f) => f.group === group);
            if (groupFormulas.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded" style={{ backgroundColor: 'var(--color-1)' }}></span>{group}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {groupFormulas.map((f) => (<BasicFormulaCard key={f.id} formula={f} />))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {activeTab === "beam" && (
        <div className="space-y-6">
          {beamGroups.map((group) => {
            const groupFormulas = filteredBeamFormulas.filter((f) => f.group === group);
            if (groupFormulas.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded" style={{ backgroundColor: 'var(--color-1)' }}></span>{group}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {groupFormulas.map((f) => (<FormulaCard key={f.id} formula={f} />))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {activeTab === "section" && (
        <div className="space-y-6">
          {sectionGroups.map((group) => {
            const groupSections = filteredSectionFormulas.filter((f) => f.group === group);
            if (groupSections.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded" style={{ backgroundColor: 'var(--color-1)' }}></span>{group}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {groupSections.map((f) => (<SectionCard key={f.id} section={f} />))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="rounded-xl p-3 border" style={{ backgroundColor: 'rgba(var(--color-4-rgb), 0.3)', borderColor: 'var(--color-4)' }}>
        <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-1)' }}>符号说明</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div><span className="font-mono" style={{ color: 'var(--color-1)' }}>P</span> - 集中力</div>
          <div><span className="font-mono" style={{ color: 'var(--color-1)' }}>q</span> - 均布载荷</div>
          <div><span className="font-mono" style={{ color: 'var(--color-1)' }}>L</span> - 梁长</div>
          <div><span className="font-mono" style={{ color: 'var(--color-1)' }}>E</span> - 弹性模量</div>
          <div><span className="font-mono" style={{ color: 'var(--color-1)' }}>I</span> - 惯性矩</div>
          <div><span className="font-mono" style={{ color: 'var(--color-1)' }}>M</span> - 弯矩</div>
        </div>
      </div>
    </div>
  );
};
