# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MechMat Lab (材料力学可视化实验室) is an interactive materials mechanics learning platform built with React 19 + TypeScript + Vite. It provides visualization modules for core mechanics concepts (axial loading, bending, torsion, buckling, stress states, combined loading), a structural solver, an AI tutor, and a formula/section properties reference.

The app is in Chinese (zh-CN). All UI text, comments, and documentation are in Chinese.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server on port 3000
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build
- `npm run typecheck` — TypeScript 类型检查
- `npm test` — Vitest 计算、求解器、实验文档/历史和 AI 传输回归
- `npm run test:watch` — 持续运行测试

尚未配置独立的 lint 和格式化工具。测试位于 `tests/`，使用 `vitest.config.ts` 的 Node 环境。

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) auto-deploys to GitHub Pages on push to `main`. The base path is `/MechMat_Lab/` (configured in `vite.config.ts`).

## Architecture

### Entry Point & App Shell

`index.tsx` is the main entry. It renders the `App` component which manages:
- Module routing via `experiments/useWorkspace.ts` (no router library — conditional rendering in `renderModule()`；导航立即生效)
- `components/Workbench.tsx`：桌面可调分栏、专注模式；小屏“实验 / 理论 / AI 助教”面板。布局规则在 `workbench.css`
- `components/ExperimentToolbar.tsx`：存档、例题、对比和导入导出；弹窗提供焦点限制与关闭后恢复
- Theme application and activation gating

### Module System

Each learning module is a React component in `modules/`. 基础模块接收由当前模块文档还原的 `SimulationState` 和 `onChange`；不同模块的材料、截面与载荷独立保存。求解器接收 `SolverModel`，截面工具接收 `SectionModel`，选择项、缩放和编辑弹窗留在视图中。The module types are defined in `types.ts` as `ModuleType`.

`modules.tsx` is a barrel re-export file for the core mechanics modules (fundamentals, axial, bending, torsion, buckling, combined, stress). Other modules (Home, Settings, Resources, Section, Formulas) are imported directly in `index.tsx`.

### Solver (`solver/`)

The structural solver analyzes beam/truss structures using finite element methods:

- `SolverTypes.ts` — Type definitions for nodes, elements, loads, results, and preset templates
- `UnifiedSolver.ts` — Main entry point (`solveUnified`). Auto-selects solving strategy:
  - 简单单跨梁 → 本文件内的截面法解析路径
  - 复杂多跨、桁架或框架 → 本文件内的矩阵位移路径
  - `ClassicSolver.ts`、`AdvancedSolver.ts`、`MatrixDisplacementSolver.ts` 和 `SolverEngine.ts` 保留兼容，当前 UI 不以它们作为生产求解入口
- `SolverEngine.ts` — Low-level matrix math (Gaussian elimination, stiffness matrices, coordinate transforms)
- `SolverModule.tsx` — UI for the solver (modeling panel, SVG canvas, results display)

### 计算层 (`mechanics/`)

- `units.ts`：内部采用 N、mm、MPa、N·mm；输入与显示在边界显式换算。N·mm 的能量等于 mJ，换成 J 需除以 1000。
- `calculations.ts`、`sections.ts`：可独立于 React 调用的基础模块与截面计算。
- `sectionTool.ts`：独立截面工具的预设和多边形计算；`SectionToolType` 与基础模块 `SectionType` 分开。截面工具和报告复用 `components/SectionPreview.tsx`。
- `validation.ts`：计算返回成功结果、假设和警告，或参数诊断；有限输入仍须检查计算溢出。
- `simulationState.ts`：状态更新校验和载荷位置联动。
- `aiContext.ts`：AI 摘要复用视图的计算函数及假设，不将无效结果或塑性状态的弹性应变能发送为有效结论。

### Theming (`theme.ts` + `THEME_GUIDE.md`)

4 color schemes (sunset, vibrant, warm, cool), each with 5 CSS variable colors (`--color-1` through `--color-5`). Colors are applied via `applyTheme()` which sets CSS custom properties on `:root`. Use `var(--color-N)` in styles or utility classes like `text-theme-1`, `bg-theme-2`, etc. See `THEME_GUIDE.md` for the full color role mapping.

### AI Tutor (`ai.tsx`)

Configurable AI chat panel. Uses a user-provided API key and base URL (stored in localStorage, configured in Settings). Generates context-aware system prompts based on the active module and current simulation parameters. 基础模块使用 `mechanics/aiContext.ts` 的本地计算摘要。`services/ai/stream.ts` 保留跨块 SSE/UTF-8 数据，`client.ts` 处理超时与取消；模块切换或组件卸载会取消旧请求。

### Activation System (`activation.ts`)

Client-side activation code gating. Free modules: `home`, `fundamentals`, `settings`. All other modules require activation. Activation state is stored in `localStorage` under `mechmat_activation`.

### Shared Components (`components.tsx`)

`components/NumericInput.tsx` 将输入草稿与已提交参数分开，失焦或 Enter 提交，Escape 恢复；各调用处显式指定正值、非负、带符号及区间约束。`components/CalculationNotice.tsx` 展示适用范围和错误恢复入口。

Reusable UI: `LatexRenderer` (KaTeX), `MarkdownRenderer`, `SliderControl`, `SliderInputControl`, `SectionSelector`, `calculateSectionProperties`, `Sidebar`, `TheoryPanel`. The `Sidebar` handles navigation and maps module IDs to icons/labels.

### Shared State (`types.ts`)

`SimulationState` 是基础模块组件的参数接口；不直接整体存档。`DEFAULT_STATE` 提供默认值；`THEORY_INFO` 提供标题、公式和教学内容。

### 实验工作区 (`experiments/`)

- `schema.ts`：文件格式 `mechmat-experiment`、文件/计算版本 1；逐模块字段白名单，导入时校验数值、单位、几何和引用。只支持明确的版本 0 文件迁移，未知版本拒绝。契约见 `docs/实验文档格式.md`。
- `history.ts`：每模块最多 50 步撤销/重做，范围控件一次连续手势合并一步；历史和对比快照不进入持久化数据。
- `storage.ts`、`useWorkspace.ts`：`mechmat_workspace_v1` 自动恢复，350 ms 保存延迟，离页时写入最新模型；命名存档最多 50 个。写入失败显示实际失败状态，损坏的数据保留到用户显式重新启用。
- `results.ts`：对比及报告复用当前纯计算入口；界面参数名称为中文，截面参数使用实际计算尺寸。非圆截面未验证的组合扭转结果不作为可比较数值。
- `examples.ts`：拉伸、弯曲、扭转、压杆四个解析例题；导入样例在 `docs/examples/`。
- `export.ts`：JSON/CSV；`report.tsx` 和 `utils/exportPdf.ts` 按需加载中文 A4 报告、html2canvas、jsPDF。导出冻结模型，报告在独立临时元素中生成；完成或失败都清理，页内溢出给出诊断。

## Key Conventions

- Tailwind CSS is loaded via CDN (`<script src="https://cdn.tailwindcss.com">`) in `index.html`, not as an npm dependency
- Path alias `@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`)
- Icons come from `lucide-react`
- Math formulas use KaTeX (`katex` npm package)
- The `GEMINI_API_KEY` env var is injected at build time via `vite.config.ts` `define` block
- Branches: `main` (production), `develop` (development)
