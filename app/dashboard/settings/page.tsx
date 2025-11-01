"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Bell, Shield, Palette, Globe, Save } from "lucide-react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    analytics: true,
    dataSharing: false,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and configurations</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>General Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="john.doe@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="utc">
              <option value="utc">UTC</option>
              <option value="est">Eastern Time</option>
              <option value="pst">Pacific Time</option>
              <option value="gmt">GMT</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) =>
                setNotifications(prev => ({ ...prev, email: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) =>
                setNotifications(prev => ({ ...prev, push: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Marketing Communications</Label>
              <p className="text-sm text-gray-600">Receive updates about new features and promotions</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.marketing}
              onChange={(e) =>
                setNotifications(prev => ({ ...prev, marketing: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="daily">
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Profile Visibility</Label>
              <p className="text-sm text-gray-600">Make your profile visible to other users</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.profileVisible}
              onChange={(e) =>
                setPrivacy(prev => ({ ...prev, profileVisible: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Analytics Tracking</Label>
              <p className="text-sm text-gray-600">Allow anonymous usage analytics</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.analytics}
              onChange={(e) =>
                setPrivacy(prev => ({ ...prev, analytics: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Data Sharing</Label>
              <p className="text-sm text-gray-600">Share anonymized data with partners</p>
            </div>
            <input
              type="checkbox"
              checked={privacy.dataSharing}
              onChange={(e) =>
                setPrivacy(prev => ({ ...prev, dataSharing: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h4>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="system">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Sidebar Position</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="left">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Compact Mode</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" defaultValue="comfortable">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Advanced Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">API Access</h4>
                <p className="text-sm text-gray-600">Generate API keys for integrations</p>
              </div>
              <Button variant="outline">Manage API Keys</Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Data Export</h4>
                <p className="text-sm text-gray-600">Download your data in various formats</p>
              </div>
              <Button variant="outline">Export Data</Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Cache Management</h4>
                <p className="text-sm text-gray-600">Clear cached data and refresh content</p>
              </div>
              <Button variant="outline">Clear Cache</Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h4 className="font-medium text-red-900">Danger Zone</h4>
                <p className="text-sm text-red-600">Irreversible actions that affect your account</p>
              </div>
              <Button variant="destructive">Reset Account</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}