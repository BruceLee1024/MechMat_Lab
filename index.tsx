import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Menu } from "lucide-react";

import { ModuleType, SimulationState, DEFAULT_STATE, THEORY_INFO } from "./types";
import { Sidebar, TheoryPanel } from "./components";
import { AxialModule, BendingModule, TorsionModule, BucklingModule, StressModule, CombinedModule, FundamentalsModule } from "./modules";
import { SolverModule } from "./solver/SolverModule";
import { AITutor } from "./ai";
import { ThemeName, getCurrentTheme, applyTheme } from "./theme";

// --- Main App ---

const App = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>("axial");
  const [simState, setSimState] = useState<SimulationState>(DEFAULT_STATE);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getCurrentTheme());

  // 初始化主题
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const handleStateChange = (changes: Partial<SimulationState>) => {
    setSimState((prev) => ({ ...prev, ...changes }));
  };

  const currentTheory = THEORY_INFO[activeModule];

  const renderModule = () => {
    switch (activeModule) {
      case "fundamentals": return <FundamentalsModule state={simState} onChange={handleStateChange} />;
      case "axial": return <AxialModule state={simState} onChange={handleStateChange} />;
      case "bending": return <BendingModule state={simState} onChange={handleStateChange} />;
      case "torsion": return <TorsionModule state={simState} onChange={handleStateChange} />;
      case "buckling": return <BucklingModule state={simState} onChange={handleStateChange} />;
      case "stress": return <StressModule state={simState} onChange={handleStateChange} />;
      case "combined": return <CombinedModule state={simState} onChange={handleStateChange} />;
      case "solver": return <SolverModule />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 font-sans bg-slate-50">
      {/* Sidebar Component */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Mobile) */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden">
            <h1 className="font-bold text-lg">材料力学可视化实验室</h1>
            <button onClick={() => setIsMenuOpen(true)} className="text-slate-600">
                <Menu className="w-6 h-6" />
            </button>
        </header>

        {/* Scrollable Area */}
        <main className={`flex-1 flex flex-col overflow-hidden ${activeModule === "solver" ? "" : ""}`}>
          {/* Sticky Header */}
          <div className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-sm" style={{ 
            paddingLeft: activeModule === "solver" ? "1rem" : "1rem",
            paddingRight: activeModule === "solver" ? "1rem" : "1rem",
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem",
            zIndex: 5
          }}>
            <div className={activeModule === "solver" ? "" : "max-w-[1600px] mx-auto"}>
              <h2 className="text-3xl font-bold" style={{ color: 'var(--color-1)' }}>{currentTheory.title}</h2>
              <p className="text-slate-500 mt-2 text-lg">{currentTheory.definition}</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className={`flex-1 overflow-y-auto ${activeModule === "solver" ? "p-4" : "p-4 md:p-8"}`}>
            <div className={activeModule === "solver" ? "h-full flex flex-col" : "max-w-[1600px] mx-auto"}>
              {/* Layout Container: Added items-start to prevent left column stretching */}
              {activeModule === "solver" ? (
                <div className="flex-1 min-h-[600px]">
                  {renderModule()}
                </div>
              ) : (
                <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                    {/* Left Column: Visualization & Controls (2/3) */}
                    <div className="flex-grow xl:w-2/3 min-w-0 space-y-6">
                        {renderModule()}
                    </div>

                    {/* Right Column: AI & Theory (1/3) */}
                    <div className="xl:w-1/3 min-w-[300px] flex flex-col space-y-6">
                        
                        {/* AI Tutor Panel Component */}
                        <AITutor activeModule={activeModule} state={simState} />

                        {/* Theory Guide Panel Component */}
                        <TheoryPanel activeModule={activeModule} className="flex-1 min-h-[300px]" />
                    </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);