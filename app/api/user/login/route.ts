import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { email, password, rememberMe } = body

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: email, password',
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

    // Backend URL from environment
    const BACKEND_URL = getBackendUrl()

    // Forward the request to your backend
    const response = await fetch(`${BACKEND_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const token: string | undefined = data?.data?.token
    const user = data?.data?.user
    const activeTenantId = data?.data?.activeTenantId ?? null
    const tenants = data?.data?.tenants ?? []

    // Never send the raw JWT to the browser - keep it in an httpOnly cookie
    // the client can't read, so an XSS can't steal the session token.
    const res = NextResponse.json(
      { success: true, data: { user, activeTenantId, tenants }, message: data.message, timestamp: new Date().toISOString() },
      { status: 200 }
    )

    if (token) {
      const daysToExpire = rememberMe ? 365 : 7
      res.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: daysToExpire * 24 * 60 * 60,
      })
    }

    return res

  } catch (error) {
    console.error('Login error:', error)
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