import { z } from 'zod';
import type { GenerationBrief } from '@/lib/ai/generation-brief';
import { buildBriefSummary } from '@/lib/ai/generation-brief';
import { profilesForTags } from '@/lib/lexicon/grammar-profiles';
import type { LexiconSelection } from '@/lib/lexicon/types';
import { levelLabelFromId } from '@/lib/taxonomy/quiz-taxonomy';

export const generatedQuestionSchema = z
  .object({
    question: z.string().min(1).max(240),
    answers: z.array(z.string().min(1).max(100)).length(4),
    correctAnswer: z.string().min(1).max(100),
    imageKeyword: z.string().trim().min(1).max(80).optional(),
  })
  .refine((question) => question.answers.includes(question.correctAnswer), {
    message: 'correctAnswer must exactly match one answer',
    path: ['correctAnswer'],
  });

export type GeneratedQuestionText = z.infer<typeof generatedQuestionSchema>;

const generatedQuestionsSchema = z.array(generatedQuestionSchema).min(1).max(20);

function levelGuidance(level: string): string {
  switch (level) {
    case 'PRE_A1':
      return 'Use familiar concrete labels, basic actions, and very short visual prompts.';
    case 'A1':
      return 'Use basic everyday vocabulary and short, direct clauses.';
    case 'A2':
      return 'Use short everyday situations and simple connected ideas.';
    case 'B1':
      return 'Use concise familiar-topic language; avoid long opinion or critique prompts.';
    default:
      return 'Use concise young-learner language.';
  }
}

function imageKeywordFromQuestion(question: GeneratedQuestionText): string {
  if (question.imageKeyword?.trim()) {
    return question.imageKeyword.trim().toLowerCase();
  }

  const fromCorrect = question.correctAnswer
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  if (fromCorrect) return fromCorrect.toLowerCase();

  const fromPrompt = question.question
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 3)
    .join(' ');
  return fromPrompt.toLowerCase() || 'classroom';
}

export function createTeacherFirstPrompt(input: {
  brief: GenerationBrief;
  selection: LexiconSelection;
}): string {
  const { brief, selection } = input;
  const profiles = profilesForTags([
    ...brief.grammarFocus,
    ...brief.topics,
  ]);
  const patterns =
    profiles.flatMap((profile) => profile.patterns).join('; ') ||
    selection.grammarPatterns.join('; ') ||
    'Use a short structure suitable for the target level.';
  const summary = buildBriefSummary(brief);
  const vocabFocus =
    brief.vocabularyFocus === 'Mixed'
      ? 'mixed word classes'
      : brief.vocabularyFocus.toLowerCase();
  const teacherVocabulary =
    brief.keyVocabulary && brief.keyVocabulary.length > 0
      ? brief.keyVocabulary.join(', ')
      : 'None provided';
  const lessonSummary = brief.lessonSummary?.trim() || 'None provided';
  const modelSentence = brief.modelSentence?.trim() || 'None provided';
  const sentencePatterns =
    brief.sentencePatterns && brief.sentencePatterns.length > 0
      ? brief.sentencePatterns.join('; ')
      : patterns;

  return `Act as an expert young-learner ESL item writer for classroom teachers.

TEACHER BRIEF (highest priority):
- Plain-language goal: ${summary}
- CEFR band: ${levelLabelFromId(brief.level)} (${brief.level})
- Quiz title: ${brief.quizTitle || 'Untitled quiz'}
- Quiz description: ${brief.quizDescription || 'No public description'}
- Teacher notes: ${brief.teacherNotes || 'No additional notes'}
- Optional model sentence (copy the structure, not the wording): ${modelSentence}
- Topics: ${brief.topics.join(', ') || 'General classroom theme'}
- Grammar focus: ${brief.grammarFocus.join(', ') || 'Short classroom language'}
- Sentence forms to practise: ${brief.sentenceForms.join(', ') || 'Mixed'}
- Question styles: ${brief.questionStyles.join(', ') || 'Mixed'}
- Vocabulary focus: ${vocabFocus}
- Lesson image summary (if any): ${lessonSummary}
- Teacher / textbook vocabulary to prefer: ${teacherVocabulary}
- Useful sentence patterns: ${sentencePatterns}

LEVEL GUIDANCE:
- ${levelGuidance(brief.level)}
- Keep each question under 16 words.
- Keep each answer under 6 words.
- Prefer concrete, imageable situations.
- Create original wording. Do not copy long passages from any book page.
- Age-appropriate classroom content only.

HELPFUL LEVEL EXAMPLES (not an exclusive allowlist):
- These words are typical for ${levelLabelFromId(brief.level)} and may help you stay accessible:
${selection.words.slice(0, 80).join(', ') || 'common classroom words'}
- Prefer teacher-provided vocabulary and lesson vocabulary over these examples.
- Proper names and textbook topic words from the teacher notes are allowed when needed.
- If a needed word may be above level, still write a clear classroom question; the teacher will review warnings later.

QUALITY:
- Create exactly ${brief.numberOfQuestions} multiple-choice questions.
- Provide exactly four answer options.
- Exactly one answer is correct.
- Distractors must be plausible but unambiguously wrong.
- correctAnswer must exactly match one string in answers.
- Do not include answer labels such as "A)".
- Also include a short imageKeyword (2-4 concrete nouns/verbs) for each question.

Return only a JSON array:
[{"question":"...","answers":["...","...","...","..."],"correctAnswer":"...","imageKeyword":"..."}]`;
}

/** @deprecated Prefer createTeacherFirstPrompt */
export function createQuizGenerationPrompt(input: {
  selection: LexiconSelection;
  tags: string[];
  quizTitle: string;
  quizDescription: string;
  numberOfQuestions: number;
}): string {
  return createTeacherFirstPrompt({
    brief: {
      level: input.selection.level,
      topics: input.tags,
      grammarFocus: input.tags,
      teacherNotes: input.quizDescription,
      modelSentence: '',
      sentenceForms: [],
      questionStyles: [],
      vocabularyFocus: 'Mixed',
      numberOfQuestions: input.numberOfQuestions,
      quizTitle: input.quizTitle,
      quizDescription: input.quizDescription,
    },
    selection: input.selection,
  });
}

export function createSoftSimplifyPrompt(input: {
  originalPrompt: string;
  previousQuestions: GeneratedQuestionText[];
  flaggedWords: string[];
}): string {
  return `${input.originalPrompt}

Optional polish: some words may be above the target level:
${input.flaggedWords.join(', ')}

Rewrite the complete batch with simpler wording where it still matches the teacher brief.
Do not drop the teacher's requested grammar focus or vocabulary theme.
Previous draft:
${JSON.stringify(input.previousQuestions)}

Return only the corrected JSON array.`;
}

/** @deprecated Prefer createSoftSimplifyPrompt */
export function createRepairPrompt(input: {
  originalPrompt: string;
  previousQuestions: GeneratedQuestionText[];
  forbiddenWords: string[];
}): string {
  return createSoftSimplifyPrompt({
    originalPrompt: input.originalPrompt,
    previousQuestions: input.previousQuestions,
    flaggedWords: input.forbiddenWords,
  });
}

export function parseGeneratedQuestions(
  raw: string,
  expectedCount: number
): GeneratedQuestionText[] {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  const questions = generatedQuestionsSchema.parse(parsed);

  if (questions.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} questions but received ${questions.length}`
    );
  }

  return questions.map((question) => ({
    ...question,
    imageKeyword: imageKeywordFromQuestion(question),
  }));
}

export function applySuggestedSimplifications(
  text: string,
  replacements: Array<{ word: string; suggestion?: string }>
): string {
  let next = text;
  for (const item of replacements) {
    if (!item.suggestion) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(item.word)}\\b`, 'gi');
    next = next.replace(pattern, item.suggestion);
  }
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
