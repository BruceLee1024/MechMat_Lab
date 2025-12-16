# 主题色使用指南

## 主题色定义

应用包含 4 套完整配色方案，每套包含 5 个颜色：

### 配色方案
1. **日落暖色** (sunset) - 默认
2. **活力彩虹** (vibrant)
3. **温暖大地** (warm)
4. **清新薄荷** (cool)

### 颜色角色

每套主题的 5 个颜色在 UI 中有明确的用途：

- **Color 1** (`--color-1`): 主色调
  - 主标题文字
  - 主要按钮背景
  - 活动状态指示
  - 滑块控件
  
- **Color 2** (`--color-2`): 次要色
  - 图标颜色
  - 次要标题
  - 辅助元素
  
- **Color 3** (`--color-3`): 强调色
  - 边框
  - 公式框边框
  - 输入框边框
  
- **Color 4** (`--color-4`): 背景/中性色
  - 卡片背景
  - 滚动条
  - 中性元素
  
- **Color 5** (`--color-5`): 高亮/警告色
  - 警告提示
  - 重要信息框
  - 高亮元素

## 在代码中使用主题色

### 方法 1: 使用 CSS 变量（推荐）

```tsx
// 文字颜色
<h1 style={{ color: 'var(--color-1)' }}>主标题</h1>

// 背景色
<button style={{ backgroundColor: 'var(--color-1)' }}>按钮</button>

// 边框色
<div style={{ borderColor: 'var(--color-3)' }}>内容</div>

// SVG 填充色
<circle style={{ fill: 'var(--color-2)' }} />

// SVG 描边色
<path style={{ stroke: 'var(--color-3)' }} />
```

### 方法 2: 使用预定义的 CSS 类

```tsx
// 文字颜色
<span className="text-theme-1">主色调文字</span>
<span className="text-theme-2">次要色文字</span>

// 背景色
<div className="bg-theme-1">主色调背景</div>

// 边框色
<div className="border border-theme-3">强调色边框</div>

// SVG 填充
<circle className="fill-theme-2" />

// SVG 描边
<path className="stroke-theme-3" />
```

### 方法 3: 使用带透明度的颜色

```tsx
// 使用 RGB 变量实现透明度
<div style={{ 
  backgroundColor: `rgba(var(--color-1-rgb), 0.1)`,
  borderColor: 'var(--color-1)'
}}>
  半透明背景
</div>
```

## 各模块中的应用建议

### 可视化模块中的 SVG 元素

```tsx
// 主要结构（梁、轴等）
<rect fill="var(--color-1)" />

// 力的箭头
<path stroke="var(--color-2)" strokeWidth="2" />

// 变形后的形状
<path stroke="var(--color-3)" strokeDasharray="4 2" />

// 应力分布渐变
<linearGradient>
  <stop offset="0%" stopColor="var(--color-3)" />
  <stop offset="100%" stopColor="var(--color-5)" />
</linearGradient>
```

### 控制面板

```tsx
// 面板标题
<h3 className="font-bold" style={{ color: 'var(--color-1)' }}>
  控制参数
</h3>

// 数值显示
<span className="font-bold" style={{ color: 'var(--color-1)' }}>
  {value} {unit}
</span>

// 图标
<Icon style={{ color: 'var(--color-2)' }} />
```

### 结果显示

```tsx
// 重要数值
<div className="text-lg font-bold" style={{ color: 'var(--color-1)' }}>
  应力: {stress} MPa
</div>

// 警告信息
<div className="p-3 rounded border" 
     style={{ 
       backgroundColor: 'rgba(var(--color-5-rgb), 0.1)',
       borderColor: 'var(--color-5)',
       color: 'var(--color-5)'
     }}>
  ⚠️ 超过屈服强度！
</div>
```

## 最佳实践

1. **保持一致性**: 相同类型的元素使用相同的颜色
2. **层次分明**: 主要元素用 Color 1，次要元素用 Color 2
3. **适度使用**: 不要过度使用颜色，保持界面清爽
4. **注意对比度**: 确保文字在背景上有足够的对比度
5. **响应主题**: 所有自定义颜色都应使用 CSS 变量，而不是硬编码

## 已应用主题色的组件

- ✅ Sidebar (侧边栏)
- ✅ TheoryPanel (理论面板)
- ✅ AITutor (AI 助教)
- ✅ SliderControl (滑块控件)
- ✅ MaterialSelector (材料选择器)
- ✅ 页面主标题
- ✅ 滚动条

## 待应用的模块

各个实验模块（AxialModule, BendingModule 等）中的：
- SVG 可视化元素
- 结果数值显示
- 图表和图形
- 按钮和交互元素

开发者可以参考本指南，在这些模块中逐步应用主题色。
