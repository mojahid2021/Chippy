import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ image: string }> }
) {
  try {
    // Await the params
    const { image } = await params

    // Backend URL from environment
    const BACKEND_URL = getBackendUrl()

    // The backend serves all uploaded media from this single, unauthenticated,
    // filename-sanitized route (see userRoutes `/images/:filename`), regardless
    // of which user uploaded it — there is no per-user path to brute-force.
    const response = await fetch(`${BACKEND_URL}/api/user/images/${image}`, { method: 'GET' }).catch(() => null)

    if (!response || !response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image not found',
          message: 'The requested image does not exist on the backend',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })

  } catch (error) {
    console.error('Image serving error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Image not found',
        message: 'The requested image does not exist',
        timestamp: new Date().toISOString()
      },
      { status: 404 }
    )
  }
}