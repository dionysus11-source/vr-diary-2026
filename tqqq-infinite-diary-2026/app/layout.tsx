import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "무한 매수 다이어리 2026",
  description: "TQQQ/SOXL 무한 매수 회차별 수익률 추적 및 분석",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
