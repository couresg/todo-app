import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Providers from "./providers";
import NavBar from "@/components/NavBar";
import { Loading } from "@/components/State";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "할 일 관리",
  description: "1년 목표 - 주간 계획 - 할 일을 연결해 관리합니다",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row">
        <Providers>
          <NavBar />
          <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6">
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </main>
        </Providers>
      </body>
    </html>
  );
}
