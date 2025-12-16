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
    title: "材料力学（第6版）",
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
    id: "book-6",
    title: "材料力学",
    description: "李东平主编，武汉大学出版社2015年出版。内容精炼，适合工科学生学习。",
    category: "textbook",
    difficulty: "beginner",
    language: "zh",
    author: "李东平",
    tags: ["教材", "本科", "武汉大学"],
    rating: 4,
    isFree: false,
  },
  {
    id: "book-7",
    title: "Mechanics of Materials",
    description: "James M.Gere著，机械工业出版社2004年引进。国际经典教材，英文原版，适合双语学习。",
    category: "textbook",
    difficulty: "intermediate",
    language: "en",
    author: "James M.Gere",
    tags: ["英文教材", "国际经典", "双语学习"],
    rating: 5,
    isFree: false,
    isRecommended: true,
  },
  {
    id: "book-3",
    title: "材料力学（第3版）",
    description: "单辉祖主编，高等教育出版社。注重基本概念和基本方法，例题习题丰富。",
    category: "textbook",
    difficulty: "beginner",
    language: "zh",
    author: "单辉祖",
    tags: ["经典教材", "本科", "例题丰富"],
    rating: 5,
    isFree: false,
  },
  {
    id: "book-4",
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
  {
    id: "book-5",
    title: "材料力学学习指导",
    description: "刘鸿文主编，高等教育出版社。配套教材的学习辅导书，含详细解题过程。",
    category: "textbook",
    difficulty: "beginner",
    language: "zh",
    author: "刘鸿文",
    tags: ["辅导书", "习题解答", "考研"],
    rating: 5,
    isFree: false,
  },

  // 在线课程
  {
    id: "course-1",
    title: "材料力学 - 学堂在线(中南大学)",
    description: "中南大学材料力学在线课程，讲解系统，配有丰富的工程案例。",
    category: "course",
    difficulty: "beginner",
    language: "zh",
    author: "中南大学",
    tags: ["学堂在线", "中南大学", "工程案例"],
    url: "https://www.xuetangx.com/course/csu08041006368/26287804",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "course-2",
    title: "材料力学 - 学堂在线(暨南大学)",
    description: "暨南大学材料力学在线课程，适合初学者系统学习。",
    category: "course",
    difficulty: "beginner",
    language: "zh",
    author: "暨南大学",
    tags: ["学堂在线", "暨南大学", "系统学习"],
    url: "https://next.xuetangx.com/course/jnu08041004629/26286629",
    rating: 5,
    isFree: true,
  },
  {
    id: "video-1",
    title: "材料力学视频教程",
    description: "B站优质材料力学教学视频，讲解清晰，适合自学和复习。",
    category: "video",
    difficulty: "beginner",
    language: "zh",
    tags: ["B站", "视频教程", "自学"],
    url: "https://www.bilibili.com/video/BV17t411g7pE/",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "video-2",
    title: "材料力学精讲",
    description: "B站材料力学精讲系列，内容全面，配有例题讲解。",
    category: "video",
    difficulty: "beginner",
    language: "zh",
    tags: ["B站", "精讲", "例题"],
    url: "https://www.bilibili.com/video/BV1TW411p7E6/",
    rating: 5,
    isFree: true,
  },

  // 在线工具
  {
    id: "tool-1",
    title: "GeoGebra",
    description: "动态数学软件，可用于绘制莫尔圆、应力变换等几何图形。",
    category: "tool",
    difficulty: "beginner",
    language: "both",
    tags: ["几何绘图", "莫尔圆", "可视化"],
    url: "https://www.geogebra.org/",
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "tool-2",
    title: "Desmos 图形计算器",
    description: "在线图形计算器，可用于绘制函数图像、分析应力分布等。",
    category: "tool",
    difficulty: "beginner",
    language: "both",
    tags: ["图形计算", "函数绘图", "在线工具"],
    url: "https://www.desmos.com/calculator",
    rating: 5,
    isFree: true,
  },
  {
    id: "tool-3",
    title: "在线LaTeX公式编辑器",
    description: "编写数学公式的在线工具，方便整理材料力学笔记。",
    category: "tool",
    difficulty: "beginner",
    language: "both",
    tags: ["LaTeX", "公式编辑", "笔记"],
    url: "https://www.latexlive.com/",
    rating: 4,
    isFree: true,
  },

  // 参考资料
  {
    id: "ref-1",
    title: "材料力学公式汇总",
    description: "常用材料力学公式的系统整理，包含应力、应变、弯曲、扭转等。",
    category: "reference",
    difficulty: "beginner",
    language: "zh",
    tags: ["公式汇总", "速查", "考试复习"],
    rating: 5,
    isFree: true,
    isRecommended: true,
  },
  {
    id: "ref-2",
    title: "截面特性表",
    description: "常用截面的几何特性参数表，包含面积、惯性矩、截面模量等。",
    category: "reference",
    difficulty: "beginner",
    language: "zh",
    tags: ["截面特性", "参数表", "速查"],
    rating: 5,
    isFree: true,
  },
  {
    id: "ref-3",
    title: "材料力学考研真题汇编",
    description: "历年考研材料力学真题及详细解答，适合考研复习。",
    category: "reference",
    difficulty: "intermediate",
    language: "zh",
    tags: ["考研", "真题", "解答"],
    rating: 5,
    isFree: false,
  },
  {
    id: "ref-4",
    title: "工程材料力学性能手册",
    description: "常用工程材料的力学性能参数，包含弹性模量、屈服强度等。",
    category: "reference",
    difficulty: "intermediate",
    language: "zh",
    tags: ["材料参数", "工程应用", "手册"],
    rating: 4,
    isFree: false,
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
