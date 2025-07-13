'use client'

import Link from 'next/link'

export default function WeeklyChart({ weeklyData = [] }) {
  const maxTime = Math.max(...weeklyData.map(day => day.totalMinutes), 60) // 最低60分をmax値に設定
  
  const getDayName = (dayIndex) => {
    const days = ['月', '火', '水', '木', '金', '土', '日']
    return days[dayIndex] || ''
  }
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}h${mins}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${mins}m`
    }
  }

  return (
    <div className="space-y-2">
      {weeklyData.map((day, index) => {
        const widthPercentage = maxTime > 0 ? (day.totalMinutes / maxTime) * 100 : 0
        const isToday = day.isToday
        
        return (
          <Link 
            key={index} 
            href={`/student/study/daily/${day.date}`}
            className="block group"
          >
            <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
              isToday ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-black/20'
            }`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`text-sm font-medium w-6 ${
                  isToday ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {getDayName(day.dayOfWeek)}
                </div>
                
                <div className="flex-1 relative">
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isToday ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-slate-500 to-slate-400'
                      }`}
                      style={{ width: `${Math.max(widthPercentage, 2)}%` }}
                    />
                  </div>
                </div>
                
                <div className={`text-sm font-medium min-w-[50px] text-right ${
                  isToday ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {day.totalMinutes > 0 ? formatTime(day.totalMinutes) : '0m'}
                </div>
              </div>
              
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}