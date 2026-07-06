import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "简配 · 求职军师",
  description: "看穿 JD、研判值不值得打、告诉你怎么打——AI 求职决策工具",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-[100dvh] flex-col">
        <div className="flex-1">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
        <footer className="shrink-0 border-t border-gf-rule bg-gf-paper/60 px-4 py-2.5 text-center text-[11px] text-gf-faint">
          © 2026 简配 · 求职军师　|　反馈建议：462380155@qq.com　|
          <a href="https://github.com/wuxiiing/resumatch" className="underline underline-offset-2 hover:text-gf-soft" target="_blank" rel="noopener noreferrer">GitHub 开源</a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
