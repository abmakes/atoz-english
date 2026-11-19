import { displayNameKey, rankChallengeRuns, type ChallengeRun } from '@/lib/homework/rules'

export interface HomeworkAnswerRecord {
  questionId: string
  questionText: string
  selectedAnswer: string
  correctAnswer: string
  correct: boolean
  order: number
}

export interface HomeworkTryRecord {
  id: string
  studentName: string
  mode: 'HOMEWORK' | 'CHALLENGE'
  status: 'IN_PROGRESS' | 'FINISHED'
  percentage: number | null
  correctCount: number
  answeredCount: number
  durationMs: number
  reachedHundred: boolean
  timeToHundredMs: number | null
  finishedAt: string | null
  createdAt: string
  answers: HomeworkAnswerRecord[]
}

export interface StudentHomeworkRow {
  studentName: string
  attemptCount: number
  bestPercentage: number
  bestDurationMs: number
  bestAttemptId: string
  completed: boolean
  strip: boolean[]
}

export interface QuestionDifficultyRow {
  questionId: string
  questionText: string
  answered: number
  wrong: number
  incorrectPercent: number
  commonWrong: string | null
}

export interface HomeworkReportSummary {
  finishedStudents: number
  classAccuracy: number | null
  totalAnswers: number
  totalWrong: number
  students: StudentHomeworkRow[]
  questions: QuestionDifficultyRow[]
  challenge: ReturnType<typeof rankChallengeRuns>
}

function betterHomework(
  left: HomeworkTryRecord,
  right: HomeworkTryRecord
): boolean {
  const leftPercent = left.percentage ?? 0
  const rightPercent = right.percentage ?? 0
  if (leftPercent !== rightPercent) return leftPercent > rightPercent
  if (left.durationMs !== right.durationMs) return left.durationMs < right.durationMs
  return left.createdAt < right.createdAt
}

export function summarizeHomework(tries: readonly HomeworkTryRecord[]): HomeworkReportSummary {
  const finishedHomework = tries.filter(
    (tryRecord) => tryRecord.mode === 'HOMEWORK' && tryRecord.status === 'FINISHED'
  )
  const byStudent = new Map<string, HomeworkTryRecord[]>()
  for (const tryRecord of finishedHomework) {
    const key = displayNameKey(tryRecord.studentName)
    if (!key) continue
    const group = byStudent.get(key) ?? []
    group.push(tryRecord)
    byStudent.set(key, group)
  }

  const students: StudentHomeworkRow[] = [...byStudent.values()].map((group) => {
    const best = group.reduce((winner, candidate) =>
      betterHomework(candidate, winner) ? candidate : winner
    )
    const strip = [...best.answers].sort((left, right) => left.order - right.order).map((answer) => answer.correct)
    return {
      studentName: best.studentName.trim(),
      attemptCount: group.length,
      bestPercentage: best.percentage ?? 0,
      bestDurationMs: best.durationMs,
      bestAttemptId: best.id,
      completed: true,
      strip,
    }
  })
  students.sort((left, right) => right.bestPercentage - left.bestPercentage || left.studentName.localeCompare(right.studentName))

  const classAccuracy =
    students.length === 0
      ? null
      : Math.round(
          (students.reduce((sum, student) => sum + student.bestPercentage, 0) / students.length) * 10
        ) / 10

  const questionMap = new Map<
    string,
    { questionText: string; answered: number; wrong: number; wrongChoices: Map<string, number> }
  >()
  let totalAnswers = 0
  let totalWrong = 0
  for (const tryRecord of finishedHomework) {
    for (const answer of tryRecord.answers) {
      totalAnswers += 1
      const row = questionMap.get(answer.questionId) ?? {
        questionText: answer.questionText,
        answered: 0,
        wrong: 0,
        wrongChoices: new Map<string, number>(),
      }
      row.questionText = answer.questionText || row.questionText
      row.answered += 1
      if (!answer.correct) {
        totalWrong += 1
        row.wrong += 1
        const choice = answer.selectedAnswer.trim()
        if (choice) row.wrongChoices.set(choice, (row.wrongChoices.get(choice) ?? 0) + 1)
      }
      questionMap.set(answer.questionId, row)
    }
  }

  const questions: QuestionDifficultyRow[] = [...questionMap.entries()].map(([questionId, row]) => {
    let commonWrong: string | null = null
    let commonCount = 0
    for (const [choice, count] of row.wrongChoices) {
      if (count > commonCount) {
        commonWrong = choice
        commonCount = count
      }
    }
    return {
      questionId,
      questionText: row.questionText,
      answered: row.answered,
      wrong: row.wrong,
      incorrectPercent: row.answered === 0 ? 0 : Math.round((row.wrong / row.answered) * 1000) / 10,
      commonWrong,
    }
  })
  questions.sort(
    (left, right) => right.incorrectPercent - left.incorrectPercent || right.wrong - left.wrong
  )

  const challengeRuns: ChallengeRun[] = tries
    .filter((tryRecord) => tryRecord.mode === 'CHALLENGE' && tryRecord.status === 'FINISHED')
    .map((tryRecord) => ({
      studentName: tryRecord.studentName.trim(),
      correctCount: tryRecord.correctCount,
      reachedHundred: tryRecord.reachedHundred,
      timeToHundredMs: tryRecord.timeToHundredMs,
      durationMs: tryRecord.durationMs,
      finishedAt: tryRecord.finishedAt ?? tryRecord.createdAt,
    }))

  return {
    finishedStudents: students.length,
    classAccuracy,
    totalAnswers,
    totalWrong,
    students,
    questions,
    challenge: rankChallengeRuns(challengeRuns),
  }
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function homeworkReportCsv(summary: HomeworkReportSummary): string {
  const lines = [
    ['Student', 'Best accuracy', 'Attempts', 'Time played ms', 'Completed'].map(csvCell).join(','),
    ...summary.students.map((student) =>
      [
        student.studentName,
        student.bestPercentage,
        student.attemptCount,
        student.bestDurationMs,
        student.completed ? 'yes' : 'no',
      ]
        .map(csvCell)
        .join(',')
    ),
    '',
    ['Question', 'Times answered', 'Times wrong', 'Incorrect %', 'Most common wrong'].map(csvCell).join(','),
    ...summary.questions.map((question) =>
      [
        question.questionText,
        question.answered,
        question.wrong,
        question.incorrectPercent,
        question.commonWrong,
      ]
        .map(csvCell)
        .join(',')
    ),
  ]
  return lines.join('\n')
}
