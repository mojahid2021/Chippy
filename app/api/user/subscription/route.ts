import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(request: NextRequest) {
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

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/user/subscription`

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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