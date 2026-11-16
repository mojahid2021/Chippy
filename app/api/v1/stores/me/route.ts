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

    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/stores/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Get store profile error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to retrieve store profile' },
      { status: 500 }
    )
  }
}

function sanitizeStoreBody(body: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = { ...body }
  const optionalStringFields = [
    'contactEmail',
    'contactPhone',
    'address',
    'city',
    'country',
    'description',
    'logoUrl',
    'bannerUrl',
  ]
  for (const field of optionalStringFields) {
    if (typeof cleaned[field] === 'string' && (cleaned[field] as string).trim() === '') {
      delete cleaned[field]
    }
  }
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authentication token' },
        { status: 401 }
      )
    }

    const rawBody = await request.json()
    const body = sanitizeStoreBody(rawBody)
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/stores/me`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Create store profile error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to create store profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authentication token' },
        { status: 401 }
      )
    }

    const rawBody = await request.json()
    const body = sanitizeStoreBody(rawBody)
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/stores/me`, {
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
    console.error('Update store profile error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to update store profile' },
      { status: 500 }
    )
  }
}
