import React, { useState, useMemo } from "react";
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
} from "lucide-react";

// 截面类型
type SectionType = "rectangle" | "circle" | "hollow-circle" | "i-beam" | "t-beam" | "channel" | "angle" | "unequal-angle" | "hollow-rectangle";

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
      // 分解为两个矩形：水平肢(B×t) 和 垂直肢((b-t)×t)
      const A1 = B * t;           // 水平肢面积
      const A2 = (b - t) * t;     // 垂直肢面积
      const A = A1 + A2;
      
      // 形心位置（以左下角为原点）
      const x1 = B / 2;           // 水平肢形心x
      const y1 = t / 2;           // 水平肢形心y
      const x2 = t / 2;           // 垂直肢形心x
      const y2 = t + (b - t) / 2; // 垂直肢形心y
      
      const xc = (A1 * x1 + A2 * x2) / A;
      const yc = (A1 * y1 + A2 * y2) / A;
      
      // 对形心轴的惯性矩（平行轴定理）
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
        // 不等边角钢：水平长边B（向右），垂直短边b（向上）
        // 从左下角开始顺时针绘制L形
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

  // 切换截面类型时重置参数
  const handleTypeChange = (type: SectionType) => {
    setSectionType(type);
    const config = SECTION_CONFIGS[type];
    const newParams: SectionParams = {};
    config.params.forEach(p => { newParams[p.key] = p.default; });
    setParams(newParams);
  };

  // 计算结果（内部始终用mm计算）
  const rawResult = useMemo(() => {
    const config = SECTION_CONFIGS[sectionType];
    return config.calculate(params);
  }, [sectionType, params]);

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
              截面参数
            </h2>

            {/* 参数输入 */}
            <div className="space-y-4 mb-6">
              {config.params.map((param) => (
                <div key={param.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">{param.label}</label>
                    <span className="text-sm font-mono" style={{ color: 'var(--color-1)' }}>
                      {params[param.key]} <span className="text-slate-500">{param.unit}</span>
                    </span>
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
                      max={param.max}
                      value={params[param.key]}
                      onChange={(e) => setParams(p => ({ ...p, [param.key]: parseFloat(e.target.value) }))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() => setParams(p => ({ ...p, [param.key]: Math.min(param.max, p[param.key] + param.max / 20) }))}
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
    </div>
  );
};
