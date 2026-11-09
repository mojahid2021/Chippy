import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required fields: email, password',
        },
        { status: 400 }
      )
    }

    const BACKEND_URL = getBackendUrl()

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const token: string | undefined = data?.data?.token
    const user = data?.data?.user

    const res = NextResponse.json(
      {
        success: true,
        message: data.message,
        data: {
          token,
          user,
        },
      },
      { status: 200 }
    )

    if (token) {
      const daysToExpire = rememberMe ? 365 : 7
      res.cookies.set(AUTH_COOKIE_NAME, token, {
        path: '/',
        maxAge: daysToExpire * 24 * 60 * 60,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
