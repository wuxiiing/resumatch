import Link from "next/link";
import { FileUploader } from "@/components/FileUploader";
import { JDInput } from "@/components/JDInput";
import { Logo } from "@/components/Logo";
import { OpeningAnimation } from "@/components/OpeningAnimation";

export default function HomePage() {
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
              <FileUploader />
              <JDInput />

              <div className="border-t border-line bg-slate-50/50 p-4">
                <Link
                  className="inline-flex w-full items-center justify-center rounded-[12px] bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,180,204,0.22)] hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                  href="/result"
                >
                  开始分析
                </Link>
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
