// 共享 豆包视觉(火山方舟 Ark)调用：图片 + 文本 → JSON，带抠取 + 校验 + 重试。
// 格式同 deepseek.ts（OpenAI 兼容 /chat/completions），区别只在 user 内容带一张图片。
// 不碰旧 client；控制台那套 Responses API（responses.create/input）不用。

function extractJson(content: string): string {
  const t = content.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fence ? fence[1].trim() : t;
  const first = body.indexOf("{");
  const last = body.lastIndexOf("}");
  return first >= 0 && last > first ? body.slice(first, last + 1) : body;
}

// imageDataUrl: "data:image/png;base64,...."（前端读文件得到的 data URL，直接塞进 image_url）。
async function callOnce(
  system: string,
  userText: string,
  imageDataUrl: string,
  maxTokens: number
): Promise<unknown> {
  const apiKey = process.env.ARK_API_KEY?.trim();
  if (!apiKey) throw new Error("缺少 ARK_API_KEY，本地请配在 .env.local；生产请在 Vercel Environment Variables 中添加。");
  const model = process.env.ARK_VISION_MODEL?.trim() || "doubao-seed-1-6-vision-250815";
  const baseUrl = (process.env.ARK_BASE_URL?.trim() || "https://ark.cn-beijing.volces.com/api/v3").replace(
    /\/+$/,
    ""
  );
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      // 不强加 response_format（豆包视觉对 json_object 支持不确定）；靠 prompt 要求 JSON + extractJson 兜底。
      // Seed 1.6 默认开"深度思考"，OCR 结构化用不上还巨慢（实测 210s）——显式关掉。
      thinking: { type: "disabled" },
      temperature: 0,
      max_tokens: maxTokens,
      stream: false,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`豆包视觉 HTTP ${res.status}：${errBody.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error(`豆包视觉返回内容为空（choices=${JSON.stringify(data.choices?.length)}）`);
  try {
    return JSON.parse(extractJson(rawContent));
  } catch (e) {
    throw new Error(`豆包视觉 JSON 解析失败：${rawContent.slice(0, 200)}`);
  }
}

type Validation<T> = { ok: true; data: T } | { ok: false; error: string };

// 单次请求 → 校验 → 不合规（漏字段 / JSON 截断 / 解析失败）就重试。沿用 deepseek.ts 的兜底逻辑。
// ⚠️ 豆包视觉单次 ~27s，Vercel Hobby 上限 60s → retries 默认 1（最多 2 次，~54s）
export async function callDoubaoVisionJson<T>(
  system: string,
  userText: string,
  imageDataUrl: string,
  validate: (raw: unknown) => Validation<T>,
  opts: { maxTokens?: number; retries?: number } = {}
): Promise<T> {
  const maxTokens = opts.maxTokens ?? 4000;
  const retries = opts.retries ?? 1;
  let lastError = "未知错误";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const raw = await callOnce(system, userText, imageDataUrl, maxTokens);
      const v = validate(raw);
      if (v.ok) return v.data;
      lastError = v.error;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // 非 JSON 解析错误不重试（超时/网络/鉴权重试也没用）
      if (lastError.includes("fetch failed") || lastError.includes("timeout") || lastError.includes("HTTP 4")) break;
    }
  }
  throw new Error(`豆包视觉调用失败：${lastError}`);
}
