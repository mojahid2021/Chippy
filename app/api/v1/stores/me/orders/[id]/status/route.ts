import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

function getAuthToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const authHeader = request.headers.get('authorization')
  return cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authentication token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/stores/me/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
