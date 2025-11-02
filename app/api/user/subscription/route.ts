import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/subscription`

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader, // Forward the JWT token
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    // Return the response from the external API
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Get subscription API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching subscription details',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}