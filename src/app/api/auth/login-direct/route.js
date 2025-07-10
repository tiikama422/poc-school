import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

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

    // 管理者テーブルから確認
    const { data: adminData, error: adminError } = await supabase
      .from('allowed_admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (!adminError && adminData) {
      // パスワード確認（簡単な方法）
      const { data: authData, error: authError } = await supabase
        .rpc('verify_password', { 
          stored_hash: adminData.password_hash, 
          input_password: password 
        })

      if (!authError && authData) {
        return NextResponse.json({
          success: true,
          user: {
            id: adminData.id,
            email: adminData.email,
            fullName: adminData.full_name,
            userType: 'admin',
            isAdmin: true
          }
        })
      }
    }

    // 生徒テーブルから確認
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (!studentError && studentData) {
      return NextResponse.json({
        success: true,
        user: {
          id: studentData.id,
          email: studentData.email,
          fullName: studentData.full_name,
          userType: 'student',
          isAdmin: false,
          grade: studentData.grade,
          className: studentData.class_name,
          studentNumber: studentData.student_number
        }
      })
    }

    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '予期しないエラー' }, { status: 500 })
  }
}