export interface Word {
  id: string
  english: string
  phonetic: string
  chinese: string
  emoji: string
  category: string
  categoryId: number
}

export interface Category {
  id: number
  name: string
}

export interface WordBank {
  categories: Category[]
  words: Word[]
}

export interface LearningRecord {
  wordId: string
  level: number
  consecutiveCorrect: number
  nextReviewDate: string
  totalAttempts: number
  totalCorrect: number
  mastered: boolean
  lastPracticeDate: string
}

export interface ErrorEntry {
  date: string
  mode: 'choiceCnToEn' | 'choiceEnToCn' | 'spell'
  userAnswer: string
}

export interface ErrorRecord {
  wordId: string
  errorCount: number
  consecutiveCorrect: number
  lastErrorDate: string
  errors: ErrorEntry[]
}

export interface UserSettings {
  parentPassword: string | null
  dailyGoal: number
  unlockedCategories: number[]
  choiceCount: 3 | 4
  spellHint: boolean
  unlockThreshold: number
}

export type QuestionMode = 'choiceCnToEn' | 'choiceEnToCn' | 'spell'

export interface Question {
  word: Word
  mode: QuestionMode
  choices?: Word[]
}

export interface AnswerResult {
  wordId: string
  mode: QuestionMode
  correct: boolean
  userAnswer: string
  correctAnswer: string
}
