'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CreateUser() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    const password = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setTempPassword(password)
  }

  const createUser = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      // 現在のセッションを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証セッションが見つかりません')
        return
      }

      // APIエンドポイントを呼び出してユーザーを作成
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          password: tempPassword,
          fullName
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(`ユーザー作成エラー: ${result.error}`)
        return
      }

      setMessage(`ユーザーが正常に作成されました。\nメール: ${email}\n初期パスワード: ${tempPassword}\n\nユーザーに初期パスワードを安全に伝達し、初回ログイン時の変更を案内してください。`)
      setEmail('')
      setFullName('')
      setTempPassword('')
    } catch (error) {
      setError(`予期しないエラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">新規ユーザー作成</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/users"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              ← ユーザー管理に戻る
            </Link>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <form onSubmit={createUser} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-slate-200 text-sm font-medium mb-2">
                メールアドレス *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-slate-200 text-sm font-medium mb-2">
                フルネーム
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label htmlFor="tempPassword" className="block text-slate-200 text-sm font-medium mb-2">
                初期パスワード *
              </label>
              <div className="flex gap-2">
                <input
                  id="tempPassword"
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
                  placeholder="初期パスワード"
                  required
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:from-blue-600/30 hover:to-blue-500/30 transition-all duration-300 whitespace-nowrap"
                >
                  自動生成
                </button>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                ユーザーは初回ログイン時にパスワード変更が必要です
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg text-green-400 text-sm whitespace-pre-line">
                {message}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'ユーザー作成中...' : 'ユーザーを作成'}
              </button>
              <Link
                href="/admin/users"
                className="px-6 py-3 bg-black/20 backdrop-blur-sm text-slate-200 font-medium rounded-xl border border-white/10 hover:bg-black/30 hover:border-white/20 transition-all duration-300 text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">📋 重要な注意事項</h2>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• 作成したユーザーには<strong>安全な方法</strong>で初期パスワードを伝達してください</li>
            <li>• ユーザーは初回ログイン時に<strong>必ずパスワード変更</strong>が求められます</li>
            <li>• メールでパスワードを送信する場合は、<strong>暗号化</strong>または<strong>別経路</strong>での伝達を推奨します</li>
            <li>• 初期パスワードは一時的なものとして扱い、<strong>記録を残さない</strong>でください</li>
          </ul>
        </div>
      </div>
    </div>
  )
}