import React, { useState, useRef, useEffect } from "react";
import { Bot, Loader2, Send, Lightbulb, RefreshCw, Settings } from "lucide-react";
import { MarkdownRenderer } from "./components";
import { ModuleType, SimulationState, THEORY_INFO } from "./types";
import { getStoredApiKey } from "./modules/SettingsModule";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// 根据模块生成引导性问题
const getGuidingQuestions = (module: ModuleType): string[] => {
  switch (module) {
    case "fundamentals":
      return [
        "为什么材料拉伸时会变细？",
        "真应力和工程应力有什么区别？",
        "泊松比的物理意义是什么？",
        "什么情况下必须考虑真应力？"
      ];
    case "axial":
      return [
        "如何判断材料是否屈服？",
        "弹性变形和塑性变形的区别？",
        "安全系数应该怎么选取？",
        "应力集中是怎么回事？"
      ];
    case "bending":
      return [
        "为什么工字钢比矩形截面更抗弯？",
        "中性轴在哪里，为什么重要？",
        "截面高度为什么影响这么大？",
        "弯曲正应力如何分布？"
      ];
    case "torsion":
      return [
        "为什么空心轴比实心轴更高效？",
        "扭转时的应力如何分布？",
        "极惯性矩的物理意义？",
        "扭转角和什么因素有关？"
      ];
    case "buckling":
      return [
        "为什么细长杆会失稳？",
        "临界力和强度有什么关系？",
        "如何提高压杆的稳定性？",
        "长细比的意义是什么？"
      ];
    case "stress":
      return [
        "什么是主应力？",
        "莫尔圆怎么理解？",
        "von Mises应力是什么？",
        "应力张量的不变量有什么用？"
      ];
    case "combined":
      return [
        "叠加原理什么时候适用？",
        "偏心拉伸为什么危险？",
        "截面核心是什么概念？",
        "如何分析组合变形？"
      ];
    case "solver":
      return [
        "静定和超静定有什么区别？",
        "如何画弯矩图？",
        "支座反力怎么求？",
        "挠度计算的方法有哪些？"
      ];
    default:
      return [
        "材料力学主要研究什么？",
        "应力和应变的关系？",
        "什么是胡克定律？",
        "工程中如何应用材料力学？"
      ];
  }
};

// 根据模块生成系统提示
const getSystemPrompt = (module: ModuleType, state: SimulationState): string => {
  const theoryInfo = THEORY_INFO[module] || THEORY_INFO.home;
  const materialInfo = `当前材料: ${state.materialName}, 弹性模量 E=${state.bendModulus}GPa, 屈服强度 σ_y=${state.materialYield}MPa`;
  
  let contextInfo = "";
  switch (module) {
    case "fundamentals":
      contextInfo = `泊松比 ν=${state.poissonRatio}。用户正在学习应力应变基础，观察泊松效应和真应力vs工程应力。`;
      break;
    case "axial":
      contextInfo = `当前参数: 力 F=${state.axialForce}N, 面积 A=${state.axialArea}mm², 长度 L=${state.axialLength}m。计算应力约 ${(state.axialForce/state.axialArea).toFixed(1)} MPa。`;
      break;
    case "bending":
      contextInfo = `当前参数: 载荷 P=${state.bendLoad}N, 跨度 L=${state.bendLength}m, 截面 ${state.bendWidth}×${state.bendHeight}mm。`;
      break;
    case "torsion":
      contextInfo = `当前参数: 扭矩 T=${state.torqTorque}Nm, 半径 r=${state.torqRadius}mm, 长度 L=${state.torqLength}m, 剪切模量 G=${state.torqModulus}GPa。`;
      break;
    case "buckling":
      contextInfo = `当前参数: 压力 P=${state.buckleLoad}N, 长度 L=${state.buckleLength}m, 截面 ${state.buckleWidth}×${state.buckleHeight}mm。`;
      break;
    case "stress":
      contextInfo = `应力张量: σx=${state.stressSigX}, σy=${state.stressSigY}, σz=${state.stressSigZ}, τxy=${state.stressTauXY}, τyz=${state.stressTauYZ}, τzx=${state.stressTauZX} MPa。`;
      break;
    case "combined":
      contextInfo = `当前参数: 轴向力 F=${state.combinedLoad}N, 偏心距 e=${state.combinedEccentricity}mm, 截面 ${state.combinedWidth}×${state.combinedHeight}mm。`;
      break;
    default:
      contextInfo = "";
  }

  return `你是一位热情、专业且善于引导的材料力学教授。你的教学风格是苏格拉底式的——通过提问引导学生思考，而不是直接给出答案。

当前学习模块: ${theoryInfo.title}
模块简介: ${theoryInfo.definition}
${materialInfo}
${contextInfo}

教学原则:
1. 用通俗易懂的语言解释复杂概念，多用生活中的例子
2. 鼓励学生思考，适时抛出引导性问题
3. 如果学生的理解有偏差，温和地纠正并解释原因
4. 结合当前模块的参数和可视化内容进行讲解
5. 如果发现危险情况（如应力超过屈服强度），要明确指出并解释后果
6. 回答要简洁有力，控制在200字以内，除非学生要求详细解释
7. 使用 Markdown 格式，适当使用加粗、列表等增强可读性
8. 每次回答结束时，可以抛出一个相关的思考问题，引导进一步学习

记住：你是一个引导者，帮助学生建立直觉和理解，而不是一个答案机器。`;
};

// 生成欢迎消息
const getWelcomeMessage = (module: ModuleType, hasApiKey: boolean): string => {
  const apiHint = hasApiKey ? "" : "\n\n⚠️ 请先在「设置」中配置 API Key 以启用对话功能。";
  
  switch (module) {
    case "fundamentals":
      return `👋 欢迎来到应力应变基础模块！\n\n这里我们将探索材料受力时的基本行为。你可以调整右边的泊松比滑块，观察材料拉伸时的横向收缩。\n\n**想一想**：为什么橡皮筋拉长时会变细？这和金属有什么不同？${apiHint}`;
    case "axial":
      return `👋 欢迎来到轴向拉伸模块！\n\n这是最基础的受力形式。试着调整力的大小，观察应力-应变曲线的变化。\n\n**关键问题**：当应力超过屈服强度时，会发生什么？${apiHint}`;
    case "bending":
      return `👋 欢迎来到梁的弯曲模块！\n\n弯曲是工程中最常见的受力形式之一。注意观察弯矩图和挠度曲线。\n\n**思考**：为什么我们总是把木板立着放而不是平着放？${apiHint}`;
    case "torsion":
      return `👋 欢迎来到圆轴扭转模块！\n\n扭转在传动轴设计中至关重要。观察扭转角和应力分布。\n\n**有趣的问题**：为什么汽车传动轴通常是空心的？${apiHint}`;
    case "buckling":
      return `👋 欢迎来到压杆稳定模块！\n\n这是一个很有趣的现象——细长杆受压时会突然弯曲！\n\n**关键概念**：失稳和强度破坏有什么本质区别？${apiHint}`;
    case "stress":
      return `👋 欢迎来到应力状态分析模块！\n\n这里我们研究一个点上的三维应力状态。调整应力分量，观察主应力和莫尔圆的变化。\n\n**核心问题**：为什么我们要找主应力？${apiHint}`;
    case "combined":
      return `👋 欢迎来到组合变形模块！\n\n实际工程中，构件往往同时承受多种载荷。这里我们分析偏心拉伸。\n\n**思考**：偏心距为什么这么重要？${apiHint}`;
    case "solver":
      return `👋 欢迎使用结构求解器！\n\n这是一个强大的工具，可以分析各种梁结构。试着添加节点、单元和载荷，然后求解。\n\n**提示**：从简单的简支梁开始，逐步增加复杂度。${apiHint}`;
    default:
      return `👋 欢迎来到材料力学可视化实验室！\n\n我是你的 AI 助教，随时准备帮助你理解材料力学的各种概念。\n\n选择左侧的模块开始学习吧！有任何问题都可以问我。${apiHint}`;
  }
};

interface AITutorProps {
  activeModule: ModuleType;
  state: SimulationState;
  onNavigateToSettings?: () => void;
}

export const AITutor = ({ activeModule, state, onNavigateToSettings }: AITutorProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [lastModule, setLastModule] = useState<ModuleType>(activeModule);
  const [apiKey, setApiKey] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载存储的 API Key
  useEffect(() => {
    const stored = getStoredApiKey();
    setApiKey(stored);
  }, []);

  // 定期检查 API Key 是否更新
  useEffect(() => {
    const checkApiKey = () => {
      const stored = getStoredApiKey();
      if (stored !== apiKey) {
        setApiKey(stored);
      }
    };
    
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, [apiKey]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 模块切换时重置对话并显示欢迎消息
  useEffect(() => {
    if (activeModule !== lastModule) {
      setLastModule(activeModule);
      setMessages([{
        role: "assistant",
        content: getWelcomeMessage(activeModule, !!apiKey)
      }]);
      setError(null);
    }
  }, [activeModule, lastModule, apiKey]);

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: getWelcomeMessage(activeModule, !!apiKey)
      }]);
    }
  }, [apiKey]);

  const guidingQuestions = getGuidingQuestions(activeModule);

  const [streamingContent, setStreamingContent] = useState<string>("");

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    if (!apiKey) {
      setError("请先在「设置」中配置 API Key");
      return;
    }

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setLoading(true);
    setError(null);
    setStreamingContent("");

    try {
      const systemPrompt = getSystemPrompt(activeModule, state);
      
      const recentMessages = newMessages.slice(-10);
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...recentMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "请求失败");
      }

      // 流式读取响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  setStreamingContent(fullContent);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 流式输出完成，添加到消息列表
      const finalContent = fullContent || "抱歉，我没能理解你的问题，能换个方式问吗？";
      setMessages(prev => [...prev, { role: "assistant", content: finalContent }]);
      setStreamingContent("");

    } catch (err: any) {
      setError(`API 请求出错: ${err.message}`);
      console.error(err);
      setStreamingContent("");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const resetConversation = () => {
    setMessages([{
      role: "assistant",
      content: getWelcomeMessage(activeModule, !!apiKey)
    }]);
    setError(null);
  };

  const hasApiKey = !!apiKey;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border flex flex-col h-full" style={{ borderColor: 'var(--color-3)', minHeight: '350px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--color-3)' }}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" style={{ color: 'var(--color-2)' }} />
          <span className="font-bold text-sm" style={{ color: 'var(--color-1)' }}>AI 助教</span>
          {hasApiKey ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">已连接</span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">未配置</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="p-1 rounded hover:bg-white/50 transition-colors"
              title="设置"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: 'var(--color-2)' }} />
            </button>
          )}
          <button
            onClick={resetConversation}
            className="p-1 rounded hover:bg-white/50 transition-colors"
            title="重新开始对话"
          >
            <RefreshCw className="w-3.5 h-3.5" style={{ color: 'var(--color-2)' }} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md"
                  : "bg-white border shadow-sm rounded-bl-md"
              }`}
              style={msg.role === "assistant" ? { borderColor: 'var(--color-3)' } : {}}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-sm" style={{ color: 'var(--color-1)' }}>
                  <MarkdownRenderer content={msg.content} />
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%]" style={{ borderColor: 'var(--color-3)' }}>
              {streamingContent ? (
                <div className="prose prose-sm max-w-none text-sm" style={{ color: 'var(--color-1)' }}>
                  <MarkdownRenderer content={streamingContent} />
                  <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-0.5" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-2)' }} />
                  <span className="text-sm text-slate-400">思考中...</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-3 mb-2 p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-100">
          {error}
        </div>
      )}

      {/* Quick Questions */}
      <div className="px-3 py-2 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--color-3)' }}>
        <Lightbulb className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-2)' }} />
        {guidingQuestions.slice(0, 3).map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            disabled={loading || !hasApiKey}
            className="text-xs px-2 py-0.5 rounded-full border bg-white hover:bg-indigo-50 transition-colors disabled:opacity-50 truncate max-w-[140px]"
            style={{ borderColor: 'var(--color-3)', color: 'var(--color-1)' }}
            title={q}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--color-3)' }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasApiKey ? "输入你的问题..." : "请先在设置中配置 API Key"}
            disabled={loading || !hasApiKey}
            className="flex-1 px-3 py-1.5 border rounded-full bg-white focus:outline-none focus:ring-2 text-sm disabled:opacity-50 disabled:bg-slate-50"
            style={{ borderColor: 'var(--color-3)', color: 'var(--color-1)' }}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={loading || !inputValue.trim() || !hasApiKey}
            className="p-1.5 rounded-full text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-1)' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
