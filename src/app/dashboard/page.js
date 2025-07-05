'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        router.push('/login')
        return
      }

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    getSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome, {user?.email}!
            </h2>
            <p className="text-gray-600 mb-6">
              You're successfully logged in to your dashboard. This is a protected page that requires authentication.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">User Information</h3>
              <p className="text-blue-800">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-blue-800">
                <strong>User ID:</strong> {user?.id}
              </p>
              <p className="text-blue-800">
                <strong>Last Sign In:</strong> {new Date(user?.last_sign_in_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
            <Link
              href="/logout"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}