'use client'

export default function SubjectPieChart({ subjects = [] }) {
  const total = subjects.reduce((sum, subject) => sum + subject.totalMinutes, 0)
  
  if (total === 0 || subjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">学習データなし</div>
        </div>
      </div>
    )
  }

  let currentAngle = 0
  const radius = 60
  const centerX = 80
  const centerY = 80

  const segments = subjects.map((subject) => {
    const percentage = (subject.totalMinutes / total) * 100
    const angle = (subject.totalMinutes / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    currentAngle += angle

    // SVG path for pie slice
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const largeArc = angle > 180 ? 1 : 0
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')

    return {
      ...subject,
      pathData,
      percentage: Math.round(percentage)
    }
  })

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

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Pie Chart */}
      <div className="relative">
        <svg width="160" height="160" className="transform -rotate-90">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {formatTime(total)}
            </div>
            <div className="text-xs text-slate-400">合計</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-300">{segment.name}</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">
                {formatTime(segment.totalMinutes)}
              </div>
              <div className="text-xs text-slate-400">
                {segment.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}