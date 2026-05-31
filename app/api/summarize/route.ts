import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { content } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ summary: '' })
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `다음 일지 내용을 한 줄(30자 이내)로 간결하게 요약해줘. 요약문만 출력하고 다른 말은 하지 마.\n\n${content}`
          }]
        }]
      })
    }
  )

  const data = await res.json()
  const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  return NextResponse.json({ summary })
}
