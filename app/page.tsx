'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'

export default function Home() {
  const [opacity, setOpacity] = useState(0)
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => setOpacity(1), 500)
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setTimeout(() => {
        if (user) router.push('/dashboard')
        else router.push('/auth')
      }, 3500)
    }
    check()
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <h1 style={{
        opacity,
        transition: 'opacity 2s ease',
        color: 'white',
        fontSize: '2rem',
        fontWeight: 'bold',
        letterSpacing: '0.2em',
        margin: 0,
      }}>
        오늘의 커리어
      </h1>
    </div>
  )
}
