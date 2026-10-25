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
        // Never send the real Facebook App Secret / Page Access Token to the
        // browser — mask them so they can't be read from devtools or an XSS.
        const credentials = data?.data?.appCredentials
        if (credentials && typeof credentials === 'object') {
          const mask = (value: unknown) =>
            typeof value === 'string' && value.length > 4
              ? `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`
              : '****'
          credentials.appSecret = mask(credentials.appSecret)
          credentials.accessToken = mask(credentials.accessToken)
        }
        return NextResponse.json(data, { status: response.status })
      } else if (response.status === 404) {
        // No credentials configured yet - a real, known state.
        return NextResponse.json(
          {
            success: true,
            data: { appCredentials: null },
            message: 'Settings retrieved successfully',
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch page settings',
            message: 'The backend returned an unexpected error',
            timestamp: new Date().toISOString(),
          },
          { status: response.status }
        )
      }
    } catch (error) {
      console.error('Page settings GET backend connection error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Backend unavailable',
          message: 'Unable to connect to the backend service',
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      )
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
    } catch (error) {
      console.error('Page settings POST backend connection error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Backend unavailable',
          message: 'Unable to connect to the backend service',
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      )
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