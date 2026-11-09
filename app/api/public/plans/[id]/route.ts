import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: 'Bad Request',
          message: 'Plan ID is required',
        },
        { status: 400 }
      )
    }

    const baseUrl = getBackendUrl()
    const externalUrl = `${baseUrl}/api/v1/subscriptions/plans/${id}`

    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      data: data.data,
    })
  } catch (error) {
    console.error('Error proxying plan request:', error)
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to proxy request to external API',
      },
      { status: 500 }
    )
  }
}
