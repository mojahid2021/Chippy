import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const baseUrl = getBackendUrl()

    // Construct the external API URL
    const externalUrl = `${baseUrl}/api/public/plans?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`

    // Forward the request to the external API
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers if needed
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plans', message: 'External API error' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying plans request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to proxy request to external API'
      },
      { status: 500 }
    )
  }
}