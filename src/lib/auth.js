// セッションからユーザー情報を取得
export function getSessionUser() {
  if (typeof window === 'undefined') return null
  
  try {
    const sessionData = localStorage.getItem('session-user')
    return sessionData ? JSON.parse(sessionData) : null
  } catch (error) {
    console.error('Error getting session user:', error)
    return null
  }
}

// セッションにユーザー情報を保存
export function setSessionUser(user) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('session-user', JSON.stringify(user))
  } catch (error) {
    console.error('Error setting session user:', error)
  }
}

// セッションからユーザー情報を削除
export function clearSessionUser() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('session-user')
  } catch (error) {
    console.error('Error clearing session user:', error)
  }
}

// ログイン状態を確認
export function isLoggedIn() {
  const user = getSessionUser()
  return user && user.isAdmin
}

// 管理者権限を確認
export function isAdmin() {
  const user = getSessionUser()
  return user && user.isAdmin
}