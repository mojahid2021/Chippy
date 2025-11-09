import { NextRequest, NextResponse } from 'next/server'

// Message interfaces
interface Message {
  id: string
  messageType: string
  content: string
  timestamp: string
  isEcho: boolean
  processed: boolean
  aiResponse?: {
    id: string
    aiResponse: string
    aiModel: string
    tokensUsed: {
      prompt: number
      completion: number
      total: number
    }
    responseTime: number
    status: string
    sentToFacebook: boolean
    createdAt: string
    sentAt: string
  }
}

interface MessagesResponse {
  success: boolean
  data: Message[]
}

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

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')

    // Validate limit parameter
    let limitParam = 50 // default
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid limit parameter',
            message: 'Limit must be a number between 1 and 100',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }
      limitParam = limitNum
    }

    // Build the API URL with query parameters
    const apiUrl = new URL(`${apiBaseUrl}/api/user/messages`)
    apiUrl.searchParams.set('limit', limitParam.toString())

    // Forward the request to the backend API
    try {
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data: MessagesResponse = await response.json()

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
    console.error('Messages API error:', _error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching messages',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}