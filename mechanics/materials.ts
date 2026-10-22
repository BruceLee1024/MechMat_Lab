export interface MaterialData {
  name: string;
  E: number;      // 弹性模量 GPa
  G: number;      // 剪切模量 GPa
  yield: number;  // 屈服强度 MPa
  poisson: number; // 泊松比
  density?: number; // 密度 kg/m³
  category: 'metal' | 'concrete' | 'wood' | 'polymer' | 'composite' | 'custom' | 'other';
}

// 预设参考参数；不含完整试验曲线。混凝土 strength 字段沿用旧库的压缩参考值。
export const DEFAULT_MATERIALS: MaterialData[] = [
  // 钢材
  { name: "Q235钢", E: 206, G: 79, yield: 235, poisson: 0.3, density: 7850, category: 'metal' },
  { name: "Q345钢", E: 206, G: 79, yield: 345, poisson: 0.3, density: 7850, category: 'metal' },
  { name: "Q460高强钢", E: 206, G: 79, yield: 460, poisson: 0.3, density: 7850, category: 'metal' },
  { name: "304不锈钢", E: 193, G: 77, yield: 205, poisson: 0.29, density: 7930, category: 'metal' },
  { name: "316不锈钢", E: 193, G: 77, yield: 290, poisson: 0.29, density: 7980, category: 'metal' },
  // 铝合金
  { name: "6061-T6铝合金", E: 68.9, G: 26, yield: 276, poisson: 0.33, density: 2700, category: 'metal' },
  { name: "7075-T6铝合金", E: 71.7, G: 26.9, yield: 503, poisson: 0.33, density: 2810, category: 'metal' },
  { name: "2024-T3铝合金", E: 73.1, G: 28, yield: 345, poisson: 0.33, density: 2780, category: 'metal' },
  // 其他金属
  { name: "Ti-6Al-4V钛合金", E: 113.8, G: 44, yield: 880, poisson: 0.34, density: 4430, category: 'metal' },
  { name: "H62黄铜", E: 105, G: 39, yield: 250, poisson: 0.35, density: 8430, category: 'metal' },
  { name: "T2紫铜", E: 108, G: 40, yield: 70, poisson: 0.34, density: 8900, category: 'metal' },
  { name: "铸铁HT200", E: 100, G: 40, yield: 200, poisson: 0.26, density: 7200, category: 'metal' },
  // 混凝土
  { name: "C20混凝土", E: 25.5, G: 10.6, yield: 9.6, poisson: 0.2, density: 2400, category: 'concrete' },
  { name: "C30混凝土", E: 30, G: 12.5, yield: 14.3, poisson: 0.2, density: 2400, category: 'concrete' },
  { name: "C40混凝土", E: 32.5, G: 13.5, yield: 19.1, poisson: 0.2, density: 2400, category: 'concrete' },
  { name: "C50混凝土", E: 34.5, G: 14.4, yield: 23.1, poisson: 0.2, density: 2450, category: 'concrete' },
  // 木材
  { name: "松木", E: 12, G: 0.7, yield: 30, poisson: 0.35, density: 500, category: 'wood' },
  { name: "橡木", E: 12.5, G: 0.8, yield: 40, poisson: 0.35, density: 700, category: 'wood' },
  { name: "胶合板", E: 8.5, G: 0.5, yield: 25, poisson: 0.3, density: 600, category: 'wood' },
  // 高分子/复合材料
  { name: "环氧树脂", E: 3.5, G: 1.3, yield: 80, poisson: 0.35, density: 1200, category: 'polymer' },
  { name: "尼龙PA66", E: 3.0, G: 1.1, yield: 85, poisson: 0.4, density: 1140, category: 'polymer' },
  { name: "GFRP玻璃钢", E: 25, G: 4, yield: 200, poisson: 0.25, density: 1900, category: 'composite' },
  { name: "CFRP碳纤维", E: 135, G: 5, yield: 1500, poisson: 0.3, density: 1600, category: 'composite' },
  // 其他
  { name: "玻璃", E: 70, G: 28, yield: 50, poisson: 0.22, density: 2500, category: 'other' },
  { name: "橡胶", E: 0.01, G: 0.003, yield: 15, poisson: 0.49, density: 1100, category: 'polymer' },
];
