import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function PUT(
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

    // Parse request body
    const body = await request.json()

    // Validate required fields if provided
    const validStatuses = ['draft', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded']

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (body.paymentStatus && !validPaymentStatuses.includes(body.paymentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment status',
          message: `Payment status must be one of: ${validPaymentStatuses.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Backend URL from environment
    const BACKEND_URL = getBackendUrl()

    // Build the backend URL for status update
    const backendUrl = `${BACKEND_URL}/api/user/orders/${orderId}/status`

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Order status update error:', error)
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