import React, { useState } from "react";
import {
  BookOpen,
  Video,
  FileText,
  Link2,
  Calculator,
  GraduationCap,
  Globe,
  Download,
  ExternalLink,
  Search,
  Star,
  Clock,
  ChevronRight,
  BookMarked,
  Youtube,
  Newspaper,
  Wrench,
  Filter,
  X,
} from "lucide-react";

// 资源类型定义
type ResourceCategory = "textbook" | "video" | "paper" | "tool" | "course" | "reference";
type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type Language = "zh" | "en" | "both";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  difficulty: DifficultyLevel;
  language: Language;
  url?: string;
  author?: string;
  tags: string[];
  rating?: number;
  isFree: boolean;
  isRecommended?: boolean;
}

// 分类配置
const CATEGORIES: Record<ResourceCategory, { label: string; icon: React.ElementType; color: string }> = {
  textbook: { label: "教材书籍", icon: BookOpen, color: "from-blue-500 to-blue-600" },
  video: { label: "视频教程", icon: Video, color: "from-red-500 to-rose-600" },
  paper: { label: "学术论文", icon: FileText, color: "from-emerald-500 to-green-600" },
  tool: { label: "在线工具", icon: Calculator, color: "from-purple-500 to-violet-600" },
  course: { label: "在线课程", icon: GraduationCap, color: "from-amber-500 to-orange-600" },
  reference: { label: "参考资料", icon: Globe, color: "from-cyan-500 to-teal-600" },
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, { label: string; color: string }> = {
  beginner: { label: "入门", color: "bg-green-100 text-green-600" },
  intermediate: { label: "进阶", color: "bg-yellow-100 text-yellow-600" },
  advanced: { label: "高级", color: "bg-red-100 text-red-600" },
};

// 资源数据
const RESOURCES: Resource[] = [
  // 教材书籍
  {
    id: "book-1",
    title: "材料力学（第6版）",
    description: "刘鸿文主编，高等教育出版社。国内最经典的材料力学教材，内容系统全面，例题丰富。",
    category: "textbook",
    difficulty: "beginner",
    language: "zh",
    author: "刘鸿文",
    tags: ["经典教材", "本科", "系统全面"],
    rating: 5,
    isFree: false,
    isRecommended: true,
  },
  {
    id: "book-2",
    title: "材料力学（第5版）",
    description: "孙训方主编，高等教育出版社。另一本广泛使用的经典教材，讲解清晰，适合自学。",
    category: "textbook",
    difficulty: "beginner",
    language: "zh",
    author: "孙训方",
    tags: ["经典教材", "本科", "自学友好"],
    rating: 5,
    isFree: false,
  },
  {
    id: "book-3",
    title: "Mechanics of Materials",
    description: "Beer, Johnston等著。国际经典教材，图文并茂，工程案例丰富，适合双语学习。",
    category: "textbook",
    difficulty: "intermediate",
    language: "en",
    author: "Beer & Johnston",
    tags: ["国际教材", "工程案例", "双语"],
    rating: 5,
    isFree: false,
    isRecommended: true,
  },
  {
    id: "book-4",
    title: "Advanced Mechanics of Materials",
    description: "Boresi & Schmidt著。研究生级别教材，涵盖高级主题如能量法、塑性力学等。",
    category: "textbook",
    difficulty: "advanced",
    language: "en",
    author: "Boresi & Schmidt",
    tags: ["研究生", "高级主题", "能量法"],
    rating: 4,
    isFree: false,
  },
  {
    id: "book-5",
    title: "弹性力学简明教程",
    description: "徐芝纶著，高等教育出版社。材料力学的进阶读物，连接材料力学与弹性力学。",
    category: "textbook",
    difficulty: "advanced",
    language: "zh",
    author: "徐芝纶",
    tags: ["弹性力学", "进阶", "理论深入"],
    rating: 5,
    isFree: false,
  },

  // 视频教程
  {
    id: "video-1",
    title: "材料力学 - 清华大学公开课",
    description: "清华大学材料力学精品课程，由范钦珊教授主讲，讲解深入浅出。",
    category: "video",
    difficulty: "beginner",
    language: "zh",
    author: "范钦珊",
    tags: ["清华大学", "公开课", "系统讲解"],
    url: "https://www.bilibili.com/video/BV1Ks411W7qE",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "video-2",
    title: "材料力学 - 哈工大公开课",
    description: "哈尔滨工业大学材料力学课程，工科特色明显，注重工程应用。",
    category: "video",
    difficulty: "beginner",
    language: "zh",
    author: "哈工大",
    tags: ["哈工大", "工程应用", "公开课"],
    url: "https://www.bilibili.com/video/BV1W4411a7Nq",
    rating: 5,
    isFree: true,
  },
  {
    id: "video-3",
    title: "Mechanics of Deformable Bodies - MIT OCW",
    description: "MIT开放课程，英文授课，配有完整的讲义和习题，适合提升英语专业词汇。",
    category: "video",
    difficulty: "intermediate",
    language: "en",
    author: "MIT",
    tags: ["MIT", "英文", "完整资料"],
    url: "https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "video-4",
    title: "材料力学动画演示合集",
    description: "各种材料力学概念的动画演示，包括应力应变、弯曲、扭转等，直观易懂。",
    category: "video",
    difficulty: "beginner",
    language: "zh",
    tags: ["动画", "可视化", "概念理解"],
    url: "https://www.bilibili.com/video/BV1Wb411e7s5",
    rating: 4,
    isFree: true,
  },
  {
    id: "video-5",
    title: "Jeff Hanson - Mechanics of Materials",
    description: "YouTube上最受欢迎的材料力学英文教程之一，讲解清晰，例题丰富。",
    category: "video",
    difficulty: "beginner",
    language: "en",
    author: "Jeff Hanson",
    tags: ["YouTube", "英文", "例题丰富"],
    url: "https://www.youtube.com/playlist?list=PLRqDfxcafc21wlI3E56IkDmRJ-33apMjv",
    rating: 5,
    isFree: true,
  },

  // 在线课程
  {
    id: "course-1",
    title: "材料力学 - 中国大学MOOC",
    description: "国家精品在线开放课程，由多所高校联合打造，配有在线测验和证书。",
    category: "course",
    difficulty: "beginner",
    language: "zh",
    tags: ["MOOC", "证书", "在线测验"],
    url: "https://www.icourse163.org/course/HIT-1001515007",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "course-2",
    title: "Mechanics of Materials - Coursera",
    description: "Georgia Tech提供的材料力学课程，包含实验演示和工程案例分析。",
    category: "course",
    difficulty: "intermediate",
    language: "en",
    author: "Georgia Tech",
    tags: ["Coursera", "实验演示", "工程案例"],
    url: "https://www.coursera.org/learn/mechanics-1",
    rating: 4,
    isFree: false,
  },
  {
    id: "course-3",
    title: "Solid Mechanics - edX",
    description: "MIT在edX上的固体力学课程，涵盖材料力学和弹性力学基础。",
    category: "course",
    difficulty: "intermediate",
    language: "en",
    author: "MIT",
    tags: ["edX", "MIT", "固体力学"],
    url: "https://www.edx.org/learn/mechanical-engineering",
    rating: 5,
    isFree: true,
  },

  // 在线工具
  {
    id: "tool-1",
    title: "SkyCiv Beam Calculator",
    description: "在线梁计算器，支持各种边界条件和载荷类型，可绘制弯矩剪力图。",
    category: "tool",
    difficulty: "beginner",
    language: "en",
    tags: ["梁计算", "在线工具", "免费"],
    url: "https://skyciv.com/free-beam-calculator/",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "tool-2",
    title: "MechaniCalc",
    description: "工程计算工具集，包含截面特性、应力分析、疲劳计算等多种功能。",
    category: "tool",
    difficulty: "intermediate",
    language: "en",
    tags: ["工程计算", "截面特性", "综合工具"],
    url: "https://mechanicalc.com/",
    rating: 4,
    isFree: true,
  },
  {
    id: "tool-3",
    title: "Wolfram Alpha",
    description: "强大的计算引擎，可用于求解材料力学中的数学问题和方程。",
    category: "tool",
    difficulty: "beginner",
    language: "both",
    tags: ["计算引擎", "数学求解", "通用工具"],
    url: "https://www.wolframalpha.com/",
    rating: 5,
    isFree: true,
  },
  {
    id: "tool-4",
    title: "GeoGebra",
    description: "动态数学软件，可用于绘制莫尔圆、应力变换等几何图形。",
    category: "tool",
    difficulty: "beginner",
    language: "both",
    tags: ["几何绘图", "莫尔圆", "可视化"],
    url: "https://www.geogebra.org/",
    rating: 5,
    isFree: true,
  },
  {
    id: "tool-5",
    title: "ANSYS Student",
    description: "ANSYS学生版，可进行有限元分析，验证材料力学计算结果。",
    category: "tool",
    difficulty: "advanced",
    language: "en",
    tags: ["有限元", "ANSYS", "仿真分析"],
    url: "https://www.ansys.com/academic/students",
    rating: 5,
    isFree: true,
  },

  // 学术论文/参考
  {
    id: "paper-1",
    title: "Timoshenko梁理论",
    description: "考虑剪切变形的梁理论，是经典欧拉-伯努利梁理论的扩展。",
    category: "paper",
    difficulty: "advanced",
    language: "en",
    author: "S. Timoshenko",
    tags: ["梁理论", "剪切变形", "经典论文"],
    rating: 5,
    isFree: false,
  },
  {
    id: "paper-2",
    title: "von Mises屈服准则",
    description: "最广泛使用的金属材料屈服准则，基于畸变能理论。",
    category: "paper",
    difficulty: "advanced",
    language: "en",
    author: "R. von Mises",
    tags: ["屈服准则", "塑性力学", "经典理论"],
    rating: 5,
    isFree: false,
  },

  // 参考资料
  {
    id: "ref-1",
    title: "Engineering Toolbox",
    description: "工程参考数据库，包含材料属性、公式表、单位换算等实用信息。",
    category: "reference",
    difficulty: "beginner",
    language: "en",
    tags: ["材料属性", "公式表", "参考数据"],
    url: "https://www.engineeringtoolbox.com/",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "ref-2",
    title: "MatWeb材料数据库",
    description: "全球最大的材料属性数据库之一，包含数万种材料的详细参数。",
    category: "reference",
    difficulty: "intermediate",
    language: "en",
    tags: ["材料数据库", "属性查询", "工程材料"],
    url: "https://www.matweb.com/",
    rating: 5,
    isFree: true,
  },
  {
    id: "ref-3",
    title: "材料力学公式手册",
    description: "常用材料力学公式汇总，包括各种截面的惯性矩、抗弯模量等。",
    category: "reference",
    difficulty: "beginner",
    language: "zh",
    tags: ["公式手册", "截面特性", "速查"],
    rating: 4,
    isFree: true,
  },
  {
    id: "ref-4",
    title: "Roark's Formulas for Stress and Strain",
    description: "工程师必备的应力应变公式手册，涵盖各种结构和载荷情况。",
    category: "reference",
    difficulty: "intermediate",
    language: "en",
    author: "Warren C. Young",
    tags: ["公式手册", "工程参考", "经典"],
    rating: 5,
    isFree: false,
    isRecommended: true,
  },
];


// 资源卡片组件
const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const category = CATEGORIES[resource.category];
  const difficulty = DIFFICULTY_LABELS[resource.difficulty];
  const Icon = category.icon;

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 shadow-sm
                    hover:border-slate-300 transition-all duration-300 hover:shadow-md
                    hover:-translate-y-1 overflow-hidden">
      {/* 推荐标记 */}
      {resource.isRecommended && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-yellow-100 
                        rounded-full text-yellow-600 text-xs font-medium">
          <Star className="w-3 h-3 fill-current" />
          推荐
        </div>
      )}

      <div className="p-5">
        {/* 头部：图标和分类 */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} shadow-lg
                          group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-base mb-1 truncate group-hover:text-indigo-600 transition-colors">
              {resource.title}
            </h3>
            {resource.author && (
              <p className="text-sm text-slate-500">{resource.author}</p>
            )}
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {resource.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
            {difficulty.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                          ${resource.isFree ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
            {resource.isFree ? "免费" : "付费"}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            {resource.language === "zh" ? "中文" : resource.language === "en" ? "English" : "中英"}
          </span>
        </div>

        {/* 小标签 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {resource.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500">
              #{tag}
            </span>
          ))}
        </div>

        {/* 评分和链接 */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {resource.rating && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < resource.rating! ? "text-yellow-400 fill-current" : "text-slate-300"
                  }`}
                />
              ))}
            </div>
          )}
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              访问资源
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-sm text-slate-400">线下资源</span>
          )}
        </div>
      </div>
    </div>
  );
};

// 分类标签组件
const CategoryTab: React.FC<{
  category: ResourceCategory | "all";
  isActive: boolean;
  onClick: () => void;
  count: number;
}> = ({ category, isActive, onClick, count }) => {
  const config = category === "all" 
    ? { label: "全部", icon: Filter, color: "from-slate-500 to-slate-600" }
    : CATEGORIES[category];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
                  ${isActive 
                    ? `bg-gradient-to-r ${config.color} text-white shadow-md` 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{config.label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
        isActive ? "bg-white/20" : "bg-slate-200"
      }`}>
        {count}
      </span>
    </button>
  );
};

// 主组件
export const ResourcesModule: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | "all">("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // 过滤资源
  const filteredResources = RESOURCES.filter((resource) => {
    // 分类过滤
    if (activeCategory !== "all" && resource.category !== activeCategory) return false;
    
    // 难度过滤
    if (difficultyFilter !== "all" && resource.difficulty !== difficultyFilter) return false;
    
    // 免费过滤
    if (showFreeOnly && !resource.isFree) return false;
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (resource.author && resource.author.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // 统计各分类数量
  const getCategoryCount = (category: ResourceCategory | "all") => {
    if (category === "all") return RESOURCES.length;
    return RESOURCES.filter(r => r.category === category).length;
  };

  // 推荐资源
  const recommendedResources = RESOURCES.filter(r => r.isRecommended);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 页面标题 */}
      <div className="w-full">
        {/* 推荐资源横幅 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <h2 className="text-base font-bold text-slate-800">精选推荐</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedResources.slice(0, 4).map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group border border-slate-200"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES[resource.category].color}`}>
                  {React.createElement(CATEGORIES[resource.category].icon, { className: "w-4 h-4 text-white" })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {resource.title}
                  </p>
                  <p className="text-xs text-slate-500">{CATEGORIES[resource.category].label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索资源名称、作者或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg
                          text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500
                          transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 难度过滤 */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyLevel | "all")}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700
                        focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">所有难度</option>
              <option value="beginner">入门</option>
              <option value="intermediate">进阶</option>
              <option value="advanced">高级</option>
            </select>

            {/* 免费过滤 */}
            <button
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2
                         ${showFreeOnly 
                           ? "bg-green-50 border-green-300 text-green-600" 
                           : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                         }`}
            >
              <Download className="w-4 h-4" />
              仅显示免费
            </button>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          <CategoryTab
            category="all"
            isActive={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            count={getCategoryCount("all")}
          />
          {(Object.keys(CATEGORIES) as ResourceCategory[]).map((category) => (
            <CategoryTab
              key={category}
              category={category}
              isActive={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              count={getCategoryCount(category)}
            />
          ))}
        </div>

        {/* 资源网格 */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-2">没有找到匹配的资源</p>
            <p className="text-sm text-slate-400">尝试调整搜索条件或选择其他分类</p>
          </div>
        )}

        {/* 底部提示 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
            <span className="text-2xl">📚</span>
            <span className="text-slate-600 text-sm">
              共收录 <span className="font-medium" style={{ color: 'var(--color-1)' }}>{RESOURCES.length}</span> 个学习资源，持续更新中...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
