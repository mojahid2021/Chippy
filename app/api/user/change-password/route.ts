import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json(
      { success: false, statusCode: 401, error: 'Unauthorized', message: 'Missing or invalid authentication token' },
      { status: 401 }
    )
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/user/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(await request.json()),
    })
    return NextResponse.json(await response.json(), { status: response.status })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Couldn’t reach the server. Try again in a moment.' },
      { status: 502 }
    )
  }
}
