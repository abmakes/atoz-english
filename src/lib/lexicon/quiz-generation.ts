import { z } from 'zod';
import type { LexiconSelection } from '@/lib/lexicon/types';

export const generatedQuestionSchema = z
  .object({
    question: z.string().min(1).max(240),
    answers: z.array(z.string().min(1).max(100)).length(4),
    correctAnswer: z.string().min(1).max(100),
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

export function createQuizGenerationPrompt(input: {
  selection: LexiconSelection;
  tags: string[];
  quizTitle: string;
  quizDescription: string;
  numberOfQuestions: number;
}): string {
  const { selection } = input;
  const patterns =
    selection.grammarPatterns.length > 0
      ? selection.grammarPatterns.join('; ')
      : 'Use a short structure suitable for the target level.';

  return `Act as an expert young-learner ESL item writer.

Create exactly ${input.numberOfQuestions} multiple-choice questions.

TARGET:
- CEFR band: ${selection.level}
- Topics and language focus: ${input.tags.join(', ')}
- Quiz title: ${input.quizTitle || 'Untitled quiz'}
- Teacher context: ${input.quizDescription || 'No additional context'}
- Grammar patterns: ${patterns}

LANGUAGE BOUNDARY:
- ${levelGuidance(selection.level)}
- Use only words from this allowlist (ordinary inflected forms are allowed):
${selection.words.join(', ')}
- Proper names are not allowed.
- Keep each question under 16 words.
- Keep each answer under 6 words.
- Prefer concrete, imageable situations.

QUALITY:
- Provide exactly four answer options.
- Exactly one answer is correct.
- Distractors must be plausible but unambiguously wrong.
- correctAnswer must exactly match one string in answers.
- Do not include answer labels such as "A)".

Return only a JSON array:
[{"question":"...","answers":["...","...","...","..."],"correctAnswer":"..."}]`;
}

export function createRepairPrompt(input: {
  originalPrompt: string;
  previousQuestions: GeneratedQuestionText[];
  forbiddenWords: string[];
}): string {
  return `${input.originalPrompt}

The previous draft used words outside the approved language boundary:
${input.forbiddenWords.join(', ')}

Rewrite the complete batch. Do not use those words.
Previous draft:
${JSON.stringify(input.previousQuestions)}

Return only the corrected JSON array.`;
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

  return questions;
}
