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

    const backendUrl = getBackendUrl()
    const query = new URLSearchParams({ page, limit }).toString()
    const response = await fetch(`${backendUrl}/api/v1/messenger/webhooks?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Fetch messenger webhooks error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch messenger webhooks',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { name, appSecret, verifyToken, pageId, pageAccessToken, aiProfileId } = body

    if (!name || !appSecret) {
      return NextResponse.json(
        {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required fields: name, appSecret',
        },
        { status: 400 }
      )
    }

    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/messenger/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        appSecret,
        ...(verifyToken ? { verifyToken } : {}),
        ...(pageId ? { pageId } : {}),
        ...(pageAccessToken ? { pageAccessToken } : {}),
        ...(aiProfileId ? { aiProfileId } : {}),
      }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Create messenger webhook error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create messenger webhook',
      },
      { status: 500 }
    )
  }
}

