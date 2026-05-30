'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [justChecked, setJustChecked] = useState(false)

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
    if (!userId || isTodayChecked || checking) return
    setChecking(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('logs')
      .insert({ user_id: userId, log_date: todayStr, content: '출석체크' })
    if (!error) {
      setLogs(prev => [...prev, { log_date: todayStr }])
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 600)
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

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  // 6주 고정 (42칸) - 항상 같은 높이 유지
  const totalCells = 42
  const calendarDays = Array.from({ length: totalCells }, (_, i) => {
    const day = i - startOffset + 1
    if (day < 1 || day > daysInMonth) return null
    return day
  })

  const formatDate = (d: number) => {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const isNextDisabled = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <button
          onClick={handleCheckIn}
          disabled={isTodayChecked || checking || loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            isTodayChecked
              ? 'bg-white/10 text-white/40 cursor-default'
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
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-2">{label}</p>
            <p className="text-2xl font-bold">
              {loading ? '—' : value}
              <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 달력 */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium">출석 달력</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg"
            >‹</button>
            <span className="text-sm text-white/60 w-16 text-center tabular-nums">
              {year}.{String(month + 1).padStart(2, '0')}
            </span>
            <button
              onClick={() => !isNextDisabled && setCurrentDate(new Date(year, month + 1, 1))}
              disabled={isNextDisabled}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all text-lg ${
                isNextDisabled ? 'text-white/20 cursor-default' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >›</button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {['월', '화', '수', '목', '금', '토', '일'].map(d => (
            <div key={d} className="text-center text-xs text-white/20 py-1 font-medium">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square" />
            const dateStr = formatDate(day)
            const isLogged = loggedDates.includes(dateStr)
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            const isJustChecked = justChecked && isToday

            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all duration-300 ${
                  isLogged
                    ? 'bg-white shadow-lg shadow-white/10'
                    : isToday
                    ? 'border-2 border-white/50 bg-white/5'
                    : isFuture
                    ? 'bg-transparent'
                    : 'bg-white/5 hover:bg-white/8'
                } ${isJustChecked ? 'scale-110' : ''}`}
              >
                {isLogged ? (
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`transition-all duration-300 ${isJustChecked ? 'scale-125' : ''}`}
                  >
                    <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span className={`text-xs font-medium ${
                    isToday ? 'text-white' : isFuture ? 'text-white/15' : 'text-white/35'
                  }`}>
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
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm text-white/25 text-center">
          아직 주간 분석이 없어요.<br/>기록을 쌓고 분석하기 버튼을 눌러보세요.
        </div>
      </div>

      {/* 성장 추천 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">성장 추천</h2>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm text-white/25 text-center">
          기록이 쌓이면 맞춤 추천이 나타나요.
        </div>
      </div>

      <style jsx>{`
        @keyframes checkPop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
