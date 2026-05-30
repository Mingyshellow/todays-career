import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '오늘의 커리어',
  description: '매일 기록하면 이력서가 완성되는 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <header className="fixed top-0 left-0 right-0 h-14 border-b border-white/10 flex items-center px-6 z-50">
          <Link href="/" className="text-sm font-bold tracking-widest mr-10">
            오늘의 커리어
          </Link>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">
              대시보드
            </Link>
            <Link href="/log" className="text-sm text-white/60 hover:text-white transition-colors">
              일지 기록
            </Link>
            <Link href="/report" className="text-sm text-white/60 hover:text-white transition-colors">
              주간 리포트
            </Link>
            <Link href="/resume" className="text-sm text-white/60 hover:text-white transition-colors">
              이력서
            </Link>
          </nav>
        </header>
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  )
}
