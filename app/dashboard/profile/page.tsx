"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserStore } from "@/lib/stores/userStore"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Hash,
  AtSign
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
  })

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return

      try {
        setLoading(true)
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (data.success && data.data) {
          setProfile(data.data)
          setFormData({
            firstName: data.data.firstName || "",
            lastName: data.data.lastName || "",
            email: data.data.email || "",
            username: data.data.username || "",
            phone: data.data.phone || "",
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = async () => {
    if (!token || !profile) return

    try {
      setUpdating(true)

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setProfile(data.data)
        setIsEditing(false)
      } else {
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        username: profile.username || "",
        phone: profile.phone || "",
      })
    }
    setIsEditing(false)
  }

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
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-slate-50 border-slate-200" : "border-slate-200 focus:border-blue-500"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center space-x-2 text-sm font-medium">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>Last Name</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-slate-50 border-slate-200" : "border-slate-200 focus:border-blue-500"}
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
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-slate-50 border-slate-200" : "border-slate-200 focus:border-blue-500"}
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-slate-50 border-slate-200" : "border-slate-200 focus:border-blue-500"}
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
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-slate-50 border-slate-200" : "border-slate-200 focus:border-blue-500"}
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-xs text-slate-500">Optional: Used for account verification and support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}