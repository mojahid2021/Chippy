import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const { productId } = await params

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Product ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/user/products/${productId}`

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Product details fetch error:', error)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const { productId } = await params

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Product ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Get the request body
    const body = await request.json()

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/user/products/${productId}/status`

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'PUT',
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

    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Product update error:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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

    const { productId } = await params

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Product ID is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/user/products/${productId}`

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: 'DELETE',
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
    console.error('Product delete error:', error)
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