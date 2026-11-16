import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const cartId = request.headers.get('x-cart-id') || request.headers.get('X-Cart-ID')
    const body = await request.json()
    const backendUrl = getBackendUrl()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (cartId) {
      headers['X-Cart-ID'] = cartId
    }

    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}/cart/coupon`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Apply cart coupon error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to apply coupon' },
      { status: 500 }
    )
  }
}
