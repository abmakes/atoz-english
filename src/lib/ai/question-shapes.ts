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

export const FIND_THE_MISTAKE_ANSWER_STYLE =
  'Four complete sentences. One is fully correct.';

export const FILL_THE_GAP_ANSWER_STYLE =
  'A word or short phrase that fits the gap.';

export const MAX_TEACHER_EXAMPLES = 4;

/** Split the example field into one stem per line. Never treat two lines as one question. */
export function splitTeacherExamples(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_TEACHER_EXAMPLES);
}

export function isGenericAnswerStyle(
  style: string,
  shape: QuestionShapeLabel
): boolean {
  const text = style.trim()
  if (!text) return true
  if (/short classroom answer/i.test(text)) return true
  return text === defaultAnswerStyleForShape(shape)
}

export function visibleAnswerFormat(
  style: string,
  shape: QuestionShapeLabel
): string {
  return isGenericAnswerStyle(style, shape) ? '' : style.trim()
}

export function defaultAnswerStyleForShape(shape: QuestionShapeLabel): string {
  switch (shape) {
    case 'Find the mistake':
      return FIND_THE_MISTAKE_ANSWER_STYLE;
    case 'Fill the gap':
      return FILL_THE_GAP_ANSWER_STYLE;
    case 'Yes/No question':
      return 'Yes or no';
    case 'Wh-question':
      return 'A short answer that matches the question';
    case 'Negative':
      return 'A negative sentence';
    case 'Affirmative':
      return 'A short classroom sentence';
  }
}

export function canonicalAnswerStyle(shape: QuestionShape): string {
  if (shape.shape === 'Find the mistake') return FIND_THE_MISTAKE_ANSWER_STYLE;
  if (shape.shape === 'Fill the gap') {
    const current = shape.answerStyle.toLowerCase();
    if (/mistake|correct/.test(current)) return FILL_THE_GAP_ANSWER_STYLE;
  }
  return shape.answerStyle;
}

const FIND_THE_MISTAKE_TAIL = /\s*find the mistake\.?\s*$/i;

export function sanitizeShapeStem(shape: QuestionShape): QuestionShape {
  let question = shape.question.trim();
  if (shape.shape === 'Fill the gap') {
    question = question.replace(FIND_THE_MISTAKE_TAIL, '').trim();
  }
  if (shape.shape === 'Find the mistake') {
    question = question.replace(FIND_THE_MISTAKE_TAIL, '').replace(/_{2,}/g, '').replace(/\s{2,}/g, ' ').trim();
  }
  return {
    ...shape,
    question: question || shape.question,
    answerStyle: canonicalAnswerStyle({ ...shape, question }),
  };
}

export const QUESTION_SHAPE_RULES = `SHAPE RULES:
- Never mix shapes. A stem is one of: a question, a gap, a statement, or an error-correction item.
- Find the mistake: the stem is a complete WRONG sentence. Do not use _____. Do not add "Find the mistake" as extra wording. Optional short instruction: "Choose the correct sentence."
- Find the mistake answers are four complete sentences. One is fully grammatical. The other three are still wrong. Never a single word, never a blank, never a fragment.
  Bad: stem "I am like play football." answers ["like","play","am","football"].
  Good: stem "I am like play football." answers ["I like playing football.","I am playing football.","I like play football.","I am like football."].
- Fill the gap: the stem has _____. Answers are words or short phrases that fit the blank. Do not write "Find the mistake" on a gap item.`;

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

  return shapes.slice(0, SHAPE_SAMPLE_COUNT).map(sanitizeShapeStem);
}

/** Keep each teacher example as its own row. Never join two examples into one stem. */
export function finalizeShapeSample(
  shapes: QuestionShape[],
  example: string
): QuestionShape[] {
  const sample = shapes.slice(0, SHAPE_SAMPLE_COUNT);
  const examples = splitTeacherExamples(example);
  if (examples.length === 0) return sample;

  const exact = new Set(examples);
  const pinned = examples.map((text) => {
    const match = sample.find((shape) => shape.question.trim() === text);
    const shape = inferQuestionShape(text);
    return {
      shape,
      question: text,
      answerStyle:
        match?.answerStyle?.trim() || defaultAnswerStyleForShape(shape),
    };
  });
  const others = sample.filter((shape) => {
    const question = shape.question.trim();
    if (exact.has(question)) return false;
    if (
      examples.length >= 2 &&
      examples.every((item) => question.includes(item))
    ) {
      return false;
    }
    return true;
  });
  return [...pinned, ...others]
    .slice(0, SHAPE_SAMPLE_COUNT)
    .map(sanitizeShapeStem);
}

export function createQuestionShapePrompt(brief: GenerationBrief): string {
  const example = brief.modelSentence?.trim() || '';
  const preferred = [...brief.sentenceForms, ...brief.questionStyles];
  const preferredLine =
    preferred.length > 0
      ? `For the other forms, prefer: ${preferred.join(', ')}.`
      : 'For the other forms, use yes/no questions, fill-the-gap, find-the-mistake, or a short affirmative or negative sentence.';
  const examples = splitTeacherExamples(example);
  const mix =
    examples.length > 1
      ? `The teacher typed ${examples.length} separate example questions. Each is its own stem. Never join them into one question.
${examples.map((item, index) => `${index + 1}. ${item}`).join('\n')}
- The first ${examples.length} rows are those examples, each unchanged, one example per row.
- Remaining rows are close variants or other forms of those language points.
- ${preferredLine}`
    : examples.length === 1
      ? `The teacher typed this example: "${examples[0]}"
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

${QUESTION_SHAPE_RULES}

Each object uses:
- shape: one of ${QUESTION_SHAPE_LABELS.join(', ')}
- question: the stem only. Use _____ only for Fill the gap.
- answerStyle: one short line describing the four options. Not the options themselves. For Find the mistake use: "${FIND_THE_MISTAKE_ANSWER_STYLE}"

Return only a JSON array of ${SHAPE_SAMPLE_COUNT} objects:
[{"shape":"Wh-question","question":"What is he doing?","answerStyle":"A present continuous action"}]`;
}
