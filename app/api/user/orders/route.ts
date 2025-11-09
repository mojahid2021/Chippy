import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const customerPhone = searchParams.get('customerPhone')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

    // Build the backend URL with query parameters
    let backendUrl = `${BACKEND_URL}/api/user/orders`
    const params = new URLSearchParams()

    if (page) params.append('page', page)
    if (limit) params.append('limit', limit)
    if (status) params.append('status', status)
    if (paymentStatus) params.append('paymentStatus', paymentStatus)
    if (customerPhone) params.append('customerPhone', customerPhone)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    if (params.toString()) {
      backendUrl += `?${params.toString()}`
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
    console.error('Orders fetch error:', error)
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