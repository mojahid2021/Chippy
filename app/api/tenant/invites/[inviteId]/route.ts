import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      )
    }

    const { inviteId } = await params
    if (!inviteId) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Invite ID is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const BACKEND_URL = getBackendUrl()
    const response = await fetch(`${BACKEND_URL}/api/tenant/invites/${inviteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Revoke invite error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
