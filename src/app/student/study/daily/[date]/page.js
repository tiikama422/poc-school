'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { safeBase64Encode } from '@/lib/base64'
import Link from 'next/link'
import SubjectPieChart from '@/components/SubjectPieChart'

export default function DailyStudyDetail() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyData, setDailyData] = useState(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()

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
      await loadDailyData(sessionUser, params.date)
      setLoading(false)
    }

    checkSession()
  }, [router, params.date])

  const loadDailyData = async (user, date) => {
    try {
      if (!user) {
        setError('認証エラーが発生しました')
        return
      }
      
      const response = await fetch(`/.netlify/functions/study-daily?date=${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        setDailyData(result.data)
      } else {
        setError(result.error || 'データの読み込みに失敗しました')
      }
    } catch (error) {
      console.error('Load daily data error:', error)
      setError('データの読み込み中にエラーが発生しました')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    const dayOfWeek = dayNames[date.getDay()]
    
    return {
      formatted: date.toLocaleDateString('ja-JP', { 
        month: 'numeric',
        day: 'numeric' 
      }),
      dayOfWeek: dayOfWeek
    }
  }

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

  const handleEdit = (recordId) => {
    router.push(`/student/study/${recordId}/edit`)
  }

  const handleDelete = async (recordId) => {
    if (!confirm('この学習記録を削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/.netlify/functions/study-records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        }
      })

      if (response.ok) {
        await loadDailyData(user, params.date)
      } else {
        const result = await response.json()
        setError(result.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError('削除中にエラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <Link 
              href="/student"
              className="text-blue-400 hover:text-blue-300"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const dateInfo = formatDate(params.date)
  const totalMinutes = dailyData?.records?.reduce((sum, record) => 
    sum + (record.hours || 0) * 60 + (record.minutes || 0), 0) || 0
  const subjectCount = new Set(dailyData?.records?.map(record => record.subject_id)).size

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-white tracking-wide">
              {dateInfo.formatted}({dateInfo.dayOfWeek})の記録
            </h1>
            <div className="mt-2 flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-slate-300 text-sm">
              <span>合計: <span className="text-blue-400 font-medium">{formatTime(totalMinutes)}</span></span>
              <span>科目数: <span className="text-green-400 font-medium">{subjectCount}科目</span></span>
            </div>
          </div>
          <Link
            href="/student"
            className="text-slate-300 hover:text-white transition-colors font-medium text-center py-2 px-3 rounded text-sm whitespace-nowrap"
          >
            戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Charts and Summary */}
          <div className="lg:col-span-1 space-y-4">
            {/* Subject Balance */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2 text-lg">📊</span>
                科目別内訳
              </h2>
              <SubjectPieChart subjects={dailyData?.subjectSummary || []} />
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                <span className="mr-2 text-lg">⚡</span>
                アクション
              </h2>
              <div className="space-y-2">
                <Link 
                  href="/student/study/new"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2.5 rounded-xl font-medium text-center hover:from-blue-500 hover:to-blue-400 transition-all duration-300 text-sm"
                >
                  記録を追加
                </Link>
                <Link 
                  href="/student/study"
                  className="block w-full bg-gradient-to-r from-slate-700 to-slate-600 text-white px-3 py-2.5 rounded-xl font-medium text-center hover:from-slate-600 hover:to-slate-500 transition-all duration-300 text-sm"
                >
                  記録一覧
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Study Log */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2 text-lg">📝</span>
                学習ログ
              </h2>
              
              {dailyData?.records && dailyData.records.length > 0 ? (
                <div className="space-y-4">
                  {dailyData.records
                    .sort((a, b) => new Date(`${a.study_date}T${a.created_at}`) - new Date(`${b.study_date}T${b.created_at}`))
                    .map((record, index) => (
                    <div key={record.id} className="bg-black/20 rounded-lg p-3 sm:p-4 hover:bg-black/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {/* Subject Icon */}
                          <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-lg flex-shrink-0"
                            style={{ backgroundColor: `${record.subjects?.color || '#95A5A6'}20` }}
                          >
                            {getSubjectIcon(record.subjects?.name)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 mb-2">
                              <h3 className="text-base font-medium text-white">
                                {record.subjects?.name || '不明な科目'}
                              </h3>
                              <span className="text-blue-400 font-medium text-sm">
                                {formatTime((record.hours || 0) * 60 + (record.minutes || 0))}
                              </span>
                            </div>
                            
                            {record.memo && (
                              <p className="text-slate-300 text-sm leading-relaxed">
                                {record.memo}
                              </p>
                            )}
                            
                            <div className="mt-2 text-xs text-slate-400">
                              記録時刻: {new Date(record.created_at).toLocaleTimeString('ja-JP', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-2 sm:ml-4">
                          <button
                            onClick={() => handleEdit(record.id)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                            title="編集"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="削除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <span className="text-4xl">📝</span>
                  </div>
                  <p className="text-slate-400 mb-4">この日の学習記録はありません</p>
                  <Link 
                    href="/student/study/new"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    学習記録を追加
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}