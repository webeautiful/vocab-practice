import Dexie, { type Table } from 'dexie'
import type { LearningRecord, ErrorRecord } from '../types'

class VocabDatabase extends Dexie {
  learningRecords!: Table<LearningRecord, string>
  errorRecords!: Table<ErrorRecord, string>

  constructor() {
    super('vocab-practice')
    this.version(1).stores({
      learningRecords: 'wordId, nextReviewDate, lastPracticeDate, mastered',
      errorRecords: 'wordId, errorCount, lastErrorDate',
    })
  }
}

export const db = new VocabDatabase()
