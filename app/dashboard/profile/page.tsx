"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserStore } from "@/lib/stores/userStore"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Hash,
  Loader2,
  KeyRound,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from "lucide-react"

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast({ title: "Validation Error", description: "New password must be at least 8 characters long.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Validation Error", description: "New passwords do not match.", variant: "destructive" })
      return
    }

    try {
      setChangingPassword(true)
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Your password has been changed." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({ title: "Notice", description: data.message || "Password change service unavailable", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  // Fetch user profile data from /api/v1/auth/me
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/auth/me')
        const data = await response.json()

        if (response.ok && data.data) {
          setProfile(data.data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Failed to load profile</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const displayName = profile.name || `${profile.firstName} ${profile.lastName}`.trim()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 h-fit">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card className="border border-border h-full py-0 gap-0">
            <CardHeader className="text-center pb-2 pt-4">
              <div className="flex justify-center mb-2.5">
                <Avatar className="h-14 w-14">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-base text-foreground">
                {displayName}
              </CardTitle>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize font-medium">
                  {profile.role || 'USER'}
                </Badge>
                {profile.isEmailVerified ? (
                  <Badge className="bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-warning-soft text-warning border-warning/30 text-[10px] py-0 px-1.5 flex items-center gap-1">
                    <XCircle className="w-2.5 h-2.5" />
                    Unverified
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 pb-4">
              {/* Account Status */}
              <div className={`flex items-center space-x-2.5 p-2 rounded-lg border ${
                profile.isActive
                  ? 'bg-success-soft border-success/30'
                  : 'bg-destructive-soft border-destructive/30'
              }`}>
                <div className={`h-2.5 w-2.5 rounded-full ${
                  profile.isActive ? 'bg-success' : 'bg-destructive'
                }`}></div>
                <div>
                  <p className={`text-xs font-semibold ${
                    profile.isActive ? 'text-success' : 'text-destructive'
                  }`}>
                    {profile.isActive ? 'Active Account' : 'Inactive Account'}
                  </p>
                  <p className={`text-[10px] ${
                    profile.isActive ? 'text-success' : 'text-destructive'
                  }`}>
                    {profile.isActive ? 'Account in good standing' : 'Account needs attention'}
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5 text-xs">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground tracking-wide">User ID</p>
                    <p className="text-foreground font-mono text-[11px] truncate">{profile.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground tracking-wide">Member Since</p>
                    <p className="text-foreground text-xs">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground tracking-wide">Role & Permissions</p>
                    <p className="text-foreground text-xs font-medium">{profile.role || 'USER'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-1">
          <Card className="border border-border h-full py-0 gap-0">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="flex items-center space-x-2 text-sm font-bold">
                <User className="h-4 w-4 text-primary" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="flex items-center space-x-1.5 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>First Name</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={profile.firstName || ""}
                    disabled
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="flex items-center space-x-1.5 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Last Name</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={profile.lastName || ""}
                    disabled
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fullName" className="flex items-center space-x-1.5 text-xs font-medium">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Display Name</span>
                </Label>
                <Input
                  id="fullName"
                  value={displayName}
                  disabled
                  className="bg-background border-border h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="flex items-center space-x-1.5 text-xs font-medium">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="bg-background border-border h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">This email is used for account notifications and login</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="flex items-center space-x-1.5 text-xs font-medium">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ""}
                  disabled
                  className="bg-background border-border h-8 text-xs"
                  placeholder="Not provided"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-border py-0 gap-0">
        <CardHeader className="pt-3 pb-2">
          <CardTitle className="flex items-center space-x-2 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3.5">
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
            <div className="space-y-1">
              <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-xs">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword" className="text-xs">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={changingPassword}>
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
