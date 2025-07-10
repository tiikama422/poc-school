'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { safeBase64Encode } from '@/lib/base64'
import Link from 'next/link'

export default function EditStudyRecord() {
  const [formData, setFormData] = useState({
    study_date: '',
    subject_id: '',
    hours: 0,
    minutes: 0,
    memo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()

  const subjects = [
    { id: 1, name: '国語', color: '#E74C3C', icon: '📖' },
    { id: 2, name: '数学', color: '#3498DB', icon: '📊' },
    { id: 3, name: '英語', color: '#2ECC71', icon: '🌍' },
    { id: 4, name: '理科', color: '#9B59B6', icon: '🔬' },
    { id: 5, name: '社会', color: '#F39C12', icon: '🏛️' },
    { id: 6, name: 'その他', color: '#95A5A6', icon: '📝' }
  ]

  const timePresets = [
    { label: '15分', hours: 0, minutes: 15 },
    { label: '30分', hours: 0, minutes: 30 },
    { label: '1時間', hours: 1, minutes: 0 },
    { label: '2時間', hours: 2, minutes: 0 }
  ]

  useEffect(() => {
    const loadRecord = async () => {
      const user = getSessionUser()
      if (!user || user.userType !== 'student') {
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`/.netlify/functions/study-records/${params.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
          }
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || '学習記録の読み込みに失敗しました')
          return
        }

        if (result.data) {
          setFormData({
            study_date: result.data.study_date,
            subject_id: result.data.subject_id,
            hours: result.data.hours || 0,
            minutes: result.data.minutes || 0,
            memo: result.data.memo || ''
          })
        }
      } catch (error) {
        console.error('Load record error:', error)
        setError('学習記録の読み込み中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadRecord()
    }
  }, [params.id, router])

  const handleSubjectSelect = (subjectId) => {
    setFormData(prev => ({ ...prev, subject_id: subjectId }))
  }

  const handleTimePreset = (preset) => {
    setFormData(prev => ({ 
      ...prev, 
      hours: preset.hours, 
      minutes: preset.minutes 
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // バリデーション
    if (!formData.subject_id) {
      setError('教科を選択してください')
      setIsLoading(false)
      return
    }

    if (formData.hours === 0 && formData.minutes < 5) {
      setError('学習時間は最低5分以上入力してください')
      setIsLoading(false)
      return
    }

    try {
      const user = getSessionUser()
      if (!user) {
        router.push('/login')
        return
      }

      // APIエンドポイントに送信
      const response = await fetch(`/.netlify/functions/study-records/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '更新中にエラーが発生しました')
        return
      }

      // 成功時の処理
      router.push('/student/study')
    } catch (error) {
      console.error('Update error:', error)
      setError('更新中にエラーが発生しました')
    } finally {
      setIsLoading(false)
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">学習記録を編集</h1>
          <Link
            href="/student/study"
            className="text-slate-300 hover:text-white transition-colors font-medium"
          >
            ← 一覧に戻る
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: 学習日と学習時間 */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-2xl">📅</span>
              学習日・時間
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 学習日 */}
              <div>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  学習日 *
                </label>
                <input
                  type="date"
                  value={formData.study_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, study_date: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:border-white/30 focus:outline-none transition-all duration-300"
                  required
                />
              </div>

              {/* 学習時間 */}
              <div>
                <label className="block text-slate-200 text-sm font-medium mb-2">
                  学習時間 *
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={formData.hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                      className="w-20 px-3 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:border-white/30 focus:outline-none transition-all duration-300"
                    />
                    <span className="text-slate-300 ml-2">時間</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={formData.minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                      className="w-20 px-3 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:border-white/30 focus:outline-none transition-all duration-300"
                    />
                    <span className="text-slate-300 ml-2">分</span>
                  </div>
                </div>
                
                {/* プリセットボタン */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {timePresets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTimePreset(preset)}
                      className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm rounded-lg transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: 教科選択 */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-2xl">📚</span>
              教科選択 *
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSubjectSelect(subject.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.subject_id === subject.id
                      ? 'border-white bg-white/10 transform scale-105'
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                  style={{ borderColor: formData.subject_id === subject.id ? subject.color : undefined }}
                >
                  <div className="text-2xl mb-2">{subject.icon}</div>
                  <div 
                    className="font-medium"
                    style={{ color: subject.color }}
                  >
                    {subject.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: メモ */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="mr-3 text-2xl">📝</span>
              学習内容メモ（任意）
            </h2>
            
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              placeholder="今日の学習内容、理解度、感想など..."
              rows="4"
              maxLength="500"
              className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:outline-none transition-all duration-300 resize-none"
            />
            <div className="text-right text-slate-400 text-sm mt-2">
              {formData.memo.length}/500
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '更新中...' : '学習記録を更新'}
            </button>
            <Link
              href="/student/study"
              className="px-6 py-3 bg-black/20 backdrop-blur-sm text-slate-200 font-medium rounded-xl border border-white/10 hover:bg-black/30 hover:border-white/20 transition-all duration-300 text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}