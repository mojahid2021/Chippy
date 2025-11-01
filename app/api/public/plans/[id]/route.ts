import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate the ID format (basic validation)
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID', message: 'Plan ID must be a valid 24-character string' },
        { status: 400 }
      )
    }

    // Get base URL from environment or use default
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com'

    // Construct the external API URL
    const externalUrl = `${baseUrl}/api/public/plans/${id}`

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
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Plan not found', message: 'The requested plan does not exist' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to fetch plan', message: 'External API error' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying plan request:', error)
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