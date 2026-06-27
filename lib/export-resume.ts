// 简配 2.0 · 把「简历工作副本」纯文本导出为 docx。
// 与 lib/export-word.ts（MVP 分析报告导出，绑死 AnalysisReport）刻意分开，互不影响。

import { Document, Packer, Paragraph, TextRun } from "docx";

const RESUME_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// 纯文本 → docx：逐行成段，空行保留为占位空格（Word 里即空段落）。
export async function generateResumeDocx(resumeText: string): Promise<Buffer> {
  const lines = resumeText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const document = new Document({
    creator: "简配",
    description: "简配 · 简历工作副本",
    sections: [
      {
        children: lines.map(
          (line) =>
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: line.trimEnd() === "" ? " " : line })]
            })
        )
      }
    ]
  });

  return Packer.toBuffer(document);
}

// 中文文件名要双写：ASCII fallback + RFC5987 的 filename*。
export function getResumeExportHeaders(name: string): Record<string, string> {
  const base = name.trim() || "简历";
  const file = `${base}.docx`;
  return {
    "Content-Disposition": `attachment; filename="resume.docx"; filename*=UTF-8''${encodeURIComponent(file)}`,
    "Content-Type": RESUME_CONTENT_TYPE
  };
}
