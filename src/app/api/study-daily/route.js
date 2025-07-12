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
      return Response.json({ error: 'Invalid authorization token' }, { status: 401 })
    }

    if (!sessionUser || sessionUser.userType !== 'student') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // 日付パラメータを取得
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return Response.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // 日付の妥当性チェック
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return Response.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const dateString = targetDate.toISOString().split('T')[0]

    // その日の学習記録を取得
    const { data: records, error: recordsError } = await supabase
      .from('study_records')
      .select(`
        id,
        study_date,
        hours,
        minutes,
        memo,
        created_at,
        subjects (
          id,
          name,
          color
        )
      `)
      .eq('user_id', sessionUser.id)
      .eq('study_date', dateString)
      .order('created_at', { ascending: true })

    if (recordsError) {
      console.error('Records fetch error:', recordsError)
      return Response.json({ error: 'Failed to fetch study records' }, { status: 500 })
    }

    // 科目別サマリーを計算
    const subjectSummary = {}
    let totalMinutes = 0

    records.forEach(record => {
      const minutes = (record.hours || 0) * 60 + (record.minutes || 0)
      totalMinutes += minutes

      const subjectId = record.subjects?.id
      const subjectName = record.subjects?.name || '不明な科目'
      const subjectColor = record.subjects?.color || '#95A5A6'

      if (!subjectSummary[subjectId]) {
        subjectSummary[subjectId] = {
          id: subjectId,
          name: subjectName,
          color: subjectColor,
          totalMinutes: 0
        }
      }
      subjectSummary[subjectId].totalMinutes += minutes
    })

    const subjectSummaryArray = Object.values(subjectSummary)

    return Response.json({
      success: true,
      data: {
        date: dateString,
        records: records || [],
        subjectSummary: subjectSummaryArray,
        totalMinutes,
        totalTime: {
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60
        },
        recordCount: records?.length || 0,
        subjectCount: subjectSummaryArray.length
      }
    })

  } catch (error) {
    console.error('Handler error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}