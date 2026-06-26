// 公司背调 · 联网搜索(Tavily)→ DeepSeek 综合。只依据搜到的公开信息,不编造、不脑补。
// 按需触发(用户点"背调"才搜),省搜索额度。不动旧 MVP。

import { NextResponse } from "next/server";

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
    return NextResponse.json({ error: "缺少公司名,无法背调。" }, { status: 400 });
  }

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

  // 1) Tavily 联网搜索:公司口碑 / 加班 / 评价 (+ 这条线)
  const query = `${company} 公司 怎么样 口碑 加班 员工评价 发展前景 ${position}`.trim();
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
    return NextResponse.json({ recon: `没搜到「${company}」的公开信息,这次背调没有可靠依据。`, sources: [] });
  }

  // 2) DeepSeek 综合(只依据搜索结果)
  const evidence = results
    .map((r, i) => `[${i + 1}] ${r.title ?? ""}\n${r.url ?? ""}\n${(r.content ?? "").slice(0, 800)}`)
    .join("\n\n");

  const system = `你是「简配」求职军师的公司背调助手。**只依据下方【搜索结果】综合,绝不编造、不脑补;搜不到的点就说"没查到"。**
针对求职者输出一段简明背调(纯文本,不用 Markdown):
① 基本信息:规模/业务/近况(只写搜索里出现的);
② 口碑与风险:加班、文化、员工评价、坑——客观陈述,有就说、没有就略;
③ 给求职者一句提醒(结合这个岗位)。
简洁,像顾问口吻。结尾另起一行写:来源:公开网络,仅供参考。`;

  try {
    const ds = await fetch(`${dsBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${dsKey}` },
      body: JSON.stringify({
        model: dsModel,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `公司:${company}\n应聘岗位:${position || "（未提供）"}\n\n【搜索结果】\n${evidence}\n\n请做背调。` }
        ]
      })
    });
    if (!ds.ok) {
      return NextResponse.json({ error: `综合分析出错（${ds.status}）。` }, { status: 502 });
    }
    const data = (await ds.json()) as { choices?: { message?: { content?: string } }[] };
    const recon = data?.choices?.[0]?.message?.content;
    if (typeof recon !== "string" || recon.trim() === "") {
      return NextResponse.json({ error: "背调结果为空,请重试。" }, { status: 502 });
    }
    const sources = results.map((r) => ({ title: r.title ?? "", url: r.url ?? "" }));
    return NextResponse.json({ recon, sources });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "背调失败。" }, { status: 500 });
  }
}
