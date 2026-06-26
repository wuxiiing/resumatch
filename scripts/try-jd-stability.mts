// 稳定性测试：同一份 JD 连跑 3 次，对比"真身"，看解读稳不稳、是否都有立场。
// 运行：node --experimental-strip-types --env-file=.env.local scripts/try-jd-stability.mts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { graph } from "../lib/agents/graph.ts";

const here = dirname(fileURLToPath(import.meta.url));
const jobDescription = readFileSync(join(here, "..", "测试jd.txt"), "utf-8").trim();

for (let i = 1; i <= 3; i++) {
  const t0 = Date.now();
  const { jdAnalysis } = await graph.invoke({ jobDescription });
  const ms = Date.now() - t0;
  console.log(
    `\n===== 第 ${i} 次（${ms}ms，signals ${jdAnalysis!.signals.length} 条 / infoGaps ${jdAnalysis!.infoGaps.length} 条）=====`
  );
  console.log("真身：" + jdAnalysis!.realIdentity);
}
