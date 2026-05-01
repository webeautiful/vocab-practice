import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import ChoiceQuestion from '../components/ChoiceQuestion'
import SpellQuestion from '../components/SpellQuestion'
import wordBank from '../data/words.json'
import { buildQuizQuestions } from '../services/quiz-engine'
import { getNextReviewDate } from '../services/review-scheduler'
import { getRecordsByCategory, getDueReviewWords, upsertRecord, getRecord } from '../db/learning-records'
import { addError, recordCorrectAnswer, getActiveErrors } from '../db/error-records'
import { getSettings } from '../stores/settings'
import { useSound } from '../hooks/use-sound'
import type { Word, Question, AnswerResult } from '../types'

const allWords = wordBank.words as Word[]

export default function PracticePage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const catId = Number(categoryId)
  const { play: playCorrect } = useSound('/correct.mp3')

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [loading, setLoading] = useState(true)
  const startTime = useRef(Date.now())

  useEffect(() => {
    async function load() {
      const settings = getSettings()
      const categoryWords = allWords.filter(w => w.categoryId === catId)
      const today = new Date().toISOString().slice(0, 10)
      const records = await getRecordsByCategory(catId)
      const dueReview = await getDueReviewWords(today)
      const activeErrors = await getActiveErrors()

      const qs = buildQuizQuestions({
        allWords,
        categoryWords,
        dueReviewWords: dueReview,
        activeErrorWordIds: activeErrors.map(e => e.wordId),
        records,
        count: settings.dailyGoal,
        choiceCount: settings.choiceCount,
      })

      setQuestions(qs)
      setLoading(false)
    }
    load()
  }, [catId])

  async function handleAnswer(userAnswer: string, correct: boolean) {
    const q = questions[currentIndex]
    const today = new Date().toISOString().slice(0, 10)

    const result: AnswerResult = {
      wordId: q.word.id,
      mode: q.mode,
      correct,
      userAnswer,
      correctAnswer: q.mode === 'choiceEnToCn' ? q.word.chinese : q.word.english,
    }
    setResults(prev => [...prev, result])

    if (correct) {
      playCorrect()
    }

    const existing = await getRecord(q.word.id)
    const oldLevel = existing?.level ?? 0
    const oldConsecutive = existing?.consecutiveCorrect ?? 0

    let newLevel: number
    let newConsecutive: number
    let mastered: boolean

    if (correct) {
      newLevel = Math.min(5, oldLevel + 1)
      newConsecutive = oldConsecutive + 1
      mastered = newLevel === 5 && newConsecutive >= 3
      await recordCorrectAnswer(q.word.id)
    } else {
      newLevel = Math.max(0, oldLevel - 1)
      newConsecutive = 0
      mastered = false
      await addError(q.word.id, q.mode, userAnswer)
    }

    const nextReview = getNextReviewDate(newLevel, today, mastered)

    await upsertRecord({
      wordId: q.word.id,
      level: newLevel,
      consecutiveCorrect: newConsecutive,
      nextReviewDate: nextReview,
      totalAttempts: (existing?.totalAttempts ?? 0) + 1,
      totalCorrect: (existing?.totalCorrect ?? 0) + (correct ? 1 : 0),
      mastered,
      lastPracticeDate: today,
    })

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      const elapsed = Math.round((Date.now() - startTime.current) / 60000)
      navigate('/result', {
        state: {
          results: [...results, result],
          elapsed,
          categoryId: catId,
        },
      })
    }
  }

  if (loading) {
    return <Layout title="加载中..."><div /></Layout>
  }

  if (questions.length === 0) {
    return (
      <Layout title="练习" onBack={() => navigate('/categories')}>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">暂无可练习的单词</p>
        </div>
      </Layout>
    )
  }

  const q = questions[currentIndex]
  const settings = getSettings()

  return (
    <Layout title="练习" onBack={() => navigate('/categories')}>
      <div className="space-y-4">
        <ProgressBar current={currentIndex + 1} total={questions.length} />
        <div className="text-sm text-gray-500 text-center">
          {currentIndex + 1} / {questions.length}
        </div>

        {q.mode === 'spell' ? (
          <SpellQuestion
            key={q.word.id}
            word={q.word}
            showHint={settings.spellHint}
            onAnswer={handleAnswer}
          />
        ) : (
          <ChoiceQuestion
            key={q.word.id}
            word={q.word}
            mode={q.mode}
            choices={q.choices!}
            onAnswer={handleAnswer}
          />
        )}
      </div>
    </Layout>
  )
}
