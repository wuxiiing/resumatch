// 一次性跑完 ①→②→③→④ pipeline：喂 测试jd.txt + 测试简历.txt + 用户意图，打印全程。
// 运行：node --experimental-strip-types --env-file=.env.local scripts/try-pipeline.mts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { graph } from "../lib/agents/graph.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const jobDescription = readFileSync(join(root, "测试jd.txt"), "utf-8").trim();
const resumeText = readFileSync(join(root, "测试简历.txt"), "utf-8").trim();

const userIntent = {
  targetDirection: "AI 产品经理（AI PM）方向",
  hardNo: ["纯数据运营 / 数据分析方向的岗位", "纯执行、没有产品参与空间的角色"],
};

const t0 = Date.now();
const r = await graph.invoke({ jobDescription, resumeText, userIntent });
const ms = Date.now() - t0;

console.log("=== ① JD 真身 ===");
console.log(r.jdAnalysis!.realIdentity);

console.log("\n=== ② 简历牌面 ===");
console.log(r.resumeEvidence!.summary);

console.log("\n=== ③ 匹配判断（结合你的意图）===");
for (const g of r.matchJudgment!.gaps) console.log(`  [${g.status}] ${g.need} —— ${g.note}`);
const m = r.matchJudgment!;
console.log(`\n判断：【${m.tier}】${m.isBoundary ? "（边界，需你自己权衡）" : ""}`);
console.log("分析：" + m.reasoning);
if (m.isBoundary) console.log("权衡：" + m.tradeoff);

console.log("\n=== ④ 怎么打 ===");
console.log("简历·扬长：" + r.actionPlan!.resumeStrategy.highlight);
console.log("简历·避短：" + r.actionPlan!.resumeStrategy.downplay);
console.log("面试：");
for (const t of r.actionPlan!.interviewTips) console.log("  - " + t);
console.log("谈薪：" + r.actionPlan!.salaryTip);

console.log(`\n①→②→③→④ 全跑完，耗时 ${ms}ms`);
