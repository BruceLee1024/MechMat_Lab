import {describe,it,expect} from 'vitest';
import {fitSolverView} from '../solver/view';
import {SOLVER_TEMPLATES} from '../solver/SolverTypes';

describe('结构画布适应边界',()=>{
  it.each([[360,360],[480,360],[700,650]])('%s×%s 画布完整容纳所有模板，预留荷载和支座位置',(width,height)=>{
    for(const t of SOLVER_TEMPLATES){
      const original=structuredClone(t.nodes),v=fitSolverView(t.nodes,width,height);
      for(const n of t.nodes){const x=n.x*v.viewScale+v.viewOffset.x,y=n.y*v.viewScale+v.viewOffset.y;expect(x).toBeGreaterThanOrEqual(69.999);expect(x).toBeLessThanOrEqual(width-69.999);expect(y).toBeGreaterThanOrEqual(69.999);expect(y).toBeLessThanOrEqual(height-69.999);}
      expect(t.nodes).toEqual(original);
    }
  });
});
