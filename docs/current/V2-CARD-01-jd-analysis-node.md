# V2-CARD-01 · ① JD 深度解读节点

> 第一张施工卡 ｜ 2026-06-24 ｜ 上位文档：`V2-SPEC-0001.md` §8
> 建议工种：CC 主导（节点架构 + prompt 设计）；测试脚本可 DS 代写

## 目标（一句话）

用 langgraphjs 搭出**第一个独立节点**——JD 深度解读：把一份 JD 扒成「真身 + 它要什么人 + 关键潜台词信号」，达到对话里 demo 验证过的那个深度。

## 为什么先做它

- 它是**灵魂**（产品核心价值就是这个）；
- 它**不依赖用户意图**（只读 JD 客观真身），是四层里最适合第一个独立验证的；
- 跑通它 = 一次性验证整条路线的三个关键假设（见「验收」）。

## 范围

**允许新增**：
- `package.json`：加 `@langchain/langgraph`、`@langchain/core` 依赖
- `lib/agents/jd-analysis/node.ts` —— JD 解读节点实现
- `lib/agents/jd-analysis/prompt.ts` —— JD 解读 prompt（从现有 `lib/analysis-prompt.ts` 的「JD 三层穿透法」扩展加深）
- `lib/agents/jd-analysis/schema.ts` —— 输出结构 + 校验（复用 `lib/analysis-schema.ts` 的校验风格）
- `lib/agents/graph.ts` —— 最小 LangGraph（暂时只有这一个节点，留扩展位）
- `scripts/try-jd-node.mjs` —— 本地跑测脚本（喂 `测试jd.txt`，打印结果）

**禁止动**：
- 现有 analyze 链路（`lib/deepseek-client.ts` / `lib/analysis-prompt.ts` / `app/api/analyze/route.ts`）——新节点先独立跑，**不碰现有 MVP**
- 前端（`app/`）——本卡不接前端
- ②③④⑤ 节点、用户意图采集——后续卡

## 输入 / 输出

**输入**：`{ jobDescription: string }`

**输出（JD 解读结构）**：
```
{
  realIdentity: string,        // 真身：穿透包装，这岗到底是什么
  whoTheyWant: string,         // 它要什么人：JD 背后真实画像
  signals: [                   // 关键潜台词/信号（从命名、措辞、职责软硬推出的）
    { fromText: string, reads: string }   // fromText = JD 原句，reads = 潜台词
  ],
  infoGaps: string[]           // JD 缺哪些关键信息（为后续对话追问铺垫）
}
```
注：「对你意味什么 / 怎么打」（四层的后两层）依赖**用户意图**，**本卡不做**，留给接入用户意图后的 ③④ 节点。

## 实现要点

- 节点内部仍是**一次 DeepSeek 调用**，但**职责单一**：只做 JD 解读，不掺简历批注 / 评分——这正是拆开的意义。
- prompt 从现有「JD 三层穿透法」（文本拆解 → 逻辑串联 → 本质提炼）扩展，加 demo 验证过的「潜台词推理」风格（例：招「AI 产品**运营**」而非「产品运营」→ 推出公司真实意图）。
- 复用现有防御思路：`response_format: json_object`、JSON 解析容错、结构校验、失败重试（从 `deepseek-client.ts` **借模式写进新节点**，不改老文件）。
- 运行：本地用 `node --experimental-strip-types`（本环境既定的 TS 运行方式；`ts-node` 在此环境脆，别用）。

## 验收（跑通三件事就算成）

1. **能跑通**：langgraphjs 在本环境（`node --experimental-strip-types`）能编排并执行这个节点，无运行时错。〔这是第一个要验证的未知——langgraphjs 在本 TS 运行方式下能否跑〕
2. **够深**：喂 `测试jd.txt`（数据运营 JD），输出的 `realIdentity` / `whoTheyWant` / `signals` 人工评判 ≈ demo 深度（能看穿「挂 AI 羊头、内核数据运营」）。
3. **结构稳**：连跑 3 次，输出都能通过 schema 校验、JSON 可解析。

## 不做（写清楚防膨胀）

用户意图采集、②③④⑤ 节点、前端接入、评分、企业背景 tool——都不在本卡。

## 验证命令

- `node --experimental-strip-types scripts/try-jd-node.mjs`（打印解读结果，人工看深度）
- `npm run lint` / `npm run build`（确认不破坏现有构建）
