import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { email, password, firstName, lastName, phone } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: email, password, firstName, lastName',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Backend URL from environment
    const BACKEND_URL = getBackendUrl()

    // Forward the request to your backend
    const response = await fetch(`${BACKEND_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        phone
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // The backend's /register endpoint only creates the account and doesn't
    // return a session token, so the post-register redirect to /dashboard
    // would otherwise land on a user who looks logged out. Log them in with
    // the same credentials to establish a real session.
    try {
      const loginResponse = await fetch(`${BACKEND_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginResponse.json()
      const token: string | undefined = loginData?.data?.token
      const user = loginData?.data?.user ?? data.data

      const res = NextResponse.json(
        { success: true, data: { user }, message: data.message, timestamp: new Date().toISOString() },
        { status: 201 }
      )

      if (loginResponse.ok && token) {
        res.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        })
      }

      return res
    } catch (loginError) {
      console.error('Auto-login after registration failed:', loginError)
      // Registration itself succeeded - return it, just without a session.
      return NextResponse.json(data, { status: 201 })
    }

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}