"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/lib/stores/userStore"
import { useToast } from "@/hooks/use-toast"
import { PageHeader, EmptyState } from "@/components/page-header"
import { Check, CheckCircle2, Copy, Loader2, UserX, XCircle } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: string
  phone?: string
  createdAt: string
  isActive: boolean
  isEmailVerified: boolean
}

export default function ProfilePage() {
  const { token } = useUserStore()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don’t match", description: "Type the new password the same way twice.", variant: "destructive" })
      return
    }
    try {
      setChangingPassword(true)
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ variant: "success", title: "Password changed", description: "Use your new password next time you sign in." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({ title: "Password not changed", description: data.message || "Check your current password and try again.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Password not changed", description: "Couldn’t reach the server. Try again in a moment.", variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/v1/auth/me")
        const data = await response.json()
        if (response.ok && data.data) setProfile(data.data)
      } catch {
        // Falls through to the empty state below.
      } finally {
        setLoading(false)
      }
    }
    void fetchProfile()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading your profile
      </div>
    )
  }

  if (!profile) {
    return (
      <EmptyState
        icon={<UserX />}
        title="Your profile didn’t load"
        body="Check your connection, then try again."
        action={<Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>}
      />
    )
  }

  const displayName = profile.name || `${profile.firstName} ${profile.lastName}`.trim()
  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"

  return (
    <div className="space-y-8">
      <PageHeader title="Profile & security" description="Your account details and password." />

      <section className="flex flex-col gap-5 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand font-display text-2xl font-bold">{initials}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl">{displayName}</h2>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="capitalize">{(profile.role || "user").toLowerCase()}</Badge>
            {profile.isEmailVerified ? <Badge variant="success"><CheckCircle2 />Email verified</Badge> : <Badge variant="warning"><XCircle />Email not verified</Badge>}
            {!profile.isActive && <Badge variant="destructive">Account inactive</Badge>}
          </div>
        </div>
      </section>

      <Section title="Personal details" hint="Contact support to change your name or email.">
        <dl className="divide-y rounded-2xl border">
          {[
            ["First name", profile.firstName],
            ["Last name", profile.lastName],
            ["Email", profile.email],
            ["Phone", profile.phone],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="truncate">{value || <span className="text-muted-foreground">Not added</span>}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Password" hint="Use at least 8 characters. You’ll stay signed in on this device.">
        <form onSubmit={handleChangePassword} className="space-y-4 rounded-2xl border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Type it again</Label>
              <Input id="confirmNewPassword" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} aria-invalid={mismatch || undefined} onChange={(e) => setConfirmPassword(e.target.value)} />
              {mismatch && <p className="text-xs text-destructive">Doesn’t match the new password.</p>}
            </div>
          </div>
          <Button type="submit" disabled={changingPassword || mismatch}>
            {changingPassword && <Loader2 className="animate-spin" />}
            Change password
          </Button>
        </form>
      </Section>

      <Section title="Account">
        <dl className="divide-y rounded-2xl border">
          <div className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3 text-sm">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{profile.isActive ? "Active" : "Inactive — contact support"}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] items-center gap-4 px-4 py-2 text-sm">
            <dt className="text-muted-foreground">Account ID</dt>
            <dd className="flex items-center gap-1">
              <code className="min-w-0 truncate font-mono text-xs">{profile.id}</code>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy account ID"
                onClick={() => {
                  navigator.clipboard.writeText(profile.id)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </dd>
          </div>
        </dl>
      </Section>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <div>
        <h2 className="text-lg">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
