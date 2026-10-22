import { deformSpecimen, strainPoint, type DeformationForm, type Vec3 } from './conceptGeometry';

export type ConceptFlowScene =
  | { kind: 'sections'; cut: number; axial: number; transverse: number; isolate: boolean }
  | { kind: 'strain'; rigid: boolean; axialPercent: number; shear: number; tx: number; ty: number }
  | { kind: 'forms'; form: DeformationForm; amount: number };
export interface ConceptParticle { trail: Vec3[]; color: string; opacity: number; family: 'axial' | 'shear' | 'torsion' | 'bending' }
const tension = '#ffc690', compression = '#81eadb', shearColor = '#90dcff', torqueColor = '#cfb5ff';
const clamp = (v: number) => Math.max(0, Math.min(1, v));

// 这些场景没有完整的材料/截面应力解。轨迹表达受力或应变特点，不输出虚构的 MPa。
export function sampleConceptFlow(scene: ConceptFlowScene, seconds: number): ConceptParticle[] {
  if (!Number.isFinite(seconds) || !Object.values(scene).every(value => typeof value !== 'number' || Number.isFinite(value))) return [];
  if (scene.kind === 'strain' && scene.rigid) return [];
  const particles: ConceptParticle[] = [];
  const phase = (Math.max(0, seconds) % 6.25) / 6.25;
  const start = scene.kind === 'sections' && scene.isolate ? -225 + 450 * clamp(scene.cut / 100) : -225;
  if (scene.kind === 'sections' && start >= 225) return [];
  const transform = (p: Vec3): Vec3 => {
    if (scene.kind === 'sections') return [p[0] * 225, p[1] * 48, p[2] * 48];
    if (scene.kind === 'strain') return strainPoint([(p[0] + 1) * 50, (p[1] + 1) * 50, p[2] * 18], false, scene.axialPercent / 100, scene.shear, scene.tx, scene.ty);
    return deformSpecimen([p[0] * 225, p[1] * 48, p[2] * 48], scene.form, scene.amount);
  };
  let lane = 0;
  const emit = (path: (t: number) => Vec3, strength: number, color: string, family: ConceptParticle['family'], closed = false, weight: (p: Vec3) => number = () => 1) => {
    strength = clamp(strength); if (strength === 0) return;
    const count = closed ? 6 + Math.floor(strength * 8) : 2 + Math.floor(strength * 4), seed = lane++ * .137;
    for (let packet = 0; packet < count; packet++) {
      const t = (phase + seed + packet / count) % 1;
      if (scene.kind === 'sections' && scene.isolate && transform(path(t))[0] < start) continue;
      const fade = closed ? 1 : Math.min(1, t / .08, (1 - t) / .08);
      const opacity = fade * Math.sqrt(strength) * clamp(weight(path(t)));
      if (opacity < .001) continue;
      const trail = Array.from({ length: 5 }, (_, i) => {
        const previous = t - (4 - i) * (closed ? .022 : .012);
        const point = transform(path(closed ? (previous + 1) % 1 : clamp(previous)));
        return scene.kind === 'sections' && scene.isolate ? [Math.max(start, point[0]), point[1], point[2]] as Vec3 : point;
      });
      particles.push({ trail, color, opacity, family });
    }
  };
  const axial = (signed: number, bending = false) => {
    const rows = bending ? [-.85, -.55, -.25, .25, .55, .85] : [-.48, 0, .48];
    for (const y of rows) for (const z of [-.58, .58]) for (const side of [-1, 1]) {
      // 本例截面法右段 M 使上侧受拉；基本弯曲的 U 形轴线使上侧受压。
      const sign = bending ? Math.sign(y) * Math.sign(signed) * (scene.kind === 'sections' ? 1 : -1) : Math.sign(signed);
      const strength = Math.abs(signed) * (bending ? Math.abs(y) : 1);
      emit(t => [side * (.035 + .93 * (sign > 0 ? t : 1 - t)), y, z], strength, sign > 0 ? tension : compression, bending ? 'bending' : 'axial', false,
        p => bending && scene.kind === 'sections' ? (225 - transform(p)[0]) / 450 : 1);
    }
  };
  const shear = (signed: number) => {
    const sign = Math.sign(signed), strength = Math.abs(signed);
    for (const z of [-.6, .6]) {
      for (const y of [-.72, -.3, .3, .72]) emit(t => [Math.sign(y) * sign * (t * 1.86 - .93), y, z], strength, shearColor, 'shear', false, p => 1 - p[1] ** 2);
      for (const x of [-.94, -.62, -.28, .28, .62, .94]) emit(t => [x, Math.sign(x) * sign * (t * 1.86 - .93), z], strength, shearColor, 'shear', false, p => 1 - p[1] ** 2);
    }
  };
  if (scene.kind === 'sections') {
    axial(scene.axial / 5);
    shear(-scene.transverse / 5);
    axial(scene.transverse / 5, true);
  } else if (scene.kind === 'strain') {
    axial(scene.axialPercent);
    shear(scene.shear / .03);
  } else if (scene.form === 'axial') axial(scene.amount);
  else if (scene.form === 'shear') shear(scene.amount);
  else if (scene.form === 'bending') axial(scene.amount, true);
  else for (const x of [-.85, -.42, .42, .85]) for (const radius of [.38, .76]) {
    emit(t => { const angle = Math.sign(x) * t * Math.PI * 2; return [x, radius * Math.cos(angle), radius * Math.sin(angle)]; }, scene.amount * radius, torqueColor, 'torsion', true);
  }
  return particles;
}

export function conceptFlowLabel(scene: ConceptFlowScene): string {
  if (scene.kind === 'strain') return scene.rigid ? '刚体平移 · 无应变粒子流' : scene.axialPercent === 0 && scene.shear === 0 ? '零应变 · 无粒子流' : '应变方向示意 · 轴向伸缩 / 层间剪切';
  if (scene.kind === 'sections') return scene.axial === 0 && scene.transverse === 0 ? '未加载 · 无内力粒子流' : '内力示意 · N 轴向 / Q 剪切 / M 分层';
  if (scene.amount === 0) return '零演示幅度 · 无粒子流';
  return { axial: '轴向受拉 · 平行流', shear: '剪切作用 · 成对反向流', torsion: '扭矩方向 · 两端反向环流', bending: '弯曲作用 · 金色受拉 / 青色受压' }[scene.form];
}
