'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'

export default function Home() {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setTimeout(() => {
        if (user) router.push('/dashboard')
        else router.push('/auth')
      }, 2000)
    }
    check()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1
        className="text-3xl font-bold tracking-widest transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          color: visible ? 'white' : 'rgba(255,255,255,0.1)',
        }}
      >
        오늘의 커리어
      </h1>
    </div>
  )
}
