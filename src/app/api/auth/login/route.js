import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Supabaseクライアントを作成
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get() { return null },
          set() {},
          remove() {},
        },
      }
    )

    // カスタム認証関数を呼び出し
    const { data, error } = await supabase.rpc('authenticate_admin', {
      p_email: email,
      p_password: password
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'データベースエラー' }, { status: 500 })
    }

    // 認証結果を確認
    const authResult = data[0]
    if (!authResult || !authResult.is_authenticated) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
    }

    // セッショントークンを生成（簡易版）
    const sessionData = {
      userId: authResult.user_id,
      email: authResult.email,
      fullName: authResult.full_name,
      isAdmin: true,
      loginTime: new Date().toISOString()
    }

    // JWT風のシンプルなトークンを作成
    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    // レスポンスにクッキーを設定
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: authResult.user_id,
        email: authResult.email,
        fullName: authResult.full_name,
        isAdmin: true
      }
    })

    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7日間
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 })
  }
}