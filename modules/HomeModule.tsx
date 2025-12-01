import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Ruler,
  ArrowDownUp,
  RotateCw,
  Columns,
  Box,
  Layers,
  Calculator,
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  Award,
  Shapes,
  Library,
} from "lucide-react";
import { ModuleType } from "../types";

interface ModuleCard {
  id: ModuleType;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
}

const modules: ModuleCard[] = [
  {
    id: "fundamentals",
    title: "应力应变基础",
    description: "探索材料受力变形的基本行为，理解泊松效应和真应力概念",
    icon: BookOpen,
    gradient: "from-blue-500 to-blue-600",
    shadowColor: "shadow-blue-500/30",
  },
  {
    id: "axial",
    title: "轴向拉伸",
    description: "学习杆件在轴向力作用下的伸长、应力和应变关系",
    icon: ArrowDownUp,
    gradient: "from-emerald-500 to-emerald-600",
    shadowColor: "shadow-emerald-500/30",
  },
  {
    id: "bending",
    title: "平面弯曲",
    description: "理解梁在横向载荷下的弯矩、剪力和挠度分布",
    icon: Ruler,
    gradient: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/30",
  },
  {
    id: "torsion",
    title: "圆轴扭转",
    description: "分析圆轴在扭矩作用下的切应力和扭转角",
    icon: RotateCw,
    gradient: "from-purple-500 to-purple-600",
    shadowColor: "shadow-purple-500/30",
  },
  {
    id: "buckling",
    title: "压杆稳定",
    description: "研究细长压杆的临界载荷和失稳现象",
    icon: Columns,
    gradient: "from-rose-500 to-pink-500",
    shadowColor: "shadow-rose-500/30",
  },
  {
    id: "stress",
    title: "应力状态",
    description: "通过莫尔圆和应力张量理解三维应力变换",
    icon: Box,
    gradient: "from-cyan-500 to-teal-500",
    shadowColor: "shadow-cyan-500/30",
  },
  {
    id: "combined",
    title: "组合变形",
    description: "分析偏心载荷下拉伸与弯曲的叠加效应",
    icon: Layers,
    gradient: "from-orange-500 to-red-500",
    shadowColor: "shadow-orange-500/30",
  },
  {
    id: "solver",
    title: "结构求解器",
    description: "交互式构建和求解梁、桁架结构的内力和变形",
    icon: Calculator,
    gradient: "from-indigo-500 to-violet-500",
    shadowColor: "shadow-indigo-500/30",
  },
  {
    id: "section",
    title: "截面计算",
    description: "计算各种截面的惯性矩、惯性半径和抗弯模量",
    icon: Shapes,
    gradient: "from-teal-500 to-cyan-500",
    shadowColor: "shadow-teal-500/30",
  },
  {
    id: "resources",
    title: "资源库",
    description: "精选材料力学学习资料，包括教材、视频和在线工具",
    icon: Library,
    gradient: "from-slate-500 to-slate-600",
    shadowColor: "shadow-slate-500/30",
  },
];

// 浮动的材料力学公式和图形元素
const FloatingMechanicsElements: React.FC = () => {
  const formulas = [
    "σ = F/A",
    "ε = ΔL/L",
    "σ = Eε",
    "M = EI·κ",
    "τ = Tr/Ip",
    "Pcr = π²EI/L²",
    "ν = -εt/εl",
    "σ = My/I",
    "φ = TL/GIp",
    "λ = L/i",
    "σvm = √(σ²+3τ²)",
    "w = PL³/48EI",
  ];

  const symbols = [
    "∑F = 0",
    "∑M = 0",
    "∂σ/∂x",
    "∫σdA",
    "Δ",
    "θ",
    "κ",
    "γ",
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 浮动公式 */}
      {formulas.map((formula, i) => (
        <div
          key={`formula-${i}`}
          className="absolute text-white/[0.06] font-mono text-lg md:text-xl lg:text-2xl whitespace-nowrap select-none"
          style={{
            left: `${5 + (i % 4) * 25}%`,
            top: `${10 + Math.floor(i / 4) * 30}%`,
            transform: `rotate(${-15 + (i % 3) * 10}deg)`,
            animation: `float-formula ${15 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          {formula}
        </div>
      ))}

      {/* 简支梁示意图 - SVG */}
      <svg
        className="absolute w-48 h-24 md:w-64 md:h-32"
        style={{ left: "5%", top: "60%", opacity: 0.04 }}
        viewBox="0 0 200 80"
      >
        {/* 梁 */}
        <line x1="20" y1="30" x2="180" y2="30" stroke="white" strokeWidth="4" />
        {/* 左支座 - 铰支座 */}
        <polygon points="20,30 10,50 30,50" fill="none" stroke="white" strokeWidth="2" />
        <line x1="5" y1="55" x2="35" y2="55" stroke="white" strokeWidth="2" />
        {/* 右支座 - 滚动支座 */}
        <polygon points="180,30 170,50 190,50" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="180" cy="55" r="5" fill="none" stroke="white" strokeWidth="2" />
        {/* 集中力 */}
        <line x1="100" y1="5" x2="100" y2="30" stroke="white" strokeWidth="2" />
        <polygon points="100,30 95,20 105,20" fill="white" />
        <text x="105" y="15" fill="white" fontSize="12">P</text>
        {/* 弯矩图 */}
        <path d="M 20 50 Q 100 80 180 50" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4" />
      </svg>

      {/* 应力单元体 - SVG */}
      <svg
        className="absolute w-32 h-32 md:w-40 md:h-40"
        style={{ right: "8%", top: "15%", opacity: 0.05 }}
        viewBox="0 0 100 100"
      >
        {/* 正方形单元体 */}
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="white" strokeWidth="2" />
        {/* σx 箭头 */}
        <line x1="80" y1="50" x2="95" y2="50" stroke="white" strokeWidth="2" />
        <polygon points="95,50 88,46 88,54" fill="white" />
        <line x1="20" y1="50" x2="5" y2="50" stroke="white" strokeWidth="2" />
        <polygon points="5,50 12,46 12,54" fill="white" />
        {/* σy 箭头 */}
        <line x1="50" y1="20" x2="50" y2="5" stroke="white" strokeWidth="2" />
        <polygon points="50,5 46,12 54,12" fill="white" />
        <line x1="50" y1="80" x2="50" y2="95" stroke="white" strokeWidth="2" />
        <polygon points="50,95 46,88 54,88" fill="white" />
        {/* τ 剪应力 */}
        <line x1="80" y1="25" x2="80" y2="35" stroke="white" strokeWidth="1.5" />
        <polygon points="80,35 77,30 83,30" fill="white" />
        <text x="60" y="15" fill="white" fontSize="10">σy</text>
        <text x="85" y="55" fill="white" fontSize="10">σx</text>
      </svg>

      {/* 莫尔圆 - SVG */}
      <svg
        className="absolute w-36 h-36 md:w-44 md:h-44"
        style={{ left: "70%", bottom: "20%", opacity: 0.04 }}
        viewBox="0 0 100 100"
      >
        {/* 坐标轴 */}
        <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="1" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="1" />
        {/* 莫尔圆 */}
        <circle cx="55" cy="50" r="30" fill="none" stroke="white" strokeWidth="2" />
        {/* 标注 */}
        <text x="85" y="48" fill="white" fontSize="8">σ</text>
        <text x="52" y="15" fill="white" fontSize="8">τ</text>
        {/* 主应力点 */}
        <circle cx="85" cy="50" r="3" fill="white" />
        <circle cx="25" cy="50" r="3" fill="white" />
      </svg>

      {/* 扭转圆轴 - SVG */}
      <svg
        className="absolute w-40 h-24 md:w-48 md:h-28"
        style={{ left: "15%", bottom: "10%", opacity: 0.04 }}
        viewBox="0 0 160 60"
      >
        {/* 圆轴 */}
        <ellipse cx="20" cy="30" rx="15" ry="20" fill="none" stroke="white" strokeWidth="2" />
        <line x1="20" y1="10" x2="140" y2="10" stroke="white" strokeWidth="2" />
        <line x1="20" y1="50" x2="140" y2="50" stroke="white" strokeWidth="2" />
        <ellipse cx="140" cy="30" rx="15" ry="20" fill="none" stroke="white" strokeWidth="2" />
        {/* 扭矩箭头 */}
        <path d="M 150 20 A 15 15 0 0 1 150 40" fill="none" stroke="white" strokeWidth="2" />
        <polygon points="150,40 145,35 155,35" fill="white" />
        <text x="155" y="35" fill="white" fontSize="10">T</text>
      </svg>

      {/* 压杆失稳 - SVG */}
      <svg
        className="absolute w-20 h-40 md:w-24 md:h-48"
        style={{ right: "20%", bottom: "25%", opacity: 0.04 }}
        viewBox="0 0 50 120"
      >
        {/* 弯曲的杆 */}
        <path d="M 25 10 Q 35 60 25 110" fill="none" stroke="white" strokeWidth="3" />
        {/* 顶部力 */}
        <line x1="25" y1="0" x2="25" y2="10" stroke="white" strokeWidth="2" />
        <polygon points="25,10 22,5 28,5" fill="white" />
        <text x="30" y="8" fill="white" fontSize="10">P</text>
        {/* 底部固定 */}
        <line x1="15" y1="115" x2="35" y2="115" stroke="white" strokeWidth="2" />
        <line x1="15" y1="115" x2="12" y2="120" stroke="white" strokeWidth="1" />
        <line x1="20" y1="115" x2="17" y2="120" stroke="white" strokeWidth="1" />
        <line x1="25" y1="115" x2="22" y2="120" stroke="white" strokeWidth="1" />
        <line x1="30" y1="115" x2="27" y2="120" stroke="white" strokeWidth="1" />
        <line x1="35" y1="115" x2="32" y2="120" stroke="white" strokeWidth="1" />
      </svg>

      {/* 动画样式 */}
      <style>{`
        @keyframes float-formula {
          0%, 100% { transform: translateY(0) rotate(var(--rotate, 0deg)); opacity: 0.06; }
          50% { transform: translateY(-20px) rotate(var(--rotate, 0deg)); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

// 增强版动态背景粒子
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      pulsePhase: number;
      pulseSpeed: number;
    }> = [];
    
    // 流星/射线
    let meteors: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      angle: number;
    }> = [];
    
    const colors = [
      "99, 102, 241",   // indigo
      "139, 92, 246",   // violet
      "168, 85, 247",   // purple
      "59, 130, 246",   // blue
      "236, 72, 153",   // pink
    ];
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    const createParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width / window.devicePixelRatio,
          y: Math.random() * canvas.height / window.devicePixelRatio,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
        });
      }
    };
    
    const createMeteor = () => {
      if (Math.random() > 0.995) {
        meteors.push({
          x: Math.random() * canvas.width / window.devicePixelRatio,
          y: 0,
          length: 50 + Math.random() * 100,
          speed: 3 + Math.random() * 4,
          opacity: 0.6 + Math.random() * 0.4,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        });
      }
    };
    
    const animate = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, w, h);
      
      // 创建流星
      createMeteor();
      
      // 绘制流星
      meteors = meteors.filter(m => {
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.008;
        
        if (m.opacity <= 0 || m.y > h || m.x > w) return false;
        
        const gradient = ctx.createLinearGradient(
          m.x, m.y,
          m.x - Math.cos(m.angle) * m.length,
          m.y - Math.sin(m.angle) * m.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        gradient.addColorStop(0.3, `rgba(168, 85, 247, ${m.opacity * 0.5})`);
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
        
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(
          m.x - Math.cos(m.angle) * m.length,
          m.y - Math.sin(m.angle) * m.length
        );
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 流星头部光晕
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.fill();
        
        return true;
      });
      
      // 绘制鼠标光环效果
      if (mouseRef.current.active) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        
        // 外圈光环
        const outerGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        outerGlow.addColorStop(0, "rgba(139, 92, 246, 0.15)");
        outerGlow.addColorStop(0.5, "rgba(139, 92, 246, 0.05)");
        outerGlow.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.beginPath();
        ctx.arc(mx, my, 180, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();
        
        // 内圈光点
        const innerGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 30);
        innerGlow.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        innerGlow.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.beginPath();
        ctx.arc(mx, my, 30, 0, Math.PI * 2);
        ctx.fillStyle = innerGlow;
        ctx.fill();
      }
      
      // 绘制粒子
      particles.forEach((p) => {
        // 鼠标交互 - 增强效果
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // 近距离排斥
          if (dist < 100) {
            const force = (100 - dist) / 100;
            p.vx -= (dx / dist) * force * 2;
            p.vy -= (dy / dist) * force * 2;
          }
          // 中距离吸引
          else if (dist < 200 && dist > 100) {
            const force = (dist - 100) / 100 * 0.3;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }
        
        // 速度衰减
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // 限制最大速度
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 5) {
          p.vx = (p.vx / speed) * 5;
          p.vy = (p.vy / speed) * 5;
        }
        
        // 添加微小随机运动
        p.vx += (Math.random() - 0.5) * 0.05;
        p.vy += (Math.random() - 0.5) * 0.05;
        
        p.x += p.vx;
        p.y += p.vy;
        
        // 边界处理
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        
        // 脉冲效果
        p.pulsePhase += p.pulseSpeed;
        const pulse = 0.5 + Math.sin(p.pulsePhase) * 0.5;
        const currentSize = p.size * (0.8 + pulse * 0.4);
        const currentOpacity = p.opacity * (0.7 + pulse * 0.3);
        
        // 绘制光晕
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
        glow.addColorStop(0, `rgba(${p.color}, ${currentOpacity * 0.5})`);
        glow.addColorStop(1, `rgba(${p.color}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // 绘制粒子核心
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${currentOpacity})`;
        ctx.fill();
      });
      
      // 绘制连线
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            const opacity = 0.15 * (1 - dist / 120);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    
    // 监听整个文档的鼠标移动，这样即使鼠标在其他元素上也能响应
    const handleDocumentMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // 检查鼠标是否在 canvas 区域内
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
        mouseRef.current.active = true;
      } else {
        mouseRef.current.active = false;
      }
    };
    
    resize();
    createParticles();
    animate();
    
    // 使用 document 级别的事件监听，这样可以穿透上层元素
    document.addEventListener("mousemove", handleDocumentMouseMove);
    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });
    
    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", handleDocumentMouseMove);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.8 }}
    />
  );
};

// 统计数字动画
const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "" }) => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), value));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{current}{suffix}</span>;
};

interface HomeModuleProps {
  onNavigate: (module: ModuleType) => void;
}

export const HomeModule: React.FC<HomeModuleProps> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* 动态粒子背景 */}
      <ParticleBackground />
      
      {/* 材料力学元素背景 */}
      <FloatingMechanicsElements />
      
      {/* 装饰性渐变圆 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      
      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full py-16 lg:py-24 px-6 lg:px-12">
        {/* Hero Section */}
        <div className="text-center mb-12 lg:mb-20 animate-fade-in">
          {/* Logo/Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm lg:text-base font-medium mb-10 border border-white/20">
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
            <span>交互式材料力学学习平台</span>
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
          </div>
          
          {/* 主标题 */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 tracking-tight">
            材料力学
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              可视化
            </span>
            实验室
          </h1>
          
          {/* 副标题 */}
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            通过动态可视化和实时模拟，让抽象的力学概念变得直观易懂。
            <br />
            <span className="text-indigo-400">选择下方模块，开启你的学习之旅</span>
          </p>
        </div>

        {/* 统计数据 */}
        <div className="flex flex-wrap justify-center gap-6 lg:gap-10 mb-12 lg:mb-20 animate-slide-up" style={{ animationDelay: "200ms" }}>
          {[
            { icon: Target, value: 10, label: "学习模块", suffix: "个" },
            { icon: Zap, value: 50, label: "交互实验", suffix: "+" },
            { icon: TrendingUp, value: 100, label: "可视化图表", suffix: "+" },
            { icon: Award, value: 99, label: "学习效率提升", suffix: "%" },
          ].map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-6 lg:px-8 py-4 lg:py-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
            >
              <stat.icon className="w-6 h-6 lg:w-7 lg:h-7 text-indigo-400" />
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-white">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs lg:text-sm text-slate-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Module Grid - 大屏5列 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-7 max-w-[1400px] w-full px-4">
          {modules.map((module, index) => (
            <button
              key={module.id}
              onClick={() => onNavigate(module.id)}
              onMouseEnter={() => setHoveredCard(module.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative p-6 lg:p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10
                         transition-all duration-500 transform hover:scale-105 hover:-translate-y-2
                         text-left animate-slide-up overflow-hidden ${module.shadowColor} hover:shadow-2xl`}
              style={{ animationDelay: `${300 + index * 60}ms` }}
            >
              {/* 悬停时的渐变背景 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              
              {/* 光效 */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              
              {/* 内容 */}
              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${module.gradient} shadow-lg mb-4
                              transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="font-bold text-white text-lg mb-2 group-hover:text-white transition-colors">
                  {module.title}
                </h3>
                
                <p className="text-sm text-slate-400 group-hover:text-white/80 mb-4 line-clamp-2 transition-colors leading-relaxed">
                  {module.description}
                </p>
                
                <div className="flex items-center text-sm font-medium text-indigo-400 group-hover:text-white transition-colors">
                  <span>开始学习</span>
                  <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              
              {/* 角落装饰 */}
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: "800ms" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <span className="text-2xl">💡</span>
            <span className="text-slate-400 text-sm">
              每个模块都配有 <span className="text-indigo-400 font-medium">AI 智能助教</span>，随时解答你的疑问
            </span>
          </div>
        </div>
        
        {/* 键盘快捷键提示 */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-slate-400">1-8</kbd>
            快速切换模块
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white/10 rounded text-slate-400">H</kbd>
            返回首页
          </span>
        </div>
      </div>
    </div>
  );
};
