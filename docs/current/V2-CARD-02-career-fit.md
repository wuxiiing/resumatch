# V2-CARD-02 · 方向校准（意愿 vs 现实）

> 定于 2026-06-27。承接 BUILD-PLAN「职业规划」一项，经与作者讨论**重定义**。本卡是该功能的单一真相源。

## 一句话
不是职业规划时间线，是「**你想去哪 vs 你的简历能托你去哪**」的对照器——对齐放行，错位诚实泼冷水。本质是「吃透简历」的纵深扩展，作者原话：「专门负责了解用户、分析简历的扩展」。

## 定位（别漂）
ResuMatch 的根是**扎在真实岗位上的研判**。本功能顺这个根长：从简历**客观现实**出发，校准用户的方向**意愿**，防止过度幻想。**不是 MBTI / 性格测评。**

## 输入（复用现有，不堆新表单）
- `resumeText` —— 简历，吃透。复用本地档案 `jianpei:profile.resumeText`
- `targetDirection` —— 意愿方向。复用 `profile.intent.targetDirection`（`/agent` 已问过用户，不再单独搞问卷）
- `hardNo`（可选）—— 绝不接受。复用 `profile.intent.hardNo`

## 处理（对照逻辑）
1. 吃透简历 → 推断「现实可达方向」（2-3 个 + 支撑强度 强/中/弱 + 依据）
2. 把用户**意愿方向**与**现实可达方向**对照
3. **对齐** → 一句话确认，`gaps` 空，不啰嗦、不堆建议
   **错位** → 定性预警：差在哪些维度、缺什么、为什么短期难（**不给周期数字**）

## 输出 schema（`CareerFit`，见 lib/agents/career-fit/schema.ts）
- `snapshot` — 当前定位，一句话总结简历现状
- `realisticDirections[]` — `{ direction, strength(强/中/弱), basis }`，简历客观能托起的 2-3 个方向
- `aligned` — 意愿 vs 现实 是否对齐（boolean）
- `verdict` — 对照结论一句话（对齐确认 / 错位点破）
- `gaps[]` — `{ dimension, missing, whyHard }`，仅错位时有内容；对齐时空数组
- `suggestion` — 一个方向性建议（定性，非路线、非时间表）

## 明确不做（作者拍板）
- ❌ 30/90/180 时间线 —— AI 时间排程不可靠
- ❌ 「短期补什么知识」详单 —— JD 解读里已有，不重复
- ❌ AI 替用户定目标岗位 —— 意愿由用户给，AI 只校准
- ❌ 任何周期数字 —— 只定性预警，不定量排程

## 架构（同构现有 agent 节点）
- `lib/agents/career-fit/{prompt,schema,node}.ts` —— 与 jd-analysis 等同构，复用共享 `callDeepSeekJson`
- **不进主 graph**（主 graph 是 JD 研判链 ①②③④）；career-fit 是**独立单节点**
- `app/api/career/route.ts` —— 独立路由，调 `careerFitNode`；**不碰 MVP、不碰 agent-analyze**
- `app/career/page.tsx`（**待建**）—— 读 profile → 调 `/api/career` → 渲染对照结果；无 profile 提示去 `/agent`

## 与 JD 分析的「结合」（后续，非第一版）
研判某具体岗位时，顺带提示「这符不符合你的大方向」——结合点放后面。**第一版独立、不绑 JD。**

## 状态
- **2026-06-27**：spec 定 + 后端骨架（节点三件套 + `/api/career`）建 + typecheck 通过。**下一步 = 前端 `/career` 页 + 真实 DeepSeek 端到端验证**（需作者点真实调用）。
