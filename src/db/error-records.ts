import { db } from './index'
import type { ErrorRecord, QuestionMode } from '../types'

export async function getErrorRecord(wordId: string): Promise<ErrorRecord | undefined> {
  return db.errorRecords.get(wordId)
}

export async function addError(wordId: string, mode: QuestionMode, userAnswer: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const existing = await db.errorRecords.get(wordId)

  if (existing) {
    existing.errorCount += 1
    existing.consecutiveCorrect = 0
    existing.lastErrorDate = today
    existing.errors.push({ date: today, mode, userAnswer })
    await db.errorRecords.put(existing)
  } else {
    await db.errorRecords.put({
      wordId,
      errorCount: 1,
      consecutiveCorrect: 0,
      lastErrorDate: today,
      errors: [{ date: today, mode, userAnswer }],
    })
  }
}

export async function recordCorrectAnswer(wordId: string): Promise<void> {
  const existing = await db.errorRecords.get(wordId)
  if (!existing) return
  existing.consecutiveCorrect += 1
  await db.errorRecords.put(existing)
}

export async function getActiveErrors(): Promise<ErrorRecord[]> {
  return db.errorRecords
    .filter(r => r.errorCount >= 2 && r.consecutiveCorrect < 2)
    .toArray()
}

export async function getAllErrors(): Promise<ErrorRecord[]> {
  return db.errorRecords.toArray()
}
