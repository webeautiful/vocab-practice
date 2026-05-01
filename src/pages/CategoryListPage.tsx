import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import wordBank from '../data/words.json'
import { getRecordsByCategory } from '../db/learning-records'
import { getSettings, updateSettings } from '../stores/settings'
import { shouldUnlockNext } from '../services/category-unlock'
import type { Category, Word } from '../types'

const categories = wordBank.categories as Category[]
const allWords = wordBank.words as Word[]

export default function CategoryListPage() {
  const navigate = useNavigate()
  const [unlockedIds, setUnlockedIds] = useState<number[]>([1])
  const [categoryStats, setCategoryStats] = useState<Map<number, { learned: number; total: number }>>(new Map())

  useEffect(() => {
    async function load() {
      const settings = getSettings()
      let unlocked = [...settings.unlockedCategories]

      const stats = new Map<number, { learned: number; total: number }>()

      for (const cat of categories) {
        const catWords = allWords.filter(w => w.categoryId === cat.id)
        const records = await getRecordsByCategory(cat.id)
        const learned = records.filter(r => r.level >= 1).length
        stats.set(cat.id, { learned, total: catWords.length })

        if (unlocked.includes(cat.id) && !unlocked.includes(cat.id + 1)) {
          if (shouldUnlockNext(catWords, records, settings.unlockThreshold)) {
            const nextCat = categories.find(c => c.id === cat.id + 1)
            if (nextCat) {
              unlocked.push(nextCat.id)
            }
          }
        }
      }

      if (unlocked.length > settings.unlockedCategories.length) {
        updateSettings({ unlockedCategories: unlocked })
      }

      setUnlockedIds(unlocked)
      setCategoryStats(stats)
    }
    load()
  }, [])

  return (
    <Layout title="选择主题" onBack={() => navigate('/')}>
      <div className="space-y-3">
        {categories.map(cat => {
          const locked = !unlockedIds.includes(cat.id)
          const stat = categoryStats.get(cat.id)

          return (
            <button
              key={cat.id}
              onClick={() => !locked && navigate(`/learn/${cat.id}`)}
              disabled={locked}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                locked
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-gray-200 hover:border-sky-300 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">
                  {locked ? '🔒 ' : ''}{cat.name}
                </span>
                {stat && (
                  <span className="text-sm text-gray-500">
                    {stat.learned}/{stat.total}
                  </span>
                )}
              </div>
              {stat && !locked && (
                <ProgressBar current={stat.learned} total={stat.total} />
              )}
            </button>
          )
        })}
      </div>
    </Layout>
  )
}
