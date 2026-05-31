'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleKakaoLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: 'https://todays-career.vercel.app/dashboard',
        scopes: 'profile_nickname profile_image account_email',
      },
    })
    if (data?.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">오늘의 커리어</h1>
        <p className="text-white/40 text-sm text-center mb-10">
          {isLogin ? '로그인하고 기록을 시작해보세요' : '회원가입하고 커리어를 쌓아보세요'}
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleKakaoLogin}
            className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.374c0 2.088 1.392 3.924 3.492 4.968l-.888 3.312a.188.188 0 00.288.204L8.244 13.5c.246.018.498.024.756.024 4.142 0 7.5-2.634 7.5-5.874C16.5 4.134 13.142 1.5 9 1.5z" fill="#000000"/>
            </svg>
            카카오로 {isLogin ? '로그인' : '회원가입'}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/20">또는</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="hello@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-white/40 hover:text-white transition-colors text-center"
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}
