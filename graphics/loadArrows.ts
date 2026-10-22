/** 统一外荷载箭头：轴拉的实心粉红、浅描边与柔和辉光。
 * 坐标由各场景投影提供；此处只绘制，不改变力的方向、作用点或力矩平面。
 */
type Point=[number,number];
const fill='#fb8fa6',edge='#ffd6df',glow='#ff6f86';
function paint(ctx:CanvasRenderingContext2D) {
  ctx.fillStyle=fill;ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.lineJoin='round';
  ctx.shadowColor=glow;ctx.shadowBlur=12;ctx.fill();ctx.stroke();
}
export function drawLoadArrow(ctx:CanvasRenderingContext2D,from:Point,to:Point,size=1) {
  const length=Math.hypot(to[0]-from[0],to[1]-from[1]);if(length<1)return;
  const head=Math.min(17*size,length*.42),neck=4*size,wing=12*size;
  ctx.save();ctx.setLineDash([]);ctx.translate(...from);ctx.rotate(Math.atan2(to[1]-from[1],to[0]-from[0]));
  ctx.beginPath();ctx.moveTo(0,-neck);ctx.lineTo(length-head,-neck);ctx.lineTo(length-head,-wing);ctx.lineTo(length,0);ctx.lineTo(length-head,wing);ctx.lineTo(length-head,neck);ctx.lineTo(0,neck);ctx.closePath();
  paint(ctx);ctx.restore();
}
/** 力矩矢量采用双箭头，避免端面圆环侧视时退化成横向集中力。 */
export function drawMomentVector(ctx:CanvasRenderingContext2D,from:Point,to:Point,size=1) {
  drawLoadArrow(ctx,from,to,size);
  const length=Math.hypot(to[0]-from[0],to[1]-from[1]);if(length<42*size)return;
  ctx.save();ctx.translate(...from);ctx.rotate(Math.atan2(to[1]-from[1],to[0]-from[0]));
  const tip=length-21*size;ctx.beginPath();ctx.moveTo(tip,0);ctx.lineTo(tip-17*size,-12*size);ctx.lineTo(tip-17*size,12*size);ctx.closePath();paint(ctx);ctx.restore();
}
/** 沿已投影的力矩曲线生成实心带状箭身，箭头顺曲线切向；支持反向路径。 */
export function drawMomentArrow(ctx:CanvasRenderingContext2D,points:Point[],size=1) {
  if(points.length<2)return;
  const distance=[0];for(let i=1;i<points.length;i++)distance.push(distance[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const length=distance.at(-1)!;if(length<4)return;
  const head=Math.min(17*size,length*.25),cut=length-head,body:Point[]=[];
  for(let i=0;i<points.length-1;i++){body.push(points[i]);if(distance[i+1]>=cut){const ratio=(cut-distance[i])/(distance[i+1]-distance[i]||1);body.push([points[i][0]+(points[i+1][0]-points[i][0])*ratio,points[i][1]+(points[i+1][1]-points[i][1])*ratio]);break;}}
  const tip=points.at(-1)!,base=body.at(-1)!,dx=tip[0]-base[0],dy=tip[1]-base[1],norm=Math.hypot(dx,dy)||1,normal:Point=[-dy/norm,dx/norm];
  const side=(index:number,sign:number):Point=>{const p=body[index],a=body[Math.max(0,index-1)],b=index===body.length-1?tip:body[index+1],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[p[0]-(b[1]-a[1])/len*4*size*sign,p[1]+(b[0]-a[0])/len*4*size*sign];};
  ctx.save();ctx.setLineDash([]);ctx.beginPath();body.forEach((_,i)=>{const p=side(i,1);if(i)ctx.lineTo(...p);else ctx.moveTo(...p);});
  ctx.lineTo(base[0]+normal[0]*12*size,base[1]+normal[1]*12*size);ctx.lineTo(...tip);ctx.lineTo(base[0]-normal[0]*12*size,base[1]-normal[1]*12*size);
  for(let i=body.length-1;i>=0;i--)ctx.lineTo(...side(i,-1));ctx.closePath();paint(ctx);ctx.restore();
}
