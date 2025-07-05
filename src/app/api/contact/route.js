import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { name, email, message } = await request.json()

    // Check if running on Netlify
    if (process.env.NETLIFY) {
      // Forward to Netlify Forms
      const formData = new FormData()
      formData.append('form-name', 'contact')
      formData.append('name', name)
      formData.append('email', email)
      formData.append('message', message)

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      })

      if (response.ok) {
        return NextResponse.json({ success: true })
      } else {
        throw new Error('Failed to submit to Netlify Forms')
      }
    } else {
      // Development mode - log to console
      console.log('Contact form submission:', { name, email, message })
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}