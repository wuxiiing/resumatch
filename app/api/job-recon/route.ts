// 岗位真实性调查 · 联网搜(Tavily 搜招聘帖)→ DeepSeek 判断。只依据搜到的公开信息,信号非铁证。
// 复用背调骨架,只换搜索焦点(招聘帖发布/重复)+ 判断口径。按需触发,走 recon 限流桶。不动旧 MVP。

import { NextResponse } from "next/server";
import { consumeCredits } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { company?: string; position?: string };
type TavilyResult = { title?: string; url?: string; content?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const company = (body.company ?? "").trim();
  const position = (body.position ?? "").trim();
  if (!company) {
    return NextResponse.json({ error: "缺少公司名,无法调查岗位。" }, { status: 400 });
  }

  const rl = consumeCredits("recon", req.headers);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return NextResponse.json({ error: "服务未配置 TAVILY_API_KEY。" }, { status: 500 });
  }
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (!dsKey) {
    return NextResponse.json({ error: "服务未配置 DEEPSEEK_API_KEY。" }, { status: 500 });
  }
  const dsBase = process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
  const dsModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  // 1) Tavily 搜招聘帖:聚焦"这岗位在哪些平台/挂了多久/是否反复在招"
  const query = `${company} ${position} 招聘 岗位 在招 长期招聘`.trim();
  let results: TavilyResult[] = [];
  try {
    const tav = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: tavilyKey, query, search_depth: "advanced", max_results: 6 })
    });
    if (!tav.ok) {
      return NextResponse.json({ error: `联网搜索出错（${tav.status}）。` }, { status: 502 });
    }
    const data = (await tav.json()) as { results?: TavilyResult[] };
    results = Array.isArray(data.results) ? data.results : [];
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "联网搜索失败。" }, { status: 502 });
  }

  if (results.length === 0) {
    return NextResponse.json({
      recon: `没搜到「${company} · ${position || "该岗位"}」的公开招聘信息,这次没法判断岗位真实性——信息不足,别硬下结论。`,
      sources: []
    });
  }

  // 2) DeepSeek 判断(只依据搜索结果;信号非铁证,留有余地)
  const evidence = results
    .map((r, i) => `[${i + 1}] ${r.title ?? ""}\n${r.url ?? ""}\n${(r.content ?? "").slice(0, 800)}`)
    .join("\n\n");

  const system = `你是「简配」求职军师的岗位真实性调查助手。**只依据下方【搜索结果】判断,绝不编造、不脑补;线索不足就直说"查不到、无法判断"。**
针对这个招聘岗位,输出一段简明判断(纯文本,不用 Markdown):
① 发布 / 在招:这岗位像不像常年或长期在招、挂了多久(只写搜索里能看出的线索,看不出就说看不出);
② 重复度:是否在多个平台反复挂、频繁重发(可能是海投 / 人才储备 / 幽灵岗的信号);
③ 综合判断 + 置信度:给求职者一句"这岗位可信度大概怎样"的判断,并标【高 / 中 / 低】置信度——**搜不到就说信息不足、不要硬判**;
④ 一句提醒(结合这个岗位)。
这些是**信号、不是铁证**,措辞要留有余地(用"可能 / 看起来 / 暂时看不出")。简洁,顾问口吻。结尾另起一行写:来源:公开招聘信息,仅供参考。`;

  try {
    const ds = await fetch(`${dsBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` },
      body: JSON.stringify({
        model: dsModel,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `公司:${company}\n岗位:${position || "（未提供）"}\n\n【搜索结果】\n${evidence}\n\n请判断这个岗位的真实性。` }
        ]
      })
    });
    if (!ds.ok) {
      return NextResponse.json({ error: `综合分析出错（${ds.status}）。` }, { status: 502 });
    }
    const data = (await ds.json()) as { choices?: { message?: { content?: string } }[] };
    const recon = data?.choices?.[0]?.message?.content;
    if (typeof recon !== "string" || recon.trim() === "") {
      return NextResponse.json({ error: "调查结果为空,请重试。" }, { status: 502 });
    }
    const sources = results.map((r) => ({ title: r.title ?? "", url: r.url ?? "" }));
    return NextResponse.json({ recon, sources });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "岗位调查失败。" }, { status: 500 });
  }
}
