import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

function getAuthToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const authHeader = request.headers.get('authorization')
  return cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authentication token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const backendUrl = getBackendUrl()
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const response = await fetch(`${backendUrl}/api/v1/stores/me/inventory/logs${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Get inventory logs error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to retrieve inventory logs' },
      { status: 500 }
    )
  }
}
