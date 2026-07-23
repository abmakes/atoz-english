import {
  entriesForForm,
  isAllowedAtLevel,
  lexiconMetadata,
} from '@/lib/lexicon/resolver';
import type {
  LanguageAudit,
  LanguageAuditIssue,
} from '@/lib/lexicon/types';
import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy';

const TOKEN_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)?/g;
const ANSWER_MARKERS = new Set(['a', 'b', 'c', 'd']);

export interface AuditableQuestion {
  question: string;
  answers: string[];
}

function tokenize(text: string): string[] {
  return (text.match(TOKEN_PATTERN) ?? []).map((token) =>
    token.replace('’', "'").toLowerCase()
  );
}

export function auditLanguage(
  texts: string[],
  targetLevel: CefrLevelId
): LanguageAudit {
  const words = [...new Set(texts.flatMap(tokenize))];
  const issues: LanguageAuditIssue[] = [];

  for (const word of words) {
    if (ANSWER_MARKERS.has(word)) continue;

    const entries = entriesForForm(word);
    if (entries.length === 0) {
      issues.push({ word, reason: 'unknown' });
      continue;
    }

    if (entries.some((entry) => isAllowedAtLevel(entry, targetLevel))) {
      continue;
    }

    const inScopeEntry = entries.find(
      (entry) => entry.introducedAt !== 'OUT_OF_SCOPE'
    );
    issues.push({
      word,
      reason: inScopeEntry ? 'above-level' : 'out-of-scope',
      detectedLevel: inScopeEntry?.introducedAt ?? 'OUT_OF_SCOPE',
    });
  }

  return {
    valid: issues.length === 0,
    targetLevel,
    issues,
    checkedWords: words,
    lexiconVersion: lexiconMetadata().version,
  };
}

export function auditQuestions(
  questions: AuditableQuestion[],
  targetLevel: CefrLevelId
): LanguageAudit {
  return auditLanguage(
    questions.flatMap((question) => [question.question, ...question.answers]),
    targetLevel
  );
}
