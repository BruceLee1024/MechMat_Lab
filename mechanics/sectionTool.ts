// 截面类型
export type SectionToolType = "rectangle" | "circle" | "hollow-circle" | "i-beam" | "t-beam" | "channel" | "angle" | "unequal-angle" | "hollow-rectangle" | "double-channel" | "composite-rect" | "custom" | "draw";

export interface SectionParams {
  [key: string]: number;
}

export interface SectionToolResult {
  A: number;      // 面积 mm²
  Ix: number;     // 对x轴惯性矩 mm⁴
  Iy: number;     // 对y轴惯性矩 mm⁴
  Ip: number;     // 极惯性矩 mm⁴
  ix: number;     // 对x轴惯性半径 mm
  iy: number;     // 对y轴惯性半径 mm
  Wx: number;     // 对x轴抗弯截面模量 mm³
  Wy: number;     // 对y轴抗弯截面模量 mm³
  ymax: number;   // 到x轴最远距离 mm
  xmax: number;   // 到y轴最远距离 mm
}

// 截面配置
export const SECTION_TOOL_CONFIGS: Record<SectionToolType, {
  name: string;
  params: { key: string; label: string; unit: string; default: number; min: number; max: number }[];
  calculate: (p: SectionParams) => SectionToolResult;
  description: string;
}> = {
  rectangle: {
    name: "矩形截面",
    description: "实心矩形截面，宽度b，高度h",
    params: [
      { key: "b", label: "宽度 b", unit: "mm", default: 100, min: 10, max: 500 },
      { key: "h", label: "高度 h", unit: "mm", default: 150, min: 10, max: 500 },
    ],
    calculate: (p) => {
      const { b, h } = p;
      const A = b * h;
      const Ix = (b * Math.pow(h, 3)) / 12;
      const Iy = (h * Math.pow(b, 3)) / 12;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const Wx = Ix / (h / 2);
      const Wy = Iy / (b / 2);
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: h / 2, xmax: b / 2 };
    },
  },
  circle: {
    name: "圆形截面",
    description: "实心圆形截面，直径d",
    params: [
      { key: "d", label: "直径 d", unit: "mm", default: 100, min: 10, max: 500 },
    ],
    calculate: (p) => {
      const { d } = p;
      const r = d / 2;
      const A = Math.PI * r * r;
      const Ix = (Math.PI * Math.pow(d, 4)) / 64;
      const Iy = Ix;
      const Ip = (Math.PI * Math.pow(d, 4)) / 32;
      const ix = d / 4;
      const iy = ix;
      const Wx = (Math.PI * Math.pow(d, 3)) / 32;
      const Wy = Wx;
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: r, xmax: r };
    },
  },
  "hollow-circle": {
    name: "空心圆截面",
    description: "空心圆管截面，外径D，内径d",
    params: [
      { key: "D", label: "外径 D", unit: "mm", default: 100, min: 20, max: 500 },
      { key: "d", label: "内径 d", unit: "mm", default: 80, min: 10, max: 480 },
    ],
    calculate: (p) => {
      const { D, d } = p;
      const A = (Math.PI / 4) * (D * D - d * d);
      const Ix = (Math.PI / 64) * (Math.pow(D, 4) - Math.pow(d, 4));
      const Iy = Ix;
      const Ip = (Math.PI / 32) * (Math.pow(D, 4) - Math.pow(d, 4));
      const ix = Math.sqrt(Ix / A);
      const iy = ix;
      const Wx = Ix / (D / 2);
      const Wy = Wx;
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: D / 2, xmax: D / 2 };
    },
  },
  "hollow-rectangle": {
    name: "空心矩形截面",
    description: "空心矩形截面（方管），外宽B，外高H，壁厚t",
    params: [
      { key: "B", label: "外宽 B", unit: "mm", default: 100, min: 20, max: 500 },
      { key: "H", label: "外高 H", unit: "mm", default: 150, min: 20, max: 500 },
      { key: "t", label: "壁厚 t", unit: "mm", default: 10, min: 2, max: 50 },
    ],
    calculate: (p) => {
      const { B, H, t } = p;
      const b = B - 2 * t;
      const h = H - 2 * t;
      const A = B * H - b * h;
      const Ix = (B * Math.pow(H, 3) - b * Math.pow(h, 3)) / 12;
      const Iy = (H * Math.pow(B, 3) - h * Math.pow(b, 3)) / 12;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const Wx = Ix / (H / 2);
      const Wy = Iy / (B / 2);
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: H / 2, xmax: B / 2 };
    },
  },
  "i-beam": {
    name: "工字形截面",
    description: "工字钢截面，总高H，翼缘宽B，腹板厚tw，翼缘厚tf",
    params: [
      { key: "H", label: "总高 H", unit: "mm", default: 200, min: 50, max: 600 },
      { key: "B", label: "翼缘宽 B", unit: "mm", default: 100, min: 30, max: 400 },
      { key: "tw", label: "腹板厚 tw", unit: "mm", default: 8, min: 4, max: 30 },
      { key: "tf", label: "翼缘厚 tf", unit: "mm", default: 12, min: 4, max: 40 },
    ],
    calculate: (p) => {
      const { H, B, tw, tf } = p;
      const hw = H - 2 * tf; // 腹板高度
      const A = 2 * B * tf + hw * tw;
      const Ix = (B * Math.pow(H, 3) - (B - tw) * Math.pow(hw, 3)) / 12;
      const Iy = (2 * tf * Math.pow(B, 3) + hw * Math.pow(tw, 3)) / 12;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const Wx = Ix / (H / 2);
      const Wy = Iy / (B / 2);
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: H / 2, xmax: B / 2 };
    },
  },
  "t-beam": {
    name: "T形截面",
    description: "T形截面，翼缘宽B，翼缘厚tf，腹板高hw，腹板厚tw",
    params: [
      { key: "B", label: "翼缘宽 B", unit: "mm", default: 150, min: 30, max: 400 },
      { key: "tf", label: "翼缘厚 tf", unit: "mm", default: 15, min: 4, max: 50 },
      { key: "hw", label: "腹板高 hw", unit: "mm", default: 150, min: 30, max: 400 },
      { key: "tw", label: "腹板厚 tw", unit: "mm", default: 10, min: 4, max: 30 },
    ],
    calculate: (p) => {
      const { B, tf, hw, tw } = p;
      const H = tf + hw;
      const A1 = B * tf;
      const A2 = hw * tw;
      const A = A1 + A2;
      // 形心位置（从底部算起）
      const y1 = hw + tf / 2;
      const y2 = hw / 2;
      const yc = (A1 * y1 + A2 * y2) / A;
      // 对形心轴的惯性矩
      const Ix = (B * Math.pow(tf, 3)) / 12 + A1 * Math.pow(y1 - yc, 2) +
                 (tw * Math.pow(hw, 3)) / 12 + A2 * Math.pow(y2 - yc, 2);
      const Iy = (tf * Math.pow(B, 3)) / 12 + (hw * Math.pow(tw, 3)) / 12;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const ymax_top = H - yc;
      const ymax_bottom = yc;
      const ymax = Math.max(ymax_top, ymax_bottom);
      const Wx = Ix / ymax;
      const Wy = Iy / (B / 2);
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax, xmax: B / 2 };
    },
  },
  channel: {
    name: "槽钢截面",
    description: "槽钢截面，总高H，翼缘宽B，腹板厚tw，翼缘厚tf",
    params: [
      { key: "H", label: "总高 H", unit: "mm", default: 160, min: 50, max: 400 },
      { key: "B", label: "翼缘宽 B", unit: "mm", default: 65, min: 20, max: 200 },
      { key: "tw", label: "腹板厚 tw", unit: "mm", default: 8, min: 4, max: 20 },
      { key: "tf", label: "翼缘厚 tf", unit: "mm", default: 10, min: 4, max: 30 },
    ],
    calculate: (p) => {
      const { H, B, tw, tf } = p;
      const hw = H - 2 * tf;
      const A = 2 * B * tf + hw * tw;
      // 形心x位置
      const A1 = B * tf;
      const A2 = hw * tw;
      const x1 = B / 2;
      const x2 = tw / 2;
      const xc = (2 * A1 * x1 + A2 * x2) / A;
      const Ix = (tw * Math.pow(hw, 3)) / 12 + 2 * ((B * Math.pow(tf, 3)) / 12 + A1 * Math.pow((H - tf) / 2, 2));
      const Iy = 2 * ((tf * Math.pow(B, 3)) / 12 + A1 * Math.pow(x1 - xc, 2)) +
                 (hw * Math.pow(tw, 3)) / 12 + A2 * Math.pow(x2 - xc, 2);
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const Wx = Ix / (H / 2);
      const Wy = Iy / Math.max(xc, B - xc);
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: H / 2, xmax: Math.max(xc, B - xc) };
    },
  },
  angle: {
    name: "等边角钢",
    description: "等边角钢截面，边长L，厚度t",
    params: [
      { key: "L", label: "边长 L", unit: "mm", default: 80, min: 20, max: 200 },
      { key: "t", label: "厚度 t", unit: "mm", default: 8, min: 3, max: 20 },
    ],
    calculate: (p) => {
      const { L, t } = p;
      const A = t * (2 * L - t);
      // 形心位置
      const A1 = L * t;
      const A2 = (L - t) * t;
      const y1 = t / 2;
      const y2 = t + (L - t) / 2;
      const yc = (A1 * y1 + A2 * y2) / A;
      const xc = yc; // 等边角钢对称
      // 对形心轴惯性矩（近似）
      const Ix = (L * Math.pow(t, 3)) / 12 + A1 * Math.pow(y1 - yc, 2) +
                 (t * Math.pow(L - t, 3)) / 12 + A2 * Math.pow(y2 - yc, 2);
      const Iy = Ix;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = ix;
      const ymax = Math.max(yc, L - yc);
      const Wx = Ix / ymax;
      const Wy = Wx;
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax, xmax: ymax };
    },
  },
  "unequal-angle": {
    name: "不等边角钢",
    description: "不等边角钢截面，长边B，短边b，厚度t",
    params: [
      { key: "B", label: "长边 B", unit: "mm", default: 100, min: 30, max: 250 },
      { key: "b", label: "短边 b", unit: "mm", default: 63, min: 20, max: 200 },
      { key: "t", label: "厚度 t", unit: "mm", default: 8, min: 3, max: 20 },
    ],
    calculate: (p) => {
      const { B, b, t } = p;
      const A1 = B * t;
      const A2 = (b - t) * t;
      const A = A1 + A2;
      const x1 = B / 2;
      const y1 = t / 2;
      const x2 = t / 2;
      const y2 = t + (b - t) / 2;
      const xc = (A1 * x1 + A2 * x2) / A;
      const yc = (A1 * y1 + A2 * y2) / A;
      const Ix = (B * Math.pow(t, 3)) / 12 + A1 * Math.pow(y1 - yc, 2) +
                 (t * Math.pow(b - t, 3)) / 12 + A2 * Math.pow(y2 - yc, 2);
      const Iy = (t * Math.pow(B, 3)) / 12 + A1 * Math.pow(x1 - xc, 2) +
                 ((b - t) * Math.pow(t, 3)) / 12 + A2 * Math.pow(x2 - xc, 2);
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const ymax = Math.max(yc, b - yc);
      const xmax = Math.max(xc, B - xc);
      const Wx = Ix / ymax;
      const Wy = Iy / xmax;
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax, xmax };
    },
  },
  "double-channel": {
    name: "双槽钢组合",
    description: "两个槽钢背靠背组合，总高H，翼缘宽B，腹板厚tw，翼缘厚tf，间距δ",
    params: [
      { key: "H", label: "总高 H", unit: "mm", default: 160, min: 50, max: 400 },
      { key: "B", label: "翼缘宽 B", unit: "mm", default: 65, min: 20, max: 200 },
      { key: "tw", label: "腹板厚 tw", unit: "mm", default: 8, min: 4, max: 20 },
      { key: "tf", label: "翼缘厚 tf", unit: "mm", default: 10, min: 4, max: 30 },
      { key: "delta", label: "间距 δ", unit: "mm", default: 10, min: 0, max: 100 },
    ],
    calculate: (p) => {
      const { H, B, tw, tf, delta } = p;
      const hw = H - 2 * tf;
      // 单个槽钢面积
      const A_single = 2 * B * tf + hw * tw;
      const A = 2 * A_single;
      // 单个槽钢对自身形心的Ix
      const Ix_single = (tw * Math.pow(hw, 3)) / 12 + 2 * ((B * Math.pow(tf, 3)) / 12 + B * tf * Math.pow((H - tf) / 2, 2));
      const Ix = 2 * Ix_single;
      // 单个槽钢对y轴的惯性矩，需要平移
      const A1 = B * tf;
      const A2 = hw * tw;
      const x1 = B / 2;
      const x2 = tw / 2;
      const xc_single = (2 * A1 * x1 + A2 * x2) / A_single;
      const Iy_single = 2 * ((tf * Math.pow(B, 3)) / 12 + A1 * Math.pow(x1 - xc_single, 2)) +
                        (hw * Math.pow(tw, 3)) / 12 + A2 * Math.pow(x2 - xc_single, 2);
      // 双槽钢组合，各槽钢形心到组合形心的距离
      const d = (delta / 2) + (B - xc_single);
      const Iy = 2 * (Iy_single + A_single * d * d);
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const Wx = Ix / (H / 2);
      const totalWidth = 2 * B + delta;
      const Wy = Iy / (totalWidth / 2);
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax: H / 2, xmax: totalWidth / 2 };
    },
  },
  "composite-rect": {
    name: "组合矩形",
    description: "两个矩形上下组合，上部宽度b1、高度h1，下部宽度b2、高度h2",
    params: [
      { key: "b1", label: "上部宽 b1", unit: "mm", default: 120, min: 10, max: 300 },
      { key: "h1", label: "上部高 h1", unit: "mm", default: 20, min: 5, max: 100 },
      { key: "b2", label: "下部宽 b2", unit: "mm", default: 40, min: 10, max: 300 },
      { key: "h2", label: "下部高 h2", unit: "mm", default: 100, min: 10, max: 300 },
    ],
    calculate: (p) => {
      const { b1, h1, b2, h2 } = p;
      const A1 = b1 * h1;
      const A2 = b2 * h2;
      const A = A1 + A2;
      const H = h1 + h2;
      // 形心位置（从底部算起）
      const y1 = h2 + h1 / 2;
      const y2 = h2 / 2;
      const yc = (A1 * y1 + A2 * y2) / A;
      // 平行轴定理
      const Ix = (b1 * Math.pow(h1, 3)) / 12 + A1 * Math.pow(y1 - yc, 2) +
                 (b2 * Math.pow(h2, 3)) / 12 + A2 * Math.pow(y2 - yc, 2);
      const Iy = (h1 * Math.pow(b1, 3)) / 12 + (h2 * Math.pow(b2, 3)) / 12;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const ymax = Math.max(yc, H - yc);
      const xmax = Math.max(b1, b2) / 2;
      const Wx = Ix / ymax;
      const Wy = Iy / xmax;
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax, xmax };
    },
  },
  "custom": {
    name: "自定义截面",
    description: "直接输入截面特性参数：面积A、惯性矩Ix、Iy、最大距离ymax、xmax",
    params: [
      { key: "A", label: "面积 A", unit: "mm²", default: 5000, min: 100, max: 100000 },
      { key: "Ix", label: "惯性矩 Ix", unit: "mm⁴", default: 5000000, min: 1000, max: 1e9 },
      { key: "Iy", label: "惯性矩 Iy", unit: "mm⁴", default: 2000000, min: 1000, max: 1e9 },
      { key: "ymax", label: "最大距离 ymax", unit: "mm", default: 75, min: 5, max: 500 },
      { key: "xmax", label: "最大距离 xmax", unit: "mm", default: 50, min: 5, max: 500 },
    ],
    calculate: (p) => {
      const { A, Ix, Iy, ymax, xmax } = p;
      const Ip = Ix + Iy;
      const ix = Math.sqrt(Ix / A);
      const iy = Math.sqrt(Iy / A);
      const Wx = Ix / ymax;
      const Wy = Iy / xmax;
      return { A, Ix, Iy, Ip, ix, iy, Wx, Wy, ymax, xmax };
    },
  },
  "draw": {
    name: "绘制截面",
    description: "通过顶点绘制任意多边形截面轮廓，支持内孔，自动计算截面特性",
    params: [],
    calculate: () => ({ A: 0, Ix: 0, Iy: 0, Ip: 0, ix: 0, iy: 0, Wx: 0, Wy: 0, ymax: 0, xmax: 0 }),
  },
};

// ============ 自定义截面绘制器（顶点绘制模式） ============

// 顶点接口
export interface Vertex {
  x: number;  // mm
  y: number;  // mm
}

// 多边形轮廓接口
export interface PolygonPath {
  id: string;
  vertices: Vertex[];
  isHole: boolean;  // 是否为内孔
  isClosed: boolean; // 是否闭合
}

// 使用鞋带公式计算多边形面积（带符号）
export const calculatePolygonArea = (vertices: Vertex[]): number => {
  if (vertices.length < 3) return 0;
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
};

// 计算多边形形心
export const calculatePolygonCentroid = (vertices: Vertex[]): { cx: number; cy: number } => {
  if (vertices.length < 3) return { cx: 0, cy: 0 };
  let cx = 0, cy = 0;
  let signedArea = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    signedArea += a;
    cx += (vertices[i].x + vertices[j].x) * a;
    cy += (vertices[i].y + vertices[j].y) * a;
  }

  signedArea /= 2;
  if (Math.abs(signedArea) < 1e-10) return { cx: 0, cy: 0 };
  cx /= (6 * signedArea);
  cy /= (6 * signedArea);

  return { cx, cy };
};

// 计算多边形对形心轴的惯性矩
export const calculatePolygonInertia = (vertices: Vertex[]): { Ix: number; Iy: number } => {
  if (vertices.length < 3) return { Ix: 0, Iy: 0 };

  const { cx, cy } = calculatePolygonCentroid(vertices);
  // 将顶点平移到形心坐标系
  const shifted = vertices.map(v => ({ x: v.x - cx, y: v.y - cy }));

  let Ix = 0, Iy = 0;
  const n = shifted.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = shifted[i].x, yi = shifted[i].y;
    const xj = shifted[j].x, yj = shifted[j].y;
    const cross = xi * yj - xj * yi;

    Ix += (yi * yi + yi * yj + yj * yj) * cross;
    Iy += (xi * xi + xi * xj + xj * xj) * cross;
  }

  Ix = Math.abs(Ix) / 12;
  Iy = Math.abs(Iy) / 12;

  return { Ix, Iy };
};

// 计算多边形截面的完整属性
export const calculatePolygonSection = (paths: PolygonPath[]): SectionToolResult => {
  const closedPaths = paths.filter(p => p.isClosed && p.vertices.length >= 3);
  if (closedPaths.length === 0) {
    return { A: 0, Ix: 0, Iy: 0, Ip: 0, ix: 0, iy: 0, Wx: 0, Wy: 0, ymax: 0, xmax: 0 };
  }

  // 计算总面积和形心
  let totalA = 0;
  let sumAx = 0, sumAy = 0;

  closedPaths.forEach(path => {
    const A = calculatePolygonArea(path.vertices);
    const { cx, cy } = calculatePolygonCentroid(path.vertices);
    const sign = path.isHole ? -1 : 1;
    totalA += sign * A;
    sumAx += sign * A * cx;
    sumAy += sign * A * cy;
  });

  if (totalA <= 0) {
    return { A: 0, Ix: 0, Iy: 0, Ip: 0, ix: 0, iy: 0, Wx: 0, Wy: 0, ymax: 0, xmax: 0 };
  }

  const xc_total = sumAx / totalA;
  const yc_total = sumAy / totalA;

  // 用平行轴定理计算总惯性矩
  let Ix_total = 0, Iy_total = 0;

  closedPaths.forEach(path => {
    const A = calculatePolygonArea(path.vertices);
    const { cx, cy } = calculatePolygonCentroid(path.vertices);
    const { Ix, Iy } = calculatePolygonInertia(path.vertices);
    const sign = path.isHole ? -1 : 1;
    const dx = cx - xc_total;
    const dy = cy - yc_total;
    Ix_total += sign * (Ix + A * dy * dy);
    Iy_total += sign * (Iy + A * dx * dx);
  });

  // 计算边界
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  closedPaths.filter(p => !p.isHole).forEach(path => {
    path.vertices.forEach(v => {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    });
  });

  const ymax = Math.max(Math.abs(maxY - yc_total), Math.abs(yc_total - minY));
  const xmax = Math.max(Math.abs(maxX - xc_total), Math.abs(xc_total - minX));

  const Ip = Ix_total + Iy_total;
  const ix = Math.sqrt(Ix_total / totalA);
  const iy = Math.sqrt(Iy_total / totalA);
  const Wx = ymax > 0 ? Ix_total / ymax : 0;
  const Wy = xmax > 0 ? Iy_total / xmax : 0;

  return { A: totalA, Ix: Ix_total, Iy: Iy_total, Ip, ix, iy, Wx, Wy, ymax, xmax };
};
