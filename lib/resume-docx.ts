// 纯逻辑:StructuredResume -> .docx 二进制(Buffer)。无网络、无 UI、无副作用。
// 排版:姓名(大标题) -> headline(灰色副标题) -> contacts(一行 · 分隔) -> 各 section(标题+下划线) -> entry(heading 加粗/meta 灰色小字/bullets 项目符号)。
// 单栏、无表格无分栏,便于 ATS 解析。

import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import type { ResumeEntry, ResumeSection, StructuredResume } from "./resume-structured.ts";

// ascii/eastAsia 都指向同一 CJK 字体,保证中英文混排时中文不回退成难看的默认西文字体。
// 选 SimSun 而不是 Noto Serif SC:SimSun 是 Windows/Office 里近乎必装的字体,能保证收件人机器上
// 实际渲染出来的就是这个字体;docx 不内嵌字体文件,若指定收件人机器没装的字体,Word 会静默替换。
const CJK_FONT = "SimSun";
const RUN_FONT = { ascii: CJK_FONT, eastAsia: CJK_FONT, hAnsi: CJK_FONT };

const GRAY = "666666";
const LINE_GRAY = "999999";

function nameParagraph(name: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    spacing: { after: 60 },
    children: [new TextRun({ text: name || " ", bold: true, size: 56, font: RUN_FONT })],
  });
}

function headlineParagraph(headline: string): Paragraph | undefined {
  if (!headline) return undefined;
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: headline, size: 24, color: GRAY, font: RUN_FONT })],
  });
}

function contactsParagraph(contacts: readonly string[]): Paragraph | undefined {
  if (contacts.length === 0) return undefined;
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: contacts.join(" · "), size: 20, color: GRAY, font: RUN_FONT })],
  });
}

function sectionTitleParagraph(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE_GRAY, space: 2 } },
    children: [new TextRun({ text: title, bold: true, size: 26, font: RUN_FONT })],
  });
}

function entryParagraphs(entry: ResumeEntry): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (entry.heading || entry.meta) {
    const children: TextRun[] = [];
    if (entry.heading) {
      children.push(new TextRun({ text: entry.heading, bold: true, size: 22, font: RUN_FONT }));
    }
    if (entry.meta) {
      if (children.length > 0) children.push(new TextRun({ text: "  ", size: 22, font: RUN_FONT }));
      children.push(new TextRun({ text: entry.meta, size: 20, color: GRAY, font: RUN_FONT }));
    }
    paragraphs.push(new Paragraph({ spacing: { before: 100, after: 40 }, children }));
  }

  for (const bullet of entry.bullets) {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: bullet, size: 21, font: RUN_FONT })],
      }),
    );
  }

  return paragraphs;
}

function sectionParagraphs(section: ResumeSection): Paragraph[] {
  return [sectionTitleParagraph(section.title), ...section.entries.flatMap(entryParagraphs)];
}

export async function resumeToDocxBuffer(s: StructuredResume): Promise<Buffer> {
  const children: Paragraph[] = [nameParagraph(s.name)];

  const headline = headlineParagraph(s.headline);
  if (headline) children.push(headline);

  const contacts = contactsParagraph(s.contacts);
  if (contacts) children.push(contacts);

  children.push(...s.sections.flatMap(sectionParagraphs));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
