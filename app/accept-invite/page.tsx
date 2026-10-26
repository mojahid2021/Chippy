"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, CheckCircle2, AlertCircle, Loader2, Users, ArrowRight, LogIn } from "lucide-react"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { user, token: sessionToken, loadTenantContext, switchTenant } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [acceptedTenantId, setAcceptedTenantId] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!token) {
      setError("Invitation token is missing from URL.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/tenant/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        const tenantId = data.data?.tenantId
        setAcceptedTenantId(tenantId)
        if (tenantId) {
          await switchTenant(tenantId)
        } else {
          await loadTenantContext()
        }
      } else {
        setError(data.message || "Failed to accept invite. The invitation may be expired or already accepted.")
      }
    } catch {
      setError("Network error while accepting invitation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">BDChatPro</span>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Workspace Invitation</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              You have been invited to collaborate with a team on BDChatPro.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {!token ? (
              <Alert className="bg-red-950/50 border-red-800 text-red-200">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription>
                  Invalid invitation link. Please verify the link from your invitation email.
                </AlertDescription>
              </Alert>
            ) : success ? (
              <div className="space-y-4 text-center">
                <Alert className="bg-emerald-950/50 border-emerald-800 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <AlertDescription>
                    Congratulations! You have successfully joined the workspace.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs text-slate-300">
                  Signed in as: <span className="font-semibold text-white">{user.email}</span>
                </div>

                {error && (
                  <Alert className="bg-red-950/50 border-red-800 text-red-200">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting...
                    </>
                  ) : (
                    "Accept & Join Workspace"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200">
                  Please sign in with the email address that received the invitation to accept.
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    <Link href={`/auth/signin?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                      <LogIn className="h-4 w-4 mr-2" /> Sign In to Accept
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Link href={`/auth/signin?tab=register&redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                      Create an Account
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
