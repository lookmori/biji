import type { Metadata } from "next";
import { DialogProvider } from "@/components/ui/DialogProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIJI — 沉浸式笔记工作台",
  description:
    "边写边画，流程图、思维导图、手绘批注无缝嵌入笔记正文。彻底告别图形工具和笔记应用之间的来回切换。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DialogProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </DialogProvider>
      </body>
    </html>
  );
}
