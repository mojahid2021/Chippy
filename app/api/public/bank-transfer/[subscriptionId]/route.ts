import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params

    const apiBaseUrl = getBackendUrl()

    // Parse request body
    const body = await request.json()

    // Validate required fields
    const { accountNumber, transactionId } = body
    if (!accountNumber || !transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Account number and transaction ID are required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Validate subscriptionId format (basic MongoDB ObjectId validation)
    if (!/^[0-9a-fA-F]{24}$/.test(subscriptionId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription ID',
          message: 'The subscription ID format is invalid',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Forward the request to the external API
    const externalApiUrl = `${apiBaseUrl}/api/public/bank-transfer/${subscriptionId}`

    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    // Return the response from the external API
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Bank transfer confirmation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}