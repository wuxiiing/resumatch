// P1 验证：本地一张简历图片 → 豆包视觉 → 结构化简历 JSON（与文本简历同 schema）。
// 跑法（先把 ARK_API_KEY 放进 .env.local）：
//   node --experimental-strip-types --env-file=.env.local scripts/test-vision.mts "E:\路径\简历.png"

import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { callDoubaoVisionJson } from "../lib/agents/doubao-vision.ts";
import { RESUME_STRUCTURE_SYSTEM, validateStructuredResume } from "../lib/resume-structured.ts";

const imgPath = process.argv[2];
if (!imgPath) {
  console.error('用法: node --experimental-strip-types --env-file=.env.local scripts/test-vision.mts "<简历图片路径>"');
  process.exit(1);
}

const ext = (extname(imgPath).slice(1).toLowerCase() || "png");
const mime = ext === "jpg" ? "jpeg" : ext;
const b64 = readFileSync(imgPath).toString("base64");
const dataUrl = `data:image/${mime};base64,${b64}`;

const USER =
  "这是一张简历图片。请阅读图片中的全部文字内容,按系统要求整理成结构化简历 JSON。只重组、保持原文信息,绝不编造、不夸大。";

const t0 = Date.now();
const structured = await callDoubaoVisionJson(RESUME_STRUCTURE_SYSTEM, USER, dataUrl, validateStructuredResume, {
  maxTokens: 4000,
});
console.log(JSON.stringify(structured, null, 2));
console.error(`OK in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
