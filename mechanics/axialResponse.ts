import { DEFAULT_MATERIALS } from './materials';

export interface AxialMaterialInput { materialName?: string; modulus: number; yieldStrength: number }
export type AxialResponseFamily = 'plateau' | 'smooth' | 'brittle' | 'polymer' | 'elastomer' | 'concrete' | 'wood' | 'elastic';
export interface AxialMaterialResponse {
  name: string; family: AxialResponseFamily; label: string; description: string;
  referenceRole: 'yield' | 'tensile' | 'compression' | 'unspecified'; referenceLabel: string;
  quantitative: boolean; exponent: number; peakRatio: number; plateauEnd: number; peakStrain: number;
}

/** 牌号与参数一起校验，防止改了 E/强度后仍冒用原材料的非线性特性。 */
export function getAxialMaterialResponse(input: AxialMaterialInput): AxialMaterialResponse {
  const preset = DEFAULT_MATERIALS.find(m => m.name === input.materialName && Math.abs(m.E-input.modulus) < 1e-8 && Math.abs(m.yield-input.yieldStrength) < 1e-8);
  const base: AxialMaterialResponse = {
    name: preset?.name ?? '自定义材料', family: 'elastic', label: '线弹性参考',
    description: '只有 E 和参考屈服强度，无法确定屈服后的强化、颈缩与断裂曲线。',
    referenceRole: 'yield', referenceLabel: '参考屈服强度', quantitative: true,
    exponent: 6, peakRatio: 1, plateauEnd: 0, peakStrain: 0,
  };
  if (!preset) return base;
  const name = preset.name;
  if (name === 'Q235钢' || name === 'Q345钢') return { ...base, family: 'plateau', label: '屈服平台型', plateauEnd: name === 'Q235钢' ? .015 : .01, peakStrain: name === 'Q235钢' ? .15 : .12, peakRatio: name === 'Q235钢' ? 1.65 : 1.5, description: '弹性—理想屈服平台—强化—颈缩的教学模型。平台长度、强化和下降段是示意参数，不是牌号实测曲线。' };
  if (preset.category === 'metal' && !name.includes('铸铁')) {
    const aluminium = name.includes('铝'), stainless = name.includes('不锈钢'), copper = name.includes('铜');
    return { ...base, family: 'smooth', label: '连续屈服型', referenceLabel: '0.2% 偏移参考强度', exponent: aluminium ? 10 : stainless ? 6 : copper ? 5 : 12, peakRatio: stainless ? 1.8 : copper ? 1.6 : 1.3,
      description: '用 Ramberg–Osgood 形式展示连续屈服，参考强度对应 0.2% 偏移；指数、峰值和颈缩段仅为教学设定。' };
  }
  if (name.includes('混凝土')) return { ...base, family: 'concrete', label: '开裂软化型', quantitative: false, referenceRole: 'compression', referenceLabel: '库内压缩参考值', description: '当前库值是压缩参考值，不能作为抗拉屈服或断裂阈值。仅展示拉伸开裂后的软化形态；没有抗拉强度和断裂能标定。' };
  if (name === '橡胶') return { ...base, family: 'elastomer', label: '非线性弹性型', quantitative: false, referenceRole: 'unspecified', referenceLabel: '库内参考值', description: '展示橡胶的非线性弹性形态；只有初始 E，缺少超弹性参数，不能给出有限应变的定量曲线。' };
  if (name === '尼龙PA66') return { ...base, family: 'polymer', label: '黏塑性型', quantitative: false, referenceRole: 'unspecified', referenceLabel: '库内参考值', description: '展示屈服、软化和再强化形态；温度、含水率、应变率和黏塑性参数未标定。' };
  if (preset.category === 'wood') return { ...base, family: 'wood', label: '方向相关型', quantitative: false, referenceRole: 'unspecified', referenceLabel: '库内参考值', description: '木材与胶合板的响应取决于纹理/铺层方向及含水率，未指定方向时仅展示拉伸形态，不推断屈服或断裂载荷。' };
  const quantitative = name !== '环氧树脂';
  return { ...base, family: 'brittle', label: '脆性型', quantitative, referenceRole: quantitative ? 'tensile' : 'unspecified', referenceLabel: quantitative ? '教学抗拉参考值' : '库内参考值',
    description: preset.category === 'composite' ? '沿纤维方向的等效单轴脆性教学模型；参考值不是任意铺层、方向下的设计强度。' : quantitative ? '近似线弹性至脆断参考点，不绘制金属式屈服平台。参考值用于教学，不代替试验。' : '固化环氧的脆性拉伸形态示意；缺少固化条件与抗拉破坏参数，不标定断裂应力。' };
}

export function materialStrainAtStress(input: AxialMaterialInput, stress: number) {
  const model = getAxialMaterialResponse(input), E = input.modulus * 1000, ref = input.yieldStrength;
  const ey = ref / E;
  if (model.family === 'smooth') return stress/E + .002 * (stress/ref) ** model.exponent;
  if (model.family === 'plateau' && stress > ref) return model.plateauEnd + (stress/ref-1) / (model.peakRatio-1) * (model.peakStrain-model.plateauEnd);
  return stress/E;
}

export interface MaterialCurvePoint { strain: number; stress: number; stage: string; branch: 'loading' | 'post-peak' }
export function sampleMaterialCurve(input: AxialMaterialInput) {
  const model = getAxialMaterialResponse(input), ref = input.yieldStrength, ey = ref/(input.modulus*1000);
  const points: MaterialCurvePoint[] = [];
  const push = (strain: number, stress: number, stage: string, branch: MaterialCurvePoint['branch'] = 'loading') => points.push({ strain, stress, stage, branch });
  if (!model.quantitative) {
    // 无量纲形态图，不把缺失的材料试验参数编成 MPa 或百分比。
    if (model.family === 'concrete') [[0,0],[.2,.45],[.45,.85],[.55,1],[.65,.38],[.8,.16],[1,.05]].forEach(([x,y]) => push(x,y,x <= .55 ? '开裂前示意' : '开裂软化示意', x <= .55 ? 'loading' : 'post-peak'));
    else if (model.family === 'polymer') [[0,0],[.1,.35],[.22,.65],[.38,.54],[.6,.58],[.8,.72],[1,1]].forEach(([x,y]) => push(x,y,'黏塑性形态示意'));
    else if (model.family === 'elastomer') for (let i=0;i<=60;i++) { const x=i/60; push(x,.08*x+.92*x**3,'非线性弹性形态'); }
    else [[0,0],[1,1]].forEach(([x,y]) => push(x,y,'方向/条件未标定'));
    return { model, normalized: true, points, referenceStrain: null, peakStress: null, peakStrain: null };
  }
  if (model.family === 'plateau') {
    for (let i=0;i<16;i++) push(ey*i/16,ref*i/16,'线弹性');
    push(ey,ref,'屈服平台'); push(model.plateauEnd,ref,'屈服平台');
    for (let i=1;i<=40;i++) { const stress=ref*(1+(model.peakRatio-1)*i/40); push(materialStrainAtStress(input,stress),stress,'强化示意'); }
    push(model.peakStrain*1.4,ref*model.peakRatio*.8,'颈缩示意','post-peak');
  } else if (model.family === 'smooth') {
    const stresses = [...Array.from({length:65},(_,i)=>ref*model.peakRatio*i/64),ref].sort((a,b)=>a-b);
    stresses.forEach(stress=>push(materialStrainAtStress(input,stress),stress,'连续屈服示意'));
    const peakStrain=materialStrainAtStress(input,ref*model.peakRatio);
    push(peakStrain*1.4,ref*model.peakRatio*.8,'颈缩示意','post-peak');
  } else {
    for (let i=0;i<=32;i++) push(ey*i/32,ref*i/32,model.family === 'brittle' ? '脆性拉伸示意' : '线弹性');
  }
  const lastLoading = points.filter(p=>p.branch === 'loading').at(-1)!;
  return { model, normalized: false, points, referenceStrain: materialStrainAtStress(input,ref), peakStress: lastLoading.stress, peakStrain: lastLoading.strain };
}
