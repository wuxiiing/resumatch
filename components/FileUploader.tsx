"use client";

import type { ChangeEvent } from "react";
import { useId, useRef, useState } from "react";

export type ParsedResume = {
  text: string;
  charCount: number;
  fileType: "docx" | "xlsx" | "pdf" | "txt";
};

type ParseResumeError = {
  error?: string;
};

function getParseError(result: ParsedResume | ParseResumeError): string {
  return "error" in result && result.error
    ? result.error
    : "解析简历失败，请稍后重试。";
}

type FileUploaderProps = {
  onResumeChange: (resume: ParsedResume | null) => void;
};

const RESUME_CHAR_LIMIT = 3000;
const RESUME_LIMIT_ERROR = "简历内容超过 3000 字，请精简后再上传。";

export function FileUploader({ onResumeChange }: FileUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [error, setError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const fileExtension = fileName.split(".").pop()?.toUpperCase() || "FILE";
  const isResumeOverLimit =
    parsedResume !== null && parsedResume.charCount > RESUME_CHAR_LIMIT;

  function clearFile() {
    setFileName("");
    setParsedResume(null);
    onResumeChange(null);
    setError("");
    setIsParsing(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function parseResume(file: File) {
    setIsParsing(true);
    setParsedResume(null);
    onResumeChange(null);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as ParsedResume | ParseResumeError;

      if (!response.ok) {
        setError(getParseError(result));
        onResumeChange(null);
        return;
      }

      const nextResume = result as ParsedResume;
      setParsedResume(nextResume);
      onResumeChange(nextResume);
    } catch {
      setError("解析简历失败，请检查网络后重试。");
      onResumeChange(null);
    } finally {
      setIsParsing(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      clearFile();
      return;
    }

    setFileName(file.name);
    void parseResume(file);
  }

  return (
    <section className="border-b border-line bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-brand-dark">步骤 1</p>
          <h2 className="mt-0.5 text-base font-semibold text-ink">上传简历</h2>
        </div>
        <span className="w-fit text-xs leading-5 text-muted">
          支持 docx / xlsx / pdf / txt
        </span>
      </div>

      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <label
          className="inline-flex w-full cursor-pointer items-center justify-center rounded-[10px] border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-brand-dark transition hover:border-brand hover:bg-cyan-100/60 sm:w-auto"
          htmlFor={inputId}
        >
          选择文件
        </label>

        <div className="min-w-0 flex-1">
          {fileName ? (
            <div className="flex min-w-0 items-center gap-2 rounded-[10px] border border-line bg-slate-50 px-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-100 bg-white text-xs font-semibold text-brand-dark">
                文
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {fileName}
              </span>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-muted">
                {fileExtension}
              </span>
              <button
                className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-muted hover:bg-white hover:text-red-500"
                onClick={clearFile}
                type="button"
              >
                删除
              </button>
            </div>
          ) : (
            <div className="truncate rounded-[10px] border border-line bg-slate-50 px-3 py-2 text-sm text-muted">
              未选择文件
            </div>
          )}
        </div>
      </div>

      <input
        accept=".docx,.xlsx,.pdf,.txt"
        className="sr-only"
        id={inputId}
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      <p className="mt-2 text-xs leading-5 text-muted">
        仅限 1 份，最多 3000 字。正式分析前会检查内容长度。
      </p>

      {isParsing ? (
        <div className="mt-3 rounded-[10px] border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-medium text-brand-dark">
          正在解析简历内容...
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-[10px] border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
          {error}
        </div>
      ) : null}

      {isResumeOverLimit ? (
        <div
          className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700"
          role="alert"
        >
          {RESUME_LIMIT_ERROR}
        </div>
      ) : null}

      {parsedResume ? (
        <div className="mt-3 rounded-[12px] border border-line bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-muted">
            <span className="font-medium text-slate-700">{fileName}</span>
            <span>类型：{parsedResume.fileType}</span>
            <span>字数：{parsedResume.charCount}</span>
          </div>
          <div className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-line bg-white p-3 text-xs leading-5 text-slate-700">
            {parsedResume.text || "未解析到可预览的文本内容。"}
          </div>
        </div>
      ) : null}
    </section>
  );
}
