import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'JWT token is required in Authorization header',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    // Get the API base URL from environment
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBaseUrl) {
      console.error('NEXT_PUBLIC_API_BASE_URL environment variable is not set')
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration error',
          message: 'API base URL is not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    const { planId, paymentMethod } = body
    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'planId is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'paymentMethod is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Validate payment method
    const validPaymentMethods = ['bkash', 'nagad', 'rocket', 'bank_transfer', 'card']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: `Invalid payment method. Supported methods: ${validPaymentMethods.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/purchase-plan`

    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward the JWT token
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    // Return the response from the external API
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Purchase plan API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}