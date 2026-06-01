import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "주하 관찰 OS",
  description: "부모가 함께 쓰는 학교생활 관찰 기록",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-neutral-950">
        {children}
      </body>
    </html>
  );
}
