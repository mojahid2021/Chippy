import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)

    if (!token) {
      return NextResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token',
        },
        { status: 401 }
      )
    }

    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/ai-profiles/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Get AI profile error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve AI profile',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)

    if (!token) {
      return NextResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/ai-profiles/${id}`, {
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
    console.error('Update AI profile error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update AI profile',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const authHeader = request.headers.get('authorization')
    const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)

    if (!token) {
      return NextResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token',
        },
        { status: 401 }
      )
    }

    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/ai-profiles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json().catch(() => null)
    return NextResponse.json(data || { success: true }, { status: response.status })
  } catch (error) {
    console.error('Delete AI profile error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete AI profile',
      },
      { status: 500 }
    )
  }
}

