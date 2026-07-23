import { QUIZ_TAG_CATEGORIES } from '@/lib/taxonomy/quiz-taxonomy';

/**
 * Compatibility export for the existing tag picker.
 *
 * The taxonomy is defined in `quiz-taxonomy.ts`; this module remains so older
 * imports do not need to change at once. Existing free-form quiz tags continue
 * to display, while new selections use the smaller Pre-A1–B1 taxonomy.
 */
export const ALL_TAG_CATEGORIES = QUIZ_TAG_CATEGORIES.map((category) => ({
  category: category.category,
  tags: [...category.tags],
}));

export const FLATTENED_TAGS: string[] = ALL_TAG_CATEGORIES.flatMap(
  (category) => category.tags
);