import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function GET(request: NextRequest) {
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

    const apiBaseUrl = getBackendUrl()
    const externalApiUrl = `${apiBaseUrl}/api/v1/subscriptions/current`

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: true,
            data: {
              hasSubscription: false,
              subscription: null,
              message: data.message || 'No active subscription',
            },
          },
          { status: 200 }
        )
      }
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      data: {
        hasSubscription: true,
        subscription: data.data,
      },
    })
  } catch (error) {
    console.error('Get subscription API error:', error)
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching subscription details',
      },
      { status: 500 }
    )
  }
}
