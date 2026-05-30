'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

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

  const loggedDates = [...new Set(logs.map(l => l.log_date))] as string[]
  const isTodayChecked = loggedDates.includes(todayStr)

  const handleCheckIn = async () => {
    if (!userId || isTodayChecked) return
    setChecking(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('logs')
      .insert({ user_id: userId, log_date: todayStr, content: '출석체크' })
    if (!error) setLogs(prev => [...prev, { log_date: todayStr }])
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

  // 이번 주 기록 수
  const getWeekLogged = () => {
    const day = today.getDay() === 0 ? 7 : today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - day + 1)
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
    return weekDates.filter(d => loggedDates.includes(d)).length
  }

  // 달력 계산
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1 // 월요일 시작

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => {
    const next = new Date(year, month + 1, 1)
    if (next <= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentDate(next)
    }
  }
  const isNextDisabled = year === today.getFullYear() && month === today.getMonth()

  const calendarDays = Array.from({ length: startOffset + daysInMonth }, (_, i) => {
    if (i < startOffset) return null
    return i - startOffset + 1
  })

  const formatDate = (d: number) => {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* 헤더 */}
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

      {/* 스탯 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: '연속 기록', value: getStreak(), unit: '일' },
          { label: '이번 주 기록', value: getWeekLogged(), unit: '개' },
          { label: '총 기록', value: loggedDates.length, unit: '개' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-white/40 mb-1">{label}</p>
            <p className="text-2xl font-bold">
              {loading ? '—' : value}
              <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 달력 */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">출석 달력</h2>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="text-white/40 hover:text-white transition-colors text-lg leading-none">‹</button>
            <span className="text-sm text-white/60 w-16 text-center">
              {year}.{String(month + 1).padStart(2, '0')}
            </span>
            <button
              onClick={nextMonth}
              disabled={isNextDisabled}
              className={`text-lg leading-none transition-colors ${isNextDisabled ? 'text-white/20 cursor-default' : 'text-white/40 hover:text-white'}`}
            >›</button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {['월', '화', '수', '목', '금', '토', '일'].map(d => (
            <div key={d} className="text-center text-xs text-white/30 py-1">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const dateStr = formatDate(day)
            const isLogged = loggedDates.includes(dateStr)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr

            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-md flex flex-col items-center justify-center transition-colors ${
                  isLogged
                    ? 'bg-white'
                    : isToday
                    ? 'border border-white/60 bg-white/10'
                    : isFuture
                    ? 'bg-white/3'
                    : 'bg-white/5'
                }`}
              >
                {isLogged ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className={`text-xs ${isToday ? 'text-white' : isFuture ? 'text-white/20' : 'text-white/40'}`}>
                    {day}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 이번 주 요약 */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">이번 주 요약</h2>
          <button className="text-xs text-white/40 hover:text-white transition-colors">분석하기</button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/30 text-center py-8">
          아직 주간 분석이 없어요.<br/>기록을 쌓고 분석하기 버튼을 눌러보세요.
        </div>
      </div>

      {/* 성장 추천 */}
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
