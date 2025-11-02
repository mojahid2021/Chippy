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
  Save,
  RefreshCw,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Copy,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

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
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(true)
  const [webhookError, setWebhookError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const [pageSettings, setPageSettings] = useState<PageSettingsData | null>(null)
  const [pageSettingsLoading, setPageSettingsLoading] = useState(true)
  const [pageSettingsError, setPageSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showCredentialForm, setShowCredentialForm] = useState(false)

  const [newCredentials, setNewCredentials] = useState({
    pageName: "",
    appId: "",
    appSecret: "",
    accessToken: "",
  })

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
      // Try modern clipboard API first (works in HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand('copy')
        if (!successful) {
          throw new Error('Fallback copy method failed')
        }

        document.body.removeChild(textArea)
      }

      // Show success feedback
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedToken(true)
        setTimeout(() => setCopiedToken(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback: show alert with the text
      alert(`Copy failed. Please manually copy: ${text}`)
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

        // Clear form and hide it
        setNewCredentials({
          pageName: "",
          appId: "",
          appSecret: "",
          accessToken: "",
        })
        setShowCredentialForm(false)

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
          ) : (
            <div className="space-y-6">
              {/* Add Credentials Button - Always Visible */}
              <div className="flex justify-end">
                {!showCredentialForm ? (
                  <Button
                    onClick={() => setShowCredentialForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Add Credentials
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCredentialForm(false)
                      setNewCredentials({
                        pageName: "",
                        appId: "",
                        appSecret: "",
                        accessToken: "",
                      })
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Configuration Form */}
              {showCredentialForm && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Configure Facebook App Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageName">Page Name *</Label>
                      <Input
                        id="pageName"
                        placeholder="Enter Facebook page name"
                        value={newCredentials.pageName}
                        onChange={(e) => setNewCredentials({ ...newCredentials, pageName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appId">App ID *</Label>
                      <Input
                        id="appId"
                        placeholder="Enter Facebook App ID"
                        value={newCredentials.appId}
                        onChange={(e) => setNewCredentials({ ...newCredentials, appId: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appSecret">App Secret *</Label>
                      <Input
                        id="appSecret"
                        type="password"
                        placeholder="Enter Facebook App Secret"
                        value={newCredentials.appSecret}
                        onChange={(e) => setNewCredentials({ ...newCredentials, appSecret: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessToken">Access Token *</Label>
                      <Input
                        id="accessToken"
                        type="password"
                        placeholder="Enter Page Access Token"
                        value={newCredentials.accessToken}
                        onChange={(e) => setNewCredentials({ ...newCredentials, accessToken: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleSavePageSettings}
                      disabled={savingSettings || !newCredentials.pageName || !newCredentials.appId || !newCredentials.appSecret || !newCredentials.accessToken}
                      className="bg-green-600 hover:bg-green-700"
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
              )}

              {/* Existing Credentials Display */}
              {pageSettingsError ? (
                <div className="text-center py-6">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Facebook Page Credentials Configured</h3>
                  <p className="text-gray-600">Configure your Facebook app credentials to enable page integration</p>
                </div>
              ) : pageSettings ? (
                <>
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
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}