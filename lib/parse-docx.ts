import mammoth from "mammoth";

export type ParsedDocxResume = {
  text: string;
  charCount: number;
  fileType: "docx";
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

export async function parseDocxResume(buffer: Buffer): Promise<ParsedDocxResume> {
  const result = await mammoth.extractRawText({ buffer });
  const text = cleanExtractedText(result.value);

  return {
    text,
    charCount: Array.from(text).length,
    fileType: "docx"
  };
}

