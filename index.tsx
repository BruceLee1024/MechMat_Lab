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
import { FormulasModule } from "./modules/FormulasModule";
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
  const [showWechatQR, setShowWechatQR] = useState(false);

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

        {/* 获取激活码引导 */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 text-center mb-3">还没有激活码？联系作者获取</p>
          <div className="flex items-center justify-center gap-2">
            {/* 微信 */}
            <button
              type="button"
              onClick={() => setShowWechatQR(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              <span className="text-sm font-medium">微信</span>
            </button>
            {/* 抖音 */}
            <a
              href="https://www.douyin.com/user/self?from_tab_name=main"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
              <span className="text-sm font-medium">抖音</span>
            </a>
            {/* 小红书 */}
            <a
              href="https://www.xiaohongshu.com/user/profile/67b884d2000000000e013859"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
              <span className="text-sm font-medium">小红书</span>
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          激活后永久有效，无需重复激活
        </p>

        {/* 微信二维码弹窗 */}
        {showWechatQR && (
          <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
            onClick={() => setShowWechatQR(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800">微信扫码添加</h3>
                <button
                  onClick={() => setShowWechatQR(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}wechat-qr.png`}
                  alt="微信二维码"
                  className="w-48 h-48 rounded-lg object-contain"
                />
              </div>
              <p className="text-sm text-slate-500 text-center mt-4">
                扫码添加作者微信获取激活码
              </p>
              <p className="text-xs text-slate-400 text-center mt-1">
                备注"材料力学"可优先通过
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 锁定模块提示组件
const LockedModuleOverlay = ({ onActivate }: { onActivate: () => void }) => {
  const [showWechatQR, setShowWechatQR] = useState(false);
  
  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">此功能需要激活</h3>
        <p className="text-slate-500 mb-6">输入激活码解锁全部功能，联系作者获取激活码</p>
        <button
          onClick={onActivate}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all mb-4"
        >
          输入激活码
        </button>
        
        {/* 联系方式 */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setShowWechatQR(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
            微信
          </button>
          <a
            href="https://www.douyin.com/user/self?from_tab_name=main"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            抖音
          </a>
          <a
            href="https://www.xiaohongshu.com/user/profile/67b884d2000000000e013859"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
            小红书
          </a>
        </div>
      </div>

      {/* 微信二维码弹窗 */}
      {showWechatQR && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowWechatQR(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">微信扫码添加</h3>
              <button
                onClick={() => setShowWechatQR(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}wechat-qr.png`}
                alt="微信二维码"
                className="w-48 h-48 rounded-lg object-contain"
              />
            </div>
            <p className="text-sm text-slate-500 text-center mt-4">
              扫码添加作者微信获取激活码
            </p>
            <p className="text-xs text-slate-400 text-center mt-1">
              备注"材料力学"可优先通过
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

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
        case "formulas": return <FormulasModule />;
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
              ) : activeModule === "solver" || activeModule === "settings" || activeModule === "resources" || activeModule === "section" || activeModule === "formulas" ? (
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
