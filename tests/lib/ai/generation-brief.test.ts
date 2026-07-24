import { describe, expect, it } from 'vitest'
import {
  buildBriefSummary,
  defaultQuestionStylesForGrammar,
  defaultSentenceFormsForGrammar,
  discoveryTagsFromBrief,
  generationBriefSchema,
  lessonImageAnalysisSchema,
} from '@/lib/ai/generation-brief'
import {
  applySuggestedSimplifications,
  createTeacherFirstPrompt,
  parseGeneratedQuestions,
} from '@/lib/ai/quiz-generation'
import { resolveLexicon } from '@/lib/lexicon/resolver'

describe('generation brief schema', () => {
  it('parses a complete teacher brief', () => {
    const brief = generationBriefSchema.parse({
      level: 'A1',
      topics: ['Daily Routines'],
      grammarFocus: ['Present Simple'],
      teacherNotes: 'Students are learning Do/Does questions.',
      modelSentence: 'She plays football.',
      sentenceForms: ['Affirmative', 'Negative'],
      questionStyles: ['Fill the gap', 'Choose the correct form'],
      vocabularyFocus: 'Verbs',
      numberOfQuestions: 8,
      quizTitle: 'Routines',
      quizDescription: 'A1 present simple',
    })

    expect(brief.numberOfQuestions).toBe(8)
    expect(buildBriefSummary(brief)).toContain('Create 8 A1 questions about Daily Routines')
    expect(discoveryTagsFromBrief(brief)).toEqual(
      expect.arrayContaining(['A1', 'Daily Routines', 'Present Simple'])
    )
  })

  it('derives defaults from grammar profiles', () => {
    expect(defaultSentenceFormsForGrammar(['Present Simple'])).toEqual(
      expect.arrayContaining(['Affirmative', 'Negative'])
    )
    expect(defaultQuestionStylesForGrammar(['Present Simple'])).toEqual(
      expect.arrayContaining(['Choose the correct form'])
    )
  })

  it('validates lesson image analysis payloads', () => {
    const analysis = lessonImageAnalysisSchema.parse({
      lessonSummary: 'Students practise daily routines with Present Simple.',
      suggestedLevel: 'A1',
      topics: ['Daily Routines'],
      grammarFocus: ['Present Simple'],
      keyVocabulary: ['play', 'go', 'school'],
      sentencePatterns: ['subject + verb', 'do/does + subject'],
      questionStyles: ['Fill the gap', 'Choose the correct form', 'Picture description'],
    })

    expect(analysis.suggestedLevel).toBe('A1')
    expect(analysis.questionStyles).toHaveLength(3)
  })
})

describe('teacher-first prompt assembly', () => {
  it('prioritizes teacher notes over a hard allowlist', () => {
    const selection = resolveLexicon({
      level: 'A1',
      tags: ['Animals', 'Present Simple'],
      limit: 30,
    })
    const prompt = createTeacherFirstPrompt({
      brief: {
        level: 'A1',
        topics: ['Animals'],
        grammarFocus: ['Present Simple'],
        teacherNotes: 'Students are learning animal names with Do/Does.',
        modelSentence: 'Does the cat sleep?',
        sentenceForms: ['Yes/No question'],
        questionStyles: ['Choose the correct form'],
        vocabularyFocus: 'Nouns',
        numberOfQuestions: 3,
        quizTitle: 'Animals',
        quizDescription: 'Classroom practice',
        keyVocabulary: ['lion', 'zebra'],
      },
      selection,
    })

    expect(prompt).toContain('TEACHER BRIEF (highest priority)')
    expect(prompt).toContain('Students are learning animal names with Do/Does.')
    expect(prompt).toContain('HELPFUL LEVEL EXAMPLES (not an exclusive allowlist)')
    expect(prompt).not.toContain('Use only words from this allowlist')
    expect(prompt).toContain('lion, zebra')
  })

  it('parses imageKeyword from generated JSON', () => {
    const result = parseGeneratedQuestions(
      '[{"question":"The cat is ...","answers":["big","run","blue","two"],"correctAnswer":"big","imageKeyword":"cat pet"}]',
      1
    )
    expect(result[0].imageKeyword).toBe('cat pet')
  })

  it('applies suggested simplifications', () => {
    const next = applySuggestedSimplifications('The gone dog is here', [
      { word: 'gone', suggestion: 'go' },
    ])
    expect(next).toBe('The go dog is here')
  })
})
