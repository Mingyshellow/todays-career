'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase'

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [justChecked, setJustChecked] = useState(false)
  const [entered, setEntered] = useState(false)

  const section2Ref = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  useEffect(() => {
    setTimeout(() => setEntered(true), 100)
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
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
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

  const scrollToSection2 = () => {
    section2Ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="overflow-x-hidden">

      {/* 섹션 1: 풀스크린 히어로 */}
      <section className="h-screen flex flex-col items-center justify-center relative bg-[#0a0a0a]">

        <div className={`text-center transition-all duration-1000 ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs tracking-[0.3em] text-white/30 uppercase mb-6">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4 leading-none">
            오늘의
          </h1>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-12 leading-none text-white/20">
            커리어
          </h1>

          <div className={`transition-all duration-1000 delay-300 ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {loading ? (
              <div className="w-48 h-12 bg-white/5 rounded-lg animate-pulse mx-auto" />
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={isTodayChecked || checking}
                className={`px-10 py-3.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isTodayChecked
                    ? 'bg-white/10 text-white/40 cursor-default'
                    : 'bg-white text-black hover:bg-white/90 active:scale-95'
                }`}
              >
                {isTodayChecked ? '✓ 오늘 출석 완료' : checking ? '기록 중...' : '오늘 출석체크'}
              </button>
            )}
          </div>

          {!loading && (
            <div className={`flex gap-8 mt-12 justify-center transition-all duration-1000 delay-500 ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {[
                { label: '연속 기록', value: getStreak(), unit: '일' },
                { label: '이번 주', value: getWeekLogged(), unit: '개' },
                { label: '총 기록', value: loggedDates.length, unit: '개' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold">{value}<span className="text-sm text-white/30 ml-1">{unit}</span></p>
                  <p className="text-xs text-white/30 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={scrollToSection2}
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 hover:text-white/50 transition-all duration-1000 delay-700 ${entered ? 'opacity-100' : 'opacity-0'}`}
        >
          <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/20 relative overflow-hidden">
            <div className="w-full h-full bg-white/60 animate-bounce" style={{ animationDuration: '1.5s' }} />
          </div>
        </button>
      </section>

      {/* 섹션 2: 출석 달력 */}
      <section ref={section2Ref} className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-24">
        <div className="w-full max-w-2xl px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-xs tracking-[0.3em] text-white/20 uppercase mb-2">Attendance</p>
              <h2 className="text-3xl font-bold">출석 달력</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg"
              >‹</button>
              <span className="text-sm text-white/50 w-20 text-center tabular-nums">
                {year}.{String(month + 1).padStart(2, '0')}
              </span>
              <button
                onClick={() => !isNextDisabled && setCurrentDate(new Date(year, month + 1, 1))}
                disabled={isNextDisabled}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all text-lg ${
                  isNextDisabled ? 'text-white/15 cursor-default' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >›</button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-3">
            {['월', '화', '수', '목', '금', '토', '일'].map(d => (
              <div key={d} className="text-center text-xs text-white/20 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="aspect-square" />
              const dateStr = formatDate(day)
              const isLogged = loggedDates.includes(dateStr)
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr
              const isJustChecked = justChecked && isToday
              return (
                <div
                  key={dateStr}
                  style={{ transition: 'all 0.3s ease' }}
                  className={`aspect-square rounded-xl flex items-center justify-center ${
                    isLogged ? 'bg-white' : isToday ? 'border-2 border-white/50 bg-white/5' : isFuture ? '' : 'bg-white/5'
                  } ${isJustChecked ? 'scale-110' : ''}`}
                >
                  {isLogged ? (
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className={`text-sm ${isToday ? 'text-white font-medium' : isFuture ? 'text-white/15' : 'text-white/35'}`}>
                      {day}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-10 flex items-center justify-between text-sm text-white/30">
            <span>{month + 1}월 {loggedDates.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length}일 기록</span>
            <span>연속 {getStreak()}일 🔥</span>
          </div>
        </div>
      </section>

      {/* 섹션 3: 이번 주 요약 */}
      <section className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-24">
        <div className="w-full max-w-2xl px-6">
          <p className="text-xs tracking-[0.3em] text-white/20 uppercase mb-2">Weekly</p>
          <h2 className="text-3xl font-bold mb-12">이번 주 요약</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/20 text-sm mb-2">아직 주간 분석이 없어요.</p>
            <p className="text-white/15 text-xs">Gemini 연동 후 기록을 분석해드려요.</p>
          </div>

          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/20 text-sm mb-2">성장 추천</p>
            <p className="text-white/15 text-xs">기록이 쌓이면 맞춤 추천이 나타나요.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
