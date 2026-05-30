'use client'

import { useEffect, useState } from 'react'
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
  const [summary, setSummary] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [allTags, setAllTags] = useState(DEFAULT_TAGS)
  const [saving, setSaving] = useState(false)
  const [editingLog, setEditingLog] = useState<Log | null>(null)
  const [activeDate, setActiveDate] = useState<string>('')

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
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
      const logsData = data || []
      setLogs(logsData)
      const usedTags = logsData.flatMap((l: Log) => l.tags || [])
      const extra = usedTags.filter((t: string) => !DEFAULT_TAGS.includes(t))
      if (extra.length) setAllTags([...DEFAULT_TAGS, ...new Set(extra)])

      // 오늘 일지 있으면 기본으로 로드
      const todayLog = logsData.find((l: Log) => l.log_date === todayStr)
      if (todayLog) {
        loadLog(todayLog)
      } else {
        setActiveDate(todayStr)
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const loadLog = (log: Log) => {
    setEditingLog(log)
    setActiveDate(log.log_date)
    setContent(log.content || '')
    setSummary(log.summary || '')
    setSelectedTags(log.tags || [])
  }

  const resetForm = () => {
    setEditingLog(null)
    setActiveDate(todayStr)
    setContent('')
    setSummary('')
    setSelectedTags([])
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
    setShowCustomInput(false)
  }

  const handleSave = async () => {
    if (!content.trim() || !userId) return
    setSaving(true)
    const supabase = createClient()

    if (editingLog) {
      const { error } = await supabase
        .from('logs')
        .update({ content, summary, tags: selectedTags })
        .eq('id', editingLog.id)
      if (!error) {
        setLogs(prev => prev.map(l =>
          l.id === editingLog.id ? { ...l, content, summary, tags: selectedTags } : l
        ))
        setEditingLog(prev => prev ? { ...prev, content, summary, tags: selectedTags } : null)
      }
    } else {
      const { data, error } = await supabase
        .from('logs')
        .insert({ user_id: userId, log_date: todayStr, content, summary, tags: selectedTags })
        .select()
        .single()
      if (!error && data) {
        setLogs(prev => [data, ...prev])
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">일지 기록</h1>
      <p className="text-white/40 text-sm mb-10">오늘 하루를 기록하거나 이전 기록을 수정하세요.</p>

      <div className="flex gap-8 items-start">
        {/* 왼쪽: 입력 폼 */}
        <div className="w-[420px] flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatDate(activeDate)}
                  <span className="text-white/30 ml-1.5">({getDayLabel(activeDate)})</span>
                </span>
                {isToday && (
                  <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">오늘</span>
                )}
                {!isToday && (
                  <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-full">수정 중</span>
                )}
              </div>
              {!isToday && (
                <button
                  onClick={resetForm}
                  className="text-xs text-white/30 hover:text-white transition-colors"
                >
                  오늘로 돌아가기
                </button>
              )}
            </div>

            {/* 오늘 한 일 */}
            <div className="mb-4">
              <label className="text-xs text-white/40 mb-2 block">오늘 한 일</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="오늘 어떤 일을 했나요?"
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
              />
            </div>

            {/* 하루 요약 */}
            <div className="mb-4">
              <label className="text-xs text-white/40 mb-2 block">하루 요약 <span className="text-white/20">(Gemini 연동 예정)</span></label>
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="곧 AI가 자동으로 요약해드려요"
                disabled
                className="w-full bg-white/3 border border-white/5 rounded-lg px-4 py-3 text-sm text-white/20 placeholder-white/15 cursor-not-allowed"
              />
            </div>

            {/* 태그 */}
            <div className="mb-6">
              <label className="text-xs text-white/40 mb-2 block">태그</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/8 text-white/50 hover:bg-white/15'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {showCustomInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                      placeholder="태그 입력"
                      className="bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-white placeholder-white/30 focus:outline-none w-24"
                    />
                    <button onClick={addCustomTag} className="text-xs text-white/50 hover:text-white">추가</button>
                    <button onClick={() => setShowCustomInput(false)} className="text-xs text-white/30 hover:text-white">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/30 hover:bg-white/10 border border-dashed border-white/20"
                  >
                    + 직접 입력
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30"
            >
              {saving ? '저장 중...' : editingLog ? '수정 완료' : '기록 저장'}
            </button>
          </div>
        </div>

        {/* 오른쪽: 타임라인 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium mb-6 text-white/60">기록 타임라인</h2>
          {loading ? (
            <div className="text-white/30 text-sm text-center py-8">불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div className="text-white/20 text-sm text-center py-12">아직 기록이 없어요.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/8" />
              <div className="flex flex-col gap-6">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`flex gap-4 relative cursor-pointer group`}
                    onClick={() => loadLog(log)}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 mt-1 flex-shrink-0 z-10 transition-all ${
                      activeDate === log.log_date
                        ? 'bg-white border-white scale-110'
                        : log.log_date === todayStr
                        ? 'bg-white border-white'
                        : 'bg-[#0a0a0a] border-white/25 group-hover:border-white/50'
                    }`} />
                    <div className={`flex-1 pb-2 rounded-lg transition-all ${
                      activeDate === log.log_date ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-white/50">{formatDate(log.log_date)}</span>
                        <span className="text-xs text-white/25">{getDayLabel(log.log_date)}</span>
                        {log.log_date === todayStr && (
                          <span className="text-xs bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">오늘</span>
                        )}
                        <span className="text-xs text-white/20 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          클릭해서 수정 →
                        </span>
                      </div>
                      {log.summary && (
                        <p className="text-sm font-medium text-white mb-1.5">{log.summary}</p>
                      )}
                      <p className="text-sm text-white/45 leading-relaxed mb-2 whitespace-pre-wrap line-clamp-3">
                        {log.content}
                      </p>
                      {log.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.tags.map(tag => (
                            <span key={tag} className="text-xs bg-white/8 text-white/35 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
