import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    // Get the API base URL from environment
    const apiBaseUrl = process.env.BACKEND_URL
    if (!apiBaseUrl) {
      console.error('BACKEND_URL environment variable is not set')
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

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/webhook-tokens`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      } else {
        // If external API returns error, check if it's 404 (endpoint not found)
        if (response.status === 404) {
          // Mock response for development - simulate no subscription
          return NextResponse.json(
            {
              success: false,
              error: 'Webhook token not found',
              message: 'You have no subscription found. Please purchase a subscription.',
              timestamp: new Date().toISOString(),
            },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { success: false, message: 'Failed to fetch webhook tokens' },
          { status: response.status }
        )
      }
    } catch {
      // If backend is not available, simulate success for development
      // In production, this should be removed
      console.warn('Backend not available, simulating webhook tokens response')
      return NextResponse.json({
        success: false,
        error: 'Webhook token not found',
        message: 'You have no subscription found. Please purchase a subscription.',
        timestamp: new Date().toISOString(),
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Webhook tokens API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching webhook tokens',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}