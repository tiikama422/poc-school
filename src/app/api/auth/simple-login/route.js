import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // 簡易認証（とりあえず動作確認用）
    const adminAccounts = {
      'admin1@school.com': 'Admin123!',
      'admin2@school.com': 'Admin456!'
    }

    const studentAccounts = {
      'student1@school.com': { password: 'Student123!', name: '田中太郎', grade: '高校3年', class: 'A組' },
      'student2@school.com': { password: 'Student456!', name: '佐藤花子', grade: '高校2年', class: 'B組' },
      'student3@school.com': { password: 'Student789!', name: '山田次郎', grade: '高校1年', class: 'C組' }
    }

    // 管理者チェック
    if (adminAccounts[email] && adminAccounts[email] === password) {
      return NextResponse.json({
        success: true,
        user: {
          id: `admin-${Date.now()}`,
          email: email,
          fullName: email === 'admin1@school.com' ? '管理者1' : '管理者2',
          userType: 'admin',
          isAdmin: true
        }
      })
    }

    // 生徒チェック
    if (studentAccounts[email] && studentAccounts[email].password === password) {
      const student = studentAccounts[email]
      return NextResponse.json({
        success: true,
        user: {
          id: `student-${Date.now()}`,
          email: email,
          fullName: student.name,
          userType: 'student',
          isAdmin: false,
          grade: student.grade,
          className: student.class,
          studentNumber: email.replace('@school.com', '').toUpperCase()
        }
      })
    }

    return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 })
  }
}