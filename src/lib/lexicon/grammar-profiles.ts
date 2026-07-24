import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy';

export interface GrammarProfile {
  tag: string;
  minimumLevel: CefrLevelId;
  wordClasses: string[];
  patterns: string[];
  questionStyles: string[];
  sentenceForms: string[];
}

export const GRAMMAR_PROFILES: readonly GrammarProfile[] = [
  {
    tag: 'Present Simple',
    minimumLevel: 'PRE_A1',
    wordClasses: ['verb'],
    patterns: ['subject + base verb', 'he/she/it + verb-s', 'do/does + subject + base verb'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Find the mistake'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question', 'Wh-question'],
  },
  {
    tag: 'Present Continuous',
    minimumLevel: 'A1',
    wordClasses: ['verb'],
    patterns: ['subject + am/is/are + verb-ing'],
    questionStyles: ['Picture description', 'Choose the correct form', 'Fill the gap'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question'],
  },
  {
    tag: 'Past Simple',
    minimumLevel: 'A1',
    wordClasses: ['verb'],
    patterns: ['subject + past form', 'did + subject + base verb'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Find the mistake'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question', 'Wh-question'],
  },
  {
    tag: 'Past Continuous',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + was/were + verb-ing'],
    questionStyles: ['Picture description', 'Choose the correct form', 'Fill the gap'],
    sentenceForms: ['Affirmative', 'Negative'],
  },
  {
    tag: 'Present Perfect',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + have/has + past participle'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Find the mistake'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question'],
  },
  {
    tag: 'Comparatives & Superlatives',
    minimumLevel: 'A1',
    wordClasses: ['adjective', 'adverb'],
    patterns: ['noun + be + comparative + than + noun', 'the + superlative + noun'],
    questionStyles: ['Picture description', 'Choose the correct form', 'Fill the gap'],
    sentenceForms: ['Affirmative'],
  },
  {
    tag: 'There is / There are',
    minimumLevel: 'PRE_A1',
    wordClasses: ['noun'],
    patterns: ['there is + singular noun', 'there are + plural noun'],
    questionStyles: ['Picture description', 'Fill the gap', 'Choose the correct form'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question'],
  },
  {
    tag: 'Can / Could',
    minimumLevel: 'PRE_A1',
    wordClasses: ['verb'],
    patterns: ['subject + can/cannot + base verb', 'can + subject + base verb'],
    questionStyles: ['Choose the correct form', 'Choose the right question', 'Fill the gap'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question'],
  },
  {
    tag: 'Questions & Negatives',
    minimumLevel: 'A1',
    wordClasses: ['verb'],
    patterns: ['question word + auxiliary + subject', 'subject + auxiliary + not + verb'],
    questionStyles: ['Choose the right question', 'Find the mistake', 'Fill the gap'],
    sentenceForms: ['Negative', 'Yes/No question', 'Wh-question'],
  },
  {
    tag: 'Countable & Uncountable',
    minimumLevel: 'A2',
    wordClasses: ['noun'],
    patterns: ['a/an + countable noun', 'some + plural or uncountable noun'],
    questionStyles: ['Choose the correct form', 'Vocabulary meaning', 'Fill the gap'],
    sentenceForms: ['Affirmative', 'Negative'],
  },
  {
    tag: 'Future with going to',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + am/is/are + going to + base verb'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Picture description'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question'],
  },
  {
    tag: 'First Conditional',
    minimumLevel: 'B1',
    wordClasses: ['verb'],
    patterns: ['if + present simple, will + base verb'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Find the mistake'],
    sentenceForms: ['Affirmative'],
  },
  {
    tag: 'Must / Have to / Should',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['subject + must/have to/should + base verb'],
    questionStyles: ['Choose the correct form', 'Choose the right question', 'Find the mistake'],
    sentenceForms: ['Affirmative', 'Negative'],
  },
  {
    tag: 'Adjectives & Adverbs',
    minimumLevel: 'A1',
    wordClasses: ['adjective', 'adverb'],
    patterns: ['be + adjective', 'verb + adverb'],
    questionStyles: ['Vocabulary meaning', 'Picture description', 'Choose the correct form'],
    sentenceForms: ['Affirmative'],
  },
  {
    tag: 'Prepositions',
    minimumLevel: 'PRE_A1',
    wordClasses: ['noun'],
    patterns: ['preposition + place/time noun'],
    questionStyles: ['Picture description', 'Fill the gap', 'Choose the correct form'],
    sentenceForms: ['Affirmative'],
  },
  {
    tag: 'Pronouns & Possessives',
    minimumLevel: 'PRE_A1',
    wordClasses: ['noun'],
    patterns: ['subject/object pronoun', 'possessive adjective + noun'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Find the mistake'],
    sentenceForms: ['Affirmative'],
  },
  {
    tag: 'Quantifiers',
    minimumLevel: 'A2',
    wordClasses: ['noun'],
    patterns: ['some/any/much/many + noun'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Vocabulary meaning'],
    sentenceForms: ['Affirmative', 'Negative', 'Yes/No question'],
  },
  {
    tag: 'Conjunctions & Linking Words',
    minimumLevel: 'A1',
    wordClasses: ['noun', 'verb'],
    patterns: ['clause + and/but/because + clause'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Find the mistake'],
    sentenceForms: ['Affirmative'],
  },
  {
    tag: 'Word Order',
    minimumLevel: 'A1',
    wordClasses: ['verb'],
    patterns: ['subject + verb + object', 'question word order'],
    questionStyles: ['Find the mistake', 'Choose the right question', 'Fill the gap'],
    sentenceForms: ['Affirmative', 'Yes/No question', 'Wh-question'],
  },
  {
    tag: 'Phrasal Verbs',
    minimumLevel: 'A2',
    wordClasses: ['verb'],
    patterns: ['verb + particle'],
    questionStyles: ['Vocabulary meaning', 'Choose the correct form', 'Fill the gap'],
    sentenceForms: ['Affirmative', 'Negative'],
  },
  {
    tag: 'Time Expressions',
    minimumLevel: 'A1',
    wordClasses: ['noun', 'adverb'],
    patterns: ['time expression with present/past/future'],
    questionStyles: ['Choose the correct form', 'Fill the gap', 'Picture description'],
    sentenceForms: ['Affirmative'],
  },
] as const;

export function profilesForTags(tags: string[]): GrammarProfile[] {
  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));
  return GRAMMAR_PROFILES.filter((profile) =>
    normalized.has(profile.tag.toLowerCase())
  );
}
