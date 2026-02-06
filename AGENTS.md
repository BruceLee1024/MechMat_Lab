# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MechMat Lab (材料力学可视化实验室) is an interactive materials mechanics learning platform built with React 19 + TypeScript + Vite. It provides visualization modules for core mechanics concepts (axial loading, bending, torsion, buckling, stress states, combined loading), a structural solver, an AI tutor, and a formula/section properties reference.

The app is in Chinese (zh-CN). All UI text, comments, and documentation are in Chinese.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server on port 3000
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build

There is no linting, formatting, or test setup in this project.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) auto-deploys to GitHub Pages on push to `main`. The base path is `/MechMat_Lab/` (configured in `vite.config.ts`).

## Architecture

### Entry Point & App Shell

`index.tsx` is the main entry. It renders the `App` component which manages:
- Module routing via `activeModule` state (no router library — just conditional rendering in `renderModule()`)
- A resizable two-panel layout: left panel for the active module, right panel for `TheoryPanel` + `AITutor`
- Theme application and activation gating

### Module System

Each learning module is a self-contained React component in `modules/`. Modules receive shared `SimulationState` and an `onChange` callback from `App`. The module types are defined in `types.ts` as `ModuleType`.

`modules.tsx` is a barrel re-export file for the core mechanics modules (fundamentals, axial, bending, torsion, buckling, combined, stress). Other modules (Home, Settings, Resources, Section, Formulas) are imported directly in `index.tsx`.

### Solver (`solver/`)

The structural solver analyzes beam/truss structures using finite element methods:

- `SolverTypes.ts` — Type definitions for nodes, elements, loads, results, and preset templates
- `UnifiedSolver.ts` — Main entry point (`solveUnified`). Auto-selects solving strategy:
  - Simple single-span beams → `ClassicSolver.ts` (analytical closed-form solutions)
  - Complex multi-span/truss/frame structures → `AdvancedSolver.ts` (matrix displacement method)
- `SolverEngine.ts` — Low-level matrix math (Gaussian elimination, stiffness matrices, coordinate transforms)
- `SolverModule.tsx` — UI for the solver (modeling panel, SVG canvas, results display)

### Theming (`theme.ts` + `THEME_GUIDE.md`)

4 color schemes (sunset, vibrant, warm, cool), each with 5 CSS variable colors (`--color-1` through `--color-5`). Colors are applied via `applyTheme()` which sets CSS custom properties on `:root`. Use `var(--color-N)` in styles or utility classes like `text-theme-1`, `bg-theme-2`, etc. See `THEME_GUIDE.md` for the full color role mapping.

### AI Tutor (`ai.tsx`)

Configurable AI chat panel. Uses a user-provided API key and base URL (stored in localStorage, configured in Settings). Generates context-aware system prompts based on the active module and current simulation parameters.

### Activation System (`activation.ts`)

Client-side activation code gating. Free modules: `home`, `fundamentals`, `settings`. All other modules require activation. Activation state is stored in `localStorage` under `mechmat_activation`.

### Shared Components (`components.tsx`)

Reusable UI: `LatexRenderer` (KaTeX), `MarkdownRenderer`, `SliderControl`, `SliderInputControl`, `SectionSelector`, `calculateSectionProperties`, `Sidebar`, `TheoryPanel`. The `Sidebar` handles navigation and maps module IDs to icons/labels.

### Shared State (`types.ts`)

`SimulationState` holds all parameter values across modules (forces, dimensions, material properties). `DEFAULT_STATE` provides initial values. `THEORY_INFO` maps each module to its title, formulas (LaTeX), and educational text.

## Key Conventions

- Tailwind CSS is loaded via CDN (`<script src="https://cdn.tailwindcss.com">`) in `index.html`, not as an npm dependency
- Path alias `@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`)
- Icons come from `lucide-react`
- Math formulas use KaTeX (`katex` npm package)
- The `GEMINI_API_KEY` env var is injected at build time via `vite.config.ts` `define` block
- Branches: `main` (production), `develop` (development)
