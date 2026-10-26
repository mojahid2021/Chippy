import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

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
    const apiBaseUrl = getBackendUrl()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const includeAIResponses = searchParams.get('includeAIResponses')

    // Build the API URL with query parameters
    const apiUrl = new URL(`${apiBaseUrl}/api/user/messages`)
    if (limit) {
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50)
      apiUrl.searchParams.set('limit', limitNum.toString())
    }
    if (includeAIResponses !== null) {
      apiUrl.searchParams.set('includeAIResponses', includeAIResponses)
    }

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