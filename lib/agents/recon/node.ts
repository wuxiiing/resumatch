// ⑤ 背调节点 · 节点实现
// 用 ① 推断的公司名联网搜一次（Tavily），再让模型只依据搜索结果写背调。
// 背调是"是不是坑"的依据：给 ③ 做参考、单独进报告，不改定档规则。
// 没认出公司 / 搜索或模型失败都只返回一句说明，绝不拖垮整条研判。

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { reconSystemPrompt, buildReconQuery, buildReconUserPrompt } from "./prompt.ts";
import { validateReconFindings, type Recon } from "./schema.ts";
import type { JdAnalysis } from "../jd-analysis/schema.ts";
import { callDeepSeekJson } from "../deepseek.ts";

type TavilyResult = { title?: string; url?: string; content?: string };

// 设了 RECON_CACHE_DIR（评测用）就按搜索词缓存结果：评测可复现，也不重复花搜索额度。线上不设。
async function search(query: string): Promise<TavilyResult[]> {
  const dir = process.env.RECON_CACHE_DIR;
  const file = dir ? path.join(dir, createHash("sha1").update(query).digest("hex").slice(0, 16) + ".json") : "";
  if (file && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as TavilyResult[];

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("服务未配置 TAVILY_API_KEY");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 10 }),
  });
  if (!res.ok) throw new Error(`联网搜索出错（${res.status}）`);
  const data = (await res.json()) as { results?: TavilyResult[] };
  const results = Array.isArray(data.results) ? data.results : [];
  if (file) {
    fs.mkdirSync(dir!, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(results));
  }
  return results;
}

export async function reconNode(state: { jdAnalysis: JdAnalysis | null }): Promise<{ recon: Recon }> {
  // ① 的候选形如「字节 · 豆包多模态」，搜索只用公司那一段
  const company = state.jdAnalysis?.orgGuess?.candidates?.[0]?.name?.split("·")[0].trim() ?? "";
  if (!company) {
    return {
      recon: {
        status: "skipped",
        searchedName: "",
        note: "JD 里没认出是哪家公司，这次没背调。投递前用公司全称自己查一下（企查查 / 天眼查），重点看成立时间、经营异常和投诉。",
      },
    };
  }

  try {
    const results = await search(buildReconQuery(company));
    const evidence = results
      .map((r, i) => `[${i + 1}] ${r.title ?? ""}\n${r.url ?? ""}\n${(r.content ?? "").slice(0, 800)}`)
      .join("\n\n");
    const findings = await callDeepSeekJson(
      reconSystemPrompt,
      buildReconUserPrompt({ company, position: state.jdAnalysis?.jobTitle ?? "", evidence }),
      validateReconFindings,
      { maxTokens: 2000 }
    );
    const sources = results.filter((r) => r.url).map((r) => ({ title: r.title ?? "", url: r.url! }));
    return { recon: { status: "ok", searchedName: company, sources, ...findings } };
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e);
    return {
      recon: {
        status: "failed",
        searchedName: company,
        note: `背调没跑成（${why}），不影响研判结果；可以在军师聊天里点「背调公司」再试。`,
      },
    };
  }
}
