import type { SolverNode } from './SolverTypes';

/** 视图缩放不改模型坐标，为支座、荷载箭头与标签留出画布边距。 */
export function fitSolverView(nodes: SolverNode[], width: number, height: number) {
  if (!nodes.length || width <= 0 || height <= 0) return {viewScale: 1, viewOffset: {x: 0, y: 0}};
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const padding=Math.min(70,width/4,height/4);
  const viewScale=Math.min(1.5,(width-2*padding)/Math.max(1,maxX-minX),(height-2*padding)/Math.max(1,maxY-minY));
  return {viewScale,viewOffset:{x:width/2-(minX+maxX)/2*viewScale,y:height/2-(minY+maxY)/2*viewScale}};
}
