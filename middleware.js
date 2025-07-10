import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('is_approved, is_admin, is_pre_registered')
        .eq('id', session.user.id)
        .single()

      // 事前登録されたユーザーかつ承認済みのみ許可
      const isValidUser = userProfile?.is_pre_registered && userProfile?.is_approved

      if (error || !isValidUser) {
        const logoutResponse = NextResponse.redirect(new URL('/login', req.url))
        logoutResponse.cookies.delete('sb-access-token')
        logoutResponse.cookies.delete('sb-refresh-token')
        return logoutResponse
      }

      if (req.nextUrl.pathname.startsWith('/admin') && !userProfile?.is_admin) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('Error checking user approval:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}