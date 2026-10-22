/** 截面法线与杆轴夹角为 α；返回与等截面试件相交后的截面四角。 */
export function axialSectionPlane(halfLength: number, halfWidth: number, angleDegrees: number): [number, number, number][] {
  const angle = Math.max(0, Math.min(90, angleDegrees));
  const tangent = Math.tan(angle * Math.PI / 180);
  const cutX = Math.min(halfLength, halfWidth * tangent);
  const cutY = tangent > 1e-9 ? cutX / tangent : halfWidth;
  return [[cutX, -cutY, -halfWidth], [-cutX, cutY, -halfWidth], [-cutX, cutY, halfWidth], [cutX, -cutY, halfWidth]];
}
