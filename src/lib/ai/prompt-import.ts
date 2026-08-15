import { z } from 'zod';
import { QuestionType } from '@/types/question_types';
import {
  levelFromTags,
  levelLabelFromId,
} from '@/lib/taxonomy/quiz-taxonomy';

const PLACEHOLDER_IMAGE = '/images/placeholder.webp';

/** Same shape the CSV uploader ends up with after parsing a row. */
export interface ImportedQuestion {
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl: string;
  imageFile: null;
  type: QuestionType;
}

const csvStyleRowSchema = z.object({
  question: z.string().min(1),
  answer1: z.string().optional(),
  answer2: z.string().optional(),
  answer3: z.string().optional(),
  answer4: z.string().optional(),
  answers: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  type: z.string().optional(),
  imageUrl: z.string().optional(),
});

const importedPayloadSchema = z.union([
  z.array(csvStyleRowSchema).min(1).max(40),
  z.object({ questions: z.array(csvStyleRowSchema).min(1).max(40) }),
]);

export interface ExternalPromptInput {
  quizTitle: string;
  quizDescription: string;
  tags: string[];
  numberOfQuestions: number;
  exampleSentences?: string;
  themesVocabulary?: string;
  quizType?: QuestionType;
}

function parseQuestionType(
  raw: string | undefined,
  fallback: QuestionType
): QuestionType {
  if (!raw) return fallback;
  const normalized = raw.toUpperCase().replace(/ /g, '_') as QuestionType;
  if (Object.values(QuestionType).includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function answersFromRow(row: z.infer<typeof csvStyleRowSchema>): string[] {
  if (row.answers && row.answers.length > 0) {
    return row.answers.map((a) => a.trim()).filter(Boolean);
  }
  return [row.answer1, row.answer2, row.answer3, row.answer4]
    .map((a) => (a ?? '').trim())
    .filter(Boolean);
}

/** Strip ```json fences and leading chatter so pasted ChatGPT output still parses. */
export function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  const arrayStart = trimmed.indexOf('[');
  const objectStart = trimmed.indexOf('{');
  if (arrayStart === -1 && objectStart === -1) {
    return trimmed;
  }
  if (arrayStart === -1) return trimmed.slice(objectStart);
  if (objectStart === -1) return trimmed.slice(arrayStart);
  return trimmed.slice(Math.min(arrayStart, objectStart));
}

export function buildExternalAiPrompt(input: ExternalPromptInput): string {
  const count = Math.min(40, Math.max(1, Math.round(input.numberOfQuestions) || 10));
  const title = input.quizTitle.trim() || 'Untitled quiz';
  const description = input.quizDescription.trim() || 'No description provided';
  const tags = input.tags.map((t) => t.trim()).filter(Boolean);
  const levelId = levelFromTags(tags) ?? 'A1';
  const levelLabel = levelLabelFromId(levelId);
  const tagLine = tags.length > 0 ? tags.join(', ') : 'General classroom English';
  const exampleSentences =
    input.exampleSentences?.trim() || 'None provided';
  const themesVocabulary =
    input.themesVocabulary?.trim() || 'None provided';

  return `Create a ${count}-question multiple-choice English quiz for young learners.

Quiz: ${title}
Description: ${description}
Tags: ${tagLine}
Level: ${levelLabel} (${levelId})
Example sentences / grammar: ${exampleSentences}
Themes / vocabulary: ${themesVocabulary}

Return ONLY JSON (no markdown, no commentary), as an array like:
[{"question":"...","answers":["...","...","...","..."],"correctAnswer":"...","imageKeyword":"..."}]

correctAnswer must exactly match one answer. Optionally use answer1–answer4 instead of answers.`;
}

export function parseImportedQuestionsJson(
  raw: string,
  quizOverallType: QuestionType = QuestionType.MULTIPLE_CHOICE
): ImportedQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonPayload(raw));
  } catch {
    throw new Error(
      'Could not parse JSON. Paste a JSON array of questions (or wrap it in { "questions": [...] }).'
    );
  }

  const payload = importedPayloadSchema.safeParse(parsed);
  if (!payload.success) {
    const first = payload.error.issues[0];
    throw new Error(
      first
        ? `Invalid question data: ${first.path.join('.') || 'root'} — ${first.message}`
        : 'Invalid question JSON shape.'
    );
  }

  const rows = Array.isArray(payload.data)
    ? payload.data
    : payload.data.questions;

  return rows.map((row, index) => {
    const answers = answersFromRow(row);
    if (answers.length < 2) {
      throw new Error(
        `Question ${index + 1}: need at least 2 answers (use answers[] or answer1–answer4).`
      );
    }
    if (!answers.includes(row.correctAnswer.trim())) {
      throw new Error(
        `Question ${index + 1}: correctAnswer must exactly match one of the answers.`
      );
    }
    return {
      question: row.question.trim(),
      answers,
      correctAnswer: row.correctAnswer.trim(),
      imageUrl: row.imageUrl?.trim() || PLACEHOLDER_IMAGE,
      imageFile: null,
      type: parseQuestionType(row.type, quizOverallType),
    };
  });
}
