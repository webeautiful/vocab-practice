import type { Word, LearningRecord } from '../types'

export function shouldUnlockNext(
  categoryWords: Word[],
  records: LearningRecord[],
  threshold: number,
): boolean {
  if (categoryWords.length === 0) return true
  const qualifiedCount = records.filter(r => r.level >= 1).length
  return qualifiedCount / categoryWords.length >= threshold
}
