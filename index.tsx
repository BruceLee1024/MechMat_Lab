import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Menu, Lock, Key, X, CheckCircle, AlertCircle } from "lucide-react";

import { ModuleType, SimulationState, DEFAULT_STATE, THEORY_INFO } from "./types";
import { Sidebar, TheoryPanel } from "./components";
import { AxialModule, BendingModule, TorsionModule, BucklingModule, StressModule, CombinedModule, FundamentalsModule } from "./modules";
import { HomeModule } from "./modules/HomeModule";
import { SettingsModule } from "./modules/SettingsModule";
import { ResourcesModule } from "./modules/ResourcesModule";
import { SectionModule } from "./modules/SectionModule";
import { SolverModule } from "./solver/SolverModule";
import { AITutor } from "./ai";
import { ThemeName, getCurrentTheme, applyTheme } from "./theme";
import { isActivated, activateApp, isModuleAvailable, FREE_MODULES } from "./activation";

// 添加全局动画样式
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0; 
      transform: translateX(-20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0; 
      transform: scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slideUp 0.5s ease-out forwards;
    opacity: 0;
  }
  
  .animate-slide-in {
    animation: slideIn 0.4s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.3s ease-out forwards;
  }
  
  .module-transition {
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
  }
  
  .module-enter {
    opacity: 0;
    transform: translateY(10px);
  }
  
  .module-enter-active {
    opacity: 1;
    transform: translateY(0);
  }
  
  .resizer {
    cursor: col-resize;
    user-select: none;
  }
  
  .resizer:hover .resizer-handle,
  .resizer.dragging .resizer-handle {
    background-color: var(--color-2);
  }
  
  .resizer:hover,
  .resizer.dragging {
    background-color: rgba(99, 102, 241, 0.1);
  }
`;

// --- Main App ---

// 激活弹窗组件
const ActivationModal = ({ 
  onClose, 
  onActivated 
}: { 
  onClose: () => void; 
  onActivated: () => void;
}) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = activateApp(code);
    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setTimeout(() => {
        onActivated();
        onClose();
      }, 1500);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-xl text-slate-800">激活应用</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <p className="text-slate-600 mb-6">
          请输入激活码以解锁全部功能。如需获取激活码，请联系作者。
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setStatus('idle');
            }}
            placeholder="请输入激活码"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg tracking-widest font-mono"
            autoFocus
          />

          {status !== 'idle' && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || status === 'success'}
            className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            激活
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          激活后永久有效，无需重复激活
        </p>
      </div>
    </div>
  );
};

// 锁定模块提示组件
const LockedModuleOverlay = ({ onActivate }: { onActivate: () => void }) => (
  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
    <div className="text-center p-8">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">此功能需要激活</h3>
      <p className="text-slate-500 mb-6">请输入激活码解锁全部功能</p>
      <button
        onClick={onActivate}
        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
      >
        输入激活码
      </button>
    </div>
  </div>
);

const App = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>("home");
  const [simState, setSimState] = useState<SimulationState>(DEFAULT_STATE);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getCurrentTheme());
  const [activated, setActivated] = useState(isActivated());
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayModule, setDisplayModule] = useState<ModuleType>("home");
  const [leftPanelWidth, setLeftPanelWidth] = useState(65); // 百分比
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 注入动画样式
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = animationStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // 初始化主题
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // 限制范围 30% - 80%
    setLeftPanelWidth(Math.min(80, Math.max(30, newWidth)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 模块切换动画
  const handleModuleChange = (newModule: ModuleType) => {
    if (newModule === activeModule) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setActiveModule(newModule);
      setDisplayModule(newModule);
      
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const handleStateChange = (changes: Partial<SimulationState>) => {
    setSimState((prev) => ({ ...prev, ...changes }));
  };

  const currentTheory = THEORY_INFO[activeModule];

  // 检查当前模块是否被锁定
  const isCurrentModuleLocked = !activated && !isModuleAvailable(displayModule);

  const renderModule = () => {
    const moduleContent = (() => {
      switch (displayModule) {
        case "home": return <HomeModule onNavigate={handleModuleChange} />;
        case "fundamentals": return <FundamentalsModule state={simState} onChange={handleStateChange} />;
        case "axial": return <AxialModule state={simState} onChange={handleStateChange} />;
        case "bending": return <BendingModule state={simState} onChange={handleStateChange} />;
        case "torsion": return <TorsionModule state={simState} onChange={handleStateChange} />;
        case "buckling": return <BucklingModule state={simState} onChange={handleStateChange} />;
        case "stress": return <StressModule state={simState} onChange={handleStateChange} />;
        case "combined": return <CombinedModule state={simState} onChange={handleStateChange} />;
        case "solver": return <SolverModule />;
        case "section": return <SectionModule />;
        case "resources": return <ResourcesModule />;
        case "settings": return <SettingsModule currentTheme={currentTheme} onThemeChange={handleThemeChange} />;
        default: return null;
      }
    })();

    // 如果模块被锁定，显示锁定覆盖层
    if (isCurrentModuleLocked) {
      return (
        <div className="relative h-full">
          <div className="opacity-30 pointer-events-none h-full overflow-hidden">
            {moduleContent}
          </div>
          <LockedModuleOverlay onActivate={() => setShowActivationModal(true)} />
        </div>
      );
    }

    return moduleContent;
  };

  // 判断是否显示侧边栏（主页时隐藏）
  const showSidebar = activeModule !== "home";

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 font-sans bg-slate-50">
      {/* Sidebar Component - 主页时隐藏 */}
      {showSidebar && (
        <Sidebar 
          activeModule={activeModule} 
          setActiveModule={handleModuleChange} 
          isMenuOpen={isMenuOpen} 
          setIsMenuOpen={setIsMenuOpen}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Mobile) - 主页时也隐藏 */}
        {showSidebar && (
          <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden">
              <h1 className="font-bold text-lg">材料力学可视化实验室</h1>
              <button onClick={() => setIsMenuOpen(true)} className="text-slate-600">
                  <Menu className="w-6 h-6" />
              </button>
          </header>
        )}

        {/* Scrollable Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky Header - 隐藏首页的标题栏 */}
          {activeModule !== "home" && (
            <div 
              className="bg-slate-50 border-b border-slate-200 shadow-sm animate-slide-in flex-shrink-0" 
              style={{ 
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "1rem",
                paddingBottom: "1rem",
                zIndex: 5
              }}
            >
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-1)' }}>{currentTheory.title}</h2>
              <p className="text-slate-500 mt-1 text-sm">{currentTheory.definition}</p>
            </div>
          )}

          {/* Content Area */}
          <div 
            ref={contentRef}
            className={`flex-1 overflow-hidden ${activeModule === "home" ? "" : "p-4"}`}
          >
            <div 
              className={`module-transition h-full ${isTransitioning ? 'module-enter' : 'module-enter-active'}`}
            >
              {/* Layout Container */}
              {activeModule === "home" ? (
                <div className="h-full overflow-y-auto">
                  {renderModule()}
                </div>
              ) : activeModule === "solver" || activeModule === "settings" || activeModule === "resources" || activeModule === "section" ? (
                <div className="h-full overflow-y-auto py-6">
                  {renderModule()}
                </div>
              ) : (
                /* 可调整大小的分栏布局 */
                <div ref={containerRef} className="flex h-full gap-0">
                  {/* Left Column: Visualization & Controls */}
                  <div 
                    className="overflow-y-auto pr-2"
                    style={{ width: `${leftPanelWidth}%` }}
                  >
                    <div className="space-y-4">
                      {renderModule()}
                    </div>
                  </div>

                  {/* Resizer */}
                  <div 
                    className={`resizer flex-shrink-0 w-3 flex items-center justify-center rounded transition-colors ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="resizer-handle w-1 h-12 bg-slate-300 rounded-full transition-colors" />
                  </div>

                  {/* Right Column: AI & Theory */}
                  <div 
                    className="overflow-y-auto pl-2"
                    style={{ width: `${100 - leftPanelWidth}%` }}
                  >
                    <div className="flex flex-col gap-4 h-full">
                      {/* AI Tutor Panel */}
                      <div style={{ height: '55%', minHeight: '350px' }}>
                        <AITutor 
                          activeModule={activeModule} 
                          state={simState} 
                          onNavigateToSettings={() => handleModuleChange("settings")}
                        />
                      </div>

                      {/* Theory Guide Panel */}
                      <div style={{ height: '45%', minHeight: '250px' }}>
                        <TheoryPanel activeModule={activeModule} className="h-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 激活弹窗 */}
      {showActivationModal && (
        <ActivationModal
          onClose={() => setShowActivationModal(false)}
          onActivated={() => setActivated(true)}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
