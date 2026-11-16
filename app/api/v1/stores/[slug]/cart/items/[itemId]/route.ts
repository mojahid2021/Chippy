import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params
    const cartId = request.headers.get('x-cart-id') || request.headers.get('X-Cart-ID')
    const body = await request.json()
    const backendUrl = getBackendUrl()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (cartId) {
      headers['X-Cart-ID'] = cartId
    }

    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Update cart item error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const { slug, itemId } = await params
    const cartId = request.headers.get('x-cart-id') || request.headers.get('X-Cart-ID')
    const backendUrl = getBackendUrl()

    const headers: Record<string, string> = {}
    if (cartId) {
      headers['X-Cart-ID'] = cartId
    }

    const response = await fetch(`${backendUrl}/api/v1/stores/${slug}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers,
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}
