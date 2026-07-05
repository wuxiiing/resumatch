# SONNET 批次 A · 三张任务卡(可并行,不等 R2-1）

> 用法:开一个新 Claude Code 窗口，模型切 **Sonnet**，把某张卡「──── 复制给 Sonnet ────」下面的整段粘进去。
> 这三张都**不依赖 R2-1 模子**，现在就能开工，Opus 那边同时啃 R2-1。
> **能一起做**：卡 2 + 卡 3 是同一套 `node:test` 跑法，一个窗口连做最顺；卡 1（字体）互不干扰，可并进同一窗口最后做，或单开。
> 省心推荐：**一个 Sonnet 窗口**，按 卡1 → 卡2 → 卡3 顺序跑完，我们逐卡验收。

---

## 卡 1 · 字体下载摆放（R2-1 的前置料）

──── 复制给 Sonnet ────

你在 `D:\AI-workspace\projects\ResuMatch` 项目里。任务：为后续 `@react-pdf/renderer` 的中文 PDF 备字体文件。**只做这件事，不碰其它代码。**

**目标**：下载 Noto Sans SC + Noto Serif SC 的**静态 .ttf**，放到 `public/fonts/`。

**硬约束（react-pdf 的坑，务必遵守）**：
- 必须是**静态 .ttf**、单文件覆盖全 CJK 字形。**不要**可变字体(variable font)、**不要** woff2、**不要**按 unicode-range 切片的子集包（`@fontsource` 那种几百个分片不行——react-pdf 一个 `src` 只吃一个完整文件）。
- Regular 和 Bold 要**各自独立文件**（react-pdf 不会合成粗体）。Sans、Serif 各一对。
- 文件大是正常的（CJK 全量 ttf 常 5–10MB/个）。别压缩、别子集化，会丢字。

**产出**：
- `public/fonts/NotoSansSC-Regular.ttf`、`public/fonts/NotoSansSC-Bold.ttf`
- `public/fonts/NotoSerifSC-Regular.ttf`、`public/fonts/NotoSerifSC-Bold.ttf`
- `public/fonts/README.md`：记来源 URL、字重、授权（OFL）。

**来源**：自己找能出**静态 ttf** 的源（google/fonts 的 `ofl/notosanssc/`、notofonts/noto-cjk 的 release 里找 `-Regular`/`-Bold` 静态档；otf 也可但优先 ttf）。**拿不准就先下下来，用下面的验证卡真渲一遍。**

**验证（这就是验收）**：
1. `npm i @react-pdf/renderer`（R2 计划内依赖，R2-1 本来也要装，提前装无妨）。
2. 写一个**一次性**探针脚本（跑完就删）：用 `Font.register` 注册这 4 个文件，渲一行「测试中文字体渲染 Bold 粗体」到 PDF。
3. 打开 PDF：中文**有字形、不是豆腐块□**，Regular 和 Bold 都对。
4. 删掉探针脚本，保留字体文件和 README。

**别做**：不建任何模板组件（那是 R2-1 的活）；不改 tailwind；不动现有代码。

──── 复制结束 ────

---

## 卡 2 · R2-4 映射函数（JSON Resume ↔ StructuredResume）+ 单测

──── 复制给 Sonnet ────

你在 `D:\AI-workspace\projects\ResuMatch` 项目里。任务：写**纯函数**在 JSON Resume v1 与内部 StructuredResume 间双向映射，配单测。**只加新文件，不改现有代码。**

**先读**：`lib/resume-structured.ts` —— StructuredResume 的真实字段以它为准。JSON Resume v1 是公开标准（basics / work / education / skills / projects…），按标准字段名。

**约束**：
- **纯函数**：无副作用、无 I/O、无网络。放 `lib/resume-jsonresume.ts`，导出：
  - `toJsonResume(s: StructuredResume): JsonResume`
  - `fromJsonResume(j: JsonResume): StructuredResume`
- 两边对不上的字段：能映的映，映不了的**忽略并写注释说明**。**别**往 StructuredResume 加新字段（那要动别处）。
- `JsonResume` 类型就在本文件里写一个**最小版**（只覆盖你实际映射到的字段），别为它装 npm 包。

**产出**：
- `lib/resume-jsonresume.ts`
- `lib/resume-jsonresume.test.ts`（用 Node 内置 `node:test`）

**测试跑法**（项目没有测试框架，用 Node 24 内置的，零依赖；和项目现有 `scripts/*.mts` 一个路子）：
```
node --experimental-strip-types --test lib/resume-jsonresume.test.ts
```

**测试要覆盖**：
- 往返：`fromJsonResume(toJsonResume(s))` 对**能对应的字段**等价。
- 空/缺字段不炸（work 空、无 skills 等）。
- 至少一个填满的真实感样例。

**验收**：上面那条命令**全绿**。

**别做**：不改 `resume-structured.ts`；不装测试框架；不接 UI；DOCX 是以后另一张卡。

──── 复制结束 ────

---

## 卡 3 · intake-steps 单测（防回归）

──── 复制给 Sonnet ────

你在 `D:\AI-workspace\projects\ResuMatch` 项目里。任务：给现有状态机 `lib/agents/intake-steps.ts`（缺啥问啥）补单测。**只加测试文件，不改实现。**

**先读**：`lib/agents/intake-steps.ts`，搞清状态迁移——有哪些槽位、缺哪个问哪个、齐了怎么收尾。这是纯逻辑（前后端共用），特别适合测。

**产出**：`lib/agents/intake-steps.test.ts`（`node:test`）

**测试要覆盖**：
- 每个「缺 X → 问 X」分支。
- 槽位逐个补齐 → 最终「齐活」状态。
- 边界：空输入、已齐再输入、换料（若支持）。

**跑法 + 验收**：
```
node --experimental-strip-types --test lib/agents/intake-steps.test.ts
```
全绿即验收。

**别做**：**不改 `intake-steps.ts` 的逻辑**（只读+测）。测出 bug 就在测试里标 `// FIXME:` 并在结束时汇报，**别顺手改实现**（先诊断后改是本项目铁律）。

──── 复制结束 ────

---

## 验收清单（Sonnet 交回来，我们逐条勾）

- [ ] **字体**：`public/fonts/` 有 4 个静态 ttf + README；react-pdf 探针渲的 PDF 中文正常（Regular + Bold 都对）；探针已删。
- [ ] **R2-4**：`node --experimental-strip-types --test lib/resume-jsonresume.test.ts` 全绿；有 round-trip 用例；没动 `resume-structured.ts`。
- [ ] **intake**：`node --experimental-strip-types --test lib/agents/intake-steps.test.ts` 全绿；`intake-steps.ts` 实现未被改。
