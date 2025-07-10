'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser, clearSessionUser } from '@/lib/auth'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = () => {
      const sessionUser = getSessionUser()
      
      if (!sessionUser) {
        router.push('/login')
        return
      }

      setUser(sessionUser)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      clearSessionUser()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      clearSessionUser()
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">{user?.fullName || user?.email}さんこんにちは</h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              ← ホームに戻る
            </Link>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-br from-slate-700 to-slate-600 text-white px-6 py-2 rounded-lg hover:from-slate-600 hover:to-slate-500 transition-all duration-300 border border-white/10"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Study Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Progress */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">📚</span>
                今日の学習進捗
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">2.5</div>
                  <div className="text-slate-400 text-sm">時間</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">85%</div>
                  <div className="text-slate-400 text-sm">理解度</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">12</div>
                  <div className="text-slate-400 text-sm">問題数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">3</div>
                  <div className="text-slate-400 text-sm">科目</div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">⏰</span>
                最近の学習履歴
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-blue-400">📊</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">数学 - 微積分</div>
                      <div className="text-slate-400 text-sm">30分前</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-medium">完了</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-green-400">📝</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">英語 - 文法演習</div>
                      <div className="text-slate-400 text-sm">1時間前</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-medium">完了</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-purple-400">🔬</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">物理 - 力学</div>
                      <div className="text-slate-400 text-sm">2時間前</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-medium">進行中</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Profile */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">⚡</span>
                クイックアクション
              </h2>
              <div className="space-y-3">
                <button className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30 rounded-lg text-white hover:from-blue-600/30 hover:to-blue-500/30 transition-all duration-300 text-left">
                  <div className="font-medium">新しい学習を開始</div>
                  <div className="text-slate-400 text-sm">今日の課題を確認する</div>
                </button>
                <button className="w-full p-4 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 rounded-lg text-white hover:from-green-600/30 hover:to-green-500/30 transition-all duration-300 text-left">
                  <div className="font-medium">復習モード</div>
                  <div className="text-slate-400 text-sm">間違えた問題を再確認</div>
                </button>
                <button className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 rounded-lg text-white hover:from-purple-600/30 hover:to-purple-500/30 transition-all duration-300 text-left">
                  <div className="font-medium">学習計画</div>
                  <div className="text-slate-400 text-sm">週間スケジュールを確認</div>
                </button>
                {user?.isAdmin && (
                  <Link href="/admin/users" className="w-full p-4 bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 rounded-lg text-white hover:from-red-600/30 hover:to-red-500/30 transition-all duration-300 text-left block">
                    <div className="font-medium">ユーザー管理</div>
                    <div className="text-slate-400 text-sm">ユーザーの承認・管理</div>
                  </Link>
                )}
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">👤</span>
                プロフィール
              </h2>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl text-slate-300">Σ</span>
                  </div>
                  <div className="text-white font-medium">{user?.fullName || user?.email}</div>
                  <div className="text-slate-400 text-sm">{user?.isAdmin ? '管理者' : '学習者'}</div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">総学習時間</span>
                    <span className="text-white">127時間</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">完了した課題</span>
                    <span className="text-white">89個</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">学習開始日</span>
                    <span className="text-white">2024年4月1日</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}