import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(request: NextRequest) {
  try {
    // Get token from the httpOnly session cookie
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be signed in to perform this action',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    const apiBaseUrl = getBackendUrl()

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
        'Authorization': `Bearer ${token}`,
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