import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const backendUrl = getBackendUrl()

    try {
      const response = await fetch(`${backendUrl}/api/user/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Always respond success regardless of backend outcome - never reveal
      // whether an email address has an account.
      await response.json().catch(() => null)
    } catch (error) {
      console.error('Password reset request: backend unavailable:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    )
  }
}
