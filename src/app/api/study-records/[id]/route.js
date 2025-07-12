import { createClient } from '@supabase/supabase-js'
import { safeBase64Decode } from '@/lib/base64'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request, { params }) {
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

    const { id } = params

    // 特定の学習記録を取得
    const { data, error } = await supabase
      .from('study_records')
      .select(`
        id,
        study_date,
        subject_id,
        sub_subject_id,
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
      .eq('id', id)
      .eq('student_email', sessionUser.email)
      .single()

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Study record not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Get study record error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
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

    const { id } = params
    const body = await request.json()
    const { study_date, subject_id, sub_subject_id, hours, minutes, memo } = body

    // バリデーション
    if (!study_date || !subject_id || (hours === 0 && minutes < 5)) {
      return Response.json({ error: 'Invalid input data' }, { status: 400 })
    }

    // 学習記録を更新
    const { data, error } = await supabase
      .from('study_records')
      .update({
        study_date,
        subject_id: parseInt(subject_id),
        sub_subject_id: sub_subject_id ? parseInt(sub_subject_id) : null,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
        memo: memo || ''
      })
      .eq('id', id)
      .eq('student_email', sessionUser.email)
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to update study record' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return Response.json({ error: 'Study record not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Update study record error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = params

    // 記録の削除（所有者チェック付き）
    const { error } = await supabase
      .from('study_records')
      .delete()
      .eq('id', id)
      .eq('student_email', sessionUser.email)

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to delete study record' }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Study record deleted successfully'
    })

  } catch (error) {
    console.error('Delete study record error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}