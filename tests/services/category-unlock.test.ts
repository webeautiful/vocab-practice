import { describe, it, expect } from 'vitest'
import { shouldUnlockNext } from '../../src/services/category-unlock'
import type { LearningRecord, Word } from '../../src/types'

function makeWords(categoryId: number, count: number): Word[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cat${categoryId}_word${i}`,
    english: `word${i}`,
    phonetic: '/test/',
    chinese: `词${i}`,
    emoji: '📝',
    category: `cat${categoryId}`,
    categoryId,
  }))
}

function makeRecords(categoryId: number, count: number, level: number): LearningRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    wordId: `cat${categoryId}_word${i}`,
    level,
    consecutiveCorrect: 1,
    nextReviewDate: '2026-05-02',
    totalAttempts: 1,
    totalCorrect: 1,
    mastered: false,
    lastPracticeDate: '2026-05-01',
  }))
}

describe('category-unlock', () => {
  it('unlocks next when 80% of words reach level 1+', () => {
    const words = makeWords(1, 10)
    const records = makeRecords(1, 8, 1)
    expect(shouldUnlockNext(words, records, 0.8)).toBe(true)
  })

  it('does not unlock when below threshold', () => {
    const words = makeWords(1, 10)
    const records = makeRecords(1, 7, 1)
    expect(shouldUnlockNext(words, records, 0.8)).toBe(false)
  })

  it('does not count level 0 records', () => {
    const words = makeWords(1, 10)
    const records = makeRecords(1, 10, 0)
    expect(shouldUnlockNext(words, records, 0.8)).toBe(false)
  })

  it('handles empty records', () => {
    const words = makeWords(1, 10)
    expect(shouldUnlockNext(words, [], 0.8)).toBe(false)
  })

  it('handles empty words', () => {
    expect(shouldUnlockNext([], [], 0.8)).toBe(true)
  })
})
