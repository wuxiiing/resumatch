// 共享 DeepSeek 调用：单次请求 + JSON 抠取 + 结构校验 + 失败重试。
// 所有 agent 节点复用这个，不再各写各的（之前 4 份重复的技术债，在此一并清掉）。

function extractJson(content: string): string {
  const t = content.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fence ? fence[1].trim() : t;
  const first = body.indexOf("{");
  const last = body.lastIndexOf("}");
  return first >= 0 && last > first ? body.slice(first, last + 1) : body;
}

async function callOnce(system: string, user: string, maxTokens: number): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error("缺少 DEEPSEEK_API_KEY，请用 --env-file=.env.local 运行。");
  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";
  const baseUrl = (process.env.DEEPSEEK_API_BASE_URL?.trim() || "https://api.deepseek.com").replace(
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
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: maxTokens,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek 请求失败：HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek 返回内容为空。");
  return JSON.parse(extractJson(content));
}

type Validation<T> = { ok: true; data: T } | { ok: false; error: string };

// 单次请求 → 校验 → 不合规（漏字段 / JSON 截断 / 解析失败）就重试。
// 真实数据下模型偶尔会出幺蛾子，重试能兜住，避免整条 pipeline 因一次抖动崩掉。
export async function callDeepSeekJson<T>(
  system: string,
  user: string,
  validate: (raw: unknown) => Validation<T>,
  opts: { maxTokens?: number; retries?: number } = {}
): Promise<T> {
  const maxTokens = opts.maxTokens ?? 4000;
  const retries = opts.retries ?? 2;
  let lastError = "未知错误";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const raw = await callOnce(system, user, maxTokens);
      const v = validate(raw);
      if (v.ok) return v.data;
      lastError = v.error;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`DeepSeek 调用重试 ${retries} 次后仍失败：${lastError}`);
}
