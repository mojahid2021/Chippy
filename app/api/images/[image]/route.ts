import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ image: string }> }
) {
  try {
    // Await the params
    const { image } = await params

    // Backend URL from environment
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

        // Try different possible image paths
    const possiblePaths = [
      `${BACKEND_URL}/api/images/${image}`,
      `${BACKEND_URL}/uploads/media/${image}`,
      `${BACKEND_URL}/uploads/${image}`,
      `${BACKEND_URL}/media/${image}`,
      `${BACKEND_URL}/static/images/${image}`,
      `${BACKEND_URL}/images/${image}`,
      `${BACKEND_URL}/files/${image}`,
      `${BACKEND_URL}/public/images/${image}`,
      `${BACKEND_URL}/public/uploads/${image}`,
      // Try with user-specific paths based on filename pattern
      `${BACKEND_URL}/uploads/media/aammojahid1/${image}`,
      `${BACKEND_URL}/uploads/aammojahid1/${image}`,
      `${BACKEND_URL}/media/aammojahid1/${image}`,
      // Try without any subfolder
      `${BACKEND_URL}/${image}`,
    ]

    let response: Response | null = null

    // Try each path until one works
    for (const path of possiblePaths) {
      try {
        console.log(`Trying image path: ${path}`)
        const res = await fetch(path, { method: 'GET' })
        console.log(`Response status for ${path}: ${res.status}`)
        if (res.ok) {
          response = res
          console.log(`Found image at: ${path}`)
          break
        }
      } catch (error) {
        console.log(`Error trying ${path}:`, error)
        // Continue to next path
      }
    }

    if (!response) {
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