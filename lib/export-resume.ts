// 简配 2.0 · 把「结构化简历」导出为专业排版的 docx。
// 姓名居中放大、定位/联系方式居中、板块标题加粗带竹青下划线、条目标题+时间、要点缩进。
// 与 MVP 的 lib/export-word（AnalysisReport）刻意分开。

import { AlignmentType, BorderStyle, Document, Packer, Paragraph, TextRun } from "docx";
import type { StructuredResume } from "./resume-structured";

const RESUME_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function run(text: string, opts: { size: number; bold?: boolean; color?: string }): TextRun {
  return new TextRun({ text: text || " ", size: opts.size, bold: opts.bold, color: opts.color, font: "宋体" });
}

export async function generateResumeDocx(resume: StructuredResume): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [run(resume.name || "姓名", { size: 34, bold: true, color: "23271f" })] }));
  if (resume.headline.trim()) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [run(resume.headline, { size: 19, color: "5e5641" })] }));
  }
  if (resume.contacts.length > 0) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [run(resume.contacts.join("   ·   "), { size: 17, color: "5e5641" })] }));
  }

  for (const sec of resume.sections) {
    children.push(
      new Paragraph({
        spacing: { before: 220, after: 90 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 2, color: "52724b" } },
        children: [run(sec.title, { size: 24, bold: true, color: "23271f" })]
      })
    );
    for (const e of sec.entries) {
      if (e.heading.trim() || e.meta.trim()) {
        const runs: TextRun[] = [];
        if (e.heading.trim()) runs.push(run(e.heading, { size: 21, bold: true, color: "23271f" }));
        if (e.meta.trim()) runs.push(run((e.heading.trim() ? "   —   " : "") + e.meta, { size: 18, color: "8a7e64" }));
        children.push(new Paragraph({ spacing: { before: 70, after: 30 }, children: runs }));
      }
      for (const b of e.bullets) {
        if (b.trim()) children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 50, line: 288 }, children: [run(b, { size: 20, color: "23271f" })] }));
      }
    }
  }

  if (children.length === 0) children.push(new Paragraph({ children: [run(" ", { size: 20 })] }));

  const document = new Document({ creator: "简配", description: "简配 · 简历", sections: [{ children }] });
  return Packer.toBuffer(document);
}

export function getResumeExportHeaders(name: string): Record<string, string> {
  const base = name.trim() || "简历";
  const file = `${base}.docx`;
  return {
    "Content-Disposition": `attachment; filename="resume.docx"; filename*=UTF-8''${encodeURIComponent(file)}`,
    "Content-Type": RESUME_CONTENT_TYPE
  };
}
