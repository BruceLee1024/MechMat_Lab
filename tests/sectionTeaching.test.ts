import {describe,it,expect} from 'vitest';
import {SECTION_TOOL_CONFIGS,calculatePolygonSection,type SectionToolType} from '../mechanics/sectionTool';
import {buildSectionTeaching,scanSection} from '../mechanics/sectionTeaching';

const types:SectionToolType[]=['rectangle','circle','hollow-circle','hollow-rectangle','i-beam','t-beam','channel','angle','unequal-angle','double-channel','composite-rect'];
describe('截面教学动画与实际积分一致',()=>{
  for(const type of types)it(`${type} 的分块、形心和惯性贡献合计等于现有解析结果`,()=>{
    const config=SECTION_TOOL_CONFIGS[type],p=Object.fromEntries(config.params.map(v=>[v.key,v.default]));
    const data=buildSectionTeaching(type,p,[])!,expected=config.calculate(p);
    for(const key of ['A','Ix','Iy'] as const)expect(data[key]/expected[key]).toBeCloseTo(1,10);
    expect(data.parts.reduce((s,v)=>s+v.sign*v.A*v.cx,0)/data.A).toBeCloseTo(data.cx,9);
    expect(data.parts.reduce((s,v)=>s+v.sign*v.A*v.cy,0)/data.A).toBeCloseTo(data.cy,9);
    for(const axis of ['x','y'] as const){
      expect(scanSection(data,axis,0).I).toBe(0);
      expect(scanSection(data,axis,1).I/expected[axis==='x'?'Ix':'Iy']).toBeCloseTo(1,10);
      let previous=0;
      for(let i=0;i<=20;i++){const v=scanSection(data,axis,i/20);expect(v.I+expected.Ip*1e-10).toBeGreaterThanOrEqual(previous);previous=v.I;}
    }
  });
  it('矩形扫描按距整体形心轴的距离积分，四分之一面积不等于四分之一惯性矩',()=>{
    const data=buildSectionTeaching('rectangle',{b:100,h:200},[])!;
    expect(scanSection(data,'x',.25).A).toBeCloseTo(5000,8);
    expect(scanSection(data,'x',.25).I/data.Ix).toBeCloseTo(.4375,10);
    expect(scanSection(data,'x',.5).I/data.Ix).toBeCloseTo(.5,10);
  });
  it('两块翼缘按原位平行轴项计算，不能以展开后的显示位置计算',()=>{
    const d=buildSectionTeaching('i-beam',{H:200,B:100,tw:8,tf:12},[])!;
    const flanges=d.parts.filter(p=>p.label.includes('翼缘'));
    expect(flanges.reduce((s,p)=>s+p.A,0)/d.A).toBeCloseTo(.63025210084,9);
    expect(flanges.reduce((s,p)=>s+p.Ix,0)/d.Ix).toBeCloseTo(.8538577144,9);
    expect(flanges[0].dy).toBe(94);
    expect(flanges[0].Ix).toBe(100*12**3/12+1200*94**2);
  });
  it('圆管扫描使用圆的解析积分，半截面贡献为一半，末帧无多边形离散误差',()=>{
    const d=buildSectionTeaching('hollow-circle',{D:120,d:80},[])!;
    expect(scanSection(d,'x',.5).A/d.A).toBeCloseTo(.5,12);
    expect(scanSection(d,'y',.5).I/d.Iy).toBeCloseTo(.5,12);
    expect(scanSection(d,'x',1).I).toBe(d.Ix);
    expect(scanSection(d,'x',1-1e-7).I/d.Ix).toBeCloseTo(1,7);
  });
  it('偏心内孔的面积及整项惯性矩都取负，扫描仍绕整体形心轴',()=>{
    const rect=(id:string,x:number,y:number,w:number,h:number,isHole=false)=>({id,isClosed:true,isHole,vertices:[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]});
    const paths=[rect('outer',0,0,100,100),rect('hole',10,10,20,20,true)];
    const d=buildSectionTeaching('draw',{},paths)!,actual=calculatePolygonSection(paths);
    expect(d.Ix/actual.Ix).toBeCloseTo(1,12);expect(d.cx).toBeCloseTo((10000*50-400*20)/9600,10);
    const hole=d.parts.find(p=>p.sign<0)!;expect(hole.Ix).toBeLessThan(0);
    const integral=(w:number,a:number,b:number)=>w*((b-d.cy)**3-(a-d.cy)**3)/3;
    expect(scanSection(d,'x',.5).I).toBeCloseTo(integral(100,0,50)-integral(20,10,30),6);
  });
  it('非凸自绘轮廓被扫描线截成分离区域时仍正确累计面积',()=>{
    const vertices=[[0,0],[4,0],[4,4],[3,4],[3,1],[1,1],[1,4],[0,4]].map(([x,y])=>({x,y}));
    const d=buildSectionTeaching('draw',{},[{id:'u',vertices,isHole:false,isClosed:true}])!;
    expect(d.A).toBe(10);expect(scanSection(d,'x',.75).A).toBeCloseTo(8,10);
    expect(scanSection(d,'y',.5).A).toBeCloseTo(5,10);
  });
  it('不把非法尺寸生成可播放的教学结果',()=>{
    expect(buildSectionTeaching('rectangle',{b:-100,h:-150},[])).toBeNull();
    expect(buildSectionTeaching('circle',{d:-100},[])).toBeNull();
    expect(buildSectionTeaching('hollow-circle',{D:100,d:120},[])).toBeNull();
  });
  it('自定义特性及空草稿不生成虚构分块，进度限制在实际范围内',()=>{
    expect(buildSectionTeaching('custom',{A:1000,Ix:1e6,Iy:1e6},[])).toBeNull();
    expect(buildSectionTeaching('draw',{},[])).toBeNull();
    const d=buildSectionTeaching('rectangle',{b:20,h:10},[])!;
    expect(scanSection(d,'x',-1).I).toBe(0);expect(scanSection(d,'x',2).I).toBe(d.Ix);
  });
});
