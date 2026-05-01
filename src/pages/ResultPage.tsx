import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useSpeech } from '../hooks/use-speech'
import wordBank from '../data/words.json'
import type { AnswerResult, Word } from '../types'

const allWords = wordBank.words as Word[]

interface ResultState {
  results: AnswerResult[]
  elapsed: number
  categoryId: number
}

export default function ResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { speak } = useSpeech()
  const state = location.state as ResultState | null

  if (!state) {
    navigate('/')
    return null
  }

  const { results, elapsed, categoryId } = state
  const correctCount = results.filter(r => r.correct).length
  const wrongResults = results.filter(r => !r.correct)
  const wordMap = new Map(allWords.map(w => [w.id, w]))

  return (
    <Layout title="练习结果" onBack={() => navigate('/categories')}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center space-y-2">
          <div className="text-4xl font-bold text-gray-800">
            {correctCount} / {results.length}
          </div>
          <div className="text-gray-500">
            用时 {elapsed < 1 ? '不到1' : elapsed} 分钟
          </div>
        </div>

        {wrongResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700">错误的词</h2>
            {wrongResults.map(r => {
              const word = wordMap.get(r.wordId)
              if (!word) return null
              return (
                <div
                  key={r.wordId}
                  className="bg-white rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <button
                      onClick={() => speak(word.english)}
                      className="text-lg font-medium text-gray-800 hover:text-sky-600"
                    >
                      {word.emoji} {word.english} 🔊
                    </button>
                    <div className="text-sm text-gray-500">{word.chinese}</div>
                  </div>
                  <div className="text-sm text-red-400">
                    你的答案: {r.userAnswer}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3">
          {wrongResults.length > 0 && (
            <button
              onClick={() => navigate(`/practice/${categoryId}`)}
              className="flex-1 bg-amber-500 text-white text-lg py-3 rounded-xl hover:bg-amber-600 transition-colors"
            >
              重练错词
            </button>
          )}
          <button
            onClick={() => navigate('/categories')}
            className="flex-1 bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </Layout>
  )
}
