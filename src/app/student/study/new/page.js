'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { safeBase64Encode } from '@/lib/base64'
import Link from 'next/link'
import TimePicker from '@/components/TimePicker'

export default function NewStudyRecord() {
  const [formData, setFormData] = useState({
    study_date: new Date().toISOString().split('T')[0], // 今日の日付
    subject_id: '',
    sub_subject_id: '',
    hours: 0,
    minutes: 0,
    memo: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const subjects = [
    { id: 1, name: '国語', color: '#E74C3C', icon: '📖' },
    { id: 2, name: '数学', color: '#3498DB', icon: '📊' },
    { id: 3, name: '英語', color: '#2ECC71', icon: '🌍' },
    { id: 4, name: '理科', color: '#9B59B6', icon: '🔬' },
    { id: 5, name: '社会', color: '#F39C12', icon: '🏛️' },
    { id: 6, name: 'その他', color: '#95A5A6', icon: '📝' }
  ]

  const subSubjects = {
    1: [ // 国語
      { id: 1, name: '現代文B' },
      { id: 2, name: '古典B' },
      { id: 3, name: '国語総合' }
    ],
    2: [ // 数学
      { id: 4, name: '数学Ⅰ' },
      { id: 5, name: '数学Ⅱ' },
      { id: 6, name: '数学Ⅲ' },
      { id: 7, name: '数学A' },
      { id: 8, name: '数学B' },
      { id: 9, name: '数学C' }
    ],
    3: [ // 英語
      { id: 10, name: '英語コミュニケーション' },
      { id: 11, name: '論理・表現' },
      { id: 12, name: '英語長文読解' },
      { id: 13, name: '英文法・語法' },
      { id: 14, name: '英単語・熟語' }
    ],
    4: [ // 理科
      { id: 15, name: '物理基礎' },
      { id: 16, name: '物理' },
      { id: 17, name: '化学基礎' },
      { id: 18, name: '化学' },
      { id: 19, name: '生物基礎' },
      { id: 20, name: '生物' },
      { id: 21, name: '地学基礎' },
      { id: 22, name: '地学' }
    ],
    5: [ // 社会
      { id: 23, name: '現代社会' },
      { id: 24, name: '倫理' },
      { id: 25, name: '政治・経済' },
      { id: 26, name: '日本史A' },
      { id: 27, name: '日本史B' },
      { id: 28, name: '世界史A' },
      { id: 29, name: '世界史B' },
      { id: 30, name: '地理A' },
      { id: 31, name: '地理B' }
    ]
  }


  const handleSubjectSelect = (subjectId) => {
    setFormData(prev => ({ ...prev, subject_id: subjectId, sub_subject_id: '' }))
  }

  const handleSubSubjectSelect = (subSubjectId) => {
    setFormData(prev => ({ ...prev, sub_subject_id: subSubjectId }))
  }
  
  const handleTimeChange = useCallback((hours, minutes) => {
    setFormData(prev => ({ ...prev, hours, minutes }))
  }, [])


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
      const response = await fetch('/api/study-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${safeBase64Encode(JSON.stringify(user))}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '保存中にエラーが発生しました')
        return
      }

      // 成功時の処理
      router.push('/student/study')
    } catch (error) {
      console.error('Submit error:', error)
      setError('保存中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">学習記録を追加</h1>
          <Link
            href="/student"
            className="text-slate-300 hover:text-white transition-colors font-medium"
          >
            ← ダッシュボードに戻る
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
                <div className="flex justify-start">
                  <TimePicker 
                    hours={formData.hours}
                    minutes={formData.minutes}
                    onTimeChange={handleTimeChange}
                  />
                </div>
                <div className="text-slate-400 text-xs mt-2">
                  スクロールまたはクリックで選択
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

            {/* サブカテゴリ選択 */}
            {formData.subject_id && subSubjects[formData.subject_id] && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-lg font-medium text-white mb-4">
                  サブカテゴリ選択（任意）
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {subSubjects[formData.subject_id].map((subSubject) => (
                    <button
                      key={subSubject.id}
                      type="button"
                      onClick={() => handleSubSubjectSelect(subSubject.id)}
                      className={`p-3 rounded-lg border transition-all duration-300 text-sm ${
                        formData.sub_subject_id === subSubject.id
                          ? 'border-white bg-white/10 text-white'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {subSubject.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              {isLoading ? '保存中...' : '学習記録を保存'}
            </button>
            <Link
              href="/student"
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