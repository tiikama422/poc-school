const { createClient } = require('@supabase/supabase-js')
const { safeBase64Decode } = require('./lib/base64')

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ローカル日付文字列を取得するヘルパー関数
function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 週の開始日（月曜日）を取得
function getWeekStart(date) {
  const weekStart = new Date(date)
  const day = weekStart.getDay() // 0=日曜, 1=月曜, ..., 6=土曜
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // 月曜日に調整
  weekStart.setDate(diff)
  return weekStart
}

// 指定日の学習統計を取得
async function getDayStats(userId, dateStr) {
  const { data, error } = await supabase
    .from('study_records')
    .select('hours, minutes, subject_id, subjects(name, color)')
    .eq('user_id', userId)
    .eq('study_date', dateStr)

  if (error) {
    console.error('Day stats error:', error)
    return { totalMinutes: 0, recordCount: 0, subjectCount: 0 }
  }

  const totalMinutes = data.reduce((sum, record) => {
    return sum + (record.hours || 0) * 60 + (record.minutes || 0)
  }, 0)

  const uniqueSubjects = new Set(data.map(record => record.subject_id))

  return {
    totalMinutes,
    recordCount: data.length,
    subjectCount: uniqueSubjects.size
  }
}

// 期間の学習統計を取得
async function getPeriodStats(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('study_records')
    .select('hours, minutes, subject_id')
    .eq('user_id', userId)
    .gte('study_date', startDate)
    .lte('study_date', endDate)

  if (error) {
    console.error('Period stats error:', error)
    return { totalMinutes: 0, recordCount: 0, subjectCount: 0 }
  }

  const totalMinutes = data.reduce((sum, record) => {
    return sum + (record.hours || 0) * 60 + (record.minutes || 0)
  }, 0)

  const uniqueSubjects = new Set(data.map(record => record.subject_id))

  return {
    totalMinutes,
    recordCount: data.length,
    subjectCount: uniqueSubjects.size
  }
}

// 週間データを取得（グラフ用）
async function getWeeklyData(userId, weekStart) {
  const weeklyData = []
  // JST時間で今日の日付を取得
  const jstOffset = 9 * 60 // JST is UTC+9
  const now = new Date()
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000)
  const today = getLocalDateString(new Date(jstTime.getFullYear(), jstTime.getMonth(), jstTime.getDate()))
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart)
    currentDate.setDate(weekStart.getDate() + i)
    const dateStr = getLocalDateString(currentDate)
    
    const dayStats = await getDayStats(userId, dateStr)
    
    weeklyData.push({
      date: dateStr,
      dayOfWeek: i, // 0=月曜日, 6=日曜日
      totalMinutes: dayStats.totalMinutes,
      isToday: dateStr === today
    })
  }
  
  return weeklyData
}

// 週間科目別データを取得
async function getWeeklySubjectData(userId, weekStartStr, todayStr) {
  const { data, error } = await supabase
    .from('study_records')
    .select('hours, minutes, subject_id, subjects(name, color)')
    .eq('user_id', userId)
    .gte('study_date', weekStartStr)
    .lte('study_date', todayStr)

  if (error) {
    console.error('Weekly subject data error:', error)
    return []
  }

  // 科目別に集計
  const subjectMap = new Map()
  
  data.forEach(record => {
    const subjectId = record.subject_id
    const minutes = (record.hours || 0) * 60 + (record.minutes || 0)
    
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        name: record.subjects?.name || '不明',
        color: record.subjects?.color || '#95A5A6',
        totalMinutes: 0
      })
    }
    
    const existing = subjectMap.get(subjectId)
    existing.totalMinutes += minutes
  })

  return Array.from(subjectMap.values())
    .filter(subject => subject.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
}

// 学習連続日数を取得
async function getStudyStreak(userId) {
  const { data, error } = await supabase
    .from('study_records')
    .select('study_date')
    .eq('user_id', userId)
    .order('study_date', { ascending: false })

  if (error || !data || data.length === 0) {
    return 0
  }

  // ユニークな日付を取得
  const uniqueDates = [...new Set(data.map(record => record.study_date))].sort().reverse()
  
  if (uniqueDates.length === 0) {
    return 0
  }

  // JST時間で今日と昨日の日付を取得
  const jstOffset = 9 * 60 // JST is UTC+9
  const now = new Date()
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000)
  const today = getLocalDateString(new Date(jstTime.getFullYear(), jstTime.getMonth(), jstTime.getDate()))
  const yesterday = new Date(jstTime.getFullYear(), jstTime.getMonth(), jstTime.getDate())
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  // 今日または昨日から開始しているかチェック
  const latestDate = uniqueDates[0]
  if (latestDate !== today && latestDate !== yesterdayStr) {
    return 0
  }

  // 連続日数をカウント
  let streak = 0
  let currentDate = new Date(latestDate)
  
  for (const studyDate of uniqueDates) {
    const expectedDate = getLocalDateString(currentDate)
    if (studyDate === expectedDate) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

// 最近の学習記録を取得
async function getRecentRecords(userId, limit = 5) {
  const { data, error } = await supabase
    .from('study_records')
    .select('study_date, hours, minutes, subjects(name, color)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Recent records error:', error)
    return []
  }

  return data.map(record => ({
    date: record.study_date,
    totalMinutes: (record.hours || 0) * 60 + (record.minutes || 0),
    subject: record.subjects?.name || '不明'
  }))
}

// メイン関数
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // 認証チェック
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header is required' })
      }
    }

    let sessionUser
    try {
      const token = authHeader.replace('Bearer ', '')
      sessionUser = JSON.parse(safeBase64Decode(token))
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    if (!sessionUser || sessionUser.userType !== 'student') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Student access required' })
      }
    }

    // 日付計算（JST時間で統一）
    const jstOffset = 9 * 60 // JST is UTC+9
    const now = new Date()
    const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000)
    const today = new Date(jstTime.getFullYear(), jstTime.getMonth(), jstTime.getDate())
    const todayStr = getLocalDateString(today)
    
    const weekStart = getWeekStart(today)
    const weekStartStr = getLocalDateString(weekStart)
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthStartStr = getLocalDateString(monthStart)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)

    console.log('Date calculations:', {
      today: todayStr,
      weekStart: weekStartStr,
      monthStart: monthStartStr,
      yesterday: yesterdayStr
    })

    // 統計データを並行取得
    const [
      todayStats,
      yesterdayStats,
      weekStats,
      monthStats,
      weeklyData,
      weeklySubjects,
      streakDays,
      recentRecords
    ] = await Promise.all([
      getDayStats(sessionUser.id, todayStr),
      getDayStats(sessionUser.id, yesterdayStr),
      getPeriodStats(sessionUser.id, weekStartStr, todayStr),
      getPeriodStats(sessionUser.id, monthStartStr, todayStr),
      getWeeklyData(sessionUser.id, weekStart),
      getWeeklySubjectData(sessionUser.id, weekStartStr, todayStr),
      getStudyStreak(sessionUser.id),
      getRecentRecords(sessionUser.id, 5)
    ])

    const response = {
      today: todayStats,
      yesterday: yesterdayStats,
      week: weekStats,
      month: monthStats,
      weeklyData,
      weeklySubjects,
      streakDays,
      recentRecords,
      dates: {
        today: todayStr,
        weekStart: weekStartStr,
        monthStart: monthStartStr
      }
    }

    console.log('Stats response:', JSON.stringify(response, null, 2))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: response
      })
    }

  } catch (error) {
    console.error('Study stats error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}