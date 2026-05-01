import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDueReviewWords, getAllRecords } from '../db/learning-records'
import Layout from '../components/Layout'

export default function HomePage() {
  const navigate = useNavigate()
  const [dueCount, setDueCount] = useState(0)
  const [totalLearned, setTotalLearned] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    getDueReviewWords(today).then(words => setDueCount(words.length))
    getAllRecords().then(records => setTotalLearned(records.length))
  }, [])

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">单词练习</h1>
        <p className="text-gray-500">已学 {totalLearned} 个单词</p>

        {dueCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-center">
            今日待复习 <span className="font-bold">{dueCount}</span> 个词
          </div>
        )}

        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={() => navigate('/categories')}
            className="w-full bg-sky-500 text-white text-xl py-4 rounded-2xl hover:bg-sky-600 transition-colors"
          >
            开始学习
          </button>
          <button
            onClick={() => navigate('/parent/login')}
            className="w-full bg-white text-gray-600 text-lg py-3 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            家长入口
          </button>
        </div>
      </div>
    </Layout>
  )
}
