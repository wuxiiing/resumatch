"use client";

import { useId, useRef, useState } from "react";

export function FileUploader() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const fileExtension = fileName.split(".").pop()?.toUpperCase() || "FILE";

  function clearFile() {
    setFileName("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="border-b border-line bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-brand-dark">步骤 1</p>
          <h2 className="mt-0.5 text-base font-semibold text-ink">上传简历</h2>
        </div>
        <span className="w-fit text-xs leading-5 text-muted">
          支持 pdf / docx / xlsx
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
        accept=".pdf,.docx,.xlsx"
        className="sr-only"
        id={inputId}
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        ref={inputRef}
        type="file"
      />

      <p className="mt-2 text-xs leading-5 text-muted">
        仅限 1 份，最多 3000 字。正式分析前会检查内容长度。
      </p>
    </section>
  );
}
