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
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

export const WORD_CLASS_TAGS = [
  'Nouns',
  'Verbs',
  'Adjectives',
  'Adverbs',
  'Function Words',
] as const;

export const GRAMMAR_TAGS = [
  'Nouns & Articles',
  'Pronouns & Possessives',
  'Adjectives & Adverbs',
  'Prepositions',
  'Present Simple',
  'Present Continuous',
  'Past Simple',
  'Past Continuous',
  'Present Perfect',
  'Questions & Negatives',
  'There is / There are',
  'Can / Could',
  'Must / Have to / Should',
  'Comparatives & Superlatives',
  'Countable & Uncountable',
  'Quantifiers',
  'Conjunctions & Linking Words',
  'Future with going to',
  'First Conditional',
  'Gerunds & Infinitives',
  'Phrasal Verbs',
  'Word Order',
  'Time Expressions',
] as const;

export interface QuizTagCategory {
  category: string;
  description: string;
  tags: readonly string[];
}

export const QUIZ_TAG_CATEGORIES: readonly QuizTagCategory[] = [
  {
    category: 'Level',
    description: 'Choose one language level.',
    tags: CEFR_LEVELS.map((level) => level.label),
  },
  {
    category: 'Topic',
    description: 'What is the quiz about?',
    tags: TOPIC_TAGS,
  },
  {
    category: 'Word Class',
    description: 'Which kinds of words should students practise?',
    tags: WORD_CLASS_TAGS,
  },
  {
    category: 'Grammar',
    description: 'Which short language structure should students practise?',
    tags: GRAMMAR_TAGS,
  },
] as const;

const LEVEL_LABEL_TO_ID = new Map(
  CEFR_LEVELS.map((level) => [level.label.toLowerCase(), level.id])
);

const LEGACY_TOPIC_ALIASES: Record<string, TopicTag[]> = {
  'clothes & body parts': ['Clothes', 'Body Parts'],
  'plants & food types': ['Food & Drink', 'Nature & Environment'],
  'stories & fairy tales': ['Stories & Fantasy'],
};

export function normalizeCefrLevel(level: string): CefrLevelId | null {
  const normalized = level.trim().replace('-', '_').toUpperCase();
  if (CEFR_LEVELS.some((candidate) => candidate.id === normalized)) {
    return normalized as CefrLevelId;
  }
  return LEVEL_LABEL_TO_ID.get(level.trim().toLowerCase()) ?? null;
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

export function isKnownQuizTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  return QUIZ_TAG_CATEGORIES.some((category) =>
    category.tags.some((candidate) => candidate.toLowerCase() === normalized)
  );
}
