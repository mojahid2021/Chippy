import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

const VALID_ACTIONS = new Set(['typing_on', 'typing_off', 'mark_seen'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await request.json().catch(() => null)
    if (!body || !body.recipientId || !VALID_ACTIONS.has(body.action)) {
      return NextResponse.json(
        {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required fields: recipientId and valid action (typing_on, typing_off, mark_seen)',
        },
        { status: 400 }
      )
    }

    const backendUrl = getBackendUrl()
    const response = await fetch(
      `${backendUrl}/api/v1/messenger/webhooks/${id}/live/sender-actions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Execute live sender action error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to execute live sender action via Meta Graph API',
      },
      { status: 500 }
    )
  }
}

