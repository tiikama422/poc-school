'use client'

import { useState, useEffect } from 'react'

export default function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  event = null, 
  selectedDate = null 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'テスト',
    color: '#3498DB'
  })

  const eventTypes = [
    { value: 'テスト', color: '#3498DB', label: 'テスト' },
    { value: '小テスト', color: '#2ECC71', label: '小テスト' },
    { value: '提出物', color: '#9B59B6', label: '提出物' },
    { value: '試験', color: '#E74C3C', label: '試験' },
    { value: '行事', color: '#F39C12', label: '行事' },
    { value: 'その他', color: '#95A5A6', label: 'その他' }
  ]

  useEffect(() => {
    if (event) {
      // 編集モード
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        type: event.type || 'テスト',
        color: event.color || '#3498DB'
      })
    } else if (selectedDate) {
      // 新規作成モード（日付指定）
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const day = selectedDate.getDate()
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      setFormData({
        title: '',
        description: '',
        date: dateString,
        type: 'テスト',
        color: '#3498DB'
      })
    } else {
      // 新規作成モード（日付未指定）
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth() + 1
      const day = today.getDate()
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      setFormData({
        title: '',
        description: '',
        date: dateString,
        type: 'テスト',
        color: '#3498DB'
      })
    }
  }, [event, selectedDate, isOpen])

  const handleTypeChange = (type) => {
    const selectedType = eventTypes.find(t => t.value === type)
    setFormData(prev => ({
      ...prev,
      type: type,
      color: selectedType?.color || '#3498DB'
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.date) {
      alert('タイトルと日付は必須です')
      return
    }

    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-lg mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">
            {event ? '予定を編集' : '新しい予定を追加'}
          </h3>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* タイトル */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                タイトル *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例：数学テスト"
                className="w-full px-3 py-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-white/30 focus:outline-none transition-all duration-300"
                required
              />
            </div>

            {/* 日付 */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                日付 *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:border-white/30 focus:outline-none transition-all duration-300"
                required
              />
            </div>

            {/* 種類 */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                種類 *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 text-center ${
                      formData.type === type.value
                        ? 'border-white bg-white/10 transform scale-105'
                        : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    }`}
                    style={{ 
                      borderColor: formData.type === type.value ? type.color : undefined,
                      backgroundColor: formData.type === type.value ? `${type.color}20` : undefined
                    }}
                  >
                    <div 
                      className="font-medium text-sm"
                      style={{ color: type.color }}
                    >
                      {type.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                説明（任意）
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例：数学Ⅱ 微分・積分"
                rows="3"
                className="w-full px-3 py-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-white/30 focus:outline-none transition-all duration-300 resize-none"
              />
            </div>

            {/* プレビュー */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                プレビュー
              </label>
              <div className="p-3 bg-black/20 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">
                      {formData.title || 'タイトルを入力してください'}
                    </div>
                    {formData.description && (
                      <div className="text-slate-400 text-xs mt-1">
                        {formData.description}
                      </div>
                    )}
                    <div className="text-slate-500 text-xs mt-1">
                      {formData.date ? new Date(formData.date).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      }) : '日付を選択してください'}
                    </div>
                  </div>
                  <div 
                    className="px-2 py-1 rounded text-xs text-white ml-2"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.type}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              {event ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}