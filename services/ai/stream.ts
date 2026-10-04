// SSE 以事件/行分隔，网络数据块不是消息边界。
export function createSSEParser(onData: (data: string) => boolean | void) {
  let buffer = '';
  let data: string[] = [];
  let stopped = false;
  const dispatch = () => {
    if (!data.length) return;
    const event = data.join('\n');
    data = [];
    if (onData(event) === false) stopped = true;
  };
  const line = (value: string) => {
    if (!value) { dispatch(); return; }
    if (value.startsWith(':')) return;
    const colon = value.indexOf(':');
    const field = colon < 0 ? value : value.slice(0, colon);
    let content = colon < 0 ? '' : value.slice(colon + 1);
    if (content.startsWith(' ')) content = content.slice(1);
    if (field === 'data') data.push(content);
  };
  return {
    push(text: string, final = false) {
      buffer += text;
      while (!stopped) {
        const match = buffer.search(/[\r\n]/);
        if (match < 0) break;
        if (!final && buffer[match] === '\r' && match === buffer.length - 1) break;
        const current = buffer.slice(0, match);
        const separator = buffer[match] === '\r' && buffer[match + 1] === '\n' ? 2 : 1;
        buffer = buffer.slice(match + separator);
        line(current);
      }
      if (final && !stopped) { if (buffer) line(buffer); buffer = ''; dispatch(); }
      return stopped;
    },
  };
}

export async function readChatStream(body: ReadableStream<Uint8Array>, signal: AbortSignal, onContent: (content: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let fullContent = '';
  const parser = createSSEParser(data => {
    if (signal.aborted) throw new DOMException('已停止生成', 'AbortError');
    if (data.trim() === '[DONE]') return false;
    let parsed: { error?: { message?: string }; choices?: { delta?: { content?: string | null } }[] };
    try { parsed = JSON.parse(data); } catch { throw new Error('AI 响应格式不完整，请重试'); }
    if (parsed.error) throw new Error(parsed.error.message || 'AI 服务返回错误');
    const delta = parsed.choices?.[0]?.delta?.content;
    if (delta !== undefined && delta !== null && typeof delta !== 'string') throw new Error('AI 返回了不支持的内容格式');
    if (delta) { fullContent += delta; onContent(fullContent); }
    return true;
  });
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new DOMException('已停止生成', 'AbortError');
      const { done, value } = await reader.read();
      if (signal.aborted) throw new DOMException('已停止生成', 'AbortError');
      if (done) { parser.push(decoder.decode(), true); break; }
      if (parser.push(decoder.decode(value, { stream: true }))) break;
    }
    if (!fullContent.trim()) throw new Error('AI 返回了空回复，请重试');
    return fullContent;
  } finally {
    signal.removeEventListener('abort', cancel);
    try { await reader.cancel(); } catch { /* 连接已结束或被中止。 */ }
    reader.releaseLock();
  }
}
