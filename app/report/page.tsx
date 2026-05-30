'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

type Log = {
  id: string
  log_date: string
  content: string
  tags: string[]
}

const COLORS = ['#ffffff', '#bbbbbb', '#888888', '#555555', '#aaaaaa', '#dddddd']

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

  const getMonthOptions = () => {
    const months = new Set(logs.map(l => l.log_date.slice(0, 7)))
    const now = new Date()
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    return [...months].sort().reverse()
  }

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-')
    return `${y}년 ${parseInt(mo)}월`
  }

  // 태그 집계
  const tagCount: Record<string, number> = {}
  monthLogs.forEach(l => {
    (l.tags || []).forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  const totalTags = Object.values(tagCount).reduce((a, b) => a + b, 0)
  const tagEntries = Object.entries(tagCount).sort((a, b) => b[1] - a[1])
  const topTag = tagEntries[0]?.[0] || '없음'
  const totalChars = monthLogs.reduce((acc, l) => acc + (l.content?.length || 0), 0)

  // 도넛 차트
  const donutSegments = (() => {
    if (totalTags === 0) return []
    let cumulative = 0
    return tagEntries.map(([tag, count], i) => {
      const pct = count / totalTags
      const start = cumulative
      cumulative += pct
      const r = 80
      const cx = 110
      const cy = 110
      const startAngle = start * 2 * Math.PI - Math.PI / 2
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
      const x1 = cx + r * Math.cos(startAngle)
      const y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle)
      const y2 = cy + r * Math.sin(endAngle)
      const largeArc = pct > 0.5 ? 1 : 0
      return {
        tag, count, pct,
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: COLORS[i % COLORS.length]
      }
    })
  })()

  // 라인 차트
  const [y, mo] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const dailyLength = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${selectedMonth}-${String(i + 1).padStart(2, '0')}`
    const log = monthLogs.find(l => l.log_date === dateStr)
    return log ? (log.content?.length || 0) : 0
  })
  const maxLen = Math.max(...dailyLength, 1)
  const chartW = 500
  const chartH = 120
  const linePoints = dailyLength.map((len, i) => {
    const x = daysInMonth === 1 ? chartW / 2 : (i / (daysInMonth - 1)) * chartW
    const yVal = chartH - (len / maxLen) * chartH
    return `${x},${yVal}`
  }).join(' ')
  const areaPoints = `0,${chartH} ${linePoints} ${chartW},${chartH}`

  // 주별 데이터
  const getWeeks = () => {
    const weeks: { label: string; logs: Log[] }[] = []
    const firstDay = new Date(y, mo - 1, 1)
    const lastDay = new Date(y, mo, 0)
    let current = new Date(firstDay)
    let weekNum = 1
    while (current <= lastDay) {
      const weekStart = new Date(current)
      const weekEnd = new Date(current)
      weekEnd.setDate(weekEnd.getDate() + 6)
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime())
      const weekLogs = monthLogs.filter(l => {
        const d = l.log_date
        const ws = weekStart.toISOString().split('T')[0]
        const we = weekEnd.toISOString().split('T')[0]
        return d >= ws && d <= we
      })
      const startStr = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
      const endStr = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
      weeks.push({ label: `${weekNum}주차 (${startStr}~${endStr})`, logs: weekLogs })
      current.setDate(current.getDate() + 7)
      weekNum++
    }
    return weeks
  }
  const weeks = getWeeks()

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">리포트</h1>
      <div className="text-white/20 text-sm text-center py-20">불러오는 중...</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">리포트</h1>
          <p className="text-white/40 text-sm">활동 내용을 분석하고 성장을 확인하세요.</p>
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
          { label: '기록한 날', value: monthLogs.length, unit: '일' },
          { label: '총 작성량', value: totalChars > 1000 ? `${(totalChars / 1000).toFixed(1)}k` : totalChars, unit: '자' },
          { label: '주요 활동', value: topTag, unit: '' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 mb-2">{label}</p>
            <p className="text-2xl font-bold truncate">
              {value}
              {unit && <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* 도넛 + 태그 목록 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium mb-6">태그별 활동 비율</h2>
        {totalTags === 0 ? (
          <div className="text-center text-white/20 text-sm py-12">이번 달 태그 데이터가 없어요</div>
        ) : (
          <div className="flex items-center gap-10">
            {/* 도넛 차트 크게 */}
            <div className="flex-shrink-0">
              <svg width="220" height="220" viewBox="0 0 220 220">
                {donutSegments.map((seg, i) => (
                  <path key={i} d={seg.path} fill={seg.color} opacity={0.85} />
                ))}
                <circle cx="110" cy="110" r="50" fill="#0d0d0d" />
                <text x="110" y="104" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{totalTags}</text>
                <text x="110" y="122" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11">총 태그 사용</text>
              </svg>
            </div>

            {/* 태그 목록 */}
            <div className="flex-1 flex flex-col gap-3">
              {tagEntries.map(([tag, count], i) => (
                <div key={tag} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-white/70 w-20 truncate">{tag}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(count / totalTags) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-10 text-right">{Math.round(count / totalTags * 100)}%</span>
                  <span className="text-xs text-white/25 w-8 text-right">{count}회</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 라인 차트 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium mb-6">일별 기록량</h2>
        {monthLogs.length === 0 ? (
          <div className="text-center text-white/20 text-sm py-8">기록 데이터가 없어요</div>
        ) : (
          <>
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="overflow-visible mb-2" style={{ height: '120px' }}>
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <line key={i} x1="0" y1={chartH - v * chartH} x2={chartW} y2={chartH - v * chartH}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              ))}
              <polyline points={areaPoints} fill="rgba(255,255,255,0.04)" stroke="none" />
              <polyline points={linePoints} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinejoin="round" />
              {dailyLength.map((len, i) => len > 0 && (
                <circle key={i}
                  cx={daysInMonth === 1 ? chartW / 2 : (i / (daysInMonth - 1)) * chartW}
                  cy={chartH - (len / maxLen) * chartH}
                  r="3.5" fill="white"
                />
              ))}
            </svg>
            <div className="flex justify-between">
              <span className="text-xs text-white/20">1일</span>
              <span className="text-xs text-white/20">{Math.floor(daysInMonth / 2)}일</span>
              <span className="text-xs text-white/20">{daysInMonth}일</span>
            </div>
          </>
        )}
      </div>

      {/* 주별 회고 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium">주별 활동 회고</h2>
          <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">Gemini 연동 예정</span>
        </div>
        <div className="flex flex-col gap-4">
          {weeks.map((week, i) => (
            <div key={i} className="border border-white/8 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/60">{week.label}</span>
                <span className="text-xs text-white/25">{week.logs.length}일 기록</span>
              </div>
              {week.logs.length === 0 ? (
                <p className="text-xs text-white/20">기록 없음</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* 이번 주 한 일 미리보기 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[...new Set(week.logs.flatMap(l => l.tags || []))].map(tag => (
                      <span key={tag} className="text-xs bg-white/8 text-white/40 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed line-clamp-2">
                    {week.logs.map(l => l.content).filter(Boolean).join(' · ')}
                  </p>
                  {/* Gemini 플레이스홀더 */}
                  <div className="mt-2 border border-dashed border-white/8 rounded-md p-3 text-xs text-white/20 text-center">
                    AI 회고 분석이 여기에 표시됩니다
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 월별 회고 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">월별 종합 보고서</h2>
          <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">Gemini 연동 예정</span>
        </div>
        {monthLogs.length === 0 ? (
          <div className="text-center text-white/20 text-sm py-8">이번 달 기록이 없어요</div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-white/40 leading-relaxed">
              {formatMonth(selectedMonth)}에 총 <span className="text-white/70">{monthLogs.length}일</span> 기록하셨어요.
              주요 활동은 <span className="text-white/70">{tagEntries.slice(0, 2).map(([t]) => t).join(', ')}</span>이었으며,
              총 <span className="text-white/70">{totalChars.toLocaleString()}자</span>를 작성하셨습니다.
            </div>
            <div className="border border-dashed border-white/8 rounded-lg p-4 text-xs text-white/20 text-center py-8">
              Gemini 연동 후 이 달의 성장 포인트, 잘한 점, 개선할 점을 AI가 분석해드려요
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
