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
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    const apiBaseUrl = getBackendUrl()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')

    // Validate query parameters
    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)

    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Page must be a positive integer',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Limit must be between 1 and 100',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (status && !['pending', 'verifying', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Status must be one of: pending, verifying, completed, failed',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (sortBy && !['submittedAt', 'amount', 'status', 'createdAt'].includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'sortBy must be one of: submittedAt, amount, status, createdAt',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'sortOrder must be one of: asc, desc',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Build the external API URL with query parameters
    const queryParams = new URLSearchParams({
      page: pageNum.toString(),
      limit: limitNum.toString(),
    })

    if (status) queryParams.append('status', status)
    if (sortBy) queryParams.append('sortBy', sortBy)
    if (sortOrder) queryParams.append('sortOrder', sortOrder)

    const externalApiUrl = `${apiBaseUrl}/api/user/transactions?${queryParams.toString()}`

    // Forward the request to the external API
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    // Return the response from the external API
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Transactions API error:', error)
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