import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-utils'

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  })

  res.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  })

  return res
}
