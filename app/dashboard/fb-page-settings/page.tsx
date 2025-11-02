"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/lib/stores/userStore"
import {
  Facebook,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Link as LinkIcon,
  MessageSquare,
  Users,
  Eye,
  Settings as SettingsIcon,
  Bell,
  Zap,
  Copy,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FacebookPage {
  id: string
  name: string
  pageId: string
  accessToken: string
  isConnected: boolean
  followers: number
  posts: number
  lastSync: string
}

interface WebhookData {
  webhookUrl: string
  webhookToken: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface WebhookResponse {
  success: boolean
  data?: WebhookData
  error?: string
  message: string
  timestamp: string
}

interface PageSettingsData {
  appCredentials: {
    appId: string
    isActive: boolean
    lastUsed: string
    createdAt: string
    updatedAt: string
  }
  pageTokens: Array<{
    pageId: string
    pageName: string
    accessToken: string
    isActive: boolean
    lastUsed: string
    createdAt: string
    updatedAt: string
  }>
}

interface PageSettingsResponse {
  success: boolean
  data?: PageSettingsData
  error?: string
  message: string
  timestamp: string
}

export default function FBPageSettingsPage() {
  const { token } = useUserStore()
  const [pages, setPages] = useState<FacebookPage[]>([])

  const [webhookData, setWebhookData] = useState<WebhookData | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(true)
  const [webhookError, setWebhookError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const [pageSettings, setPageSettings] = useState<PageSettingsData | null>(null)
  const [pageSettingsLoading, setPageSettingsLoading] = useState(true)
  const [pageSettingsError, setPageSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  const [newCredentials, setNewCredentials] = useState({
    pageName: "",
    appId: "",
    appSecret: "",
    accessToken: "",
  })

  const [newPage, setNewPage] = useState({
    name: "",
    pageId: "",
    accessToken: "",
  })

  const [autoPost, setAutoPost] = useState({
    enabled: false,
    frequency: "daily",
    time: "09:00",
  })

  const [notifications, setNotifications] = useState({
    newFollowers: false,
    newMessages: false,
    postPerformance: false,
    pageMentions: false,
  })

  const [postingRules, setPostingRules] = useState({
    requireApproval: false,
    maxPostsPerDay: 5,
    contentGuidelines: "",
  })

  const handleAddPage = () => {
    if (newPage.name && newPage.pageId && newPage.accessToken) {
      const page: FacebookPage = {
        id: Date.now().toString(),
        name: newPage.name,
        pageId: newPage.pageId,
        accessToken: newPage.accessToken,
        isConnected: false,
        followers: 0,
        posts: 0,
        lastSync: new Date().toISOString(),
      }
      setPages([...pages, page])
      setNewPage({ name: "", pageId: "", accessToken: "" })
    }
  }

  const handleRemovePage = (id: string) => {
    setPages(pages.filter(page => page.id !== id))
  }

  const handleConnectPage = (id: string) => {
    setPages(pages.map(page =>
      page.id === id
        ? { ...page, isConnected: !page.isConnected }
        : page
    ))
  }

  // Fetch webhook data on component mount
  useEffect(() => {
    const fetchWebhookData = async () => {
      if (!token) return

      try {
        setWebhookLoading(true)
        setWebhookError(null)

        const response = await fetch('/api/user/webhook-tokens', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data: WebhookResponse = await response.json()

        if (!response.ok) {
          if (response.status === 404 && data.error === "Webhook token not found") {
            setWebhookError("You have no subscription found. Please purchase a subscription")
          } else {
            throw new Error(data.message || 'Failed to fetch webhook data')
          }
          return
        }

        if (data.success && data.data) {
          setWebhookData(data.data)
        }
      } catch (err) {
        setWebhookError(err instanceof Error ? err.message : 'An error occurred while fetching webhook data')
        console.error('Error fetching webhook data:', err)
      } finally {
        setWebhookLoading(false)
      }
    }

    fetchWebhookData()
  }, [token])

  // Fetch page settings on component mount
  useEffect(() => {
    const fetchPageSettings = async () => {
      if (!token) return

      try {
        setPageSettingsLoading(true)
        setPageSettingsError(null)

        const response = await fetch('/api/user/settings/page', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data: PageSettingsResponse = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            setPageSettingsError("No Facebook page settings configured yet")
          } else {
            throw new Error(data.message || 'Failed to fetch page settings')
          }
          return
        }

        if (data.success && data.data) {
          setPageSettings(data.data)
        }
      } catch (err) {
        setPageSettingsError(err instanceof Error ? err.message : 'An error occurred while fetching page settings')
        console.error('Error fetching page settings:', err)
      } finally {
        setPageSettingsLoading(false)
      }
    }

    fetchPageSettings()
  }, [token])

  const copyToClipboard = async (text: string, type: 'url' | 'token') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedToken(true)
        setTimeout(() => setCopiedToken(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleSavePageSettings = async () => {
    if (!token) return

    if (!newCredentials.pageName || !newCredentials.appId || !newCredentials.appSecret || !newCredentials.accessToken) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSavingSettings(true)

      const response = await fetch('/api/user/settings/page', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCredentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save page settings')
      }

      if (data.success) {
        // Refresh page settings
        const fetchResponse = await fetch('/api/user/settings/page', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (fetchResponse.ok) {
          const fetchData: PageSettingsResponse = await fetchResponse.json()
          if (fetchData.success && fetchData.data) {
            setPageSettings(fetchData.data)
          }
        }

        // Clear form
        setNewCredentials({
          pageName: "",
          appId: "",
          appSecret: "",
          accessToken: "",
        })

        alert('Page settings saved successfully!')
      }
    } catch (err) {
      console.error('Error saving page settings:', err)
      alert(err instanceof Error ? err.message : 'Failed to save page settings')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FB Page Settings</h1>
          <p className="text-gray-600 mt-1">Manage your Facebook page connections and automation settings</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Webhook Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            <span>Webhook Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhookLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">Loading webhook information...</span>
            </div>
          ) : webhookError ? (
            <div className="flex items-center justify-center py-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <div>
                <p className="text-red-600 font-medium">{webhookError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.href = '/dashboard/plans'}
                >
                  View Plans
                </Button>
              </div>
            </div>
          ) : webhookData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Webhook URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={webhookData.webhookUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhookData.webhookUrl, 'url')}
                      className="shrink-0"
                    >
                      {copiedUrl ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use this URL in your Facebook App webhook settings
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Verify Token</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={webhookData.webhookToken}
                      readOnly
                      type="password"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhookData.webhookToken, 'token')}
                      className="shrink-0"
                    >
                      {copiedToken ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use this token to verify webhook requests
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <Badge variant={webhookData.isActive ? "default" : "secondary"}>
                    {webhookData.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Last updated: {new Date(webhookData.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Page Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5 text-green-600" />
            <span>Page Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pageSettingsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
              <span className="text-gray-600">Loading page credentials...</span>
            </div>
          ) : pageSettingsError ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
                <div>
                  <p className="text-orange-600 font-medium">{pageSettingsError}</p>
                  <p className="text-sm text-gray-600 mt-1">Configure your Facebook app credentials below</p>
                </div>
              </div>

              {/* Configuration Form */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Configure Facebook App Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageName">Page Name</Label>
                    <Input
                      id="pageName"
                      placeholder="Enter Facebook page name"
                      value={newCredentials.pageName}
                      onChange={(e) => setNewCredentials({ ...newCredentials, pageName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appId">App ID</Label>
                    <Input
                      id="appId"
                      placeholder="Enter Facebook App ID"
                      value={newCredentials.appId}
                      onChange={(e) => setNewCredentials({ ...newCredentials, appId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appSecret">App Secret</Label>
                    <Input
                      id="appSecret"
                      type="password"
                      placeholder="Enter Facebook App Secret"
                      value={newCredentials.appSecret}
                      onChange={(e) => setNewCredentials({ ...newCredentials, appSecret: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="Enter Page Access Token"
                      value={newCredentials.accessToken}
                      onChange={(e) => setNewCredentials({ ...newCredentials, accessToken: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSavePageSettings}
                  disabled={savingSettings}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Credentials
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : pageSettings ? (
            <div className="space-y-6">
              {/* App Credentials */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Facebook App Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">App ID</Label>
                    <Input
                      value={pageSettings.appCredentials.appId}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={pageSettings.appCredentials.isActive ? "default" : "secondary"}>
                        {pageSettings.appCredentials.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                  <div className="text-sm text-gray-600">
                    Created: {new Date(pageSettings.appCredentials.createdAt).toLocaleDateString()}
                    {pageSettings.appCredentials.lastUsed && (
                      <span className="ml-4">
                        Last used: {new Date(pageSettings.appCredentials.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Page Tokens */}
              {pageSettings.pageTokens.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Connected Pages</h4>
                  <div className="space-y-4">
                    {pageSettings.pageTokens.map((pageToken, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Facebook className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">{pageToken.pageName}</h5>
                            <p className="text-sm text-gray-600">Page ID: {pageToken.pageId}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <Badge variant={pageToken.isActive ? "default" : "secondary"}>
                                {pageToken.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {pageToken.lastUsed && (
                                <span className="text-xs text-gray-500">
                                  Last used: {new Date(pageToken.lastUsed).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(pageToken.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Credentials */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Update Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="updatePageName">Page Name</Label>
                    <Input
                      id="updatePageName"
                      placeholder="Enter Facebook page name"
                      value={newCredentials.pageName}
                      onChange={(e) => setNewCredentials({ ...newCredentials, pageName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="updateAppId">App ID</Label>
                    <Input
                      id="updateAppId"
                      placeholder="Enter Facebook App ID"
                      value={newCredentials.appId}
                      onChange={(e) => setNewCredentials({ ...newCredentials, appId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="updateAppSecret">App Secret</Label>
                    <Input
                      id="updateAppSecret"
                      type="password"
                      placeholder="Enter Facebook App Secret"
                      value={newCredentials.appSecret}
                      onChange={(e) => setNewCredentials({ ...newCredentials, appSecret: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="updateAccessToken">Access Token</Label>
                    <Input
                      id="updateAccessToken"
                      type="password"
                      placeholder="Enter Page Access Token"
                      value={newCredentials.accessToken}
                      onChange={(e) => setNewCredentials({ ...newCredentials, accessToken: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSavePageSettings}
                  disabled={savingSettings}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Credentials
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Connected Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            <span>Connected Facebook Pages</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Pages */}
          <div className="space-y-4">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Facebook className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{page.name}</h4>
                    <p className="text-sm text-gray-600">Page ID: {page.pageId}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {page.followers} followers
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {page.posts} posts
                      </span>
                      <span className="text-xs text-gray-500">
                        Last sync: {new Date(page.lastSync).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={page.isConnected ? "default" : "secondary"}
                    className={cn(
                      page.isConnected ? "bg-green-100 text-green-800" : ""
                    )}
                  >
                    {page.isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectPage(page.id)}
                  >
                    {page.isConnected ? "Disconnect" : "Connect"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePage(page.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Page */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Add New Facebook Page</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  placeholder="Enter page name"
                  value={newPage.name}
                  onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageId">Page ID</Label>
                <Input
                  id="pageId"
                  placeholder="Enter Facebook Page ID"
                  value={newPage.pageId}
                  onChange={(e) => setNewPage({ ...newPage, pageId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Enter access token"
                  value={newPage.accessToken}
                  onChange={(e) => setNewPage({ ...newPage, accessToken: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleAddPage}
              className="mt-4"
              disabled={!newPage.name || !newPage.pageId || !newPage.accessToken}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto Posting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Auto Posting Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Auto Posting</Label>
              <p className="text-sm text-gray-600">Automatically post content to connected Facebook pages</p>
            </div>
            <input
              type="checkbox"
              checked={autoPost.enabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoPost({ ...autoPost, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {autoPost.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Posting Frequency</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={autoPost.frequency}
                    onChange={(e) => setAutoPost({ ...autoPost, frequency: e.target.value })}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postTime">Posting Time</Label>
                  <Input
                    id="postTime"
                    type="time"
                    value={autoPost.time}
                    onChange={(e) => setAutoPost({ ...autoPost, time: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Posting Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Posting Rules & Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require Approval</Label>
              <p className="text-sm text-gray-600">All posts need manual approval before publishing</p>
            </div>
            <input
              type="checkbox"
              checked={postingRules.requireApproval}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostingRules({ ...postingRules, requireApproval: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPosts">Maximum Posts Per Day</Label>
            <Input
              id="maxPosts"
              type="number"
              min="1"
              max="50"
              value={postingRules.maxPostsPerDay}
              onChange={(e) => setPostingRules({ ...postingRules, maxPostsPerDay: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guidelines">Content Guidelines</Label>
            <textarea
              id="guidelines"
              placeholder="Enter content guidelines for posts..."
              value={postingRules.contentGuidelines}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPostingRules({ ...postingRules, contentGuidelines: e.target.value })}
              rows={4}
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">New Followers</Label>
              <p className="text-sm text-gray-600">Get notified when someone follows your page</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newFollowers}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifications({ ...notifications, newFollowers: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">New Messages</Label>
              <p className="text-sm text-gray-600">Get notified about new messages and comments</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newMessages}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifications({ ...notifications, newMessages: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Post Performance</Label>
              <p className="text-sm text-gray-600">Get weekly reports on post performance</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.postPerformance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifications({ ...notifications, postPerformance: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Page Mentions</Label>
              <p className="text-sm text-gray-600">Get notified when your page is mentioned</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.pageMentions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotifications({ ...notifications, pageMentions: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <RefreshCw className="h-6 w-6 mb-2" />
              <span className="text-sm">Sync All Pages</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Eye className="h-6 w-6 mb-2" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <LinkIcon className="h-6 w-6 mb-2" />
              <span className="text-sm">Test Connection</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <SettingsIcon className="h-6 w-6 mb-2" />
              <span className="text-sm">Advanced Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}