import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }

    const BACKEND_URL = getBackendUrl()
    const response = await fetch(`${BACKEND_URL}/api/tenant/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Fetch tenant roles error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
