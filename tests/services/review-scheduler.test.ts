import { describe, it, expect } from 'vitest'
import { getNextReviewDate, REVIEW_INTERVALS } from '../../src/services/review-scheduler'

describe('review-scheduler', () => {
  it('level 0 returns same day', () => {
    expect(getNextReviewDate(0, '2026-05-01')).toBe('2026-05-01')
  })
  it('level 1 returns +1 day', () => {
    expect(getNextReviewDate(1, '2026-05-01')).toBe('2026-05-02')
  })
  it('level 2 returns +2 days', () => {
    expect(getNextReviewDate(2, '2026-05-01')).toBe('2026-05-03')
  })
  it('level 3 returns +4 days', () => {
    expect(getNextReviewDate(3, '2026-05-01')).toBe('2026-05-05')
  })
  it('level 4 returns +7 days', () => {
    expect(getNextReviewDate(4, '2026-05-01')).toBe('2026-05-08')
  })
  it('level 5 returns +15 days', () => {
    expect(getNextReviewDate(5, '2026-05-01')).toBe('2026-05-16')
  })
  it('mastered returns +30 days', () => {
    expect(getNextReviewDate(5, '2026-05-01', true)).toBe('2026-05-31')
  })
  it('handles month boundary', () => {
    expect(getNextReviewDate(4, '2026-05-28')).toBe('2026-06-04')
  })
})
