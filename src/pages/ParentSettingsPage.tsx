import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getSettings, updateSettings } from '../stores/settings'
import wordBank from '../data/words.json'
import { db } from '../db'

const categories = wordBank.categories as { id: number; name: string }[]

export default function ParentSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(getSettings())
  const [resetConfirm, setResetConfirm] = useState<number | null>(null)
  const [resetAllConfirm, setResetAllConfirm] = useState(false)

  function handleChange(partial: Partial<typeof settings>) {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    updateSettings(partial)
  }

  function toggleCategory(catId: number) {
    const current = settings.unlockedCategories
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId].sort((a, b) => a - b)
    handleChange({ unlockedCategories: updated })
  }

  async function resetCategory(catId: number) {
    const prefix = `cat${catId}_`
    const allRecords = await db.learningRecords.toArray()
    const toDelete = allRecords.filter(r => r.wordId.startsWith(prefix))
    await Promise.all(toDelete.map(r => db.learningRecords.delete(r.wordId)))

    const allErrors = await db.errorRecords.toArray()
    const errorsToDelete = allErrors.filter(r => r.wordId.startsWith(prefix))
    await Promise.all(errorsToDelete.map(r => db.errorRecords.delete(r.wordId)))

    setResetConfirm(null)
  }

  async function resetAll() {
    await db.learningRecords.clear()
    await db.errorRecords.clear()
    handleChange({ unlockedCategories: [1] })
    setResetAllConfirm(false)
  }

  return (
    <Layout title="设置" onBack={() => navigate('/parent/dashboard')}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="font-bold text-gray-700">练习设置</h2>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">每日目标词数</span>
            <select
              value={settings.dailyGoal}
              onChange={e => handleChange({ dailyGoal: Number(e.target.value) })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {[10, 15, 20, 25, 30].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">选项数量</span>
            <select
              value={settings.choiceCount}
              onChange={e => handleChange({ choiceCount: Number(e.target.value) as 3 | 4 })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={3}>3个</option>
              <option value={4}>4个</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">拼写提示（首字母）</span>
            <button
              onClick={() => handleChange({ spellHint: !settings.spellHint })}
              className={`w-12 h-7 rounded-full transition-colors ${
                settings.spellHint ? 'bg-sky-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-1 ${
                settings.spellHint ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="font-bold text-gray-700">主题管理</h2>
          <p className="text-sm text-gray-500">勾选手动解锁主题，取消勾选则锁定</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  checked={settings.unlockedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="font-bold text-red-500">重置进度</h2>
          <p className="text-sm text-gray-500">选择一个主题重置其学习进度（不可恢复）</p>
          <select
            value=""
            onChange={e => setResetConfirm(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="" disabled>选择主题...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {resetConfirm !== null && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-red-700">
                确定要重置「{categories.find(c => c.id === resetConfirm)?.name}」的所有学习进度吗？此操作不可恢复。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => resetCategory(resetConfirm)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  确认重置
                </button>
                <button
                  onClick={() => setResetConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setResetAllConfirm(true)}
              className="w-full bg-red-100 text-red-600 font-medium py-2 rounded-lg hover:bg-red-200"
            >
              重置全部进度
            </button>
          </div>

          {resetAllConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-red-700">
                确定要重置所有主题的学习进度吗？学习记录、错题本将全部清空，已解锁的主题将重新锁定。此操作不可恢复。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resetAll}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  确认全部重置
                </button>
                <button
                  onClick={() => setResetAllConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
