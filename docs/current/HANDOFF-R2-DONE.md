# HANDOFF · R2 完成 → 收尾 + R3(2026-07-04)

给下一个窗口(建议 Opus)。读完这份就能接手。

## 0. 先读什么(顺序)
1. **本文件**
2. `docs/current/V2-PRODUCT-PLAN.md` — master 路线图(R1/R2 状态、R3 待办、架构改进 8 条)
3. `docs/current/HANDOFF-2026-07-04.md` — 上一程(R1 竹林+侦探)的决策与坑,仍有效
4. `AGENTS.md` — 项目铁律(**不碰 .env.local、不 push、安全线**)

## 1. 现状一句话
竹林输入页(视频+槽位入场)+ 侦探化研判(R1)+ **简历模板系统(R2:引擎+主题架构、apple/notion/ai-pro 三套、editor|preview 双栏实时预览、PDF/DOCX 导出、JSON Resume 映射、照片)** 全部 done。模型:豆包视觉(眼)+ DeepSeek(脑)+ Tavily(搜)。

## 2. ⚠️ 开工第一件事:保命(我发现的最大风险,回执没提)
这一大程(竹林→侦探→R2,几十个文件)**大概率全是未提交改动**。一次崩溃/`/clear` 就全没。
**新窗口动任何代码前,先本地提交**:开个分支 + `git commit`(**不要 push**——AGENTS.md 红线;push 要用户点头)。这是纯保险动作。

## 3. 阻塞在"人"的验证(代码改不动,备好等用户)
- **并行化提速(改进C)**:跑一次**真研判**确认 ①② 真的并行、省了 ~15-20s。只有用户能跑(要 DeepSeek key)。
- **新版 Word(SimSun 字体)**:用户开 Word **肉眼**看好不好看;丑就换回竹青。
→ 新窗口只能把验证脚本/入口准备好,结论等用户回。

## 4. 上线前收口批次("能不能发布"级,建议先做)
1. **退役死代码(回执③)**:Word 切新系统后,旧 `/api/export-resume` + `lib/export-resume.ts` 没人用了。**先 grep 确认零引用**,再删。
2. **导出限流(回执④ + 改进e)**:新导出 route **没有限额**。复用 `lib/rate-limit.ts` 的 `consumeAgentLimit`(给 `AgentAction` 加 `"export"` bucket)。多实例上线还要 Vercel KV。
3. **部署 key 清单**:`ARK_API_KEY` / `DEEPSEEK_API_KEY`(+ MODEL/BASE_URL)/ `TAVILY_API_KEY` 三把都要配;写进 `PRODUCTION_CHECKLIST.md`。

## 5. 优化批次(非紧急,规格闭合 → 可派便宜模型/Sonnet)
- **b** intake 启发式短路:输入明显是文件/纯链接时跳过 LLM 分诊,省钱。
- **c** 网页字体也换 Noto Sans/Serif SC(和 R2 的 PDF 字体统一,顺手退役 SimSun 权宜方案)。
- **d** route 样板抽 helper:各 `/api/*` 的「parse body → 限流 → 调用 → NextResponse」重复了 N 遍。
- **f** 历史 cap 50(localStorage 无上限会一直涨)。
- **h** vision lite/pro 双档对照(成本)。
- 小瑕疵:实时预览换**白底**(用 pdf.js 而非深色 PDF viewer 底);中英文间距偶尔略松。

## 6. 端到端 & 健壮性(我补的"其他",回执没覆盖)
- **完整链路真走一遍**:上传简历 → 研判 → 改简历 → 选模板 → 导出 PDF/Word。**各模块分别验过,但端到端串起来没人从头走过。**
- **移动端**:`editor|preview` 双栏在手机上怎么塌?响应式验过没?
- **回归**:改进 g 有单测,但「引擎+主题」新架构的覆盖率?

## 7. 往前:R3 产品(收完债之后的真正下一步)
见 PLAN §R3。侦探化第二波,**别贪,挑一个**:
- **岗位真实性**(我推荐先做):复用现成 Tavily 背调管道做轻量版(发布时长/重复度信号),感知强、和侦探定位一脉相承。
- 面试考点比重(④ 内扩展)。
- 职业路径模拟(归小简 career-chat)。

## 8. 继承的红线(别再踩)
**审美**:红配绿=雷 · 薄荷绿否 · 积木感否(竹节尺=**连续竹竿+节线**,非方块堆叠)· 一点红(全站朱红 ≤1 处)· 极简安静(Moonshot 向)。
**技术坑**:`tailwind.config` 改动**必须重启 dev**才生效 · backdrop-blur 元素**别每帧改 transform**(会丢渲染层)· `ch` 是半角(中文宽度锁用 px)· 豆包 Seed 视觉要 `thinking:{type:"disabled"}` · 本机 Blender 无 FFmpeg(用 `_envs/video-automation-agent/.../ffmpeg.exe`)。
**产品铁律**:结果页**禁把内部字段名**(growthRoom 等)说给用户 · **不装作知道**(公司/业务线推断带概率)· 判级 tier 由**后端规则**定,不让模型拍板。
**工具**:想用顺 `impeccable` skill,先补 `PRODUCT.md`(一直缺,导致每次 skill setup 卡在 NO_PRODUCT_MD)。

## 9. 我(Fable)的诚实边界
**R2 是 Opus 做的,我没读过那些新代码**(引擎+主题/照片/导出迁移)。本文件 §4/§5 的 R2 细节是据「回执」转写的 —— **新窗口对它们动手前,先 grep/读实际代码核对**,别盲信描述里的文件名。

## 建议的接手顺序
保命提交(§2)→ 上线前收口(§4)→ 用户验证 ①②(§3)→ 往前 R3-岗位真实性(§7)。优化项(§5)随时可派便宜模型插空做。
