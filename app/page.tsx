"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUploader, type ParsedResume } from "@/components/FileUploader";
import { JD_CHAR_LIMIT, JDInput } from "@/components/JDInput";
import { Logo } from "@/components/Logo";
import { OpeningAnimation } from "@/components/OpeningAnimation";
import type { AnalysisReport } from "@/types/analysis";

const RESUME_CHAR_LIMIT = 3000;
const ANALYSIS_REPORT_STORAGE_KEY = "resumatch:last-analysis-report";

type AnalyzeError = {
  error?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [jdValue, setJdValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const isResumeReady =
    parsedResume !== null && parsedResume.charCount <= RESUME_CHAR_LIMIT;
  const isJDReady =
    jdValue.trim().length > 0 && jdValue.length <= JD_CHAR_LIMIT;
  const canStartAnalysis = isResumeReady && isJDReady;
  const isAnalyzeDisabled = !canStartAnalysis || isAnalyzing;

  function handleResumeChange(resume: ParsedResume | null) {
    setParsedResume(resume);
    setAnalyzeError("");
  }

  function handleJDChange(value: string) {
    setJdValue(value);
    setAnalyzeError("");
  }

  async function handleStartAnalysis() {
    const resume = parsedResume;

    if (!canStartAnalysis || !resume || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError("");

    try {
      const response = await fetch("/api/analyze", {
        body: JSON.stringify({
          resumeText: resume.text,
          jobDescription: jdValue
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = (await response.json()) as AnalysisReport | AnalyzeError;

      if (!response.ok) {
        setAnalyzeError(
          "error" in result && result.error
            ? result.error
            : "分析失败，请稍后再试。"
        );
        return;
      }

      sessionStorage.setItem(ANALYSIS_REPORT_STORAGE_KEY, JSON.stringify(result));
      router.push("/result");
    } catch {
      setAnalyzeError("分析服务暂时不可用，请检查网络后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <OpeningAnimation>
      <main className="min-h-screen bg-white px-4 py-4 text-ink sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-2xl flex-col">
          <header className="flex items-center justify-end">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-muted shadow-[0_8px_22px_rgba(15,23,42,0.04)] hover:border-cyan-200 hover:text-brand-dark"
              href="/result"
            >
              历史记录
            </Link>
          </header>

          <section className="flex flex-1 flex-col justify-center py-4 sm:py-6">
            <div className="text-center">
              <div className="flex justify-center" data-opening-logo-anchor>
                <Logo size="large" />
              </div>
              <h1 className="mt-4 text-balance text-xl font-semibold tracking-normal text-ink sm:text-2xl">
                上传简历，粘贴岗位要求，快速生成匹配报告
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
                ResuMatch 帮你对齐简历内容和招聘要求，看到哪些匹配、哪些需要优化。
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
              <FileUploader onResumeChange={handleResumeChange} />
              <JDInput onChange={handleJDChange} value={jdValue} />

              <div className="border-t border-line bg-slate-50/50 p-4">
                <button
                  aria-disabled={isAnalyzeDisabled}
                  className={`inline-flex w-full items-center justify-center rounded-[12px] px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isAnalyzeDisabled
                      ? "cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-500 shadow-none focus:ring-slate-300"
                      : "bg-brand text-white shadow-[0_12px_30px_rgba(0,180,204,0.22)] hover:bg-brand-dark focus:ring-brand"
                  }`}
                  disabled={isAnalyzeDisabled}
                  onClick={handleStartAnalysis}
                  type="button"
                >
                  {isAnalyzing ? "正在分析简历匹配度..." : "开始分析"}
                </button>
                {analyzeError ? (
                  <p className="mt-3 rounded-[10px] border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                    {analyzeError}
                  </p>
                ) : null}
                <p className="mt-3 text-center text-xs leading-5 text-muted">
                  每个 IP 每日最多分析 5 次，报告仅作 AI 辅助参考。
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </OpeningAnimation>
  );
}
