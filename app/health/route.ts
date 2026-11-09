import { NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET() {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Service is unhealthy or unreachable',
      },
      { status: 500 }
    )
  }
}

