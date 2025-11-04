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
    const externalApiUrl = `${apiBaseUrl}/api/user/ai-profiles`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        return NextResponse.json(data, { status: response.status })
      } else {
        // Return the error from the backend
        return NextResponse.json(data, { status: response.status })
      }
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
    console.error('AI profiles GET API error:', _error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching AI profiles',
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

    // Parse and validate request body
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

    // Basic validation
    if (!requestBody.id || typeof requestBody.id !== 'string' || requestBody.id.length < 1 || requestBody.id.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'id is required and must be 1-100 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (!requestBody.name || typeof requestBody.name !== 'string' || requestBody.name.length < 1 || requestBody.name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'name is required and must be 1-100 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (requestBody.description && (typeof requestBody.description !== 'string' || requestBody.description.length > 500)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'description must be a string with max 500 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (requestBody.personality && (typeof requestBody.personality !== 'string' || requestBody.personality.length > 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'personality must be a string with max 1000 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (requestBody.instructions && (typeof requestBody.instructions !== 'string' || requestBody.instructions.length > 2000)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'instructions must be a string with max 2000 characters',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (requestBody.isDefault !== undefined && typeof requestBody.isDefault !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'isDefault must be a boolean',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/ai-profiles`

    try {
      const response = await fetch(externalApiUrl, {
        method: 'POST',
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
    console.error('AI profiles POST API error:', _error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating AI profile',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
