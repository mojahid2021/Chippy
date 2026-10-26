import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }

    const { tenantId } = await params
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Tenant ID is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const BACKEND_URL = getBackendUrl()
    const response = await fetch(`${BACKEND_URL}/api/tenant/${tenantId}/switch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const newToken: string | undefined = data?.data?.token
    const res = NextResponse.json(data, { status: 200 })

    if (newToken) {
      res.cookies.set('auth_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
    }

    return res
  } catch (error) {
    console.error('Switch tenant error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
