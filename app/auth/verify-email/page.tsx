"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Bot, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"

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
    <div className="rounded-lg bg-[#0F172A] border border-slate-800 p-8 shadow-xl text-center">
      <div className="flex flex-col items-center space-y-4 py-4">
        {status === 'loading' && (
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
        )}
        {status === 'error' && (
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <XCircle className="h-7 w-7 text-rose-500" />
          </div>
        )}

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified Successfully!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          <p className="text-sm text-slate-400 max-w-xs">
            {status === 'loading' ? 'Please hold on while we validate your security token.' : message}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors duration-150"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center relative px-4 py-12">
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              BDChat<span className="text-blue-500">Pro</span>
            </span>
          </Link>
        </div>

        <Suspense fallback={
          <div className="rounded-lg bg-[#0F172A] border border-slate-800 p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-xs text-slate-400 mt-3">Validating token...</p>
          </div>
        }>
          <VerifyEmailStatus />
        </Suspense>
      </div>
    </div>
  )
}
