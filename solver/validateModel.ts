import type { SolverNode, SolverElement, SolverLoad } from './SolverTypes';

// 入口校验阻止无效模型进入矩阵组装；更详细的结构诊断留给后续求解器升级。
export function validateSolverModel(nodes: SolverNode[], elements: SolverElement[], loads: SolverLoad[]): string | null {
  if (nodes.length < 2) return '至少需要2个节点';
  if (!elements.length) return '至少需要1个单元';
  if (!loads.length) return '请添加荷载';
  for (const [label, items] of [['节点', nodes], ['单元', elements], ['荷载', loads]] as const) {
    if (new Set(items.map(item => item.id)).size !== items.length) return `${label}编号重复`;
  }
  for (const node of nodes) {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return `节点 ${node.id} 的坐标必须为有限数值`;
  }
  for (const element of elements) {
    const start = nodes.find(node => node.id === element.nodeStart), end = nodes.find(node => node.id === element.nodeEnd);
    if (!start || !end) return `单元 ${element.id} 引用了不存在的节点`;
    if (Math.hypot(end.x - start.x, end.y - start.y) <= 0) return `单元 ${element.id} 长度必须大于 0`;
    const required = [element.section.A, element.material.E, element.material.G, element.material.yield];
    if (element.type === 'beam') required.push(element.section.I, element.section.width, element.section.height);
    if (required.some(value => !Number.isFinite(value) || value <= 0)) return `单元 ${element.id} 的面积、刚度和材料参数必须为正有限数值`;
  }
  for (const load of loads) {
    if (![load.value, load.angle, load.valueEnd ?? 0].every(Number.isFinite)) return `荷载 ${load.id} 的数值与方向必须为有限数值`;
    const targets = load.targetType === 'node' ? nodes : elements;
    if (!targets.some(item => item.id === load.targetId)) return `荷载 ${load.id} 引用了不存在的对象`;
    if (load.targetType === 'element') {
      for (const position of [load.position, load.positionEnd]) {
        if (position !== undefined && (!Number.isFinite(position) || position < 0 || position > 1)) return `荷载 ${load.id} 的相对位置必须位于 0 与 1 之间`;
      }
      if (load.positionEnd !== undefined && load.positionEnd <= (load.position ?? 0)) return `荷载 ${load.id} 的结束位置必须大于起始位置`;
    }
  }
  if (!nodes.some(node => node.fixedDOF.dx || node.fixedDOF.dy || node.fixedDOF.rz)) return '结构无约束，请添加支座';
  return null;
}
