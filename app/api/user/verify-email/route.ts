import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      )
    }

    const backendUrl = getBackendUrl()

    try {
      const response = await fetch(
        `${backendUrl}/api/user/verify-email?token=${encodeURIComponent(token)}`,
        { method: 'GET' }
      )

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('Verify email: backend unavailable:', error)
      return NextResponse.json(
        { success: false, message: 'Unable to reach authentication service' },
        { status: 502 }
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
