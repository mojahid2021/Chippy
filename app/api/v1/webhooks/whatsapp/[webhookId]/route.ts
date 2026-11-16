import { NextRequest, NextResponse } from 'next/server'
import { getBackendUrl } from '@/lib/backend-url'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const { searchParams } = new URL(request.url)
    const backendUrl = getBackendUrl()

    const response = await fetch(`${backendUrl}/api/v1/webhooks/whatsapp/${webhookId}?${searchParams.toString()}`, {
      method: 'GET',
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Meta WhatsApp verification challenge error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const backendUrl = getBackendUrl()
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    const response = await fetch(`${backendUrl}/api/v1/webhooks/whatsapp/${webhookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'X-Hub-Signature-256': signature } : {}),
      },
      body: rawBody,
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Meta WhatsApp webhook receiver error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

