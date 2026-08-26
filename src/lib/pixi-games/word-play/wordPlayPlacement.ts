/**
 * Returns the first answer slot without a tile, preserving visual slot order.
 * Used by tap-to-auto-fill; drag-and-drop can still target any slot directly.
 */
export function findFirstEmptySlotId(
  orderedSlotIds: readonly string[],
  occupiedSlotIds: ReadonlySet<string>
): string | null {
  return orderedSlotIds.find((slotId) => !occupiedSlotIds.has(slotId)) ?? null
}
