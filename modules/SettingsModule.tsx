import React, { useState, useEffect } from "react";
import { Key, Bot, Check, Eye, EyeOff, Trash2, Info, ExternalLink, Palette, User, MessageCircle, ChevronDown, ChevronUp, X, History, Sparkles, Wrench, Bug } from "lucide-react";
import { ThemeName, THEMES, THEME_NAMES, getCurrentTheme, applyTheme } from "../theme";

// API Key 存储的 localStorage key
const API_KEY_STORAGE = "deepseek_api_key";

// 导出获取和设置 API Key 的函数
export const getStoredApiKey = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  }
  return "";
};

export const setStoredApiKey = (key: string): void => {
  if (typeof window !== "undefined") {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  }
};

interface SettingsModuleProps {
  currentTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
}

export const SettingsModule = ({ currentTheme: propTheme, onThemeChange }: SettingsModuleProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(propTheme || getCurrentTheme());

  // 加载已保存的 API Key
  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  // 同步外部主题
  useEffect(() => {
    if (propTheme) {
      setCurrentTheme(propTheme);
    }
  }, [propTheme]);

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    onThemeChange?.(theme);
  };

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey("");
    setStoredApiKey("");
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "请先输入 API Key" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        setTestResult({ success: true, message: "连接成功！API Key 有效" });
        // 测试成功后自动保存
        setStoredApiKey(apiKey);
      } else {
        const errData = await response.json();
        setTestResult({ 
          success: false, 
          message: errData.error?.message || "API Key 无效或已过期" 
        });
      }
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: `连接失败: ${err.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 8)}${"•".repeat(20)}${apiKey.slice(-4)}` : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* API 设置卡片 */}
      <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "var(--color-3)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-4)" }}>
            <Bot className="w-6 h-6" style={{ color: "var(--color-1)" }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "var(--color-1)" }}>AI 助教设置</h3>
            <p className="text-sm text-slate-500">配置 DeepSeek API 以启用 AI 助教功能</p>
          </div>
        </div>

        {/* API Key 输入 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-1)" }}>
              DeepSeek API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5" style={{ color: "var(--color-3)" }} />
              </div>
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="block w-full pl-10 pr-20 py-3 border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:bg-white transition-colors"
                style={{ borderColor: "var(--color-3)" }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded hover:bg-slate-200 transition-colors"
                  title={showKey ? "隐藏" : "显示"}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {apiKey && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 rounded hover:bg-rose-100 transition-colors"
                    title="清除"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--color-2)", color: "var(--color-2)" }}
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                "测试连接"
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-1)" }}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  已保存
                </>
              ) : (
                "保存设置"
              )}
            </button>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                testResult.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* 说明卡片 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border p-6" style={{ borderColor: "var(--color-3)" }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-2)" }} />
          <div className="space-y-3">
            <h4 className="font-medium" style={{ color: "var(--color-1)" }}>如何获取 API Key？</h4>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>访问 DeepSeek 开放平台</li>
              <li>注册或登录您的账户</li>
              <li>在控制台创建新的 API Key</li>
              <li>复制 Key 并粘贴到上方输入框</li>
            </ol>
            <a
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: "var(--color-2)" }}
            >
              前往 DeepSeek 平台
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 主题配色卡片 */}
      <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "var(--color-3)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-4)" }}>
            <Palette className="w-6 h-6" style={{ color: "var(--color-1)" }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "var(--color-1)" }}>主题配色</h3>
            <p className="text-sm text-slate-500">选择您喜欢的界面配色方案</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(THEMES) as ThemeName[]).map((themeName) => (
            <button
              key={themeName}
              onClick={() => handleThemeChange(themeName)}
              className={`relative p-4 rounded-xl transition-all ${
                currentTheme === themeName 
                  ? 'ring-2 ring-offset-2 scale-105 shadow-lg' 
                  : 'hover:scale-105 opacity-80 hover:opacity-100 hover:shadow-md'
              }`}
              style={{ 
                backgroundColor: THEMES[themeName].color4,
                ringColor: THEMES[themeName].color1
              }}
            >
              <div 
                className="w-full h-8 rounded-lg mb-2"
                style={{ backgroundColor: THEMES[themeName].color1 }}
              />
              <div className="flex gap-1 mb-2">
                <div 
                  className="flex-1 h-2 rounded"
                  style={{ backgroundColor: THEMES[themeName].color2 }}
                />
                <div 
                  className="flex-1 h-2 rounded"
                  style={{ backgroundColor: THEMES[themeName].color3 }}
                />
              </div>
              <span 
                className="text-xs font-medium"
                style={{ color: THEMES[themeName].color1 }}
              >
                {THEME_NAMES[themeName]}
              </span>
              {currentTheme === themeName && (
                <div 
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: THEMES[themeName].color1 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 更新日志卡片 */}
      <ChangelogCard />

      {/* 联系作者卡片 */}
      <ContactAuthorCard />

      {/* 隐私说明 */}
      <div className="text-center text-xs text-slate-400 px-4">
        <p>🔒 所有设置仅存储在本地浏览器中，不会上传到任何服务器</p>
      </div>
    </div>
  );
};

// 更新日志数据
const CHANGELOG = [
  {
    version: "1.2.0",
    date: "2024-12-08",
    type: "feature" as const,
    changes: [
      "常用公式模块新增在线计算功能，支持25种梁/拱结构的实时计算",
      "常用公式模块配色更新，全面适配全局主题色",
      "截面特性卡片预览显示截面形状图示",
      "基础公式和截面特性模态框UI优化，添加参数说明",
      "资源库更新：新增学堂在线课程和B站视频教程",
    ],
  },
  {
    version: "1.1.1",
    date: "2024-12-08",
    type: "fix" as const,
    changes: [
      "修复压杆稳定和梁的弯曲模块滑块无法滑到最大值的问题",
    ],
  },
  {
    version: "1.1.0",
    date: "2024-12-07",
    type: "feature" as const,
    changes: [
      "新增常用公式模块，包含基础公式、梁与拱公式、截面特性三个标签页",
      "基础公式涵盖材料力学11大类核心公式",
      "梁与拱公式包含25种常见结构的FBD、SFD、BMD图示",
      "支持公式LaTeX复制功能",
    ],
  },
  {
    version: "1.0.0",
    date: "2024-12-01",
    type: "feature" as const,
    changes: [
      "材料力学可视化实验室正式发布",
      "包含轴向载荷、扭转、弯曲、应力状态、压杆稳定等核心模块",
      "支持AI助教功能（需配置DeepSeek API）",
      "支持4套主题配色方案切换",
    ],
  },
];

// 更新日志组件
const ChangelogCard = () => {
  const [expanded, setExpanded] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Sparkles className="w-4 h-4" />;
      case "fix":
        return <Bug className="w-4 h-4" />;
      case "improve":
        return <Wrench className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return { bg: "bg-emerald-100", text: "text-emerald-600", label: "新功能" };
      case "fix":
        return { bg: "bg-rose-100", text: "text-rose-600", label: "修复" };
      case "improve":
        return { bg: "bg-blue-100", text: "text-blue-600", label: "优化" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-600", label: "更新" };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "var(--color-3)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-4)" }}>
            <History className="w-6 h-6" style={{ color: "var(--color-1)" }} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg" style={{ color: "var(--color-1)" }}>更新日志</h3>
            <p className="text-sm text-slate-500">查看版本更新记录</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "var(--color-4)", color: "var(--color-1)" }}>
            v{CHANGELOG[0].version}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
          {CHANGELOG.map((release, idx) => {
            const typeStyle = getTypeColor(release.type);
            return (
              <div key={idx} className="relative pl-6 pb-4 border-l-2" style={{ borderColor: "var(--color-4)" }}>
                {/* 时间线圆点 */}
                <div 
                  className="absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px]"
                  style={{ backgroundColor: idx === 0 ? "var(--color-1)" : "var(--color-4)" }}
                />
                
                {/* 版本头部 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold" style={{ color: "var(--color-1)" }}>v{release.version}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${typeStyle.bg} ${typeStyle.text}`}>
                    {getTypeIcon(release.type)}
                    {typeStyle.label}
                  </span>
                  <span className="text-xs text-slate-400">{release.date}</span>
                </div>
                
                {/* 更新内容 */}
                <ul className="space-y-1">
                  {release.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--color-2)" }} />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 联系作者组件
const ContactAuthorCard = () => {
  const [expanded, setExpanded] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "var(--color-3)" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-4)" }}>
              <User className="w-6 h-6" style={{ color: "var(--color-1)" }} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg" style={{ color: "var(--color-1)" }}>关于作者</h3>
              <p className="text-sm text-slate-500">联系方式与社交媒体</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expanded && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              感谢使用材料力学可视化实验室！如果您有任何问题、建议或合作意向，欢迎通过以下方式联系我。
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 微信 */}
              <button
                onClick={() => setShowQRCode(true)}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-800 group-hover:text-green-600">微信</div>
                  <div className="text-xs text-slate-500">点击查看二维码</div>
                </div>
              </button>

              {/* 抖音 */}
              <a
                href="https://www.douyin.com/user/self?from_tab_name=main"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-pink-400 hover:bg-pink-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-800 group-hover:text-pink-600">抖音</div>
                  <div className="text-xs text-slate-500">关注获取更多内容</div>
                </div>
              </a>

              {/* 小红书 */}
              <a
                href="https://www.xiaohongshu.com/user/profile/67b884d2000000000e013859"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-800 group-hover:text-red-600">小红书</div>
                  <div className="text-xs text-slate-500">更多学习笔记</div>
                </div>
              </a>
            </div>

            <div className="text-xs text-slate-400 text-center pt-2">
              💡 如果这个工具对您有帮助，欢迎分享给更多需要的同学
            </div>
          </div>
        )}
      </div>

      {/* 微信二维码弹窗 */}
      {showQRCode && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">微信扫码添加</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="bg-white rounded-xl p-2 flex items-center justify-center">
              <img 
                src={`${import.meta.env.BASE_URL}wechat-qr.png`}
                alt="微信二维码"
                className="w-56 h-56 rounded-lg object-contain"
              />
            </div>
            <p className="text-sm text-slate-500 text-center mt-4">
              打开微信扫一扫，添加作者微信
            </p>
            <p className="text-xs text-slate-400 text-center mt-2">
              备注"材料力学"可优先通过
            </p>
          </div>
        </div>
      )}
    </>
  );
};
