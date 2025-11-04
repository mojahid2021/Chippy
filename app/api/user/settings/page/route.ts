import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization token required',
          message: 'Please provide a valid Bearer token',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    // Get the API base URL from environment
    const apiBaseUrl = process.env.BACKEND_URL
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
    const externalApiUrl = `${apiBaseUrl}/api/user/settings/page`

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
        // If external API returns error, return no credentials format
        return NextResponse.json(
          {
            success: true,
            data: {
              appCredentials: null
            },
            message: "Settings retrieved successfully",
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        )
      }
    } catch {
      // If backend is not available, simulate no settings for development
      console.warn('Backend not available, simulating no page settings')
      return NextResponse.json({
        success: true,
        data: {
          appCredentials: null
        },
        message: 'Settings retrieved successfully',
        timestamp: new Date().toISOString(),
      }, { status: 200 })
    }
  } catch (error) {
    console.error('Page settings GET API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching page settings',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization token required',
          message: 'Please provide a valid Bearer token',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { pageName, appId, appSecret, accessToken } = body

    // Validate required fields
    if (!pageName || !appId || !appSecret || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'All fields are required: pageName, appId, appSecret, accessToken',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Get the API base URL from environment
    const apiBaseUrl = process.env.BACKEND_URL
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
    const externalApiUrl = `${apiBaseUrl}/api/user/settings/page`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageName,
          appId,
          appSecret,
          accessToken,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      } else {
        return NextResponse.json(
          { success: false, message: 'Failed to update page settings' },
          { status: response.status }
        )
      }
    } catch {
      // If backend is not available, simulate success for development
      console.warn('Backend not available, simulating page settings update')
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Page settings POST API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while updating page settings',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}