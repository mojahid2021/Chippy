import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Get public store error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to retrieve store' },
      { status: 500 }
    )
  }
}
