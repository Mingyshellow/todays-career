'use client'

const MOCK_WEEKS = [
  { label: '이번 주', date: '2026.05.26 - 06.01' },
  { label: '지난 주', date: '2026.05.19 - 05.25' },
]

export default function Report() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">주간 리포트</h1>
      <p className="text-white/40 text-sm mb-10">AI가 분석한 나의 한 주</p>

      <div className="flex gap-2 mb-8">
        {MOCK_WEEKS.map((w, i) => (
          <button
            key={w.label}
            className={`px-4 py-2 rounded-full text-xs border transition-colors ${
              i === 0
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/60 border-white/20 hover:border-white/40'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-xs text-white/40 mb-3">이번 주 요약</p>
          <p className="text-sm text-white/30 text-center py-6">
            아직 분석된 리포트가 없어요.<br/>
            기록을 쌓고 분석하기 버튼을 눌러보세요.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-xs text-white/40 mb-4">핵심 키워드</p>
          <div className="flex flex-wrap gap-2">
            {['—', '—', '—', '—', '—'].map((k, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs border border-white/10 text-white/20">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-xs text-white/40 mb-3">이력서 문장 제안</p>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-white/20 text-xs mt-0.5">•</span>
                <p className="text-sm text-white/20">분석 후 이력서 문장이 생성돼요.</p>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors">
          이번 주 분석하기
        </button>

      </div>
    </div>
  )
}
