export type ParsedTxtResume = {
  text: string;
  charCount: number;
  fileType: "txt";
};

function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getUserError(message: string): Error {
  return new Error(`USER_ERROR:${message}`);
}

export function parseTxtResume(rawText: string): ParsedTxtResume {
  const text = cleanExtractedText(rawText);

  if (!text) {
    throw getUserError("txt 文件内容为空，请上传包含简历文本的 UTF-8 txt 文件。");
  }

  return {
    text,
    charCount: Array.from(text).length,
    fileType: "txt"
  };
}

