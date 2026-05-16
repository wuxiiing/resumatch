import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResuMatch",
  description: "中文简历与岗位 JD 匹配分析工具"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
