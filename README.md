# 材料力学可视化实验室 (MechMat Lab)

一个交互式材料力学学习平台，通过可视化动画和 AI 辅助帮助学生理解材料力学核心概念。

## ✨ 功能特性

### 📚 学习模块
- **基础概念** - 应力、应变、弹性模量等基本概念
- **轴向载荷** - 拉伸与压缩分析
- **扭转** - 圆轴扭转应力与变形
- **弯曲** - 梁的弯曲应力与挠度
- **应力状态** - 复杂应力状态分析、莫尔圆
- **组合变形** - 多种载荷组合作用
- **压杆稳定** - 欧拉公式与临界载荷

### 🔧 工具
- **结构求解器** - 静定/超静定结构分析
- **AI 助手** - 基于 DeepSeek 的智能问答

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **UI 组件**: Lucide React Icons
- **公式渲染**: KaTeX
- **AI 集成**: DeepSeek API

## 🚀 本地运行

**前置要求**: Node.js 18+

```bash
# 安装依赖
npm install

# AI 功能需要 DeepSeek API Key（在应用内输入）

# 启动开发服务器
npm run dev
```

## 📦 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📁 项目结构

```
├── index.html          # 入口 HTML
├── index.tsx           # React 入口
├── components.tsx      # 通用组件
├── modules/            # 学习模块
│   ├── FundamentalsModule.tsx  # 基础概念
│   ├── AxialModule.tsx         # 轴向载荷
│   ├── TorsionModule.tsx       # 扭转
│   ├── BendingModule.tsx       # 弯曲
│   ├── StressModule.tsx        # 应力状态
│   ├── CombinedModule.tsx      # 组合变形
│   └── BucklingModule.tsx      # 压杆稳定
├── solver/             # 结构求解器
├── ai.tsx              # AI 助手
├── theme.ts            # 主题配置
└── types.ts            # 类型定义
```

## 🌿 分支说明

| 分支 | 说明 |
|------|------|
| `main` | 生产版本，稳定发布 |
| `develop` | 开发版本，日常开发 |

## 📄 License

MIT
