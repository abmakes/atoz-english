import type { CefrLevelId, TopicTag } from '@/lib/taxonomy/quiz-taxonomy';

export type LexiconLevel = CefrLevelId | 'OUT_OF_SCOPE';
export type LexiconPartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb';

export interface LexiconEntry {
  id: string;
  lemma: string;
  partsOfSpeech: LexiconPartOfSpeech[];
  forms: string[];
  formLevels: Record<string, LexiconLevel>;
  topics: TopicTag[];
  introducedAt: LexiconLevel;
  levelConfidence: number;
  levelMethod: string;
  reviewStatus: 'source-backed' | 'provisional';
  youngLearnerRelevant: boolean;
  senseCount: number;
  ranks: {
    ndl?: number;
    ngsl?: number;
  };
  sourceIds: string[];
}

export interface LexiconArtifact {
  metadata: {
    name: string;
    version: string;
    license: string;
    scope: CefrLevelId[];
    classificationNotice: string;
    sourceIds: string[];
    entryCount: number;
    levelCounts: Record<string, number>;
    topicCounts: Record<string, number>;
  };
  entries: LexiconEntry[];
}

export interface LexiconQuery {
  level: CefrLevelId;
  tags: string[];
  limit?: number;
  introducedAtLevelOnly?: boolean;
}

export interface LexiconSelection {
  level: CefrLevelId;
  topics: TopicTag[];
  requestedPartsOfSpeech: LexiconPartOfSpeech[];
  entries: LexiconEntry[];
  words: string[];
  grammarPatterns: string[];
  lexiconVersion: string;
}

export interface LanguageAuditIssue {
  word: string;
  reason: 'unknown' | 'above-level' | 'out-of-scope';
  detectedLevel?: LexiconLevel;
}

export interface LanguageAudit {
  valid: boolean;
  targetLevel: CefrLevelId;
  issues: LanguageAuditIssue[];
  checkedWords: string[];
  lexiconVersion: string;
}
