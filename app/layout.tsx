import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'  // 추가

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
      <body style={{ backgroundColor: '#0a0a0a', color: '#ededed', margin: 0 }}>
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 50, backgroundColor: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.1em', marginRight: '40px', color: 'white', textDecoration: 'none' }}>
              오늘의 커리어
            </Link>
            <nav style={{ display: 'flex', gap: '24px' }}>
              <Link href="/dashboard" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>대시보드</Link>
              <Link href="/log" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>일지 기록</Link>
              <Link href="/report" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>주간 리포트</Link>
              <Link href="/resume" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>이력서</Link>
            </nav>
          </div>
          <LogoutButton />  {/* 추가 */}
        </header>
        <main style={{ paddingTop: '56px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
