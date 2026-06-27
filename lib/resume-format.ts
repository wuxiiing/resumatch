// 把纯文本简历切成结构块,供 Word(docx) 与 PDF(打印) 套同一套排版模板。
// 中文简历常没有空行分段,所以靠启发式("短行无标点 = 章节标题")识别结构,不依赖空行。

export type ResumeBlock =
  | { type: "name"; text: string }
  | { type: "sub"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; text: string }
  | { type: "para"; text: string };

const PUNCT = /[。！？，、；：·…|（）()/]/;

// 短(≤10字)、无标点、无长数字(电话/日期)的独立行,当作章节标题。
function looksLikeHeading(line: string): boolean {
  const t = line.replace(/\s/g, "");
  if (t.length === 0 || t.length > 10) return false;
  if (PUNCT.test(line)) return false;
  if (/\d{3,}/.test(line)) return false;
  return true;
}

export function parseResumeBlocks(raw: string): ResumeBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const blocks: ResumeBlock[] = [];
  let i = 0;

  while (i < lines.length && !lines[i].trim()) i++;
  if (i >= lines.length) return blocks;

  // 姓名 = 第一非空行
  blocks.push({ type: "name", text: lines[i].trim() });
  i++;

  // 头部(头衔 / 联系方式):姓名之后,直到空行或第一个章节标题
  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (!line) break;
    if (looksLikeHeading(line)) {
      blocks.push({ type: "heading", text: line });
      break;
    }
    blocks.push({ type: "sub", text: line });
  }

  // 正文
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^[·\-•*]\s?/.test(line)) {
      blocks.push({ type: "list", text: line.replace(/^[·\-•*]\s?/, "") });
    } else if (looksLikeHeading(line)) {
      blocks.push({ type: "heading", text: line });
    } else {
      blocks.push({ type: "para", text: line });
    }
  }

  return blocks;
}
