import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('Login request received')
    const body = await request.json()
    console.log('Request body parsed:', { email: body.email, hasPassword: !!body.password })
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードが必要です' }, { status: 400 })
    }

    // 環境変数の確認
    console.log('Environment variables check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: '環境変数が設定されていません' }, { status: 500 })
    }

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

    // 統合認証関数を呼び出し
    console.log('Calling authenticate_user function with email:', email)
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_email: email,
      p_password: password
    })
    console.log('Supabase response:', { data, error })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'データベースエラー',
        details: error.message,
        hint: error.hint || 'authenticate_user関数が存在するか確認してください'
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'データベースから応答がありません',
        details: 'authenticate_user関数の戻り値を確認してください'
      }, { status: 500 })
    }

    // 認証結果を確認
    const authResult = Array.isArray(data) ? data[0] : data
    if (!authResult || !authResult.is_authenticated) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
    }

    // セッショントークンを生成（簡易版）
    const sessionData = {
      userId: authResult.user_id,
      email: authResult.email,
      fullName: authResult.full_name,
      userType: authResult.user_type,
      isAdmin: authResult.user_type === 'admin',
      grade: authResult.grade || null,
      className: authResult.class_name || null,
      studentNumber: authResult.student_number || null,
      loginTime: new Date().toISOString()
    }

    // JWT風のシンプルなトークンを作成（Netlify対応）
    const token = btoa(JSON.stringify(sessionData))

    // レスポンスにクッキーを設定
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: authResult.user_id,
        email: authResult.email,
        fullName: authResult.full_name,
        userType: authResult.user_type,
        isAdmin: authResult.user_type === 'admin',
        grade: authResult.grade || null,
        className: authResult.class_name || null,
        studentNumber: authResult.student_number || null
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