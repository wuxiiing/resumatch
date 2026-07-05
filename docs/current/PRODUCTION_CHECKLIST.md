# ResuMatch 上线前检查清单 (PRODUCTION_CHECKLIST)

> 每次准备部署前过一遍。内容来源 = P0 收口(2026-07-05)**实核代码**,非照抄描述。

## 1. 环境变量(部署平台 Environment Variables)

### 必填(缺了对应功能直接抛错)
| 变量 | 用途 | 缺失后果 |
|---|---|---|
| `ARK_API_KEY` | 豆包视觉:图片简历 OCR/结构化 | 图片输入抛「缺少 ARK_API_KEY」 |
| `DEEPSEEK_API_KEY` | DeepSeek:研判/改简历/背调的「脑」 | 所有研判类功能抛「缺少 DEEPSEEK_API_KEY」 |
| `TAVILY_API_KEY` | Tavily 联网搜:公司背调 | 背调功能不可用 |

### 可选(代码有默认值,除非要换模型/端点否则不用配)
| 变量 | 默认值 |
|---|---|
| `ARK_VISION_MODEL` | `doubao-seed-1-6-vision-250815` |
| `ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` |
| `DEEPSEEK_API_BASE_URL` | `https://api.deepseek.com` |

> ⚠️ key 只配在部署平台环境变量,**不进 git**(`.env*.local` 已在 `.gitignore`)。

## 2. 限额 / 防滥用

- 限额是**内存版**(`lib/rate-limit.ts`):按 IP + 全站按自然日(北京时区)计数,**进程重启即清零、多实例不共享**。
- **多实例上线前必须换 Vercel KV / Redis**,否则每个 serverless 实例各算各的、限额形同虚设(代码注释已标 TODO)。
- 各功能日限:研判 5 / 简历解析 5 / 小简聊天 20 / 背调 5 / **简历导出 5**(简历导出复用 `edit` bucket;简历解析桶由 parse-resume + 图片 OCR + 结构化共用)。
- 🚫 **`RATE_LIMIT_BYPASS`**:仅本地测试用(`.env.local` 设 `=1` 全放行);**生产环境绝不要设**,否则限额彻底失效。
- 导出限额**只拦真下载**(请求带 `download:true`);实时预览走同一端点但不计数。注意:预览返回同样的 PDF,所以此限额是「软速度带」而非硬防护——要彻底防刷 PDF 生成需登录/鉴权,超出当前范围。

## 3. 构建 / 运行时

- Node **24.x**(`package.json` engines);部署平台 Node 版本对齐。
- 部署前跑一次 `next build`:本地 `tsc --noEmit` 已过,但 build 还会做 lint + 路由类型生成,能兜住更多问题。
- 导出/研判 route 均声明 `runtime = "nodejs"`(@react-pdf / docx 依赖 Node,不能跑 edge)。

## 4. 部署前最后一遍(勾选)
- [ ] 3 个必填 key 已配到部署平台环境变量
- [ ] 多实例部署?→ 限额换 KV
- [ ] `next build` 通过
- [ ] 端到端真走一遍:上传 → 研判 → 改简历 → 选模板 → 导出 PDF/Word(见 `HANDOFF-R2-DONE.md` §6)

---
*P0 收口新增。维护者:随功能变动同步更新本清单。*
