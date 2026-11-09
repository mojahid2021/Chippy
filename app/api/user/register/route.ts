import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, role = 'USER' } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required fields: email, password, firstName, lastName',
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'body/password must NOT have fewer than 8 characters',
        },
        { status: 400 }
      )
    }

    const BACKEND_URL = getBackendUrl()

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        role,
        ...(phone ? { phone } : {}),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Auto-login to obtain token
    try {
      const loginResponse = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginResponse.json()
      const token: string | undefined = loginData?.data?.token
      const user = loginData?.data?.user ?? data.data

      const res = NextResponse.json(
        {
          success: true,
          message: data.message,
          data: {
            user,
            token,
          },
        },
        { status: 201 }
      )

      if (token) {
        res.cookies.set(AUTH_COOKIE_NAME, token, {
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }

      return res
    } catch {
      return NextResponse.json(
        {
          success: true,
          message: data.message,
          data: data.data,
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
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
