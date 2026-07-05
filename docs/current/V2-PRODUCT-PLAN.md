# ResuMatch V2 产品总计划(master)

Status: 2026-07-04 定稿 v1 · 由输入页大改(V2-INPUT-REVAMP-SPEC)+ 两轮 GPT 对比讨论收敛而来
配套:`V2-INPUT-REVAMP-SPEC.md`(输入页施工细节)、`V2-SPEC-0001.md`(2.0 架构)、`PROJECT_STATE.md`

## 0. 定位(一句话,所有功能都得对着它)
**不是"最会分析 JD 的 AI",是"帮你做求职决策的军师"。**
北极星问题就三个:该不该投?能不能过?是不是坑?
一切分析(推理链/公司推断/画像)都是给"裁决"当证据的,不是产品本体。

> 关键认知(纠正 GPT 的盲区):**"最终决策"我们早就有了** —— ③ 的后端规则判级(目标/跳板/该绕开 + isBoundary + fork)就是决策,而且比聊天稳(温度0+后端规则)。缺的不是决策,是**决策优先的呈现** + **可解释的证据链**。

## 1. 原则(不变的)
- 不编造、可追溯(既有 verbatim-locate 资产 → 升级为"证据链"呈现)。
- **不装作知道**:事实(JD 写了 SFT/RM)和推断(可能是 Seed,75%)分开标;推断必须带概率与证据。
- 判级稳定性 > 花哨:tier 由后端规则出,模型只出信号。
- 风格:新国风 · 极简 · 一点红(全站 token 统一);语气=轻军师,不许 agent 腔(growthRoom/30-60-90 字段名禁止对用户说)。

## 2. 输入 ↔ 输出风格如何统一(用户提出的"会不会不一致")
定调:**"封面与内页"** —— 输入页=暗色电影竹林(情绪/仪式感),阅读页=浅宣纸(长文可读性)。这不是分裂,是杂志逻辑。缝合三招:
1. 同一套 token(墨/宣纸/竹青/朱红一处 + 4 级字阶:28 页题/18 节题/14 正文/12 注;衬线只给标题与军师语)。
2. **视觉桥**:结果页顶部保留一条窄的暗色竹林带(公司·岗位 + 裁决章落在上面),往下才展开宣纸 —— 从竹林"走进"卷宗。
3. 转场:研判中 overlay 已改暗色玻璃,正好是两者之间的"隧道"。

## 3. 路线图(合并所有讨论,单一序列)
### ✅ 已完成(2026-06-30 ~ 07-04)
- P1 豆包视觉(眼睛):图→结构化,thinking off,27.5s。
- P2 槽位入场(前门):文字/图/文档分诊 → 缺啥问啥。
- P3 输入页(脸):竹林视频 hero + 玻璃对话框 + 落叶/视差 + 极简标题;运镜视频 1080p 定稿。

### R1 · 结果页「决策优先」重造(核心完成 2026-07-04,浏览器种子数据验证通过)
✅ 已落地:①schema/prompt 加 `jobTitle`(研判自动命名,`meta.position` 自动填)+ `orgGuess`(公司/业务线推断:1-3 候选+prob+why 引 JD 原词+"非确定"note,信号不足=null,"不装作知道"写进铁律);③prompt 禁内部字段名+要求引 JD 原词;结果页=暗色竹林桥头版(裁决印落桥上)+「为什么这么判」+推断卡(概率条)+字阶归一(28/18/15军师语/14/12/11);templates/ 脚手架已建。
⏳ 待办:真实 JD 跑一轮验 orgGuess 质量;简历页导航重排(活1)+打印 CSS(活2)——Sonnet 派单因平台模型路由故障失败,收回 Fable 下轮自做。
呈现层:
- **决策头版**:判断尺(节节高)+ 一句话裁决 + 三条人话理由,放页面最顶;推理细节全部下沉。
- **推理链**:口语化呈现(不是"推断|证据|置信度"三列表,而是「为什么这么判 → JD 原句 → 所以 → 可信度」的叙事块,GPT 二轮风格)。
- **公司/产业线推断**(带概率分布,显式标"推断非确定")。
- 统一 token + 字阶;文案人话化;研判自动命名「公司·岗位」;顶部暗色竹林桥。
后端(动 prompt/schema,不动判级规则):
- ① 加 evidence[](JD 原句引用)+ 公司/产业线推断(candidates + prob + evidence)。
- ③ 输出的 reasoning 强制人话 + 附证据引用;禁字段名。
- ④ 按 ③ tier 条件化(该绕开 → "仍要投的话"式建议)。
派单 Sonnet(机械活):P3.6 简历页导航重排(我的简历/小简 移到研判新岗位上方)、`@page` 打印 CSS 短修、模板仓库脚手架。

### R1 收口(2026-07-04,用户过目「没有其他问题了」)
落地清单:决策头版(墨绿 gf-greend 顶栏+朱印裁决)/推理链+orgGuess 推断卡(真实案例:米哈游 100%、字节·豆包 85%,均带 JD 原词依据)/①jobTitle 提炼式自动命名/③禁字段名/②引文≤60字+claim人话/牌面 claim 优先/逐条对照(原"排雷"改名+列距修复)/节节高改真竹节(1/2/3 节固定)/字阶+全页宋体(SimSun 置顶治粗细混排)/等待页竹青毛玻璃/输入页标题14vh+面板34vh+右上「上次研判」/历史可删/AppNav 入口置顶/AppShell tone 三页底色微差(宣纸/象牙/微竹青)。
遗留:打印 CSS(并入 R2 导出);impeccable 的 PRODUCT.md 档案待补。

### R2 · 简历模板系统(P6)— 进行中(2026-07-04 启动)
**源码考察结论(Reactive Resume v5,浅克隆在 scratchpad/reactive-resume,读过 packages/{schema,pdf,docx}):**
- 模板 = **@react-pdf/renderer 的 React 组件**(每套一个 XxxPage.tsx,17 套在 packages/pdf/src/templates/),服务端 `renderToBuffer` 直出 PDF 文件——**没有 window.print、没有浏览器页眉页脚问题**;同一组件浏览器端可渲染预览 → editor|preview 双栏天然成立。
- schema = zod 且每字段带 `.describe()`(AI 填充友好,值得 StructuredResume 借鉴);模板注册表 schema/src/templates.ts;DOCX 走独立 builder(html-to-docx)。
- **中文关键点**:react-pdf 必须 Font.register 本地 CJK 字体文件(打包 Noto Sans/Serif SC ttf)——顺手根治导出字体统一问题。
**R2 施工序列**:
1. **R2-1 spike**:装 @react-pdf/renderer + 本地中文字体 → 用 StructuredResume 渲出第一套 ATS 模板 + 直接下载 PDF(验证中文/分页/字体)。
2. R2-2:/resume 页改 editor|preview 双栏(填空式表单 + 右侧实时预览)。
3. R2-3:补 apple/notion 模板 + **ai-pro**(第 2 页 = 研判摘要,吃 AgentReport)。
4. R2-4:JSON Resume v1 导入/导出映射 + DOCX(复用现有 docx 依赖)。
- 内部模型不变(`StructuredResume`,中文简历灵活);**JSON Resume 作为导出映射目标**(标准 v1 schema 可行;中文板块如 自我评价/校园经历 映射到 basics.summary/projects,导出时 LLM 辅助归类)。
- 模板只做 4 套做到极致:A·ATS 黑白保守 / B·Apple 留白极简 / C·Notion 浅灰圆角 / D·**AI-Pro(独家)**:第 2 页 = 研判摘要(Why Match / Best Fit / Gap)——把研判数据变成简历附件,别人没有。
- 参考库 `templates/inspirations/` 先攒截图(Reactive Resume 组件拆分 Resume→Page→Section→Item、JSON Resume themes),不临时找。
- Reactive Resume 不用注册:开源,直接读 GitHub 源码研究(R2 开工第一步,Fable 亲自读)。
- 编辑形态(用户点名):**对话式/填空式编辑 + 右侧实时预览窗**(像 Reactive Resume 那种 editor|preview 双栏),R2 出交互方案时按此定。

### R3 · 深化(排队,不抢跑)
- 岗位真实性(轻量版,复用 Tavily 背调管道:发布时长/重复度信号)。
- 面试考点比重预测(④ 内)。
- 职业路径模拟 → 归小简(career-chat)扩展。
- 成本优化(P5):Lite/Pro 双档、上下文缓存、embedding 预筛。

## 4. 明确不做 / 后置
- 一次做 20 个模板(4 套封顶)。
- 公司知识库/知识图谱(方向正确,数据未积累,远期)。
- 全套"求职侦探"七功能齐上(按 R1→R3 逐个验证)。

## 5. 工作方式
- Fable:方案、审美、难活(prompt/schema/结果页)、验收。
- Sonnet 子代理:机械改版(导航/打印 CSS/脚手架/文案 sweep),任务书驱动。
- 每刀收尾:typecheck + 浏览器预览(Fable 自查)+ 用户过目;状态写回本文件。
