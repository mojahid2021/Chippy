"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await fetch('/api/user/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
              BDChat<span className="text-blue-500">Pro</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Reset your password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your registered account email to receive a recovery link.
          </p>
        </div>

        <div className="rounded-lg bg-[#0F172A] border border-slate-800 p-6 sm:p-7 shadow-xl">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Check your email</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If an account exists for <span className="text-white font-medium">{email}</span>, we&apos;ve sent instructions to reset your password.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="pl-9 bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
