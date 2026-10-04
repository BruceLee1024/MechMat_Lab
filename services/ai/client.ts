import { readChatStream } from './stream';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal: AbortSignal;
  onContent: (content: string) => void;
  timeoutMs?: number;
}

export async function requestChat({ endpoint, apiKey, model, messages, signal, onContent, timeoutMs = 60000 }: ChatRequest): Promise<string> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(`${endpoint.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, stream: true, temperature: 0.7, max_tokens: 1000 }),
    });
    if (!response.ok) {
      let detail = '';
      try { const data = await response.json(); if (typeof data?.error?.message === 'string') detail = `：${data.error.message}`; } catch { /* 非 JSON 错误保留状态码。 */ }
      const advice = response.status === 401 ? '，请检查 API Key' : response.status === 429 ? '，请稍后重试' : '';
      throw new Error(`请求失败 (${response.status})${advice}${detail}`);
    }
    // 兼容未遵循 stream 设置、直接返回完整 JSON 的模型服务。
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new Error('AI 返回了空回复，请重试');
      if (controller.signal.aborted) throw new DOMException('已停止生成', 'AbortError');
      onContent(content);
      return content;
    }
    if (!response.body) throw new Error('AI 响应没有可读取的内容，请重试');
    return await readChatStream(response.body, controller.signal, onContent);
  } catch (error) {
    if (timedOut) throw new Error('回复等待超过 60 秒，请检查网络或重试');
    if (signal.aborted) throw new DOMException('已停止生成', 'AbortError');
    // 不把用户凭据带入界面的服务错误信息。
    const message = error instanceof Error ? error.message : '网络请求失败，请重试';
    throw new Error(apiKey ? message.split(apiKey).join('[已隐藏]') : message);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
