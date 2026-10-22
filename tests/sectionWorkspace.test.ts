import katex from 'katex';
import {sectionDerivedFormulas} from '../mechanics/sectionToolFormulas';
import {describe,it,expect} from 'vitest';
import {SECTION_TOOL_CONFIGS,calculatePolygonSection,type SectionToolType} from '../mechanics/sectionTool';
import {sectionToolGeometry,sectionParameterProblem} from '../mechanics/sectionToolGeometry';

describe('截面工作台的几何与计算一致',()=>{
  for(const type of ['rectangle','hollow-rectangle','i-beam','t-beam','channel','angle','unequal-angle','double-channel','composite-rect'] as SectionToolType[]){
    it(`${type} 的真实轮廓与解析面积、形心惯性矩、边缘距离一致`,()=>{
      const c=SECTION_TOOL_CONFIGS[type],p=Object.fromEntries(c.params.map(f=>[f.key,f.default]));
      const g=sectionToolGeometry(type,p,[]),actual=calculatePolygonSection(g!.paths),expected=c.calculate(p);
      for(const key of ['A','Ix','Iy','Wx','Wy','xmax','ymax'] as const)expect(actual[key]/expected[key]).toBeCloseTo(1,9);
    });
  }
  it('宽高共用比例，不裁切尺寸来伪造轮廓；自定义特性不生成虚构几何',()=>{
    const g=sectionToolGeometry('rectangle',{b:400,h:80},[])!;
    expect(g.width/g.height).toBe(5);expect(g.cx).toBe(200);expect(g.cy).toBe(40);
    expect(sectionToolGeometry('custom',{A:5000,Ix:1e7,Iy:1e7},[])).toBeNull();
  });
  it('圆截面与保存的含孔轮廓采用真实外包尺寸和形心位置',()=>{
    const circle=sectionToolGeometry('hollow-circle',{D:200,d:100},[])!;
    expect(circle.width).toBe(200);expect(circle.height).toBe(200);expect(circle.cx).toBeCloseTo(100,10);expect(circle.cy).toBeCloseTo(100,10);
    const outer={id:'outer',isClosed:true,isHole:false,vertices:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]};
    const hole={id:'hole',isClosed:true,isHole:true,vertices:[{x:10,y:10},{x:30,y:10},{x:30,y:30},{x:10,y:30}]};
    const drawn=sectionToolGeometry('draw',{},[outer,hole])!,r=calculatePolygonSection(drawn.paths);
    expect(r.A).toBe(9600);expect(drawn.cx).toBeCloseTo((10000*50-400*20)/9600);expect(drawn.cy).toBeCloseTo(drawn.cx);
    expect(sectionToolGeometry('draw',{},[])).toBeNull();
  });
  it('右栏公式直接代入当前截面结果并可被 KaTeX 正确排版',()=>{
    const v=SECTION_TOOL_CONFIGS.rectangle.calculate({b:100,h:300}),entries=sectionDerivedFormulas(v);
    expect(entries[1].details!.results[0].value).toBe(v.ix);expect(entries[3].details!.results[0].value).toBe(v.Wx);
    for(const e of entries)for(const latex of [e.formula,...e.details!.symbols.map(s=>s.symbol),...e.details!.steps])expect(()=>katex.renderToString(latex,{throwOnError:true})).not.toThrow();
  });
  it('空心尺寸和工字翼缘尺寸不相容时，保留旧参数并给出原因',()=>{
    expect(sectionParameterProblem('hollow-circle',{D:100,d:110})).toContain('外径');
    expect(sectionParameterProblem('i-beam',{H:100,B:100,tw:8,tf:60})).toContain('翼缘');
    expect(sectionParameterProblem('rectangle',{b:100,h:150})).toBeNull();
  });
});
