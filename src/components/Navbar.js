'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
              Next.js App
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 text-sm sm:text-base px-2 py-1 sm:px-0"
                >
                  Dashboard
                </Link>
                <Link
                  href="/logout"
                  className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-red-700 text-sm sm:text-base"
                >
                  Logout
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-blue-700 text-sm sm:text-base"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}