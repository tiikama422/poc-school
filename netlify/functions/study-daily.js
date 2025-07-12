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
    
    // まずは基本的なレスポンスを返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Basic function test successful',
        timestamp: new Date().toISOString()
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