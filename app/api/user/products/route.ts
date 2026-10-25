import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive')
    const categoryId = searchParams.get('categoryId')

    // Backend URL from environment
    const BACKEND_URL = getBackendUrl()

    // Build the backend URL with query parameters
    let backendUrl = `${BACKEND_URL}/api/user/products`
    const params = new URLSearchParams()

    if (includeInactive) params.append('includeInactive', includeInactive)
    if (categoryId) params.append('categoryId', categoryId)

    if (params.toString()) {
      backendUrl += `?${params.toString()}`
    }

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Get the request body
    const body = await request.json()

    // Backend URL from environment
    const BACKEND_URL = getBackendUrl()

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/user/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}