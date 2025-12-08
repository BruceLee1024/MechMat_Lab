import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Circle,
  Square,
  RectangleHorizontal,
  Hexagon,
  Triangle,
  Minus,
  Plus,
  Info,
  Calculator,
  RotateCcw,
  FileText,
  ChevronRight,
  X,
  Save,
  Trash2,
  Edit3,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Crosshair,
  RotateCcw as ResetIcon,
} from "lucide-react";

// 截面类型
type SectionType = "rectangle" | "circle" | "hollow-circle" | "i-beam" | "t-beam" | "channel" | "angle" | "unequal-angle" | "hollow-rectangle" | "double-channel" | "composite-rect" | "custom" | "draw";

interface SectionParams {
  [key: string]: number;
}

interface SectionResult {
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
const SECTION_CONFIGS: Record<SectionType, {
  name: string;
  icon: React.ElementType;
  params: { key: string; label: string; unit: string; default: number; min: number; max: number }[];
  calculate: (p: SectionParams) => SectionResult;
  description: string;
}> = {
  rectangle: {
    name: "矩形截面",
    icon: RectangleHorizontal,
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
    icon: Circle,
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
    icon: Circle,
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
    icon: Square,
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
    icon: Hexagon,
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
    icon: Minus,
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
    icon: Square,
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
    icon: Triangle,
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
    icon: Triangle,
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
    icon: Square,
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
    icon: Square,
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
    icon: Square,
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
    icon: Hexagon,
    description: "通过顶点绘制任意多边形截面轮廓，支持内孔，自动计算截面特性",
    params: [],
    calculate: () => ({ A: 0, Ix: 0, Iy: 0, Ip: 0, ix: 0, iy: 0, Wx: 0, Wy: 0, ymax: 0, xmax: 0 }),
  },
};

// ============ 自定义截面绘制器（顶点绘制模式） ============

// 顶点接口
interface Vertex {
  x: number;  // mm
  y: number;  // mm
}

// 多边形轮廓接口
interface PolygonPath {
  id: string;
  vertices: Vertex[];
  isHole: boolean;  // 是否为内孔
  isClosed: boolean; // 是否闭合
}

// 使用鞋带公式计算多边形面积（带符号）
const calculatePolygonArea = (vertices: Vertex[]): number => {
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
const calculatePolygonCentroid = (vertices: Vertex[]): { cx: number; cy: number } => {
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
const calculatePolygonInertia = (vertices: Vertex[]): { Ix: number; Iy: number } => {
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
const calculatePolygonSection = (paths: PolygonPath[]): SectionResult => {
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

// 截面绘制编辑器组件（表单输入模式，类似求解器）
const SectionDrawEditor: React.FC<{
  paths: PolygonPath[];
  setPaths: React.Dispatch<React.SetStateAction<PolygonPath[]>>;
  selectedPathId: string | null;
  setSelectedPathId: (id: string | null) => void;
  selectedVertexIdx: number | null;
  setSelectedVertexIdx: (idx: number | null) => void;
}> = ({ paths, setPaths, selectedPathId, setSelectedPathId, selectedVertexIdx, setSelectedVertexIdx }) => {
  // 添加顶点的输入状态
  const [newX, setNewX] = useState(0);
  const [newY, setNewY] = useState(0);
  const [isHoleMode, setIsHoleMode] = useState(false);
  
  const svgWidth = 400;
  const svgHeight = 300;
  const scale = 2.5;
  const originX = svgWidth / 2;
  const originY = svgHeight / 2;

  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;

  // 新建轮廓
  const createPath = () => {
    const newPath: PolygonPath = {
      id: `path_${Date.now()}`,
      vertices: [],
      isHole: isHoleMode,
      isClosed: false,
    };
    setPaths(prev => [...prev, newPath]);
    setSelectedPathId(newPath.id);
    setSelectedVertexIdx(null);
  };

  // 添加顶点到当前轮廓
  const addVertex = () => {
    if (!selectedPathId) {
      // 如果没有选中轮廓，先创建一个
      const newPath: PolygonPath = {
        id: `path_${Date.now()}`,
        vertices: [{ x: newX, y: newY }],
        isHole: isHoleMode,
        isClosed: false,
      };
      setPaths(prev => [...prev, newPath]);
      setSelectedPathId(newPath.id);
    } else {
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId && !p.isClosed) {
          return { ...p, vertices: [...p.vertices, { x: newX, y: newY }] };
        }
        return p;
      }));
    }
  };

  // 闭合轮廓
  const closePath = () => {
    if (!selectedPathId) return;
    setPaths(prev => prev.map(p => {
      if (p.id === selectedPathId && p.vertices.length >= 3) {
        return { ...p, isClosed: true };
      }
      return p;
    }));
  };

  // 删除轮廓
  const deletePath = (id: string) => {
    setPaths(prev => prev.filter(p => p.id !== id));
    if (selectedPathId === id) {
      setSelectedPathId(null);
      setSelectedVertexIdx(null);
    }
  };

  // 删除顶点
  const deleteVertex = (pathId: string, idx: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = p.vertices.filter((_, i) => i !== idx);
        return { ...p, vertices: newVertices, isClosed: newVertices.length >= 3 ? p.isClosed : false };
      }
      return p;
    }));
    setSelectedVertexIdx(null);
  };

  // 更新顶点
  const updateVertex = (pathId: string, idx: number, x: number, y: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = [...p.vertices];
        newVertices[idx] = { x, y };
        return { ...p, vertices: newVertices };
      }
      return p;
    }));
  };

  // 切换内孔
  const toggleHole = (id: string) => {
    setPaths(prev => prev.map(p => p.id === id ? { ...p, isHole: !p.isHole } : p));
  };

  const selectedPath = paths.find(p => p.id === selectedPathId);
  const sectionResult = calculatePolygonSection(paths);
  
  // 计算形心
  let centroidX = 0, centroidY = 0;
  if (sectionResult.A > 0) {
    const closedPaths = paths.filter(p => p.isClosed && p.vertices.length >= 3);
    let sumAx = 0, sumAy = 0, totalA = 0;
    closedPaths.forEach(path => {
      const A = calculatePolygonArea(path.vertices);
      const { cx, cy } = calculatePolygonCentroid(path.vertices);
      const sign = path.isHole ? -1 : 1;
      totalA += sign * A;
      sumAx += sign * A * cx;
      sumAy += sign * A * cy;
    });
    if (totalA > 0) {
      centroidX = sumAx / totalA;
      centroidY = sumAy / totalA;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 左侧：输入面板 */}
      <div className="space-y-3">
        {/* 添加顶点 */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1 text-xs">
            <Circle className="w-3 h-3" /> 添加顶点
          </h4>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] text-slate-500">X (mm)</label>
              <input
                type="number"
                value={newX}
                onChange={(e) => setNewX(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">Y (mm)</label>
              <input
                type="number"
                value={newY}
                onChange={(e) => setNewY(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addVertex}
              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
            >
              添加顶点
            </button>
            <button
              onClick={closePath}
              disabled={!selectedPath || selectedPath.vertices.length < 3 || selectedPath.isClosed}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              闭合
            </button>
          </div>
        </div>

        {/* 轮廓管理 */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-1 text-xs">
            <Hexagon className="w-3 h-3" /> 轮廓管理
          </h4>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isHoleMode}
                onChange={(e) => setIsHoleMode(e.target.checked)}
                className="rounded w-3 h-3"
              />
              <span className="text-slate-600">内孔模式</span>
            </label>
          </div>
          <button
            onClick={createPath}
            className="w-full px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300"
          >
            + 新建轮廓
          </button>
        </div>

        {/* 轮廓列表 */}
        <div className="bg-slate-50 p-3 rounded-lg border max-h-40 overflow-y-auto">
          <h4 className="font-semibold text-slate-700 mb-2 text-xs">轮廓列表 ({paths.length})</h4>
          {paths.length === 0 ? (
            <div className="text-center py-2 text-slate-400 text-xs">暂无轮廓</div>
          ) : (
            <div className="space-y-1">
              {paths.map((path, idx) => (
                <div 
                  key={path.id}
                  onClick={() => { setSelectedPathId(path.id); setSelectedVertexIdx(null); }}
                  className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                    path.id === selectedPathId ? 'bg-indigo-100 border border-indigo-300' : 'hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      轮廓 {idx + 1}
                      {path.isHole && <span className="text-red-500 ml-1">[孔]</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      {path.isClosed && (
                        <span className="text-green-600 text-[10px]">{calculatePolygonArea(path.vertices).toFixed(0)}mm²</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleHole(path.id); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${path.isHole ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {path.isHole ? '孔' : '实'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePath(path.id); }}
                        className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] hover:bg-red-200"
                      >
                        删
                      </button>
                    </div>
                  </div>
                  {!path.isClosed && <span className="text-amber-500 text-[10px]">[未闭合]</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 顶点列表 */}
        {selectedPath && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 max-h-32 overflow-y-auto">
            <h4 className="font-semibold text-amber-800 mb-2 text-xs">
              顶点列表 - 轮廓 {paths.findIndex(p => p.id === selectedPathId) + 1}
            </h4>
            <div className="space-y-1">
              {selectedPath.vertices.map((v, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 p-1 rounded text-xs ${
                    selectedVertexIdx === idx ? 'bg-amber-200' : 'hover:bg-amber-100'
                  }`}
                >
                  <span className="w-6 text-amber-700 font-medium">P{idx + 1}</span>
                  <input
                    type="number"
                    value={v.x}
                    onChange={(e) => updateVertex(selectedPath.id, idx, parseFloat(e.target.value) || 0, v.y)}
                    className="w-16 px-1 py-0.5 border rounded text-[10px]"
                    onClick={() => setSelectedVertexIdx(idx)}
                  />
                  <input
                    type="number"
                    value={v.y}
                    onChange={(e) => updateVertex(selectedPath.id, idx, v.x, parseFloat(e.target.value) || 0)}
                    className="w-16 px-1 py-0.5 border rounded text-[10px]"
                    onClick={() => setSelectedVertexIdx(idx)}
                  />
                  <button
                    onClick={() => deleteVertex(selectedPath.id, idx)}
                    className="px-1 py-0.5 rounded bg-red-100 text-red-600 text-[10px] hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 右侧：预览 */}
      <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
        <svg width={svgWidth} height={svgHeight} className="w-full">
          {/* 网格 */}
          <defs>
            <pattern id="drawGrid2" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#drawGrid2)" />
          
          {/* 坐标轴 */}
          <line x1="0" y1={originY} x2={svgWidth} y2={originY} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={originX} y1="0" x2={originX} y2={svgHeight} stroke="#cbd5e1" strokeWidth="1" />
          <text x={svgWidth - 15} y={originY - 5} fill="#94a3b8" fontSize="10">x</text>
          <text x={originX + 5} y="12" fill="#94a3b8" fontSize="10">y</text>
          
          {/* 刻度 */}
          {[-60, -40, -20, 20, 40, 60].map(v => (
            <g key={`tick-${v}`}>
              <line x1={toSvgX(v)} y1={originY - 2} x2={toSvgX(v)} y2={originY + 2} stroke="#94a3b8" strokeWidth="1" />
              <text x={toSvgX(v)} y={originY + 12} fill="#94a3b8" fontSize="8" textAnchor="middle">{v}</text>
              <line x1={originX - 2} y1={toSvgY(v)} x2={originX + 2} y2={toSvgY(v)} stroke="#94a3b8" strokeWidth="1" />
              <text x={originX - 8} y={toSvgY(v) + 3} fill="#94a3b8" fontSize="8" textAnchor="end">{v}</text>
            </g>
          ))}

          {/* 绘制轮廓 */}
          {paths.map(path => {
            const isSelected = path.id === selectedPathId;
            const fillColor = path.isHole ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.25)';
            const strokeColor = path.isHole ? '#ef4444' : '#6366f1';
            const points = path.vertices.map(v => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ');
            
            return (
              <g key={path.id}>
                {path.isClosed && path.vertices.length >= 3 && (
                  <polygon
                    points={points}
                    fill={fillColor}
                    stroke={isSelected ? '#f59e0b' : strokeColor}
                    strokeWidth={isSelected ? 2.5 : 2}
                    strokeDasharray={path.isHole ? '5,3' : 'none'}
                  />
                )}
                {!path.isClosed && path.vertices.length >= 2 && (
                  <polyline points={points} fill="none" stroke={isSelected ? '#f59e0b' : strokeColor} strokeWidth={2} />
                )}
                {path.vertices.map((v, idx) => (
                  <g key={idx}>
                    <circle
                      cx={toSvgX(v.x)}
                      cy={toSvgY(v.y)}
                      r={isSelected && selectedVertexIdx === idx ? 6 : 4}
                      fill={isSelected && selectedVertexIdx === idx ? '#f59e0b' : (path.isHole ? '#ef4444' : '#6366f1')}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    {isSelected && (
                      <text x={toSvgX(v.x) + 6} y={toSvgY(v.y) - 6} fill="#64748b" fontSize="8">P{idx + 1}</text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}

          {/* 形心 */}
          {sectionResult.A > 0 && (
            <g>
              <circle cx={toSvgX(centroidX)} cy={toSvgY(centroidY)} r="5" fill="#10b981" stroke="white" strokeWidth="1.5" />
              <text x={toSvgX(centroidX) + 8} y={toSvgY(centroidY) - 5} fill="#10b981" fontSize="9" fontWeight="bold">C</text>
            </g>
          )}

          {/* 当前输入点预览 */}
          <circle cx={toSvgX(newX)} cy={toSvgY(newY)} r="4" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
        </svg>
      </div>
    </div>
  );
};

// 截面绘制模态对话框（CAD风格）
type DrawTool = 'select' | 'draw' | 'pan';

const SectionDrawModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (paths: PolygonPath[], result: SectionResult) => void;
  initialPaths?: PolygonPath[];
}> = ({ isOpen, onClose, onSave, initialPaths = [] }) => {
  const [paths, setPaths] = useState<PolygonPath[]>(initialPaths);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);
  const [newX, setNewX] = useState(0);
  const [newY, setNewY] = useState(0);
  const [isHoleMode, setIsHoleMode] = useState(false);
  
  // CAD 功能状态
  const [tool, setTool] = useState<DrawTool>('draw');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // 当前鼠标位置（mm坐标）
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10); // 网格大小 mm
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用固定的 viewBox 尺寸，实际显示会自适应容器
  const svgWidth = 2000;
  const svgHeight = 1500;
  const baseScale = 2.5; // 基础缩放：1mm = 2.5px（在 zoom=1 时）
  const scale = baseScale * zoom;
  const originX = svgWidth / 2 + panOffset.x;
  const originY = svgHeight / 2 + panOffset.y;

  // 坐标转换
  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;
  const toMmX = (svgX: number) => (svgX - originX) / scale;
  const toMmY = (svgY: number) => (originY - svgY) / scale;
  
  // 吸附到网格
  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return Math.round(value * 10) / 10;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // 获取鼠标在SVG中的坐标（使用 SVG 原生坐标转换，更精确）
  const getMouseCoords = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // 使用 SVG 的 getScreenCTM 进行精确坐标转换
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    
    const svgPoint = pt.matrixTransform(ctm.inverse());
    
    // 转换为 mm 坐标
    const mmX = (svgPoint.x - originX) / scale;
    const mmY = (originY - svgPoint.y) / scale;
    
    return {
      x: snapToGridValue(mmX),
      y: snapToGridValue(mmY)
    };
  }, [originX, originY, scale, snapToGridValue]);

  // 计算结果
  const sectionResult = calculatePolygonSection(paths);
  
  // 计算形心
  let centroidX = 0, centroidY = 0;
  if (sectionResult.A > 0) {
    const closedPaths = paths.filter(p => p.isClosed && p.vertices.length >= 3);
    let sumAx = 0, sumAy = 0, totalA = 0;
    closedPaths.forEach(path => {
      const A = calculatePolygonArea(path.vertices);
      const { cx, cy } = calculatePolygonCentroid(path.vertices);
      const sign = path.isHole ? -1 : 1;
      totalA += sign * A;
      sumAx += sign * A * cx;
      sumAy += sign * A * cy;
    });
    if (totalA > 0) {
      centroidX = sumAx / totalA;
      centroidY = sumAy / totalA;
    }
  }

  // 缩放（支持以鼠标位置为中心缩放）
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setZoom(prev => {
      const newZoom = Math.max(0.1, Math.min(10, prev + delta));
      return newZoom;
    });
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 根据滚轮方向和速度计算缩放增量
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    handleZoom(delta);
  }, [handleZoom]);

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'pan' || e.button === 1) { // 中键平移
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }
  };

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // 平移优先处理
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }
    
    const coords = getMouseCoords(e);
    // 只有坐标变化时才更新状态
    setMousePos(prev => {
      if (prev.x === coords.x && prev.y === coords.y) return prev;
      return coords;
    });
    setNewX(coords.x);
    setNewY(coords.y);
  }, [isPanning, panStart, getMouseCoords]);

  // 鼠标松开
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // 点击画布
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool !== 'draw' || isPanning) return;
    
    const coords = getMouseCoords(e);
    
    // 查找当前未闭合的轮廓
    const currentPath = paths.find(p => p.id === selectedPathId && !p.isClosed);
    
    if (!currentPath) {
      // 创建新轮廓
      const newPath: PolygonPath = {
        id: `path_${Date.now()}`,
        vertices: [{ x: coords.x, y: coords.y }],
        isHole: isHoleMode,
        isClosed: false,
      };
      setPaths(prev => [...prev, newPath]);
      setSelectedPathId(newPath.id);
    } else {
      // 添加顶点到当前轮廓
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId && !p.isClosed) {
          return { ...p, vertices: [...p.vertices, { x: coords.x, y: coords.y }] };
        }
        return p;
      }));
    }
  };

  // 双击闭合轮廓
  const handleDoubleClick = () => {
    if (tool !== 'draw') return;
    const currentPath = paths.find(p => p.id === selectedPathId && !p.isClosed);
    if (currentPath && currentPath.vertices.length >= 3) {
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId) {
          return { ...p, isClosed: true };
        }
        return p;
      }));
    }
  };

  // 新建轮廓
  const createPath = () => {
    const newPath: PolygonPath = {
      id: `path_${Date.now()}`,
      vertices: [],
      isHole: isHoleMode,
      isClosed: false,
    };
    setPaths(prev => [...prev, newPath]);
    setSelectedPathId(newPath.id);
    setSelectedVertexIdx(null);
    setTool('draw');
  };

  // 添加顶点（通过输入框）
  const addVertex = () => {
    if (!selectedPathId) {
      const newPath: PolygonPath = {
        id: `path_${Date.now()}`,
        vertices: [{ x: newX, y: newY }],
        isHole: isHoleMode,
        isClosed: false,
      };
      setPaths(prev => [...prev, newPath]);
      setSelectedPathId(newPath.id);
    } else {
      setPaths(prev => prev.map(p => {
        if (p.id === selectedPathId && !p.isClosed) {
          return { ...p, vertices: [...p.vertices, { x: newX, y: newY }] };
        }
        return p;
      }));
    }
  };

  // 闭合轮廓
  const closePath = () => {
    if (!selectedPathId) return;
    setPaths(prev => prev.map(p => {
      if (p.id === selectedPathId && p.vertices.length >= 3) {
        return { ...p, isClosed: true };
      }
      return p;
    }));
  };

  // 删除轮廓
  const deletePath = (id: string) => {
    setPaths(prev => prev.filter(p => p.id !== id));
    if (selectedPathId === id) {
      setSelectedPathId(null);
      setSelectedVertexIdx(null);
    }
  };

  // 删除顶点
  const deleteVertex = (pathId: string, idx: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = p.vertices.filter((_, i) => i !== idx);
        return { ...p, vertices: newVertices, isClosed: newVertices.length >= 3 ? p.isClosed : false };
      }
      return p;
    }));
    setSelectedVertexIdx(null);
  };

  // 更新顶点
  const updateVertex = (pathId: string, idx: number, x: number, y: number) => {
    setPaths(prev => prev.map(p => {
      if (p.id === pathId) {
        const newVertices = [...p.vertices];
        newVertices[idx] = { x, y };
        return { ...p, vertices: newVertices };
      }
      return p;
    }));
  };

  // 切换内孔
  const toggleHole = (id: string) => {
    setPaths(prev => prev.map(p => p.id === id ? { ...p, isHole: !p.isHole } : p));
  };

  // 清空所有
  const clearAll = () => {
    setPaths([]);
    setSelectedPathId(null);
    setSelectedVertexIdx(null);
  };

  // 保存并关闭
  const handleSave = () => {
    onSave(paths, sectionResult);
    onClose();
  };

  // ESC 键取消当前绘制
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // 如果有未闭合的轮廓，删除它
      const currentPath = paths.find(p => p.id === selectedPathId && !p.isClosed);
      if (currentPath) {
        setPaths(prev => prev.filter(p => p.id !== selectedPathId));
        setSelectedPathId(null);
      }
    } else if (e.key === 'Enter') {
      // 回车闭合轮廓
      closePath();
    }
  }, [paths, selectedPathId]);

  // 键盘事件监听
  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const selectedPath = paths.find(p => p.id === selectedPathId);
  const currentDrawingPath = paths.find(p => p.id === selectedPathId && !p.isClosed);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 shadow-lg">
        <div className="flex items-center gap-3">
          <Hexagon className="w-6 h-6 text-white" />
          <h2 className="text-lg font-bold text-white">截面绘制器</h2>
          <span className="text-white/60 text-sm hidden md:inline">CAD风格绘制 · 支持缩放平移 · 网格吸附</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> 清空
          </button>
          <button
            onClick={handleSave}
            disabled={sectionResult.A <= 0}
            className="px-4 py-1.5 rounded-lg bg-white text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> 保存并使用
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="关闭 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 */}
        <div className="w-64 border-r border-slate-700 bg-slate-800 p-3 overflow-y-auto space-y-3">
          {/* 添加顶点 */}
          <div className="bg-slate-700 p-3 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2 text-sm">
              <Circle className="w-3.5 h-3.5 text-indigo-400" /> 添加顶点
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">X (mm)</label>
                <input
                  type="number"
                  value={newX}
                  onChange={(e) => setNewX(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Y (mm)</label>
                <input
                  type="number"
                  value={newY}
                  onChange={(e) => setNewY(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addVertex}
                className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
              >
                添加
              </button>
              <button
                onClick={closePath}
                disabled={!selectedPath || selectedPath.vertices.length < 3 || selectedPath.isClosed}
                className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                闭合
              </button>
            </div>
          </div>

          {/* 轮廓管理 */}
          <div className="bg-slate-700 p-3 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2 text-sm">
              <Hexagon className="w-3.5 h-3.5 text-indigo-400" /> 轮廓管理
            </h4>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={isHoleMode}
                onChange={(e) => setIsHoleMode(e.target.checked)}
                className="rounded text-indigo-500 bg-slate-600 border-slate-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-300">内孔模式</span>
            </label>
            <button
              onClick={createPath}
              className="w-full px-3 py-1.5 bg-slate-600 text-slate-200 rounded text-xs font-medium hover:bg-slate-500 transition-colors"
            >
              + 新建轮廓
            </button>
          </div>

          {/* 轮廓列表 */}
          <div className="bg-slate-700 p-3 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-2 text-sm">轮廓 ({paths.length})</h4>
            {paths.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                点击画布或输入坐标添加顶点
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {paths.map((path, idx) => (
                  <div 
                    key={path.id}
                    onClick={() => { setSelectedPathId(path.id); setSelectedVertexIdx(null); }}
                    className={`p-2 rounded cursor-pointer transition-all ${
                      path.id === selectedPathId 
                        ? 'bg-indigo-600/30 border border-indigo-500' 
                        : 'bg-slate-600 hover:bg-slate-500 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-slate-200">
                        轮廓 {idx + 1}
                        {path.isHole && <span className="text-red-400 ml-1">[孔]</span>}
                      </span>
                      <div className="flex items-center gap-1">
                        {path.isClosed && (
                          <span className="text-green-400 text-[10px]">
                            {calculatePolygonArea(path.vertices).toFixed(0)}mm²
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleHole(path.id); }}
                          className={`px-1.5 py-0.5 rounded text-[10px] ${path.isHole ? 'bg-red-500/30 text-red-300' : 'bg-slate-500 text-slate-300'}`}
                        >
                          {path.isHole ? '孔' : '实'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePath(path.id); }}
                          className="p-0.5 rounded bg-red-500/30 text-red-300 hover:bg-red-500/50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {path.vertices.length} 点
                      {!path.isClosed && <span className="text-amber-400 ml-1">[未闭合]</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 顶点列表 */}
          {selectedPath && (
            <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-700/50">
              <h4 className="font-semibold text-amber-300 mb-2 flex items-center gap-2 text-sm">
                <Edit3 className="w-3.5 h-3.5" /> 顶点编辑
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selectedPath.vertices.map((v, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-1.5 p-1.5 rounded ${
                      selectedVertexIdx === idx ? 'bg-amber-600/30' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <span className="w-6 text-amber-400 font-medium text-xs">P{idx + 1}</span>
                    <input
                      type="number"
                      value={v.x}
                      onChange={(e) => updateVertex(selectedPath.id, idx, parseFloat(e.target.value) || 0, v.y)}
                      className="w-14 px-1.5 py-0.5 bg-slate-600 border border-slate-500 rounded text-xs text-white"
                      onClick={() => setSelectedVertexIdx(idx)}
                    />
                    <input
                      type="number"
                      value={v.y}
                      onChange={(e) => updateVertex(selectedPath.id, idx, v.x, parseFloat(e.target.value) || 0)}
                      className="w-14 px-1.5 py-0.5 bg-slate-600 border border-slate-500 rounded text-xs text-white"
                      onClick={() => setSelectedVertexIdx(idx)}
                    />
                    <button
                      onClick={() => deleteVertex(selectedPath.id, idx)}
                      className="p-0.5 rounded bg-red-500/30 text-red-300 hover:bg-red-500/50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 计算结果摘要 */}
          {sectionResult.A > 0 && (
            <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/50">
              <h4 className="font-semibold text-green-300 mb-2 text-sm">计算结果</h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-slate-700 p-1.5 rounded">
                  <div className="text-slate-400 text-[10px]">面积 A</div>
                  <div className="text-green-400 font-mono">{sectionResult.A.toFixed(1)}</div>
                </div>
                <div className="bg-slate-700 p-1.5 rounded">
                  <div className="text-slate-400 text-[10px]">Ix</div>
                  <div className="text-green-400 font-mono">{sectionResult.Ix.toFixed(0)}</div>
                </div>
                <div className="bg-slate-700 p-1.5 rounded">
                  <div className="text-slate-400 text-[10px]">Iy</div>
                  <div className="text-green-400 font-mono">{sectionResult.Iy.toFixed(0)}</div>
                </div>
                <div className="bg-slate-700 p-1.5 rounded">
                  <div className="text-slate-400 text-[10px]">形心</div>
                  <div className="text-green-400 font-mono text-[10px]">({centroidX.toFixed(1)},{centroidY.toFixed(1)})</div>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* 中间绘图区 */}
          <div className="flex-1 flex flex-col bg-slate-800" ref={containerRef}>
            {/* CAD 工具栏 */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-700 border-b border-slate-600">
              <div className="flex items-center gap-1">
                {/* 工具选择 */}
                <div className="flex items-center bg-slate-600 rounded-lg p-0.5 mr-2">
                  <button
                    onClick={() => setTool('select')}
                    className={`p-2 rounded-md transition-colors ${tool === 'select' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'}`}
                    title="选择工具 (S)"
                  >
                    <MousePointer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTool('draw')}
                    className={`p-2 rounded-md transition-colors ${tool === 'draw' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'}`}
                    title="绘制工具 (D) - 点击画布添加顶点"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTool('pan')}
                    className={`p-2 rounded-md transition-colors ${tool === 'pan' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'}`}
                    title="平移工具 (P) - 拖拽移动画布"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                </div>

                {/* 缩放控制 */}
                <div className="flex items-center gap-1 bg-slate-600 rounded-lg p-0.5">
                  <button
                    onClick={() => handleZoom(-0.2)}
                    className="p-2 text-slate-300 hover:text-white rounded-md transition-colors"
                    title="缩小"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-300 w-14 text-center font-mono">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => handleZoom(0.2)}
                    className="p-2 text-slate-300 hover:text-white rounded-md transition-colors"
                    title="放大"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetView}
                    className="p-2 text-slate-300 hover:text-white rounded-md transition-colors"
                    title="重置视图"
                  >
                    <ResetIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* 网格吸附 */}
                <div className="flex items-center gap-2 ml-2 bg-slate-600 rounded-lg px-3 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="rounded text-indigo-500 w-3 h-3"
                    />
                    <span className="text-xs text-slate-300">吸附网格</span>
                  </label>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="bg-slate-700 text-slate-300 text-xs rounded px-1 py-0.5 border-none"
                  >
                    <option value={5}>5mm</option>
                    <option value={10}>10mm</option>
                    <option value={20}>20mm</option>
                  </select>
                </div>
              </div>

              {/* 坐标显示 */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Crosshair className="w-4 h-4" />
                  <span className="font-mono">X: {mousePos.x.toFixed(1)}</span>
                  <span className="font-mono">Y: {mousePos.y.toFixed(1)}</span>
                </div>
                {currentDrawingPath && (
                  <div className="text-amber-400 text-xs">
                    绘制中: {currentDrawingPath.vertices.length} 点 | 双击或回车闭合 | ESC取消
                  </div>
                )}
              </div>
            </div>

            {/* 画布 */}
            <div className="flex-1 overflow-hidden relative">
              <svg 
                ref={svgRef}
                className={`absolute inset-0 w-full h-full ${tool === 'draw' ? 'cursor-crosshair' : tool === 'pan' ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                preserveAspectRatio="xMidYMid slice"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
                onDoubleClick={handleDoubleClick}
              >
                {/* 背景 */}
                <rect width="100%" height="100%" fill="#1e293b" />
                
                {/* 动态网格 */}
                <defs>
                  <pattern 
                    id="cadGridSmall" 
                    width={gridSize * scale} 
                    height={gridSize * scale} 
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${originX % (gridSize * scale)}, ${originY % (gridSize * scale)})`}
                  >
                    <path d={`M ${gridSize * scale} 0 L 0 0 0 ${gridSize * scale}`} fill="none" stroke="#334155" strokeWidth="0.5"/>
                  </pattern>
                  <pattern 
                    id="cadGridLarge" 
                    width={gridSize * scale * 5} 
                    height={gridSize * scale * 5} 
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${originX % (gridSize * scale * 5)}, ${originY % (gridSize * scale * 5)})`}
                  >
                    <path d={`M ${gridSize * scale * 5} 0 L 0 0 0 ${gridSize * scale * 5}`} fill="none" stroke="#475569" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cadGridSmall)" />
                <rect width="100%" height="100%" fill="url(#cadGridLarge)" />
                
                {/* 坐标轴 */}
                <line x1="0" y1={originY} x2={svgWidth} y2={originY} stroke="#64748b" strokeWidth="1" />
                <line x1={originX} y1="0" x2={originX} y2={svgHeight} stroke="#64748b" strokeWidth="1" />
                
                {/* 原点标记 */}
                <circle cx={originX} cy={originY} r="4" fill="#64748b" />
                <text x={originX + 8} y={originY - 8} fill="#94a3b8" fontSize="10">O</text>

                {/* 动态刻度 */}
                {Array.from({ length: Math.ceil(200 / gridSize) }, (_, i) => (i - Math.ceil(100 / gridSize)) * gridSize).map(v => {
                  if (v === 0) return null;
                  const svgX = toSvgX(v);
                  const svgY = toSvgY(v);
                  if (svgX < 0 || svgX > svgWidth) return null;
                  return (
                    <g key={`tick-${v}`}>
                      {svgX > 0 && svgX < svgWidth && (
                        <>
                          <line x1={svgX} y1={originY - 3} x2={svgX} y2={originY + 3} stroke="#64748b" strokeWidth="1" />
                          {v % (gridSize * 2) === 0 && (
                            <text x={svgX} y={originY + 14} fill="#64748b" fontSize="9" textAnchor="middle">{v}</text>
                          )}
                        </>
                      )}
                      {svgY > 0 && svgY < svgHeight && (
                        <>
                          <line x1={originX - 3} y1={svgY} x2={originX + 3} y2={svgY} stroke="#64748b" strokeWidth="1" />
                          {v % (gridSize * 2) === 0 && (
                            <text x={originX - 8} y={svgY + 3} fill="#64748b" fontSize="9" textAnchor="end">{v}</text>
                          )}
                        </>
                      )}
                    </g>
                  );
                })}

                {/* 绘制轮廓 */}
                {paths.map(path => {
                  const isSelected = path.id === selectedPathId;
                  const fillColor = path.isHole ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.4)';
                  const strokeColor = path.isHole ? '#f87171' : '#818cf8';
                  const points = path.vertices.map(v => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ');
                  
                  return (
                    <g key={path.id}>
                      {path.isClosed && path.vertices.length >= 3 && (
                        <polygon
                          points={points}
                          fill={fillColor}
                          stroke={isSelected ? '#fbbf24' : strokeColor}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeDasharray={path.isHole ? '8,4' : 'none'}
                        />
                      )}
                      {!path.isClosed && path.vertices.length >= 2 && (
                        <polyline points={points} fill="none" stroke={isSelected ? '#fbbf24' : strokeColor} strokeWidth={2} strokeLinecap="round" />
                      )}
                      
                      {/* 绘制中的预览线 */}
                      {!path.isClosed && path.vertices.length > 0 && path.id === selectedPathId && tool === 'draw' && (
                        <line
                          x1={toSvgX(path.vertices[path.vertices.length - 1].x)}
                          y1={toSvgY(path.vertices[path.vertices.length - 1].y)}
                          x2={toSvgX(mousePos.x)}
                          y2={toSvgY(mousePos.y)}
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          strokeDasharray="5,5"
                        />
                      )}
                      
                      {/* 顶点 */}
                      {path.vertices.map((v, idx) => (
                        <g key={idx}>
                          <circle
                            cx={toSvgX(v.x)}
                            cy={toSvgY(v.y)}
                            r={isSelected && selectedVertexIdx === idx ? 8 : 5}
                            fill={isSelected && selectedVertexIdx === idx ? '#fbbf24' : (path.isHole ? '#f87171' : '#818cf8')}
                            stroke="#fff"
                            strokeWidth="2"
                            style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                            onClick={(e) => {
                              if (tool === 'select') {
                                e.stopPropagation();
                                setSelectedPathId(path.id);
                                setSelectedVertexIdx(idx);
                              }
                            }}
                          />
                          {isSelected && (
                            <text x={toSvgX(v.x) + 10} y={toSvgY(v.y) - 8} fill="#94a3b8" fontSize="10" fontWeight="500">
                              P{idx + 1}
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  );
                })}

                {/* 形心 */}
                {sectionResult.A > 0 && (
                  <g>
                    <line x1={toSvgX(centroidX) - 10} y1={toSvgY(centroidY)} x2={toSvgX(centroidX) + 10} y2={toSvgY(centroidY)} stroke="#10b981" strokeWidth="2" />
                    <line x1={toSvgX(centroidX)} y1={toSvgY(centroidY) - 10} x2={toSvgX(centroidX)} y2={toSvgY(centroidY) + 10} stroke="#10b981" strokeWidth="2" />
                    <circle cx={toSvgX(centroidX)} cy={toSvgY(centroidY)} r="6" fill="#10b981" stroke="#fff" strokeWidth="2" />
                    <text x={toSvgX(centroidX) + 12} y={toSvgY(centroidY) - 10} fill="#10b981" fontSize="11" fontWeight="bold">C</text>
                  </g>
                )}

                {/* 鼠标位置十字线 */}
                {tool === 'draw' && (
                  <g>
                    <line x1={toSvgX(mousePos.x)} y1="0" x2={toSvgX(mousePos.x)} y2={svgHeight} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
                    <line x1="0" y1={toSvgY(mousePos.y)} x2={svgWidth} y2={toSvgY(mousePos.y)} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
                    <circle cx={toSvgX(mousePos.x)} cy={toSvgY(mousePos.y)} r="5" fill="none" stroke="#fbbf24" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>
          </div>

      </div>
    </div>
  );
};

// 截面SVG绘制组件
const SectionSVG: React.FC<{ type: SectionType; params: SectionParams }> = ({ type, params }) => {
  const scale = 0.8;
  const cx = 100, cy = 100;

  const renderSection = () => {
    switch (type) {
      case "rectangle": {
        const { b, h } = params;
        const w = Math.min(b, 150) * scale;
        const ht = Math.min(h, 150) * scale;
        return (
          <>
            <rect x={cx - w/2} y={cy - ht/2} width={w} height={ht} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 尺寸标注 */}
            <line x1={cx - w/2} y1={cy + ht/2 + 15} x2={cx + w/2} y2={cy + ht/2 + 15} stroke="#94a3b8" strokeWidth="1" />
            <text x={cx} y={cy + ht/2 + 28} textAnchor="middle" fill="#94a3b8" fontSize="11">b={b}</text>
            <line x1={cx + w/2 + 15} y1={cy - ht/2} x2={cx + w/2 + 15} y2={cy + ht/2} stroke="#94a3b8" strokeWidth="1" />
            <text x={cx + w/2 + 28} y={cy + 4} textAnchor="middle" fill="#94a3b8" fontSize="11" transform={`rotate(90, ${cx + w/2 + 28}, ${cy})`}>h={h}</text>
          </>
        );
      }
      case "circle": {
        const { d } = params;
        const r = Math.min(d, 150) * scale / 2;
        return (
          <>
            <circle cx={cx} cy={cy} r={r} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" />
            <text x={cx + r/2} y={cy - 8} textAnchor="middle" fill="#94a3b8" fontSize="11">r={d/2}</text>
          </>
        );
      }
      case "hollow-circle": {
        const { D, d } = params;
        const R = Math.min(D, 150) * scale / 2;
        const r = (d / D) * R;
        return (
          <>
            <circle cx={cx} cy={cy} r={R} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#6366f1" strokeWidth="2" />
          </>
        );
      }
      case "hollow-rectangle": {
        const { B, H, t } = params;
        const w = Math.min(B, 150) * scale;
        const ht = Math.min(H, 150) * scale;
        const tw = (t / B) * w;
        const th = (t / H) * ht;
        return (
          <>
            <rect x={cx - w/2} y={cy - ht/2} width={w} height={ht} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <rect x={cx - w/2 + tw} y={cy - ht/2 + th} width={w - 2*tw} height={ht - 2*th} fill="#1e293b" stroke="#6366f1" strokeWidth="1" />
          </>
        );
      }
      case "i-beam": {
        const { H, B, tw, tf } = params;
        const h = Math.min(H, 160) * scale;
        const b = Math.min(B, 120) * scale;
        const web = (tw / B) * b;
        const flange = (tf / H) * h;
        return (
          <>
            {/* 上翼缘 */}
            <rect x={cx - b/2} y={cy - h/2} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 腹板 */}
            <rect x={cx - web/2} y={cy - h/2 + flange} width={web} height={h - 2*flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 下翼缘 */}
            <rect x={cx - b/2} y={cy + h/2 - flange} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
          </>
        );
      }
      case "t-beam": {
        const { B, tf, hw, tw } = params;
        const b = Math.min(B, 140) * scale;
        const flange = Math.min(tf, 40) * scale;
        const webH = Math.min(hw, 120) * scale;
        const web = (tw / B) * b;
        const totalH = flange + webH;
        return (
          <>
            {/* 翼缘 */}
            <rect x={cx - b/2} y={cy - totalH/2} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 腹板 */}
            <rect x={cx - web/2} y={cy - totalH/2 + flange} width={web} height={webH} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
          </>
        );
      }
      case "channel": {
        const { H, B, tw, tf } = params;
        const h = Math.min(H, 150) * scale;
        const b = Math.min(B, 80) * scale;
        const web = (tw / B) * b;
        const flange = (tf / H) * h;
        return (
          <>
            {/* 腹板 */}
            <rect x={cx - b/2} y={cy - h/2} width={web} height={h} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 上翼缘 */}
            <rect x={cx - b/2} y={cy - h/2} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 下翼缘 */}
            <rect x={cx - b/2} y={cy + h/2 - flange} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
          </>
        );
      }
      case "angle": {
        const { L, t } = params;
        const l = Math.min(L, 120) * scale;
        const th = (t / L) * l;
        return (
          <path
            d={`M ${cx - l/2} ${cy + l/2} 
                L ${cx - l/2} ${cy + l/2 - th} 
                L ${cx - l/2 + l - th} ${cy + l/2 - th}
                L ${cx - l/2 + l - th} ${cy - l/2 + th}
                L ${cx - l/2 + l} ${cy - l/2 + th}
                L ${cx - l/2 + l} ${cy + l/2}
                Z`}
            fill="rgba(99, 102, 241, 0.3)"
            stroke="#6366f1"
            strokeWidth="2"
          />
        );
      }
      case "unequal-angle": {
        const { B, b, t } = params;
        const longLeg = Math.min(B, 140) * scale;
        const shortLeg = Math.min(b, 100) * scale;
        const th = (t / B) * longLeg;
        const left = cx - longLeg / 3;
        const bottom = cy + shortLeg / 3;
        return (
          <path
            d={`M ${left} ${bottom}
                L ${left} ${bottom - shortLeg}
                L ${left + th} ${bottom - shortLeg}
                L ${left + th} ${bottom - th}
                L ${left + longLeg} ${bottom - th}
                L ${left + longLeg} ${bottom}
                Z`}
            fill="rgba(99, 102, 241, 0.3)"
            stroke="#6366f1"
            strokeWidth="2"
          />
        );
      }
      case "double-channel": {
        const { H, B, tw, tf, delta } = params;
        const h = Math.min(H, 150) * scale;
        const b = Math.min(B, 60) * scale;
        const web = (tw / B) * b;
        const flange = (tf / H) * h;
        const gap = Math.min(delta, 50) * scale * 0.5;
        const leftX = cx - gap / 2 - b;
        const rightX = cx + gap / 2;
        return (
          <>
            {/* 左槽钢 */}
            <rect x={leftX} y={cy - h/2} width={web} height={h} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <rect x={leftX} y={cy - h/2} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <rect x={leftX} y={cy + h/2 - flange} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            {/* 右槽钢 */}
            <rect x={rightX + b - web} y={cy - h/2} width={web} height={h} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <rect x={rightX} y={cy - h/2} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <rect x={rightX} y={cy + h/2 - flange} width={b} height={flange} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
          </>
        );
      }
      case "composite-rect": {
        const { b1, h1, b2, h2 } = params;
        const w1 = Math.min(b1, 150) * scale;
        const ht1 = Math.min(h1, 50) * scale;
        const w2 = Math.min(b2, 100) * scale;
        const ht2 = Math.min(h2, 120) * scale;
        const totalH = ht1 + ht2;
        return (
          <>
            <rect x={cx - w1/2} y={cy - totalH/2} width={w1} height={ht1} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
            <rect x={cx - w2/2} y={cy - totalH/2 + ht1} width={w2} height={ht2} fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2" />
          </>
        );
      }
      case "custom": {
        return (
          <>
            <circle cx={cx} cy={cy} r={50} fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4" />
            <text x={cx} y={cy + 8} textAnchor="middle" fill="#6366f1" fontSize="40" fontWeight="bold">?</text>
            <text x={cx} y={cy + 70} textAnchor="middle" fill="#94a3b8" fontSize="10">自定义截面</text>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* 坐标轴 */}
      <line x1="20" y1={cy} x2="180" y2={cy} stroke="#475569" strokeWidth="1" strokeDasharray="4" />
      <line x1={cx} y1="20" x2={cx} y2="180" stroke="#475569" strokeWidth="1" strokeDasharray="4" />
      <text x="175" y={cy - 5} fill="#64748b" fontSize="10">x</text>
      <text x={cx + 5} y="25" fill="#64748b" fontSize="10">y</text>
      {/* 截面 */}
      {renderSection()}
    </svg>
  );
};

// 单位系统
type UnitSystem = "mm" | "cm" | "m";

const UNIT_CONFIG: Record<UnitSystem, {
  label: string;
  length: string;
  area: string;
  inertia: string;
  modulus: string;
  // 从mm转换的系数
  lengthFactor: number;
  areaFactor: number;
  inertiaFactor: number;
  modulusFactor: number;
}> = {
  mm: {
    label: "毫米 (mm)",
    length: "mm",
    area: "mm²",
    inertia: "mm⁴",
    modulus: "mm³",
    lengthFactor: 1,
    areaFactor: 1,
    inertiaFactor: 1,
    modulusFactor: 1,
  },
  cm: {
    label: "厘米 (cm)",
    length: "cm",
    area: "cm²",
    inertia: "cm⁴",
    modulus: "cm³",
    lengthFactor: 0.1,        // mm -> cm
    areaFactor: 0.01,         // mm² -> cm²
    inertiaFactor: 0.0001,    // mm⁴ -> cm⁴
    modulusFactor: 0.001,     // mm³ -> cm³
  },
  m: {
    label: "米 (m)",
    length: "m",
    area: "m²",
    inertia: "m⁴",
    modulus: "m³",
    lengthFactor: 0.001,           // mm -> m
    areaFactor: 0.000001,          // mm² -> m²
    inertiaFactor: 0.000000000001, // mm⁴ -> m⁴
    modulusFactor: 0.000000001,    // mm³ -> m³
  },
};

// 格式化数值显示
const formatValue = (value: number): string => {
  if (value === 0) return "0";
  const absValue = Math.abs(value);
  if (absValue < 0.001) return value.toExponential(3);
  if (absValue < 0.01) return value.toFixed(4);
  if (absValue < 1) return value.toFixed(3);
  if (absValue < 100) return value.toFixed(2);
  if (absValue < 10000) return value.toFixed(1);
  return value.toExponential(3);
};

// 结果显示组件
const ResultItem: React.FC<{ label: string; value: number; unit: string; formula?: string }> = ({ label, value, unit, formula }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2">
      <span className="text-slate-700 text-sm">{label}</span>
      {formula && (
        <span className="text-xs text-slate-400 font-mono">({formula})</span>
      )}
    </div>
    <span className="font-mono font-medium" style={{ color: 'var(--color-1)' }}>
      {formatValue(value)}
      <span className="text-slate-500 text-xs ml-1">{unit}</span>
    </span>
  </div>
);

// 计算步骤组件
const StepBox: React.FC<{ step: number; title: string; children: React.ReactNode }> = ({ step, title, children }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--color-1)' }}>
        {step}
      </span>
      <span className="text-slate-800 font-medium">{title}</span>
    </div>
    <div className="pl-8 space-y-2">
      {children}
    </div>
  </div>
);

const FormulaLine: React.FC<{ formula: string; result?: string; highlight?: boolean }> = ({ formula, result, highlight }) => (
  <div className={`font-mono text-sm py-1 ${highlight ? '' : 'text-slate-500'}`} style={highlight ? { color: 'var(--color-2)' } : {}}>
    <span>{formula}</span>
    {result && (
      <>
        <span className="text-slate-400 mx-2">=</span>
        <span className={highlight ? 'font-semibold' : 'text-slate-600'} style={highlight ? { color: 'var(--color-1)' } : {}}>{result}</span>
      </>
    )}
  </div>
);

// 计算过程演示组件
const CalculationSteps: React.FC<{ 
  type: SectionType; 
  params: SectionParams;
  rawResult: SectionResult;
}> = ({ type, params, rawResult }) => {
  const renderSteps = () => {
    switch (type) {
      case "rectangle": {
        const { b, h } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = b × h" />
              <FormulaLine formula={`A = ${b} × ${h}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算对x轴惯性矩 Ix">
              <FormulaLine formula="Ix = b × h³ / 12" />
              <FormulaLine formula={`Ix = ${b} × ${h}³ / 12`} />
              <FormulaLine formula={`Ix = ${b} × ${Math.pow(h, 3)} / 12`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算对y轴惯性矩 Iy">
              <FormulaLine formula="Iy = h × b³ / 12" />
              <FormulaLine formula={`Iy = ${h} × ${b}³ / 12`} />
              <FormulaLine formula={`Iy = ${h} × ${Math.pow(b, 3)} / 12`} result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算惯性半径 ix, iy">
              <FormulaLine formula="ix = √(Ix / A)" />
              <FormulaLine formula={`ix = √(${formatValue(rawResult.Ix)} / ${formatValue(rawResult.A)})`} result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" />
              <FormulaLine formula={`iy = √(${formatValue(rawResult.Iy)} / ${formatValue(rawResult.A)})`} result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算抗弯截面模量 Wx, Wy">
              <FormulaLine formula="Wx = Ix / ymax = Ix / (h/2)" />
              <FormulaLine formula={`Wx = ${formatValue(rawResult.Ix)} / ${h/2}`} result={`${formatValue(rawResult.Wx)} mm³`} highlight />
              <FormulaLine formula="Wy = Iy / xmax = Iy / (b/2)" />
              <FormulaLine formula={`Wy = ${formatValue(rawResult.Iy)} / ${b/2}`} result={`${formatValue(rawResult.Wy)} mm³`} highlight />
            </StepBox>
            
            <StepBox step={6} title="计算极惯性矩 Ip">
              <FormulaLine formula="Ip = Ix + Iy" />
              <FormulaLine formula={`Ip = ${formatValue(rawResult.Ix)} + ${formatValue(rawResult.Iy)}`} result={`${formatValue(rawResult.Ip)} mm⁴`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "circle": {
        const { d } = params;
        const r = d / 2;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = π × r²" />
              <FormulaLine formula={`A = π × ${r}²`} />
              <FormulaLine formula={`A = π × ${r * r}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算惯性矩 Ix = Iy">
              <FormulaLine formula="I = π × d⁴ / 64" />
              <FormulaLine formula={`I = π × ${d}⁴ / 64`} />
              <FormulaLine formula={`I = π × ${Math.pow(d, 4)} / 64`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">圆形截面对任意直径轴的惯性矩相等</p>
            </StepBox>
            
            <StepBox step={3} title="计算极惯性矩 Ip">
              <FormulaLine formula="Ip = π × d⁴ / 32" />
              <FormulaLine formula={`Ip = π × ${d}⁴ / 32`} result={`${formatValue(rawResult.Ip)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">或 Ip = 2 × I</p>
            </StepBox>
            
            <StepBox step={4} title="计算惯性半径 i">
              <FormulaLine formula="i = √(I / A) = d / 4" />
              <FormulaLine formula={`i = ${d} / 4`} result={`${formatValue(rawResult.ix)} mm`} highlight />
              <p className="text-xs text-slate-500 mt-1">圆形截面惯性半径等于直径的1/4</p>
            </StepBox>
            
            <StepBox step={5} title="计算抗弯截面模量 W">
              <FormulaLine formula="W = π × d³ / 32" />
              <FormulaLine formula={`W = π × ${d}³ / 32`} result={`${formatValue(rawResult.Wx)} mm³`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "hollow-circle": {
        const { D, d } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = π × (D² - d²) / 4" />
              <FormulaLine formula={`A = π × (${D}² - ${d}²) / 4`} />
              <FormulaLine formula={`A = π × (${D*D} - ${d*d}) / 4`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算惯性矩 I">
              <FormulaLine formula="I = π × (D⁴ - d⁴) / 64" />
              <FormulaLine formula={`I = π × (${D}⁴ - ${d}⁴) / 64`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算极惯性矩 Ip">
              <FormulaLine formula="Ip = π × (D⁴ - d⁴) / 32" />
              <FormulaLine formula={`Ip = π × (${Math.pow(D,4)} - ${Math.pow(d,4)}) / 32`} result={`${formatValue(rawResult.Ip)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算惯性半径 i">
              <FormulaLine formula="i = √(I / A)" />
              <FormulaLine formula={`i = √(${formatValue(rawResult.Ix)} / ${formatValue(rawResult.A)})`} result={`${formatValue(rawResult.ix)} mm`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算抗弯截面模量 W">
              <FormulaLine formula="W = I / (D/2)" />
              <FormulaLine formula={`W = ${formatValue(rawResult.Ix)} / ${D/2}`} result={`${formatValue(rawResult.Wx)} mm³`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "hollow-rectangle": {
        const { B, H, t } = params;
        const b = B - 2 * t;
        const h = H - 2 * t;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算内部尺寸">
              <FormulaLine formula="内宽 b = B - 2t" />
              <FormulaLine formula={`b = ${B} - 2×${t}`} result={`${b} mm`} highlight />
              <FormulaLine formula="内高 h = H - 2t" />
              <FormulaLine formula={`h = ${H} - 2×${t}`} result={`${h} mm`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = B×H - b×h" />
              <FormulaLine formula={`A = ${B}×${H} - ${b}×${h}`} />
              <FormulaLine formula={`A = ${B*H} - ${b*h}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算对x轴惯性矩 Ix">
              <FormulaLine formula="Ix = (B×H³ - b×h³) / 12" />
              <FormulaLine formula={`Ix = (${B}×${H}³ - ${b}×${h}³) / 12`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算对y轴惯性矩 Iy">
              <FormulaLine formula="Iy = (H×B³ - h×b³) / 12" />
              <FormulaLine formula={`Iy = (${H}×${B}³ - ${h}×${b}³) / 12`} result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "i-beam": {
        const { H, B, tw, tf } = params;
        const hw = H - 2 * tf;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算腹板高度">
              <FormulaLine formula="hw = H - 2×tf" />
              <FormulaLine formula={`hw = ${H} - 2×${tf}`} result={`${hw} mm`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = 2×B×tf + hw×tw" />
              <FormulaLine formula={`A = 2×${B}×${tf} + ${hw}×${tw}`} />
              <FormulaLine formula={`A = ${2*B*tf} + ${hw*tw}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算对x轴惯性矩 Ix">
              <FormulaLine formula="Ix = [B×H³ - (B-tw)×hw³] / 12" />
              <FormulaLine formula={`Ix = [${B}×${H}³ - ${B-tw}×${hw}³] / 12`} result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">工字钢对x轴惯性矩远大于对y轴</p>
            </StepBox>
            
            <StepBox step={4} title="计算对y轴惯性矩 Iy">
              <FormulaLine formula="Iy = (2×tf×B³ + hw×tw³) / 12" />
              <FormulaLine formula={`Iy = (2×${tf}×${B}³ + ${hw}×${tw}³) / 12`} result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
              <p className="text-xs text-slate-500 mt-1">ix 远大于 iy，说明工字钢适合承受绕x轴的弯矩</p>
            </StepBox>
            
            <StepBox step={6} title="计算抗弯截面模量">
              <FormulaLine formula="Wx = Ix / (H/2)" result={`${formatValue(rawResult.Wx)} mm³`} highlight />
              <FormulaLine formula="Wy = Iy / (B/2)" result={`${formatValue(rawResult.Wy)} mm³`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "angle": {
        const { L, t } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="分解截面">
              <p className="text-xs text-slate-400 mb-2">将等边角钢分解为两个矩形：</p>
              <FormulaLine formula={`水平肢: ${L} × ${t} mm`} />
              <FormulaLine formula={`垂直肢: ${t} × ${L - t} mm`} />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = t × (2L - t)" />
              <FormulaLine formula={`A = ${t} × (2×${L} - ${t})`} />
              <FormulaLine formula={`A = ${t} × ${2*L - t}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算形心位置">
              <FormulaLine formula="xc = yc (等边角钢对称)" />
              <p className="text-xs text-slate-500 mt-1">形心在45°对角线上</p>
            </StepBox>
            
            <StepBox step={4} title="计算惯性矩 (平行轴定理)">
              <FormulaLine formula="Ix = Iy (等边角钢)" />
              <FormulaLine formula="I = Σ(I₀ + A×d²)" result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性半径">
              <FormulaLine formula="ix = iy = √(I / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
            </StepBox>
          </div>
        );
      }
      
      case "unequal-angle": {
        const { B, b, t } = params;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="分解截面">
              <p className="text-xs text-slate-400 mb-2">将不等边角钢分解为两个矩形：</p>
              <FormulaLine formula={`水平肢 (长边): ${B} × ${t} mm`} />
              <FormulaLine formula={`垂直肢 (短边): ${t} × ${b - t} mm`} />
            </StepBox>
            
            <StepBox step={2} title="计算截面面积 A">
              <FormulaLine formula="A = A₁ + A₂" />
              <FormulaLine formula={`A₁ = ${B} × ${t} = ${B * t} mm²`} />
              <FormulaLine formula={`A₂ = ${t} × ${b - t} = ${t * (b - t)} mm²`} />
              <FormulaLine formula={`A = ${B * t} + ${t * (b - t)}`} result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算形心位置">
              <FormulaLine formula="xc = (A₁×x₁ + A₂×x₂) / A" />
              <FormulaLine formula="yc = (A₁×y₁ + A₂×y₂) / A" />
              <p className="text-xs text-slate-500 mt-1">不等边角钢形心不在对角线上</p>
            </StepBox>
            
            <StepBox step={4} title="计算惯性矩 Ix (平行轴定理)">
              <FormulaLine formula="Ix = Σ(I₀ + A×dy²)" />
              <FormulaLine formula="Ix = I₁ + A₁×(y₁-yc)² + I₂ + A₂×(y₂-yc)²" result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={5} title="计算惯性矩 Iy (平行轴定理)">
              <FormulaLine formula="Iy = Σ(I₀ + A×dx²)" />
              <FormulaLine formula="Iy = I₁ + A₁×(x₁-xc)² + I₂ + A₂×(x₂-xc)²" result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
              <p className="text-xs text-slate-500 mt-1">Ix ≠ Iy，长边方向惯性矩更大</p>
            </StepBox>
            
            <StepBox step={6} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
          </div>
        );
      }
      
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StepBox step={1} title="计算截面面积 A">
              <FormulaLine formula="A = ∫ dA" result={`${formatValue(rawResult.A)} mm²`} highlight />
            </StepBox>
            
            <StepBox step={2} title="计算惯性矩">
              <FormulaLine formula="Ix = ∫ y² dA" result={`${formatValue(rawResult.Ix)} mm⁴`} highlight />
              <FormulaLine formula="Iy = ∫ x² dA" result={`${formatValue(rawResult.Iy)} mm⁴`} highlight />
            </StepBox>
            
            <StepBox step={3} title="计算惯性半径">
              <FormulaLine formula="ix = √(Ix / A)" result={`${formatValue(rawResult.ix)} mm`} highlight />
              <FormulaLine formula="iy = √(Iy / A)" result={`${formatValue(rawResult.iy)} mm`} highlight />
            </StepBox>
            
            <StepBox step={4} title="计算抗弯截面模量">
              <FormulaLine formula="Wx = Ix / ymax" result={`${formatValue(rawResult.Wx)} mm³`} highlight />
              <FormulaLine formula="Wy = Iy / xmax" result={`${formatValue(rawResult.Wy)} mm³`} highlight />
            </StepBox>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-2)' }} />
        <span>当前截面：<span className="text-slate-800 font-medium">{SECTION_CONFIGS[type].name}</span></span>
      </div>
      {renderSteps()}
    </div>
  );
};

// 主组件
export const SectionModule: React.FC = () => {
  const [sectionType, setSectionType] = useState<SectionType>("rectangle");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("mm");
  const [params, setParams] = useState<SectionParams>(() => {
    const config = SECTION_CONFIGS["rectangle"];
    const initial: SectionParams = {};
    config.params.forEach(p => { initial[p.key] = p.default; });
    return initial;
  });
  
  // 绘制模式的状态（顶点绘制）
  const [drawPaths, setDrawPaths] = useState<PolygonPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [savedDrawResult, setSavedDrawResult] = useState<SectionResult | null>(null);

  // 切换截面类型时重置参数
  const handleTypeChange = (type: SectionType) => {
    setSectionType(type);
    const config = SECTION_CONFIGS[type];
    const newParams: SectionParams = {};
    config.params.forEach(p => { newParams[p.key] = p.default; });
    setParams(newParams);
    // 如果选择绘制截面，打开模态框
    if (type === 'draw' && drawPaths.length === 0) {
      setIsDrawModalOpen(true);
    }
  };

  // 保存绘制结果
  const handleSaveDrawing = (paths: PolygonPath[], result: SectionResult) => {
    setDrawPaths(paths);
    setSavedDrawResult(result);
  };

  // 计算结果（内部始终用mm计算）
  const rawResult = useMemo(() => {
    if (sectionType === 'draw') {
      return calculatePolygonSection(drawPaths);
    }
    const config = SECTION_CONFIGS[sectionType];
    return config.calculate(params);
  }, [sectionType, params, drawPaths]);

  // 转换后的结果
  const unitConfig = UNIT_CONFIG[unitSystem];
  const result = useMemo(() => ({
    A: rawResult.A * unitConfig.areaFactor,
    Ix: rawResult.Ix * unitConfig.inertiaFactor,
    Iy: rawResult.Iy * unitConfig.inertiaFactor,
    Ip: rawResult.Ip * unitConfig.inertiaFactor,
    ix: rawResult.ix * unitConfig.lengthFactor,
    iy: rawResult.iy * unitConfig.lengthFactor,
    Wx: rawResult.Wx * unitConfig.modulusFactor,
    Wy: rawResult.Wy * unitConfig.modulusFactor,
  }), [rawResult, unitConfig]);

  const config = SECTION_CONFIGS[sectionType];

  return (
    <div className="flex flex-col h-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：截面类型选择 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Square className="w-5 h-5" style={{ color: 'var(--color-2)' }} />
              截面类型
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SECTION_CONFIGS) as SectionType[]).map((type) => {
                const cfg = SECTION_CONFIGS[type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left
                      ${sectionType === type
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${sectionType === type ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium block">{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 截面说明 */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-400">{config.description}</p>
              </div>
            </div>
          </div>

          {/* 中间：参数输入和截面预览 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <RectangleHorizontal className="w-5 h-5" style={{ color: 'var(--color-2)' }} />
              {sectionType === 'draw' ? '截面绘制' : '截面参数'}
            </h2>

            {sectionType === 'draw' ? (
              /* 绘制模式 - 显示已保存的截面或打开绘制器按钮 */
              <div className="space-y-4">
                {drawPaths.length > 0 ? (
                  (() => {
                    // 计算截面的边界框
                    const allVertices = drawPaths.flatMap(p => p.vertices);
                    const minX = Math.min(...allVertices.map(v => v.x));
                    const maxX = Math.max(...allVertices.map(v => v.x));
                    const minY = Math.min(...allVertices.map(v => v.y));
                    const maxY = Math.max(...allVertices.map(v => v.y));
                    const width = maxX - minX;
                    const height = maxY - minY;
                    const centerX = (minX + maxX) / 2;
                    const centerY = (minY + maxY) / 2;
                    
                    // 计算缩放比例，使截面适应预览区域（留出边距用于标注）
                    const svgSize = 200;
                    const margin = 40;
                    const availableSize = svgSize - margin * 2;
                    const scaleX = width > 0 ? availableSize / width : 1;
                    const scaleY = height > 0 ? availableSize / height : 1;
                    const previewScale = Math.min(scaleX, scaleY, 2); // 最大缩放2倍
                    
                    // 坐标转换函数
                    const toSvgX = (x: number) => svgSize / 2 + (x - centerX) * previewScale;
                    const toSvgY = (y: number) => svgSize / 2 - (y - centerY) * previewScale;
                    
                    return (
                      <>
                        {/* 已保存的截面预览 */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[200px] mx-auto" style={{ height: '180px' }}>
                            <defs>
                              <pattern id="previewGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#previewGrid)" />
                            
                            {/* 坐标轴 */}
                            <line x1="0" y1={toSvgY(0)} x2={svgSize} y2={toSvgY(0)} stroke="#cbd5e1" strokeWidth="1" />
                            <line x1={toSvgX(0)} y1="0" x2={toSvgX(0)} y2={svgSize} stroke="#cbd5e1" strokeWidth="1" />
                            
                            {/* 绘制截面 */}
                            {drawPaths.map(path => {
                              const fillColor = path.isHole ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.3)';
                              const strokeColor = path.isHole ? '#ef4444' : '#6366f1';
                              const points = path.vertices.map(v => `${toSvgX(v.x)},${toSvgY(v.y)}`).join(' ');
                              return path.isClosed && path.vertices.length >= 3 ? (
                                <polygon
                                  key={path.id}
                                  points={points}
                                  fill={fillColor}
                                  stroke={strokeColor}
                                  strokeWidth="2"
                                  strokeDasharray={path.isHole ? '4,2' : 'none'}
                                />
                              ) : null;
                            })}
                            
                            {/* 宽度标注 */}
                            <line 
                              x1={toSvgX(minX)} y1={toSvgY(minY) + 15} 
                              x2={toSvgX(maxX)} y2={toSvgY(minY) + 15} 
                              stroke="#94a3b8" strokeWidth="1" 
                            />
                            <line x1={toSvgX(minX)} y1={toSvgY(minY) + 10} x2={toSvgX(minX)} y2={toSvgY(minY) + 20} stroke="#94a3b8" strokeWidth="1" />
                            <line x1={toSvgX(maxX)} y1={toSvgY(minY) + 10} x2={toSvgX(maxX)} y2={toSvgY(minY) + 20} stroke="#94a3b8" strokeWidth="1" />
                            <text 
                              x={(toSvgX(minX) + toSvgX(maxX)) / 2} 
                              y={toSvgY(minY) + 28} 
                              textAnchor="middle" 
                              fill="#64748b" 
                              fontSize="10"
                            >
                              {width.toFixed(1)} mm
                            </text>
                            
                            {/* 高度标注 */}
                            <line 
                              x1={toSvgX(maxX) + 15} y1={toSvgY(maxY)} 
                              x2={toSvgX(maxX) + 15} y2={toSvgY(minY)} 
                              stroke="#94a3b8" strokeWidth="1" 
                            />
                            <line x1={toSvgX(maxX) + 10} y1={toSvgY(maxY)} x2={toSvgX(maxX) + 20} y2={toSvgY(maxY)} stroke="#94a3b8" strokeWidth="1" />
                            <line x1={toSvgX(maxX) + 10} y1={toSvgY(minY)} x2={toSvgX(maxX) + 20} y2={toSvgY(minY)} stroke="#94a3b8" strokeWidth="1" />
                            <text 
                              x={toSvgX(maxX) + 25} 
                              y={(toSvgY(maxY) + toSvgY(minY)) / 2 + 3} 
                              fill="#64748b" 
                              fontSize="10"
                            >
                              {height.toFixed(1)}
                            </text>
                            
                            {/* 形心标记 */}
                            {rawResult.A > 0 && (() => {
                              const closedPaths = drawPaths.filter(p => p.isClosed && p.vertices.length >= 3);
                              let sumAx = 0, sumAy = 0, totalA = 0;
                              closedPaths.forEach(path => {
                                const A = calculatePolygonArea(path.vertices);
                                const { cx, cy } = calculatePolygonCentroid(path.vertices);
                                const sign = path.isHole ? -1 : 1;
                                totalA += sign * A;
                                sumAx += sign * A * cx;
                                sumAy += sign * A * cy;
                              });
                              if (totalA > 0) {
                                const cx = sumAx / totalA;
                                const cy = sumAy / totalA;
                                return (
                                  <g>
                                    <circle cx={toSvgX(cx)} cy={toSvgY(cy)} r="5" fill="#10b981" stroke="white" strokeWidth="1.5" />
                                    <text x={toSvgX(cx) + 8} y={toSvgY(cy) - 6} fill="#10b981" fontSize="9" fontWeight="bold">C</text>
                                  </g>
                                );
                              }
                              return null;
                            })()}
                          </svg>
                        </div>
                        
                        {/* 截面信息 + 操作按钮 */}
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">
                              尺寸: <span className="text-slate-700 font-medium">{width.toFixed(1)}×{height.toFixed(1)}</span> mm
                            </span>
                            <span className="text-slate-500">
                              面积: <span className="text-slate-700 font-medium">{rawResult.A.toFixed(1)}</span> mm²
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setIsDrawModalOpen(true)}
                              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              编辑
                            </button>
                            <button
                              onClick={() => { setDrawPaths([]); setSavedDrawResult(null); }}
                              className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  /* 未绘制时显示引导 */
                  <div className="text-center py-8">
                    <Hexagon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400 mb-4">
                      绘制任意多边形截面，支持内孔
                    </p>
                    <button
                      onClick={() => setIsDrawModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                      打开绘制器
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 参数输入 */}
                <div className="space-y-4 mb-6">
                  {config.params.map((param) => (
                    <div key={param.key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-slate-700">{param.label}</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={params[param.key]}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setParams(p => ({ ...p, [param.key]: val }));
                              }
                            }}
                            className="w-24 px-2 py-0.5 text-sm font-mono text-right border rounded outline-none focus:ring-1"
                            style={{ color: 'var(--color-1)', borderColor: '#e2e8f0' }}
                            step={param.max > 1000 ? 100 : param.max > 100 ? 1 : 0.1}
                          />
                          <span className="text-xs text-slate-500 w-12">{param.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setParams(p => ({ ...p, [param.key]: Math.max(param.min, p[param.key] - param.max / 20) }))}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="range"
                          min={param.min}
                          max={Math.max(param.max, params[param.key] * 1.5)}
                          value={params[param.key]}
                          onChange={(e) => setParams(p => ({ ...p, [param.key]: parseFloat(e.target.value) }))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <button
                          onClick={() => setParams(p => ({ ...p, [param.key]: Math.min(param.max * 2, p[param.key] + param.max / 20) }))}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 截面预览 */}
                <div className="bg-slate-50 rounded-xl p-4 aspect-square border border-slate-200">
                  <SectionSVG type={sectionType} params={params} />
                </div>

                {/* 重置按钮 */}
                <button
                  onClick={() => handleTypeChange(sectionType)}
                  className="mt-4 w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置参数
                </button>
              </>
            )}
          </div>

          {/* 右侧：计算结果 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" style={{ color: 'var(--color-2)' }} />
                计算结果
              </h2>
              {/* 单位切换 */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {(Object.keys(UNIT_CONFIG) as UnitSystem[]).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setUnitSystem(unit)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                      ${unitSystem === unit
                        ? "bg-indigo-500 text-white"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">基本参数</div>
              <ResultItem label="截面面积 A" value={result.A} unit={unitConfig.area} />
              
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">惯性矩</div>
              <ResultItem label="对x轴惯性矩 Ix" value={result.Ix} unit={unitConfig.inertia} />
              <ResultItem label="对y轴惯性矩 Iy" value={result.Iy} unit={unitConfig.inertia} />
              <ResultItem label="极惯性矩 Ip" value={result.Ip} unit={unitConfig.inertia} formula="Ix+Iy" />
              
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">惯性半径</div>
              <ResultItem label="对x轴惯性半径 ix" value={result.ix} unit={unitConfig.length} formula="√(Ix/A)" />
              <ResultItem label="对y轴惯性半径 iy" value={result.iy} unit={unitConfig.length} formula="√(Iy/A)" />
              
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">抗弯截面模量</div>
              <ResultItem label="对x轴抗弯模量 Wx" value={result.Wx} unit={unitConfig.modulus} formula="Ix/ymax" />
              <ResultItem label="对y轴抗弯模量 Wy" value={result.Wy} unit={unitConfig.modulus} formula="Iy/xmax" />
            </div>

            {/* 公式说明 */}
            <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(var(--color-5-rgb), 0.1)', borderColor: 'var(--color-5)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-5)' }}>惯性半径的意义</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                惯性半径 i = √(I/A) 是衡量截面质量分布的参数。在压杆稳定计算中，
                柔度 λ = L/i，惯性半径越大，压杆越不容易失稳。
              </p>
            </div>
          </div>
        </div>

        {/* 计算过程演示 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'var(--color-2)' }} />
            计算过程演示
          </h2>
          
          <CalculationSteps 
            type={sectionType} 
            params={params} 
            rawResult={rawResult}
          />
        </div>

        {/* 截面绘制模态对话框 */}
        <SectionDrawModal
          isOpen={isDrawModalOpen}
          onClose={() => setIsDrawModalOpen(false)}
          onSave={handleSaveDrawing}
          initialPaths={drawPaths}
        />
    </div>
  );
};
