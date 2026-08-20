import { DISCOVERY_TAG_CATEGORIES } from '@/lib/taxonomy/quiz-taxonomy';

/**
 * Compatibility export for the existing tag picker.
 *
 * Discovery tags are Level + Topic + Grammar. Word Class is AI-only and lives
 * in the generation brief, not browse/create metadata.
 */
export const ALL_TAG_CATEGORIES = DISCOVERY_TAG_CATEGORIES.map((category) => ({
  category: category.category,
  tags: [...category.tags],
  groups: category.groups?.map((group) => ({
    id: group.id,
    label: group.label,
    tags: [...group.tags],
  })),
  selectionMode: category.selectionMode,
}));

export const FLATTENED_TAGS: string[] = ALL_TAG_CATEGORIES.flatMap(
  (category) => category.tags
);

/**
 * Pack tag groups into columns by tag count so the drawer stays visually even
 * as curriculum coverage grows.
 */
export function balanceTagGroupColumns<T extends { tags: readonly unknown[] }>(
  groups: readonly T[],
  columnCount: number
): T[][] {
  const count = Math.max(1, Math.floor(columnCount));
  const columns: T[][] = Array.from({ length: count }, () => []);
  const weights = Array.from({ length: count }, () => 0);

  for (const group of groups) {
    let lightest = 0;
    for (let index = 1; index < count; index++) {
      if (weights[index] < weights[lightest]) lightest = index;
    }
    columns[lightest].push(group);
    weights[lightest] += group.tags.length;
  }

  return columns;
}
