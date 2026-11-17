import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const backendUrl = getBackendUrl()
    const mediaKey = Array.isArray(path) ? path.join('/') : path
    const response = await fetch(`${backendUrl}/api/v1/media/${mediaKey}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Media not found' }))
      return NextResponse.json(data, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const cacheControl = response.headers.get('cache-control') || 'public, max-age=31536000, immutable'

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    })
  } catch (error) {
    console.error('Stream media error:', error)
    return NextResponse.json(
      { statusCode: 500, error: 'Internal Server Error', message: 'Failed to retrieve media file' },
      { status: 500 }
    )
  }
}
