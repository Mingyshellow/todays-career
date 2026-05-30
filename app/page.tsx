'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'

export default function Home() {
  const [opacity, setOpacity] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // 바로 페이드인 시작
    setTimeout(() => setOpacity(1), 200)

    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      // 3초 후 이동
      setTimeout(() => {
        if (user) router.push('/dashboard')
        else router.push('/auth')
      }, 3000)
    }
    check()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <h1
        style={{
          opacity,
          transition: 'opacity 1.5s ease',
          color: 'white',
          fontSize: '2rem',
          fontWeight: 'bold',
          letterSpacing: '0.2em',
        }}
      >
        오늘의 커리어
      </h1>
    </div>
  )
}
