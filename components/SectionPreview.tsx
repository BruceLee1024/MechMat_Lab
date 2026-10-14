import React from "react";
import type { SectionToolType as SectionType, SectionParams } from "../mechanics/sectionTool";

// 截面SVG绘制组件
export const SectionSVG: React.FC<{ type: SectionType; params: SectionParams }> = ({ type, params }) => {
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
