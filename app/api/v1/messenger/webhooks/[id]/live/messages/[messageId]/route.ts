import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)

    if (!token) {
      return NextResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token',
        },
        { status: 401 }
      )
    }

    const backendUrl = getBackendUrl()
    const response = await fetch(
      `${backendUrl}/api/v1/messenger/webhooks/${id}/live/messages/${messageId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Fetch live message details error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve live message details from Meta Graph API',
      },
      { status: 500 }
    )
  }
}

