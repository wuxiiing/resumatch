// 真实验收：用真实简历 + 真实意图，跑三个真实 JD，看立体判断（档位+分叉+避雷+时限）。
// 运行：node --experimental-strip-types --env-file=.env.local scripts/test-real.mts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { graph } from "../lib/agents/graph.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const resumeText = readFileSync(join(root, "麦桐_简历.txt"), "utf-8").trim();

const userIntent = {
  targetDirection: "AI 产品经理（AI PM）方向",
  hardNo: ["纯数据运营 / 数据分析方向的岗位", "纯执行、没有产品参与空间的角色"],
};

const jds = [
  { name: "字节 · 多模态AI助手", file: "测试jd-字节.txt" },
  { name: "米哈游 · AI应用产品经理", file: "测试jd-米哈游.txt" },
  { name: "丁香园 · 医药AI产品经理", file: "测试jd-丁香园.txt" },
];

for (const jd of jds) {
  const jobDescription = readFileSync(join(root, jd.file), "utf-8").trim();
  const r = await graph.invoke({ jobDescription, resumeText, userIntent });
  const m = r.matchJudgment!;
  const s = m.signals;

  console.log(`\n================ ${jd.name} ================`);
  console.log("① 真身：" + r.jdAnalysis!.realIdentity);
  console.log(`③ 判断：【${m.tier}】${m.isBoundary ? "·边界" : ""}`);
  console.log(`   信号：方向=${s.directionFit} / 踩排斥=${s.hitsHardNo} / 成长空间=${s.growthRoom}`);
  if (m.fork) {
    console.log(`   🔀 分叉（取决于：${m.fork.dependsOn}）`);
    console.log(`      若是：${m.fork.ifYes}`);
    console.log(`      若否：${m.fork.ifNo}`);
  }
  if (m.warnings.length) console.log(`   ⚠️ 避雷：${m.warnings.join("；")}`);
  if (m.timeHint) console.log(`   ⏳ 时限：${m.timeHint}`);
  console.log("   权衡：" + m.tradeoff);
}

console.log("\n================ 三个 JD 全跑完 ================");
