"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserStore } from "@/lib/stores/userStore"
import { User, Mail, Phone, Calendar, Shield, Edit3, Save, X } from "lucide-react"

export default function ProfilePage() {
  const { user } = useUserStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = () => {
    // TODO: Implement save functionality with API call
    console.log("Saving profile:", formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCancel} className="flex items-center space-x-2">
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-900 text-white text-2xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">
                {user?.firstName} {user?.lastName}
              </CardTitle>
              <p className="text-gray-600">{user?.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Active Account</p>
                  <p className="text-xs text-green-600">Verified and ready to use</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Account Security: High</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Member since: January 2025</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
                <p className="text-xs text-gray-500">This email is used for account notifications and login</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-xs text-gray-500">Optional: Used for account verification and support</p>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">2</div>
                  <div className="text-sm text-gray-600">Connected Accounts</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">5</div>
                  <div className="text-sm text-gray-600">Scheduled Posts</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">AI Generated Content</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications about your account activity</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Danger Zone</h4>
                  <p className="text-sm text-red-600">Irreversible actions that affect your account</p>
                </div>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}