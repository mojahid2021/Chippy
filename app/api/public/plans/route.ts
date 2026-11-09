import { NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET() {
  try {
    const baseUrl = getBackendUrl()
    const externalUrl = `${baseUrl}/api/v1/subscriptions/plans`

    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Support both format envelopes
    return NextResponse.json({
      success: true,
      message: data.message,
      data: {
        plans: data.data || [],
      },
      raw: data.data,
    })
  } catch (error) {
    console.error('Error proxying plans request:', error)
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to proxy request to external API',
      },
      { status: 500 }
    )
  }
}
