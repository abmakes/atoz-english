import { describe, expect, it } from 'vitest'
import { balanceTagGroupColumns } from '@/lib/tags'
import { GRAMMAR_GROUPS } from '@/lib/taxonomy/quiz-taxonomy'

describe('balanceTagGroupColumns', () => {
  it('packs grammar groups into even columns by tag count', () => {
    const columns = balanceTagGroupColumns(GRAMMAR_GROUPS, 2)
    const weights = columns.map((column) =>
      column.reduce((sum, group) => sum + group.tags.length, 0)
    )

    expect(columns).toHaveLength(2)
    expect(columns.flat().map((group) => group.id).sort()).toEqual(
      [...GRAMMAR_GROUPS.map((group) => group.id)].sort()
    )
    expect(Math.abs(weights[0] - weights[1])).toBeLessThanOrEqual(4)
  })

  it('keeps a single column when only one is requested', () => {
    const columns = balanceTagGroupColumns(
      [
        { id: 'a', tags: ['one'] },
        { id: 'b', tags: ['two', 'three'] },
      ],
      1
    )

    expect(columns).toEqual([
      [
        { id: 'a', tags: ['one'] },
        { id: 'b', tags: ['two', 'three'] },
      ],
    ])
  })

  it('falls back to one column for invalid column counts', () => {
    expect(balanceTagGroupColumns([{ id: 'a', tags: ['one'] }], 0)).toEqual([
      [{ id: 'a', tags: ['one'] }],
    ])
    expect(balanceTagGroupColumns([], 2)).toEqual([[], []])
  })
})
