import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(request: NextRequest) {
  try {
    // Get token from the httpOnly session cookie
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const backendUrl = getBackendUrl()

    try {
      const response = await fetch(`${backendUrl}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        return NextResponse.json({
          success: true,
          data: userData.data
        })
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        )
      }
    } catch (error) {
      // Backend unreachable: fail closed. Never fabricate a logged-in
      // identity just because the token couldn't be verified.
      console.error('Profile validation: backend unavailable:', error)
      return NextResponse.json(
        { success: false, message: 'Unable to reach authentication service' },
        { status: 502 }
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, message: 'Profile validation failed' },
      { status: 500 }
    )
  }
}