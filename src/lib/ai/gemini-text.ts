import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_QUIZ_API_KEY ?? '')

/** Same Gemini text call used by quiz generation and the lesson check. */
export async function generateText(prompt: string): Promise<string> {
  if (!process.env.GEMINI_QUIZ_API_KEY) {
    throw new Error('GEMINI_QUIZ_API_KEY is not configured')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  const result = await model.generateContent(prompt)
  return (await result.response).text()
}
