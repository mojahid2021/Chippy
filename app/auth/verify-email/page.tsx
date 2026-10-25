"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

function VerifyEmailStatus() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : 'This verification link is missing its token.')

  useEffect(() => {
    if (!token) return

    fetch(`/api/user/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success')
          setMessage(data.message || 'Your email has been verified.')
        } else {
          setStatus('error')
          setMessage(data.message || 'This verification link is invalid or has expired.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Network error. Please try again.')
      })
  }, [token])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Email verification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center space-y-3 py-4">
          {status === 'loading' && <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="h-10 w-10 text-green-600" />}
          {status === 'error' && <XCircle className="h-10 w-10 text-red-600" />}
          <p className="text-sm text-gray-700">
            {status === 'loading' ? 'Verifying your email...' : message}
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-500">
            Go to dashboard
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-blue-600" />}>
        <VerifyEmailStatus />
      </Suspense>
    </div>
  )
}
