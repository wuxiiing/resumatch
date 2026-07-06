// 文字入场分诊：一段文字 → jd / goal / resume / other（+ 提炼的求职意向）。
// 轻调用；槽位判断在前端做，后端只管分类。

import { apiPost } from "@/lib/api-helpers";
import { classifyIntakeText } from "@/lib/agents/intake.ts";

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = apiPost({ credit: "intake", requireKey: "DEEPSEEK_API_KEY" }, async (body) => {
  const text = String(body.text ?? "").trim();
  if (!text) throw new Error("缺少文字内容。");
  return classifyIntakeText(text);
});
