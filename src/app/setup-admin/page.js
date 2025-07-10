'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetupAdmin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [setupKey, setSetupKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          setupKey
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error)
        return
      }

      setSuccess('初期管理者が正常に作成されました。ログインページに移動します。')
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error) {
      setError(`予期しないエラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl mb-4">
            <span className="text-white text-2xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-light text-white mb-2">初期管理者セットアップ</h1>
          <p className="text-slate-400 text-sm">
            システムの初期管理者アカウントを作成します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="setupKey" className="block text-slate-200 text-sm font-medium mb-2">
              セットアップキー *
            </label>
            <input
              id="setupKey"
              type="password"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
              placeholder="セットアップキーを入力"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-slate-200 text-sm font-medium mb-2">
              管理者メールアドレス *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-200 text-sm font-medium mb-2">
              管理者パスワード *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
              placeholder="強力なパスワードを設定"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="text-yellow-400 font-medium mb-2">⚠️ 重要な注意事項</h3>
            <ul className="text-yellow-300 text-sm space-y-1">
              <li>• この設定は<strong>一度のみ</strong>実行可能です</li>
              <li>• セットアップキーは環境変数で設定されています</li>
              <li>• 管理者アカウントは安全に管理してください</li>
              <li>• 初期設定後はこのページにアクセスできません</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-gradient-to-br from-red-600 to-red-500 text-white font-medium rounded-xl hover:from-red-500 hover:to-red-400 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '管理者作成中...' : '初期管理者を作成'}
          </button>
        </form>

        <div className="text-center pt-6">
          <Link 
            href="/login" 
            className="text-slate-400 hover:text-slate-300 transition-colors text-sm"
          >
            ← ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}