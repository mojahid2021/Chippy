"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  AtSign,
  Loader2,
  KeyRound
} from "lucide-react"

interface UserProfile {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  phone: string
  createdAt: string
  isActive: boolean
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
        toast({ title: "Error", description: data.message || "Failed to change password", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setChangingPassword(false)
    }
  }

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return

      try {
        setLoading(true)
        // Session is carried by the httpOnly cookie automatically; no
        // Authorization header is needed (or trusted) on this route.
        const response = await fetch('/api/user/profile')

        const data = await response.json()

        if (data.success && data.data) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Failed to load profile</p>
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

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-fit">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 shadow-sm h-full">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg text-slate-900">
                {profile.firstName} {profile.lastName}
              </CardTitle>
              <p className="text-sm text-slate-600">@{profile.username}</p>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {/* Account Status */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                profile.isActive
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`h-3 w-3 rounded-full ${
                  profile.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className={`text-sm font-medium ${
                    profile.isActive ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {profile.isActive ? 'Active Account' : 'Inactive Account'}
                  </p>
                  <p className={`text-xs ${
                    profile.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profile.isActive ? 'Verified and ready to use' : 'Account needs verification'}
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Hash className="h-4 w-4 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">User ID</p>
                    <p className="text-slate-700 font-mono text-xs truncate">{profile.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Member Since</p>
                    <p className="text-slate-700">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <Shield className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Account Security: High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center space-x-2 text-sm font-medium">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>First Name</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={profile.firstName || ""}
                    disabled
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center space-x-2 text-sm font-medium">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>Last Name</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={profile.lastName || ""}
                    disabled
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center space-x-2 text-sm font-medium">
                  <AtSign className="h-4 w-4 text-blue-600" />
                  <span>Username</span>
                </Label>
                <Input
                  id="username"
                  value={profile.username || ""}
                  disabled
                  className="bg-slate-50 border-slate-200"
                />
                <p className="text-xs text-slate-500">Your unique username for identification</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="bg-slate-50 border-slate-200"
                />
                <p className="text-xs text-slate-500">This email is used for account notifications and login</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ""}
                  disabled
                  className="bg-slate-50 border-slate-200"
                  placeholder="Not provided"
                />
                <p className="text-xs text-slate-500">Editing profile details isn&apos;t available yet. Contact support to update this information.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <KeyRound className="h-5 w-5 text-blue-600" />
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={changingPassword}>
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