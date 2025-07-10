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

    // 一時的に静的認証に戻す（デバッグ目的）
    const validCredentials = {
      'gentsuka.business@gmail.com': {
        password: 'violin9914',
        fullName: '塚原弦',
        userType: 'student',
        grade: '社会人',
        className: 'A組',
        studentNumber: 'S001'
      },
      'kmaika4ma@gmail.com': {
        password: 'maika123',
        fullName: '小泉舞香',
        userType: 'student',
        grade: '高校3年',
        className: 'A組',
        studentNumber: 'S004'
      },
      'admin1@school.com': {
        password: 'Admin123!',
        fullName: '管理者1',
        userType: 'admin'
      }
    }

    const user = validCredentials[email]
    
    if (user && user.password === password) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: `${user.userType}-${Date.now()}`,
            email: email,
            fullName: user.fullName,
            userType: user.userType,
            isAdmin: user.userType === 'admin',
            grade: user.grade || null,
            className: user.className || null,
            studentNumber: user.studentNumber || null
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