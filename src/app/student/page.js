'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser, clearSessionUser } from '@/lib/auth'
import Link from 'next/link'

export default function StudentDashboard() {
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

      if (sessionUser.userType !== 'student') {
        router.push('/dashboard') // 管理者は管理ページへ
        return
      }

      setUser(sessionUser)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const handleLogout = async () => {
    clearSessionUser()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">{user?.fullName}さんの学習ページ</h1>
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

        {/* Student Info Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-3 text-2xl">👤</span>
            学生情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-black/20 rounded-lg">
              <div className="text-slate-400 text-sm">学年</div>
              <div className="text-white font-medium text-lg">{user?.grade}</div>
            </div>
            <div className="text-center p-4 bg-black/20 rounded-lg">
              <div className="text-slate-400 text-sm">クラス</div>
              <div className="text-white font-medium text-lg">{user?.className}</div>
            </div>
            <div className="text-center p-4 bg-black/20 rounded-lg">
              <div className="text-slate-400 text-sm">出席番号</div>
              <div className="text-white font-medium text-lg">{user?.studentNumber}</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Today's Tasks */}
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

            {/* Assignments */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">📝</span>
                今日の課題
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-blue-400">📊</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">数学 - 微積分問題集</div>
                      <div className="text-slate-400 text-sm">期限: 今日 23:59</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-medium">未完了</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-green-400">📝</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">英語 - 単語テスト</div>
                      <div className="text-slate-400 text-sm">期限: 明日 10:00</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-medium">完了</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">⚡</span>
                学習メニュー
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
                  <div className="font-medium">成績確認</div>
                  <div className="text-slate-400 text-sm">テスト結果を確認</div>
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">📅</span>
                今週のスケジュール
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">月曜日</span>
                  <span className="text-white">数学・英語</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">火曜日</span>
                  <span className="text-white">物理・化学</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">水曜日</span>
                  <span className="text-white">国語・社会</span>
                </div>
                <div className="flex justify-between text-sm bg-blue-500/10 p-2 rounded">
                  <span className="text-blue-400">今日</span>
                  <span className="text-blue-400">数学・英語・物理</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}