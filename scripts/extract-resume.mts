// 用 MVP 自带的 parsePdfResume() 提取真实简历 PDF → 麦桐_简历.txt。
// 复用产品的解析能力，也顺带验证真实 PDF 解析。
// 运行：node --experimental-strip-types scripts/extract-resume.mts

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parsePdfResume } from "../lib/parse-pdf.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const buffer = readFileSync(join(root, "麦桐_简历.pdf"));
const result = await parsePdfResume(buffer);

writeFileSync(join(root, "麦桐_简历.txt"), result.text, "utf-8");
console.log(`✅ 提取完成，共 ${result.charCount} 字 → 麦桐_简历.txt`);
console.log("\n--- 前 600 字预览 ---");
console.log(result.text.slice(0, 600));
