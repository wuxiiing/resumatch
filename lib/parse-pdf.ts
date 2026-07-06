import { join } from "path";

export type ParsedPdfResume = {
  text: string;
  charCount: number;
  fileType: "pdf";
};

type PdfTextItem = {
  height?: number;
  str?: string;
  transform?: number[];
  width?: number;
};

type PositionedTextItem = {
  str: string;
  x: number;
  y: number;
};

type PdfDocumentOptions = {
  cMapPacked: boolean;
  cMapUrl: string;
  data: Uint8Array;
  disableFontFace: boolean;
  disableWorker: boolean;
  standardFontDataUrl: string;
  useWorkerFetch: boolean;
  wasmUrl?: string;
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

function getPdfjsAssetUrl(...pathSegments: string[]): string {
  return `${join(...pathSegments).replace(/\\/g, "/")}/`;
}

function getPositionedTextItem(item: PdfTextItem): PositionedTextItem | null {
  const str = item.str?.trim();
  const transform = item.transform;

  if (!str || !transform || transform.length < 6) {
    return null;
  }

  return {
    str,
    x: transform[4] ?? 0,
    y: transform[5] ?? 0
  };
}

function rebuildPageText(items: PdfTextItem[]): string {
  const positionedItems = items
    .map(getPositionedTextItem)
    .filter((item): item is PositionedTextItem => item !== null)
    .sort((a, b) => {
      const yDistance = Math.abs(b.y - a.y);

      if (yDistance > 3) {
        return b.y - a.y;
      }

      return a.x - b.x;
    });

  const lines: PositionedTextItem[][] = [];

  for (const item of positionedItems) {
    const currentLine = lines[lines.length - 1];
    const currentY = currentLine?.[0]?.y;

    if (!currentLine || currentY === undefined || Math.abs(currentY - item.y) > 3) {
      lines.push([item]);
      continue;
    }

    currentLine.push(item);
  }

  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(" ")
    )
    .join("\n");
}

export async function parsePdfResume(buffer: Buffer): Promise<ParsedPdfResume> {
  const { getDocument } = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );

  // 尝试多个路径找 cmaps/standard_fonts（prebuild → public/pdfjs/；fallback → node_modules）
  const candidates = [
    join(process.cwd(), "public", "pdfjs"),
    join(process.cwd(), "node_modules", "pdfjs-dist"),
  ];
  let standardFontDataUrl = "";
  let cMapUrl = "";
  for (const root of candidates) {
    try {
      // 用 fs.accessSync 验证目录存在
      const fs = await import("fs");
      fs.accessSync(join(root, "cmaps"));
      cMapUrl = getPdfjsAssetUrl(root, "cmaps");
      standardFontDataUrl = getPdfjsAssetUrl(root, "standard_fonts");
      break;
    } catch {
      continue;
    }
  }
  if (!cMapUrl) {
    throw getUserError("PDF 解析环境未就绪（cmaps 资源缺失），请联系开发者。");
  }

  // wasm 不需要——只做文本提取、不渲染；设 null 跳过 wasm 加载，避免 Vercel Lambda 文件系统问题
  const documentOptions: PdfDocumentOptions = {
    cMapPacked: true,
    cMapUrl,
    data: new Uint8Array(buffer),
    disableFontFace: true,
    disableWorker: true,
    standardFontDataUrl,
    useWorkerFetch: false,
  };
  const loadingTask = getDocument(documentOptions);
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = rebuildPageText(textContent.items as PdfTextItem[]);

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
