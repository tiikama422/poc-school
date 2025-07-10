'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { checkUserApproval, getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

export default function AdminUsers() {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        router.push('/login')
        return
      }

      const { isApproved } = await checkUserApproval(session.user.id)
      if (!isApproved) {
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      const currentUser = await getCurrentUser()
      if (!currentUser?.profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      await loadUsers()
      setLoading(false)
    }

    checkAdminAccess()
  }, [router])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const updateUserApproval = async (userId, isApproved) => {
    setUpdating(prev => ({ ...prev, [userId]: true }))

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_approved: isApproved,
          approved_by: isApproved ? user.id : null,
          approved_at: isApproved ? new Date().toISOString() : null
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user approval:', error)
        return
      }

      await loadUsers()
    } catch (error) {
      console.error('Error updating user approval:', error)
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }))
    }
  }

  const updateUserAdmin = async (userId, isAdmin) => {
    setUpdating(prev => ({ ...prev, [userId]: true }))

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user admin status:', error)
        return
      }

      await loadUsers()
    } catch (error) {
      console.error('Error updating user admin status:', error)
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white tracking-wide">ユーザー管理</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/create-user"
              className="px-4 py-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-300"
            >
              + 新規ユーザー作成
            </Link>
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white font-medium py-3 px-4">ユーザー</th>
                  <th className="text-left text-white font-medium py-3 px-4">メール</th>
                  <th className="text-left text-white font-medium py-3 px-4">登録日</th>
                  <th className="text-left text-white font-medium py-3 px-4">承認状態</th>
                  <th className="text-left text-white font-medium py-3 px-4">管理者</th>
                  <th className="text-left text-white font-medium py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userProfile) => (
                  <tr key={userProfile.id} className="border-b border-white/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-slate-300">
                            {userProfile.full_name ? userProfile.full_name.charAt(0) : userProfile.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {userProfile.full_name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{userProfile.email}</td>
                    <td className="py-4 px-4 text-slate-400">
                      {new Date(userProfile.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.is_approved 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {userProfile.is_approved ? '承認済み' : '未承認'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userProfile.is_admin 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {userProfile.is_admin ? '管理者' : '一般'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateUserApproval(userProfile.id, !userProfile.is_approved)}
                          disabled={updating[userProfile.id] || userProfile.id === user.id}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                            userProfile.is_approved
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                              : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                          }`}
                        >
                          {updating[userProfile.id] ? '更新中...' : (userProfile.is_approved ? '承認取消' : '承認')}
                        </button>
                        <button
                          onClick={() => updateUserAdmin(userProfile.id, !userProfile.is_admin)}
                          disabled={updating[userProfile.id] || userProfile.id === user.id}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                            userProfile.is_admin
                              ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/30'
                              : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30'
                          }`}
                        >
                          {updating[userProfile.id] ? '更新中...' : (userProfile.is_admin ? '管理者解除' : '管理者に')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}