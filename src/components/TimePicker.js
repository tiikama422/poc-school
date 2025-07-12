'use client'

import { useEffect, useRef, useState } from 'react'

export default function TimePicker({ hours, minutes, onTimeChange }) {
  const [selectedHour, setSelectedHour] = useState(hours || 0)
  const [selectedMinute, setSelectedMinute] = useState(minutes || 0)
  const [isTouching, setIsTouching] = useState(false)
  
  const hourRef = useRef(null)
  const minuteRef = useRef(null)
  
  const hourOptions = Array.from({ length: 25 }, (_, i) => i)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)
  
  const itemHeight = 40
  const visibleItems = 5
  
  useEffect(() => {
    onTimeChange(selectedHour, selectedMinute)
  }, [selectedHour, selectedMinute, onTimeChange])
  
  useEffect(() => {
    if (hourRef.current) {
      hourRef.current.scrollTop = selectedHour * itemHeight
    }
    if (minuteRef.current) {
      minuteRef.current.scrollTop = (selectedMinute / 5) * itemHeight
    }
  }, [])
  
  const handleScroll = (e, type) => {
    if (isTouching) return
    
    const scrollTop = e.target.scrollTop
    const index = Math.round(scrollTop / itemHeight)
    
    if (type === 'hour') {
      const newHour = Math.max(0, Math.min(24, index))
      setSelectedHour(newHour)
      e.target.scrollTop = newHour * itemHeight
    } else {
      const newMinuteIndex = Math.max(0, Math.min(11, index))
      const newMinute = newMinuteIndex * 5
      setSelectedMinute(newMinute)
      e.target.scrollTop = newMinuteIndex * itemHeight
    }
  }
  
  const handleWheel = (e, type) => {
    e.preventDefault()
    const direction = e.deltaY > 0 ? 1 : -1
    
    if (type === 'hour') {
      const newHour = Math.max(0, Math.min(24, selectedHour + direction))
      setSelectedHour(newHour)
      if (hourRef.current) {
        hourRef.current.scrollTop = newHour * itemHeight
      }
    } else {
      const currentIndex = selectedMinute / 5
      const newIndex = Math.max(0, Math.min(11, currentIndex + direction))
      const newMinute = newIndex * 5
      setSelectedMinute(newMinute)
      if (minuteRef.current) {
        minuteRef.current.scrollTop = newIndex * itemHeight
      }
    }
  }
  
  const handleClick = (value, type) => {
    if (type === 'hour') {
      setSelectedHour(value)
      if (hourRef.current) {
        hourRef.current.scrollTop = value * itemHeight
      }
    } else {
      setSelectedMinute(value)
      if (minuteRef.current) {
        minuteRef.current.scrollTop = (value / 5) * itemHeight
      }
    }
  }
  
  const renderPickerColumn = (options, selectedValue, type, ref) => {
    const isHour = type === 'hour'
    
    return (
      <div className="flex flex-col items-center flex-1">
        <div className="text-sm text-slate-400 mb-2">{isHour ? '時間' : '分'}</div>
        <div className="relative w-full max-w-[100px]">
          <div 
            ref={ref}
            className="h-[200px] overflow-y-auto scrollbar-hide picker-scroll"
            onScroll={(e) => handleScroll(e, type)}
            onWheel={(e) => handleWheel(e, type)}
            onTouchStart={() => setIsTouching(true)}
            onTouchEnd={() => {
              setIsTouching(false)
              setTimeout(() => {
                const scrollTop = ref.current?.scrollTop || 0
                const index = Math.round(scrollTop / itemHeight)
                if (type === 'hour') {
                  const newHour = Math.max(0, Math.min(24, index))
                  setSelectedHour(newHour)
                  if (ref.current) ref.current.scrollTop = newHour * itemHeight
                } else {
                  const newMinuteIndex = Math.max(0, Math.min(11, index))
                  const newMinute = newMinuteIndex * 5
                  setSelectedMinute(newMinute)
                  if (ref.current) ref.current.scrollTop = newMinuteIndex * itemHeight
                }
              }, 50)
            }}
          >
            <div className="py-[80px]">
              {options.map((value) => (
                <div
                  key={value}
                  onClick={() => handleClick(value, type)}
                  className={`h-[40px] flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    selectedValue === value 
                      ? 'text-white text-lg font-semibold scale-110' 
                      : 'text-slate-500 text-base hover:text-slate-300'
                  }`}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-black/90 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-black/90 to-transparent"></div>
            <div className="absolute top-[80px] left-0 right-0 h-[40px] border-t border-b border-white/20"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex justify-center gap-4 sm:gap-8">
        {renderPickerColumn(hourOptions, selectedHour, 'hour', hourRef)}
        {renderPickerColumn(minuteOptions, selectedMinute, 'minute', minuteRef)}
      </div>
      
      <div className="mt-4 text-center text-slate-300 text-sm sm:text-base">
        選択中: {selectedHour}時間{selectedMinute}分
      </div>
      
      <div className="mt-3 text-center text-slate-500 text-xs">
        ホイールまたはスクロールで選択
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .picker-scroll {
          scroll-behavior: smooth;
          scroll-snap-type: y mandatory;
        }
        .picker-scroll > div > div {
          scroll-snap-align: center;
        }
        
        @media (max-width: 640px) {
          .picker-scroll {
            touch-action: pan-y;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  )
}