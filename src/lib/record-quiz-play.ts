'use client'

/**
 * Record a play once per quiz per browser session.
 */
export async function recordQuizPlay(quizId: string): Promise<void> {
  if (typeof window === 'undefined' || !quizId) return

  const key = `quiz-play:${quizId}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // sessionStorage may be unavailable; still attempt the request
  }

  try {
    await fetch(`/api/quizzes/${quizId}/play`, { method: 'POST' })
  } catch (error) {
    console.warn('Failed to record quiz play:', error)
  }
}
