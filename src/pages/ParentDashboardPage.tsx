import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import BarChart from '../components/BarChart'
import wordBank from '../data/words.json'
import { getAllRecords, getTodayPracticedCount } from '../db/learning-records'
import type { Word, LearningRecord } from '../types'

const allWords = wordBank.words as Word[]
const totalWords = allWords.length

export default function ParentDashboardPage() {
  const navigate = useNavigate()

  const [records, setRecords] = useState<LearningRecord[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [weekData, setWeekData] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      const allRecs = await getAllRecords()
      setRecords(allRecs)

      const today = new Date().toISOString().slice(0, 10)
      const count = await getTodayPracticedCount(today)
      setTodayCount(count)

      const days: { label: string; value: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`
        const dayCount = allRecs.filter(r => r.lastPracticeDate === dateStr).length
        days.push({ label: dayLabel, value: dayCount })
      }
      setWeekData(days)
    }
    load()
  }, [])

  const learnedCount = records.length
  const masteredCount = records.filter(r => r.mastered).length
  const totalAttempts = records.reduce((sum, r) => sum + r.totalAttempts, 0)
  const totalCorrect = records.reduce((sum, r) => sum + r.totalCorrect, 0)
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  return (
    <Layout title="学习报告" onBack={() => navigate('/')}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <div className="flex justify-between text-gray-700">
            <span>已学单词</span>
            <span className="font-bold">{learnedCount} / {totalWords}</span>
          </div>
          <ProgressBar current={learnedCount} total={totalWords} />

          <div className="grid grid-cols-3 gap-3 text-center pt-2">
            <div>
              <div className="text-2xl font-bold text-sky-600">{masteredCount}</div>
              <div className="text-xs text-gray-500">已掌握</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-600">{todayCount}</div>
              <div className="text-xs text-gray-500">今日练习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-600">{accuracy}%</div>
              <div className="text-xs text-gray-500">正确率</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h2 className="font-bold text-gray-700">最近7天</h2>
          <BarChart data={weekData} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h2 className="font-bold text-gray-700">主题详情</h2>
          {(wordBank.categories as { id: number; name: string }[]).map(cat => {
            const catWords = allWords.filter(w => w.categoryId === cat.id)
            const catRecords = records.filter(r => r.wordId.startsWith(`cat${cat.id}_`))
            const catLearned = catRecords.filter(r => r.level >= 1).length

            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/parent/category/${cat.id}`)}
                className="w-full flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-left hover:bg-gray-50"
              >
                <span className="text-gray-700">{cat.name}</span>
                <span className="text-sm text-gray-500">{catLearned}/{catWords.length}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/parent/settings')}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 text-lg py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          设置
        </button>
      </div>
    </Layout>
  )
}
