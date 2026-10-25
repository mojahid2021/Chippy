import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' })
  // The session cookie is httpOnly, so it can only be cleared from a
  // server response, never from client-side document.cookie.
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
