import { describe, it, expect, beforeEach } from 'vitest'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../../src/stores/settings'

beforeEach(() => {
  localStorage.clear()
})

describe('settings', () => {
  it('returns defaults when nothing stored', () => {
    const s = getSettings()
    expect(s.dailyGoal).toBe(15)
    expect(s.choiceCount).toBe(4)
    expect(s.spellHint).toBe(false)
    expect(s.parentPassword).toBeNull()
    expect(s.unlockedCategories).toEqual([1])
    expect(s.unlockThreshold).toBe(0.8)
  })

  it('persists and retrieves updated settings', () => {
    updateSettings({ dailyGoal: 20, choiceCount: 3 })
    const s = getSettings()
    expect(s.dailyGoal).toBe(20)
    expect(s.choiceCount).toBe(3)
    expect(s.spellHint).toBe(false)
  })

  it('merges partial updates', () => {
    updateSettings({ dailyGoal: 25 })
    updateSettings({ spellHint: true })
    const s = getSettings()
    expect(s.dailyGoal).toBe(25)
    expect(s.spellHint).toBe(true)
  })
})
