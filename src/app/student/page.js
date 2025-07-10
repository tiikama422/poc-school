'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser, clearSessionUser } from '@/lib/auth'
import Link from 'next/link'

export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
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
      await loadStats(sessionUser)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const loadStats = async (user) => {
    try {
      const response = await fetch('/.netlify/functions/study-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${btoa(JSON.stringify(user))}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

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
                  <div className="text-3xl font-bold text-blue-400">
                    {stats?.today?.totalHours || 0}
                    {stats?.today?.totalMinutes > 0 && (
                      <span className="text-xl">.{Math.floor(stats.today.totalMinutes / 6)}</span>
                    )}
                  </div>
                  <div className="text-slate-400 text-sm">時間</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{stats?.today?.recordCount || 0}</div>
                  <div className="text-slate-400 text-sm">記録数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{stats?.today?.subjectCount || 0}</div>
                  <div className="text-slate-400 text-sm">科目数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{stats?.streakDays || 0}</div>
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
                {stats?.recentRecords && stats.recentRecords.length > 0 ? (
                  stats.recentRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${record.subjects?.color || '#95A5A6'}20` }}
                        >
                          {record.subjects?.name === '国語' ? '📖' : 
                           record.subjects?.name === '数学' ? '📊' : 
                           record.subjects?.name === '英語' ? '🌍' : 
                           record.subjects?.name === '理科' ? '🔬' : 
                           record.subjects?.name === '社会' ? '🏛️' : '📝'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{record.subjects?.name}</div>
                          <div className="text-slate-400 text-sm">
                            {record.hours > 0 && `${record.hours}時間`}
                            {record.minutes > 0 && `${record.minutes}分`}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {new Date(record.study_date).toLocaleDateString('ja-JP', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  ))
                ) : (
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
                )}
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
                  <span className="text-white font-medium">
                    {stats?.thisWeek?.totalHours || 0}時間
                    {stats?.thisWeek?.totalMinutes > 0 && `${stats.thisWeek.totalMinutes}分`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">学習日数</span>
                  <span className="text-white font-medium">{stats?.thisWeek?.studyDays || 0}日</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">記録数</span>
                  <span className="text-white font-medium">{stats?.thisWeek?.recordCount || 0}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">最も学習した科目</span>
                  <span className="text-white font-medium">
                    {stats?.thisWeek?.mostStudiedSubject ? (
                      stats.thisWeek.mostStudiedSubject === 1 ? '国語' :
                      stats.thisWeek.mostStudiedSubject === 2 ? '数学' :
                      stats.thisWeek.mostStudiedSubject === 3 ? '英語' :
                      stats.thisWeek.mostStudiedSubject === 4 ? '理科' :
                      stats.thisWeek.mostStudiedSubject === 5 ? '社会' : 'その他'
                    ) : '-'}
                  </span>
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
                {stats?.subjects && stats.subjects.length > 0 ? (
                  stats.subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: subject.color }}
                        ></div>
                        <span className="text-slate-300">{subject.name}</span>
                      </div>
                      <span className="text-white">
                        {subject.totalHours}時間
                        {subject.displayMinutes > 0 && `${subject.displayMinutes}分`}
                      </span>
                    </div>
                  ))
                ) : (
                  [
                    { name: '国語', color: '#E74C3C' },
                    { name: '数学', color: '#3498DB' },
                    { name: '英語', color: '#2ECC71' },
                    { name: '理科', color: '#9B59B6' },
                    { name: '社会', color: '#F39C12' }
                  ].map((subject) => (
                    <div key={subject.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: subject.color }}
                        ></div>
                        <span className="text-slate-300">{subject.name}</span>
                      </div>
                      <span className="text-white">0時間</span>
                    </div>
                  ))
                )}
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