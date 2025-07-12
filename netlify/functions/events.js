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
  console.log('=== events function started ===')
  
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
        return await handleGetEvents(sessionUser, event, headers)
      case 'POST':
        return await handleCreateEvent(sessionUser, event, headers)
      case 'PUT':
        return await handleUpdateEvent(sessionUser, event, headers)
      case 'DELETE':
        return await handleDeleteEvent(sessionUser, event, headers)
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

// 予定一覧取得
async function handleGetEvents(sessionUser, event, headers) {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', sessionUser.id)
    .order('date', { ascending: true })

  if (error) {
    console.error('Events fetch error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch events' })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: events || []
    })
  }
}

// 予定作成
async function handleCreateEvent(sessionUser, event, headers) {
  let eventData
  try {
    eventData = JSON.parse(event.body)
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON data' })
    }
  }

  // 必須フィールドのバリデーション
  if (!eventData.title || !eventData.date || !eventData.type) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Title, date, and type are required' })
    }
  }

  const { data: newEvent, error } = await supabase
    .from('events')
    .insert([{
      user_id: sessionUser.id,
      title: eventData.title,
      description: eventData.description || '',
      date: eventData.date,
      type: eventData.type,
      color: eventData.color || '#3498DB',
      created_at: new Date().toISOString()
    }])
    .select()

  if (error) {
    console.error('Event create error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create event' })
    }
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      data: newEvent[0]
    })
  }
}

// 予定更新
async function handleUpdateEvent(sessionUser, event, headers) {
  const eventId = event.path.split('/').pop()
  
  let eventData
  try {
    eventData = JSON.parse(event.body)
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON data' })
    }
  }

  const { data: updatedEvent, error } = await supabase
    .from('events')
    .update({
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      type: eventData.type,
      color: eventData.color,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .eq('user_id', sessionUser.id)
    .select()

  if (error) {
    console.error('Event update error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update event' })
    }
  }

  if (!updatedEvent.length) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Event not found' })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: updatedEvent[0]
    })
  }
}

// 予定削除
async function handleDeleteEvent(sessionUser, event, headers) {
  const eventId = event.path.split('/').pop()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', sessionUser.id)

  if (error) {
    console.error('Event delete error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete event' })
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Event deleted successfully'
    })
  }
}