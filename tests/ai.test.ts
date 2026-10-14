import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSEParser, readChatStream } from '../services/ai/stream';
import { requestChat } from '../services/ai/client';

const encode = (text: string) => new TextEncoder().encode(text);
const event = (text: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
function stream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); controller.close(); } });
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('SSE 与跨块内容', () => {
  it('每一个字节边界拆块均完整还原中文、公式和 JSON', async () => {
    const bytes = encode(event('应力 σ = 50 MPa') + event('，变形量 0.25 mm。') + 'data: [DONE]\n\n');
    for (let split = 1; split < bytes.length; split++) {
      const content = await readChatStream(stream([bytes.slice(0, split), bytes.slice(split)]), new AbortController().signal, () => {});
      expect(content).toBe('应力 σ = 50 MPa，变形量 0.25 mm。');
    }
  });
  it('逐字节读取、CRLF 和 data: 无空格均支持', async () => {
    const bytes = encode((event('你好') + 'data:[DONE]\n\n').replace(/\n/g, '\r\n'));
    expect(await readChatStream(stream([...bytes].map(byte => Uint8Array.of(byte))), new AbortController().signal, () => {})).toBe('你好');
  });
  it('多行事件、注释与 EOF 的最后一个事件可解析', () => {
    const events: string[] = [];
    const parser = createSSEParser(data => { events.push(data); });
    parser.push(': 心跳\r\ndata: 第一行\r');
    parser.push('\ndata:第二行\r\n\r\ndata: 最后一行', true);
    expect(events).toEqual(['第一行\n第二行', '最后一行']);
  });
  it('遇到完成标记主动释放未关闭的连接', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(encode(event('完成') + 'data: [DONE]\n\n')); }, cancel });
    expect(await readChatStream(body, new AbortController().signal, () => {})).toBe('完成');
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });
  it('停止时取消 reader，后续数据不写入回复', async () => {
    const controller = new AbortController(), received: string[] = [];
    await expect(readChatStream(stream([encode(event('第一段') + event('旧请求迟到回复'))]), controller.signal, content => {
      received.push(content); controller.abort();
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(received).toEqual(['第一段']);
  });
  it('读取期间取消也立即结束等待', async () => {
    const controller = new AbortController(), body = new ReadableStream<Uint8Array>();
    const pending = readChatStream(body, controller.signal, () => {});
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(body.locked).toBe(false);
  });
  it.each(['data: {不完整}\n\n', 'data: [DONE]\n\n', ': heartbeat\n\n'])('无效或空回复给出诊断', async body => {
    await expect(readChatStream(stream([encode(body)]), new AbortController().signal, () => {})).rejects.toThrow(/格式不完整|空回复/);
  });
});

describe('AI 请求生命周期', () => {
  const input = () => ({ endpoint: 'https://example.test/v1/', apiKey: 'test-key-only', model: 'test-model', messages: [{ role: 'user' as const, content: '分析实验' }], signal: new AbortController().signal, onContent: vi.fn() });
  it('流式请求整理 endpoint，并传递取消信号', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(event('结果') + 'data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetch);
    const args = input();
    expect(await requestChat(args)).toBe('结果');
    expect(fetch.mock.calls[0][0]).toBe('https://example.test/v1/chat/completions');
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(args.onContent).toHaveBeenCalledWith('结果');
  });
  it('支持完整 JSON 回复', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: '完整结果' } }] })));
    expect(await requestChat(input())).toBe('完整结果');
  });
  it('HTTP 错误带状态码，服务消息中的凭据被隐藏', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { message: 'test-key-only 无效' } }, { status: 401 })));
    await expect(requestChat(input())).rejects.toThrow('请求失败 (401)，请检查 API Key：[已隐藏] 无效');
  });
  it('超时覆盖 fetch 等待并清理计时器', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('取消', 'AbortError')), { once: true });
    })));
    const pending = requestChat({ ...input(), timeoutMs: 25 });
    const assertion = expect(pending).rejects.toThrow('等待超过');
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
  it('超时覆盖已经收到头部但没有回复内容的连接', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new ReadableStream<Uint8Array>(), { headers: { 'content-type': 'text/event-stream' } })));
    const pending = requestChat({ ...input(), timeoutMs: 25 });
    const assertion = expect(pending).rejects.toThrow('等待超过');
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });
  it('取消后可重新请求，不复用失败的 controller', async () => {
    const controller = new AbortController(); controller.abort();
    vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => {
      if (init.signal?.aborted) return Promise.reject(new DOMException('取消', 'AbortError'));
      return Promise.resolve(Response.json({ choices: [{ message: { content: '重试成功' } }] }));
    }));
    await expect(requestChat({ ...input(), signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(await requestChat(input())).toBe('重试成功');
  });
});
