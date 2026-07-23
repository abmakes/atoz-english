import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy';

export interface GrammarProfile {
  tag: string;
  minimumLevel: CefrLevelId;
  wordClasses: string[];
  patterns: string[];
  questionStyles: string[];
}

export const GRAMMAR_PROFILES: readonly GrammarProfile[] = [
  {
    tag: 'Present Simple',
    minimumLevel: 'PRE_A1',
    wordClasses: ['verb'],
    patterns: ['subject + base verb', 'he/she/it + verb-s', 'do/does + subject + base verb'],
    questionStyles: ['choose the correct form', 'complete the short sentence', 'find the mistake'],
  },
  {
    tag: 'Present Continuous',
    minimumLevel: 'A1',
    wordClasses: ['verb'],
    patterns: ['subject + am/is/are + verb-ing'],
    questionStyles: ['match an action to a picture', 'choose the -ing form', 'complete the sentence'],
  },
  {
    tag: 'Past Simple',
    minimumLevel: 'A1',
    wordClasses: ['verb'],
    patterns: ['subject + past form', 'did + subject + base verb'],
    questionStyles: ['choose the past form', 'complete the short story', 'find the incorrect verb'],
  },
  {
    tag: 'Past Continuous',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + was/were + verb-ing'],
    questionStyles: ['choose what was happening', 'complete the scene', 'contrast two actions'],
  },
  {
    tag: 'Present Perfect',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + have/has + past participle'],
    questionStyles: ['choose the participle', 'complete an experience sentence', 'choose have or has'],
  },
  {
    tag: 'Comparatives & Superlatives',
    minimumLevel: 'A1',
    wordClasses: ['adjective', 'adverb'],
    patterns: ['noun + be + comparative + than + noun', 'the + superlative + noun'],
    questionStyles: ['compare two pictures', 'choose comparative or superlative', 'complete the description'],
  },
  {
    tag: 'There is / There are',
    minimumLevel: 'PRE_A1',
    wordClasses: ['noun'],
    patterns: ['there is + singular noun', 'there are + plural noun'],
    questionStyles: ['describe a picture', 'choose is or are', 'count and complete'],
  },
  {
    tag: 'Can / Could',
    minimumLevel: 'PRE_A1',
    wordClasses: ['verb'],
    patterns: ['subject + can/cannot + base verb', 'can + subject + base verb'],
    questionStyles: ['choose an ability', 'complete the question', 'choose can or cannot'],
  },
  {
    tag: 'Questions & Negatives',
    minimumLevel: 'A1',
    wordClasses: ['verb', 'pronoun'],
    patterns: ['question word + auxiliary + subject', 'subject + auxiliary + not + verb'],
    questionStyles: ['put words in order', 'choose the question word', 'make the sentence negative'],
  },
  {
    tag: 'Countable & Uncountable',
    minimumLevel: 'A2',
    wordClasses: ['noun'],
    patterns: ['a/an + countable noun', 'some + plural or uncountable noun'],
    questionStyles: ['choose a/an/some', 'sort the nouns', 'complete a shopping sentence'],
  },
  {
    tag: 'Future with going to',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + am/is/are + going to + base verb'],
    questionStyles: ['choose a plan', 'complete the future sentence', 'match plan and picture'],
  },
  {
    tag: 'First Conditional',
    minimumLevel: 'B1',
    wordClasses: ['verb'],
    patterns: ['if + present simple, will + base verb'],
    questionStyles: ['match condition and result', 'choose the correct verb', 'complete the consequence'],
  },
] as const;

export function profilesForTags(tags: string[]): GrammarProfile[] {
  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));
  return GRAMMAR_PROFILES.filter((profile) =>
    normalized.has(profile.tag.toLowerCase())
  );
}
