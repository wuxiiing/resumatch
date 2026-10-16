// 判级评测集 runner：拿人工标注卷当「标准答案」，让 ResuMatch 每题跑 k 遍，自动阅卷。
// 数据（JD / 简历 / 答案）放在仓库外的私有目录，本脚本只有代码。
//
// 用法（在 ResuMatch 根目录）：
//   先自检：node --experimental-strip-types --no-warnings scripts/eval-verdict.mts <评测集目录> --dry
//   正式跑：node --experimental-strip-types --no-warnings --env-file=.env.local scripts/eval-verdict.mts <评测集目录> [--runs 3] [--concurrency 3] [--only C01,C05]
//   重出报告（不调模型）：node --experimental-strip-types --no-warnings scripts/eval-verdict.mts <评测集目录> --report <评测集目录>/results/<时间戳>
//
// <评测集目录> 需要：标注卷.md（人工答案）、cases/Cxx.txt（JD）、resume.txt、intent.json
// 结果写到 <评测集目录>/results/<时间戳>/：runs.jsonl（每次运行一行，边跑边写）+ summary.md（指标 + 错题清单）

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

type Tier = "目标" | "跳板" | "该绕开";
type Label = { id: string; tier: Tier; boundary: boolean; reason: string };
type Run = {
  id: string; run: number; tier: Tier | null; ms: number;
  isBoundary?: boolean; signals?: { directionFit: string; hitsHardNo: boolean; growthRoom: string };
  reasoning?: string; error?: string;
};
const TIERS: Tier[] = ["目标", "跳板", "该绕开"];

function normTier(s: string): Tier | null {
  if (s.startsWith("目标")) return "目标";
  if (s.startsWith("跳板")) return "跳板";
  if (s.includes("绕开")) return "该绕开";
  return null;
}

// ── 读标注卷：每题是「## Cxx · …」开头的一节，答案在「> 判级…：」这几行 ──
function parseLabels(md: string) {
  const labels: Label[] = [], blank: string[] = [], bad: string[] = [];
  for (const sec of md.split(/^## /m).slice(1)) {
    const id = sec.match(/^(C\d{2})/)?.[1];
    if (!id) continue;
    const field = (name: string) =>
      sec.match(new RegExp(`^>\\s*${name}[^:：\\n]*[:：][ \\t]*(.*)$`, "m"))?.[1].trim() ?? "";
    const raw = field("判级");
    if (!raw) { blank.push(id); continue; }
    const tier = normTier(raw);
    if (!tier) { bad.push(`${id}「${raw}」`); continue; }
    labels.push({ id, tier, boundary: field("边界").startsWith("是"), reason: field("理由") });
  }
  return { labels, blank, bad };
}

// 没跑出结果的归类：去掉重试前缀；JSON 报错的位置数字每次不同，按两种坏法合并，不然数不清
function errKind(e: string) {
  const m = e.replace(/^DeepSeek 调用重试 \d+ 次后仍失败：/, "").replace("HTTP 402", "HTTP 402 余额不足");
  if (/JSON at position/.test(m)) return /after JSON/.test(m) ? "JSON 后面多出内容" : "JSON 中途坏了（截断或引号没转义）";
  return m.slice(0, 40);
}

// ── 阅卷：逐次一致率 / pass^k（k 次全判对）/ 稳定率（k 次完全一样）/ 混淆表 / 耗时 ──
function summarize(labels: Label[], runs: Run[], k: number) {
  const ok = runs.filter((r) => r.tier);
  const ans = new Map(labels.map((l) => [l.id, l.tier]));
  const byId = new Map<string, Run[]>();
  for (const r of runs) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);
  const full = labels.filter((l) => (byId.get(l.id) ?? []).filter((r) => r.tier).length === k);
  const tiersOf = (id: string) => byId.get(id)!.map((r) => r.tier);
  const confusion = Object.fromEntries(TIERS.map((a) => [a, Object.fromEntries(TIERS.map((p) => [p, 0]))]));
  for (const r of ok) confusion[ans.get(r.id)!][r.tier!] += 1;
  const ms = ok.map((r) => r.ms).sort((a, b) => a - b);
  // 每档的精确率 / 召回率 / F1（逐次统计）。precision 为 null = 模型从没判过这档；recall 为 null = 这档没有跑通的题
  const per = TIERS.map((c) => {
    const tp = confusion[c][c];
    const predicted = TIERS.reduce((n, a) => n + confusion[a][c], 0);
    const actual = TIERS.reduce((n, p) => n + confusion[c][p], 0);
    const precision = predicted ? tp / predicted : null;
    const recall = actual ? tp / actual : null;
    const f1 = precision && recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { tier: c, cases: labels.filter((l) => l.tier === c).length, predicted, precision, recall, f1 };
  });
  // 瞎猜基线：永远猜「标注里最多的那档」能拿多少准确率，模型至少要比它高才算有用
  const [topTier, topN] = TIERS.map((t) => [t, labels.filter((l) => l.tier === t).length] as const).sort((a, b) => b[1] - a[1])[0];
  const isBoundary = new Map(labels.map((l) => [l.id, l.boundary]));
  const split = (b: boolean) => {
    const rs = ok.filter((r) => isBoundary.get(r.id) === b);
    return { correct: rs.filter((r) => r.tier === ans.get(r.id)).length, n: rs.length };
  };
  return {
    correct: ok.filter((r) => r.tier === ans.get(r.id)).length,
    okRuns: ok.length,
    errors: runs.length - ok.length,
    passAtK: labels.filter((l) => (byId.get(l.id) ?? []).some((r) => r.tier === l.tier)).length,
    passK: full.filter((l) => tiersOf(l.id).every((t) => t === l.tier)).length,
    stableK: full.filter((l) => new Set(tiersOf(l.id)).size === 1).length,
    nCases: labels.length,
    confusion,
    per,
    macroF1: per.reduce((a, x) => a + x.f1, 0) / TIERS.length,
    majority: { tier: topTier, acc: labels.length ? topN / labels.length : 0 },
    hard: split(false), // 你没标边界的题：错了 = 硬错
    soft: split(true), // 你标了边界的题：错了 = 软错
    avgMs: ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0,
    p50Ms: ms.length ? ms[Math.ceil(ms.length * 0.5) - 1] : 0,
    p95Ms: ms.length ? ms[Math.ceil(ms.length * 0.95) - 1] : 0,
    // 判错 = 跑出了结果但档位不对；没跑出结果的另算，不混进错题
    wrong: labels.filter((l) => (byId.get(l.id) ?? []).some((r) => r.tier && r.tier !== l.tier)),
    failKinds: runs.filter((r) => !r.tier).reduce<Record<string, number>>((acc, r) => {
      const kind = errKind(r.error ?? "");
      acc[kind] = (acc[kind] ?? 0) + 1;
      return acc;
    }, {}),
    failedIds: labels.flatMap((l) => {
      const n = (byId.get(l.id) ?? []).filter((r) => !r.tier).length;
      return n ? [`${l.id}×${n}`] : [];
    }),
  };
}

function selftest() {
  const md = "x\n## C01 · A\n> 判级（目标/跳板/该绕开）：目标\n> 边界（是/否）：是\n> 理由：r1\n" +
    "## C02 · B\n> 判级（目标/跳板/该绕开）：绕开\n## C03 · C\n> 判级（目标/跳板/该绕开）：\n## C04 · D\n> 判级（目标/跳板/该绕开）：不知道\n" +
    "## C05 · E\n> 判级（目标/跳板/该绕开）：跳板\n";
  const p = parseLabels(md);
  assert.deepEqual(p.labels.map((l) => [l.id, l.tier, l.boundary]), [["C01", "目标", true], ["C02", "该绕开", false], ["C05", "跳板", false]]);
  assert.deepEqual(p.blank, ["C03"]);
  assert.equal(p.bad.length, 1);
  const r = (id: string, tier: Tier | null, ms: number, error?: string): Run => ({ id, run: 0, tier, ms, error });
  const pre = "DeepSeek 调用重试 2 次后仍失败：";
  const s = summarize(p.labels, [r("C01", "目标", 10), r("C01", "目标", 20), r("C01", "目标", 30),
    r("C02", "跳板", 40), r("C02", "该绕开", 50), r("C02", "该绕开", 60),
    r("C05", null, 1, pre + "Expected ',' or '}' after property value in JSON at position 1143 (line 1 column 1144)"),
    r("C05", null, 1, pre + "Unexpected non-whitespace character after JSON at position 1775 (line 1 column 1776)"),
    r("C05", null, 1, pre + "DeepSeek 请求失败：HTTP 402")], 3);
  assert.equal(s.correct, 5); assert.equal(s.okRuns, 6); assert.equal(s.errors, 3);
  assert.equal(s.passK, 1); assert.equal(s.stableK, 1);
  assert.equal(s.p95Ms, 60); assert.equal(s.confusion["该绕开"]["跳板"], 1);
  assert.deepEqual(s.wrong.map((l) => l.id), ["C02"]); // C05 只是没跑出结果，不算判错
  assert.deepEqual(s.failKinds, { "JSON 中途坏了（截断或引号没转义）": 1, "JSON 后面多出内容": 1, "DeepSeek 请求失败：HTTP 402 余额不足": 1 });
  assert.deepEqual(s.failedIds, ["C05×3"]);
  assert.equal(shouldTrip(5, 5), false); assert.equal(shouldTrip(6, 4), true); assert.equal(shouldTrip(6, 3), false);
  assert.equal(s.passAtK, 2); assert.equal(s.p50Ms, 30);
  assert.deepEqual(s.per.map((x) => [x.tier, x.precision, x.recall, Number(x.f1.toFixed(2))]),
    [["目标", 1, 1, 1], ["跳板", 0, null, 0], ["该绕开", 1, 2 / 3, 0.8]]);
  assert.equal(Number(s.macroF1.toFixed(2)), 0.6);
  assert.deepEqual(s.majority, { tier: "目标", acc: 1 / 3 });
  assert.deepEqual([s.hard, s.soft], [{ correct: 2, n: 3 }, { correct: 3, n: 3 }]);
}

// 熔断：跑满 6 次后失败过半就别再派新任务（管线坏了时重试只会成倍花钱）
const shouldTrip = (done: number, failed: number) => done >= 6 && failed / done > 0.5;

// ── 参数 ──
const args = process.argv.slice(2);
const evalDir = args.find((a) => !a.startsWith("--"));
const opt = (name: string, d: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : d; };
if (!evalDir) throw new Error("用法：eval-verdict.mts <评测集目录> [--dry] [--runs 3] [--concurrency 3] [--only C01,C05]");
const k = Number(opt("runs", "3"));
const only = opt("only", "").split(",").filter(Boolean);

const { labels: allLabels, blank, bad } = parseLabels(fs.readFileSync(path.join(evalDir, "标注卷.md"), "utf8"));
const labels = only.length ? allLabels.filter((l) => only.includes(l.id)) : allLabels;
const jdOf = (id: string) => fs.readFileSync(path.join(evalDir, "cases", `${id}.txt`), "utf8");
for (const l of labels) jdOf(l.id); // 缺考卷文件会在这里直接报错

if (args.includes("--dry")) {
  selftest();
  console.log(`自检通过｜已标 ${allLabels.length} 题，未标 ${blank.length} 题，填写有误 ${bad.length} 题${bad.length ? "：" + bad.join("、") : ""}`);
  console.log(`将要跑：${labels.length} 题 × ${k} 次 = ${labels.length * k} 次研判（每次 4 个节点调用）`);
  process.exit(0);
}
if (bad.length) throw new Error("标注卷有填写错误，先改：" + bad.join("、"));
if (!labels.length) throw new Error("还没有标好的题。");

// --report <结果目录>：不调模型，拿已有的 runs.jsonl 按当前标注卷重出 summary.md（改报告格式或改答案后不用重新花钱跑）
const reportDir = opt("report", "");
const stamp = reportDir ? path.basename(reportDir) : new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const outDir = reportDir || path.join(evalDir, "results", stamp);
const runsPath = path.join(outDir, "runs.jsonl");
let gitRev = "unknown";
try {
  const root = path.join(import.meta.dirname, "..");
  gitRev = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
  // 产品代码有没提交的改动时要标出来，否则修复前后两次评测会显示同一个版本号
  if (execSync("git status --porcelain -- lib app", { cwd: root }).toString().trim()) gitRev += "+未提交改动";
} catch { /* 非 git 环境 */ }
// 表头的模型和代码版本：跑的时候存进 meta.json；重出报告时用当时存的，没存过才退回现在的并注明
const metaPath = path.join(outDir, "meta.json");
const nowMeta = { model: process.env.DEEPSEEK_MODEL || "deepseek-flash（默认）", gitRev };
const meta: typeof nowMeta = !reportDir ? nowMeta
  : fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
  : { model: nowMeta.model + "（重出报告时的配置）", gitRev: gitRev + "（重出报告时的版本，不一定是当时跑的）" };
const runs: Run[] = reportDir
  ? fs.readFileSync(runsPath, "utf8").trim().split("\n").map((line) => JSON.parse(line) as Run)
      .filter((r) => labels.some((l) => l.id === r.id))
  : [];

// ── 跑：简单的并发池，每完成一次就落盘一行，中途断了也不丢已跑的结果 ──
if (!reportDir) {
  const { graph } = await import("../lib/agents/graph.ts");
  const resumeText = fs.readFileSync(path.join(evalDir, "resume.txt"), "utf8");
  const userIntent = JSON.parse(fs.readFileSync(path.join(evalDir, "intent.json"), "utf8"));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
  const tasks = labels.flatMap((l) => Array.from({ length: k }, (_, run) => ({ id: l.id, run })));
  let next = 0, done = 0, failed = 0;
  await Promise.all(Array.from({ length: Math.min(Number(opt("concurrency", "3")), tasks.length) }, async () => {
    while (next < tasks.length && !shouldTrip(done, failed)) {
      const { id, run } = tasks[next++];
      const t0 = Date.now();
      let rec: Run;
      try {
        const r = await graph.invoke({ jobDescription: jdOf(id), resumeText, userIntent });
        const m = r.matchJudgment!;
        rec = { id, run, tier: m.tier, isBoundary: m.isBoundary, signals: m.signals, reasoning: m.reasoning, ms: Date.now() - t0 };
      } catch (e) {
        rec = { id, run, tier: null, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
      }
      runs.push(rec);
      fs.appendFileSync(runsPath, JSON.stringify(rec) + "\n");
      if (rec.error) failed += 1;
      console.log(`[${++done}/${tasks.length}] ${id}#${run + 1} ${rec.error ? "失败" : "完成"} ${(rec.ms / 1000).toFixed(0)}s`);
    }
  }));
  if (shouldTrip(done, failed)) console.log(`\n熔断：跑了 ${done} 次、失败 ${failed} 次，后面的没再跑。先修管线再测。`);
}

// ── 写 summary.md ──
const s = summarize(labels, runs, k);
const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : "0") + "%";
const titleOf = (id: string) => jdOf(id).split("\n")[0];
const sig = (r?: Run) => r?.signals ? `方向=${r.signals.directionFit} / 踩雷=${r.signals.hitsHardNo} / 成长空间=${r.signals.growthRoom}` : "（无）";
const md = [
  `# 判级评测 · ${stamp}`, "",
  `- 模型：${meta.model}｜代码：${meta.gitRev}｜每题 ${k} 次｜${s.nCases} 题（另有 ${blank.length} 题未标）`,
  `- **跑通率**：${pct(s.okRuns, runs.length)}（${s.okRuns}/${runs.length}；没跑出结果的 ${s.errors} 次不算判错，原因见下）`,
  `- **准确率 Accuracy（逐次，只算跑通的）**：${pct(s.correct, s.okRuns)}（${s.correct}/${s.okRuns}）｜对照：永远猜「${s.majority.tier}」的瞎猜基线 ${pct(s.majority.acc, 1)}`,
  `- **pass@${k}（${k} 次里至少 1 次判对）**：${pct(s.passAtK, s.nCases)}（${s.passAtK}/${s.nCases}）`,
  `- **pass^${k}（${k} 次都跑通且都判对）**：${pct(s.passK, s.nCases)}（${s.passK}/${s.nCases}）`,
  `- **一致性 Consistency（${k} 次都跑通且判级一样）**：${pct(s.stableK, s.nCases)}（${s.stableK}/${s.nCases}）`,
  `- **宏平均 F1（Macro-F1）**：${s.macroF1.toFixed(2)}（三档各自 F1 的平均，0～1，见下方各档表现）`,
  `- **非边界题准确率**（错了算硬错）：${pct(s.hard.correct, s.hard.n)}（${s.hard.correct}/${s.hard.n}）｜**边界题准确率**（错了算软错）：${pct(s.soft.correct, s.soft.n)}（${s.soft.correct}/${s.soft.n}）`,
  `- 耗时（只算跑通的）：P50 ${(s.p50Ms / 1000).toFixed(1)}s｜平均 ${(s.avgMs / 1000).toFixed(1)}s｜P95 ${(s.p95Ms / 1000).toFixed(1)}s`, "",
  "## 混淆表（行 = 你的答案，列 = 模型判级，单位：次）", "",
  "| 你 \\ 模型 | 目标 | 跳板 | 该绕开 |", "|---|---|---|---|",
  ...TIERS.map((a) => `| ${a} | ${TIERS.map((p) => s.confusion[a][p]).join(" | ")} |`), "",
  "## 各档表现（逐次统计）", "",
  "精确率 = 模型判成这档的里面，真是这档的比例；召回率 = 真是这档的里面，模型判对的比例；F1 = 两者的调和平均。", "",
  "| 档 | 你标的题数 | 模型判成这档（次） | 精确率 Precision | 召回率 Recall | F1 |", "|---|---|---|---|---|---|",
  ...s.per.map((x) => `| ${x.tier} | ${x.cases} | ${x.predicted} | ${x.precision === null ? "—（从没判过）" : pct(x.precision, 1)} | ${x.recall === null ? "—" : pct(x.recall, 1)} | ${x.f1.toFixed(2)} |`), "",
  ...(s.errors ? [
    "## 没跑出结果（单位：次）", "",
    "| 原因 | 次数 |", "|---|---|",
    ...Object.entries(s.failKinds).sort((a, b) => b[1] - a[1]).map(([kind, n]) => `| ${kind} | ${n} |`), "",
    `涉及：${s.failedIds.join("、")}`, "",
  ] : []),
  "## 判错清单（跑出了结果但档位不对；badcase 候选：逐条填「归因」，再按归因归类计数）", "",
  ...(s.wrong.length ? s.wrong.flatMap((l) => {
    const rs = runs.filter((r) => r.id === l.id).sort((a, b) => a.run - b.run);
    const firstWrong = rs.find((r) => r.tier && r.tier !== l.tier);
    return [
      `### ${l.id} · ${titleOf(l.id)}`,
      `- 你：${l.tier}${l.boundary ? "（你标了边界）" : ""}｜模型：${rs.map((r) => r.tier ?? "失败").join(" / ")}`,
      `- 你的理由：${l.reason || "（没写）"}`,
      `- 模型信号：${sig(firstWrong)}`,
      `- 模型理由（节选）：${(firstWrong?.reasoning ?? "").slice(0, 200)}`,
      "- 归因：", "",
    ];
  }) : ["（没有）", ""]),
].join("\n");
fs.writeFileSync(path.join(outDir, "summary.md"), md);
console.log(`\n跑通率 ${pct(s.okRuns, runs.length)}｜准确率 ${pct(s.correct, s.okRuns)}｜pass@${k} ${pct(s.passAtK, s.nCases)}｜pass^${k} ${pct(s.passK, s.nCases)}｜一致性 ${pct(s.stableK, s.nCases)}｜Macro-F1 ${s.macroF1.toFixed(2)}｜判错 ${s.wrong.length} 题`);
console.log("报告：" + path.join(outDir, "summary.md"));
