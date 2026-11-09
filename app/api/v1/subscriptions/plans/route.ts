import { NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET() {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/subscriptions/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Fetch plans error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch subscription plans',
      },
      { status: 500 }
    )
  }
}

