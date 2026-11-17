import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

function getAuthToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const authHeader = request.headers.get('authorization')
  return cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)
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

    const backendUrl = getBackendUrl()
    const contentType = request.headers.get('content-type') || ''

    let backendResponse: Response

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      backendResponse = await fetch(`${backendUrl}/api/v1/stores/me/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
    } else {
      const jsonBody = await request.json()
      backendResponse = await fetch(`${backendUrl}/api/v1/stores/me/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonBody),
      })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error('Store media direct upload error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to upload store media' },
      { status: 500 }
    )
  }
}
