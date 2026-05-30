'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1

  const getWeekDates = () => {
    const day = today.getDay() === 0 ? 7 : today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - day + 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }

  const weekDates = getWeekDates()

  useEffect(() => {
    const fetchLogs = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('logs')
        .select('log_date')
        .eq('user_id', user.id)
      setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const loggedDates = [...new Set(logs.map(l => l.log_date))]
  const weekLogged = weekDates.filter(d => loggedDates.includes(d))
  const isTodayChecked = loggedDates.includes(todayStr)

  const handleCheckIn = async () => {
    if (!userId || isTodayChecked) return
    setChecking(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('logs')
      .insert({ user_id: userId, log_date: todayStr, content: '출석체크' })
    if (!error) {
      setLogs(prev => [...prev, { log_date: todayStr }])
    }
    setChecking(false)
  }

  const getStreak = () => {
    let streak = 0
    const sorted = [...loggedDates].sort().reverse()
    let check = new Date(todayStr)
    for (const date of sorted) {
      if (date === check.toISOString().split('T')[0]) {
        streak++
        check.setDate(check.getDate() - 1)
      } else break
    }
    return streak
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <button
          onClick={handleCheckIn}
          disabled={isTodayChecked || checking || loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isTodayChecked
              ? 'bg-white/10 text-white/30 cursor-default'
              : 'bg-white text-black hover:bg-white/90 active:scale-95'
          }`}
        >
          {isTodayChecked ? '✓ 오늘 출석완료' : checking ? '기록 중...' : '오늘 출석체크'}
        </button>
      </div>
      <p className="text-white/40 text-sm mb-10">오늘도 기록해볼까요?</p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/40 mb-1">연속 기록</p>
          <p className="text-2xl font-bold">
            {loading ? '—' : getStreak()}
            <span className="text-sm font-normal text-white/40 ml-1">일</span>
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/40 mb-1">이번 주 기록</p>
          <p className="text-2xl font-bold">
            {loading ? '—' : weekLogged.length}
            <span className="text-sm font-normal text-white/40 ml-1">개</span>
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/40 mb-1">총 기록</p>
          <p className="text-2xl font-bold">
            {loading ? '—' : loggedDates.length}
            <span className="text-sm font-normal text-white/40 ml-1">개</span>
          </p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">이번 주 출석</h2>
          <span className="text-xs text-white/40">{weekLogged.length} / 7일</span>
        </div>
        <div className="flex gap-2">
          {DAYS.map((day, i) => {
            const isToday = i === todayIndex
            const isLogged = loggedDates.includes(weekDates[i])
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full aspect-square rounded-md border flex items-center justify-center transition-colors ${
                  isLogged
                    ? 'bg-white border-white'
                    : isToday
                    ? 'border-white/60 bg-white/10'
                    : 'border-white/10 bg-white/5'
                }`}>
                  {isLogged && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {!isLogged && isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </div>
                <span className={`text-xs ${isToday ? 'text-white' : 'text-white/30'}`}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">이번 주 요약</h2>
          <button className="text-xs text-white/40 hover:text-white transition-colors">분석하기</button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/30 text-center py-8">
          아직 주간 분석이 없어요.<br/>기록을 쌓고 분석하기 버튼을 눌러보세요.
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">성장 추천</h2>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/30 text-center py-8">
          기록이 쌓이면 맞춤 추천이 나타나요.
        </div>
      </div>
    </div>
  )
}
