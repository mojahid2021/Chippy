import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    // In a real implementation, you would validate the token with your backend
    // For now, we'll simulate validation
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${backendUrl}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        return NextResponse.json({
          success: true,
          data: userData.data
        })
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        )
      }
    } catch {
      // If backend is not available, simulate success for development
      // In production, this should be removed
      console.warn('Backend not available, simulating profile validation')
      return NextResponse.json({
        success: true,
        data: {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      })
    }
  } catch {
    return NextResponse.json(
      { success: false, message: 'Profile validation failed' },
      { status: 500 }
    )
  }
}