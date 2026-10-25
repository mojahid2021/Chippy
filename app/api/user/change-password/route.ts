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

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current and new password are required' },
        { status: 400 }
      )
    }

    const backendUrl = getBackendUrl()

    try {
      const response = await fetch(`${backendUrl}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      console.error('Change password: backend unavailable:', error)
      return NextResponse.json(
        { success: false, message: 'Unable to reach authentication service' },
        { status: 502 }
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    )
  }
}
