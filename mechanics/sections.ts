import type { SectionProperties, SectionType } from '../types';
import { CalculationResult, calculation, invalidParameters } from './validation';

export function calculateSectionProperties(section: SectionProperties): { area: number; Iz: number; Iy: number; yMax: number; zMax: number; Ip: number; Wp: number } {
  switch (section.type) {
    case 'rectangle': {
      const b = section.width ?? 100;
      const h = section.height ?? 150;
      const area = b * h;
      const Iz = (b * Math.pow(h, 3)) / 12;
      const Ip = (b * h * (Math.pow(b, 2) + Math.pow(h, 2))) / 12; // 矩形极惯性矩
      return { area, Iz, Iy: (h * Math.pow(b, 3)) / 12, yMax: h / 2, zMax: b / 2, Ip, Wp: Ip / Math.max(b, h) / 2 };
    }
    case 'circle': {
      const r = section.radius ?? 50;
      const d = r * 2;
      const area = Math.PI * r * r;
      const Iz = (Math.PI * Math.pow(d, 4)) / 64;
      const Ip = (Math.PI * Math.pow(d, 4)) / 32; // 实心圆 Ip = πd⁴/32
      return { area, Iz, Iy: (Math.PI * Math.pow(d, 4)) / 64, yMax: r, zMax: r, Ip, Wp: Ip / r };
    }
    case 'hollow_circle': {
      const ro = section.outerRadius ?? 50;
      const ri = section.innerRadius ?? 40;
      const do_ = ro * 2;
      const di = ri * 2;
      const area = Math.PI * (Math.pow(ro, 2) - Math.pow(ri, 2));
      const Iz = (Math.PI / 64) * (Math.pow(do_, 4) - Math.pow(di, 4));
      const Ip = (Math.PI / 32) * (Math.pow(do_, 4) - Math.pow(di, 4)); // 空心圆 Ip
      return { area, Iz, Iy: (Math.PI / 64) * (Math.pow(do_, 4) - Math.pow(di, 4)), yMax: ro, zMax: ro, Ip, Wp: Ip / ro };
    }
    case 'i_beam': {
      const bf = section.flangeWidth ?? 100;
      const tf = section.flangeThickness ?? 10;
      const hw = section.webHeight ?? 100;
      const tw = section.webThickness ?? 6;
      const h = hw + 2 * tf;
      const Iz = (bf * Math.pow(h, 3)) / 12 - 2 * ((bf - tw) / 2 * Math.pow(hw, 3)) / 12;
      const Iy = 2 * (tf * Math.pow(bf, 3)) / 12 + (hw * Math.pow(tw, 3)) / 12;
      const area = 2 * bf * tf + hw * tw;
      return { area, Iz, Iy, yMax: h / 2, zMax: bf / 2, Ip: Iz + Iy, Wp: (Iz + Iy) / Math.max(h, bf) / 2 };
    }
    case 't_beam': {
      const bf = section.tFlangeWidth ?? 100;
      const tf = section.tFlangeThickness ?? 10;
      const hw = section.tWebHeight ?? 80;
      const tw = section.tWebThickness ?? 8;
      const h = tf + hw;
      const area = bf * tf + hw * tw;
      const yc = (bf * tf * (hw + tf / 2) + hw * tw * (hw / 2)) / area;
      const Iz_flange = (bf * Math.pow(tf, 3)) / 12 + bf * tf * Math.pow((hw + tf / 2) - yc, 2);
      const Iz_web = (tw * Math.pow(hw, 3)) / 12 + hw * tw * Math.pow((hw / 2) - yc, 2);
      const Iz = Iz_flange + Iz_web;
      const Iy = (tf * Math.pow(bf, 3)) / 12 + (hw * Math.pow(tw, 3)) / 12;
      return { area, Iz, Iy, yMax: Math.max(yc, h - yc), zMax: bf / 2, Ip: Iz + Iy, Wp: (Iz + Iy) / Math.max(h, bf) / 2 };
    }
    case 'channel': {
      const b = section.channelWidth ?? 50;
      const h = section.channelHeight ?? 100;
      const tf = section.channelFlange ?? 8;
      const tw = section.channelWeb ?? 5;
      const area = 2 * b * tf + (h - 2 * tf) * tw;
      const Iz = (tw * Math.pow(h, 3)) / 12 + 2 * (b * Math.pow(tf, 3) / 12 + b * tf * Math.pow((h - tf) / 2, 2));
      const Iy = 2 * (tf * Math.pow(b, 3)) / 12 + ((h - 2 * tf) * Math.pow(tw, 3)) / 12;
      return { area, Iz, Iy, yMax: h / 2, zMax: b, Ip: Iz + Iy, Wp: (Iz + Iy) / Math.max(h, b) / 2 };
    }
    case 'composite': {
      const b1 = section.comp1Width ?? 100;
      const h1 = section.comp1Height ?? 20;
      const b2 = section.comp2Width ?? 40;
      const h2 = section.comp2Height ?? 80;
      const spacing = section.compSpacing ?? 0;
      const totalH = h1 + spacing + h2;
      const area = b1 * h1 + b2 * h2;
      const yc = (b1 * h1 * (h2 + spacing + h1 / 2) + b2 * h2 * (h2 / 2)) / area;
      const Iz1 = (b1 * Math.pow(h1, 3)) / 12 + b1 * h1 * Math.pow((h2 + spacing + h1 / 2) - yc, 2);
      const Iz2 = (b2 * Math.pow(h2, 3)) / 12 + b2 * h2 * Math.pow((h2 / 2) - yc, 2);
      const Iz = Iz1 + Iz2;
      const Iy = (h1 * Math.pow(b1, 3)) / 12 + (h2 * Math.pow(b2, 3)) / 12;
      return { area, Iz, Iy, yMax: Math.max(yc, totalH - yc), zMax: Math.max(b1, b2) / 2, Ip: Iz + Iy, Wp: (Iz + Iy) / Math.max(totalH, Math.max(b1, b2)) / 2 };
    }
    case 'custom': {
      const Iz = section.customIz ?? 1e6;
      const Iy = section.customIy ?? 1e6;
      return { area: section.customArea ?? 1000, Iz, Iy, yMax: 50, zMax: 50, Ip: Iz + Iy, Wp: (Iz + Iy) / 50 };
    }
    default: {
      const area = 1000, Iz = 1e6, Iy = 1e6;
      return { area, Iz, Iy, yMax: 50, zMax: 50, Ip: Iz + Iy, Wp: (Iz + Iy) / 50 };
    }
  }
};

interface SectionField {
  key: Exclude<keyof SectionProperties, 'type'>;
  label: string;
  defaultValue: number;
  allowZero?: boolean;
}

export const SECTION_FIELDS: Record<SectionType, SectionField[]> = {
  rectangle: [{ key: 'width', label: '宽度 b (mm)', defaultValue: 100 }, { key: 'height', label: '高度 h (mm)', defaultValue: 150 }],
  circle: [{ key: 'radius', label: '半径 r (mm)', defaultValue: 50 }],
  hollow_circle: [{ key: 'outerRadius', label: '外半径 R (mm)', defaultValue: 50 }, { key: 'innerRadius', label: '内半径 r (mm)', defaultValue: 40, allowZero: true }],
  i_beam: [{ key: 'flangeWidth', label: '翼缘宽 bf (mm)', defaultValue: 100 }, { key: 'flangeThickness', label: '翼缘厚 tf (mm)', defaultValue: 10 }, { key: 'webHeight', label: '腹板高 hw (mm)', defaultValue: 100 }, { key: 'webThickness', label: '腹板厚 tw (mm)', defaultValue: 6 }],
  t_beam: [{ key: 'tFlangeWidth', label: '翼缘宽 bf (mm)', defaultValue: 100 }, { key: 'tFlangeThickness', label: '翼缘厚 tf (mm)', defaultValue: 10 }, { key: 'tWebHeight', label: '腹板高 hw (mm)', defaultValue: 80 }, { key: 'tWebThickness', label: '腹板厚 tw (mm)', defaultValue: 8 }],
  channel: [{ key: 'channelWidth', label: '宽度 b (mm)', defaultValue: 50 }, { key: 'channelHeight', label: '高度 h (mm)', defaultValue: 100 }, { key: 'channelFlange', label: '翼缘厚 tf (mm)', defaultValue: 8 }, { key: 'channelWeb', label: '腹板厚 tw (mm)', defaultValue: 5 }],
  composite: [{ key: 'comp1Width', label: '上部宽度 b1 (mm)', defaultValue: 100 }, { key: 'comp1Height', label: '上部高度 h1 (mm)', defaultValue: 20 }, { key: 'comp2Width', label: '下部宽度 b2 (mm)', defaultValue: 40 }, { key: 'comp2Height', label: '下部高度 h2 (mm)', defaultValue: 80 }, { key: 'compSpacing', label: '间距 (mm)', defaultValue: 0, allowZero: true }],
  custom: [{ key: 'customArea', label: '面积 A (mm²)', defaultValue: 1000 }, { key: 'customIz', label: 'Iz (mm⁴)', defaultValue: 1e6 }, { key: 'customIy', label: 'Iy (mm⁴)', defaultValue: 1e6 }],
};

export function validateSection(section: SectionProperties): string | null {
  const fields = SECTION_FIELDS[section.type];
  if (!fields) return '不支持的截面类型';
  for (const field of fields) {
    const value = section[field.key] ?? field.defaultValue;
    if (!Number.isFinite(value) || (field.allowZero ? value < 0 : value <= 0)) return `${field.label}必须是${field.allowZero ? '非负' : '正'}有限数值`;
  }
  if (section.type === 'hollow_circle' && (section.innerRadius ?? 40) >= (section.outerRadius ?? 50)) return '内半径必须小于外半径';
  if (section.type === 'i_beam' && (section.webThickness ?? 6) > (section.flangeWidth ?? 100)) return '腹板厚度不能大于翼缘宽度';
  if (section.type === 't_beam' && (section.tWebThickness ?? 8) > (section.tFlangeWidth ?? 100)) return '腹板厚度不能大于翼缘宽度';
  if (section.type === 'channel' && ((section.channelFlange ?? 8) * 2 >= (section.channelHeight ?? 100) || (section.channelWeb ?? 5) >= (section.channelWidth ?? 50))) return '槽钢尺寸需满足 2tf < h 且 tw < b';
  const props = calculateSectionProperties(section);
  if (invalidParameters(props, ['area', 'Iz', 'Iy', 'yMax', 'zMax', 'Ip', 'Wp']).length) return '截面属性超出可计算范围';
  return null;
}

export function evaluateSection(section: SectionProperties): CalculationResult<ReturnType<typeof calculateSectionProperties>> {
  const message = validateSection(section);
  if (message) return { ok: false, diagnostics: [{ field: 'section', message }] };
  return calculation(calculateSectionProperties(section), ['截面几何尺寸使用 mm，惯性矩使用 mm⁴。'], section.type === 'custom' ? ['自定义截面边缘距离仍采用原模块的 50 mm 示意值；精确边缘应力需要补充完整几何信息。'] : []);
}
