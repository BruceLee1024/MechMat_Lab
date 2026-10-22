import {describe,it,expect} from 'vitest';
import {sectionShear,type SectionShear} from '../mechanics/sectionShear';
import type {SectionProperties} from '../types';
const field=(s:SectionProperties,nu=.3,r=1)=>{const f=sectionShear(s,nu,r);if(f.ok===false)throw Error(f.reason);return f;};
function integrate(f:SectionShear,fn:(q:SectionShear['points'][number])=>number){return f.points.reduce((s,q)=>s+q.weight*fn(q),0);}
describe('横剪、非圆扭转截面弹性场',()=>{
  it('矩形 J 与独立傅里叶级数一致，加密后收敛',()=>{
    const b=100,h=50;let sum=0;for(let n=1;n<200;n+=2)sum+=Math.tanh(n*Math.PI*b/(2*h))/n**5;
    const exact=b*h**3/3*(1-192*h/(Math.PI**5*b)*sum),a=field({type:'rectangle',width:b,height:h},.3,.6),c=field({type:'rectangle',width:b,height:h},.3,1.5);
    expect(Math.abs(c.J/exact-1)).toBeLessThan(.0003);expect(Math.abs(c.J-exact)).toBeLessThan(Math.abs(a.J-exact));expect(c.J).toBeLessThan((b*h**3+h*b**3)/12*.7);
  });
  it.each<SectionProperties>([{type:'rectangle',width:50,height:100},{type:'i_beam'},{type:'t_beam'},{type:'channel'},{type:'composite',compSpacing:0}])('单位场积分恢复合力合矩，含 %j',s=>{
    const f=field(s);expect(integrate(f,q=>q.vy)).toBeCloseTo(1,6);expect(integrate(f,q=>q.vz)).toBeCloseTo(0,6);expect(integrate(f,q=>q.y*q.vz-q.z*q.vy)).toBeCloseTo(0,6);
    expect(integrate(f,q=>q.ty)).toBeCloseTo(0,8);expect(integrate(f,q=>q.tz)).toBeCloseTo(0,8);expect(integrate(f,q=>q.y*q.tz-q.z*q.ty)).toBeCloseTo(1,6);
    expect(integrate(f,q=>q.ty*q.ty+q.tz*q.tz)*f.J).toBeCloseTo(1,8);expect(f.residual).toBeLessThan(1e-7);
  });
  it('圆与环的剪应力在内外边界无穿出，并恢复剪力；圆心不使用 V/A',()=>{
    for(const r of [0,20,29]) {const f=field(r?{type:'hollow_circle',outerRadius:30,innerRadius:r}:{type:'circle',radius:30});
      for(const radius of [r,30])for(let j=0;j<17;j++){const y=radius*Math.cos(j),z=radius*Math.sin(j),q=f.at(y,z)!;expect(q.vy*y+q.vz*z).toBeCloseTo(0,10);}
      expect(integrate(f,q=>q.vy)).toBeCloseTo(1,3);expect(integrate(f,q=>q.y*q.tz-q.z*q.ty)).toBeCloseTo(1,4);
    }
    const f=field({type:'circle',radius:30});expect(f.at(0,0)!.vy*Math.PI*900).toBeCloseTo((3+.6)/(2*1.3),12);
  });
  it('对称截面剪心在形心；槽钢剪心在腹板外侧且存在互等耦合',()=>{
    for(const s of [{type:'rectangle'},{type:'i_beam'},{type:'t_beam'}] as SectionProperties[])expect(Math.abs(field(s).shearCenterZ)).toBeLessThan(1e-5);
    const c=field({type:'channel'});expect(c.shearCenterZ).toBeLessThan(-15);expect(c.elasticShearCenterZ).toBeLessThan(-15);expect(c.complianceVV*c.complianceTT-c.complianceVT**2).toBeGreaterThan(0);
  });
  it('相似非圆截面的尺度律：J×16、剪力场÷4、扭矩场÷8、翘曲函数×4',()=>{
    const a=field({type:'rectangle',width:50,height:100}),b=field({type:'rectangle',width:100,height:200}),p=a.at(21,11)!,q=b.at(42,22)!;
    expect(b.J/a.J).toBeCloseTo(16,9);expect(q.vy/p.vy).toBeCloseTo(.25,8);expect(q.tz/p.tz).toBeCloseTo(.125,8);expect(q.omega/p.omega).toBeCloseTo(4,8);expect(b.complianceVV/a.complianceVV).toBeCloseTo(.25,8);
  });
  it('圆环场独立满足局部平衡、弹性旋度兼容，矩形自由边无切应力穿出',()=>{
    const f=field({type:'hollow_circle',outerRadius:30,innerRadius:20}),y=22,z=5,h=.001,I=Math.PI*(30**4-20**4)/4,nu=.3;
    const div=(f.at(y+h,z)!.vy-f.at(y-h,z)!.vy+f.at(y,z+h)!.vz-f.at(y,z-h)!.vz)/(2*h);
    const curl=(f.at(y+h,z)!.vz-f.at(y-h,z)!.vz-f.at(y,z+h)!.vy+f.at(y,z-h)!.vy)/(2*h);
    expect(div).toBeCloseTo(-y/I,11);expect(curl).toBeCloseTo(-nu*z/((1+nu)*I),11);
    const r=field({type:'rectangle',width:50,height:100},.3,1.5);for(const yy of [-50,50])for(const zz of [-20,0,20]){const q=r.at(yy,zz)!;expect(Math.abs(q.ty*r.J/100)).toBeLessThan(.02);}
  });
  it('真实轮廓缺失、断开组合截面、非各向同性E/G不伪造剪应力',()=>{
    expect(sectionShear({type:'custom'}).ok).toBe(false);expect(sectionShear({type:'composite',compSpacing:10}).ok).toBe(false);expect(sectionShear({type:'rectangle'},.6).ok).toBe(false);
  });
  it('对照 Pilkey 官方槽形算例的独立 J、两种剪心和剪切能',()=>{
    // 官方例：翼缘中线间距18、腹板中线至翼缘端8、全厚1；坐标转至形心。
    // https://sectionproperties.readthedocs.io/en/stable/examples/validation/pilkey_channel.html
    const f=field({type:'channel',channelWidth:8.5,channelHeight:19,channelFlange:1,channelWeb:1},.33333,2);
    expect(Math.abs(f.J/11.28862-1)).toBeLessThan(.003);
    expect(f.elasticShearCenterZ).toBeCloseTo(-2.86769-1.875,2);expect(f.shearCenterZ).toBeCloseTo(-2.86759-1.875,2);
    const tv=-f.elasticShearCenterZ,rawEnergy=f.complianceVV+2*tv*f.complianceVT+tv*tv*f.complianceTT;
    expect(Math.abs(rawEnergy*34/2.15337-1)).toBeLessThan(.002);
  });
});
