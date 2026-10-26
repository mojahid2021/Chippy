import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }

    const { memberId } = await params
    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Member ID is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const body = await request.json()
    const BACKEND_URL = getBackendUrl()

    const response = await fetch(`${BACKEND_URL}/api/tenant/members/${memberId}`, {
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
    console.error('Update member error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }

    const { memberId } = await params
    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Member ID is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const BACKEND_URL = getBackendUrl()
    const response = await fetch(`${BACKEND_URL}/api/tenant/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
