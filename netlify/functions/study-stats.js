const { createClient } = require('@supabase/supabase-js')
const { safeBase64Decode } = require('./lib/base64')

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

exports.handler = async (event, context) => {
  // CORS設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // プリフライトリクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // 環境変数のチェック
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    }
    
    // 認証チェック
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header is required' })
      }
    }

    // セッションユーザーの取得
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

    // 学生権限チェック
    if (!sessionUser || sessionUser.userType !== 'student') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Student access required' })
      }
    }

    // 統計データの取得
    const stats = await getStudyStats(sessionUser.email)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: stats
      })
    }
  } catch (error) {
    console.error('Study stats API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

// 学習統計データの取得
async function getStudyStats(studentEmail) {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // 今週の開始日（月曜日）
    const weekStart = new Date(today)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // 今月の開始日
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthStartStr = monthStart.toISOString().split('T')[0]

    // 今日の統計
    const todayStats = await getDayStats(studentEmail, todayStr)
    
    // 今週の統計
    const weekStats = await getPeriodStats(studentEmail, weekStartStr, todayStr)
    
    // 今月の統計
    const monthStats = await getPeriodStats(studentEmail, monthStartStr, todayStr)

    // 科目別統計（今週）
    const subjectStats = await getSubjectStats(studentEmail, weekStartStr, todayStr)

    // 最近の学習記録（5件）
    const recentRecords = await getRecentRecords(studentEmail, 5)

    // 学習連続日数
    const streakDays = await getStudyStreak(studentEmail)

    // 昨日の統計（比較用）
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdayStats = await getDayStats(studentEmail, yesterdayStr)

    // 週間データ（グラフ用）
    const weeklyData = await getWeeklyData(studentEmail, weekStart)

    // 今週の科目別データ（円グラフ用）
    const weeklySubjects = await getWeeklySubjectData(studentEmail, weekStartStr, todayStr)

    return {
      today: todayStats,
      yesterday: yesterdayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
      subjects: subjectStats,
      recentRecords,
      streakDays,
      dailyGoalMinutes: 120, // デフォルト目標時間（2時間）
      weeklyData,
      weeklySubjects,
      upcomingEvents: [] // 将来的に実装
    }
  } catch (error) {
    console.error('Get study stats error:', error)
    throw error
  }
}

// 週間データを取得（グラフ用）
async function getWeeklyData(studentEmail, weekStart) {
  const weeklyData = []
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart)
    currentDate.setDate(weekStart.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('study_records')
      .select('hours, minutes')
      .eq('student_email', studentEmail)
      .eq('study_date', dateStr)

    let totalMinutes = 0
    if (!error && data) {
      totalMinutes = data.reduce((sum, record) => sum + (record.hours || 0) * 60 + (record.minutes || 0), 0)
    }

    const today = new Date().toISOString().split('T')[0]
    
    weeklyData.push({
      date: dateStr,
      dayOfWeek: i, // 0=月曜日, 6=日曜日
      totalMinutes,
      isToday: dateStr === today
    })
  }
  
  return weeklyData
}

// 今週の科目別データ（円グラフ用）
async function getWeeklySubjectData(studentEmail, weekStart, weekEnd) {
  const { data, error } = await supabase
    .from('study_records')
    .select(`
      hours, 
      minutes, 
      subjects (
        id,
        name,
        color
      )
    `)
    .eq('student_email', studentEmail)
    .gte('study_date', weekStart)
    .lte('study_date', weekEnd)

  if (error || !data) {
    return []
  }

  const subjectData = {}
  
  data.forEach(record => {
    const subject = record.subjects
    if (!subject) return
    
    const minutes = (record.hours || 0) * 60 + (record.minutes || 0)
    
    if (!subjectData[subject.id]) {
      subjectData[subject.id] = {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        totalMinutes: 0
      }
    }
    
    subjectData[subject.id].totalMinutes += minutes
  })
  
  return Object.values(subjectData).filter(subject => subject.totalMinutes > 0)
}

// 1日の統計データを取得
async function getDayStats(studentEmail, date) {
  const { data, error } = await supabase
    .from('study_records')
    .select('hours, minutes, subject_id')
    .eq('student_email', studentEmail)
    .eq('study_date', date)

  if (error) {
    console.error('Database error:', error)
    return { totalHours: 0, totalMinutes: 0, recordCount: 0, subjectCount: 0 }
  }

  const totalMinutes = data.reduce((sum, record) => 
    sum + (record.hours * 60) + record.minutes, 0
  )
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  const subjectCount = new Set(data.map(r => r.subject_id)).size

  return {
    totalHours,
    totalMinutes: remainingMinutes,
    recordCount: data.length,
    subjectCount
  }
}

// 期間の統計データを取得
async function getPeriodStats(studentEmail, startDate, endDate) {
  const { data, error } = await supabase
    .from('study_records')
    .select('hours, minutes, study_date, subject_id')
    .eq('student_email', studentEmail)
    .gte('study_date', startDate)
    .lte('study_date', endDate)

  if (error) {
    console.error('Database error:', error)
    return { totalHours: 0, totalMinutes: 0, recordCount: 0, studyDays: 0, mostStudiedSubject: null }
  }

  const totalMinutes = data.reduce((sum, record) => 
    sum + (record.hours * 60) + record.minutes, 0
  )
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  const studyDays = new Set(data.map(r => r.study_date)).size

  // 最も学習した科目
  const subjectMinutes = {}
  data.forEach(record => {
    const subjectId = record.subject_id
    if (!subjectMinutes[subjectId]) {
      subjectMinutes[subjectId] = 0
    }
    subjectMinutes[subjectId] += (record.hours * 60) + record.minutes
  })

  let mostStudiedSubject = null
  let maxMinutes = 0
  for (const [subjectId, minutes] of Object.entries(subjectMinutes)) {
    if (minutes > maxMinutes) {
      maxMinutes = minutes
      mostStudiedSubject = parseInt(subjectId)
    }
  }

  return {
    totalHours,
    totalMinutes: remainingMinutes,
    recordCount: data.length,
    studyDays,
    mostStudiedSubject
  }
}

// 科目別統計データを取得
async function getSubjectStats(studentEmail, startDate, endDate) {
  const { data, error } = await supabase
    .from('study_records')
    .select(`
      hours, 
      minutes, 
      subject_id,
      subjects(name, color)
    `)
    .eq('student_email', studentEmail)
    .gte('study_date', startDate)
    .lte('study_date', endDate)

  if (error) {
    console.error('Database error:', error)
    return []
  }

  const subjectStats = {}
  data.forEach(record => {
    const subjectId = record.subject_id
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        id: subjectId,
        name: record.subjects?.name || '未知の科目',
        color: record.subjects?.color || '#95A5A6',
        totalMinutes: 0,
        recordCount: 0
      }
    }
    subjectStats[subjectId].totalMinutes += (record.hours * 60) + record.minutes
    subjectStats[subjectId].recordCount++
  })

  return Object.values(subjectStats).map(subject => ({
    ...subject,
    totalHours: Math.floor(subject.totalMinutes / 60),
    displayMinutes: subject.totalMinutes % 60
  })).sort((a, b) => b.totalMinutes - a.totalMinutes)
}

// 最近の学習記録を取得
async function getRecentRecords(studentEmail, limit = 5) {
  const { data, error } = await supabase
    .from('study_records')
    .select(`
      *,
      subjects(name, color)
    `)
    .eq('student_email', studentEmail)
    .order('study_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Database error:', error)
    return []
  }

  return data || []
}

// 学習連続日数を取得
async function getStudyStreak(studentEmail) {
  try {
    const { data, error } = await supabase
      .from('study_records')
      .select('study_date')
      .eq('student_email', studentEmail)
      .order('study_date', { ascending: false })

    if (error || !data || data.length === 0) {
      return 0
    }

    const uniqueDates = [...new Set(data.map(r => r.study_date))].sort((a, b) => b.localeCompare(a))
    
    let streak = 0
    let currentDate = new Date()
    
    for (const dateStr of uniqueDates) {
      const recordDate = new Date(dateStr)
      const diffTime = currentDate.getTime() - recordDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
        streak++
        currentDate = recordDate
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Get study streak error:', error)
    return 0
  }
}