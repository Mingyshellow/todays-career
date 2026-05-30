'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

const JOB_CATEGORIES = [
  { id: 'developer', label: '개발자', icon: '💻' },
  { id: 'designer', label: '디자이너', icon: '🎨' },
  { id: 'planner', label: '기획자', icon: '📋' },
  { id: 'marketer', label: '마케터', icon: '📣' },
  { id: 'data', label: '데이터', icon: '📊' },
  { id: 'other', label: '기타', icon: '✏️' },
]

const SKILL_PLACEHOLDER: Record<string, string> = {
  developer: 'React, TypeScript, Node.js...',
  designer: 'Figma, Photoshop, Illustrator...',
  planner: '서비스 기획, 데이터 분석, Jira...',
  marketer: 'Google Ads, SEO, Meta Ads...',
  data: 'Python, SQL, Tableau...',
  other: '보유 스킬 입력...',
}

type Career = { company: string; role: string; period: string; description: string }
type Project = { name: string; description: string; tech: string; link: string }
type Education = { school: string; major: string; period: string }
type ResumeData = {
  job_id: string
  job_label: string
  name: string
  email: string
  phone: string
  github: string
  blog: string
  intro: string
  skills: string[]
  careers: Career[]
  projects: Project[]
  educations: Education[]
}

const defaultResume = (): ResumeData => ({
  job_id: '', job_label: '',
  name: '', email: '', phone: '', github: '', blog: '', intro: '',
  skills: [],
  careers: [{ company: '', role: '', period: '', description: '' }],
  projects: [{ name: '', description: '', tech: '', link: '' }],
  educations: [{ school: '', major: '', period: '' }],
})

export default function ResumePage() {
  const [step, setStep] = useState<'loading' | 'onboarding' | 'form'>('loading')
  const [resume, setResume] = useState<ResumeData>(defaultResume())
  const [customJob, setCustomJob] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [activeSection, setActiveSection] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [logCount, setLogCount] = useState(0)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // 기존 이력서 불러오기
      const { data: existing } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // 일지 수 불러오기
      const { count } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setLogCount(count || 0)

      if (existing) {
        setResumeId(existing.id)
        setResume({
          job_id: existing.job_id || '',
          job_label: existing.job_label || '',
          name: existing.name || '',
          email: existing.email || '',
          phone: existing.phone || '',
          github: existing.github || '',
          blog: existing.blog || '',
          intro: existing.intro || '',
          skills: existing.skills || [],
          careers: existing.careers?.length ? existing.careers : [{ company: '', role: '', period: '', description: '' }],
          projects: existing.projects?.length ? existing.projects : [{ name: '', description: '', tech: '', link: '' }],
          educations: existing.educations?.length ? existing.educations : [{ school: '', major: '', period: '' }],
        })
        setStep('form')
      } else {
        setStep('onboarding')
      }
    }
    init()
  }, [])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      user_id: userId,
      ...resume,
      job_label: resume.job_id === 'other' ? customJob : JOB_CATEGORIES.find(j => j.id === resume.job_id)?.label || '',
      updated_at: new Date().toISOString(),
    }
    if (resumeId) {
      await supabase.from('resumes').update(payload).eq('id', resumeId)
    } else {
      const { data } = await supabase.from('resumes').insert(payload).select().single()
      if (data) setResumeId(data.id)
    }
    setSaving(false)
    setSaveMsg('저장됐어요!')
    setTimeout(() => setSaveMsg(''), 2000)
    setStep('form')
  }

  const set = (key: keyof ResumeData, val: any) => setResume(prev => ({ ...prev, [key]: val }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || resume.skills.includes(s)) return
    set('skills', [...resume.skills, s])
    setSkillInput('')
  }

  const jobLabel = resume.job_id === 'other'
    ? customJob
    : JOB_CATEGORIES.find(j => j.id === resume.job_id)?.label || ''

  const sections = ['프로필', '스킬', '경력', '프로젝트', '교육']

  // 온보딩
  if (step === 'loading') return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-white/20 text-sm text-center py-20">불러오는 중...</div>
    </div>
  )

  if (step === 'onboarding') return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">이력서 시작하기</h1>
      <p className="text-white/40 text-sm mb-10">기본 정보를 입력하면 일지 기록을 바탕으로 이력서가 자동으로 채워져요.</p>

      {/* 직무 선택 */}
      <div className="mb-8">
        <label className="text-xs text-white/40 mb-3 block">직무 선택</label>
        <div className="grid grid-cols-3 gap-2">
          {JOB_CATEGORIES.map(job => (
            <button
              key={job.id}
              onClick={() => set('job_id', job.id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                resume.job_id === job.id
                  ? 'border-white bg-white/10'
                  : 'border-white/10 bg-white/5 hover:border-white/25'
              }`}
            >
              <div className="text-xl mb-1.5">{job.icon}</div>
              <div className="text-sm font-medium">{job.label}</div>
            </button>
          ))}
        </div>
        {resume.job_id === 'other' && (
          <input
            type="text"
            value={customJob}
            onChange={e => setCustomJob(e.target.value)}
            placeholder="직무명 입력 (예: UX 리서처)"
            className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        )}
      </div>

      {/* 기본 정보 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-medium mb-4">기본 정보</h2>
        <div className="flex flex-col gap-3">
          {([
            { key: 'name', label: '이름 *', placeholder: '홍길동' },
            { key: 'email', label: '이메일 *', placeholder: 'hello@example.com' },
            { key: 'phone', label: '연락처', placeholder: '010-0000-0000' },
            { key: 'github', label: resume.job_id === 'designer' ? '포트폴리오 URL' : 'GitHub / 링크', placeholder: 'https://' },
            { key: 'blog', label: '블로그 / 링크드인', placeholder: 'https://' },
          ] as { key: keyof ResumeData; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
              <input
                type="text"
                value={resume[key] as string}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!resume.job_id || !resume.name || !resume.email || saving || (resume.job_id === 'other' && !customJob.trim())}
        className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30"
      >
        {saving ? '저장 중...' : '이력서 시작하기 →'}
      </button>
    </div>
  )

  // 메인 폼
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">이력서</h1>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>{jobLabel}</span>
            <span>·</span>
            <span>일지 {logCount}개 기록됨</span>
            {logCount > 0 && <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-full">Gemini 자동완성 연동 예정</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-xs text-white/40">{saveMsg}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
          >
            PDF 저장
          </button>
        </div>
      </div>

      {/* 일지 기반 업데이트 알림 */}
      {logCount > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-sm text-white/70">일지 {logCount}개가 쌓였어요!</p>
            <p className="text-xs text-white/30 mt-0.5">Gemini 연동 후 일지 내용을 분석해 이력서를 자동으로 업데이트해드려요.</p>
          </div>
        </div>
      )}

      <div className="flex gap-8 items-start">
        {/* 왼쪽: 폼 */}
        <div className="w-[420px] flex-shrink-0">
          {/* 섹션 탭 */}
          <div className="flex gap-1 mb-5 flex-wrap">
            {sections.map((s, i) => (
              <button
                key={s}
                onClick={() => setActiveSection(i)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  activeSection === i ? 'bg-white text-black font-medium' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            {/* 프로필 */}
            {activeSection === 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">프로필</h3>
                {([
                  { key: 'name', label: '이름', placeholder: '홍길동' },
                  { key: 'email', label: '이메일', placeholder: 'hello@example.com' },
                  { key: 'phone', label: '연락처', placeholder: '010-0000-0000' },
                  { key: 'github', label: resume.job_id === 'designer' ? '포트폴리오 URL' : 'GitHub', placeholder: 'https://' },
                  { key: 'blog', label: '블로그 / 링크드인', placeholder: 'https://' },
                ] as { key: keyof ResumeData; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                    <input
                      type="text"
                      value={resume[key] as string}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                    />
                  </div>
                ))}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-white/40">자기소개</label>
                    <span className="text-xs text-white/20">Gemini 자동완성 예정</span>
                  </div>
                  <textarea
                    value={resume.intro}
                    onChange={e => set('intro', e.target.value)}
                    placeholder="간략한 자기소개를 작성해주세요."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 스킬 */}
            {activeSection === 1 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">스킬</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder={SKILL_PLACEHOLDER[resume.job_id] || '스킬 입력'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                  />
                  <button onClick={addSkill} className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors">추가</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map(s => (
                    <span key={s} className="flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">
                      {s}
                      <button onClick={() => set('skills', resume.skills.filter(x => x !== s))} className="text-white/30 hover:text-white">×</button>
                    </span>
                  ))}
                  {resume.skills.length === 0 && <p className="text-xs text-white/20">스킬을 추가해주세요</p>}
                </div>
              </div>
            )}

            {/* 경력 */}
            {activeSection === 2 && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-medium">경력</h3>
                {resume.careers.map((career, i) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/8 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">경력 {i + 1}</span>
                      {resume.careers.length > 1 && (
                        <button onClick={() => set('careers', resume.careers.filter((_, j) => j !== i))} className="text-xs text-white/20 hover:text-red-400">삭제</button>
                      )}
                    </div>
                    {([
                      { key: 'company', label: '회사명', placeholder: '(주)오늘의커리어' },
                      { key: 'role', label: '직책/직무', placeholder: '프론트엔드 개발자' },
                      { key: 'period', label: '기간', placeholder: '2024.01 ~ 현재' },
                    ] as { key: keyof Career; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                        <input
                          type="text"
                          value={career[key]}
                          onChange={e => set('careers', resume.careers.map((c, j) => j === i ? { ...c, [key]: e.target.value } : c))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">주요 업무</label>
                      <textarea
                        value={career.description}
                        onChange={e => set('careers', resume.careers.map((c, j) => j === i ? { ...c, description: e.target.value } : c))}
                        placeholder="주요 업무와 성과를 작성해주세요."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => set('careers', [...resume.careers, { company: '', role: '', period: '', description: '' }])}
                  className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-xs text-white/30 hover:border-white/30 hover:text-white/60 transition-colors"
                >
                  + 경력 추가
                </button>
              </div>
            )}

            {/* 프로젝트 */}
            {activeSection === 3 && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-medium">프로젝트</h3>
                {resume.projects.map((proj, i) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/8 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">프로젝트 {i + 1}</span>
                      {resume.projects.length > 1 && (
                        <button onClick={() => set('projects', resume.projects.filter((_, j) => j !== i))} className="text-xs text-white/20 hover:text-red-400">삭제</button>
                      )}
                    </div>
                    {([
                      { key: 'name', label: '프로젝트명', placeholder: '오늘의 커리어' },
                      { key: 'tech', label: resume.job_id === 'designer' ? '사용 툴' : '기술 스택', placeholder: resume.job_id === 'designer' ? 'Figma, Illustrator' : 'Next.js, Supabase' },
                      { key: 'link', label: 'URL', placeholder: 'https://' },
                    ] as { key: keyof Project; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                        <input
                          type="text"
                          value={proj[key]}
                          onChange={e => set('projects', resume.projects.map((p, j) => j === i ? { ...p, [key]: e.target.value } : p))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">설명</label>
                      <textarea
                        value={proj.description}
                        onChange={e => set('projects', resume.projects.map((p, j) => j === i ? { ...p, description: e.target.value } : p))}
                        placeholder="프로젝트 설명과 기여한 내용을 작성해주세요."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => set('projects', [...resume.projects, { name: '', description: '', tech: '', link: '' }])}
                  className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-xs text-white/30 hover:border-white/30 hover:text-white/60 transition-colors"
                >
                  + 프로젝트 추가
                </button>
              </div>
            )}

            {/* 교육 */}
            {activeSection === 4 && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-medium">교육</h3>
                {resume.educations.map((edu, i) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/8 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">교육 {i + 1}</span>
                      {resume.educations.length > 1 && (
                        <button onClick={() => set('educations', resume.educations.filter((_, j) => j !== i))} className="text-xs text-white/20 hover:text-red-400">삭제</button>
                      )}
                    </div>
                    {([
                      { key: 'school', label: '학교/기관', placeholder: '○○대학교' },
                      { key: 'major', label: '전공/과정', placeholder: '컴퓨터공학과' },
                      { key: 'period', label: '기간', placeholder: '2020.03 ~ 2024.02' },
                    ] as { key: keyof Education; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                        <input
                          type="text"
                          value={edu[key]}
                          onChange={e => set('educations', resume.educations.map((ed, j) => j === i ? { ...ed, [key]: e.target.value } : ed))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <button
                  onClick={() => set('educations', [...resume.educations, { school: '', major: '', period: '' }])}
                  className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-xs text-white/30 hover:border-white/30 hover:text-white/60 transition-colors"
                >
                  + 교육 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="flex-1 min-w-0" id="resume-preview">
          <div className="bg-white text-black rounded-xl p-10 shadow-xl">
            {/* 헤더 */}
            <div className="border-b border-gray-100 pb-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{resume.name || '이름'}</h1>
                  <p className="text-sm text-gray-400 font-medium">{jobLabel}</p>
                </div>
                <div className="text-right text-xs text-gray-400 space-y-0.5 flex-shrink-0">
                  {resume.email && <div>{resume.email}</div>}
                  {resume.phone && <div>{resume.phone}</div>}
                  {resume.github && <div className="text-blue-400">{resume.github}</div>}
                  {resume.blog && <div className="text-blue-400">{resume.blog}</div>}
                </div>
              </div>
              {resume.intro && (
                <p className="mt-4 text-sm text-gray-500 leading-relaxed">{resume.intro}</p>
              )}
            </div>

            {/* 스킬 */}
            {resume.skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map(s => (
                    <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 경력 */}
            {resume.careers.some(c => c.company) && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">Experience</h2>
                <div className="space-y-4">
                  {resume.careers.filter(c => c.company).map((career, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{career.company}</span>
                          {career.role && <span className="text-xs text-gray-400 ml-2">{career.role}</span>}
                        </div>
                        {career.period && <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{career.period}</span>}
                      </div>
                      {career.description && (
                        <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{career.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 프로젝트 */}
            {resume.projects.some(p => p.name) && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">Projects</h2>
                <div className="space-y-4">
                  {resume.projects.filter(p => p.name).map((proj, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{proj.name}</span>
                        {proj.tech && <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{proj.tech}</span>}
                      </div>
                      {proj.description && (
                        <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line mb-1">{proj.description}</p>
                      )}
                      {proj.link && <p className="text-xs text-blue-400">{proj.link}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 교육 */}
            {resume.educations.some(e => e.school) && (
              <div>
                <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">Education</h2>
                <div className="space-y-2">
                  {resume.educations.filter(e => e.school).map((edu, i) => (
                    <div key={i} className="flex items-baseline justify-between">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{edu.school}</span>
                        {edu.major && <span className="text-xs text-gray-400 ml-2">{edu.major}</span>}
                      </div>
                      {edu.period && <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{edu.period}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!resume.name && resume.skills.length === 0 && !resume.careers[0]?.company && (
              <div className="text-center text-gray-200 py-12 text-sm">
                왼쪽 폼에 내용을 입력하면 미리보기가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #resume-preview { display: block !important; position: fixed; inset: 0; padding: 40px; background: white; }
        }
      `}</style>
    </div>
  )
}
