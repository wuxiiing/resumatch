import Link from "next/link";
import { FileUploader } from "@/components/FileUploader";
import { JDInput } from "@/components/JDInput";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
            上传简历，粘贴岗位 JD，生成匹配分析报告
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            阶段 1 仅搭建前端占位界面，不解析文件、不调用接口、不生成 Word。
          </p>
        </header>

        <section className="mt-8 rounded-[16px] border border-line bg-slate-50/70 p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FileUploader />
            <JDInput />
          </div>
        </section>

        <section className="mx-auto mt-5 grid max-w-5xl gap-3 text-sm text-muted md:grid-cols-3">
          <div className="rounded-[12px] border border-line bg-white px-4 py-3">
            每份简历正式分析前将限制在 3000 字以内。
          </div>
          <div className="rounded-[12px] border border-line bg-white px-4 py-3">
            岗位 JD 正式提交前将限制在 1000 字以内。
          </div>
          <div className="rounded-[12px] border border-line bg-white px-4 py-3">
            每个 IP 每日最多分析 5 次，本报告仅供参考。
          </div>
        </section>

        <div className="mt-6 text-center">
          <Link
            className="text-sm font-medium text-brand-dark underline-offset-4 hover:underline"
            href="/result"
          >
            查看静态报告页占位
          </Link>
        </div>
      </div>
    </main>
  );
}
