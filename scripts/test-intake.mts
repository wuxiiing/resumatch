// P2 验证:文字分诊(内置样例,不含个人数据)+ 槽位状态机;可选传一张图测图片分诊。
// 跑法:
//   node --experimental-strip-types --env-file=.env.local scripts/test-intake.mts
//   node --experimental-strip-types --env-file=.env.local scripts/test-intake.mts "E:\路径\某图.png"

import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { classifyIntakeText, nextIntakeStep } from "../lib/agents/intake.ts";
import { extractIntakeImage } from "../lib/agents/vision-intake.ts";

const SAMPLES: Array<[string, string]> = [
  ["目标一句话", "我想投AI产品经理,最好是大厂,不接受纯销售岗"],
  [
    "JD 粘贴",
    "岗位职责:1.负责智能客服产品规划与迭代;2.协同算法团队落地大模型能力。任职要求:1.本科及以上;2.三年产品经验;3.熟悉Prompt工程。薪资:25-40K。",
  ],
  ["闲聊", "你觉得今年行情怎么样"],
];

for (const [label, text] of SAMPLES) {
  const t0 = Date.now();
  const r = await classifyIntakeText(text);
  console.log(`[${label}] kind=${r.kind} goal=${JSON.stringify(r.goal)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

console.log("\n─ 槽位状态机(纯逻辑,不调模型)─");
console.log("空:", nextIntakeStep({ hasResume: false, hasJd: false }).ask);
console.log("有简历:", nextIntakeStep({ hasResume: true, hasJd: false }).ask);
console.log("有JD:", nextIntakeStep({ hasResume: false, hasJd: true }).ask);
console.log("齐了 ready=", nextIntakeStep({ hasResume: true, hasJd: true }).ready);

const imgPath = process.argv[2];
if (imgPath) {
  const ext = extname(imgPath).slice(1).toLowerCase() || "png";
  const mime = ext === "jpg" ? "jpeg" : ext;
  const dataUrl = `data:image/${mime};base64,${readFileSync(imgPath).toString("base64")}`;
  const t0 = Date.now();
  const r = await extractIntakeImage(dataUrl);
  if (r.kind === "resume") {
    console.log(`\n[图片] kind=resume name=${r.resume.name} sections=${r.resume.sections.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } else if (r.kind === "jd") {
    console.log(`\n[图片] kind=jd 全文 ${r.jdText.length} 字,开头: ${r.jdText.slice(0, 60)}… (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } else {
    console.log(`\n[图片] kind=other note=${r.note} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}
