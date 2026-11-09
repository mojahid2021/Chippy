import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function POST(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId, autoRenew = true } = body

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'planId is required',
        },
        { status: 400 }
      )
    }

    const apiBaseUrl = getBackendUrl()
    const externalApiUrl = `${apiBaseUrl}/api/v1/subscriptions/subscribe`

    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ planId, autoRenew }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      data: data.data,
    }, { status: 201 })
  } catch (error) {
    console.error('Purchase plan API error:', error)
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your subscription',
      },
      { status: 500 }
    )
  }
}
