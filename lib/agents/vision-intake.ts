// 图片入场分诊:一张图是「简历」还是「JD 截图」?一次调用完成判断 + 抽取。
// 复用豆包视觉客户端;简历结构复用 StructuredResume(与文本简历同一套 schema)。

import { callDoubaoVisionJson } from "./doubao-vision.ts";
import { validateStructuredResume, type StructuredResume } from "../resume-structured.ts";

export type IntakeImageResult =
  | { kind: "resume"; resume: StructuredResume }
  | { kind: "jd"; jdText: string }
  | { kind: "other"; note: string };

const VISION_INTAKE_SYSTEM = `你是求职应用的图片分诊器。用户上传一张图,先判断类型再抽取:
- 简历 → {"kind":"resume","resume":{按下方简历结构}}
- 招聘岗位截图(JD) → {"kind":"jd","jdText":"图中全部岗位文字,保持原文"}
- 其他 → {"kind":"other","note":"一句话说明图里是什么"}
简历结构(只重组、保持原文、绝不编造):
{"name":"","headline":"","contacts":[""],"sections":[{"title":"","entries":[{"heading":"","meta":"","bullets":[""]}]}]}
只输出合法 JSON object,不要 markdown、不要代码块。`;

type Validation<T> = { ok: true; data: T } | { ok: false; error: string };

function validateIntakeImage(v: unknown): Validation<IntakeImageResult> {
  if (typeof v !== "object" || v === null) return { ok: false, error: "非 object" };
  const o = v as Record<string, unknown>;
  if (o.kind === "resume") {
    const r = validateStructuredResume(o.resume);
    return r.ok ? { ok: true, data: { kind: "resume", resume: r.data } } : r;
  }
  if (o.kind === "jd") {
    return typeof o.jdText === "string" && o.jdText.trim()
      ? { ok: true, data: { kind: "jd", jdText: o.jdText } }
      : { ok: false, error: "jdText 缺失" };
  }
  if (o.kind === "other") {
    return { ok: true, data: { kind: "other", note: typeof o.note === "string" ? o.note : "" } };
  }
  return { ok: false, error: "kind 不合法" };
}

export function extractIntakeImage(imageDataUrl: string): Promise<IntakeImageResult> {
  return callDoubaoVisionJson(
    VISION_INTAKE_SYSTEM,
    "读取这张图片,判断类型并按系统要求输出 JSON。",
    imageDataUrl,
    validateIntakeImage,
    { maxTokens: 4000 }
  );
}
