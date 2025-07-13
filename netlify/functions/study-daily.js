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
  console.log('=== study-daily function started ===')
  
  // CORS設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // プリフライトリクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    console.log('OPTIONS request received')
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'GET') {
    console.log('Invalid method:', event.httpMethod)
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    console.log('Starting main logic...')
    
    // 環境変数のチェック
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      event: {
        httpMethod: event.httpMethod,
        headers: Object.keys(event.headers || {}),
        queryStringParameters: event.queryStringParameters
      }
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    }
    
    console.log('Environment variables OK')
    
    // 認証チェック
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
      }
    }

    const token = authHeader.split(' ')[1]
    let user
    try {
      const decodedData = safeBase64Decode(token)
      user = JSON.parse(decodedData)
      console.log('User authenticated:', { email: user.email, userType: user.userType })
    } catch (error) {
      console.error('Token decode error:', error)
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    if (user.userType !== 'student') {
      console.log('Unauthorized user type:', user.userType)
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' })
      }
    }

    // 日付パラメータの取得
    const date = event.queryStringParameters?.date
    if (!date) {
      console.log('Missing date parameter')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Date parameter is required' })
      }
    }

    console.log('Fetching daily data for:', { date, userEmail: user.email })

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
        subject_id,
        subjects (
          id,
          name,
          color
        )
      `)
      .eq('student_email', user.email)
      .eq('study_date', date)
      .order('created_at', { ascending: true })

    if (recordsError) {
      console.error('Records query error:', recordsError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch study records' })
      }
    }

    console.log('Found records:', records?.length || 0)

    // 科目別の集計データを作成
    const subjectSummary = {}
    let totalMinutes = 0

    records?.forEach(record => {
      const minutes = (record.hours || 0) * 60 + (record.minutes || 0)
      totalMinutes += minutes

      if (record.subjects) {
        const subjectId = record.subjects.id
        if (!subjectSummary[subjectId]) {
          subjectSummary[subjectId] = {
            id: subjectId,
            name: record.subjects.name,
            color: record.subjects.color,
            totalMinutes: 0
          }
        }
        subjectSummary[subjectId].totalMinutes += minutes
      }
    })

    const subjectSummaryArray = Object.values(subjectSummary)

    const responseData = {
      records: records || [],
      subjectSummary: subjectSummaryArray,
      totalMinutes: totalMinutes
    }

    console.log('Response data:', {
      recordCount: responseData.records.length,
      subjectCount: responseData.subjectSummary.length,
      totalMinutes: responseData.totalMinutes
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: responseData
      })
    }

  } catch (error) {
    console.error('Handler error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || error.toString()
      })
    }
  }
}