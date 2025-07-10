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

        {/* Quick Action Bar */}
        <div className="mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/student/study/new"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl font-medium text-center hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center justify-center"
              >
                <span className="mr-2 text-xl">➕</span>
                学習記録を追加
              </Link>
              <Link 
                href="/student/study"
                className="flex-1 bg-gradient-to-r from-slate-700 to-slate-600 text-white px-6 py-4 rounded-xl font-medium text-center hover:from-slate-600 hover:to-slate-500 transition-all duration-300 flex items-center justify-center"
              >
                <span className="mr-2 text-xl">📚</span>
                学習記録一覧
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Records & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Summary */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">📊</span>
                今日の学習サマリー
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">0</div>
                  <div className="text-slate-400 text-sm">時間</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">0</div>
                  <div className="text-slate-400 text-sm">記録数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">0</div>
                  <div className="text-slate-400 text-sm">科目数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">7</div>
                  <div className="text-slate-400 text-sm">連続日数</div>
                </div>
              </div>
            </div>

            {/* Recent Study Records */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-3 text-2xl">📚</span>
                  最近の学習記録
                </h2>
                <Link 
                  href="/student/study"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
              <div className="space-y-4">
                {/* Placeholder for recent records - will be replaced with real data */}
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <span className="text-4xl">📝</span>
                  </div>
                  <p className="text-slate-400 mb-4">まだ学習記録がありません</p>
                  <Link 
                    href="/student/study/new"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span className="mr-2">➕</span>
                    最初の記録を追加
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-6">
            {/* This Week Stats */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">📈</span>
                今週の学習
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">総学習時間</span>
                  <span className="text-white font-medium">0時間</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">学習日数</span>
                  <span className="text-white font-medium">0日</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">記録数</span>
                  <span className="text-white font-medium">0件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">最も学習した科目</span>
                  <span className="text-white font-medium">-</span>
                </div>
              </div>
            </div>

            {/* Subject Overview */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="mr-3 text-2xl">📚</span>
                科目別学習時間
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                    <span className="text-slate-300">国語</span>
                  </div>
                  <span className="text-white">0時間</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                    <span className="text-slate-300">数学</span>
                  </div>
                  <span className="text-white">0時間</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span className="text-slate-300">英語</span>
                  </div>
                  <span className="text-white">0時間</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                    <span className="text-slate-300">理科</span>
                  </div>
                  <span className="text-white">0時間</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                    <span className="text-slate-300">社会</span>
                  </div>
                  <span className="text-white">0時間</span>
                </div>
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