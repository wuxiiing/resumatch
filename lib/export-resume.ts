// 简配 2.0 · 把「简历工作副本」纯文本导出为 docx,套简洁排版模板(姓名大、章节加粗带线、列表项)。
// 结构解析与 PDF 打印共用 lib/resume-format。与 MVP 的 lib/export-word(AnalysisReport)刻意分开。

import { AlignmentType, BorderStyle, Document, Packer, Paragraph, TextRun } from "docx";
import { parseResumeBlocks } from "./resume-format";

const RESUME_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function run(text: string, opts: { size: number; bold?: boolean; color?: string }): TextRun {
  return new TextRun({ text: text || " ", size: opts.size, bold: opts.bold, color: opts.color, font: "宋体" });
}

export async function generateResumeDocx(resumeText: string): Promise<Buffer> {
  const blocks = parseResumeBlocks(resumeText);
  const children: Paragraph[] = [];

  for (const b of blocks) {
    if (b.type === "name") {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [run(b.text, { size: 32, bold: true, color: "23271f" })] }));
    } else if (b.type === "sub") {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [run(b.text, { size: 18, color: "5e5641" })] }));
    } else if (b.type === "heading") {
      children.push(
        new Paragraph({
          spacing: { before: 260, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 2, color: "52724b" } },
          children: [run(b.text, { size: 24, bold: true, color: "23271f" })]
        })
      );
    } else if (b.type === "list") {
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(b.text, { size: 21, color: "23271f" })] }));
    } else {
      children.push(new Paragraph({ spacing: { after: 90, line: 300 }, children: [run(b.text, { size: 21, color: "23271f" })] }));
    }
  }

  if (children.length === 0) {
    children.push(new Paragraph({ children: [run(" ", { size: 21 })] }));
  }

  const document = new Document({ creator: "简配", description: "简配 · 简历工作副本", sections: [{ children }] });
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
