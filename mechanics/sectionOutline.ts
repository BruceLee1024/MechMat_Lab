import type { SectionProperties } from '../types';
export type SectionPoint = [number, number]; // y 向上、z 横向，均以形心为原点，单位 mm。
export interface BendingProfile { contours: SectionPoint[][]; label: string; top: number; bottom: number; halfWidth: number; schematic: boolean }
const rect = (bottom: number, top: number, left: number, right: number): SectionPoint[] => [[bottom,left],[bottom,right],[top,right],[top,left]];
export function bendingProfile(s: SectionProperties): BendingProfile {
  let contours: SectionPoint[][] = [], label = '', schematic = false;
  switch(s.type) {
    case 'rectangle': { const b=s.width??100,h=s.height??150; contours=[rect(-h/2,h/2,-b/2,b/2)]; label='矩形'; break; }
    case 'circle': case 'hollow_circle': {
      const R=s.type==='circle' ? s.radius??50 : s.outerRadius??50, r=s.innerRadius??40;
      const circle=(radius:number) => Array.from({length:32},(_,i) => [radius*Math.cos(i*Math.PI/16),radius*Math.sin(i*Math.PI/16)] as SectionPoint);
      contours=[circle(R)]; if(s.type==='hollow_circle' && r>0) contours.push(circle(r).reverse()); label=s.type==='circle'?'圆形':'空心圆'; break;
    }
    case 'i_beam': {
      const b=s.flangeWidth??100,t=s.flangeThickness??10,w=s.webThickness??6,h=(s.webHeight??100)+2*t;
      contours=[[[-h/2,-b/2],[-h/2,b/2],[-h/2+t,b/2],[-h/2+t,w/2],[h/2-t,w/2],[h/2-t,b/2],[h/2,b/2],[h/2,-b/2],[h/2-t,-b/2],[h/2-t,-w/2],[-h/2+t,-w/2],[-h/2+t,-b/2]]]; label='工字钢'; break;
    }
    case 't_beam': {
      const b=s.tFlangeWidth??100,t=s.tFlangeThickness??10,w=s.tWebThickness??8,h=s.tWebHeight??80;
      const yc=(b*t*(h+t/2)+h*w*h/2)/(b*t+h*w);
      contours=[[[-yc,-w/2],[-yc,w/2],[h-yc,w/2],[h-yc,b/2],[h+t-yc,b/2],[h+t-yc,-b/2],[h-yc,-b/2],[h-yc,-w/2]]]; label='T型'; break;
    }
    case 'channel': {
      const b=s.channelWidth??50,h=s.channelHeight??100,t=s.channelFlange??8,w=s.channelWeb??5;
      const zc=(2*b*t*b/2+(h-2*t)*w*w/2)/(2*b*t+(h-2*t)*w);
      contours=[[[-h/2,-zc],[-h/2,b-zc],[-h/2+t,b-zc],[-h/2+t,w-zc],[h/2-t,w-zc],[h/2-t,b-zc],[h/2,b-zc],[h/2,-zc]]]; label='槽钢'; break;
    }
    case 'composite': {
      const b1=s.comp1Width??100,h1=s.comp1Height??20,b2=s.comp2Width??40,h2=s.comp2Height??80,g=s.compSpacing??0;
      const yc=(b1*h1*(h2+g+h1/2)+b2*h2*h2/2)/(b1*h1+b2*h2);
      contours=[rect(h2+g-yc,h2+g+h1-yc,-b1/2,b1/2),rect(-yc,h2-yc,-b2/2,b2/2)]; label='组合截面'; break;
    }
    default: label='自定义截面'; schematic=true;
  }
  const vertices=contours.flat();
  return {contours,label,schematic,top:vertices.length?Math.max(...vertices.map(p=>p[0])):0,bottom:vertices.length?Math.min(...vertices.map(p=>p[0])):0,halfWidth:vertices.length?Math.max(...vertices.map(p=>Math.abs(p[1]))):0};
}
