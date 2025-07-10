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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  // プリフライトリクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
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

    // セッションユーザーの取得（簡易実装）
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

    // HTTPメソッドに応じた処理
    switch (event.httpMethod) {
      case 'POST':
        return await createStudyRecord(event, sessionUser, headers)
      case 'GET':
        return await getStudyRecords(event, sessionUser, headers)
      case 'PUT':
        return await updateStudyRecord(event, sessionUser, headers)
      case 'DELETE':
        return await deleteStudyRecord(event, sessionUser, headers)
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Study records API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

// 学習記録作成
async function createStudyRecord(event, sessionUser, headers) {
  try {
    const { study_date, subject_id, sub_subject_id, hours, minutes, memo } = JSON.parse(event.body)

    console.log('Received data:', { study_date, subject_id, sub_subject_id, hours, minutes, memo })
    console.log('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
    })

    // バリデーション
    if (!study_date || !subject_id || (parseInt(hours) === 0 && parseInt(minutes) < 5)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid input data. Minimum 5 minutes required.' })
      }
    }

    console.log('Attempting database insert...')

    // 学習記録をデータベースに保存
    const { data, error } = await supabase
      .from('study_records')
      .insert([
        {
          student_email: sessionUser.email,
          study_date,
          subject_id: parseInt(subject_id),
          sub_subject_id: sub_subject_id ? parseInt(sub_subject_id) : null,
          hours: parseInt(hours) || 0,
          minutes: parseInt(minutes) || 0,
          memo: memo || null
        }
      ])
      .select()

    console.log('Database response:', { data, error })

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to save study record',
          details: error.message,
          code: error.code
        })
      }
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: data[0],
        message: 'Study record created successfully'
      })
    }
  } catch (error) {
    console.error('Create study record error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create study record', 
        details: error.message,
        stack: error.stack?.substring(0, 200)
      })
    }
  }
}

// 学習記録取得
async function getStudyRecords(event, sessionUser, headers) {
  try {
    // パスから記録IDを取得
    const pathSegments = event.path.split('/')
    const recordId = pathSegments[pathSegments.length - 1]
    
    // 特定のレコードを取得
    if (recordId && recordId !== 'study-records') {
      return await getSingleStudyRecord(recordId, sessionUser, headers)
    }

    // 一覧取得
    const queryParams = event.queryStringParameters || {}
    const { filter = 'all', limit = 50 } = queryParams

    let query = supabase
      .from('study_records')
      .select(`
        *,
        subjects(name, color)
      `)
      .eq('student_email', sessionUser.email)
      .order('study_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    // フィルタリング
    const now = new Date()
    if (filter === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - 7)
      query = query.gte('study_date', weekStart.toISOString().split('T')[0])
    } else if (filter === 'month') {
      const monthStart = new Date(now)
      monthStart.setDate(1)
      query = query.gte('study_date', monthStart.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch study records' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: data || [],
        total: data?.length || 0
      })
    }
  } catch (error) {
    console.error('Get study records error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch study records' })
    }
  }
}

// 単一の学習記録取得
async function getSingleStudyRecord(recordId, sessionUser, headers) {
  try {
    const { data, error } = await supabase
      .from('study_records')
      .select(`
        *,
        subjects(name, color)
      `)
      .eq('id', recordId)
      .eq('student_email', sessionUser.email)
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch study record' })
      }
    }

    if (!data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Study record not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: data
      })
    }
  } catch (error) {
    console.error('Get single study record error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch study record' })
    }
  }
}

// 学習記録更新
async function updateStudyRecord(event, sessionUser, headers) {
  try {
    const pathSegments = event.path.split('/')
    const recordId = pathSegments[pathSegments.length - 1]
    
    if (!recordId || recordId === 'study-records') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Record ID is required' })
      }
    }

    const { study_date, subject_id, sub_subject_id, hours, minutes, memo } = JSON.parse(event.body)

    // バリデーション
    if (!study_date || !subject_id || (parseInt(hours) === 0 && parseInt(minutes) < 5)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid input data. Minimum 5 minutes required.' })
      }
    }

    // 本人確認と更新
    const { data, error } = await supabase
      .from('study_records')
      .update({
        study_date,
        subject_id: parseInt(subject_id),
        sub_subject_id: sub_subject_id ? parseInt(sub_subject_id) : null,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
        memo: memo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .eq('student_email', sessionUser.email)
      .select()

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update study record' })
      }
    }

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Study record not found or access denied' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: data[0],
        message: 'Study record updated successfully'
      })
    }
  } catch (error) {
    console.error('Update study record error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update study record' })
    }
  }
}

// 学習記録削除
async function deleteStudyRecord(event, sessionUser, headers) {
  try {
    const pathSegments = event.path.split('/')
    const recordId = pathSegments[pathSegments.length - 1]
    
    if (!recordId || recordId === 'study-records') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Record ID is required' })
      }
    }

    // 本人確認と削除
    const { data, error } = await supabase
      .from('study_records')
      .delete()
      .eq('id', recordId)
      .eq('student_email', sessionUser.email)
      .select()

    if (error) {
      console.error('Database error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to delete study record' })
      }
    }

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Study record not found or access denied' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Study record deleted successfully'
      })
    }
  } catch (error) {
    console.error('Delete study record error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete study record' })
    }
  }
}