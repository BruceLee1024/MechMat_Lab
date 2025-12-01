// ==========================================
// 材料力学求解器 - 类型定义
// ==========================================

// 支座类型
export type SupportType = 'fixed' | 'pinned' | 'roller' | 'none';

// 荷载类型
// point: 集中力
// distributed: 均布荷载
// triangular: 三角形分布荷载
// moment: 力矩
export type LoadType = 'point' | 'distributed' | 'triangular' | 'moment';

// 单元类型
export type ElementType = 'beam' | 'truss';

// 节点定义
export interface SolverNode {
  id: string;
  x: number;  // 位置 (mm)
  y: number;
  support: SupportType;
  // 约束自由度
  fixedDOF: {
    dx: boolean;  // x方向位移
    dy: boolean;  // y方向位移
    rz: boolean;  // 绕z轴转角
  };
}

// 单元定义
export interface SolverElement {
  id: string;
  type: ElementType;
  nodeStart: string;  // 起始节点ID
  nodeEnd: string;    // 终止节点ID
  // 截面属性
  section: {
    A: number;      // 面积 (mm²)
    I: number;      // 惯性矩 (mm⁴)
    width: number;  // 宽度 (mm)
    height: number; // 高度 (mm)
  };
  // 材料属性
  material: {
    E: number;      // 弹性模量 (MPa)
    G: number;      // 剪切模量 (MPa)
    yield: number;  // 屈服强度 (MPa)
  };
}

// 荷载定义
export interface SolverLoad {
  id: string;
  type: LoadType;
  // 作用位置
  targetType: 'node' | 'element';
  targetId: string;
  position?: number;      // 对于单元上的荷载，0-1表示起始相对位置
  positionEnd?: number;   // 对于部分分布荷载，0-1表示结束相对位置
  // 荷载值
  value: number;          // N 或 N/m 或 Nm
  valueEnd?: number;      // 对于三角形荷载，终点处的荷载强度
  angle: number;          // 角度 (度)，0为水平向右，90为垂直向下
}

// 求解结果 - 节点
export interface NodeResult {
  nodeId: string;
  displacement: {
    dx: number;  // mm
    dy: number;  // mm
    rz: number;  // rad
  };
  reaction?: {
    Fx: number;  // N
    Fy: number;  // N
    Mz: number;  // Nm
  };
}

// 应力分布点
export interface StressPoint {
  position: number;     // 0-1 沿单元长度
  // 正应力 (MPa)
  sigmaN: number;       // 轴向正应力 σ = N/A
  sigmaMTop: number;    // 弯曲正应力（上表面）σ = -My/I
  sigmaMBottom: number; // 弯曲正应力（下表面）σ = My/I
  sigmaTop: number;     // 总正应力（上表面）= sigmaN + sigmaMTop
  sigmaBottom: number;  // 总正应力（下表面）= sigmaN + sigmaMBottom
  // 剪应力 (MPa)
  tauMax: number;       // 最大剪应力（中性轴处）τ = VQ/(Ib)
  // 主应力 (MPa) - 在最大剪应力点
  sigma1: number;       // 第一主应力
  sigma2: number;       // 第二主应力
  tauAbsMax: number;    // 绝对最大剪应力
  // von Mises 等效应力
  sigmaVonMises: number;
}

// 求解结果 - 单元
export interface ElementResult {
  elementId: string;
  // 内力 (沿单元长度分布)
  internalForces: {
    position: number;  // 0-1
    N: number;         // 轴力 (N)
    V: number;         // 剪力 (N)
    M: number;         // 弯矩 (Nm)
  }[];
  // 应力分布
  stressDistribution: StressPoint[];
  // 应力极值
  maxStress: number;   // 最大拉应力 (MPa)
  minStress: number;   // 最大压应力 (MPa，负值)
  maxShearStress: number; // 最大剪应力 (MPa)
  maxVonMises: number; // 最大von Mises应力 (MPa)
  // 安全系数
  safetyFactor: number; // 基于屈服强度
  // 应变能
  strainEnergy: number; // mJ
}

// 完整求解结果
export interface SolverResult {
  success: boolean;
  message: string;
  nodes: NodeResult[];
  elements: ElementResult[];
  totalStrainEnergy: number;
}

// 求解器状态
export interface SolverState {
  nodes: SolverNode[];
  elements: SolverElement[];
  loads: SolverLoad[];
  // 编辑状态
  selectedId: string | null;
  editMode: 'select' | 'node' | 'element' | 'load' | 'support';
  // 视图状态
  viewScale: number;
  viewOffset: { x: number; y: number };
  showGrid: boolean;
  gridSize: number;
  // 结果
  result: SolverResult | null;
  showResults: boolean;
  resultType: 'deformation' | 'axial' | 'shear' | 'moment' | 'stress';
}

// 默认状态
export const DEFAULT_SOLVER_STATE: SolverState = {
  nodes: [],
  elements: [],
  loads: [],
  selectedId: null,
  editMode: 'select',
  viewScale: 1,
  viewOffset: { x: 0, y: 0 },
  showGrid: true,
  gridSize: 50,
  result: null,
  showResults: false,
  resultType: 'moment',
};

// 预设模板
export interface SolverTemplate {
  name: string;
  description: string;
  nodes: SolverNode[];
  elements: SolverElement[];
  loads: SolverLoad[];
}

// 简支梁模板
export const SIMPLY_SUPPORTED_BEAM: SolverTemplate = {
  name: '简支梁',
  description: '两端简支的单跨梁，中间集中荷载',
  nodes: [
    {
      id: 'n1',
      x: 100,
      y: 300,
      support: 'pinned',
      fixedDOF: { dx: true, dy: true, rz: false },
    },
    {
      id: 'n2',
      x: 500,
      y: 300,
      support: 'roller',
      fixedDOF: { dx: false, dy: true, rz: false },
    },
  ],
  elements: [
    {
      id: 'e1',
      type: 'beam',
      nodeStart: 'n1',
      nodeEnd: 'n2',
      section: { A: 10000, I: 833333, width: 100, height: 100 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
  ],
  loads: [
    {
      id: 'l1',
      type: 'point',
      targetType: 'element',
      targetId: 'e1',
      position: 0.5,
      value: 10000,
      angle: 90,
    },
  ],
};

// 悬臂梁模板
export const CANTILEVER_BEAM: SolverTemplate = {
  name: '悬臂梁',
  description: '一端固定的悬臂梁，自由端集中荷载',
  nodes: [
    {
      id: 'n1',
      x: 100,
      y: 300,
      support: 'fixed',
      fixedDOF: { dx: true, dy: true, rz: true },
    },
    {
      id: 'n2',
      x: 500,
      y: 300,
      support: 'none',
      fixedDOF: { dx: false, dy: false, rz: false },
    },
  ],
  elements: [
    {
      id: 'e1',
      type: 'beam',
      nodeStart: 'n1',
      nodeEnd: 'n2',
      section: { A: 10000, I: 833333, width: 100, height: 100 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
  ],
  loads: [
    {
      id: 'l1',
      type: 'point',
      targetType: 'node',
      targetId: 'n2',
      value: 5000,
      angle: 90,
    },
  ],
};

// 连续梁模板
export const CONTINUOUS_BEAM: SolverTemplate = {
  name: '两跨连续梁',
  description: '三个支座的两跨连续梁',
  nodes: [
    {
      id: 'n1',
      x: 100,
      y: 300,
      support: 'pinned',
      fixedDOF: { dx: true, dy: true, rz: false },
    },
    {
      id: 'n2',
      x: 350,
      y: 300,
      support: 'roller',
      fixedDOF: { dx: false, dy: true, rz: false },
    },
    {
      id: 'n3',
      x: 600,
      y: 300,
      support: 'roller',
      fixedDOF: { dx: false, dy: true, rz: false },
    },
  ],
  elements: [
    {
      id: 'e1',
      type: 'beam',
      nodeStart: 'n1',
      nodeEnd: 'n2',
      section: { A: 10000, I: 833333, width: 100, height: 100 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
    {
      id: 'e2',
      type: 'beam',
      nodeStart: 'n2',
      nodeEnd: 'n3',
      section: { A: 10000, I: 833333, width: 100, height: 100 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
  ],
  loads: [
    {
      id: 'l1',
      type: 'point',
      targetType: 'element',
      targetId: 'e1',
      position: 0.5,
      value: 8000,
      angle: 90,
    },
    {
      id: 'l2',
      type: 'point',
      targetType: 'element',
      targetId: 'e2',
      position: 0.5,
      value: 8000,
      angle: 90,
    },
  ],
};

// 桁架模板
export const SIMPLE_TRUSS: SolverTemplate = {
  name: '简单桁架',
  description: '三角形桁架结构',
  nodes: [
    {
      id: 'n1',
      x: 100,
      y: 400,
      support: 'pinned',
      fixedDOF: { dx: true, dy: true, rz: false },
    },
    {
      id: 'n2',
      x: 400,
      y: 400,
      support: 'roller',
      fixedDOF: { dx: false, dy: true, rz: false },
    },
    {
      id: 'n3',
      x: 250,
      y: 200,
      support: 'none',
      fixedDOF: { dx: false, dy: false, rz: false },
    },
  ],
  elements: [
    {
      id: 'e1',
      type: 'truss',
      nodeStart: 'n1',
      nodeEnd: 'n2',
      section: { A: 500, I: 0, width: 25, height: 20 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
    {
      id: 'e2',
      type: 'truss',
      nodeStart: 'n1',
      nodeEnd: 'n3',
      section: { A: 500, I: 0, width: 25, height: 20 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
    {
      id: 'e3',
      type: 'truss',
      nodeStart: 'n2',
      nodeEnd: 'n3',
      section: { A: 500, I: 0, width: 25, height: 20 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
  ],
  loads: [
    {
      id: 'l1',
      type: 'point',
      targetType: 'node',
      targetId: 'n3',
      value: 10000,
      angle: 90,
    },
  ],
};

// 均布荷载简支梁模板
export const DISTRIBUTED_LOAD_BEAM: SolverTemplate = {
  name: '均布荷载梁',
  description: '简支梁承受均布荷载',
  nodes: [
    {
      id: 'n1',
      x: 100,
      y: 300,
      support: 'pinned',
      fixedDOF: { dx: true, dy: true, rz: false },
    },
    {
      id: 'n2',
      x: 500,
      y: 300,
      support: 'roller',
      fixedDOF: { dx: false, dy: true, rz: false },
    },
  ],
  elements: [
    {
      id: 'e1',
      type: 'beam',
      nodeStart: 'n1',
      nodeEnd: 'n2',
      section: { A: 10000, I: 833333, width: 100, height: 100 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
  ],
  loads: [
    {
      id: 'l1',
      type: 'distributed',
      targetType: 'element',
      targetId: 'e1',
      value: 5000,
      angle: 90,
    },
  ],
};

// 斜杆桁架模板（如图所示的结构）
export const INCLINED_TRUSS: SolverTemplate = {
  name: '斜杆桁架',
  description: '斜杆AB + 水平杆CB，节点B受力',
  nodes: [
    {
      id: 'A',
      x: 100,
      y: 100,
      support: 'pinned',
      fixedDOF: { dx: true, dy: true, rz: false },
    },
    {
      id: 'B',
      x: 400,
      y: 300,
      support: 'none',
      fixedDOF: { dx: false, dy: false, rz: false },
    },
    {
      id: 'C',
      x: 100,
      y: 300,
      support: 'pinned',
      fixedDOF: { dx: true, dy: true, rz: false },
    },
  ],
  elements: [
    {
      id: 'AB',
      type: 'truss',
      nodeStart: 'A',
      nodeEnd: 'B',
      section: { A: 500, I: 0, width: 25, height: 20 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
    {
      id: 'CB',
      type: 'truss',
      nodeStart: 'C',
      nodeEnd: 'B',
      section: { A: 500, I: 0, width: 25, height: 20 },
      material: { E: 200000, G: 77000, yield: 250 },
    },
  ],
  loads: [
    {
      id: 'F',
      type: 'point',
      targetType: 'node',
      targetId: 'B',
      value: 10000,
      angle: 90, // 向下
    },
  ],
};

export const SOLVER_TEMPLATES = [
  SIMPLY_SUPPORTED_BEAM,
  CANTILEVER_BEAM,
  DISTRIBUTED_LOAD_BEAM,
  CONTINUOUS_BEAM,
  SIMPLE_TRUSS,
  INCLINED_TRUSS,
];
