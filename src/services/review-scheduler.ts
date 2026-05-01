export const REVIEW_INTERVALS: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 15,
}

const MASTERED_INTERVAL = 30

export function getNextReviewDate(level: number, today: string, mastered = false): string {
  const days = mastered ? MASTERED_INTERVAL : (REVIEW_INTERVALS[level] ?? 0)
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
