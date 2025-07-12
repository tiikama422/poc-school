'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import Link from 'next/link'

export default function StudyCalendar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const sessionUser = getSessionUser()
      
      if (!sessionUser) {
        router.push('/login')
        return
      }

      if (sessionUser.userType !== 'student') {
        router.push('/dashboard')
        return
      }

      setUser(sessionUser)
      await loadEvents(sessionUser)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const loadEvents = async (user) => {
    try {
      // 実際の実装では、APIから予定データを取得
      // 現在はサンプルデータを使用
      const sampleEvents = [
        {
          id: 1,
          date: '2025-07-15',
          title: '数学テスト',
          type: 'テスト',
          color: '#3498DB',
          description: '数学Ⅱ 微分・積分'
        },
        {
          id: 2,
          date: '2025-07-18',
          title: '英語小テスト',
          type: '小テスト',
          color: '#2ECC71',
          description: '英単語 Unit 5-6'
        },
        {
          id: 3,
          date: '2025-07-22',
          title: '物理レポート提出',
          type: '提出物',
          color: '#9B59B6',
          description: '力学実験レポート'
        },
        {
          id: 4,
          date: '2025-07-25',
          title: '期末試験開始',
          type: '試験',
          color: '#E74C3C',
          description: '1学期期末試験'
        }
      ]
      setEvents(sampleEvents)
    } catch (error) {
      console.error('Load events error:', error)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()

    const days = []
    
    // 前月の日付を埋める
    for (let i = startDay; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1)
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        events: []
      })
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      const dateString = currentDate.toISOString().split('T')[0]
      const dayEvents = events.filter(event => event.date === dateString)
      
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        events: dayEvents
      })
    }

    // 次月の日付を埋める
    const remainingDays = 42 - days.length // 6週間分
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        events: []
      })
    }

    return days
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day)
    }
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  const calendarDays = getDaysInMonth(currentMonth)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">学習予定カレンダー</h1>
          <Link
            href="/student"
            className="text-slate-300 hover:text-white transition-colors font-medium"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                  <div key={day} className={`text-center py-2 text-sm font-medium ${
                    index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative min-h-[80px] p-2 rounded-lg cursor-pointer transition-all duration-200
                      ${day.isCurrentMonth 
                        ? 'hover:bg-slate-700/30' 
                        : 'text-slate-600'
                      }
                      ${isToday(day.date) 
                        ? 'bg-blue-500/20 border border-blue-500/40' 
                        : 'hover:bg-black/20'
                      }
                    `}
                  >
                    <div className={`text-sm font-medium ${
                      day.isCurrentMonth ? 'text-white' : 'text-slate-600'
                    }`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Events */}
                    <div className="mt-1 space-y-1">
                      {day.events.slice(0, 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className="text-xs px-1 py-0.5 rounded text-white truncate"
                          style={{ backgroundColor: event.color }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-slate-400">
                          +{day.events.length - 2}件
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3 text-2xl">📅</span>
                近日の予定
              </h3>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-black/20 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{event.title}</div>
                          <div className="text-slate-400 text-xs mt-1">{event.description}</div>
                          <div className="text-slate-500 text-xs mt-1">
                            {new Date(event.date).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </div>
                        </div>
                        <div 
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: event.color }}
                        >
                          {event.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm">予定はありません</div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3 text-2xl">⚡</span>
                クイックアクション
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-xl font-medium hover:from-blue-500 hover:to-blue-400 transition-all duration-300">
                  ➕ 新しい予定を追加
                </button>
                <Link 
                  href="/student/study/new"
                  className="block w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-xl font-medium text-center hover:from-green-500 hover:to-green-400 transition-all duration-300"
                >
                  📚 学習記録を追加
                </Link>
                <Link 
                  href="/student/study"
                  className="block w-full bg-gradient-to-r from-slate-700 to-slate-600 text-white px-4 py-3 rounded-xl font-medium text-center hover:from-slate-600 hover:to-slate-500 transition-all duration-300"
                >
                  📋 学習記録一覧
                </Link>
              </div>
            </div>

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {selectedDate.date.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h3>
                
                {selectedDate.events.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDate.events.map((event) => (
                      <div key={event.id} className="p-3 bg-black/20 rounded-lg">
                        <div className="text-white font-medium">{event.title}</div>
                        <div className="text-slate-400 text-sm mt-1">{event.description}</div>
                        <div 
                          className="inline-block px-2 py-1 rounded text-xs text-white mt-2"
                          style={{ backgroundColor: event.color }}
                        >
                          {event.type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <div className="text-sm">この日に予定はありません</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}