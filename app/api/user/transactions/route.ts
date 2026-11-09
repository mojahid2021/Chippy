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

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'

    const apiBaseUrl = getBackendUrl()
    const query = new URLSearchParams({ page, limit }).toString()
    const externalApiUrl = `${apiBaseUrl}/api/v1/subscriptions/history?${query}`

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription history retrieved successfully',
      data: {
        transactions: data.data || [],
        pagination: data.pagination || {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: data.data?.length || 0,
          pages: 1,
        },
      },
      raw: data,
    })
  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request',
      },
      { status: 500 }
    )
  }
}
