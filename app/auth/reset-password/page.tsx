"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/signin'), 2500)
      } else {
        setError(data.message || 'This reset link is invalid or has expired.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-[#0F172A] border border-slate-800 p-6 sm:p-7 shadow-xl">
      {success ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Password Updated</h3>
            <p className="text-xs text-slate-400">
              Your password has been changed successfully. Redirecting to sign in...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!token && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>This link is missing a reset token. Please request a new recovery link.</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="newPassword" className="block text-xs font-medium text-slate-300">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="pl-9 bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
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
            disabled={loading || !token}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Password...</span>
              </span>
            ) : (
              "Set New Password"
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
  )
}

export default function ResetPasswordPage() {
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
          <h1 className="text-xl font-bold text-white tracking-tight">Create new password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose a secure password for your BDChatPro account.
          </p>
        </div>

        <Suspense fallback={
          <div className="rounded-lg bg-[#0F172A] border border-slate-800 p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading token...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
