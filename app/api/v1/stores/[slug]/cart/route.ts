import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const cartId = request.headers.get('x-cart-id') || request.headers.get('X-Cart-ID')
    const backendUrl = getBackendUrl()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (cartId) {
      headers['X-Cart-ID'] = cartId
    }

    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}/cart`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to retrieve cart' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const cartId = request.headers.get('x-cart-id') || request.headers.get('X-Cart-ID')
    const backendUrl = getBackendUrl()

    const headers: Record<string, string> = {}
    if (cartId) {
      headers['X-Cart-ID'] = cartId
    }

    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}/cart`, {
      method: 'DELETE',
      headers,
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Clear cart error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
