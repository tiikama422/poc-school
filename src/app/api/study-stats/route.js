import { createClient } from '@supabase/supabase-js'
import { safeBase64Decode } from '@/lib/base64'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Authorization header is required' }, { status: 401 })
    }

    // セッションユーザーの取得
    let sessionUser
    try {
      const token = authHeader.replace('Bearer ', '')
      sessionUser = JSON.parse(safeBase64Decode(token))
    } catch (error) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 学生権限チェック
    if (!sessionUser || sessionUser.userType !== 'student') {
      return Response.json({ error: 'Student access required' }, { status: 403 })
    }

    // 統計データの取得
    const stats = await getStudyStats(sessionUser.email)

    return Response.json({ 
      success: true, 
      data: stats
    })
  } catch (error) {
    console.error('Study stats API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ローカル日付文字列を取得するヘルパー関数
function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 学習統計データの取得
async function getStudyStats(studentEmail) {
  try {
    const today = new Date()
    const todayStr = getLocalDateString(today)
    
    // 今週の開始日（月曜日）- ローカルタイムゾーン
    const weekStart = new Date(today)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    const weekStartStr = getLocalDateString(weekStart)

    // 今月の開始日
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthStartStr = getLocalDateString(monthStart)

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
    const yesterdayStr = getLocalDateString(yesterday)
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
    const dateStr = getLocalDateString(currentDate)
    
    const { data, error } = await supabase
      .from('study_records')
      .select('hours, minutes')
      .eq('student_email', studentEmail)
      .eq('study_date', dateStr)

    let totalMinutes = 0
    if (!error && data) {
      totalMinutes = data.reduce((sum, record) => sum + (record.hours || 0) * 60 + (record.minutes || 0), 0)
    }

    const today = getLocalDateString(new Date())
    
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

  if (!data || data.length === 0) {
    return { totalHours: 0, totalMinutes: 0, recordCount: 0, subjectCount: 0 }
  }

  let totalMinutes = 0
  const subjects = new Set()

  data.forEach(record => {
    totalMinutes += (record.hours || 0) * 60 + (record.minutes || 0)
    if (record.subject_id) {
      subjects.add(record.subject_id)
    }
  })

  return {
    totalHours: Math.floor(totalMinutes / 60),
    totalMinutes,
    recordCount: data.length,
    subjectCount: subjects.size
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

  if (!data || data.length === 0) {
    return { totalHours: 0, totalMinutes: 0, recordCount: 0, studyDays: 0, mostStudiedSubject: null }
  }

  let totalMinutes = 0
  const studyDates = new Set()
  const subjectMinutes = {}

  data.forEach(record => {
    const minutes = (record.hours || 0) * 60 + (record.minutes || 0)
    totalMinutes += minutes
    studyDates.add(record.study_date)
    
    if (record.subject_id) {
      subjectMinutes[record.subject_id] = (subjectMinutes[record.subject_id] || 0) + minutes
    }
  })

  // 最も学習した科目を取得
  let mostStudiedSubject = null
  let maxMinutes = 0
  for (const [subjectId, minutes] of Object.entries(subjectMinutes)) {
    if (minutes > maxMinutes) {
      maxMinutes = minutes
      mostStudiedSubject = parseInt(subjectId)
    }
  }

  return {
    totalHours: Math.floor(totalMinutes / 60),
    totalMinutes,
    recordCount: data.length,
    studyDays: studyDates.size,
    mostStudiedSubject
  }
}

// 科目別統計を取得
async function getSubjectStats(studentEmail, startDate, endDate) {
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
    .gte('study_date', startDate)
    .lte('study_date', endDate)

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
        totalHours: 0,
        displayMinutes: 0
      }
    }
    
    const totalMinutes = subjectData[subject.id].totalHours * 60 + subjectData[subject.id].displayMinutes + minutes
    subjectData[subject.id].totalHours = Math.floor(totalMinutes / 60)
    subjectData[subject.id].displayMinutes = totalMinutes % 60
  })
  
  return Object.values(subjectData)
}

// 最近の学習記録を取得
async function getRecentRecords(studentEmail, limit = 5) {
  const { data, error } = await supabase
    .from('study_records')
    .select(`
      id,
      study_date,
      hours,
      minutes,
      memo,
      subjects (
        id,
        name,
        color
      )
    `)
    .eq('student_email', studentEmail)
    .order('study_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Recent records error:', error)
    return []
  }

  return data || []
}

// 学習連続日数を取得
async function getStudyStreak(studentEmail) {
  const { data, error } = await supabase
    .from('study_records')
    .select('study_date')
    .eq('student_email', studentEmail)
    .order('study_date', { ascending: false })

  if (error || !data) {
    return 0
  }

  // 日付ごとにグループ化
  const studyDates = [...new Set(data.map(record => record.study_date))].sort().reverse()
  
  if (studyDates.length === 0) {
    return 0
  }

  let streak = 0
  const today = getLocalDateString(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  // 今日または昨日から開始
  let startDate = studyDates[0] === today ? today : (studyDates[0] === yesterdayStr ? yesterdayStr : null)
  
  if (!startDate) {
    return 0
  }

  // 連続日数をカウント
  let currentDate = new Date(startDate)
  for (const studyDate of studyDates) {
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