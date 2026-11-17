import { Prisma } from '../../../prisma/app/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { isBeforeDue } from '@/lib/assignments/due'
import { createShareToken } from '@/lib/stories/tokens'
import { cleanStudentName } from '@/lib/homework/schemas'
import { readQueue, reshuffleAvoiding } from '@/lib/homework/queue'
import { summarizeHomework, homeworkReportCsv, type HomeworkTryRecord } from '@/lib/homework/report'
import {
  STARTING_LIVES,
  answerIsLate,
  displayNameKey,
  frameForCorrect,
  homeworkPercentage,
  livesAfterCorrect,
  type FlameColor,
} from '@/lib/homework/rules'
import { sceneThemeId } from '@/lib/themes'

export class HomeworkError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

type QuestionRow = {
  id: string
  question: string
  imageUrl: string | null
  answers: string[]
  correctAnswer: string
}

export type PublicQuestion = {
  id: string
  question: string
  imageUrl: string | null
  answers: string[]
}

type AttemptMode = 'HOMEWORK' | 'CHALLENGE'

export type PlayState = {
  attemptId: string
  mode: AttemptMode
  status: 'IN_PROGRESS' | 'FINISHED'
  studentName: string
  questions: PublicQuestion[]
  selections: { questionId: string; selectedAnswer: string }[]
  currentQuestionId: string | null
  correctCount: number
  answeredCount: number
  livesLeft: number | null
  timeLimitMs: number | null
  questionStartedAt: string | null
  flame: FlameColor | null
  shake: boolean
  percentage: number | null
  durationMs: number
  endReason: 'COMPLETE' | 'WRONG' | 'TIMEOUT' | 'HUNDRED' | null
  reachedHundred: boolean
  timeToHundredMs: number | null
  results: GradedAnswer[] | null
}

export type GradedAnswer = {
  questionId: string
  questionText: string
  imageUrl: string | null
  selectedAnswer: string
  correctAnswer: string
  correct: boolean
  order: number
}

function toPublic(question: QuestionRow): PublicQuestion {
  return {
    id: question.id,
    question: question.question,
    imageUrl: question.imageUrl,
    answers: question.answers,
  }
}

function readQuizTheme(settings: Prisma.JsonValue | null): string | null {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null
  const theme = (settings as { theme?: unknown }).theme
  return typeof theme === 'string' ? theme : null
}

function usableQuestions(questions: QuestionRow[]): QuestionRow[] {
  return questions.filter(
    (question) =>
      question.question.trim().length > 0 &&
      question.answers.filter((answer) => answer.trim().length > 0).length >= 2 &&
      question.answers.includes(question.correctAnswer)
  )
}

async function loadAssignmentByToken(token: string) {
  const assignment = await prisma.homeworkAssignment.findUnique({
    where: { shareToken: token },
    include: { quiz: { include: { questions: true } } },
  })
  if (!assignment) throw new HomeworkError('This homework is not available.', 404)
  return assignment
}

function assertOpen(assignment: { acceptingResponses: boolean; dueAt: Date }, now = new Date()) {
  if (!assignment.acceptingResponses || !isBeforeDue(assignment.dueAt, now)) {
    throw new HomeworkError('This homework is closed.', 403)
  }
}

function questionsOf(assignment: {
  quiz: { questions: QuestionRow[] }
}): QuestionRow[] {
  return usableQuestions(assignment.quiz.questions)
}

export async function createHomeworkAssignment(
  authorId: string,
  input: { quizId: string; title: string; dueAt: Date }
) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: input.quizId, authorId },
    include: { questions: true },
  })
  if (!quiz) throw new HomeworkError('Quiz not found.', 404)
  if (quiz.quizType !== 'MULTIPLE_CHOICE') {
    throw new HomeworkError('Only a multiple-choice quiz can be assigned as homework.', 400)
  }
  const questions = usableQuestions(quiz.questions)
  if (questions.length === 0) {
    throw new HomeworkError('Add at least one multiple-choice question before assigning it.', 400)
  }
  const assignment = await prisma.homeworkAssignment.create({
    data: {
      authorId,
      quizId: quiz.id,
      title: input.title,
      dueAt: input.dueAt,
      shareToken: createShareToken(),
    },
  })
  return {
    id: assignment.id,
    title: assignment.title,
    quizId: assignment.quizId,
    shareToken: assignment.shareToken,
    dueAt: assignment.dueAt.toISOString(),
    questionCount: questions.length,
  }
}

export async function getOwnedAssignment(id: string, authorId: string) {
  return prisma.homeworkAssignment.findFirst({
    where: { id, authorId },
    include: { quiz: { select: { id: true, title: true } } },
  })
}

export async function updateHomeworkAssignment(
  authorId: string,
  id: string,
  patch: {
    title?: string
    dueAt?: Date
    acceptingResponses?: boolean
    showLeaderboard?: boolean
  }
) {
  const owned = await getOwnedAssignment(id, authorId)
  if (!owned) throw new HomeworkError('Assignment not found.', 404)
  const updated = await prisma.homeworkAssignment.update({
    where: { id: owned.id },
    data: patch,
  })
  return {
    id: updated.id,
    title: updated.title,
    dueAt: updated.dueAt.toISOString(),
    acceptingResponses: updated.acceptingResponses,
    showLeaderboard: updated.showLeaderboard,
    shareToken: updated.shareToken,
  }
}

export async function deleteHomeworkAssignment(authorId: string, id: string) {
  const owned = await getOwnedAssignment(id, authorId)
  if (!owned) throw new HomeworkError('Assignment not found.', 404)
  await prisma.homeworkAssignment.delete({ where: { id: owned.id } })
}

type AttemptWithAnswers = Prisma.HomeworkAttemptGetPayload<{ include: { answers: true } }>

function gradedFrom(
  attempt: AttemptWithAnswers,
  questions: QuestionRow[],
  reveal: boolean
): GradedAnswer[] | null {
  if (!reveal) return null
  const images = new Map(questions.map((question) => [question.id, question.imageUrl]))
  return [...attempt.answers]
    .sort((left, right) => left.order - right.order)
    .map((answer) => ({
      questionId: answer.questionId,
      questionText: answer.questionText,
      imageUrl: images.get(answer.questionId) ?? null,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.correctAnswer,
      correct: answer.correct,
      order: answer.order,
    }))
}

function toPlayState(
  attempt: AttemptWithAnswers,
  questions: QuestionRow[],
  reveal: boolean
): PlayState {
  const queue = readQueue(attempt.queue)
  const byId = new Map(questions.map((question) => [question.id, question]))
  const ordered = queue.map((id) => byId.get(id)).filter((question): question is QuestionRow => !!question)
  const frame = frameForCorrect(attempt.correctCount)
  const currentQuestionId =
    attempt.mode === 'CHALLENGE' ? (queue[0] ?? null) : (queue.find((id) => !attempt.answers.some((answer) => answer.questionId === id)) ?? null)
  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    status: attempt.status,
    studentName: attempt.studentName,
    questions: ordered.map(toPublic),
    selections: attempt.answers
      .sort((left, right) => left.order - right.order)
      .map((answer) => ({ questionId: answer.questionId, selectedAnswer: answer.selectedAnswer })),
    currentQuestionId,
    correctCount: attempt.correctCount,
    answeredCount: attempt.answeredCount,
    livesLeft: attempt.livesLeft,
    timeLimitMs: attempt.mode === 'CHALLENGE' ? attempt.timeLimitMs ?? frame.timeLimitMs : null,
    questionStartedAt: attempt.questionStartedAt?.toISOString() ?? null,
    flame: attempt.mode === 'CHALLENGE' ? frame.flame : null,
    shake: attempt.mode === 'CHALLENGE' ? frame.shake : false,
    percentage: attempt.percentage,
    durationMs: attempt.durationMs,
    endReason: attempt.endReason,
    reachedHundred: attempt.reachedHundred,
    timeToHundredMs: attempt.timeToHundredMs,
    results: gradedFrom(attempt, questions, reveal),
  }
}

export async function getHomeworkSession(token: string, clientKey?: string) {
  const assignment = await prisma.homeworkAssignment.findUnique({
    where: { shareToken: token },
    include: {
      quiz: { include: { questions: true } },
      attempts: {
        where: clientKey
          ? { OR: [{ status: 'FINISHED' }, { status: 'IN_PROGRESS', clientKey }] }
          : { status: 'FINISHED' },
        include: { answers: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!assignment) throw new HomeworkError('This homework is not available.', 404)
  const open = assignment.acceptingResponses && isBeforeDue(assignment.dueAt)
  const finished = assignment.attempts.filter((attempt) => attempt.status === 'FINISHED')
  const summary = summarizeHomework(finished.map(toTryRecord))
  const mine = clientKey
    ? finished.filter((attempt) => attempt.clientKey === clientKey && attempt.mode === 'HOMEWORK')
    : []
  const resume = clientKey
    ? assignment.attempts.find((attempt) => attempt.status === 'IN_PROGRESS' && attempt.clientKey === clientKey)
    : undefined
  const bestPercentage =
    mine.length === 0
      ? null
      : Math.max(...mine.map((attempt) => attempt.percentage ?? 0))
  return {
    title: assignment.title,
    dueAt: assignment.dueAt.toISOString(),
    questionCount: usableQuestions(assignment.quiz.questions).length,
    acceptingResponses: open,
    showLeaderboard: assignment.showLeaderboard,
    leaderboard: assignment.showLeaderboard ? summary.challenge : [],
    finishedHomework: mine.length > 0,
    bestPercentage,
    theme: sceneThemeId(readQuizTheme(assignment.quiz.defaultSettings)),
    resume: resume
      ? { attemptId: resume.id, mode: resume.mode, studentName: resume.studentName }
      : null,
  }
}

function toTryRecord(attempt: AttemptWithAnswers): HomeworkTryRecord {
  return {
    id: attempt.id,
    studentName: attempt.studentName,
    mode: attempt.mode,
    status: attempt.status,
    percentage: attempt.percentage,
    correctCount: attempt.correctCount,
    answeredCount: attempt.answeredCount,
    durationMs: attempt.durationMs,
    reachedHundred: attempt.reachedHundred,
    timeToHundredMs: attempt.timeToHundredMs,
    finishedAt: attempt.finishedAt?.toISOString() ?? null,
    createdAt: attempt.createdAt.toISOString(),
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      questionText: answer.questionText,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.correctAnswer,
      correct: answer.correct,
      order: answer.order,
    })),
  }
}

export async function getHomeworkReport(authorId: string, id: string) {
  const assignment = await prisma.homeworkAssignment.findFirst({
    where: { id, authorId },
    include: {
      quiz: { select: { id: true, title: true } },
      attempts: { include: { answers: true }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!assignment) throw new HomeworkError('Assignment not found.', 404)
  const summary = summarizeHomework(assignment.attempts.map(toTryRecord))
  const students = summary.students.map((student) => {
    const key = displayNameKey(student.studentName)
    const tries = assignment.attempts
      .filter(
        (attempt) =>
          attempt.mode === 'HOMEWORK' &&
          attempt.status === 'FINISHED' &&
          displayNameKey(attempt.studentName) === key
      )
      .map((attempt) => ({
        id: attempt.id,
        createdAt: attempt.createdAt.toISOString(),
        percentage: attempt.percentage ?? 0,
        durationMs: attempt.durationMs,
        misses: attempt.answers
          .filter((answer) => !answer.correct)
          .sort((left, right) => left.order - right.order)
          .map((answer) => ({
            questionId: answer.questionId,
            questionText: answer.questionText,
            selectedAnswer: answer.selectedAnswer,
            correctAnswer: answer.correctAnswer,
          })),
      }))
    return { ...student, tries }
  })
  return {
    id: assignment.id,
    title: assignment.title,
    quizId: assignment.quizId,
    quizTitle: assignment.quiz.title,
    shareToken: assignment.shareToken,
    dueAt: assignment.dueAt.toISOString(),
    acceptingResponses: assignment.acceptingResponses,
    showLeaderboard: assignment.showLeaderboard,
    createdAt: assignment.createdAt.toISOString(),
    overview: {
      finishedStudents: summary.finishedStudents,
      classAccuracy: summary.classAccuracy,
      totalAnswers: summary.totalAnswers,
      totalWrong: summary.totalWrong,
    },
    students,
    questions: summary.questions,
    challenge: summary.challenge,
  }
}

export async function homeworkCsv(authorId: string, id: string): Promise<{ title: string; csv: string }> {
  const report = await getHomeworkReport(authorId, id)
  return {
    title: report.title,
    csv: homeworkReportCsv({
      finishedStudents: report.overview.finishedStudents,
      classAccuracy: report.overview.classAccuracy,
      totalAnswers: report.overview.totalAnswers,
      totalWrong: report.overview.totalWrong,
      students: report.students,
      questions: report.questions,
      challenge: report.challenge,
    }),
  }
}

export async function listAssignmentHub(authorId: string) {
  const [homework, thoughts, stories] = await Promise.all([
    prisma.homeworkAssignment.findMany({
      where: { authorId },
      include: {
        _count: {
          select: { attempts: { where: { mode: 'HOMEWORK', status: 'FINISHED' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.thoughtChallenge.findMany({
      where: { authorId, status: { not: 'ARCHIVED' } },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.story.findMany({
      where: { authorId, status: { not: 'ARCHIVED' } },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const rows = [
    ...homework.map((row) => ({
      id: row.id,
      kind: 'quiz' as const,
      title: row.title,
      assignedAt: row.createdAt.toISOString(),
      dueAt: row.dueAt.toISOString(),
      submissions: row._count.attempts,
      href: `/quizzes/assignments/${row.id}`,
    })),
    ...thoughts.map((row) => ({
      id: row.id,
      kind: 'thoughts' as const,
      title: row.title,
      assignedAt: row.createdAt.toISOString(),
      dueAt: row.dueAt?.toISOString() ?? null,
      submissions: row._count.submissions,
      href: `/tools/thoughts/${row.id}`,
    })),
    ...stories.map((row) => ({
      id: row.id,
      kind: 'story' as const,
      title: row.title,
      assignedAt: row.createdAt.toISOString(),
      dueAt: row.dueAt?.toISOString() ?? null,
      submissions: row._count.submissions,
      href: `/tools/story-creator/${row.id}`,
    })),
  ]
  rows.sort((left, right) => right.assignedAt.localeCompare(left.assignedAt))
  return rows
}

async function requireAttempt(token: string, attemptId: string, clientKey: string) {
  const assignment = await loadAssignmentByToken(token)
  const attempt = await prisma.homeworkAttempt.findFirst({
    where: { id: attemptId, assignmentId: assignment.id, clientKey },
    include: { answers: true },
  })
  if (!attempt) throw new HomeworkError('That try could not be found.', 404)
  return { assignment, attempt, questions: questionsOf(assignment) }
}

export async function readAttempt(token: string, attemptId: string, clientKey: string) {
  const { attempt, questions } = await requireAttempt(token, attemptId, clientKey)
  return toPlayState(attempt, questions, attempt.status === 'FINISHED' && attempt.mode === 'HOMEWORK')
}

export async function startAttempt(
  token: string,
  input: { studentName: string; clientKey: string; mode: AttemptMode }
) {
  const assignment = await loadAssignmentByToken(token)
  const questions = questionsOf(assignment)
  if (questions.length === 0) throw new HomeworkError('This homework has no questions.', 404)
  const studentName = cleanStudentName(input.studentName)

  const existing = await prisma.homeworkAttempt.findFirst({
    where: {
      assignmentId: assignment.id,
      clientKey: input.clientKey,
      mode: input.mode,
      status: 'IN_PROGRESS',
    },
    include: { answers: true },
  })
  if (existing) {
    assertOpen(assignment)
    return toPlayState(existing, questions, false)
  }

  assertOpen(assignment)

  if (input.mode === 'CHALLENGE') {
    const prior = await prisma.homeworkAttempt.findFirst({
      where: {
        assignmentId: assignment.id,
        mode: 'HOMEWORK',
        status: 'FINISHED',
        studentName: { equals: studentName, mode: 'insensitive' },
      },
    })
    if (!prior) {
      throw new HomeworkError('Finish the homework once before you take the challenge.', 403)
    }
  }

  const ids = questions.map((question) => question.id)
  const queue = input.mode === 'HOMEWORK' ? reshuffleAvoiding(ids, null) : reshuffleAvoiding(ids, null)
  const frame = frameForCorrect(0)
  const now = new Date()
  const created = await prisma.homeworkAttempt.create({
    data: {
      assignmentId: assignment.id,
      studentName,
      clientKey: input.clientKey,
      mode: input.mode,
      queue,
      livesLeft: input.mode === 'CHALLENGE' ? STARTING_LIVES : null,
      timeLimitMs: input.mode === 'CHALLENGE' ? frame.timeLimitMs : null,
      questionStartedAt: input.mode === 'CHALLENGE' ? now : null,
    },
    include: { answers: true },
  })
  return toPlayState(created, questions, false)
}

export async function saveHomeworkAnswer(
  token: string,
  attemptId: string,
  input: { clientKey: string; questionId: string; selectedAnswer: string }
) {
  const { assignment, attempt, questions } = await requireAttempt(token, attemptId, input.clientKey)
  if (attempt.mode !== 'HOMEWORK') throw new HomeworkError('This try is a challenge.', 400)
  if (attempt.status !== 'IN_PROGRESS') {
    return toPlayState(attempt, questions, true)
  }
  assertOpen(assignment)
  const queue = readQueue(attempt.queue)
  if (!queue.includes(input.questionId)) throw new HomeworkError('That question is not in this try.', 400)
  const question = questions.find((item) => item.id === input.questionId)
  if (!question) throw new HomeworkError('That question is no longer in the quiz.', 404)
  const order = queue.indexOf(input.questionId)
  const existing = await prisma.homeworkAnswer.findFirst({
    where: { attemptId: attempt.id, questionId: input.questionId },
  })
  if (existing) {
    await prisma.homeworkAnswer.update({
      where: { id: existing.id },
      data: { selectedAnswer: input.selectedAnswer, questionText: question.question },
    })
  } else {
    await prisma.homeworkAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: input.questionId,
        questionText: question.question,
        selectedAnswer: input.selectedAnswer,
        order,
      },
    })
  }
  const saved = await prisma.homeworkAnswer.count({ where: { attemptId: attempt.id } })
  const updated = await prisma.homeworkAttempt.update({
    where: { id: attempt.id },
    data: { answeredCount: saved },
    include: { answers: true },
  })
  return toPlayState(updated, questions, false)
}

export async function finishHomework(token: string, attemptId: string, clientKey: string) {
  const { assignment, attempt, questions } = await requireAttempt(token, attemptId, clientKey)
  if (attempt.mode !== 'HOMEWORK') throw new HomeworkError('This try is a challenge.', 400)
  if (attempt.status === 'FINISHED') return toPlayState(attempt, questions, true)
  assertOpen(assignment)
  const queue = readQueue(attempt.queue)
  const byQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]))
  if (queue.some((id) => !byQuestion.has(id))) {
    throw new HomeworkError('Answer every question before you finish.', 400)
  }
  const byId = new Map(questions.map((question) => [question.id, question]))
  let correctCount = 0
  for (const id of queue) {
    const question = byId.get(id)
    const saved = byQuestion.get(id)
    if (!question || !saved) throw new HomeworkError('A question in this try is missing.', 404)
    const correct = saved.selectedAnswer === question.correctAnswer
    if (correct) correctCount += 1
    await prisma.homeworkAnswer.update({
      where: { id: saved.id },
      data: { correct, correctAnswer: question.correctAnswer, questionText: question.question },
    })
  }
  const now = new Date()
  const updated = await prisma.homeworkAttempt.update({
    where: { id: attempt.id },
    data: {
      status: 'FINISHED',
      endReason: 'COMPLETE',
      correctCount,
      answeredCount: queue.length,
      percentage: homeworkPercentage(correctCount, queue.length),
      durationMs: Math.max(0, now.getTime() - attempt.startedAt.getTime()),
      finishedAt: now,
    },
    include: { answers: true },
  })
  return toPlayState(updated, questions, true)
}

export async function answerChallenge(
  token: string,
  attemptId: string,
  input: { clientKey: string; questionId: string; selectedAnswer?: string; timedOut?: boolean }
) {
  const { assignment, attempt, questions } = await requireAttempt(token, attemptId, input.clientKey)
  if (attempt.mode !== 'CHALLENGE') throw new HomeworkError('This try is homework.', 400)
  if (attempt.status === 'FINISHED') return toPlayState(attempt, questions, false)
  assertOpen(assignment)
  const queue = readQueue(attempt.queue)
  if (queue[0] !== input.questionId) {
    throw new HomeworkError('That is not the current question.', 409)
  }
  const question = questions.find((item) => item.id === input.questionId)
  if (!question) throw new HomeworkError('That question is no longer in the quiz.', 404)
  const now = new Date()
  const started = attempt.questionStartedAt ?? attempt.startedAt
  const elapsed = now.getTime() - started.getTime()
  const limit = attempt.timeLimitMs ?? frameForCorrect(attempt.correctCount).timeLimitMs
  const timedOut = Boolean(input.timedOut) || answerIsLate(elapsed, limit)
  const selected = (input.selectedAnswer ?? '').trim()
  if (!timedOut && !selected) throw new HomeworkError('Choose an answer.', 400)
  const correct = !timedOut && selected === question.correctAnswer

  let lives = attempt.livesLeft ?? STARTING_LIVES
  let correctCount = attempt.correctCount
  let extraLifeGranted = attempt.extraLifeGranted
  let endReason: 'WRONG' | 'TIMEOUT' | 'HUNDRED' | null = null
  let reachedHundred = false
  let timeToHundredMs: number | null = null

  if (correct) {
    correctCount += 1
    const next = livesAfterCorrect(correctCount, lives, extraLifeGranted)
    lives = next.livesLeft
    extraLifeGranted = next.extraLifeGranted
    reachedHundred = next.reachedHundred
    if (reachedHundred) {
      endReason = 'HUNDRED'
      timeToHundredMs = Math.max(0, now.getTime() - attempt.startedAt.getTime())
    }
  } else {
    lives -= 1
    if (lives <= 0) endReason = timedOut ? 'TIMEOUT' : 'WRONG'
  }

  const ids = questions.map((item) => item.id)
  let nextQueue = queue.slice(1)
  if (!endReason && nextQueue.length === 0) {
    nextQueue = reshuffleAvoiding(ids, question.id)
  }
  const durationMs = Math.max(0, now.getTime() - attempt.startedAt.getTime())
  const frame = frameForCorrect(correctCount)
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.homeworkAttempt.updateMany({
      where: {
        id: attempt.id,
        status: 'IN_PROGRESS',
        questionStartedAt: attempt.questionStartedAt,
      },
      data: {
        queue: nextQueue,
        correctCount,
        answeredCount: attempt.answeredCount + 1,
        livesLeft: lives,
        extraLifeGranted,
        durationMs,
        timeLimitMs: endReason ? attempt.timeLimitMs : frame.timeLimitMs,
        questionStartedAt: endReason ? attempt.questionStartedAt : now,
        status: endReason ? 'FINISHED' : 'IN_PROGRESS',
        endReason,
        reachedHundred,
        timeToHundredMs,
        finishedAt: endReason ? now : null,
      },
    })
    if (claimed.count !== 1) return null
    await tx.homeworkAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        questionText: question.question,
        selectedAnswer: selected,
        correctAnswer: question.correctAnswer,
        correct,
        timeUsedMs: Math.max(0, Math.min(elapsed, limit)),
        order: attempt.answeredCount,
      },
    })
    return tx.homeworkAttempt.findFirst({
      where: { id: attempt.id },
      include: { answers: true },
    })
  })
  if (!updated) {
    const latest = await prisma.homeworkAttempt.findFirst({
      where: { id: attempt.id },
      include: { answers: true },
    })
    if (!latest) throw new HomeworkError('That try could not be found.', 404)
    return toPlayState(latest, questions, false)
  }
  return toPlayState(updated, questions, false)
}
