import { read, utils } from "xlsx";

export type ParsedXlsxResume = {
  text: string;
  charCount: number;
  fileType: "xlsx";
};

function cleanCellText(value: unknown): string {
  return String(value)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function cleanExtractedText(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function parseXlsxResume(buffer: Buffer): ParsedXlsxResume {
  const workbook = read(buffer, {
    type: "buffer",
    cellText: false,
    cellDates: true,
    cellStyles: true
  });
  const visibleSheetTexts = workbook.SheetNames.flatMap((sheetName, sheetIndex) => {
    const sheetInfo = workbook.Workbook?.Sheets?.[sheetIndex];

    if (sheetInfo?.Hidden) {
      return [];
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: ""
    });
    const visibleRows = rows
      .map((row, rowIndex) => {
        const isHiddenRow = worksheet["!rows"]?.[rowIndex]?.hidden;

        if (isHiddenRow) {
          return "";
        }

        return row
          .filter((_, columnIndex) => !worksheet["!cols"]?.[columnIndex]?.hidden)
          .map(cleanCellText)
          .filter(Boolean)
          .join("\t");
      })
      .filter(Boolean);

    if (visibleRows.length === 0) {
      return [];
    }

    return [`工作表：${sheetName}`, ...visibleRows];
  });
  const text = cleanExtractedText(visibleSheetTexts.join("\n"));

  return {
    text,
    charCount: Array.from(text).length,
    fileType: "xlsx"
  };
}
