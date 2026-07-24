import { z } from 'zod';
import {
  CEFR_LEVELS,
  QUESTION_STYLE_OPTIONS,
  SENTENCE_FORM_OPTIONS,
  VOCABULARY_FOCUS_OPTIONS,
  resolveGrammarTags,
  resolveTopicTags,
  summarizeGenerationBrief,
  type CefrLevelId,
  type GrammarTag,
  type QuestionStyle,
  type SentenceForm,
  type TopicTag,
  type VocabularyFocus,
} from '@/lib/taxonomy/quiz-taxonomy';
import { profilesForTags } from '@/lib/lexicon/grammar-profiles';

const levelIds = CEFR_LEVELS.map((level) => level.id) as [
  CefrLevelId,
  ...CefrLevelId[],
];

export const generationBriefSchema = z.object({
  level: z.enum(levelIds),
  topics: z.array(z.string().trim().min(1)).max(8).default([]),
  grammarFocus: z.array(z.string().trim().min(1)).max(8).default([]),
  teacherNotes: z.string().trim().max(1200).default(''),
  modelSentence: z.string().trim().max(240).default(''),
  sentenceForms: z.array(z.enum(SENTENCE_FORM_OPTIONS)).max(4).default([]),
  questionStyles: z.array(z.enum(QUESTION_STYLE_OPTIONS)).max(4).default([]),
  vocabularyFocus: z.enum(VOCABULARY_FOCUS_OPTIONS).default('Mixed'),
  numberOfQuestions: z.number().int().min(1).max(20),
  quizTitle: z.string().trim().max(160).default(''),
  quizDescription: z.string().trim().max(500).default(''),
  lessonSummary: z.string().trim().max(600).optional(),
  keyVocabulary: z.array(z.string().trim().min(1)).max(40).optional(),
  sentencePatterns: z.array(z.string().trim().min(1)).max(12).optional(),
});

export type GenerationBrief = z.infer<typeof generationBriefSchema>;

export const lessonImageAnalysisSchema = z.object({
  lessonSummary: z.string().trim().min(1).max(600),
  suggestedLevel: z.enum(levelIds),
  topics: z.array(z.string().trim().min(1)).max(6),
  grammarFocus: z.array(z.string().trim().min(1)).max(6),
  keyVocabulary: z.array(z.string().trim().min(1)).max(30),
  sentencePatterns: z.array(z.string().trim().min(1)).max(8),
  questionStyles: z.array(z.enum(QUESTION_STYLE_OPTIONS)).max(3),
  teacherNotesDraft: z.string().trim().max(800).optional(),
});

export type LessonImageAnalysis = z.infer<typeof lessonImageAnalysisSchema>;

export function normalizeBriefTopics(tags: string[]): TopicTag[] {
  return resolveTopicTags(tags);
}

export function normalizeBriefGrammar(tags: string[]): GrammarTag[] {
  return resolveGrammarTags(tags);
}

export function defaultSentenceFormsForGrammar(
  grammarFocus: string[]
): SentenceForm[] {
  const profiles = profilesForTags(grammarFocus);
  if (profiles.some((profile) => profile.tag === 'Questions & Negatives')) {
    return ['Affirmative', 'Negative', 'Yes/No question', 'Wh-question'];
  }
  if (profiles.length > 0) {
    return ['Affirmative', 'Negative'];
  }
  return ['Affirmative'];
}

export function defaultQuestionStylesForGrammar(
  grammarFocus: string[]
): QuestionStyle[] {
  const profiles = profilesForTags(grammarFocus);
  const fromProfiles = profiles
    .flatMap((profile) => profile.questionStyles)
    .filter((style): style is QuestionStyle =>
      (QUESTION_STYLE_OPTIONS as readonly string[]).includes(style)
    );
  const unique = [...new Set(fromProfiles)];

  if (unique.length > 0) return unique.slice(0, 2);
  if (grammarFocus.length > 0) return ['Choose the correct form', 'Fill the gap'];
  return ['Vocabulary meaning', 'Picture description'];
}

export function buildBriefSummary(brief: GenerationBrief): string {
  return summarizeGenerationBrief({
    level: brief.level,
    topics: brief.topics,
    grammarFocus: brief.grammarFocus,
    sentenceForms: brief.sentenceForms,
    questionStyles: brief.questionStyles,
    numberOfQuestions: brief.numberOfQuestions,
  });
}

export function discoveryTagsFromBrief(brief: GenerationBrief): string[] {
  const levelLabel =
    CEFR_LEVELS.find((level) => level.id === brief.level)?.label ?? brief.level;
  return [
    levelLabel,
    ...normalizeBriefTopics(brief.topics),
    ...normalizeBriefGrammar(brief.grammarFocus),
  ];
}

export function vocabularyFocusToPos(
  focus: VocabularyFocus
): Array<'noun' | 'verb' | 'adjective' | 'adverb'> {
  switch (focus) {
    case 'Nouns':
      return ['noun'];
    case 'Verbs':
      return ['verb'];
    case 'Adjectives':
      return ['adjective'];
    case 'Adverbs':
      return ['adverb'];
    default:
      return [];
  }
}
