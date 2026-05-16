# ResuMatch

ResuMatch 是一个中文简历与岗位 JD 匹配分析工具。本阶段只初始化 Next.js App Router + Tailwind CSS 项目骨架，并提供首页与报告页静态占位。

## 本阶段范围

- 首页：Logo、简历上传区占位、JD 输入区占位、开始分析按钮占位、限制说明。
- `/result`：静态报告占位，包括历史栏、评分卡、关键词标签、三色图例、简历分析详情、右侧摘要卡和 Word 导出占位。
- 不包含真实上传、文件解析、AI 分析、DeepSeek 接入、Word 导出、登录、付费、多语言或 PDF 导出。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 查看首页，打开 `http://localhost:3000/result` 查看报告页占位。

## 验证

```bash
npm run build
npm run lint
```
