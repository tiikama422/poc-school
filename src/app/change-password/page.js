'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      // 初回パスワード変更が完了している場合はダッシュボードへ
      if (currentUser.profile?.initial_password_changed) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
    }

    checkUser()
  }, [router])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // バリデーション
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください')
      setIsLoading(false)
      return
    }

    try {
      // パスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(`パスワード更新エラー: ${updateError.message}`)
        return
      }

      // initial_password_changed フラグを更新
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ initial_password_changed: true })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      // ダッシュボードにリダイレクト
      router.push('/dashboard')
    } catch (error) {
      setError(`予期しないエラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-2xl mb-4">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-light text-white mb-2">パスワード変更が必要です</h1>
          <p className="text-slate-400 text-sm">
            セキュリティのため、初回ログイン時にパスワードの変更をお願いします
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-slate-200 text-sm font-medium mb-2">
              新しいパスワード *
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
              placeholder="8文字以上で入力してください"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-slate-200 text-sm font-medium mb-2">
              新しいパスワード（確認用） *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all duration-300"
              placeholder="同じパスワードを再入力してください"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-blue-400 font-medium mb-2">パスワードの要件</h3>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• 8文字以上</li>
              <li>• 英数字・記号を組み合わせることを推奨</li>
              <li>• 推測されにくいパスワードを設定してください</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'パスワード変更中...' : 'パスワードを変更'}
          </button>
        </form>
      </div>
    </div>
  )
}