'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { safeBase64Encode } from '@/lib/base64'
import Link from 'next/link'
import EventModal from '@/components/EventModal'

export default function StudyCalendar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [memos, setMemos] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [currentMemo, setCurrentMemo] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventModalDate, setEventModalDate] = useState(null)
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
      await loadMemos(sessionUser)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const loadEvents = async (user) => {
    try {
      const response = await fetch('/.netlify/functions/events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setEvents(result.data || [])
      } else {
        console.error('Failed to load events:', result.error)
        setEvents([])
      }
    } catch (error) {
      console.error('Load events error:', error)
      setEvents([])
    }
  }

  const loadMemos = async (user) => {
    try {
      // 実際の実装では、APIからメモデータを取得
      // 現在はサンプルデータを使用
      const sampleMemos = {
        '2025-07-12': '今日は数学の復習を頑張った！',
        '2025-07-13': '英語のリスニング練習をした',
        '2025-07-14': '物理の公式を整理した'
      }
      setMemos(sampleMemos)
    } catch (error) {
      console.error('Load memos error:', error)
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
      const dateString = day.date.toISOString().split('T')[0]
      setModalDate(day.date)
      setCurrentMemo(memos[dateString] || '')
      setIsEditing(!!memos[dateString])
      setShowModal(true)
    }
  }

  const handleSaveMemo = async () => {
    if (!modalDate) return
    
    const dateString = modalDate.toISOString().split('T')[0]
    
    if (currentMemo.trim()) {
      // メモを保存
      setMemos(prev => ({ ...prev, [dateString]: currentMemo.trim() }))
    } else {
      // 空の場合は削除
      setMemos(prev => {
        const newMemos = { ...prev }
        delete newMemos[dateString]
        return newMemos
      })
    }
    
    setShowModal(false)
    setCurrentMemo('')
    setModalDate(null)
  }

  const handleDeleteMemo = async () => {
    if (!modalDate) return
    
    if (confirm('このメモを削除しますか？')) {
      const dateString = modalDate.toISOString().split('T')[0]
      setMemos(prev => {
        const newMemos = { ...prev }
        delete newMemos[dateString]
        return newMemos
      })
      setShowModal(false)
      setCurrentMemo('')
      setModalDate(null)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentMemo('')
    setModalDate(null)
  }

  // 予定関連の関数
  const handleAddEvent = (date = null) => {
    setEditingEvent(null)
    setEventModalDate(date)
    setShowEventModal(true)
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setEventModalDate(null)
    setShowEventModal(true)
  }

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        // 更新
        const response = await fetch(`/.netlify/functions/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
          },
          body: JSON.stringify(eventData)
        })

        if (response.ok) {
          await loadEvents(user)
          setShowEventModal(false)
          setEditingEvent(null)
        } else {
          const result = await response.json()
          alert('予定の更新に失敗しました: ' + result.error)
        }
      } else {
        // 新規作成
        const response = await fetch('/.netlify/functions/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
          },
          body: JSON.stringify(eventData)
        })

        if (response.ok) {
          await loadEvents(user)
          setShowEventModal(false)
        } else {
          const result = await response.json()
          alert('予定の作成に失敗しました: ' + result.error)
        }
      }
    } catch (error) {
      console.error('Save event error:', error)
      alert('予定の保存中にエラーが発生しました')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('この予定を削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/.netlify/functions/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        }
      })

      if (response.ok) {
        await loadEvents(user)
      } else {
        const result = await response.json()
        alert('予定の削除に失敗しました: ' + result.error)
      }
    } catch (error) {
      console.error('Delete event error:', error)
      alert('予定の削除中にエラーが発生しました')
    }
  }

  const handleCloseEventModal = () => {
    setShowEventModal(false)
    setEditingEvent(null)
    setEventModalDate(null)
  }

  const getCharacterCount = (text) => {
    // 全角文字を2、半角文字を1としてカウント
    let count = 0
    for (let char of text) {
      count += char.match(/[^\x01-\x7E]/) ? 2 : 1
    }
    return count
  }

  const isOverLimit = (text) => {
    return getCharacterCount(text) > 200
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
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-wide">学習予定カレンダー</h1>
          <Link
            href="/student"
            className="text-slate-300 hover:text-white transition-colors font-medium"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
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
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative min-h-[48px] md:min-h-[80px] p-2 rounded-lg cursor-pointer transition-all duration-200
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
                    <div className="flex justify-between items-start">
                      <div className={`text-sm font-medium ${
                        day.isCurrentMonth ? 'text-white' : 'text-slate-600'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      
                      {/* Indicators */}
                      <div className="flex gap-1">
                        {/* Event indicator */}
                        {day.events.length > 0 && (
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        )}
                        {/* Memo indicator */}
                        {memos[day.date.toISOString().split('T')[0]] && (
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    {/* Events */}
                    <div className="mt-1 space-y-1">
                      {day.events.slice(0, 1).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className="text-xs px-1 py-0.5 rounded text-white truncate"
                          style={{ backgroundColor: event.color }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 1 && (
                        <div className="text-xs text-slate-400">
                          +{day.events.length - 1}件
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
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3 text-xl sm:text-2xl">📅</span>
                近日の予定
              </h3>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
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
                        <div className="flex items-center gap-2 ml-2">
                          <div 
                            className="px-2 py-1 rounded text-xs text-white"
                            style={{ backgroundColor: event.color }}
                          >
                            {event.type}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                              title="編集"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                              title="削除"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
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
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3 text-xl sm:text-2xl">⚡</span>
                クイックアクション
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleAddEvent()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-xl font-medium hover:from-blue-500 hover:to-blue-400 transition-all duration-300"
                >
                  📅 新しい予定を追加
                </button>
                <button 
                  onClick={() => {
                    const today = new Date()
                    setModalDate(today)
                    setCurrentMemo(memos[today.toISOString().split('T')[0]] || '')
                    setIsEditing(!!memos[today.toISOString().split('T')[0]])
                    setShowModal(true)
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-purple-400 transition-all duration-300"
                >
                  📝 今日のメモを追加
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

            {/* Today's Memo */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3 text-xl sm:text-2xl">📝</span>
                今日のメモ
              </h3>
              
              {(() => {
                const today = new Date().toISOString().split('T')[0]
                const todayMemo = memos[today]
                return todayMemo ? (
                  <div className="p-3 bg-black/20 rounded-lg">
                    <div className="text-white text-sm">{todayMemo}</div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <div className="text-sm">今日のメモはまだありません</div>
                    <button
                      onClick={() => {
                        const today = new Date()
                        setModalDate(today)
                        setCurrentMemo('')
                        setIsEditing(false)
                        setShowModal(true)
                      }}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      メモを追加する
                    </button>
                  </div>
                )
              })()} 
            </div>
          </div>
        </div>

        {/* Event Modal */}
        <EventModal
          isOpen={showEventModal}
          onClose={handleCloseEventModal}
          onSave={handleSaveEvent}
          event={editingEvent}
          selectedDate={eventModalDate}
        />

        {/* Memo Modal */}
        {showModal && modalDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white">
                  {modalDate.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} のメモ
                </h3>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-4">
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    ひとこと日記
                  </label>
                  <textarea
                    value={currentMemo}
                    onChange={(e) => setCurrentMemo(e.target.value)}
                    placeholder="今日の学習や気づきを記録しましょう..."
                    rows="3"
                    className={`w-full px-3 py-2 bg-black/20 backdrop-blur-sm border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all duration-300 resize-none ${
                      isOverLimit(currentMemo) 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-white/10 focus:border-white/30'
                    }`}
                  />
                  <div className={`text-right text-xs mt-1 ${
                    isOverLimit(currentMemo) ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {getCharacterCount(currentMemo)}/200文字
                  </div>
                </div>

                {/* Events for this date */}
                {events.filter(event => event.date === modalDate.toISOString().split('T')[0]).length > 0 && (
                  <div className="mb-4">
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      この日の予定
                    </label>
                    <div className="space-y-2">
                      {events
                        .filter(event => event.date === modalDate.toISOString().split('T')[0])
                        .map((event) => (
                        <div key={event.id} className="p-2 bg-black/20 rounded-lg">
                          <div className="text-white text-sm font-medium">{event.title}</div>
                          <div className="text-slate-400 text-xs">{event.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 flex justify-between">
                <div className="flex gap-2">
                  {isEditing && (
                    <button
                      onClick={handleDeleteMemo}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      title="削除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={handleSaveMemo}
                    disabled={isOverLimit(currentMemo)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditing ? '更新' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}