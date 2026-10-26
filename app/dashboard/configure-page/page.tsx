"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/lib/stores/userStore"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Save,
  RefreshCw,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Copy,
  AlertCircle,
  CheckCircle2,
  Globe,
  Key,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Check,
  Zap,
  Radio,
  Lock,
  ArrowRight
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

type TokenStatus = 'valid' | 'invalid' | 'unknown'

interface PageSettingsData {
  pageName: string
  appId: string
  appSecret: string
  accessToken: string
  tokenStatus?: TokenStatus
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
  const { canConfigureChannel } = usePermissions()
  const { toast } = useToast()
  
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(true)
  const [webhookError, setWebhookError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const [pageSettings, setPageSettings] = useState<PageSettingsData | null>(null)
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('unknown')
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

  // Fetch webhook data
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
          setWebhookError("You have no active subscription found. Please activate a subscription to enable webhooks.")
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
    } finally {
      setWebhookLoading(false)
    }
  }

  // Fetch page settings
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

      if (data.success) {
        setTokenStatus(data.data?.appCredentials?.tokenStatus || 'unknown')
      }

      if (data.success && data.data?.appCredentials) {
        setPageSettings(data.data.appCredentials)
      } else if (data.success && data.data?.appCredentials === null) {
        setPageSettings(null)
      }
    } catch (err) {
      setPageSettingsError(err instanceof Error ? err.message : 'An error occurred while fetching page settings')
    } finally {
      setPageSettingsLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhookData()
    fetchPageSettings()
  }, [token])

  const copyToClipboard = async (text: string, type: 'url' | 'token') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

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
    } catch {
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
        await fetchPageSettings()
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>Meta Webhook Bridge</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Facebook Page Integration</h1>
          <p className="text-sm text-slate-400">
            Connect your Facebook Page with BDChatPro to route customer conversations to your bilingual AI agent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pageSettings && (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              tokenStatus === 'valid' 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : tokenStatus === 'invalid'
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                tokenStatus === 'valid' ? "bg-emerald-400 animate-ping" : tokenStatus === 'invalid' ? "bg-rose-400" : "bg-blue-400"
              }`} />
              <span>{tokenStatus === 'valid' ? 'Live Connected' : tokenStatus === 'invalid' ? 'Token Expired' : 'Configured'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert if token expired */}
      {tokenStatus === 'invalid' && pageSettings && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-rose-200">Your Facebook Page access token has expired</p>
            <p className="text-slate-300 mt-0.5">
              The AI assistant can no longer send or receive messages on your Page. Please update your Page Access Token below to resume automated sales.
            </p>
          </div>
        </div>
      )}

      {/* 3-Step Setup Wizard Banner */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>3-Step Quick Integration Wizard</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="text-sm font-semibold text-white">Copy Webhook Details</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Copy your unique Webhook Callback URL and Verify Token from the section below.
            </p>
          </div>

          <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="text-sm font-semibold text-white">Configure Meta App</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              In Meta Developers Portal, paste the URL & token under <span className="text-slate-300 font-mono">Messenger → Webhooks</span> and subscribe to <span className="text-slate-300 font-mono">messages</span>.
            </p>
          </div>

          <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="text-sm font-semibold text-white">Paste Page Token</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a Page Access Token with <span className="text-slate-300 font-mono">pages_messaging</span> permission and save it below.
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Configuration Card */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Webhook Configuration</h3>
              <p className="text-xs text-slate-400">Meta Messenger callback endpoint and verification token</p>
            </div>
          </div>

          {webhookData && (
            <Badge className={`text-xs font-semibold border ${
              webhookData.isActive 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-slate-500/10 text-slate-400 border-slate-700"
            }`}>
              {webhookData.isActive ? "● Active Endpoint" : "○ Inactive"}
            </Badge>
          )}
        </div>

        {webhookLoading ? (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading webhook configuration...</p>
          </div>
        ) : webhookError ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Unable to load webhook credentials</p>
              <p className="text-slate-300 mt-1">{webhookError}</p>
            </div>
          </div>
        ) : webhookData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Webhook URL */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Callback URL (Meta Webhooks)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={webhookData.webhookUrl}
                    readOnly
                    className="font-mono text-xs bg-slate-950/70 border-white/10 text-slate-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookData.webhookUrl, 'url')}
                    className="shrink-0 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-10 px-3"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">Paste in Meta Developer Portal under Messenger Webhook</p>
              </div>

              {/* Verify Token */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verify Token</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={webhookData.webhookToken}
                    readOnly
                    type="password"
                    className="font-mono text-xs bg-slate-950/70 border-white/10 text-slate-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookData.webhookToken, 'token')}
                    className="shrink-0 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-10 px-3"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">Paste in the Verify Token field in Meta Webhooks setup</p>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Last updated: {new Date(webhookData.updatedAt).toLocaleDateString()}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchWebhookData}
                className="text-xs text-slate-400 hover:text-white h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Page Credentials Section */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-600 flex items-center justify-center text-white">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Page Access Credentials</h3>
              <p className="text-xs text-slate-400">Meta App credentials and Page Access Token</p>
            </div>
          </div>

          <div>
            {canConfigureChannel && !showCredentialForm ? (
              pageSettings ? (
                <Button
                  onClick={() => {
                    setIsEditing(true)
                    setShowCredentialForm(true)
                    setNewCredentials({
                      pageName: pageSettings.pageName,
                      appId: pageSettings.appId,
                      appSecret: "",
                      accessToken: "",
                    })
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-md"
                >
                  <SettingsIcon className="w-3.5 h-3.5 mr-1.5" />
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-md"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Connect Page Credentials
                </Button>
              )
            ) : showCredentialForm ? (
              <Button
                variant="outline"
                onClick={() => {
                  setShowCredentialForm(false)
                  setIsEditing(false)
                }}
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 px-3 rounded-md"
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        {pageSettingsLoading ? (
          <div className="py-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading page credentials...</p>
          </div>
        ) : showCredentialForm ? (
          /* Form for Entering Credentials */
          <div className="p-5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">
                {isEditing ? "Update Facebook Page Credentials" : "Enter Facebook Page Credentials"}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-slate-300">
                  Page Display Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  placeholder="e.g. Dhaka Artisan Boutique"
                  value={newCredentials.pageName}
                  onChange={(e) => setNewCredentials({ ...newCredentials, pageName: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white text-xs h-9 rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">
                  Facebook App ID <span className="text-rose-400">*</span>
                </Label>
                <Input
                  placeholder="e.g. 1048291048592"
                  value={newCredentials.appId}
                  onChange={(e) => setNewCredentials({ ...newCredentials, appId: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white text-xs h-9 font-mono rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">
                  Facebook App Secret <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showAppSecret ? "text" : "password"}
                    placeholder={isEditing ? "Re-enter App Secret to update" : "Enter App Secret from Meta dashboard"}
                    value={newCredentials.appSecret}
                    onChange={(e) => setNewCredentials({ ...newCredentials, appSecret: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white text-xs h-9 font-mono pr-10 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAppSecret(!showAppSecret)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">
                  Page Access Token <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showAccessToken ? "text" : "password"}
                    placeholder={isEditing ? "Re-enter Page Access Token to update" : "EAAB..."}
                    value={newCredentials.accessToken}
                    onChange={(e) => setNewCredentials({ ...newCredentials, accessToken: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white text-xs h-9 font-mono pr-10 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSavePageSettings}
                disabled={savingSettings || !newCredentials.pageName || !newCredentials.appId || !newCredentials.appSecret || !newCredentials.accessToken}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-5 rounded-md font-medium"
              >
                {savingSettings ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Update Credentials" : "Save Credentials"}</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : pageSettings ? (
          /* Active Credentials Readout */
          <div className="p-5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Active Facebook Connection</h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Connected & Receiving
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-md bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Page Name</span>
                <p className="text-white font-semibold text-sm">{pageSettings.pageName}</p>
              </div>

              <div className="p-3 rounded-md bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">App ID</span>
                <p className="text-white font-mono text-xs">{pageSettings.appId}</p>
              </div>

              <div className="p-3 rounded-md bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">App Secret</span>
                <p className="text-slate-400 font-mono text-xs">••••••••••••••••••••••••</p>
              </div>

              <div className="p-3 rounded-md bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Page Access Token</span>
                <p className="text-slate-400 font-mono text-xs">EAAB••••••••••••••••••••</p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="p-8 rounded-lg bg-slate-950/40 border border-slate-800 text-center space-y-3">
            <SettingsIcon className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Facebook Page Credentials Configured</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Configure your Meta App ID, App Secret, and Page Access Token to connect your Facebook Page inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}