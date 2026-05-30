'use client'

import { useState } from 'react'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
          fontSize: '20px',
          padding: '4px',
          lineHeight: 1,
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          zIndex: 49,
        }}>
          {[
            { href: '/dashboard', label: '대시보드' },
            { href: '/log', label: '일지 기록' },
            { href: '/report', label: '주간 리포트' },
            { href: '/resume', label: '이력서' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
            >
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  )
}
