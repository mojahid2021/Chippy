import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
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

    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Order ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/user/orders/${orderId}`

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
    console.error('Order details fetch error:', error)
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