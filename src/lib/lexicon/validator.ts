import {
  entriesForForm,
  isAllowedAtLevel,
  lexiconMetadata,
} from '@/lib/lexicon/resolver';
import type {
  LanguageAudit,
  LanguageAuditIssue,
  LexiconEntry,
} from '@/lib/lexicon/types';
import type { CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy';

const TOKEN_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)?/g;
const ANSWER_MARKERS = new Set(['a', 'b', 'c', 'd']);

export interface AuditableQuestion {
  question: string;
  answers: string[];
  /** Only the stem + correct answer are audited; distractors are ignored. */
  correctAnswer: string;
}

function textsForAudit(question: AuditableQuestion): string[] {
  return [question.question, question.correctAnswer].filter(Boolean);
}

function tokenize(text: string): string[] {
  return (text.match(TOKEN_PATTERN) ?? []).map((token) =>
    token.replace('’', "'").toLowerCase()
  );
}

function suggestSimplerForm(
  word: string,
  entries: LexiconEntry[],
  targetLevel: CefrLevelId
): string | undefined {
  for (const entry of entries) {
    const candidates = entry.forms
      .map((form) => form.toLowerCase())
      .filter((form) => form !== word && isAllowedAtLevel(entry, targetLevel, form))
      .sort((a, b) => a.length - b.length);
    if (candidates.length > 0) {
      // Prefer the lemma when it is allowed at the target level.
      const lemma = entry.lemma.toLowerCase();
      if (candidates.includes(lemma)) return lemma;
      return candidates[0];
    }
  }
  return undefined;
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

    if (entries.some((entry) => isAllowedAtLevel(entry, targetLevel, word))) {
      continue;
    }

    const inScopeEntry = entries.find(
      (entry) =>
        (entry.formLevels[word] ?? entry.introducedAt) !== 'OUT_OF_SCOPE'
    );
    const detectedLevel = inScopeEntry
      ? inScopeEntry.formLevels[word] ?? inScopeEntry.introducedAt
      : 'OUT_OF_SCOPE';
    issues.push({
      word,
      reason: inScopeEntry ? 'above-level' : 'out-of-scope',
      detectedLevel,
      suggestion: suggestSimplerForm(word, entries, targetLevel),
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
    questions.flatMap((question) => textsForAudit(question)),
    targetLevel
  );
}

export function auditQuestion(
  question: AuditableQuestion,
  targetLevel: CefrLevelId
): LanguageAudit {
  return auditLanguage(textsForAudit(question), targetLevel);
}

export function filterIgnoredIssues(
  audit: LanguageAudit,
  keptWords: string[]
): LanguageAudit {
  const keep = new Set(keptWords.map((word) => word.toLowerCase()));
  const issues = audit.issues.filter((issue) => !keep.has(issue.word.toLowerCase()));
  return {
    ...audit,
    issues,
    valid: issues.length === 0,
  };
}
