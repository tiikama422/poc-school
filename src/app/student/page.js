'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser, clearSessionUser } from '@/lib/auth'
import { safeBase64Encode } from '@/lib/base64'
import Link from 'next/link'
import CircularProgress from '@/components/CircularProgress'
import WeeklyChart from '@/components/WeeklyChart'
import SubjectPieChart from '@/components/SubjectPieChart'
import GoalModal from '@/components/GoalModal'

export default function StudentDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(120)
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
      await loadGoal(sessionUser)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const loadStats = async (user) => {
    try {
      if (!user) {
        console.error('User is null or undefined')
        return
      }
      
      const response = await fetch('/.netlify/functions/study-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
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

  const loadGoal = async (user) => {
    try {
      const response = await fetch('/.netlify/functions/goal', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setDailyGoal(result.data?.daily_goal_minutes || 120)
      } else {
        console.error('Failed to load goal:', result.error)
        setDailyGoal(120) // デフォルト値
      }
    } catch (error) {
      console.error('Load goal error:', error)
      setDailyGoal(120) // デフォルト値
    }
  }

  const handleSaveGoal = async (goalMinutes) => {
    try {
      const response = await fetch('/.netlify/functions/goal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        },
        body: JSON.stringify({ daily_goal_minutes: goalMinutes })
      })

      const result = await response.json()

      if (response.ok) {
        setDailyGoal(goalMinutes)
        setShowGoalModal(false)
        // 統計データを再読み込みして更新
        await loadStats(user)
      } else {
        alert('目標の設定に失敗しました: ' + result.error)
      }
    } catch (error) {
      console.error('Save goal error:', error)
      alert('目標の設定中にエラーが発生しました')
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

  // Helper functions
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`
    } else if (hours > 0) {
      return `${hours}時間`
    } else {
      return `${mins}分`
    }
  }
  
  const calculateGoalPercentage = (currentMinutes) => {
    return dailyGoal > 0 ? Math.min((currentMinutes / dailyGoal) * 100, 100) : 0
  }
  
  const renderTimeComparison = (todayMinutes, yesterdayMinutes) => {
    const diff = todayMinutes - yesterdayMinutes
    if (diff > 0) {
      return (
        <div className="flex items-center text-green-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
          <span>+{diff}分</span>
        </div>
      )
    } else if (diff < 0) {
      return (
        <div className="flex items-center text-red-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
          <span>{diff}分</span>
        </div>
      )
    } else {
      return <span className="text-slate-400">同じ</span>
    }
  }
  
  const getSubjectIcon = (subjectName) => {
    const icons = {
      '国語': '📖',
      '数学': '📊', 
      '英語': '🌍',
      '理科': '🔬',
      '社会': '🏛️'
    }
    return icons[subjectName] || '📝'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-white tracking-wide">{user?.fullName}さんの学習ページ</h1>
          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
            <button
              onClick={handleLogout}
              className="bg-gradient-to-br from-slate-700 to-slate-600 text-white px-3 py-2 rounded-lg hover:from-slate-600 hover:to-slate-500 transition-all duration-300 border border-white/10 text-sm whitespace-nowrap"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">学生情報</h2>
            <div className="text-center px-3 py-1 bg-black/20 rounded-lg">
              <div className="text-slate-400 text-xs">学年</div>
              <div className="text-white font-medium text-sm">{user?.grade}</div>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col xs:flex-row gap-3">
              <Link 
                href="/student/study/new"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2.5 rounded-xl font-medium text-center hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center justify-center text-sm whitespace-nowrap"
              >
                学習記録を追加
              </Link>
              <Link 
                href={`/student/study/daily/${new Date().toISOString().split('T')[0]}`}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-2.5 rounded-xl font-medium text-center hover:from-green-500 hover:to-green-400 transition-all duration-300 flex items-center justify-center text-sm whitespace-nowrap"
              >
                今日の学習記録
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Enhanced Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Today's Summary */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-5 flex items-center">
                <span className="mr-2 text-lg sm:text-xl">🎯</span>
                今日の学習サマリー
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Goal Achievement Circle */}
                <div className="flex flex-col items-center">
                  <CircularProgress 
                    percentage={calculateGoalPercentage(stats?.today?.totalMinutes || 0)}
                    size={100}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {Math.round(calculateGoalPercentage(stats?.today?.totalMinutes || 0))}%
                      </div>
                      <div className="text-xs text-slate-400">達成</div>
                    </div>
                  </CircularProgress>
                  <div className="mt-2 text-center">
                    <div className="text-sm text-slate-300">
                      目標まで{' '}
                      <span className="text-blue-400 font-medium">
                        {Math.max(0, dailyGoal - (stats?.today?.totalMinutes || 0))}分
                      </span>
                    </div>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="mt-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      目標設定 (現在: {Math.floor(dailyGoal / 60)}時間{dailyGoal % 60}分)
                    </button>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatTime(stats?.today?.totalMinutes || 0)}
                    </div>
                    <div className="text-slate-400 text-sm">今日の学習</div>
                  </div>
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{stats?.streakDays || 0}</div>
                    <div className="text-slate-400 text-sm">連続学習</div>
                  </div>
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{stats?.today?.recordCount || 0}</div>
                    <div className="text-slate-400 text-sm">記録数</div>
                  </div>
                  <div className="text-center p-3 bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{stats?.today?.subjectCount || 0}</div>
                    <div className="text-slate-400 text-sm">科目数</div>
                  </div>
                </div>
              </div>
              
              {/* Yesterday Comparison */}
              {stats?.yesterday && (
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">昨日との比較</span>
                    <div className="flex items-center gap-2">
                      {renderTimeComparison(stats.today?.totalMinutes || 0, stats.yesterday?.totalMinutes || 0)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Weekly Learning Snapshot */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  統計情報
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Weekly Bar Chart */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">週間学習時間</h3>
                  <WeeklyChart weeklyData={stats?.weeklyData || []} />
                </div>
                
                {/* Subject Balance Pie Chart */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">今週の科目バランス</h3>
                  <SubjectPieChart subjects={stats?.weeklySubjects || []} />
                </div>
              </div>
            </div>

            {/* Recent Study Records */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2 text-lg">📚</span>
                  最近の学習記録
                </h2>
                <Link 
                  href="/student/study"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  すべて見る →
                </Link>
              </div>
              <div className="space-y-3">
                {stats?.recentRecords && stats.recentRecords.length > 0 ? (
                  stats.recentRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${record.subjects?.color || '#95A5A6'}20` }}
                        >
                          {getSubjectIcon(record.subjects?.name)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{record.subjects?.name}</div>
                          <div className="text-slate-400 text-sm">
                            {formatTime((record.hours || 0) * 60 + (record.minutes || 0))}
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

          {/* Right Column - Enhanced Stats & Schedule */}
          <div className="space-y-4">
            
            {/* Upcoming Events */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2 text-lg">📅</span>
                今後の予定
              </h2>
              <div className="space-y-3">
                {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                  stats.upcomingEvents.slice(0, 2).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{event.title}</div>
                        <div className="text-slate-400 text-sm">{event.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-400 text-sm font-medium">
                          {new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-slate-400 text-xs">
                          あと{Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))}日
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-sm">予定はありません</div>
                  </div>
                )}
                <Link 
                  href="/student/calendar"
                  className="block text-center text-blue-400 hover:text-blue-300 text-sm font-medium mt-4"
                >
                  カレンダーで予定を確認する →
                </Link>
              </div>
            </div>

            {/* Subject Overview */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2 text-lg">📚</span>
                科目別学習時間
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {stats?.subjects && stats.subjects.length > 0 ? (
                  stats.subjects.map((subject) => (
                    <div key={subject.id} className="bg-black/20 rounded-lg p-2.5">
                      <div className="flex items-center mb-1.5">
                        <div 
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: subject.color }}
                        ></div>
                        <span className="text-slate-300 text-sm">{subject.name}</span>
                      </div>
                      <div className="text-white font-medium text-sm">
                        {formatTime((subject.totalHours || 0) * 60 + (subject.displayMinutes || 0))}
                      </div>
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
                    <div key={subject.name} className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <div 
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: subject.color }}
                        ></div>
                        <span className="text-slate-300 text-sm">{subject.name}</span>
                      </div>
                      <div className="text-white font-medium text-sm">0時間</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Goal Modal */}
        <GoalModal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          onSave={handleSaveGoal}
          currentGoal={dailyGoal}
        />
      </div>
    </div>
  )
}