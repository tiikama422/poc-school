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

    // 簡易認証
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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
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
    }

    // 生徒チェック
    if (studentAccounts[email] && studentAccounts[email].password === password) {
      const student = studentAccounts[email]
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
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
      body: JSON.stringify({ error: '予期しないエラーが発生しました' })
    }
  }
}