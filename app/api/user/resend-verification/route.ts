import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No active session' },
        { status: 401 }
      )
    }

    const backendUrl = getBackendUrl()

    try {
      const response = await fetch(`${backendUrl}/api/user/resend-verification`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('Resend verification: backend unavailable:', error)
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
