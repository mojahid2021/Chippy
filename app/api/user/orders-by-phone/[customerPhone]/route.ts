import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerPhone: string }> }
) {
  try {
    // Get token from cookies
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

    const { customerPhone } = await params

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Customer phone is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

    // Build the backend URL with query parameters
    let backendUrl = `${BACKEND_URL}/api/user/orders-by-phone/${customerPhone}`
    const queryParams = new URLSearchParams()

    if (page) queryParams.append('page', page)
    if (limit) queryParams.append('limit', limit)

    if (queryParams.toString()) {
      backendUrl += `?${queryParams.toString()}`
    }

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
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
    console.error('Orders by phone fetch error:', error)
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