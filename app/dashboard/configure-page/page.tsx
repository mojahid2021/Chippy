"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/lib/stores/userStore"
import { useToast } from "@/hooks/use-toast"
import {
  Save,
  RefreshCw,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Copy,
  AlertCircle,
  CheckCircle,
  Facebook,
  Key,
  Shield,
  Globe,
  Eye,
  EyeOff,
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
  pageName: string
  appId: string
  appSecret: string
  accessToken: string
}

interface PageSettingsResponse {
  success: boolean
  data?: {
    appCredentials: PageSettingsData | null
  }
  error?: string
  message: string
  timestamp: string
}

export default function FBPageSettingsPage() {
  const { token } = useUserStore()
  const { toast } = useToast()
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
  const [isEditing, setIsEditing] = useState(false)
  
  const [showAppSecret, setShowAppSecret] = useState(false)
  const [showAccessToken, setShowAccessToken] = useState(false)

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

        if (data.success && data.data?.appCredentials) {
          setPageSettings(data.data.appCredentials)
        } else if (data.success && data.data?.appCredentials === null) {
          setPageSettings(null)
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
        toast({
          variant: "success",
          title: "Copied!",
          description: "Webhook URL copied to clipboard",
        })
      } else {
        setCopiedToken(true)
        setTimeout(() => setCopiedToken(false), 2000)
        toast({
          variant: "success",
          title: "Copied!",
          description: "Verify token copied to clipboard",
        })
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Please try copying manually",
      })
    }
  }

  const handleSavePageSettings = async () => {
    if (!token) return

    if (!newCredentials.pageName || !newCredentials.appId || !newCredentials.appSecret || !newCredentials.accessToken) {
      toast({
        variant: "warning",
        title: "Missing Fields",
        description: "Please fill in all required fields",
      })
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
          if (fetchData.success && fetchData.data?.appCredentials) {
            setPageSettings(fetchData.data.appCredentials)
          } else if (fetchData.success && fetchData.data?.appCredentials === null) {
            setPageSettings(null)
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

        toast({
          variant: "success",
          title: "Success!",
          description: isEditing ? "Page credentials updated successfully" : "Page credentials saved successfully",
        })
      }
    } catch (err) {
      console.error('Error saving page settings:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to save page settings',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6 mx-auto">
      {/* Page Header */}
      {/* <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
            <Facebook className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Facebook Page Setup</h1>
            <p className="text-blue-100 mt-1">Configure your Facebook page integration and webhook settings</p>
          </div>
        </div>
      </div> */}

      {/* Webhook Information */}
      <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-linear-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Webhook Configuration</CardTitle>
                <CardDescription className="text-blue-700">Configure your Facebook webhook endpoints</CardDescription>
              </div>
            </div>
            {webhookData && (
              <Badge variant={webhookData.isActive ? "default" : "secondary"} className="text-sm">
                {webhookData.isActive ? "● Active" : "○ Inactive"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">{webhookLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3"></div>
                <span className="text-gray-600 font-medium">Loading webhook information...</span>
              </div>
            </div>
          ) : webhookError ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-900 font-semibold mb-1">Webhook Configuration Error</p>
                    <p className="text-red-700 text-sm mb-3">{webhookError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => window.location.href = '/dashboard/plans'}
                    >
                      View Available Plans
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : webhookData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-semibold text-gray-800">Webhook URL</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={webhookData.webhookUrl}
                      readOnly
                      className="font-mono text-sm bg-gray-50 border-gray-300"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhookData.webhookUrl, 'url')}
                      className="shrink-0 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                    >
                      {copiedUrl ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-blue-600" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 flex items-start gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Use this URL in your Facebook App webhook settings</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-semibold text-gray-800">Verify Token</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={webhookData.webhookToken}
                      readOnly
                      type="password"
                      className="font-mono text-sm bg-gray-50 border-gray-300"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhookData.webhookToken, 'token')}
                      className="shrink-0 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                    >
                      {copiedToken ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-blue-600" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 flex items-start gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Use this token to verify webhook requests</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Last updated: {new Date(webhookData.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                  <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Page Credentials */}
      <Card className="border-green-100 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-linear-to-r from-green-50 to-green-100/50 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-900">Page Credentials</CardTitle>
                <CardDescription className="text-green-700">Manage your Facebook page access credentials</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">{pageSettingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-600 mx-auto mb-3"></div>
                <span className="text-gray-600 font-medium">Loading page credentials...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add/Update Credentials Button */}
              <div className="flex justify-end">
                {!showCredentialForm ? (
                  pageSettings ? (
                    <Button
                      onClick={() => {
                        setIsEditing(true)
                        setShowCredentialForm(true)
                        setNewCredentials({
                          pageName: pageSettings.pageName,
                          appId: pageSettings.appId,
                          appSecret: pageSettings.appSecret,
                          accessToken: pageSettings.accessToken,
                        })
                      }}
                      className="bg-blue-600 hover:bg-blue-700 shadow-md"
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Update Credentials
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setShowCredentialForm(true)
                        setNewCredentials({
                          pageName: "",
                          appId: "",
                          appSecret: "",
                          accessToken: "",
                        })
                      }}
                      className="bg-green-600 hover:bg-green-700 shadow-md"
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Add Credentials
                    </Button>
                  )
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCredentialForm(false)
                      setIsEditing(false)
                      setNewCredentials({
                        pageName: "",
                        appId: "",
                        appSecret: "",
                        accessToken: "",
                      })
                    }}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Configuration Form */}
              {showCredentialForm && (
                <div className="bg-linear-to-br from-gray-50 to-gray-100/50 border-2 border-dashed border-gray-300 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="h-5 w-5 text-gray-700" />
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {isEditing ? 'Update Page Credentials' : 'Configure Page Credentials'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageName" className="text-sm font-medium text-gray-700">
                        Page Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pageName"
                        placeholder="Enter Facebook page name"
                        value={newCredentials.pageName}
                        onChange={(e) => setNewCredentials({ ...newCredentials, pageName: e.target.value })}
                        required
                        className="border-gray-300 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appId" className="text-sm font-medium text-gray-700">
                        App ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="appId"
                        placeholder="Enter Facebook App ID"
                        value={newCredentials.appId}
                        onChange={(e) => setNewCredentials({ ...newCredentials, appId: e.target.value })}
                        required
                        className="border-gray-300 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appSecret" className="text-sm font-medium text-gray-700">
                        App Secret <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="appSecret"
                          type={showAppSecret ? "text" : "password"}
                          placeholder="Enter Facebook App Secret"
                          value={newCredentials.appSecret}
                          onChange={(e) => setNewCredentials({ ...newCredentials, appSecret: e.target.value })}
                          required
                          className="border-gray-300 focus:border-green-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowAppSecret(!showAppSecret)}
                        >
                          {showAppSecret ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessToken" className="text-sm font-medium text-gray-700">
                        Access Token <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="accessToken"
                          type={showAccessToken ? "text" : "password"}
                          placeholder="Enter Page Access Token"
                          value={newCredentials.accessToken}
                          onChange={(e) => setNewCredentials({ ...newCredentials, accessToken: e.target.value })}
                          required
                          className="border-gray-300 focus:border-green-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowAccessToken(!showAccessToken)}
                        >
                          {showAccessToken ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleSavePageSettings}
                      disabled={savingSettings || !newCredentials.pageName || !newCredentials.appId || !newCredentials.appSecret || !newCredentials.accessToken}
                      className={`shadow-md ${isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      {savingSettings ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {isEditing ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {isEditing ? 'Update Credentials' : 'Save Credentials'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Credentials Display */}
              {pageSettingsError ? (
                <div className="text-center py-10">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 max-w-md mx-auto">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SettingsIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Page Credentials Configured</h3>
                    <p className="text-gray-600 text-sm">Configure your page credentials to enable page integration and start managing your Facebook page</p>
                  </div>
                </div>
              ) : (pageSettings && !showCredentialForm) ? (
                <div className="bg-linear-to-br from-green-50 to-green-100/30 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900 text-lg">Active Page Credentials</h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Facebook className="h-3.5 w-3.5" />
                        Page Name
                      </Label>
                      <Input
                        value={pageSettings.pageName}
                        readOnly
                        className="font-mono text-sm bg-white border-green-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Key className="h-3.5 w-3.5" />
                        App ID
                      </Label>
                      <Input
                        value={pageSettings.appId}
                        readOnly
                        className="font-mono text-sm bg-white border-green-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        App Secret
                      </Label>
                      <Input
                        value={pageSettings.appSecret}
                        readOnly
                        type="password"
                        className="font-mono text-sm bg-white border-green-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Key className="h-3.5 w-3.5" />
                        Access Token
                      </Label>
                      <Input
                        value={pageSettings.accessToken}
                        readOnly
                        type="password"
                        className="font-mono text-sm bg-white border-green-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-green-200 mt-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-sm text-green-700 font-medium">
                      Credentials configured and ready to use
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}