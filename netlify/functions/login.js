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

    // Supabase標準認証を使用
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (authError) {
      console.error('Authentication error:', authError)
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'メールアドレスまたはパスワードが正しくありません' })
      }
    }

    if (authData.user) {
      // ユーザープロファイル情報を取得
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }

      const userProfile = profile || {}

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            fullName: userProfile.full_name || userProfile.name || authData.user.user_metadata?.full_name || '',
            userType: userProfile.user_type || userProfile.role || 'student',
            isAdmin: userProfile.is_admin || false,
            grade: userProfile.grade || null,
            className: userProfile.class_name || null,
            studentNumber: userProfile.student_number || null
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