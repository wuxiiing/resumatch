import { NextResponse } from "next/server";

import { consumeAgentLimit } from "@/lib/rate-limit";
import { parseDocxResume } from "@/lib/parse-docx";
import { parsePdfResume } from "@/lib/parse-pdf";
import { parseTxtResume } from "@/lib/parse-txt";
import { parseXlsxResume } from "@/lib/parse-xlsx";

export const runtime = "nodejs";

type SupportedResumeFileType = "docx" | "xlsx" | "pdf" | "txt";

function getSupportedFileType(file: File): SupportedResumeFileType | null {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".docx")) {
    return "docx";
  }

  if (fileName.endsWith(".xlsx")) {
    return "xlsx";
  }

  if (fileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (fileName.endsWith(".txt")) {
    return "txt";
  }

  return null;
}

function getUserErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error) || !error.message.startsWith("USER_ERROR:")) {
    return null;
  }

  return error.message.replace("USER_ERROR:", "");
}

export async function POST(request: Request) {
  let fileType: SupportedResumeFileType | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传字段名为 file 的 .docx、.xlsx、.pdf 或 .txt 简历文件。" },
        { status: 400 }
      );
    }

    fileType = getSupportedFileType(file);

    if (!fileType) {
      return NextResponse.json(
        { error: "当前只支持上传 .docx、.xlsx、.pdf 或 .txt 格式的简历文件。" },
        { status: 400 }
      );
    }

    const rl = consumeAgentLimit("resume", request.headers);
    if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

    const parsedResume = await (async () => {
      if (fileType === "txt") {
        return parseTxtResume(await file.text());
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (fileType === "docx") {
        return parseDocxResume(buffer);
      }

      if (fileType === "xlsx") {
        return parseXlsxResume(buffer);
      }

      return parsePdfResume(buffer);
    })();

    return NextResponse.json(parsedResume);
  } catch (error) {
    const userErrorMessage = getUserErrorMessage(error);
    const rawMessage = error instanceof Error ? error.message : "Unknown parse error";

    console.error("[PARSE_RESUME_ERROR]", {
      fileType,
      message: rawMessage,
      name: error instanceof Error ? error.name : "UnknownError"
    });

    // 把真实错误返回给前端，方便定位（生产环境同样——PDF 解析不确定性太高，藏错误信息只会让用户反复试）
    return NextResponse.json(
      {
        error:
          userErrorMessage ??
          (fileType === "pdf"
            ? `PDF 解析失败：${rawMessage}`
            : "解析简历文件失败，请确认文件未损坏后重试。")
      },
      { status: userErrorMessage ? 400 : 500 }
    );
  }
}
