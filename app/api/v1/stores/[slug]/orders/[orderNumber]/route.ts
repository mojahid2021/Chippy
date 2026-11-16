import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; orderNumber: string }> }
) {
  try {
    const { slug, orderNumber } = await params
    const { searchParams } = new URL(request.url)
    const backendUrl = getBackendUrl()
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}/orders/${orderNumber}${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Track order error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to retrieve order status' },
      { status: 500 }
    )
  }
}
