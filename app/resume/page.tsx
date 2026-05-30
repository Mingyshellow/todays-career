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

const JOB_SECTIONS: Record<string, string[]> = {
  developer: ['프로필', '기술 스택', '경력', '프로젝트', '교육'],
  designer: ['프로필', '툴 & 스킬', '경력', '포트폴리오', '교육'],
  planner: ['프로필', '핵심 역량', '경력', '프로젝트', '교육'],
  marketer: ['프로필', '마케팅 스킬', '경력', '캠페인 성과', '교육'],
  data: ['프로필', '기술 스택', '경력', '분석 프로젝트', '교육'],
  other: ['프로필', '핵심 역량', '경력', '주요 성과', '교육'],
}

type Profile = { name: string; email: string; phone: string; github: string; blog: string; intro: string }
type Career = { company: string; role: string; period: string; description: string }
type Project = { name: string; description: string; tech: string; link: string }
type Education = { school: string; major: string; period: string }

export default function ResumePage() {
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [jobId, setJobId] = useState('')
  const [customJob, setCustomJob] = useState('')
  const [activeSection, setActiveSection] = useState(0)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<Profile>({
    name: '', email: '', phone: '', github: '', blog: '', intro: ''
  })
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [careers, setCareers] = useState<Career[]>([{ company: '', role: '', period: '', description: '' }])
  const [projects, setProjects] = useState<Project[]>([{ name: '', description: '', tech: '', link: '' }])
  const [educations, setEducations] = useState<Education[]>([{ school: '', major: '', period: '' }])

  const jobLabel = jobId === 'other' ? customJob : JOB_CATEGORIES.find(j => j.id === jobId)?.label || ''
  const sections = JOB_SECTIONS[jobId] || JOB_SECTIONS['other']
  const sectionLabel2 = sections[1]

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || skills.includes(s)) return
    setSkills(prev => [...prev, s])
    setSkillInput('')
  }

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))

  const handlePrint = () => window.print()

  if (step === 'select') return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">이력서 만들기</h1>
      <p className="text-white/40 text-sm mb-10">직무를 선택하면 맞춤 이력서 양식을 제공해드려요.</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {JOB_CATEGORIES.map(job => (
          <button
            key={job.id}
            onClick={() => setJobId(job.id)}
            className={`p-5 rounded-xl border transition-all text-left ${
              jobId === job.id
                ? 'border-white bg-white/10'
                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/8'
            }`}
          >
            <div className="text-2xl mb-2">{job.icon}</div>
            <div className="text-sm font-medium">{job.label}</div>
          </button>
        ))}
      </div>

      {jobId === 'other' && (
        <div className="mb-8">
          <label className="text-xs text-white/40 mb-2 block">직무명 직접 입력</label>
          <input
            type="text"
            value={customJob}
            onChange={e => setCustomJob(e.target.value)}
            placeholder="예: UX 리서처, 콘텐츠 크리에이터..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        </div>
      )}

      <button
        onClick={() => jobId && (jobId !== 'other' || customJob.trim()) && setStep('form')}
        disabled={!jobId || (jobId === 'other' && !customJob.trim())}
        className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30"
      >
        이력서 작성 시작 →
      </button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('select')} className="text-white/30 hover:text-white text-sm transition-colors">← 직무 변경</button>
          <span className="text-white/20">|</span>
          <span className="text-sm text-white/60">{jobLabel} 이력서</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/20 bg-white/5 px-2 py-1 rounded-full">Gemini 자동완성 예정</span>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
          >
            PDF 저장
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* 왼쪽: 폼 */}
        <div className="w-[420px] flex-shrink-0">
          {/* 섹션 탭 */}
          <div className="flex gap-1 mb-6 flex-wrap">
            {sections.map((s, i) => (
              <button
                key={s}
                onClick={() => setActiveSection(i)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  activeSection === i
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
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
                <h3 className="text-sm font-medium mb-2">프로필</h3>
                {([
                  { key: 'name', label: '이름', placeholder: '홍길동' },
                  { key: 'email', label: '이메일', placeholder: 'hello@example.com' },
                  { key: 'phone', label: '연락처', placeholder: '010-0000-0000' },
                  { key: 'github', label: jobId === 'designer' ? '포트폴리오 URL' : 'GitHub', placeholder: 'https://' },
                  { key: 'blog', label: '블로그 / 링크드인', placeholder: 'https://' },
                ] as { key: keyof Profile; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                    <input
                      type="text"
                      value={profile[key]}
                      onChange={e => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
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
                    value={profile.intro}
                    onChange={e => setProfile(prev => ({ ...prev, intro: e.target.value }))}
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
                <h3 className="text-sm font-medium mb-2">{sectionLabel2}</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder={jobId === 'developer' ? 'React, TypeScript...' : jobId === 'designer' ? 'Figma, Photoshop...' : '역량 입력'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                  />
                  <button onClick={addSkill} className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors">추가</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-white/30 hover:text-white">×</button>
                    </span>
                  ))}
                  {skills.length === 0 && <p className="text-xs text-white/20">스킬을 추가해주세요</p>}
                </div>
              </div>
            )}

            {/* 경력 */}
            {activeSection === 2 && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-medium">경력</h3>
                {careers.map((career, i) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/8 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">경력 {i + 1}</span>
                      {careers.length > 1 && (
                        <button onClick={() => setCareers(prev => prev.filter((_, j) => j !== i))} className="text-xs text-white/20 hover:text-red-400 transition-colors">삭제</button>
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
                          onChange={e => setCareers(prev => prev.map((c, j) => j === i ? { ...c, [key]: e.target.value } : c))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">주요 업무</label>
                      <textarea
                        value={career.description}
                        onChange={e => setCareers(prev => prev.map((c, j) => j === i ? { ...c, description: e.target.value } : c))}
                        placeholder="주요 업무와 성과를 작성해주세요."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setCareers(prev => [...prev, { company: '', role: '', period: '', description: '' }])}
                  className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-xs text-white/30 hover:text-white/60 hover:border-white/30 transition-colors"
                >
                  + 경력 추가
                </button>
              </div>
            )}

            {/* 프로젝트 */}
            {activeSection === 3 && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-medium">{sections[3]}</h3>
                {projects.map((proj, i) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/8 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">프로젝트 {i + 1}</span>
                      {projects.length > 1 && (
                        <button onClick={() => setProjects(prev => prev.filter((_, j) => j !== i))} className="text-xs text-white/20 hover:text-red-400 transition-colors">삭제</button>
                      )}
                    </div>
                    {([
                      { key: 'name', label: '프로젝트명', placeholder: '오늘의 커리어' },
                      { key: 'tech', label: jobId === 'designer' ? '사용 툴' : '기술 스택', placeholder: jobId === 'designer' ? 'Figma, Illustrator' : 'Next.js, Supabase' },
                      { key: 'link', label: 'URL', placeholder: 'https://' },
                    ] as { key: keyof Project; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-white/40 mb-1.5 block">{label}</label>
                        <input
                          type="text"
                          value={proj[key]}
                          onChange={e => setProjects(prev => prev.map((p, j) => j === i ? { ...p, [key]: e.target.value } : p))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">설명</label>
                      <textarea
                        value={proj.description}
                        onChange={e => setProjects(prev => prev.map((p, j) => j === i ? { ...p, description: e.target.value } : p))}
                        placeholder="프로젝트 설명과 기여한 내용을 작성해주세요."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setProjects(prev => [...prev, { name: '', description: '', tech: '', link: '' }])}
                  className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-xs text-white/30 hover:text-white/60 hover:border-white/30 transition-colors"
                >
                  + 프로젝트 추가
                </button>
              </div>
            )}

            {/* 교육 */}
            {activeSection === 4 && (
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-medium">교육</h3>
                {educations.map((edu, i) => (
                  <div key={i} className="flex flex-col gap-3 pb-6 border-b border-white/8 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">교육 {i + 1}</span>
                      {educations.length > 1 && (
                        <button onClick={() => setEducations(prev => prev.filter((_, j) => j !== i))} className="text-xs text-white/20 hover:text-red-400 transition-colors">삭제</button>
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
                          onChange={e => setEducations(prev => prev.map((ed, j) => j === i ? { ...ed, [key]: e.target.value } : ed))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <button
                  onClick={() => setEducations(prev => [...prev, { school: '', major: '', period: '' }])}
                  className="w-full py-2.5 border border-dashed border-white/15 rounded-lg text-xs text-white/30 hover:text-white/60 hover:border-white/30 transition-colors"
                >
                  + 교육 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="flex-1 min-w-0" id="resume-preview">
          <div className="bg-white text-black rounded-xl p-10 shadow-2xl print:shadow-none print:rounded-none">
            {/* 헤더 */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.name || '이름'}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">{jobLabel}</p>
                </div>
                <div className="text-right text-xs text-gray-400 space-y-1">
                  {profile.email && <div>{profile.email}</div>}
                  {profile.phone && <div>{profile.phone}</div>}
                  {profile.github && <div>{profile.github}</div>}
                  {profile.blog && <div>{profile.blog}</div>}
                </div>
              </div>
              {profile.intro && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.intro}</p>
              )}
            </div>

            {/* 스킬 */}
            {skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{sectionLabel2}</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 경력 */}
            {careers.some(c => c.company) && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">경력</h2>
                <div className="space-y-4">
                  {careers.filter(c => c.company).map((career, i) => (
                    <div key={i}>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{career.company}</span>
                          {career.role && <span className="text-sm text-gray-500 ml-2">· {career.role}</span>}
                        </div>
                        {career.period && <span className="text-xs text-gray-400">{career.period}</span>}
                      </div>
                      {career.description && (
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{career.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 프로젝트 */}
            {projects.some(p => p.name) && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{sections[3]}</h2>
                <div className="space-y-4">
                  {projects.filter(p => p.name).map((proj, i) => (
                    <div key={i}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{proj.name}</span>
                        {proj.tech && <span className="text-xs text-gray-400">{proj.tech}</span>}
                      </div>
                      {proj.description && (
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line mb-1">{proj.description}</p>
                      )}
                      {proj.link && (
                        <p className="text-xs text-blue-500">{proj.link}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 교육 */}
            {educations.some(e => e.school) && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">교육</h2>
                <div className="space-y-2">
                  {educations.filter(e => e.school).map((edu, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{edu.school}</span>
                        {edu.major && <span className="text-sm text-gray-500 ml-2">· {edu.major}</span>}
                      </div>
                      {edu.period && <span className="text-xs text-gray-400">{edu.period}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 빈 상태 */}
            {!profile.name && skills.length === 0 && !careers[0].company && !projects[0].name && (
              <div className="text-center text-gray-300 py-12 text-sm">
                왼쪽 폼에 내용을 입력하면 여기에 미리보기가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none; }
          #resume-preview { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
