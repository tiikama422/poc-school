const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event, context) => {
  // CORS設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // プリフライトリクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { email, password } = JSON.parse(event.body)

    // デバッグ用ログ
    console.log('Login attempt for:', email)
    console.log('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // Supabaseの認証システムを使用
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_email: email,
      p_password: password
    })

    if (error) {
      console.error('Authentication error:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'データベースエラーが発生しました' })
      }
    }

    // 認証成功チェック
    if (data && data.is_authenticated) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: data.user_id,
            email: data.email,
            fullName: data.full_name,
            userType: data.user_type,
            isAdmin: data.user_type === 'admin',
            grade: data.grade || null,
            className: data.class_name || null,
            studentNumber: data.student_number || null
          }
        })
      }
    }

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'メールアドレスまたはパスワードが正しくありません' })
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '予期しないエラーが発生しました', details: error.message })
    }
  }
}