import { z } from 'zod';
import type { GenerationBrief } from '@/lib/ai/generation-brief';
import { levelLabelFromId } from '@/lib/taxonomy/quiz-taxonomy';

export const SHAPE_SAMPLE_COUNT = 6;

export const QUESTION_SHAPE_LABELS = [
  'Wh-question',
  'Yes/No question',
  'Fill the gap',
  'Affirmative',
  'Negative',
  'Find the mistake',
] as const;

export type QuestionShapeLabel = (typeof QUESTION_SHAPE_LABELS)[number];

export const questionShapeSchema = z.object({
  shape: z.enum(QUESTION_SHAPE_LABELS),
  question: z.string().trim().min(1).max(240),
  answerStyle: z.string().trim().min(1).max(200),
});

export type QuestionShape = z.infer<typeof questionShapeSchema>;

const WH_START = /^(what|where|who|when|why|how|which)\b/i;
const YES_NO_START = /^(is|are|am|do|does|did|can|could|was|were|will|have|has)\b/i;
const NEGATIVE_START = /^(don'?t|do not|doesn'?t|does not|isn'?t|is not|aren'?t|are not|wasn'?t|weren'?t|cannot|can'?t)\b/i;

export function inferQuestionShape(sentence: string): QuestionShapeLabel {
  const text = sentence.trim();
  if (/_{2,}|\bblank\b/i.test(text)) return 'Fill the gap';
  if (WH_START.test(text)) return 'Wh-question';
  if (text.endsWith('?') && YES_NO_START.test(text)) return 'Yes/No question';
  if (NEGATIVE_START.test(text)) return 'Negative';
  if (/\b(mistake|wrong|error)\b/i.test(text)) return 'Find the mistake';
  return 'Affirmative';
}

export function normalizeShapeLabel(value: string): string {
  const text = value.trim().toLowerCase();
  if (text.includes('yes') || text.includes('y/n')) return 'Yes/No question';
  if (text.includes('wh-') || text.includes('wh ') || text === 'wh' || text.includes('open question')) {
    return 'Wh-question';
  }
  if (text.includes('gap') || text.includes('blank') || text.includes('fill')) return 'Fill the gap';
  if (text.includes('mistake') || text.includes('error')) return 'Find the mistake';
  if (text.includes('neg')) return 'Negative';
  if (text.includes('affirm') || text.includes('statement')) return 'Affirmative';
  return value.trim();
}

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

export function parseGeneratedShapes(raw: string): QuestionShape[] {
  const cleaned = stripJsonFence(raw);
  const parsed: unknown = JSON.parse(cleaned);
  const list = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { shapes?: unknown }).shapes)
      ? (parsed as { shapes: unknown[] }).shapes
      : null;

  if (!list) {
    throw new Error('The AI did not return a list of question shapes.');
  }

  const normalized = list.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const record = item as { shape?: unknown };
    if (typeof record.shape !== 'string') return item;
    return { ...record, shape: normalizeShapeLabel(record.shape) };
  });

  const shapes = z.array(questionShapeSchema).parse(normalized);
  if (shapes.length < SHAPE_SAMPLE_COUNT) {
    throw new Error(
      `Expected ${SHAPE_SAMPLE_COUNT} question shapes but received ${shapes.length}`
    );
  }

  return shapes.slice(0, SHAPE_SAMPLE_COUNT);
}

/** Keep the teacher's own sentence as row 1, and drop an exact copy from the rest. */
export function finalizeShapeSample(
  shapes: QuestionShape[],
  example: string
): QuestionShape[] {
  const sample = shapes.slice(0, SHAPE_SAMPLE_COUNT);
  const trimmed = example.trim();
  if (!trimmed) return sample;

  const match = sample.find((shape) => shape.question.trim() === trimmed);
  const pinned: QuestionShape = {
    shape: inferQuestionShape(trimmed),
    question: trimmed,
    answerStyle:
      match?.answerStyle?.trim() ||
      'A short classroom answer that fits this question',
  };
  const others = sample.filter((shape) => shape.question.trim() !== trimmed);
  return [pinned, ...others].slice(0, SHAPE_SAMPLE_COUNT);
}

export function createQuestionShapePrompt(brief: GenerationBrief): string {
  const example = brief.modelSentence?.trim() || '';
  const preferred = [...brief.sentenceForms, ...brief.questionStyles];
  const preferredLine =
    preferred.length > 0
      ? `For the other forms, prefer: ${preferred.join(', ')}.`
      : 'For the other forms, use yes/no questions, fill-the-gap, find-the-mistake, or a short affirmative or negative sentence.';
  const mix = example
    ? `The teacher typed this example: "${example}"
- Row 1 is that sentence, unchanged.
- Rows 2 and 3 keep that same shape. Change only the subject, verb, or number.
- Rows 4, 5, and 6 are different forms of the same language point.
- ${preferredLine}`
    : brief.teacherNotes.trim()
      ? `The teacher described the task in the notes. They did not paste one sentence.
- Rows 1 to 3 follow that task closely, with different people, verbs, or numbers.
- Rows 4, 5, and 6 are different forms of that same task.
- ${preferredLine}`
      : `The teacher did not give an example or notes.
- Propose six different question shapes from the title, description, and tags.
- ${preferredLine}`;

  return `Act as an expert young-learner ESL item writer.

Propose exactly ${SHAPE_SAMPLE_COUNT} question stems for a classroom quiz. Do not write answer options. Do not write image keywords.

TEACHER CONTEXT:
- CEFR band: ${levelLabelFromId(brief.level)} (${brief.level})
- Quiz title: ${brief.quizTitle || 'Untitled quiz'}
- Quiz description: ${brief.quizDescription || 'No public description'}
- Teacher notes: ${brief.teacherNotes.trim() || 'No additional notes'}
- Topics: ${brief.topics.join(', ') || 'General classroom theme'}
- Grammar focus: ${brief.grammarFocus.join(', ') || 'Short classroom language'}
- Lesson summary: ${brief.lessonSummary?.trim() || 'None'}
- Vocabulary the teacher named: ${brief.keyVocabulary?.join(', ') || 'None'}

MIX:
${mix}

CONTENT RULE:
- Every stem practises the language point in the notes, the example, the title, or the description.
- Tags name the classroom topic. They must not add a second task.
- If the notes or example are about numbers from 100 to 1000 written in words, do not write color questions or numbers outside 100 to 1000.
- If the example is a present continuous question, every stem practises present continuous.
- Vary the people, actions, and numbers. Do not repeat one sentence six times.

Each object uses:
- shape: one of ${QUESTION_SHAPE_LABELS.join(', ')}
- question: the stem only. Use _____ for a gap.
- answerStyle: one short line describing the four options. Not the options themselves.

Return only a JSON array of ${SHAPE_SAMPLE_COUNT} objects:
[{"shape":"Wh-question","question":"What is he doing?","answerStyle":"A present continuous action"}]`;
}
