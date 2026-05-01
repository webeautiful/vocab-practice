import { describe, it, expect } from 'vitest'
import {
  determineMode,
  generateDistractors,
  buildQuizQuestions,
  gradeAnswer,
} from '../../src/services/quiz-engine'
import type { Word, LearningRecord } from '../../src/types'

const apple: Word = { id: 'cat7_apple', english: 'apple', phonetic: '/ˈæpl/', chinese: '苹果', emoji: '🍎', category: '水果篇', categoryId: 7 }
const banana: Word = { id: 'cat7_banana', english: 'banana', phonetic: '/bəˈnɑːnə/', chinese: '香蕉', emoji: '🍌', category: '水果篇', categoryId: 7 }
const orange: Word = { id: 'cat7_orange', english: 'orange', phonetic: '/ˈɒrɪndʒ/', chinese: '橙子', emoji: '🍊', category: '水果篇', categoryId: 7 }
const pear: Word = { id: 'cat7_pear', english: 'pear', phonetic: '/peə/', chinese: '梨', emoji: '🍐', category: '水果篇', categoryId: 7 }
const grape: Word = { id: 'cat7_grape', english: 'grape', phonetic: '/ɡreɪp/', chinese: '葡萄', emoji: '🍇', category: '水果篇', categoryId: 7 }
const dog: Word = { id: 'cat10_dog', english: 'dog', phonetic: '/dɒɡ/', chinese: '狗', emoji: '🐕', category: '动物篇', categoryId: 10 }

const fruitWords = [apple, banana, orange, pear, grape]

describe('determineMode', () => {
  it('returns choiceCnToEn for level 0', () => {
    expect(determineMode(0)).toBe('choiceCnToEn')
  })
  it('returns choiceCnToEn for level 1', () => {
    expect(determineMode(1)).toBe('choiceCnToEn')
  })
  it('returns choiceEnToCn for level 2', () => {
    expect(determineMode(2)).toBe('choiceEnToCn')
  })
  it('returns choiceEnToCn for level 3', () => {
    expect(determineMode(3)).toBe('choiceEnToCn')
  })
  it('returns spell for level 4', () => {
    expect(determineMode(4)).toBe('spell')
  })
  it('returns spell for level 5', () => {
    expect(determineMode(5)).toBe('spell')
  })
})

describe('generateDistractors', () => {
  it('returns requested number of distractors', () => {
    const result = generateDistractors(apple, fruitWords, [], 3)
    expect(result).toHaveLength(3)
  })

  it('does not include the target word', () => {
    const result = generateDistractors(apple, fruitWords, [], 3)
    expect(result.find(w => w.id === apple.id)).toBeUndefined()
  })

  it('excludes mastered words', () => {
    const mastered = ['cat7_banana', 'cat7_orange', 'cat7_pear']
    const result = generateDistractors(apple, fruitWords, mastered, 3)
    const hasMastered = result.some(w => mastered.includes(w.id))
    expect(hasMastered).toBe(false)
  })

  it('falls back to other categories when same-category pool is too small', () => {
    const allWords = [...fruitWords, dog]
    const mastered = ['cat7_banana', 'cat7_orange', 'cat7_pear']
    const result = generateDistractors(apple, allWords, mastered, 3)
    expect(result).toHaveLength(3)
  })
})

describe('gradeAnswer', () => {
  it('grades correct choice', () => {
    expect(gradeAnswer('choiceCnToEn', 'apple', 'apple')).toBe(true)
  })
  it('grades incorrect choice', () => {
    expect(gradeAnswer('choiceCnToEn', 'banana', 'apple')).toBe(false)
  })
  it('grades spell case-insensitive', () => {
    expect(gradeAnswer('spell', 'Apple', 'apple')).toBe(true)
  })
  it('grades spell with trimmed spaces', () => {
    expect(gradeAnswer('spell', '  apple  ', 'apple')).toBe(true)
  })
  it('grades incorrect spell', () => {
    expect(gradeAnswer('spell', 'aple', 'apple')).toBe(false)
  })
})

describe('buildQuizQuestions', () => {
  it('returns up to requested count', () => {
    const records: LearningRecord[] = []
    const questions = buildQuizQuestions({
      allWords: fruitWords,
      categoryWords: fruitWords,
      dueReviewWords: [],
      activeErrorWordIds: [],
      records,
      count: 3,
      choiceCount: 4,
    })
    expect(questions.length).toBeLessThanOrEqual(3)
    expect(questions.length).toBeGreaterThan(0)
  })

  it('includes choices for choice modes', () => {
    const questions = buildQuizQuestions({
      allWords: fruitWords,
      categoryWords: fruitWords,
      dueReviewWords: [],
      activeErrorWordIds: [],
      records: [],
      count: 3,
      choiceCount: 4,
    })
    const choiceQ = questions.find(q => q.mode !== 'spell')
    if (choiceQ) {
      expect(choiceQ.choices).toBeDefined()
      expect(choiceQ.choices!.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('does not include choices for spell mode', () => {
    const records: LearningRecord[] = fruitWords.map(w => ({
      wordId: w.id, level: 4, consecutiveCorrect: 0,
      nextReviewDate: '2026-05-01', totalAttempts: 4, totalCorrect: 4,
      mastered: false, lastPracticeDate: '2026-05-01',
    }))
    const questions = buildQuizQuestions({
      allWords: fruitWords,
      categoryWords: fruitWords,
      dueReviewWords: fruitWords.map(w => records.find(r => r.wordId === w.id)!),
      activeErrorWordIds: [],
      records,
      count: 3,
      choiceCount: 4,
    })
    questions.forEach(q => {
      if (q.mode === 'spell') {
        expect(q.choices).toBeUndefined()
      }
    })
  })
})
