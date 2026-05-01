import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import WordCard from '../components/WordCard'
import { useSpeech } from '../hooks/use-speech'
import wordBank from '../data/words.json'
import { getRecordsByCategory } from '../db/learning-records'
import type { Word } from '../types'

const allWords = wordBank.words as Word[]

export default function LearnPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { speak } = useSpeech()
  const catId = Number(categoryId)

  const [newWords, setNewWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const catWords = allWords.filter(w => w.categoryId === catId)
      const records = await getRecordsByCategory(catId)
      const learnedIds = new Set(records.map(r => r.wordId))
      const unlearned = catWords.filter(w => !learnedIds.has(w.id)).slice(0, 10)
      setNewWords(unlearned)
      setLoading(false)
    }
    load()
  }, [catId])

  useEffect(() => {
    if (newWords.length > 0 && currentIndex < newWords.length) {
      speak(newWords[currentIndex].english)
    }
  }, [currentIndex, newWords, speak])

  if (loading) {
    return <Layout title="加载中..."><div /></Layout>
  }

  if (newWords.length === 0) {
    return (
      <Layout title="学习新词" onBack={() => navigate('/categories')}>
        <div className="text-center py-12 space-y-4">
          <p className="text-xl text-gray-600">这个主题没有新词了</p>
          <button
            onClick={() => navigate(`/practice/${catId}`)}
            className="bg-sky-500 text-white text-lg px-6 py-3 rounded-xl hover:bg-sky-600 transition-colors"
          >
            直接练习
          </button>
        </div>
      </Layout>
    )
  }

  const word = newWords[currentIndex]
  const isLast = currentIndex === newWords.length - 1

  return (
    <Layout title={`学习新词 (${currentIndex + 1}/${newWords.length})`} onBack={() => navigate('/categories')}>
      <div className="space-y-6">
        <WordCard word={word} />

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-600 text-lg py-3 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一个
          </button>

          {isLast ? (
            <button
              onClick={() => navigate(`/practice/${catId}`)}
              className="flex-1 bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
            >
              开始练习
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="flex-1 bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
            >
              下一个
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
