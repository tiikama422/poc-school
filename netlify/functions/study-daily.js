const { createClient } = require('@supabase/supabase-js')

// Base64デコード用のユーティリティ（インライン定義）
function safeBase64Decode(base64) {
  try {
    return Buffer.from(base64, 'base64').toString('utf8')
  } catch (error) {
    console.error('Base64 decode error:', error)
    throw new Error('Failed to decode data')
  }
}

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
        body: JSON.stringify({ error: 'Invalid authorization token' })
      }
    }

    if (!sessionUser || sessionUser.userType !== 'student') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      }
    }

    // 日付パラメータを取得
    const { date } = event.queryStringParameters || {}
    if (!date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Date parameter is required' })
      }
    }

    // 日付の妥当性チェック
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid date format' })
      }
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch study records' })
      }
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
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
    }

  } catch (error) {
    console.error('Handler error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}