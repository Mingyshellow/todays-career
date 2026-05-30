'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

type Log = {
  id: string
  log_date: string
  content: string
  tags: string[]
}

export default function ReportPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const fetchLogs = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })
      setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const monthLogs = logs.filter(l => l.log_date.startsWith(selectedMonth))

  // 월 목록 생성
  const getMonthOptions = () => {
    if (logs.length === 0) return [selectedMonth]
    const months = new Set(logs.map(l => l.log_date.slice(0, 7)))
    const now = new Date()
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    return [...months].sort().reverse()
  }

  // 히트맵 데이터
  const getDaysInMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const days = new Date(y, m, 0).getDate()
    const firstDay = new Date(y, m - 1, 1).getDay()
    const offset = firstDay === 0 ? 6 : firstDay - 1
    return { days, offset }
  }

  const loggedDates = new Set(monthLogs.map(l => l.log_date))

  // 요일별 기록 횟수
  const dayLabels = ['월', '화', '수', '목', '금', '토', '일']
  const dayCount = Array(7).fill(0)
  monthLogs.forEach(l => {
    const day = new Date(l.log_date).getDay()
    const idx = day === 0 ? 6 : day - 1
    dayCount[idx]++
  })
  const maxDayCount = Math.max(...dayCount, 1)

  // 태그별 비율
  const tagCount: Record<string, number> = {}
  monthLogs.forEach(l => {
    (l.tags || []).forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  const totalTags = Object.values(tagCount).reduce((a, b) => a + b, 0)
  const tagEntries = Object.entries(tagCount).sort((a, b) => b[1] - a[1])

  // 도넛 차트 계산
  const COLORS = ['#ffffff', '#aaaaaa', '#666666', '#444444', '#888888', '#cccccc']
  const donutSegments = (() => {
    if (totalTags === 0) return []
    let cumulative = 0
    return tagEntries.map(([tag, count], i) => {
      const pct = count / totalTags
      const start = cumulative
      cumulative += pct
      const startAngle = start * 2 * Math.PI - Math.PI / 2
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
      const r = 60
      const x1 = 80 + r * Math.cos(startAngle)
      const y1 = 80 + r * Math.sin(startAngle)
      const x2 = 80 + r * Math.cos(endAngle)
      const y2 = 80 + r * Math.sin(endAngle)
      const largeArc = pct > 0.5 ? 1 : 0
      return { tag, count, pct, path: `M 80 80 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: COLORS[i % COLORS.length] }
    })
  })()

  // 일별 기록 양 (라인 차트)
  const [y, m] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const dailyLength = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${selectedMonth}-${String(i + 1).padStart(2, '0')}`
    const log = monthLogs.find(l => l.log_date === dateStr)
    return log ? (log.content?.length || 0) : 0
  })
  const maxLen = Math.max(...dailyLength, 1)

  // 라인 차트 SVG 경로
  const chartW = 400
  const chartH = 100
  const linePoints = dailyLength.map((len, i) => {
    const x = (i / (daysInMonth - 1)) * chartW
    const y = chartH - (len / maxLen) * chartH
    return `${x},${y}`
  }).join(' ')

  const { days, offset } = getDaysInMonth()
  const totalCells = 42
  const calCells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - offset + 1
    if (day < 1 || day > days) return null
    return day
  })

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-')
    return `${y}년 ${parseInt(mo)}월`
  }

  const attendanceRate = days > 0 ? Math.round((monthLogs.length / days) * 100) : 0

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">주간 리포트</h1>
      <div className="text-white/20 text-sm text-center py-20">불러오는 중...</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">리포트</h1>
          <p className="text-white/40 text-sm">나의 커리어 성장을 한눈에 확인하세요.</p>
        </div>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer"
        >
          {getMonthOptions().map(mo => (
            <option key={mo} value={mo} className="bg-[#0a0a0a]">{formatMonth(mo)}</option>
          ))}
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: '이번 달 기록', value: monthLogs.length, unit: '일' },
          { label: '출석률', value: attendanceRate, unit: '%' },
          { label: '사용한 태그', value: Object.keys(tagCount).length, unit: '개' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 mb-2">{label}</p>
            <p className="text-3xl font-bold">
              {value}
              <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 히트맵 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">출석 히트맵</h2>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['월', '화', '수', '목', '금', '토', '일'].map(d => (
              <div key={d} className="text-center text-xs text-white/20">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calCells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="aspect-square" />
              const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`
              const isLogged = loggedDates.has(dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              return (
                <div
                  key={dateStr}
                  className={`aspect-square rounded-sm flex items-center justify-center ${
                    isLogged ? 'bg-white' : isToday ? 'border border-white/40 bg-white/5' : 'bg-white/5'
                  }`}
                >
                  <span className={`text-[9px] ${isLogged ? 'text-black font-bold' : 'text-white/30'}`}>{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 도넛 차트 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">태그별 비율</h2>
          {totalTags === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/20 text-sm">태그 데이터가 없어요</div>
          ) : (
            <div className="flex items-center gap-6">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {donutSegments.map((seg, i) => (
                  <path key={i} d={seg.path} fill={seg.color} opacity={0.9} />
                ))}
                <circle cx="80" cy="80" r="35" fill="#0a0a0a" />
                <text x="80" y="76" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{totalTags}</text>
                <text x="80" y="90" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">총 태그</text>
              </svg>
              <div className="flex flex-col gap-2 flex-1">
                {tagEntries.slice(0, 5).map(([tag, count], i) => (
                  <div key={tag} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-white/60 flex-1 truncate">{tag}</span>
                    <span className="text-xs text-white/40">{Math.round(count / totalTags * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 요일별 바 차트 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-6">요일별 기록</h2>
          <div className="flex items-end gap-2 h-32">
            {dayCount.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-white/40">{count || ''}</span>
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(count / maxDayCount) * 80}px`,
                      minHeight: count > 0 ? '4px' : '0',
                      backgroundColor: count > 0 ? 'white' : 'rgba(255,255,255,0.08)'
                    }}
                  />
                  {count === 0 && <div className="w-full h-1 bg-white/8 rounded-t-md" />}
                </div>
                <span className="text-xs text-white/30">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 일별 라인 차트 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">일별 기록량</h2>
          {monthLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/20 text-sm">기록 데이터가 없어요</div>
          ) : (
            <div className="relative">
              <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 20}`} preserveAspectRatio="none" className="overflow-visible">
                {/* 그리드 */}
                {[0, 0.5, 1].map((v, i) => (
                  <line key={i} x1="0" y1={chartH - v * chartH} x2={chartW} y2={chartH - v * chartH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {/* 영역 채우기 */}
                <polyline
                  points={`0,${chartH} ${linePoints} ${chartW},${chartH}`}
                  fill="rgba(255,255,255,0.05)"
                  stroke="none"
                />
                {/* 라인 */}
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* 점 */}
                {dailyLength.map((len, i) => len > 0 && (
                  <circle
                    key={i}
                    cx={(i / (daysInMonth - 1)) * chartW}
                    cy={chartH - (len / maxLen) * chartH}
                    r="3"
                    fill="white"
                  />
                ))}
              </svg>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-white/20">1일</span>
                <span className="text-xs text-white/20">{Math.floor(daysInMonth / 2)}일</span>
                <span className="text-xs text-white/20">{daysInMonth}일</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
