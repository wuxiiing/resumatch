// 量化 ③ 的稳定性：①② 各跑一次固定下来，然后用同样输入重复跑 ③ 五次，看档位 tier 摆不摆。
// 改成"信号→后端定档"后，期望 tier 五次完全一致。
// 运行：node --experimental-strip-types --env-file=.env.local scripts/check-verdict.mts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { jdAnalysisNode } from "../lib/agents/jd-analysis/node.ts";
import { resumeEvidenceNode } from "../lib/agents/resume-evidence/node.ts";
import { matchJudgeNode } from "../lib/agents/match-judge/node.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const jobDescription = readFileSync(join(root, "测试jd.txt"), "utf-8").trim();
const resumeText = readFileSync(join(root, "测试简历.txt"), "utf-8").trim();
const userIntent = {
  targetDirection: "AI 产品经理（AI PM）方向",
  hardNo: ["纯数据运营 / 数据分析方向的岗位", "纯执行、没有产品参与空间的角色"],
};

console.log("先跑 ①② 各一次，固定输入…");
const { jdAnalysis } = await jdAnalysisNode({ jobDescription });
const { resumeEvidence } = await resumeEvidenceNode({ resumeText });

console.log("\n用同一份 ①② 输入，重复跑 ③ 五次，看档位稳不稳：\n");
for (let i = 1; i <= 5; i++) {
  const { matchJudgment: m } = await matchJudgeNode({ jdAnalysis, resumeEvidence, userIntent });
  const s = m.signals;
  console.log(
    `第 ${i} 次 → 【${m.tier}】${m.isBoundary ? "·边界" : ""}  ` +
      `(信号: 方向=${s.directionFit} / 踩排斥=${s.hitsHardNo} / 成长空间=${s.growthRoom})`
  );
}
