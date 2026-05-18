import path from "path";
import { pathToFileURL } from "url";

export type ParsedPdfResume = {
  text: string;
  charCount: number;
  fileType: "pdf";
};

type PdfTextItem = {
  str?: string;
};

function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/[ \t]{2,}/g, " "))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getUserError(message: string): Error {
  return new Error(`USER_ERROR:${message}`);
}

export async function parsePdfResume(buffer: Buffer): Promise<ParsedPdfResume> {
  const { getDocument, GlobalWorkerOptions } = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  ).href;
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useWorkerFetch: false
  });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => (item as PdfTextItem).str ?? "")
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

    page.cleanup();

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  await pdf.destroy();

  const text = cleanExtractedText(pageTexts.join("\n"));

  if (!text) {
    throw getUserError("PDF 中未提取到有效文字；当前只支持文字型 PDF，不支持扫描件或图片型 PDF。");
  }

  return {
    text,
    charCount: Array.from(text).length,
    fileType: "pdf"
  };
}
