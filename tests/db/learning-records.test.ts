import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db'
import {
  getRecord,
  upsertRecord,
  getRecordsByCategory,
  getDueReviewWords,
  getTodayPracticedCount,
  getAllRecords,
} from '../../src/db/learning-records'

beforeEach(async () => {
  await db.learningRecords.clear()
})

describe('learning-records', () => {
  it('returns undefined for unknown word', async () => {
    const r = await getRecord('nonexistent')
    expect(r).toBeUndefined()
  })

  it('creates and retrieves a record', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1,
      consecutiveCorrect: 1,
      nextReviewDate: '2026-05-02',
      totalAttempts: 1,
      totalCorrect: 1,
      mastered: false,
      lastPracticeDate: '2026-05-01',
    })
    const r = await getRecord('cat1_big')
    expect(r).toBeDefined()
    expect(r!.level).toBe(1)
    expect(r!.wordId).toBe('cat1_big')
  })

  it('updates an existing record', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1,
      consecutiveCorrect: 1,
      nextReviewDate: '2026-05-02',
      totalAttempts: 1,
      totalCorrect: 1,
      mastered: false,
      lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat1_big',
      level: 2,
      consecutiveCorrect: 2,
      nextReviewDate: '2026-05-03',
      totalAttempts: 2,
      totalCorrect: 2,
      mastered: false,
      lastPracticeDate: '2026-05-01',
    })
    const r = await getRecord('cat1_big')
    expect(r!.level).toBe(2)
  })

  it('gets records by category prefix', async () => {
    await upsertRecord({
      wordId: 'cat7_apple',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat7_banana',
      level: 0, consecutiveCorrect: 0, nextReviewDate: '2026-05-01',
      totalAttempts: 0, totalCorrect: 0, mastered: false, lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat8_tomato',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-05-01',
    })
    const records = await getRecordsByCategory(7)
    expect(records).toHaveLength(2)
  })

  it('gets due review words', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-04-30',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-04-29',
    })
    await upsertRecord({
      wordId: 'cat1_small',
      level: 2, consecutiveCorrect: 2, nextReviewDate: '2026-12-31',
      totalAttempts: 2, totalCorrect: 2, mastered: false, lastPracticeDate: '2026-05-01',
    })
    const due = await getDueReviewWords('2026-05-01')
    expect(due).toHaveLength(1)
    expect(due[0].wordId).toBe('cat1_big')
  })

  it('counts today practiced words', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat1_small',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-04-30',
    })
    const count = await getTodayPracticedCount('2026-05-01')
    expect(count).toBe(1)
  })
})
