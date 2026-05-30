'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.4)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'white')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
    >
      로그아웃
    </button>
  )
}
