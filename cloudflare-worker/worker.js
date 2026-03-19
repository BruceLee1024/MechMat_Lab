// Cloudflare Worker - DeepSeek API 代理
// 部署到 Cloudflare Workers 后，将 URL 替换到前端代码中

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// 允许的来源域名
const ALLOWED_ORIGINS = [
  "https://brucelee1024.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return handleCORS(request);
    }

    // 只允许 POST 请求
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const origin = request.headers.get("Origin") || "";
    
    // 验证来源
    if (!ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed) || allowed.includes(origin.split("//")[1]?.split("/")[0]))) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      // 获取请求体
      const body = await request.json();
      
      // 从请求头获取 API Key
      const apiKey = request.headers.get("Authorization");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Missing API Key" }), {
          status: 401,
          headers: getCORSHeaders(origin),
        });
      }

      // 转发请求到 DeepSeek API
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey,
        },
        body: JSON.stringify(body),
      });

      // 获取响应
      const data = await response.text();

      // 返回响应，添加 CORS 头
      return new Response(data, {
        status: response.status,
        headers: {
          ...getCORSHeaders(origin),
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: getCORSHeaders(origin),
      });
    }
  },
};

function handleCORS(request) {
  const origin = request.headers.get("Origin") || "";
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(origin),
  });
}

function getCORSHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.find(allowed => 
    origin.startsWith(allowed) || allowed.includes(origin.split("//")[1]?.split("/")[0])
  ) || ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
