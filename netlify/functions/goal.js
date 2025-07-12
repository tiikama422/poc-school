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
  console.log('=== goal function started ===')
  
  // CORS設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
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

    console.log('Method:', event.httpMethod, 'User:', sessionUser.id)

    // HTTPメソッドに応じた処理
    switch (event.httpMethod) {
      case 'GET':
        return await handleGetGoal(sessionUser, headers)
      case 'PUT':
        return await handleUpdateGoal(sessionUser, event, headers)
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }

  } catch (error) {
    console.error('Handler error:', error)
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

// 目標取得
async function handleGetGoal(sessionUser, headers) {
  const { data: goal, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', sessionUser.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Goal fetch error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch goal' })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: goal || { daily_goal_minutes: 120 } // デフォルト値
    })
  }
}

// 目標更新
async function handleUpdateGoal(sessionUser, event, headers) {
  let goalData
  try {
    goalData = JSON.parse(event.body)
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON data' })
    }
  }

  // バリデーション
  if (!goalData.daily_goal_minutes || goalData.daily_goal_minutes < 15 || goalData.daily_goal_minutes > 720) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Daily goal must be between 15 and 720 minutes' })
    }
  }

  // 既存の目標があるかチェック
  const { data: existingGoal } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', sessionUser.id)
    .single()

  let result
  if (existingGoal) {
    // 更新
    const { data, error } = await supabase
      .from('user_goals')
      .update({
        daily_goal_minutes: goalData.daily_goal_minutes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', sessionUser.id)
      .select()

    result = { data, error }
  } else {
    // 新規作成
    const { data, error } = await supabase
      .from('user_goals')
      .insert([{
        user_id: sessionUser.id,
        daily_goal_minutes: goalData.daily_goal_minutes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()

    result = { data, error }
  }

  if (result.error) {
    console.error('Goal update error:', result.error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update goal' })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.data[0]
    })
  }
}