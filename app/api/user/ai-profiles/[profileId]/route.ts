import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
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

    // Await params in Next.js 15
    const { profileId } = await params
    if (!profileId || typeof profileId !== 'string' || profileId.length < 1 || profileId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile ID',
          message: 'Profile ID must be 1-100 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/ai-profiles/${profileId}`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      // Return the response from the backend
      return NextResponse.json(data, { status: response.status })
    } catch (_error) {
      console.error('Backend connection error:', _error)
      return NextResponse.json(
        {
          success: false,
          error: 'Backend unavailable',
          message: 'Unable to connect to the backend service',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }
  } catch (_error) {
    console.error('AI profile GET API error:', _error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching AI profile',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
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

    // Await params in Next.js 15
    const { profileId } = await params
    if (!profileId || typeof profileId !== 'string' || profileId.length < 1 || profileId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile ID',
          message: 'Profile ID must be 1-100 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Get request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/ai-profiles/${profileId}`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      // Return the response from the backend
      return NextResponse.json(data, { status: response.status })
    } catch (_error) {
      console.error('Backend connection error:', _error)
      return NextResponse.json(
        {
          success: false,
          error: 'Backend unavailable',
          message: 'Unable to connect to the backend service',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }
  } catch (_error) {
    console.error('AI profile PUT API error:', _error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while updating AI profile',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
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

    // Await params in Next.js 15
    const { profileId } = await params
    if (!profileId || typeof profileId !== 'string' || profileId.length < 1 || profileId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile ID',
          message: 'Profile ID must be 1-100 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/ai-profiles/${profileId}`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      // Return the response from the backend
      return NextResponse.json(data, { status: response.status })
    } catch (_error) {
      console.error('Backend connection error:', _error)
      return NextResponse.json(
        {
          success: false,
          error: 'Backend unavailable',
          message: 'Unable to connect to the backend service',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }
  } catch (_error) {
    console.error('AI profile DELETE API error:', _error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while deleting AI profile',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}