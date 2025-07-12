'use client'

import { useState, useEffect } from 'react'

export default function GoalModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentGoal = 120 
}) {
  const [goalMinutes, setGoalMinutes] = useState(currentGoal)
  const [goalHours, setGoalHours] = useState(Math.floor(currentGoal / 60))
  const [goalMins, setGoalMins] = useState(currentGoal % 60)

  useEffect(() => {
    if (isOpen) {
      setGoalMinutes(currentGoal)
      setGoalHours(Math.floor(currentGoal / 60))
      setGoalMins(currentGoal % 60)
    }
  }, [isOpen, currentGoal])

  const handleHoursChange = (hours) => {
    const h = Math.max(0, Math.min(12, parseInt(hours) || 0))
    setGoalHours(h)
    setGoalMinutes(h * 60 + goalMins)
  }

  const handleMinutesChange = (minutes) => {
    const m = Math.max(0, Math.min(59, parseInt(minutes) || 0))
    setGoalMins(m)
    setGoalMinutes(goalHours * 60 + m)
  }

  const handleQuickSet = (minutes) => {
    setGoalMinutes(minutes)
    setGoalHours(Math.floor(minutes / 60))
    setGoalMins(minutes % 60)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (goalMinutes < 15) {
      alert('目標時間は最低15分以上に設定してください')
      return
    }

    if (goalMinutes > 720) { // 12時間
      alert('目標時間は最大12時間まで設定できます')
      return
    }

    onSave(goalMinutes)
  }

  if (!isOpen) return null

  const quickOptions = [
    { label: '30分', value: 30 },
    { label: '1時間', value: 60 },
    { label: '1.5時間', value: 90 },
    { label: '2時間', value: 120 },
    { label: '3時間', value: 180 },
    { label: '4時間', value: 240 }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">
            📊 1日の学習目標を設定
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            毎日の学習時間の目標を設定してモチベーションを保ちましょう
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* 現在の目標表示 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {goalHours > 0 && `${goalHours}時間`}
                {goalMins > 0 && `${goalMins}分`}
                {goalMinutes === 0 && '未設定'}
              </div>
              <div className="text-slate-400 text-sm">設定中の目標時間</div>
            </div>

            {/* 時間設定 */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                詳細設定
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">時間</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={goalHours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-white text-center focus:border-white/30 focus:outline-none transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">分</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={goalMins}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-white text-center focus:border-white/30 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* クイック設定 */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                クイック設定
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleQuickSet(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                      goalMinutes === option.value
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 目標の効果説明 */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-400 mt-0.5">💡</div>
                <div>
                  <div className="text-blue-400 font-medium text-sm mb-1">目標設定のメリット</div>
                  <div className="text-slate-300 text-xs leading-relaxed">
                    • 毎日の進捗が視覚的に分かりやすくなります<br/>
                    • 達成感を得られてモチベーションが向上します<br/>
                    • 学習習慣の定着をサポートします
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
              目標を設定
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}