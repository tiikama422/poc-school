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

    if (!sessionUser || sessionUser.userType !== 'student') {
      return Response.json({ error: 'Student access required' }, { status: 403 })
    }

    // 学習記録の取得
    const { data, error } = await supabase
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
      .eq('student_email', sessionUser.email)
      .order('study_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to fetch study records' }, { status: 500 })
    }

    return Response.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Study records API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Authorization header is required' }, { status: 401 })
    }

    let sessionUser
    try {
      const token = authHeader.replace('Bearer ', '')
      sessionUser = JSON.parse(safeBase64Decode(token))
    } catch (error) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!sessionUser || sessionUser.userType !== 'student') {
      return Response.json({ error: 'Student access required' }, { status: 403 })
    }

    const body = await request.json()
    const { study_date, subject_id, sub_subject_id, hours, minutes, memo } = body

    // バリデーション
    if (!study_date || !subject_id || (hours === 0 && minutes < 5)) {
      return Response.json({ error: 'Invalid input data' }, { status: 400 })
    }

    // 学習記録を挿入
    const { data, error } = await supabase
      .from('study_records')
      .insert({
        student_email: sessionUser.email,
        user_id: sessionUser.id,
        study_date,
        subject_id: parseInt(subject_id),
        sub_subject_id: sub_subject_id ? parseInt(sub_subject_id) : null,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
        memo: memo || ''
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to create study record' }, { status: 500 })
    }

    return Response.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Create study record error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

