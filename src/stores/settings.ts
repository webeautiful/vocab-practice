import type { UserSettings } from '../types'

const STORAGE_KEY = 'vocab-practice-settings'

export const DEFAULT_SETTINGS: UserSettings = {
  parentPassword: null,
  dailyGoal: 15,
  unlockedCategories: [1],
  choiceCount: 4,
  spellHint: false,
  unlockThreshold: 0.8,
}

export function getSettings(): UserSettings {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
}

export function updateSettings(partial: Partial<UserSettings>): void {
  const current = getSettings()
  const updated = { ...current, ...partial }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
