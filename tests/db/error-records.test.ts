import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db'
import {
  getErrorRecord,
  addError,
  recordCorrectAnswer,
  getActiveErrors,
  getAllErrors,
} from '../../src/db/error-records'

beforeEach(async () => {
  await db.errorRecords.clear()
})

describe('error-records', () => {
  it('returns undefined for word with no errors', async () => {
    const r = await getErrorRecord('nonexistent')
    expect(r).toBeUndefined()
  })

  it('creates error record on first mistake', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    const r = await getErrorRecord('cat7_apple')
    expect(r).toBeDefined()
    expect(r!.errorCount).toBe(1)
    expect(r!.consecutiveCorrect).toBe(0)
    expect(r!.errors).toHaveLength(1)
    expect(r!.errors[0].mode).toBe('spell')
    expect(r!.errors[0].userAnswer).toBe('aple')
  })

  it('increments error count on repeated mistakes', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await addError('cat7_apple', 'choiceCnToEn', 'banana')
    const r = await getErrorRecord('cat7_apple')
    expect(r!.errorCount).toBe(2)
    expect(r!.errors).toHaveLength(2)
  })

  it('tracks consecutive correct answers', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await recordCorrectAnswer('cat7_apple')
    const r = await getErrorRecord('cat7_apple')
    expect(r!.consecutiveCorrect).toBe(1)
  })

  it('removes from active errors after 2 consecutive correct', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await recordCorrectAnswer('cat7_apple')
    await recordCorrectAnswer('cat7_apple')
    const active = await getActiveErrors()
    expect(active).toHaveLength(0)
  })

  it('resets consecutive correct on new error', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await recordCorrectAnswer('cat7_apple')
    await addError('cat7_apple', 'spell', 'appl')
    const r = await getErrorRecord('cat7_apple')
    expect(r!.consecutiveCorrect).toBe(0)
    expect(r!.errorCount).toBe(2)
  })

  it('getActiveErrors returns only words with consecutiveCorrect < 2 and errorCount >= 2', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await addError('cat7_apple', 'spell', 'appl')
    await addError('cat7_banana', 'spell', 'banan')
    const active = await getActiveErrors()
    expect(active).toHaveLength(1)
    expect(active[0].wordId).toBe('cat7_apple')
  })
})
