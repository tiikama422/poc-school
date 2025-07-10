import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password, fullName } = await request.json()

    // Supabase管理者クライアントを作成
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // サービスロールキーを使用
      {
        cookies: {
          get() { return null },
          set() {},
          remove() {},
        },
      }
    )

    // リクエストユーザーの管理者権限をチェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 現在のセッションユーザーを確認
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !currentUser) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 })
    }

    // 管理者権限をチェック
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // 新規ユーザーを作成
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // ユーザープロファイルを作成
    const { error: profileInsertError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        email: email,
        full_name: fullName,
        is_approved: true,
        is_pre_registered: true,
        initial_password_changed: false,
        approved_by: currentUser.id,
        approved_at: new Date().toISOString()
      })

    if (profileInsertError) {
      // ユーザー作成をロールバック
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: profileInsertError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: newUser.user.id, 
        email: newUser.user.email 
      } 
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 })
  }
}