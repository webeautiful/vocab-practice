import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import wordBank from '../data/words.json'
import { getRecordsByCategory } from '../db/learning-records'
import { getAllErrors } from '../db/error-records'
import type { Word, LearningRecord, ErrorRecord } from '../types'

const allWords = wordBank.words as Word[]
const categories = wordBank.categories as { id: number; name: string }[]

export default function ParentCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const catId = Number(categoryId)
  const category = categories.find(c => c.id === catId)

  const [records, setRecords] = useState<LearningRecord[]>([])
  const [errors, setErrors] = useState<ErrorRecord[]>([])

  const catWords = allWords.filter(w => w.categoryId === catId)

  useEffect(() => {
    async function load() {
      const recs = await getRecordsByCategory(catId)
      setRecords(recs)
      const allErrs = await getAllErrors()
      const catErrs = allErrs.filter(e => e.wordId.startsWith(`cat${catId}_`))
      setErrors(catErrs.sort((a, b) => b.errorCount - a.errorCount))
    }
    load()
  }, [catId])

  const recordMap = new Map(records.map(r => [r.wordId, r]))
  const levelLabels = ['未学', '认知1', '认知2', '理解1', '理解2', '拼写']

  return (
    <Layout title={category?.name ?? '主题详情'} onBack={() => navigate('/parent/dashboard')}>
      <div className="space-y-6">
        {errors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
            <h2 className="font-bold text-red-500">易错词 ({errors.length})</h2>
            {errors.slice(0, 20).map(err => {
              const word = catWords.find(w => w.id === err.wordId)
              if (!word) return null
              return (
                <div key={err.wordId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="font-medium text-gray-800">{word.emoji} {word.english}</span>
                    <span className="text-gray-500 ml-2">{word.chinese}</span>
                  </div>
                  <span className="text-sm text-red-400">错{err.errorCount}次</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h2 className="font-bold text-gray-700">全部单词 ({catWords.length})</h2>
          {catWords.map(word => {
            const record = recordMap.get(word.id)
            const level = record?.level ?? 0
            const mastered = record?.mastered ?? false

            return (
              <div key={word.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-gray-800">{word.emoji} {word.english}</span>
                  <span className="text-gray-500 ml-2 text-sm">{word.chinese}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  mastered ? 'bg-green-100 text-green-700' :
                  level > 0 ? 'bg-sky-100 text-sky-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {mastered ? '已掌握' : levelLabels[level]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
