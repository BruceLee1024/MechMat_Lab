// ==========================================
// 统一求解器 - 矩阵位移法
// ==========================================

import {
  SolverNode,
  SolverElement,
  SolverLoad,
  SolverResult,
} from './SolverTypes';

import { solveByMatrixMethod } from './MatrixDisplacementSolver';

// ==========================================
// 统一求解入口
// ==========================================
export function solveUnified(
  nodes: SolverNode[],
  elements: SolverElement[],
  loads: SolverLoad[]
): SolverResult {
  // 输入验证
  if (nodes.length < 2) {
    return { success: false, message: '至少需要2个节点', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  if (elements.length < 1) {
    return { success: false, message: '至少需要1个单元', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  if (loads.length < 1) {
    return { success: false, message: '请添加荷载', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  const hasSupport = nodes.some(n => n.support !== 'none');
  if (!hasSupport) {
    return { success: false, message: '结构无约束，请添加支座', nodes: [], elements: [], totalStrainEnergy: 0 };
  }
  
  return solveByMatrixMethod(nodes, elements, loads);
}
