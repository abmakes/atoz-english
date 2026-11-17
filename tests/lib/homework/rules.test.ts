import { describe, expect, it } from 'vitest'
import {
  answerIsLate,
  betterChallengeRun,
  challengeSeconds,
  flameColor,
  homeworkPercentage,
  livesAfterCorrect,
  rankChallengeRuns,
  shouldShake,
  type ChallengeRun,
} from '@/lib/homework/rules'
import { reshuffleAvoiding } from '@/lib/homework/queue'
import { homeworkReportCsv, summarizeHomework, type HomeworkTryRecord } from '@/lib/homework/report'

function run(overrides: Partial<ChallengeRun>): ChallengeRun {
  return {
    studentName: 'Ava',
    correctCount: 10,
    reachedHundred: false,
    timeToHundredMs: null,
    durationMs: 20_000,
    finishedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('challenge clock and flames', () => {
  it('stays at 15 seconds until 50, then drops 2 seconds every 10', () => {
    expect(challengeSeconds(0)).toBe(15)
    expect(challengeSeconds(49)).toBe(15)
    expect(challengeSeconds(50)).toBe(13)
    expect(challengeSeconds(60)).toBe(11)
    expect(challengeSeconds(70)).toBe(9)
    expect(challengeSeconds(80)).toBe(7)
    expect(challengeSeconds(90)).toBe(5)
    expect(challengeSeconds(99)).toBe(5)
  })

  it('shakes only once the limit is under 10 seconds', () => {
    expect(shouldShake(challengeSeconds(60))).toBe(false)
    expect(shouldShake(challengeSeconds(70))).toBe(true)
    expect(shouldShake(challengeSeconds(90))).toBe(true)
  })

  it('starts flames at 30 and steps the color every 10 correct', () => {
    expect(flameColor(29)).toBeNull()
    expect(flameColor(30)).toBe('amber')
    expect(flameColor(39)).toBe('amber')
    expect(flameColor(40)).toBe('orange')
    expect(flameColor(90)).toBe('white-blue')
  })

  it('grants one extra life at 20 and ends the run at 100', () => {
    expect(livesAfterCorrect(19, 1, false)).toEqual({
      livesLeft: 1,
      extraLifeGranted: false,
      reachedHundred: false,
    })
    expect(livesAfterCorrect(20, 1, false)).toEqual({
      livesLeft: 2,
      extraLifeGranted: true,
      reachedHundred: false,
    })
    expect(livesAfterCorrect(21, 2, true).livesLeft).toBe(2)
    expect(livesAfterCorrect(100, 2, true).reachedHundred).toBe(true)
  })

  it('rejects an answer that arrives after the grace period', () => {
    expect(answerIsLate(16_000, 15_000)).toBe(false)
    expect(answerIsLate(17_001, 15_000)).toBe(true)
    expect(homeworkPercentage(1, 0)).toBe(0)
    expect(homeworkPercentage(1, 4)).toBe(25)
  })
})

describe('challenge leaderboard', () => {
  it('ranks a Mega Chad finish above a longer unfinished run', () => {
    const ranked = rankChallengeRuns([
      run({ studentName: 'Ben', correctCount: 99, durationMs: 1000, finishedAt: '2026-01-02T00:00:00.000Z' }),
      run({
        studentName: 'Ava',
        correctCount: 100,
        reachedHundred: true,
        timeToHundredMs: 80_000,
        durationMs: 80_000,
      }),
    ])
    expect(ranked.map((row) => row.studentName)).toEqual(['Ava', 'Ben'])
  })

  it('uses time to 100 when both students finish, otherwise the higher correct count', () => {
    const faster = run({
      studentName: 'Cam',
      correctCount: 100,
      reachedHundred: true,
      timeToHundredMs: 50_000,
      durationMs: 50_000,
    })
    const slower = run({
      studentName: 'Dee',
      correctCount: 100,
      reachedHundred: true,
      timeToHundredMs: 70_000,
      durationMs: 70_000,
      finishedAt: '2026-01-03T00:00:00.000Z',
    })
    expect(betterChallengeRun(faster, slower)).toBe(true)
    const tied = rankChallengeRuns([
      run({ studentName: 'Eve', correctCount: 12, durationMs: 30_000 }),
      run({ studentName: 'Finn', correctCount: 12, durationMs: 10_000, finishedAt: '2026-01-04T00:00:00.000Z' }),
    ])
    expect(tied[0]?.studentName).toBe('Finn')
  })

  it('keeps one row per name, ignoring a weaker retry', () => {
    const ranked = rankChallengeRuns([
      run({ studentName: ' gia ', correctCount: 4 }),
      run({ studentName: 'Gia', correctCount: 15, durationMs: 40_000, finishedAt: '2026-01-05T00:00:00.000Z' }),
    ])
    expect(ranked).toHaveLength(1)
    expect(ranked[0]?.correctCount).toBe(15)
  })
})

describe('homework report', () => {
  const baseTry = (overrides: Partial<HomeworkTryRecord>): HomeworkTryRecord => ({
    id: 'try-1',
    studentName: 'Ava',
    mode: 'HOMEWORK',
    status: 'FINISHED',
    percentage: 50,
    correctCount: 1,
    answeredCount: 2,
    durationMs: 10_000,
    reachedHundred: false,
    timeToHundredMs: null,
    finishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    answers: [
      {
        questionId: 'q1',
        questionText: 'Apple',
        selectedAnswer: 'red',
        correctAnswer: 'red',
        correct: true,
        order: 0,
      },
      {
        questionId: 'q2',
        questionText: 'Sky',
        selectedAnswer: 'green',
        correctAnswer: 'blue',
        correct: false,
        order: 1,
      },
    ],
    ...overrides,
  })

  it('averages each student best percentage and sorts the hardest question first', () => {
    const summary = summarizeHomework([
      baseTry({}),
      baseTry({
        id: 'try-2',
        percentage: 100,
        correctCount: 2,
        durationMs: 20_000,
        createdAt: '2026-01-02T00:00:00.000Z',
        answers: [
          {
            questionId: 'q1',
            questionText: 'Apple',
            selectedAnswer: 'red',
            correctAnswer: 'red',
            correct: true,
            order: 0,
          },
          {
            questionId: 'q2',
            questionText: 'Sky',
            selectedAnswer: 'blue',
            correctAnswer: 'blue',
            correct: true,
            order: 1,
          },
        ],
      }),
      baseTry({
        id: 'try-3',
        studentName: 'Ben',
        percentage: 0,
        correctCount: 0,
        answers: [
          {
            questionId: 'q1',
            questionText: 'Apple',
            selectedAnswer: 'blue',
            correctAnswer: 'red',
            correct: false,
            order: 0,
          },
          {
            questionId: 'q2',
            questionText: 'Sky',
            selectedAnswer: 'green',
            correctAnswer: 'blue',
            correct: false,
            order: 1,
          },
        ],
      }),
      baseTry({
        id: 'challenge',
        mode: 'CHALLENGE',
        percentage: null,
        correctCount: 40,
        answers: [],
      }),
    ])
    expect(summary.finishedStudents).toBe(2)
    expect(summary.classAccuracy).toBe(50)
    expect(summary.students.find((student) => student.studentName === 'Ava')?.attemptCount).toBe(2)
    expect(summary.students.find((student) => student.studentName === 'Ava')?.bestPercentage).toBe(100)
    expect(summary.totalAnswers).toBe(6)
    expect(summary.questions[0]?.questionId).toBe('q2')
    expect(summary.questions[0]?.commonWrong).toBe('green')
    expect(summary.questions[0]?.incorrectPercent).toBeGreaterThan(summary.questions[1]?.incorrectPercent ?? 0)
  })

  it('returns an empty class when nobody has finished', () => {
    const summary = summarizeHomework([])
    expect(summary.classAccuracy).toBeNull()
    expect(summary.finishedStudents).toBe(0)
    expect(homeworkReportCsv(summary)).toContain('Student,Best accuracy')
  })
})

describe('challenge queue', () => {
  it('does not open the next cycle on the question that just finished', () => {
    const random = () => 0
    const next = reshuffleAvoiding(['a', 'b', 'c'], 'a', random)
    expect(next[0]).not.toBe('a')
    expect(reshuffleAvoiding(['only'], 'only', random)).toEqual(['only'])
  })
})
