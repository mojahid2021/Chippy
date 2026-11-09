"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <Logo />
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Reset your password</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your registered account email to receive a recovery link.
          </p>
        </div>

        <div className="rounded-lg bg-card border border-border p-6 sm:p-7 shadow-xl">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-success-soft border border-success/30 text-success mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Check your email</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If an account exists for <span className="text-foreground font-medium">{email}</span>, we&apos;ve sent instructions to reset your password.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-medium text-foreground/80">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-md h-9 text-xs"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive-soft border border-destructive/30 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md transition-colors"
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
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
