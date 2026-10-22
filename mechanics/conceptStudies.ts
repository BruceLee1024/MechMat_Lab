// 截面法取悬臂杆右段为隔离体：端部向下 P、向右 F，截面内力平衡外载。
export function sectionStudy(positionPercent: number, transverseKN: number, axialKN: number) {
  const positionM = positionPercent / 100;
  return { positionM, remainingM: 1 - positionM, axialKN, shearKN: transverseKN, momentKNm: transverseKN * (1 - positionM) };
}

// 100 mm 正方形内的仿射位移场 u=εx·x+γxy·y，v=0；刚体平移的位移梯度为零。
export function strainStudy({ rigid, axialPercent, shear, translationXmm, translationYmm }: {
  rigid: boolean; axialPercent: number; shear: number; translationXmm: number; translationYmm: number;
}) {
  const ex = rigid ? 0 : axialPercent / 100;
  const gamma = rigid ? 0 : shear;
  return { ex, ey: 0, gamma, cornerUXmm: rigid ? translationXmm : 100 * (ex + gamma), cornerVYmm: rigid ? translationYmm : 0 };
}
