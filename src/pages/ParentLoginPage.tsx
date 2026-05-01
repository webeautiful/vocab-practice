import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getSettings, updateSettings } from '../stores/settings'

export default function ParentLoginPage() {
  const navigate = useNavigate()
  const settings = getSettings()
  const isFirstTime = !settings.parentPassword

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isFirstTime) {
      if (password.length !== 4 || !/^\d{4}$/.test(password)) {
        setError('请输入4位数字密码')
        return
      }
      if (password !== confirmPassword) {
        setError('两次密码不一致')
        return
      }
      updateSettings({ parentPassword: password })
      navigate('/parent/dashboard')
    } else {
      if (password !== settings.parentPassword) {
        setError('密码错误')
        return
      }
      navigate('/parent/dashboard')
    }
  }

  return (
    <Layout title="家长入口" onBack={() => navigate('/')}>
      <form onSubmit={handleSubmit} className="max-w-xs mx-auto space-y-4 pt-12">
        <div>
          <label className="block text-gray-700 mb-2">
            {isFirstTime ? '设置4位数字密码' : '输入密码'}
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={password}
            onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
            placeholder="4位数字"
            autoFocus
            className="w-full text-center text-2xl tracking-[0.5em] p-3 border-2 border-gray-300 rounded-xl focus:border-sky-400 outline-none"
          />
        </div>

        {isFirstTime && (
          <div>
            <label className="block text-gray-700 mb-2">确认密码</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
              placeholder="再次输入"
              className="w-full text-center text-2xl tracking-[0.5em] p-3 border-2 border-gray-300 rounded-xl focus:border-sky-400 outline-none"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
        >
          {isFirstTime ? '设置密码并进入' : '进入'}
        </button>
      </form>
    </Layout>
  )
}
