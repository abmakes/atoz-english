import lexiconJson from '@/generated/young-learner-lexicon.json';
import { profilesForTags } from '@/lib/lexicon/grammar-profiles';
import type {
  LexiconArtifact,
  LexiconEntry,
  LexiconPartOfSpeech,
  LexiconQuery,
  LexiconSelection,
} from '@/lib/lexicon/types';
import {
  type CefrLevelId,
  resolveTopicTags,
} from '@/lib/taxonomy/quiz-taxonomy';

const artifact = lexiconJson as unknown as LexiconArtifact;
const LEVEL_RANK: Record<CefrLevelId, number> = {
  PRE_A1: 0,
  A1: 1,
  A2: 2,
  B1: 3,
};

const POS_TAGS: Record<string, LexiconPartOfSpeech[]> = {
  nouns: ['noun'],
  verbs: ['verb'],
  adjectives: ['adjective'],
  adverbs: ['adverb'],
  'adjectives & adverbs': ['adjective', 'adverb'],
  'nouns & articles': ['noun'],
};

const FUNCTION_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'can',
  'do',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'i',
  'in',
  'is',
  'it',
  'its',
  'me',
  'my',
  'not',
  'of',
  'on',
  'or',
  'our',
  'she',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'you',
  'your',
]);

const entriesByForm = new Map<string, LexiconEntry[]>();
for (const entry of artifact.entries) {
  for (const form of entry.forms) {
    const normalized = normalizeSurface(form);
    const existing = entriesByForm.get(normalized) ?? [];
    existing.push(entry);
    entriesByForm.set(normalized, existing);
  }
}

function normalizeSurface(value: string): string {
  return value.trim().replace(/[’]/g, "'").toLowerCase();
}

function requestedPartsOfSpeech(tags: string[]): LexiconPartOfSpeech[] {
  const requested = new Set<LexiconPartOfSpeech>();

  for (const tag of tags) {
    for (const pos of POS_TAGS[tag.trim().toLowerCase()] ?? []) {
      requested.add(pos);
    }
  }

  for (const profile of profilesForTags(tags)) {
    for (const wordClass of profile.wordClasses) {
      if (
        wordClass === 'noun' ||
        wordClass === 'verb' ||
        wordClass === 'adjective' ||
        wordClass === 'adverb'
      ) {
        requested.add(wordClass);
      }
    }
  }

  return [...requested];
}

function rankForLevel(level: string): number {
  return level in LEVEL_RANK
    ? LEVEL_RANK[level as CefrLevelId]
    : Number.POSITIVE_INFINITY;
}

function entryScore(entry: LexiconEntry, topicCount: number): number {
  const sourceRank = entry.ranks.ndl ?? entry.ranks.ngsl ?? 9999;
  return (
    topicCount * 10_000 +
    (entry.youngLearnerRelevant ? 1_000 : 0) +
    entry.levelConfidence * 100 -
    sourceRank / 100
  );
}

export function resolveLexicon(query: LexiconQuery): LexiconSelection {
  const topics = resolveTopicTags(query.tags);
  const partsOfSpeech = requestedPartsOfSpeech(query.tags);
  const targetRank = LEVEL_RANK[query.level];
  const limit = Math.min(Math.max(query.limit ?? 80, 1), 250);
  const wantsFunctionWords = query.tags.some(
    (tag) => tag.trim().toLowerCase() === 'function words'
  );
  const profiles = profilesForTags(query.tags);

  const candidates = artifact.entries
    .filter((entry) => {
      const entryRank = rankForLevel(entry.introducedAt);
      const levelMatches = query.introducedAtLevelOnly
        ? entryRank === targetRank
        : entryRank <= targetRank;
      if (!levelMatches) return false;

      if (
        topics.length > 0 &&
        !entry.topics.some((topic) => topics.includes(topic))
      ) {
        return false;
      }

      if (
        partsOfSpeech.length > 0 &&
        !entry.partsOfSpeech.some((pos) => partsOfSpeech.includes(pos))
      ) {
        return false;
      }

      if (wantsFunctionWords && !FUNCTION_WORDS.has(entry.lemma)) {
        return false;
      }

      return true;
    })
    .map((entry) => ({
      entry,
      score: entryScore(
        entry,
        entry.topics.filter((topic) => topics.includes(topic)).length
      ),
    }))
    .sort((a, b) => b.score - a.score || a.entry.lemma.localeCompare(b.entry.lemma))
    .slice(0, limit)
    .map(({ entry }) => entry);

  return {
    level: query.level,
    topics,
    requestedPartsOfSpeech: partsOfSpeech,
    entries: candidates,
    words: candidates.map((entry) => entry.lemma),
    grammarPatterns: profiles.flatMap((profile) => profile.patterns),
    lexiconVersion: artifact.metadata.version,
  };
}

export function entriesForForm(form: string): LexiconEntry[] {
  return entriesByForm.get(normalizeSurface(form)) ?? [];
}

export function isAllowedAtLevel(
  entry: LexiconEntry,
  level: CefrLevelId
): boolean {
  return rankForLevel(entry.introducedAt) <= LEVEL_RANK[level];
}

export function lexiconMetadata(): LexiconArtifact['metadata'] {
  return artifact.metadata;
}
