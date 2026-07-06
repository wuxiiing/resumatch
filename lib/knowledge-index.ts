// 简配 · 知识库索引引擎
// 启动时从 knowledge/*.md 加载到内存，提供：
//   1. search(query) → 关键词召回 top-K 相关段落（方法论文档 01/02）
//   2. matchMajor(text) → 从简历/问题中检测专业名，返回岗位推荐（03 专业岗位库）
// 不做向量化、不引入外部依赖；~100KB 语料常驻内存，keywords 匹配足够精准。

import fs from "fs";
import path from "path";

// ── 类型 ──

export interface Paragraph {
  heading: string; // 所属节标题（如 "心态建设"）
  text: string; // 段落内容，≤400 字
  keywords: string[]; // 预提取关键词
}

export interface MajorEntry {
  major: string; // 专业名（如 "环境设计"）
  rawBlock: string; // 原文整段
}

export interface KnowledgeIndex {
  paragraphs: Paragraph[];
  majors: MajorEntry[];
}

// ── 模块级缓存（serverless 冷启动时重建，热实例复用） ──

let _index: KnowledgeIndex | null = null;

// ── 中文分词辅助 ──

// 按常见分隔符切短词（不做 jieba，用 bigram + 常用词匹配即可覆盖求职领域关键词）
function tokenize(s: string): string[] {
  const cleaned = s
    .replace(/[（(][^)）]*[)）]/g, "") // 去括号注
    .replace(/[“”""''「」『』《》<>\[\]【】]/g, "")
    .replace(/[，,。、；;：:！!？?\-—–……·\s]+/g, " ")
    .toLowerCase();
  const words = cleaned.split(" ").filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    if (w.length <= 1) continue;
    // bigram 切分（中文）
    for (let i = 0; i < w.length - 1; i++) {
      out.push(w.slice(i, i + 2));
    }
    // 也保留整词（英文/数字）
    if (/[a-z0-9]/.test(w)) out.push(w);
  }
  return [...new Set(out)];
}

function jaccardOverlap(a: string[], b: string[]): number {
  const sa = new Set(a);
  let hits = 0;
  for (const x of b) if (sa.has(x)) hits++;
  return hits / Math.max(1, Math.min(a.length, b.length));
}

// ── 解析 ──

function parseMethodology(raw: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  // 按 ## 分节
  const sections = raw.split(/^## /gm);
  for (const sec of sections) {
    if (!sec.trim()) continue;
    const lines = sec.split("\n");
    const heading = lines[0].replace(/^#+\s*/, "").trim();
    const body = lines.slice(1).join("\n").trim();
    if (!body) continue;
    // 按双换行切段落，合并短段
    const chunks = body.split(/\n{2,}/).filter((c) => c.trim().length > 15);
    for (const chunk of chunks) {
      const text = chunk.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 400);
      paragraphs.push({
        heading,
        text,
        keywords: tokenize(chunk)
      });
    }
  }
  return paragraphs;
}

function parseMajorDB(raw: string): MajorEntry[] {
  const entries: MajorEntry[] = [];
  // 03 文件格式：每节以专业名开头（单行），后续内容为该专业的多段岗位描述
  // 结构："专业名\n首先是…\n其次是…\n然后是…\n最后是…"
  const lines = raw.split("\n");
  let currentMajor = "";
  let blockLines: string[] = [];

  function flush() {
    if (currentMajor && blockLines.length > 0) {
      entries.push({ major: currentMajor, rawBlock: blockLines.join("\n").trim() });
    }
    blockLines = [];
    currentMajor = "";
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 跳过序言/说明行
    if (
      /^(专业|适合岗位|学姐|普遍误区|核心一句|企业招聘)/.test(trimmed) ||
      /^[①②③④⑤]/.test(trimmed) ||
      trimmed.startsWith("参考") ||
      trimmed.startsWith("注：") ||
      trimmed.length < 2
    )
      continue;

    // 检测新专业段起头：单行、不含"首先/其次/然后/最后/参考/除了/还有/然后是一/其次是/最后是/首先是"等衔接词
    const isTransition =
      /^(首先是|其次是|然后是|最后是|接着是|还有就是|然后就是|还有|参考|除了|另外|此外)/.test(trimmed);

    if (!isTransition && !trimmed.startsWith("-") && !trimmed.startsWith("①") && !trimmed.startsWith("1.")) {
      // 可能是新专业名
      // 专业名特征：纯中文/英文、长度 2-10 字符、不含标点
      const looksLikeMajor =
        /^[一-鿿\w]{2,12}$/.test(trimmed) && !/[，,。、；;：:！!？?\-·\s]/.test(trimmed);
      if (looksLikeMajor) {
        flush();
        currentMajor = trimmed;
        continue;
      }
    }

    if (currentMajor) {
      blockLines.push(trimmed);
    }
  }
  flush();

  return entries;
}

// ── 构建 & 搜索 ──

function build(): KnowledgeIndex {
  const knowledgeDir = path.join(process.cwd(), "knowledge");

  const paragraphs: Paragraph[] = [];
  for (const fn of ["01-求职攻略-心态简历面试.md", "02-求职四大误区.md"]) {
    try {
      const raw = fs.readFileSync(path.join(knowledgeDir, fn), "utf-8");
      paragraphs.push(...parseMethodology(raw));
    } catch {
      // 文件缺失不崩
    }
  }

  let majors: MajorEntry[] = [];
  try {
    const raw = fs.readFileSync(path.join(knowledgeDir, "03-专业适合岗位库.md"), "utf-8");
    majors = parseMajorDB(raw);
  } catch {
    /* ignore */
  }

  return { paragraphs, majors };
}

export function getIndex(): KnowledgeIndex {
  if (!_index) _index = build();
  return _index;
}

// ── 搜索 API ──

/** 关键词召回 topK 个方法论文段 */
export function search(query: string, topK = 3): Paragraph[] {
  const idx = getIndex();
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const scored = idx.paragraphs.map((p) => ({
    p,
    score: jaccardOverlap(p.keywords, qTokens) * (p.heading.length > 0 ? 1.1 : 1.0)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0.08).slice(0, topK).map((s) => s.p);
}

/** 从文本中检测已知专业名，返回匹配的岗位推荐（按匹配长度降序，最长匹配优先） */
export function matchMajor(text: string): MajorEntry | null {
  const idx = getIndex();
  // 按专业名长度降序排（"信息管理与信息系统" > "信息管理" 防短匹配）
  const sorted = [...idx.majors].sort((a, b) => b.major.length - a.major.length);
  for (const entry of sorted) {
    if (text.includes(entry.major)) {
      return entry;
    }
  }
  return null;
}

/** 列出所有已知专业名（给 prompt 用） */
export function listMajorNames(): string[] {
  return getIndex().majors.map((m) => m.major);
}

/** 把知识段落格式化成注入 prompt 的文本 */
export function formatForPrompt(paragraphs: Paragraph[]): string {
  if (paragraphs.length === 0) return "";
  return paragraphs
    .map((p) => `【${p.heading}】${p.text}`)
    .join("\n");
}
