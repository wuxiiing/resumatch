import { NextResponse } from "next/server";

import { parseDocxResume } from "@/lib/parse-docx";

export const runtime = "nodejs";

function isDocxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".docx");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传字段名为 file 的 .docx 简历文件。" },
        { status: 400 }
      );
    }

    if (!isDocxFile(file)) {
      return NextResponse.json(
        { error: "当前只支持上传 .docx 格式的简历文件。" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const parsedResume = await parseDocxResume(Buffer.from(arrayBuffer));

    return NextResponse.json(parsedResume);
  } catch {
    return NextResponse.json(
      { error: "解析 .docx 简历失败，请确认文件未损坏后重试。" },
      { status: 400 }
    );
  }
}

