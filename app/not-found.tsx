import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gf-paper px-6 font-sans">
      <div className="text-center">
        <div className="font-serifcn text-[80px] leading-none text-gf-green">404</div>
        <p className="mt-3 text-[15px] text-gf-soft">这一页不存在——军师也找不到。</p>
        <Link
          href="/agent"
          className="mt-6 inline-block rounded-lg bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend"
        >
          回竹林 →
        </Link>
      </div>
    </div>
  );
}
