import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password, setupKey } = await request.json()

    // セットアップキーをチェック（環境変数で設定）
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: '無効なセットアップキーです' }, { status: 403 })
    }

    // Supabase管理者クライアントを作成
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

    // 既に管理者が存在するかチェック
    const { data: existingAdmins, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    if (checkError) {
      return NextResponse.json({ error: 'データベースエラー' }, { status: 500 })
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: '管理者は既に設定されています' }, { status: 400 })
    }

    // 初期管理者ユーザーを作成
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'システム管理者'
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // 管理者プロファイルを作成
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        email: email,
        full_name: 'システム管理者',
        is_approved: true,
        is_admin: true,
        is_pre_registered: true,
        initial_password_changed: true, // 初期管理者は変更不要
        approved_by: newUser.user.id,
        approved_at: new Date().toISOString()
      })

    if (profileError) {
      // ユーザー作成をロールバック
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: '初期管理者が正常に作成されました',
      adminEmail: email
    })

  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 })
  }
}