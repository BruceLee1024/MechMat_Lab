import { describe, it, expect } from 'vitest';
import { bendingProfile, bendingVertex, bendingDisplay } from '../graphics/bendingGeometry';
import { bendingStation } from '../mechanics/bendingField';
import { SECTION_FIELDS, calculateSectionProperties } from '../mechanics/sections';
import type { SectionType, SectionProperties } from '../types';

const field={load:20000,lengthMm:2000,positionMm:500,modulusMPa:200000,inertia:100*150**3/12};
describe('弯曲三维几何', () => {
  it('三维中性轴逐点使用物理挠度，跨度和截面采用同一空间比例', () => {
    for(const x of [0,250,500,900,2000]) {
      const p=bendingVertex(field,x,0,0,1000);
      expect(p[0]).toBeCloseTo((x-1000)*560/2000,10);
      expect(p[1]).toBeCloseTo(-bendingStation(field,x).deflection*1000*560/2000,10);
    }
    const a=bendingVertex(field,0,0,50,1),b=bendingVertex(field,0,0,-50,1);
    expect(a[2]-b[2]).toBeCloseTo(100*560/2000,10);
  });
  it('截面保持平面且随局部转角转动，不单独扭曲截面宽高', () => {
    const a=bendingVertex(field,500,75,50,1000),b=bendingVertex(field,500,-75,50,1000);
    expect(Math.hypot(...a.map((v,i)=>v-b[i]))).toBeCloseTo(150*560/2000,10);
  });
  it.each(Object.keys(SECTION_FIELDS) as SectionType[])('%s 截面与计算形心和边缘距离一致',type=>{
    const section:SectionProperties={type},p=bendingProfile(section),v=calculateSectionProperties(section);
    if(type==='custom') {expect(p.schematic).toBe(true);expect(p.contours).toHaveLength(0);return;}
    expect(Math.max(p.top,-p.bottom)).toBeCloseTo(v.yMax,8);
    expect(p.contours.flat().every(([y,z])=>Number.isFinite(y)&&Number.isFinite(z))).toBe(true);
  });
  it('空心截面保留孔洞，非对称T形中性轴不是截面中线',()=>{
    expect(bendingProfile({type:'hollow_circle'}).contours).toHaveLength(2);
    const p=bendingProfile({type:'t_beam'});
    expect(p.top).not.toBe(-p.bottom);
  });
  it.each(['rectangle','i_beam','t_beam','channel','composite'] as SectionType[])('%s 三维多边形的形心与弯曲惯性矩和计算截面一致',type=>{
    let area=0,first=0,firstZ=0,inertia=0,inertiaY=0;
    for(const c of bendingProfile({type}).contours)for(let i=0;i<c.length;i++){
      const [y,z]=c[i],[yn,zn]=c[(i+1)%c.length],cross=z*yn-zn*y;
      area+=cross/2;first+=(y+yn)*cross/6;inertia+=(y*y+y*yn+yn*yn)*cross/12;
      firstZ+=(z+zn)*cross/6;inertiaY+=(z*z+z*zn+zn*zn)*cross/12;
    }
    const v=calculateSectionProperties({type});
    expect(area).toBeCloseTo(v.area,7);
    expect(first/area).toBeCloseTo(0,9);
    expect(firstZ/area).toBeCloseTo(0,9);
    expect(inertia).toBeCloseTo(v.Iz,5);
    expect(inertiaY).toBeCloseTo(v.Iy,5);
  });
  it('刚度变化影响实际曲线；固定显示倍率不随材料归一化，大物理挠度回退参考形态',()=>{
    const a=bendingDisplay(field,1),b=bendingDisplay({...field,modulusMPa:100000},1);
    expect(b.peak.deflection).toBeCloseTo(a.peak.deflection*2,10);
    expect(bendingDisplay(field,1000).amplification).toBe(1000);
    expect(bendingDisplay({...field,modulusMPa:100000},1000).amplification).toBe(1000);
    expect(bendingDisplay({...field,modulusMPa:1},1000).available).toBe(false);
  });
});
