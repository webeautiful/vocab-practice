import type { Word, LearningRecord, Question, QuestionMode } from '../types'

export function determineMode(level: number): QuestionMode {
  if (level <= 1) return 'choiceCnToEn'
  if (level <= 3) return 'choiceEnToCn'
  return 'spell'
}

export function generateDistractors(
  target: Word,
  allWords: Word[],
  masteredIds: string[],
  count: number,
): Word[] {
  const masteredSet = new Set(masteredIds)
  const sameCatNonMastered = allWords.filter(w => w.categoryId === target.categoryId && w.id !== target.id && !masteredSet.has(w.id))
  const otherCat = allWords.filter(w => w.categoryId !== target.categoryId && w.id !== target.id)
  const preferredPool = [...shuffle(sameCatNonMastered), ...shuffle(otherCat)]
  if (preferredPool.length >= count || otherCat.length === 0) {
    // Either we have enough preferred words, or there are no other-category words to fall back to
    return preferredPool.slice(0, count)
  }
  // We crossed into other categories — pad with mastered same-category words if still short
  const masteredSameCat = allWords.filter(w => w.categoryId === target.categoryId && w.id !== target.id && masteredSet.has(w.id))
  const fullPool = [...preferredPool, ...shuffle(masteredSameCat)]
  return fullPool.slice(0, count)
}

export function gradeAnswer(mode: QuestionMode, userAnswer: string, correctAnswer: string): boolean {
  if (mode === 'spell') {
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  }
  return userAnswer === correctAnswer
}

interface BuildQuizParams {
  allWords: Word[]
  categoryWords: Word[]
  dueReviewWords: LearningRecord[]
  activeErrorWordIds: string[]
  records: LearningRecord[]
  count: number
  choiceCount: number
}

export function buildQuizQuestions(params: BuildQuizParams): Question[] {
  const { allWords, categoryWords, dueReviewWords, activeErrorWordIds, records, count, choiceCount } = params
  const wordMap = new Map(allWords.map(w => [w.id, w]))
  const recordMap = new Map(records.map(r => [r.wordId, r]))
  const masteredIds = records.filter(r => r.mastered).map(r => r.wordId)

  const selected: Word[] = []
  const usedIds = new Set<string>()

  const targetDue = Math.min(Math.ceil(count * 0.4), dueReviewWords.length)
  const dueWords = shuffle(dueReviewWords).slice(0, targetDue)
  for (const r of dueWords) {
    const w = wordMap.get(r.wordId)
    if (w && !usedIds.has(w.id)) {
      selected.push(w)
      usedIds.add(w.id)
    }
  }

  const targetError = Math.min(Math.ceil(count * 0.3), activeErrorWordIds.length)
  const errorWords = shuffle(activeErrorWordIds).slice(0, targetError)
  for (const id of errorWords) {
    const w = wordMap.get(id)
    if (w && !usedIds.has(w.id)) {
      selected.push(w)
      usedIds.add(w.id)
    }
  }

  const newWords = shuffle(categoryWords.filter(w => !usedIds.has(w.id) && !recordMap.has(w.id)))
  for (const w of newWords) {
    if (selected.length >= count) break
    selected.push(w)
    usedIds.add(w.id)
  }

  const remaining = shuffle(categoryWords.filter(w => !usedIds.has(w.id)))
  for (const w of remaining) {
    if (selected.length >= count) break
    selected.push(w)
    usedIds.add(w.id)
  }

  return shuffle(selected).map(word => {
    const record = recordMap.get(word.id)
    const level = record?.level ?? 0
    const mode = determineMode(level)

    if (mode === 'spell') {
      return { word, mode }
    }

    const distractorCount = choiceCount - 1
    const distractors = generateDistractors(word, allWords, masteredIds, distractorCount)
    const choices = shuffle([word, ...distractors])
    return { word, mode, choices }
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
