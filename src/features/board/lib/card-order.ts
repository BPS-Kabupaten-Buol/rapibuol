export function parseBoardCardOrder(value: string | null): number[] {
  try {
    const ids: unknown = JSON.parse(value ?? '[]')
    if (
      !Array.isArray(ids) ||
      !ids.every((id) => Number.isSafeInteger(id) && id > 0)
    ) {
      return []
    }
    return [...new Set(ids)]
  } catch {
    return []
  }
}

export function moveBoardCard(
  order: readonly number[],
  activityId: number,
  beforeId: number | null
): number[] {
  if (beforeId === activityId) return [...order]

  const next = order.filter((id) => id !== activityId)
  const index = beforeId === null ? -1 : next.indexOf(beforeId)
  next.splice(index < 0 ? next.length : index, 0, activityId)
  return next
}
