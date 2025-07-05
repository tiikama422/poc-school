'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setError('Check your email for a confirmation link')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sophisticated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-white/5 animate-pulse"></div>
      
      <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 w-full max-w-md shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-8 right-8 w-20 h-20 opacity-10">
          <div className="absolute top-0 left-0 w-10 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-pulse"></div>
          <div className="absolute top-5 right-0 w-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-pulse delay-1000"></div>
          <div className="absolute bottom-5 left-3 w-9 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-pulse delay-2000"></div>
          <div className="absolute bottom-0 right-1 w-6 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent animate-pulse delay-3000"></div>
        </div>

        {/* Logo section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-18 h-18 bg-gradient-to-br from-slate-700 to-slate-600 border-2 border-white/10 rounded-2xl mb-5 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="text-slate-300 text-2xl font-light tracking-widest relative z-10">Σ</div>
          </div>
          <p className="text-slate-400 text-base mb-3 font-normal tracking-wide">
            東大式管理塾で効率的な学習を
          </p>
          <Link 
            href="/" 
            className="text-slate-300 text-sm font-normal hover:text-slate-200 transition-colors duration-300 relative group"
          >
            Or return to homepage
            <span className="absolute -bottom-0.5 left-1/2 w-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-7">
          <div className="relative">
            <label htmlFor="email" className="block text-slate-200 text-xs font-medium mb-2.5 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none focus:ring-0 transition-all duration-300 focus:-translate-y-px"
                placeholder="Enter your email address"
                required
              />
              <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-500 opacity-70">@</span>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-slate-200 text-xs font-medium mb-2.5 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-white/30 focus:bg-black/30 focus:outline-none focus:ring-0 transition-all duration-300 focus:-translate-y-px"
                placeholder="Enter your password"
                required
              />
              <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-500 opacity-70">●●●</span>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/20 rounded-lg p-3 backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-4 px-7 bg-gradient-to-br from-slate-700 to-slate-600 text-white text-sm font-medium rounded-xl border border-white/10 shadow-lg hover:from-slate-600 hover:to-slate-500 hover:-translate-y-0.5 focus:outline-none focus:ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wider relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="flex-1 py-4 px-7 bg-black/20 backdrop-blur-sm text-slate-200 text-sm font-medium rounded-xl border border-white/10 hover:bg-black/30 hover:border-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wider relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}