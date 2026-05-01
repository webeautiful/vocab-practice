import { db } from './index'
import type { LearningRecord } from '../types'

export async function getRecord(wordId: string): Promise<LearningRecord | undefined> {
  return db.learningRecords.get(wordId)
}

export async function upsertRecord(record: LearningRecord): Promise<void> {
  await db.learningRecords.put(record)
}

export async function getRecordsByCategory(categoryId: number): Promise<LearningRecord[]> {
  const prefix = `cat${categoryId}_`
  return db.learningRecords
    .filter(r => r.wordId.startsWith(prefix))
    .toArray()
}

export async function getDueReviewWords(today: string): Promise<LearningRecord[]> {
  return db.learningRecords
    .where('nextReviewDate')
    .belowOrEqual(today)
    .filter(r => !r.mastered)
    .toArray()
}

export async function getTodayPracticedCount(today: string): Promise<number> {
  return db.learningRecords
    .where('lastPracticeDate')
    .equals(today)
    .count()
}

export async function getAllRecords(): Promise<LearningRecord[]> {
  return db.learningRecords.toArray()
}
