'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'

const DEFAULT_TAGS = ['개발', '기획', '설계', '협업', '문서', '리뷰', '테스트', '배포', '회의', '학습', '기타']

export default function Log() {
  const [did, setDid] = useState('')
  const [learned, setLearned] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tags, setTags] = useState(DEFAULT_TAGS)
  const [newTag, setNewTag] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [highlightedTag, setHighlightedTag] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
      setSelectedTags(prev => [...prev, trimmed])
      setHighlightedTag(trimmed)
      setTimeout(() => setHighlightedTag(null), 3000)
    }
    setNewTag('')
    setShowInput(false)
  }

  const handleSave = async () => {
    if (!did.trim()) {
      alert('오늘 한 일을 입력해주세요!')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요해요!')
      setLoading(false)
      return
    }
    const { error } = await supabase.from('logs').insert({
      user_id: user.id,
      log_date: new Date().toISOString().split('T')[0],
      did,
      learned: learned || null,
      tomorrow: tomorrow || null,
      tags: selectedTags,
      memo: memo || null,
    })
    if (error) {
      alert('저장 중 오류가 발생했어요: ' + error.message)
    } else {
      setToast(true)
      setTimeout(() => setToast(false), 3000)
      setDid('')
      setLearned('')
      setTomorrow('')
      setMemo('')
      setSelectedTags([])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">오늘의 기록</h1>
      <p className="text-white/40 text-sm mb-10">오늘 하루를 기록해보세요</p>

      <div className="flex flex-col gap-6">

        <div>
          <label className="text-sm text-white/60 mb-2 block">오늘 한 일 *</label>
          <textarea
            value={did}
            onChange={e => setDid(e.target.value)}
            placeholder="오늘 어떤 일을 했나요?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30 transition-colors"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm text-white/60 mb-2 block">배운 것</label>
          <textarea
            value={learned}
            onChange={e => setLearned(e.target.value)}
            placeholder="오늘 새롭게 배운 것이 있나요?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30 transition-colors"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm text-white/60 mb-2 block">내일 할 일</label>
          <textarea
            value={tomorrow}
            onChange={e => setTomorrow(e.target.value)}
            placeholder="내일 해야 할 일은 무엇인가요?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30 transition-colors"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm text-white/60 mb-3 block">태그</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs border transition-all duration-500 ${
                  highlightedTag === tag
                    ? 'bg-white text-black border-white scale-110'
                    : selectedTags.includes(tag)
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/60 border-white/20 hover:border-white/40'
                }`}
              >
                {tag}
              </button>
            ))}
            {showInput ? (
              <input
                autoFocus
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                onBlur={addTag}
                placeholder="태그 입력"
                className="px-3 py-1 rounded-full text-xs border border-white/40 bg-white/5 text-white placeholder-white/30 focus:outline-none w-24"
              />
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="px-3 py-1 rounded-full text-xs border border-white/20 text-white/40 hover:border-white/40 hover:text-white/60 transition-colors"
              >
                + 추가
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm text-white/60 mb-2 block">기타 사항</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="메모, 링크, 참고자료 등"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30 transition-colors"
            rows={2}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? '저장 중...' : '기록 저장'}
        </button>

      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black text-sm px-6 py-3 rounded-full shadow-lg">
          기록이 저장됐어요 ✓
        </div>
      )}
    </div>
  )
}
