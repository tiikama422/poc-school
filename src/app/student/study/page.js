'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import Link from 'next/link'

export default function StudyRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, week, month
  const router = useRouter()

  const subjects = {
    1: { name: '国語', color: '#E74C3C', icon: '📖' },
    2: { name: '数学', color: '#3498DB', icon: '📊' },
    3: { name: '英語', color: '#2ECC71', icon: '🌍' },
    4: { name: '理科', color: '#9B59B6', icon: '🔬' },
    5: { name: '社会', color: '#F39C12', icon: '🏛️' },
    6: { name: 'その他', color: '#95A5A6', icon: '📝' }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const user = getSessionUser()
      if (!user || user.userType !== 'student') {
        router.push('/login')
        return
      }
      
      await loadStudyRecords(user, filter)
    }

    checkAuth()
  }, [router, filter])

  const loadStudyRecords = async (user, currentFilter) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/.netlify/functions/study-records?filter=${currentFilter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${btoa(JSON.stringify(user))}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Failed to load study records:', result.error)
        setRecords([])
        return
      }

      setRecords(result.data || [])
    } catch (error) {
      console.error('Load study records error:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (hours, minutes) => {
    if (hours > 0 && minutes > 0) {
      return `${hours}時間${minutes}分`
    } else if (hours > 0) {
      return `${hours}時間`
    } else {
      return `${minutes}分`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '今日'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日'
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: '1月', 
        day: '1日' 
      })
    }
  }

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('この学習記録を削除しますか？')) {
      return
    }

    try {
      const user = getSessionUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch(`/.netlify/functions/study-records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${btoa(JSON.stringify(user))}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || '削除に失敗しました')
        return
      }

      // 成功時はレコードを再読み込み
      await loadStudyRecords(user, filter)
    } catch (error) {
      console.error('Delete record error:', error)
      alert('削除中にエラーが発生しました')
    }
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">学習記録一覧</h1>
          <div className="flex gap-4">
            <Link
              href="/student/study/new"
              className="bg-gradient-to-br from-blue-600 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300 flex items-center"
            >
              <span className="mr-2">➕</span>
              記録を追加
            </Link>
            <Link
              href="/student"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-8">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'すべて' },
              { key: 'week', label: '今週' },
              { key: 'month', label: '今月' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records List */}
        {records.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-slate-400 mb-6">
              <span className="text-6xl">📚</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">まだ学習記録がありません</h2>
            <p className="text-slate-400 mb-6">最初の学習記録を追加して、学習の進捗を記録しましょう。</p>
            <Link
              href="/student/study/new"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <span className="mr-2 text-xl">➕</span>
              最初の記録を追加
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Subject Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${subjects[record.subject_id]?.color}20` }}
                    >
                      {subjects[record.subject_id]?.icon}
                    </div>
                    
                    {/* Record Info */}
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span 
                          className="font-semibold"
                          style={{ color: subjects[record.subject_id]?.color }}
                        >
                          {subjects[record.subject_id]?.name}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-white font-medium">
                          {formatTime(record.hours, record.minutes)}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {formatDate(record.study_date)}
                      </div>
                      {record.memo && (
                        <div className="text-slate-300 text-sm mt-2 max-w-md">
                          {record.memo.length > 50 ? `${record.memo.substring(0, 50)}...` : record.memo}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/student/study/${record.id}/edit`}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}