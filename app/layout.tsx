import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智学 - AI 个性化学习平台",
  description: "通过 AI 个性化学习教练，帮助你完成持续、自适应的学习闭环",
  keywords: ["AI学习", "个性化学习", "在线教育", "编程学习"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {children}
      </body>
    </html>
  );
}
