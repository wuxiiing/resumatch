// prebuild: pdfjs-dist 的 wasm/cmaps/standard_fonts 复制到 public/ 下。
// Vercel serverless 环境中 process.cwd()/node_modules 路径可能不稳定，
// 放到 public/ 后用 process.cwd()/public/pdfjs 引用，保证部署时路径一定对。

import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve("pdfjs-dist/package.json"));
const destRoot = join(process.cwd(), "public", "pdfjs");

mkdirSync(destRoot, { recursive: true });

for (const dir of ["wasm", "cmaps", "standard_fonts"]) {
  const src = join(pdfjsRoot, dir);
  const dest = join(destRoot, dir);
  console.log(`[copy-pdfjs] ${src} → ${dest}`);
  cpSync(src, dest, { recursive: true });
}

console.log("[copy-pdfjs] done.");
