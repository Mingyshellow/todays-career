'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase'

const DEFAULT_TAGS = ['개발', '디자인', '기획', '학습', '네트워킹', '기타']

type Log = {
  id: string
  log_date: string
  content: string
  summary: string
  tags: string[]
}

export default function LogPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [allTags, setAllTags] = useState(DEFAULT_TAGS)
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [editingLog, setEditingLog] = useState<Log | null>(null)
  const [activeDate, setActiveDate] = useState<string>('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchLogs = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
      const logsData = data || []
      setLogs(logsData)
      const usedTags = logsData.flatMap((l: Log) => l.tags || [])
      const extra = usedTags.filter((t: string) => !DEFAULT_TAGS.includes(t))
      if (extra.length) setAllTags([...DEFAULT_TAGS, ...new Set<string>(extra)])
      const todayLog = logsData.find((l: Log) => l.log_date === todayStr)
      if (todayLog) loadLog(todayLog)
      else setActiveDate(todayStr)
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const loadLog = (log: Log) => {
    setEditingLog(log)
    setActiveDate(log.log_date)
    setContent(log.content || '')
    setSelectedTags(log.tags || [])
  }

  const loadDate = (dateStr: string) => {
    const existing = logs.find(l => l.log_date === dateStr)
    if (existing) loadLog(existing)
    else {
      setEditingLog(null)
      setActiveDate(dateStr)
      setContent('')
      setSelectedTags([])
    }
  }

  const prevDate = () => {
    const d = new Date(activeDate)
    d.setDate(d.getDate() - 1)
    loadDate(d.toISOString().split('T')[0])
  }

  const nextDate = () => {
    if (activeDate >= todayStr) return
    const d = new Date(activeDate)
    d.setDate(d.getDate() + 1)
    loadDate(d.toISOString().split('T')[0])
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const tag = customTag.trim()
    if (!tag || allTags.includes(tag)) return
    setAllTags(prev => [...prev, tag])
    setSelectedTags(prev => [...prev, tag])
    setCustomTag('')
  }

  const handleSave = async () => {
    if (!content.trim() || !userId) return
    setSaving(true)

    // Gemini 요약 생성
    setSummarizing(true)
    let summary = editingLog?.summary || ''
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      summary = data.summary || summary
    } catch (e) {
      console.error('요약 생성 실패:', e)
    }
    setSummarizing(false)

    const supabase = createClient()
    if (editingLog) {
      const { error } = await supabase
        .from('logs')
        .update({ content, tags: selectedTags, summary })
        .eq('id', editingLog.id)
      if (!error) {
        setLogs(prev => prev.map(l =>
          l.id === editingLog.id ? { ...l, content, tags: selectedTags, summary } : l
        ))
        setEditingLog(prev => prev ? { ...prev, content, tags: selectedTags, summary } : null)
      }
    } else {
      const { data, error } = await supabase
        .from('logs')
        .insert({ user_id: userId, log_date: activeDate, content, tags: selectedTags, summary })
        .select()
        .single()
      if (!error && data) {
        setLogs(prev => [data, ...prev].sort((a, b) => b.log_date.localeCompare(a.log_date)))
        setEditingLog(data)
      }
    }
    setSaving(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  const getDayLabel = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days[new Date(dateStr).getDay()]
  }

  const isToday = activeDate === todayStr
  const hasLog = !!editingLog

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">일지 기록</h1>
      <p className="text-white/40 text-sm mb-10">오늘 하루를 기록하거나 이전 기록을 수정하세요.</p>
      <div className="flex items-center justify-center py-20">
        <div className="text-white/20 text-sm">불러오는 중...</div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">일지 기록</h1>
      <p className="text-white/40 text-sm mb-10">오늘 하루를 기록하거나 이전 기록을 수정하세요.</p>

      <div className="flex gap-8 items-start">

        {/* 왼쪽: 입력 폼 */}
        <div className="w-[420px] flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-20">

            {/* 날짜 네비게이션 */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevDate} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg">‹</button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatDate(activeDate)}
                  <span className="text-white/30 ml-1.5">({getDayLabel(activeDate)})</span>
                </span>
                {isToday && <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">오늘</span>}
                {!isToday && hasLog && <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-full">수정</span>}
              </div>
              <button
                onClick={nextDate}
                disabled={isToday}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all text-lg ${isToday ? 'text-white/15 cursor-default' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >›</button>
            </div>

            {!isToday && (
              <button onClick={() => loadDate(todayStr)} className="w-full text-xs text-white/30 hover:text-white/60 transition-colors mb-4 text-center">
                오늘로 돌아가기 →
              </button>
            )}

            {/* 한 일 */}
            <div className="mb-4 mt-4">
              <label className="text-xs text-white/40 mb-2 block">한 일</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={isToday ? '오늘 어떤 일을 했나요?' : `${formatDate(activeDate)}에 한 일을 기록해보세요.`}
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
              />
            </div>

            {/* 하루 요약 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/40">하루 요약</label>
                <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">Gemini</span>
              </div>
              <div className="w-full bg-white/3 border border-dashed border-white/8 rounded-lg px-4 py-3 text-xs min-h-[44px] flex items-center">
                {summarizing ? (
                  <span className="text-white/30 animate-pulse">AI가 요약 중...</span>
                ) : editingLog?.summary ? (
                  <span className="text-white/60">{editingLog.summary}</span>
                ) : (
                  <span className="text-white/20 text-center w-full">기록을 저장하면 AI가 자동으로 요약해드려요</span>
                )}
              </div>
            </div>

            {/* 태그 */}
            <div className="mb-6" ref={dropdownRef}>
              <label className="text-xs text-white/40 mb-2 block">태그</label>
              <div
                onClick={() => setTagDropdownOpen(prev => !prev)}
                className="min-h-[42px] w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-white/20 transition-colors"
              >
                {selectedTags.length === 0 && (
                  <span className="text-sm text-white/20">태그 선택...</span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-white/15 text-white/80 text-xs px-2 py-0.5 rounded-md">
                    {tag}
                    <button
                      onClick={e => { e.stopPropagation(); toggleTag(tag) }}
                      className="text-white/40 hover:text-white ml-0.5 leading-none"
                    >×</button>
                  </span>
                ))}
                <span className="ml-auto text-white/20 text-xs">{tagDropdownOpen ? '▲' : '▼'}</span>
              </div>

              {tagDropdownOpen && (
                <div className="mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-xl z-20 relative">
                  <div className="p-2 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          selectedTags.includes(tag)
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                        }`}
                      >
                        <span>{tag}</span>
                        {selectedTags.includes(tag) && <span className="text-white/50 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/8 p-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTag}
                        onChange={e => setCustomTag(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                        placeholder="+ 새 태그 추가"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none px-2 py-1"
                      />
                      {customTag.trim() && (
                        <button
                          onClick={addCustomTag}
                          className="text-xs text-white/50 hover:text-white bg-white/10 px-2 py-1 rounded-md transition-colors"
                        >
                          추가
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30"
            >
              {saving ? (summarizing ? 'AI 요약 중...' : '저장 중...') : hasLog ? '수정 완료' : '기록 저장'}
            </button>
          </div>
        </div>

        {/* 오른쪽: 타임라인 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium mb-6 text-white/60">기록 타임라인</h2>
          {logs.length === 0 ? (
            <div className="text-white/20 text-sm text-center py-12">아직 기록이 없어요.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/8" />
              <div className="flex flex-col gap-0">
                {logs.map((log, index) => {
                  const currentMonth = log.log_date.slice(0, 7)
                  const prevMonth = index > 0 ? logs[index - 1].log_date.slice(0, 7) : null
                  const showMonthHeader = currentMonth !== prevMonth
                  return (
                    <div key={log.id}>
                      {showMonthHeader && (
                        <div className="flex items-center gap-3 mb-4 mt-2 pl-6">
                          <span className="text-xs font-semibold text-white/25 tracking-widest">
                            {currentMonth.replace('-', '.')}
                          </span>
                          <div className="flex-1 h-px bg-white/8" />
                        </div>
                      )}
                      <div
                        className="flex gap-4 relative cursor-pointer group mb-6"
                        onClick={() => loadLog(log)}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 mt-1 flex-shrink-0 z-10 transition-all ${
                          activeDate === log.log_date
                            ? 'bg-white border-white scale-110'
                            : log.log_date === todayStr
                            ? 'bg-white border-white'
                            : 'bg-[#0a0a0a] border-white/25 group-hover:border-white/60'
                        }`} />
                        <div className={`flex-1 pb-2 transition-all ${
                          activeDate === log.log_date ? 'opacity-100' : 'opacity-50 group-hover:opacity-90'
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-white/70">
                              {String(new Date(log.log_date).getDate()).padStart(2, '0')}일
                            </span>
                            <span className="text-xs text-white/30">{getDayLabel(log.log_date)}</span>
                            {log.log_date === todayStr && (
                              <span className="text-xs bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">오늘</span>
                            )}
                            <span className="text-xs text-white/20 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                              수정하기 →
                            </span>
                          </div>
                          {log.summary && (
                            <p className="text-sm font-medium text-white mb-1.5">{log.summary}</p>
                          )}
                          <p className="text-sm text-white/75 leading-relaxed mb-2 whitespace-pre-wrap line-clamp-3">
                            {log.content}
                          </p>
                          {log.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {log.tags.map(tag => (
                                <span key={tag} className="text-xs bg-white/8 text-white/40 px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
