# V2 输入页大改 + 豆包视觉接入 — SPEC

> 2026-07-04 起,产品级路线图移至 **`V2-PRODUCT-PLAN.md`**(master);本文件只留输入页施工细节。

Status: 进行中 · 2026-06-30 · 方案已定,P1 待建
关联:`HANDOFF-2026-06-28.md`(2.0 现状)、`PROJECT_STATE.md`、竹林首页素材(Blender,见 §4)

## 一句话
留 DeepSeek 当"脑子"(文本分析),加豆包视觉当"眼睛"(读图),无缝拼接。输入页 `/agent` 重做成「一个竹林玻璃对话框 + 槽位填充入场 agent」。

## 1. 模型策略(外科手术,不动现有分析链)
- **文本分析**(①②③④ / 军师 `career-chat` / 背调 `company-recon`)→ 继续 **DeepSeek V4 Flash**(`deepseek-v4-flash`,已调好、判级稳定,别动)。
- **图片输入**(OCR + 结构化)→ **豆包视觉**。
  - 模型:`doubao-seed-1-6-vision-250815`(用户在火山控制台开的接入点;以后可加 `doubao-1.5-vision-lite` 做免费档)。
  - 接法:图片 → 豆包视觉 → 结构化「简历 / JD」JSON → **喂进现有 DeepSeek 分析链**。豆包只当眼睛。
- (可选,以后)整体换豆包:需重测判级 prompt,暂不做。

## 2. 豆包怎么调(重要 — 别被控制台的 Responses 示例带偏)
- base_url:`https://ark.cn-beijing.volces.com/api/v3`;key:env `ARK_API_KEY`。
- 控制台"快捷接入"默认给的是 **Responses API**(`responses.create` + `input=[]`),格式新、长得怪 —— **不用它**。
- 方舟**同时支持 Chat Completions**(`POST /chat/completions` + `messages`),跟现有 `lib/agents/deepseek.ts` 完全同款格式。沿用它,只改 base_url / model / key,图片塞进 message:
  - `message.content` 从字符串 → 数组:`[{type:"text",text:"..."},{type:"image_url",image_url:{url:"data:image/png;base64,..."}}]`
- 即:新建 `lib/agents/doubao-vision.ts`(照 `deepseek.ts` 的 fetch 写法),不碰旧 client。

## 3. 输入页:一个框,三种输入 → 两个槽
- 输入(同一个玻璃框):
  - 文档 pdf/docx → 现有 `pdfjs` / `mammoth` 解析
  - **图片 截图/照片 → 豆包视觉读取 + 结构化(新)**
  - 文字 → 目标 / 意图
- 归一成两个槽:**简历 + 目标**(= 架构里的"第三输入 = 用户意图")。
- 入场 agent:从丢进来的东西自动填槽 → 缺哪个只追问那一个 → 齐了进研判。

## 4. 输入页视觉(竹林,Blender 已做)
- 背景:嵯峨野竹径"推进运镜"视频(Blender Eevee;`CAM_CLAUDE`/`SUN_CLAUDE`/`FOG_CLAUDE`;运镜 = 贴地仰拍 → 平滑前推 + 回正 → 停竹径中段;丁达尔光 + 雾;exposure≈4.3,1600×900)。
  - 工程文件:`E:\桌面\resumatch.blend`。最终视频待渲(本机 Blender 无 FFmpeg → 渲 PNG 序列,用 `_envs/video-automation-agent/.../ffmpeg.exe` 合成 MP4)。
- 标题:运镜"回正"那一刻淡入(约第 2–4 秒)。
- 中间:玻璃对话框(收三输入)+ 小"上传简历"按钮 + 朱印发送。
- 网页层:鼠标视差 + 竹叶飘落(JS,非 Blender)。

## 5. 落地分期(小步可验)
- **P1 ✅ 完成(2026-06-30)**:接豆包视觉 —— `lib/agents/doubao-vision.ts` + `/api/extract-image` + `scripts/test-vision.mts`。真实简历图验收通过:结构化 JSON 正确(schema 复用 `StructuredResume`)。
  - **关键坑**:Seed 1.6 默认开"深度思考",OCR 场景 210s;请求体加 `thinking:{type:"disabled"}` → **27.5s**。
  - 剩余:前端上传前压图 ~1280px(接 P3 输入页时做),进一步压时间/成本。
- **P2 ✅ 完成+实测通过(2026-06-30;文字分诊 2~4s,图片分诊 22s,typecheck 0 错)**:槽位填充入场 —— `lib/agents/intake.ts`(文字分诊 jd/goal/resume/other + 槽位状态机「缺啥问啥」,文案=新国风轻军师腔)、`lib/agents/vision-intake.ts`(图片分诊:简历→结构化 / JD截图→全文 / 其他)、`/api/intake-text`、`/api/extract-image`(升级为分诊版)。验:`scripts/test-intake.mts`。前端接线归 P3。
- **P3(施工中 2026-06-30)**:`app/agent/page.tsx` 已整页重写(竹林 hero + 玻璃对话框 + 槽位对话接 P2 + 落叶/视差/标题浮现 + 上传前压图 1280px 已做进去;研判契约/本地记忆/加载层保持旧版)。素材位:`public/bamboo/poster.png`(静帧)与 `public/bamboo/intro.mp4`(最终视频),缺席自动降级竹青渐变。**待:浏览器实测、最终视频合成、全站文案人话化(报告页"30/60/90"等)。**
  - 槽位状态机拆到 `lib/agents/intake-steps.ts`(纯逻辑,前后端共用;`intake.ts` 转发保持旧引用)。
- **P4 · 侦探化(2026-07-04 方向讨论,来自 GPT 对比启发,用户认可待排期)**:护城河 = "把 JD 还原成真实工作" + **可解释推理链**。落地挑选(贴现有架构,不全做):
  - ①/③ 输出加 **evidence(JD 原句引用)+ 置信度** → 结果页渲染成「推断|证据|置信度」推理表(与既有"不编造/verbatim-locate"资产同频)。
  - **公司/产业线推断**(带证据+概率,明确标注"推断非确定"),并入①或轻节点。
  - 岗位真实性(轻量版,复用 Tavily 背调管道)、面试考点比重(④加)——排队,不抢跑。
  - 呈现层与 P3.5 结果页统一**合并成一次改造**(免得改两遍)。
- P5(原P4,可选):成本优化 —— Lite/Pro 双档路由、上下文缓存、`doubao-embedding-vision` 预筛(720P 压图已在 P3 做掉)。
- P6:简历模板化导出 —— 现 window.print 带浏览器页眉页脚(localhost/日期/页码),难用。短期:`@page` 打印 CSS;中期:模板风格化导出(用户调研模板中)。
- 工作方式:机械性小活(导航重排/文案 sweep/打印 CSS)可派 **sonnet 子代理**省额度,Fable 出任务书+验收。

## 6. 待办 / 依赖 / 安全
- `ARK_API_KEY` 放 `.env.local`(接入点已开 `doubao-seed-1-6-vision-250815`)。
- 决策:文本留 DeepSeek(建议)/ 起步仅 Pro 档(建议)。
- 安全:`.env.local` 含真实 DeepSeek / Tavily / Ark key,**勿提交、勿打印**,确认在 `.gitignore`。

## 7. 成本参考(用户调研,2026 官方后付费,元/百万 token)
- `doubao-1.5-vision-lite-32k`:输入 1.5 / 输出 4.5(最便宜,免费档候选)
- `doubao-1.5-vision-pro-32k`:输入 3.0 / 输出 9.0(主力候选)
- 图片转 image token,720P 单张极少;上下文缓存命中输入 0.3;批量 5 折。
