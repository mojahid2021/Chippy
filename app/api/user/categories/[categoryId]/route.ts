import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { categoryId } = await params
    const body = await request.json()

    const BACKEND_URL = getBackendUrl()
    const backendUrl = `${BACKEND_URL}/api/user/categories/${categoryId}`

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    const { categoryId } = await params

    const BACKEND_URL = getBackendUrl()
    const backendUrl = `${BACKEND_URL}/api/user/categories/${categoryId}`

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Category delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
