import Link from "next/link";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ReportLegend, ReportViewer } from "@/components/ReportViewer";
import { ScoreDashboard } from "@/components/ScoreDashboard";
import { SummarySidebar } from "@/components/SummarySidebar";
import { placeholderReport } from "@/lib/mock-report";

export default function ResultPage() {
  return (
    <main className="min-h-screen bg-white text-ink lg:flex">
      <HistorySidebar history={placeholderReport.history} />

      <div className="min-w-0 flex-1 bg-white">
        <header className="flex flex-col gap-4 border-b border-line bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              分析报告
            </p>
            <h1 className="mt-1 text-xl font-semibold text-ink">
              简历匹配分析报告
            </h1>
          </div>
          <Link
            className="inline-flex w-fit items-center justify-center rounded-[12px] border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand"
            href="/"
          >
            + 新建分析
          </Link>
        </header>

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px] space-y-4">
            <ScoreDashboard report={placeholderReport} />
            <ReportLegend />

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
              <div className="min-w-0 space-y-4">
                <ReportViewer segments={placeholderReport.segments} />
                <p className="px-1 text-xs leading-5 text-slate-400">
                  本报告为 AI 辅助分析占位展示，仅供参考，建议结合自身实际情况判断。
                </p>
              </div>

              <SummarySidebar report={placeholderReport} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
