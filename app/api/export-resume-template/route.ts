// R2 新模板系统的简历导出预览/下载 route。
// 注意:这是独立于 /api/export-resume(简历工作台在用,竹青风格 docx + 限额)的新路径——
// 两者数据契约不同(这里 GET 内置样例预览 + POST {format,resume}),故意不复用/不覆盖旧 route。
// GET:内置样例,默认 PDF(inline,浏览器直接开 URL 看模板效果);?format=docx 给 docx(attachment)。
// POST:{ format？: "pdf" | "docx", resume: StructuredResume } -> 对应文件(attachment)。

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { AtsClassicDocument } from "@/lib/pdf/templates/ats-classic.ts";
import { AiProDocument } from "@/lib/pdf/templates/ai-pro.ts";
import { AppleDocument } from "@/lib/pdf/templates/apple.ts";
import { NotionDocument } from "@/lib/pdf/templates/notion.ts";
import { resumeToDocxBuffer } from "@/lib/resume-docx.ts";
import { validateStructuredResume, type StructuredResume } from "@/lib/resume-structured.ts";
import type { AgentReport } from "@/lib/agent-report.ts";
import { consumeCredits } from "@/lib/rate-limit.ts";

export const runtime = "nodejs";

type Format = "pdf" | "docx";
type Template = "ats-classic" | "apple" | "notion" | "ai-pro";

const PDF_CONTENT_TYPE = "application/pdf";
const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function contentDisposition(disposition: "inline" | "attachment", filename: string): string {
  // 中文文件名走 filename*=UTF-8'' (RFC 5987),裸 filename= 中文会乱码。
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// 按模板挑 PDF 文档（docx 不分模板，始终标准简历）。
function pickPdfDocument(resume: StructuredResume, template: Template, report?: AgentReport): ReactElement {
  if (template === "ai-pro" && report) return AiProDocument(resume, report);
  if (template === "apple") return AppleDocument(resume);
  if (template === "notion") return NotionDocument(resume);
  return AtsClassicDocument(resume);
}

async function renderResume(
  resume: StructuredResume,
  format: Format,
  template: Template,
  report?: AgentReport,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (format === "docx") {
    return { buffer: await resumeToDocxBuffer(resume), contentType: DOCX_CONTENT_TYPE, ext: "docx" };
  }
  // 模板返回宽泛的 React.ReactElement,renderToBuffer 要更具体的 ReactElement<DocumentProps>;
  // 运行时确定是 <Document>,用 renderToBuffer 自身参数类型转一下,不改模板文件的返回标注。
  const buffer = await renderToBuffer(pickPdfDocument(resume, template, report) as Parameters<typeof renderToBuffer>[0]);
  return { buffer, contentType: PDF_CONTENT_TYPE, ext: "pdf" };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFormat(value: unknown): Format {
  return value === "docx" ? "docx" : "pdf";
}

function parseTemplate(value: unknown): Template {
  return value === "apple" || value === "notion" || value === "ai-pro" ? value : "ats-classic";
}

// 研判版所需数据的轻校验（结构对上即可，模板内部对空字段/空数组已做兜底）。
function isReportish(value: unknown): value is AgentReport {
  if (!isPlainObject(value)) return false;
  return isPlainObject(value.matchJudgment) && isPlainObject(value.jdAnalysis) && isPlainObject(value.meta);
}

// 内置样例:含中文、5 个 section、足够内容撑到两页,方便直接开 URL 预览模板真实效果。
const SAMPLE_RESUME: StructuredResume = {
  name: "李明",
  headline: "AI 产品经理 · 大模型应用与智能体方向",
  contacts: ["北京", "138-0000-1234", "liming@example.com", "github.com/liming-demo"],
  sections: [
    {
      title: "个人总结",
      entries: [
        {
          heading: "",
          meta: "",
          bullets: [
            "5 年产品经验,近 2 年专注 AI 应用与智能体方向,主导过 3 款 LLM 相关产品从 0 到 1;擅长把模糊的业务需求拆解成可执行、可衡量的产品方案,同时具备较强的技术沟通能力,能与算法/工程团队高效协作推进复杂项目落地。",
          ],
        },
      ],
    },
    {
      title: "工作经历",
      entries: [
        {
          heading: "某某科技有限公司",
          meta: "2022.03 - 至今 · 高级产品经理",
          bullets: [
            "主导智能客服 Agent 产品从 0 到 1,融合检索增强生成(RAG)与工具调用能力,上线半年 DAU 突破 10 万,人工客服转接率下降 42%",
            "搭建 A/B 测试与数据度量体系,联合数据团队定义北极星指标,核心功能迭代效率提升 30%",
            "推动跨部门(算法、工程、运营)协作机制,建立每周需求评审+双周复盘节奏,需求交付周期从平均 3 周缩短到 2 周",
            "负责智能体工具调用能力的产品化设计,梳理 12 类工具的调用边界与失败兜底策略,降低线上误触发率",
          ],
        },
        {
          heading: "某创业公司",
          meta: "2020.07 - 2022.02 · 产品经理",
          bullets: [
            "负责 B 端 SaaS 后台从 0 到 1,服务 200+ 企业客户,覆盖权限管理、审批流、数据看板三大模块",
            "设计并落地客户分层运营体系,续费率从 61% 提升至 78%",
            "独立完成从需求调研、原型设计到验收上线的完整闭环,累计输出 40+ 份 PRD",
          ],
        },
        {
          heading: "某互联网公司",
          meta: "2019.06 - 2020.06 · 产品助理",
          bullets: [
            "参与内容社区产品的日常迭代,负责评论、举报、内容分发相关功能",
            "协助数据分析师搭建用户行为埋点体系,支撑后续 3 个版本的数据驱动决策",
          ],
        },
      ],
    },
    {
      title: "项目经历",
      entries: [
        {
          heading: "简历匹配 Agent(个人项目)",
          meta: "2026.01 - 至今",
          bullets: [
            "基于 LangGraph 搭建多节点简历-JD 匹配分析工作流,拆分 JD 解析、简历证据提取、匹配研判、行动建议四个独立节点",
            "设计「信号 -> 后端规则」的判定架构解决大模型输出不稳定的问题,核心结论稳定性从约 60% 提升到 100%",
          ],
        },
        {
          heading: "企业知识库问答系统",
          meta: "2023.09 - 2023.12",
          bullets: [
            "主导从 0 到 1 设计企业内部知识库问答产品,基于向量检索 + 大模型生成,覆盖 HR、IT、财务三大高频场景",
            "上线 3 个月内日均问答量突破 3000 次,一次解决率达到 71%",
          ],
        },
      ],
    },
    {
      title: "教育背景",
      entries: [
        {
          heading: "某某大学",
          meta: "2015.09 - 2019.06 · 计算机科学与技术 · 本科",
          bullets: ["主修课程:数据结构、数据库系统、机器学习导论", "曾获校级一等奖学金(2 次)"],
        },
      ],
    },
    {
      title: "技能",
      entries: [
        { heading: "产品方法论", meta: "", bullets: ["需求分析", "用户研究", "A/B 测试", "数据驱动决策"] },
        { heading: "工具", meta: "", bullets: ["Figma", "Axure", "SQL", "Python(基础)", "Notion", "飞书"] },
        { heading: "AI/Agent 相关", meta: "", bullets: ["Prompt 工程", "RAG 架构理解", "LangGraph", "大模型评测方法"] },
      ],
    },
  ],
};

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const format = parseFormat(params.get("format"));
  const template = parseTemplate(params.get("template")); // ai-pro 无样例 report，GET 会退回 ats-classic

  try {
    const { buffer, contentType, ext } = await renderResume(SAMPLE_RESUME, format, template);
    const disposition = format === "pdf" ? "inline" : "attachment";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition(disposition, `${SAMPLE_RESUME.name}.${ext}`),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "导出失败,请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  if (!isPlainObject(payload)) {
    return NextResponse.json({ error: "请求体格式不正确。" }, { status: 400 });
  }

  const v = validateStructuredResume(payload.resume);
  if (!v.ok) {
    return NextResponse.json({ error: `简历数据不完整:${v.error}` }, { status: 400 });
  }

  const format = parseFormat(payload.format);
  const template = parseTemplate(payload.template);

  // 只有真正下载（download:true）才计入限额；实时预览不带该标记、不限，
  // 否则编辑区防抖预览几下就把 5 次/天额度打光。复用既有 "edit"（简历导出）bucket。
  if (payload.download === true) {
    const rl = consumeCredits("export", request.headers);
    if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });
  }

  // 研判版（ai-pro）导出 PDF 时，需要最近一次研判数据渲染第 2 页。
  let report: AgentReport | undefined;
  if (template === "ai-pro" && format === "pdf") {
    if (!isReportish(payload.report)) {
      return NextResponse.json({ error: "研判版需要最近一次研判数据，但未提供或格式不对。" }, { status: 400 });
    }
    report = payload.report;
  }

  try {
    const { buffer, contentType, ext } = await renderResume(v.data, format, template, report);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition("attachment", `${v.data.name || "简历"}.${ext}`),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "导出失败,请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
