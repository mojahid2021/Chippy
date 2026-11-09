"use client"

import { Logo } from "@/components/logo"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2, Users, ArrowRight, LogIn } from "lucide-react"

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center"><Logo /></div>

        <Card className="bg-card border-border text-foreground shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-info-soft border border-info/30 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">Workspace Invitation</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              You have been invited to collaborate with a team on BDChatPro.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {!token ? (
              <Alert className="bg-destructive-soft border-destructive/30 text-destructive">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  Invalid invitation link. Please verify the link from your invitation email.
                </AlertDescription>
              </Alert>
            ) : success ? (
              <div className="space-y-4 text-center">
                <Alert className="bg-success-soft border-success/30 text-success">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>
                    Congratulations! You have successfully joined the workspace.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg border border-border text-xs text-foreground/80">
                  Signed in as: <span className="font-semibold text-foreground">{user.email}</span>
                </div>

                {error && (
                  <Alert className="bg-destructive-soft border-destructive/30 text-destructive">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
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
                <div className="p-3 bg-warning-soft border border-warning/30 rounded-lg text-xs text-warning">
                  Please sign in with the email address that received the invitation to accept.
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    <Link href={`/auth/signin?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}>
                      <LogIn className="h-4 w-4 mr-2" /> Sign In to Accept
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-border text-foreground/80 hover:bg-muted"
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
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
