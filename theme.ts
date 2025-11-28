// 主题配置
export type ThemeColors = {
  color1: string;  // 主标题、主要按钮
  color2: string;  // 次要标题、图标
  color3: string;  // 强调元素、边框
  color4: string;  // 背景色、卡片
  color5: string;  // 高亮提示、警告
};

export type ThemeName = 'sunset' | 'vibrant' | 'warm' | 'cool';

export const THEMES: Record<ThemeName, ThemeColors> = {
  // 第一套：日落暖色
  sunset: {
    color1: '#D77186',  // 粉红 - 主标题、主要按钮
    color2: '#61A2DA',  // 蓝色 - 次要标题、图标
    color3: '#6CB7DA',  // 青色 - 强调元素、边框
    color4: '#B5B5B3',  // 灰色 - 背景色、卡片
    color5: '#D75725',  // 橙色 - 高亮提示、警告
  },
  
  // 第二套：活力彩虹
  vibrant: {
    color1: '#F24D98',  // 亮粉 - 主标题、主要按钮
    color2: '#813B7C',  // 紫色 - 次要标题、图标
    color3: '#59D044',  // 绿色 - 强调元素、边框
    color4: '#F3A002',  // 橙色 - 背景色、卡片
    color5: '#F2F44D',  // 黄色 - 高亮提示、警告
  },
  
  // 第三套：温暖大地
  warm: {
    color1: '#59A55D',  // 绿色 - 主标题、主要按钮
    color2: '#EFDB56',  // 黄色 - 次要标题、图标
    color3: '#7D9DC6',  // 蓝色 - 强调元素、边框
    color4: '#ECA23F',  // 橙色 - 背景色、卡片
    color5: '#CA4D2A',  // 红色 - 高亮提示、警告
  },
  
  // 第四套：清新薄荷
  cool: {
    color1: '#519D9E',  // 青色 - 主标题、主要按钮
    color2: '#58C9B9',  // 青绿 - 次要标题、图标
    color3: '#74DBCC',  // 浅青 - 强调元素、边框
    color4: '#9DC8C8',  // 灰青 - 背景色、卡片
    color5: '#D1B6E1',  // 紫色 - 高亮提示、警告
  },
};

export const THEME_NAMES: Record<ThemeName, string> = {
  sunset: '日落暖色',
  vibrant: '活力彩虹',
  warm: '温暖大地',
  cool: '清新薄荷',
};

// 应用主题到 CSS 变量
export const applyTheme = (themeName: ThemeName) => {
  const theme = THEMES[themeName];
  const root = document.documentElement;
  
  // 应用 5 个颜色到不同的 CSS 变量
  root.style.setProperty('--color-1', theme.color1);
  root.style.setProperty('--color-2', theme.color2);
  root.style.setProperty('--color-3', theme.color3);
  root.style.setProperty('--color-4', theme.color4);
  root.style.setProperty('--color-5', theme.color5);
  
  // 设置 RGB 版本（用于透明度）
  root.style.setProperty('--color-1-rgb', hexToRgb(theme.color1));
  root.style.setProperty('--color-2-rgb', hexToRgb(theme.color2));
  root.style.setProperty('--color-3-rgb', hexToRgb(theme.color3));
  root.style.setProperty('--color-4-rgb', hexToRgb(theme.color4));
  root.style.setProperty('--color-5-rgb', hexToRgb(theme.color5));
  
  // 保存到 localStorage
  localStorage.setItem('theme', themeName);
};

// 获取当前主题
export const getCurrentTheme = (): ThemeName => {
  const saved = localStorage.getItem('theme') as ThemeName;
  return saved && THEMES[saved] ? saved : 'sunset';
};

// 将 hex 转换为 RGB（用于 Tailwind 的 rgb() 函数）
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

