import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/app/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "주하 관찰 OS",
  description: "부모가 함께 쓰는 학교, 집, 일상 관찰 기록",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-neutral-950">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
