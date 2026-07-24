export const CEFR_LEVELS = [
  {
    id: 'PRE_A1',
    label: 'Pre-A1',
    description: 'Familiar words, labels, and very short visual prompts',
  },
  {
    id: 'A1',
    label: 'A1',
    description: 'Basic everyday words and short clauses',
  },
  {
    id: 'A2',
    label: 'A2',
    description: 'Common everyday situations and short connected ideas',
  },
  {
    id: 'B1',
    label: 'B1',
    description: 'Broader familiar-topic language in concise sentences',
  },
] as const;

export type CefrLevelId = (typeof CEFR_LEVELS)[number]['id'];

export const TOPIC_TAGS = [
  'Animals',
  'Food & Drink',
  'Travel & Transport',
  'History & Culture',
  'Science & Technology',
  'Entertainment',
  'Sports & Activities',
  'Family & People',
  'School & Classroom',
  'Colors & Numbers',
  'Feelings & Emotions',
  'Clothes',
  'Body Parts',
  'Toys & Games',
  'Home & Furniture',
  'Countries & Places',
  'Weather & Seasons',
  'Nature & Environment',
  'Community & Buildings',
  'Stories & Fantasy',
  'Health & Daily Life',
  'Daily Routines',
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

export const GRAMMAR_GROUPS = [
  {
    id: 'tenses-time',
    label: 'Tenses & time',
    tags: [
      'Present Simple',
      'Present Continuous',
      'Past Simple',
      'Past Continuous',
      'Present Perfect',
      'Future with going to',
      'Time Expressions',
    ],
  },
  {
    id: 'questions-forms',
    label: 'Questions & sentence forms',
    tags: [
      'Questions & Negatives',
      'There is / There are',
      'Word Order',
      'First Conditional',
    ],
  },
  {
    id: 'nouns-quantity',
    label: 'Nouns & quantity',
    tags: ['Countable & Uncountable', 'Quantifiers'],
  },
  {
    id: 'describing',
    label: 'Describing & comparing',
    tags: ['Comparatives & Superlatives', 'Adjectives & Adverbs'],
  },
  {
    id: 'modals-functions',
    label: 'Modals & functions',
    tags: ['Can / Could', 'Must / Have to / Should', 'Phrasal Verbs'],
  },
  {
    id: 'linking',
    label: 'Word order & linking',
    tags: ['Conjunctions & Linking Words', 'Prepositions', 'Pronouns & Possessives'],
  },
] as const;

export const GRAMMAR_TAGS = GRAMMAR_GROUPS.flatMap((group) => [...group.tags]);

export type GrammarTag = (typeof GRAMMAR_TAGS)[number];

export const VOCABULARY_FOCUS_OPTIONS = [
  'Mixed',
  'Nouns',
  'Verbs',
  'Adjectives',
  'Adverbs',
] as const;

export type VocabularyFocus = (typeof VOCABULARY_FOCUS_OPTIONS)[number];

export const SENTENCE_FORM_OPTIONS = [
  'Affirmative',
  'Negative',
  'Yes/No question',
  'Wh-question',
] as const;

export type SentenceForm = (typeof SENTENCE_FORM_OPTIONS)[number];

export const QUESTION_STYLE_OPTIONS = [
  'Choose the correct form',
  'Fill the gap',
  'Choose the right question',
  'Find the mistake',
  'Picture description',
  'Vocabulary meaning',
] as const;

export type QuestionStyle = (typeof QUESTION_STYLE_OPTIONS)[number];

export interface QuizTagCategory {
  category: string;
  description: string;
  tags: readonly string[];
  groups?: readonly { id: string; label: string; tags: readonly string[] }[];
  selectionMode?: 'single' | 'multiple';
}

/** Tags used for browse/create metadata. Word class is intentionally excluded. */
export const DISCOVERY_TAG_CATEGORIES: readonly QuizTagCategory[] = [
  {
    category: 'Level',
    description: 'Choose one language level.',
    tags: CEFR_LEVELS.map((level) => level.label),
    selectionMode: 'single',
  },
  {
    category: 'Topic',
    description: 'What is the quiz about?',
    tags: TOPIC_TAGS,
  },
  {
    category: 'Grammar',
    description: 'Which short language structure should students practise?',
    tags: GRAMMAR_TAGS,
    groups: GRAMMAR_GROUPS,
  },
] as const;

/** @deprecated Prefer DISCOVERY_TAG_CATEGORIES for browse/setup. */
export const QUIZ_TAG_CATEGORIES = DISCOVERY_TAG_CATEGORIES;

const LEVEL_LABEL_TO_ID = new Map(
  CEFR_LEVELS.map((level) => [level.label.toLowerCase(), level.id])
);

const LEGACY_TOPIC_ALIASES: Record<string, TopicTag[]> = {
  'clothes & body parts': ['Clothes', 'Body Parts'],
  'plants & food types': ['Food & Drink', 'Nature & Environment'],
  'stories & fairy tales': ['Stories & Fantasy'],
};

const LEGACY_GRAMMAR_ALIASES: Record<string, GrammarTag[]> = {
  nouns: [],
  verbs: [],
  adjectives: [],
  adverbs: [],
  'function words': [],
  'nouns & articles': ['Countable & Uncountable'],
  modals: ['Can / Could', 'Must / Have to / Should'],
  conditionals: ['First Conditional'],
  'questions & negatives': ['Questions & Negatives'],
};

export function normalizeCefrLevel(level: string): CefrLevelId | null {
  const normalized = level.trim().replace('-', '_').toUpperCase();
  if (CEFR_LEVELS.some((candidate) => candidate.id === normalized)) {
    return normalized as CefrLevelId;
  }
  return LEVEL_LABEL_TO_ID.get(level.trim().toLowerCase()) ?? null;
}

export function levelLabelFromId(level: CefrLevelId): string {
  return CEFR_LEVELS.find((candidate) => candidate.id === level)?.label ?? level;
}

export function levelFromTags(tags: string[]): CefrLevelId | null {
  for (const tag of tags) {
    const level = normalizeCefrLevel(tag);
    if (level) return level;
  }
  return null;
}

export function resolveTopicTags(tags: string[]): TopicTag[] {
  const resolved = new Set<TopicTag>();

  for (const tag of tags) {
    const exact = TOPIC_TAGS.find(
      (topic) => topic.toLowerCase() === tag.trim().toLowerCase()
    );
    if (exact) {
      resolved.add(exact);
      continue;
    }

    for (const alias of LEGACY_TOPIC_ALIASES[tag.trim().toLowerCase()] ?? []) {
      resolved.add(alias);
    }
  }

  return [...resolved];
}

export function resolveGrammarTags(tags: string[]): GrammarTag[] {
  const resolved = new Set<GrammarTag>();

  for (const tag of tags) {
    const exact = GRAMMAR_TAGS.find(
      (grammar) => grammar.toLowerCase() === tag.trim().toLowerCase()
    );
    if (exact) {
      resolved.add(exact);
      continue;
    }

    for (const alias of LEGACY_GRAMMAR_ALIASES[tag.trim().toLowerCase()] ?? []) {
      resolved.add(alias);
    }
  }

  return [...resolved];
}

export function isKnownQuizTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  if (normalizeCefrLevel(tag)) return true;
  return DISCOVERY_TAG_CATEGORIES.some((category) =>
    category.tags.some((candidate) => candidate.toLowerCase() === normalized)
  );
}

/**
 * Expand legacy labels onto current discovery tags while keeping unknown labels.
 * Used when editing older quizzes and when matching browse filters.
 */
export function normalizeDiscoveryTags(tags: string[]): string[] {
  const next = new Set<string>();

  for (const tag of tags) {
    const level = normalizeCefrLevel(tag);
    if (level) {
      next.add(levelLabelFromId(level));
      continue;
    }

    const topics = resolveTopicTags([tag]);
    const grammar = resolveGrammarTags([tag]);
    if (topics.length > 0 || grammar.length > 0) {
      for (const topic of topics) next.add(topic);
      for (const item of grammar) next.add(item);
      continue;
    }

    // Preserve unrecognized tags so teachers can still see/edit them.
    if (tag.trim()) next.add(tag.trim());
  }

  return [...next];
}

/** True when a quiz tag set satisfies one selected discovery filter tag. */
export function discoveryTagMatches(
  quizTags: string[],
  selectedTag: string
): boolean {
  const selected = selectedTag.trim().toLowerCase();
  const quizNormalized = normalizeDiscoveryTags(quizTags).map((tag) =>
    tag.toLowerCase()
  );
  const selectedNormalized = normalizeDiscoveryTags([selectedTag]).map((tag) =>
    tag.toLowerCase()
  );

  if (quizTags.some((tag) => tag.toLowerCase() === selected)) return true;
  return selectedNormalized.some((candidate) =>
    quizNormalized.includes(candidate)
  );
}

export function syncLevelIntoTags(
  tags: string[],
  level: CefrLevelId
): string[] {
  const withoutLevels = tags.filter((tag) => !normalizeCefrLevel(tag));
  return [levelLabelFromId(level), ...withoutLevels];
}

export function summarizeGenerationBrief(input: {
  level: CefrLevelId;
  topics: string[];
  grammarFocus: string[];
  sentenceForms: string[];
  questionStyles: string[];
  numberOfQuestions: number;
}): string {
  const level = levelLabelFromId(input.level);
  const topics =
    input.topics.length > 0 ? input.topics.join(', ') : 'a general theme';
  const grammar =
    input.grammarFocus.length > 0
      ? input.grammarFocus.join(', ')
      : 'short classroom language';
  const forms =
    input.sentenceForms.length > 0
      ? input.sentenceForms.join(' and ').toLowerCase()
      : 'mixed sentence forms';
  const styles =
    input.questionStyles.length > 0
      ? input.questionStyles.join(' and ').toLowerCase()
      : 'mixed question styles';

  return `Create ${input.numberOfQuestions} ${level} questions about ${topics}. Practise ${grammar}, using ${forms}. Prefer ${styles}.`;
}
