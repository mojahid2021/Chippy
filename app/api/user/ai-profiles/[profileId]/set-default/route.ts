import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    const { profileId } = await params
    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Profile ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const BACKEND_URL = getBackendUrl()
    const response = await fetch(`${BACKEND_URL}/api/user/ai-profiles/${profileId}/set-default`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('AI profile set-default error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
