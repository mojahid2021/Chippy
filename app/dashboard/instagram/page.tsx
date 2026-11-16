"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Camera,
  Check,
  Copy,
  Edit,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  InstagramWebhook,
  InstagramWebhooksResponse,
  InstagramEvent,
  InstagramEventsResponse,
  SyncInstagramAccountResponse,
  AiProfile,
  AiProfilesResponse,
  CompileInstagramEventPromptResponse,
  GenerateInstagramResponseResponse,
  InstagramConversationMessage,
  InstagramConversationsResponse,
  SendInstagramMessageResponse,
} from "@/lib/types/woombat"

function getDisplayWebhookUrl(webhookUrl?: string | null, webhookId?: string): string {
  if (webhookUrl && (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://"))) {
    return webhookUrl
  }

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof window !== "undefined" && window.location.port === "3000"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001")

  if (webhookUrl && webhookUrl.startsWith("/")) {
    return `${backendBase}${webhookUrl}`
  }

  if (webhookId) {
    return `${backendBase}/api/v1/webhooks/instagram/${webhookId}`
  }

  return webhookUrl || ""
}

export default function InstagramWebhooksPage() {
  const [webhooks, setWebhooks] = useState<InstagramWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<InstagramWebhook | null>(null)
  const [aiProfiles, setAiProfiles] = useState<AiProfile[]>([])

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [singleEventModalOpen, setSingleEventModalOpen] = useState(false)
  const [conversationModalOpen, setConversationModalOpen] = useState(false)
  const [manualMessageModalOpen, setManualMessageModalOpen] = useState(false)
  const [compileModalOpen, setCompileModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)

  // Form states for Create
  const [formData, setFormData] = useState({
    name: "",
    appSecret: "",
    verifyToken: "",
    instagramAccountId: "",
    pageId: "",
    accessToken: "",
    aiProfileId: "",
  })

  // Form states for Edit
  const [editData, setEditData] = useState({
    name: "",
    aiProfileId: "",
    isActive: true,
    instagramAccountId: "",
    pageId: "",
    accessToken: "",
    appSecret: "",
  })

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false)
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Events list & filter states
  const [events, setEvents] = useState<InstagramEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<InstagramEvent | null>(null)
  const [eventFilterType, setEventFilterType] = useState<string>("")
  const [eventFilterStatus, setEventFilterStatus] = useState<string>("")
  const [eventStartDate, setEventStartDate] = useState<string>("")
  const [eventEndDate, setEventEndDate] = useState<string>("")

  // Manual message states
  const [manualRecipientId, setManualRecipientId] = useState("")
  const [manualMessageText, setManualMessageText] = useState("")
  const [manualSending, setManualSending] = useState(false)

  // Conversation history states
  const [conversationMessages, setConversationMessages] = useState<InstagramConversationMessage[]>([])
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationSenderId, setConversationSenderId] = useState("")

  // Compile prompt states
  const [compilingEvent, setCompilingEvent] = useState<InstagramEvent | null>(null)
  const [compileAiProfileId, setCompileAiProfileId] = useState<string>("")
  const [compileIncludeFewShot, setCompileIncludeFewShot] = useState<boolean>(true)
  const [compileHumanize, setCompileHumanize] = useState<boolean>(true)
  const [compiledPromptResult, setCompiledPromptResult] = useState<CompileInstagramEventPromptResponse["data"] | null>(null)
  const [compileLoading, setCompileLoading] = useState(false)

  // Generate response states
  const [generatingEvent, setGeneratingEvent] = useState<InstagramEvent | null>(null)
  const [generateAiProfileId, setGenerateAiProfileId] = useState<string>("")
  const [generateSendToUser, setGenerateSendToUser] = useState<boolean>(false)
  const [generateAdditionalContext, setGenerateAdditionalContext] = useState<string>("")
  const [generateIncludeFewShot, setGenerateIncludeFewShot] = useState<boolean>(true)
  const [generateHumanize, setGenerateHumanize] = useState<boolean>(true)
  const generateVariables: Record<string, string> = {}
  const [generatedResult, setGeneratedResult] = useState<GenerateInstagramResponseResponse["data"] | null>(null)
  const [generateLoading, setGenerateLoading] = useState(false)

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/instagram/webhooks")
      const json: InstagramWebhooksResponse = await res.json()
      if (res.ok && json.data) {
        setWebhooks(json.data)
      } else {
        toast({ variant: "destructive", title: "Failed to load Instagram accounts" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error fetching Instagram accounts" })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAiProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ai-profiles?limit=100")
      const json: AiProfilesResponse = await res.json()
      if (res.ok && json.data) {
        setAiProfiles(json.data)
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
    fetchAiProfiles()
  }, [fetchWebhooks, fetchAiProfiles])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
    toast({ title: "Copied to clipboard" })
  }

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const payload: Record<string, string> = {
        name: formData.name.trim(),
        appSecret: formData.appSecret.trim(),
        instagramAccountId: formData.instagramAccountId.trim(),
      }
      if (formData.verifyToken.trim()) payload.verifyToken = formData.verifyToken.trim()
      if (formData.pageId.trim()) payload.pageId = formData.pageId.trim()
      if (formData.accessToken.trim()) payload.accessToken = formData.accessToken.trim()
      if (formData.aiProfileId.trim()) payload.aiProfileId = formData.aiProfileId.trim()

      const res = await fetch("/api/v1/instagram/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        toast({ title: "Instagram account connected", description: "Integration created successfully." })
        setCreateModalOpen(false)
        setFormData({ name: "", appSecret: "", verifyToken: "", instagramAccountId: "", pageId: "", accessToken: "", aiProfileId: "" })
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Failed to connect", description: json.message || "Invalid payload." })
      }
    } catch {
      toast({ variant: "destructive", title: "Error creating Instagram integration" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook) return

    try {
      setActionLoading(true)
      const payload: Record<string, unknown> = {
        name: editData.name.trim(),
        isActive: editData.isActive,
        aiProfileId: editData.aiProfileId.trim() || null,
      }
      if (editData.instagramAccountId.trim()) payload.instagramAccountId = editData.instagramAccountId.trim()
      if (editData.pageId.trim()) payload.pageId = editData.pageId.trim()
      if (editData.accessToken.trim()) payload.accessToken = editData.accessToken.trim()
      if (editData.appSecret.trim()) payload.appSecret = editData.appSecret.trim()

      const res = await fetch(`/api/v1/instagram/webhooks/${selectedWebhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        toast({ title: "Instagram settings updated" })
        setEditModalOpen(false)
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Update failed", description: json.message || "Error" })
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to update Instagram integration" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return

    try {
      setActionLoading(true)
      const res = await fetch(`/api/v1/instagram/webhooks/${selectedWebhook.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Instagram account removed" })
        setDeleteModalOpen(false)
        setSelectedWebhook(null)
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Delete failed" })
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to delete" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSyncAccount = async (webhookId: string) => {
    try {
      setSyncLoadingId(webhookId)
      const res = await fetch(`/api/v1/instagram/webhooks/${webhookId}/sync-account`, { method: "POST" })
      const json: SyncInstagramAccountResponse = await res.json()

      if (res.ok) {
        toast({
          title: "Account synchronized",
          description: json.data?.accountDetails?.username
            ? `Connected to @${json.data.accountDetails.username}. Webhook subscribed.`
            : "Instagram account details synchronized.",
        })
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Sync failed", description: json.message || "Meta rejected the access token." })
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to sync Instagram account" })
    } finally {
      setSyncLoadingId(null)
    }
  }

  const handleToggleActive = async (webhook: InstagramWebhook) => {
    try {
      const res = await fetch(`/api/v1/instagram/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      })
      if (res.ok) {
        toast({ title: !webhook.isActive ? "Auto-reply enabled" : "Auto-reply paused" })
        fetchWebhooks()
      }
    } catch {
      toast({ variant: "destructive", title: "Toggle failed" })
    }
  }

  const handleAiProfileChange = async (webhookId: string, aiProfileId: string) => {
    try {
      const res = await fetch(`/api/v1/instagram/webhooks/${webhookId}/ai-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProfileId: aiProfileId || null }),
      })
      if (res.ok) {
        toast({ title: "Assistant assigned" })
        fetchWebhooks()
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to assign assistant" })
    }
  }

  const fetchEvents = useCallback(
    async (webhookId: string, page = 1) => {
      try {
        setEventsLoading(true)
        const params = new URLSearchParams({ page: page.toString(), limit: "20" })
        if (eventFilterType) params.append("eventType", eventFilterType)
        if (eventFilterStatus) params.append("status", eventFilterStatus)
        if (eventStartDate) params.append("startDate", new Date(eventStartDate).toISOString())
        if (eventEndDate) {
          const end = new Date(eventEndDate)
          end.setHours(23, 59, 59, 999)
          params.append("endDate", end.toISOString())
        }

        const res = await fetch(`/api/v1/instagram/webhooks/${webhookId}/events?${params.toString()}`)
        const json: InstagramEventsResponse = await res.json()
        if (res.ok && json.data) {
          setEvents(json.data)
        }
      } catch {
        toast({ variant: "destructive", title: "Failed to fetch event logs" })
      } finally {
        setEventsLoading(false)
      }
    },
    [eventFilterType, eventFilterStatus, eventStartDate, eventEndDate]
  )

  const openEventsSheet = (webhook: InstagramWebhook) => {
    setSelectedWebhook(webhook)
    setEvents([])
    setEventFilterType("")
    setEventFilterStatus("")
    setEventStartDate("")
    setEventEndDate("")
    setEventsModalOpen(true)
    fetchEvents(webhook.id, 1)
  }

  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !manualRecipientId.trim() || !manualMessageText.trim()) return

    try {
      setManualSending(true)
      const res = await fetch(`/api/v1/instagram/webhooks/${selectedWebhook.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: manualRecipientId.trim(), text: manualMessageText.trim() }),
      })
      const json: SendInstagramMessageResponse = await res.json()
      if (res.ok) {
        toast({ title: "Message delivered to Instagram Direct" })
        setManualMessageText("")
        setManualMessageModalOpen(false)
      } else {
        toast({ variant: "destructive", title: "Send failed", description: json.message || "Failed" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error sending message" })
    } finally {
      setManualSending(false)
    }
  }

  const fetchConversationHistory = async (webhookId: string, senderId: string) => {
    try {
      setConversationLoading(true)
      setConversationSenderId(senderId)
      const res = await fetch(`/api/v1/instagram/webhooks/${webhookId}/conversations/${senderId}?limit=50`)
      const json: InstagramConversationsResponse = await res.json()
      if (res.ok && json.data) {
        setConversationMessages(json.data)
        setConversationModalOpen(true)
      } else {
        toast({ variant: "destructive", title: "No conversation history found" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error loading chat history" })
    } finally {
      setConversationLoading(false)
    }
  }

  const handleCompileEventPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !compilingEvent) return

    try {
      setCompileLoading(true)
      const res = await fetch(
        `/api/v1/instagram/webhooks/${selectedWebhook.id}/events/${compilingEvent.id}/compile-prompt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(compileAiProfileId ? { aiProfileId: compileAiProfileId } : {}),
            includeFewShot: compileIncludeFewShot,
            humanize: compileHumanize,
          }),
        }
      )
      const json: CompileInstagramEventPromptResponse = await res.json()
      if (res.ok && json.data) {
        setCompiledPromptResult(json.data)
      } else {
        toast({ variant: "destructive", title: "Compile failed", description: json.message || "Error" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error compiling prompt" })
    } finally {
      setCompileLoading(false)
    }
  }

  const handleGenerateResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !generatingEvent) return

    try {
      setGenerateLoading(true)
      const res = await fetch(
        `/api/v1/instagram/webhooks/${selectedWebhook.id}/events/${generatingEvent.id}/generate-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sendToUser: generateSendToUser,
            ...(generateAiProfileId ? { aiProfileId: generateAiProfileId } : {}),
            ...(generateAdditionalContext ? { additionalContext: generateAdditionalContext } : {}),
            ...(Object.keys(generateVariables).length ? { dynamicVariables: generateVariables } : {}),
            includeFewShot: generateIncludeFewShot,
            humanize: generateHumanize,
          }),
        }
      )
      const json: GenerateInstagramResponseResponse = await res.json()
      if (res.ok && json.data) {
        setGeneratedResult(json.data)
        toast({
          title: generateSendToUser ? "Replied to Instagram Direct" : "AI Reply Drafted",
          description: `Generated via ${json.data.modelName || "AI"} (${(json.data.latencyMs / 1000).toFixed(1)}s)`,
        })
      } else {
        toast({ variant: "destructive", title: "Generation failed", description: json.message || "Error" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error generating response" })
    } finally {
      setGenerateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram"
        description="Connect Instagram Business accounts to auto-reply to direct messages, test AI prompts, and audit delivery logs."
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Connect Instagram
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-brand" /> Loading Instagram accounts…
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={<Camera />}
          title="No Instagram accounts connected"
          body="Connect your Instagram Business account to automate customer care, answer DMs 24/7, and route conversations."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Connect your first account
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((wh) => {
            const boundProfile = aiProfiles.find((p) => p.id === wh.aiProfileId)
            const isSyncing = syncLoadingId === wh.id
            const displayUrl = getDisplayWebhookUrl(wh.webhookUrl, wh.id)

            return (
              <div key={wh.id} className="relative flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {wh.profilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={wh.profilePictureUrl} alt="" className="size-11 rounded-full object-cover ring-1 ring-border" />
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
                          <Camera className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">{wh.name}</h3>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {wh.username ? `@${wh.username}` : `ID: ${wh.instagramAccountId}`}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="-mr-1.5 -mt-1.5" aria-label="Account actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSyncAccount(wh.id)} disabled={isSyncing}>
                          <RefreshCw className={cn("mr-2 size-4", isSyncing && "animate-spin")} /> Sync from Meta
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(wh)
                            setEditData({
                              name: wh.name,
                              aiProfileId: wh.aiProfileId || "",
                              isActive: wh.isActive,
                              instagramAccountId: wh.instagramAccountId,
                              pageId: wh.pageId || "",
                              accessToken: "",
                              appSecret: "",
                            })
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="mr-2 size-4" /> Edit settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(wh)
                            setManualRecipientId("")
                            setManualMessageText("")
                            setManualMessageModalOpen(true)
                          }}
                        >
                          <Send className="mr-2 size-4" /> Send Direct Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedWebhook(wh)
                            setDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 size-4" /> Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 p-2.5">
                    <span className="text-xs font-medium">Auto-reply status</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", wh.isActive ? "bg-success" : "bg-warning")} />
                      <Switch checked={wh.isActive} onCheckedChange={() => handleToggleActive(wh)} aria-label="Toggle active" />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Label className="text-2xs text-muted-foreground">Assigned AI Assistant</Label>
                    <NativeSelect
                      value={wh.aiProfileId || ""}
                      onChange={(e) => handleAiProfileChange(wh.id, e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="">Default account assistant</option>
                      {aiProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isDefault ? "(Default)" : ""}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="mt-3">
                    <p className="text-2xs text-muted-foreground">Meta Webhook Callback URL</p>
                    <div className="mt-1 flex items-center justify-between rounded-lg bg-muted px-2.5 py-1 text-2xs font-mono">
                      <span className="truncate pr-2">{displayUrl}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 shrink-0"
                        onClick={() => copyToClipboard(displayUrl, `url-${wh.id}`)}
                        aria-label="Copy URL"
                      >
                        {copiedKey === `url-${wh.id}` ? <Check className="size-3" /> : <Copy className="size-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-3">
                  <Button variant="outline" size="sm" onClick={() => openEventsSheet(wh)} className="gap-1.5 text-xs">
                    <ListChecks className="size-3.5" /> Message Log
                  </Button>
                  {boundProfile && (
                    <Badge variant="outline" className="text-2xs font-normal">
                      <Sparkles className="mr-1 size-3 text-brand" /> {boundProfile.name}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Connect Instagram Account Modal ───────────────────────── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Instagram Business</DialogTitle>
            <DialogDescription>
              Provide your Meta App Secret and Instagram Business Account ID.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="ig-name">Integration Label *</Label>
              <Input
                id="ig-name"
                placeholder="e.g. Brand Instagram Support"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ig-acc-id">Instagram Account ID *</Label>
                <Input
                  id="ig-acc-id"
                  placeholder="e.g. 17841400000000001"
                  required
                  value={formData.instagramAccountId}
                  onChange={(e) => setFormData({ ...formData, instagramAccountId: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ig-secret">Meta App Secret *</Label>
                <Input
                  id="ig-secret"
                  type="password"
                  placeholder="fa1234..."
                  required
                  value={formData.appSecret}
                  onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ig-page-id">Connected Facebook Page ID (Optional)</Label>
                <Input
                  id="ig-page-id"
                  placeholder="e.g. 106378625516323"
                  value={formData.pageId}
                  onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ig-token">Page / System Access Token (Optional)</Label>
                <Input
                  id="ig-token"
                  type="password"
                  placeholder="EAAB..."
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ig-ai">Assign AI Assistant (Optional)</Label>
              <NativeSelect
                id="ig-ai"
                value={formData.aiProfileId}
                onChange={(e) => setFormData({ ...formData, aiProfileId: e.target.value })}
              >
                <option value="">User default assistant</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />} Connect Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Instagram Settings Modal ─────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Instagram Integration</DialogTitle>
            <DialogDescription>Update labels, assigned assistant, or credentials.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateWebhook} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Integration Label</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-acc-id">Instagram Account ID</Label>
              <Input
                id="edit-acc-id"
                value={editData.instagramAccountId}
                onChange={(e) => setEditData({ ...editData, instagramAccountId: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-ai">Assigned AI Assistant</Label>
              <NativeSelect
                id="edit-ai"
                value={editData.aiProfileId}
                onChange={(e) => setEditData({ ...editData, aiProfileId: e.target.value })}
              >
                <option value="">User default assistant</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Auto-replies active</p>
                <p className="text-2xs text-muted-foreground">Toggle to pause or resume Chippy replying to Instagram DMs.</p>
              </div>
              <Switch checked={editData.isActive} onCheckedChange={(val) => setEditData({ ...editData, isActive: val })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Disconnect Modal ──────────────────────────────────────── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Instagram Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {selectedWebhook?.name}? Chippy will stop receiving and auto-replying to direct messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWebhook} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />} Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manual Direct Message Modal ───────────────────────────── */}
      <Dialog open={manualMessageModalOpen} onOpenChange={setManualMessageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Direct Message</DialogTitle>
            <DialogDescription>
              Send an operator reply directly to an Instagram user (IGSID).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendManualMessage} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="ig-recipient">Instagram Scoped User ID (IGSID) *</Label>
              <Input
                id="ig-recipient"
                placeholder="e.g. 17841400000000001"
                required
                value={manualRecipientId}
                onChange={(e) => setManualRecipientId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ig-manual-text">Message *</Label>
              <textarea
                id="ig-manual-text"
                rows={3}
                required
                placeholder="Type your reply here…"
                className="w-full rounded-lg border bg-transparent p-2.5 text-sm"
                value={manualMessageText}
                onChange={(e) => setManualMessageText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setManualMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={manualSending}>
                {manualSending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Send className="mr-1.5 size-4" />} Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Message Log Sheet ─────────────────────────────────────── */}
      <Sheet open={eventsModalOpen} onOpenChange={setEventsModalOpen}>
        <SheetContent side="right" title="Instagram Message Log" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">{selectedWebhook?.name} Message Log</h2>
            <p className="text-xs text-muted-foreground">Audit records of received Instagram events and AI actions.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="h-8 text-xs"
                placeholder="From date"
              />
              <Input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="h-8 text-xs"
                placeholder="To date"
              />
              <NativeSelect
                value={eventFilterStatus}
                onChange={(e) => setEventFilterStatus(e.target.value)}
                className="h-8 text-xs"
              >
                <option value="">All statuses</option>
                <option value="PROCESSED">Processed</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="ERROR">Error</option>
              </NativeSelect>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, 1)}
              >
                <RefreshCw className={cn("mr-1 size-3", eventsLoading && "animate-spin")} /> Filter
              </Button>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
            {eventsLoading ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin text-brand" /> Loading events…
              </div>
            ) : events.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No events recorded matching criteria.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="rounded-xl border bg-card p-3.5 text-xs shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-2xs uppercase">
                          {ev.eventType}
                        </Badge>
                        <Badge variant={ev.status === "PROCESSED" ? "success" : ev.status === "ERROR" ? "destructive" : "outline"} className="text-2xs">
                          {ev.status}
                        </Badge>
                      </div>
                      <span className="text-2xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-2xs text-muted-foreground">
                      <span>Sender: <code className="font-mono">{ev.senderId}</code></span>
                      <button
                        type="button"
                        onClick={() => selectedWebhook && fetchConversationHistory(selectedWebhook.id, ev.senderId)}
                        className="text-brand hover:underline"
                      >
                        View thread
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-2xs px-2"
                        onClick={() => {
                          setSelectedEvent(ev)
                          setSingleEventModalOpen(true)
                        }}
                      >
                        Inspect Payload
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-2xs px-2 text-brand"
                        onClick={() => {
                          setCompilingEvent(ev)
                          setCompiledPromptResult(null)
                          setCompileModalOpen(true)
                        }}
                      >
                        <Zap className="mr-1 size-3" /> Preview AI Input
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-2xs px-2 text-brand"
                        onClick={() => {
                          setGeneratingEvent(ev)
                          setGeneratedResult(null)
                          setGenerateModalOpen(true)
                        }}
                      >
                        <Sparkles className="mr-1 size-3" /> Reply with AI
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Event JSON Inspector Modal ────────────────────────────── */}
      <Dialog open={singleEventModalOpen} onOpenChange={setSingleEventModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Instagram Event Payload</DialogTitle>
            <DialogDescription>Raw webhook payload received from Meta Graph API.</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto space-y-3">
              <pre className="rounded-xl bg-muted p-3 font-mono text-2xs overflow-auto">
                {JSON.stringify(selectedEvent.rawPayload || selectedEvent.eventData, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Preview AI Input Modal ────────────────────────────────── */}
      <Dialog open={compileModalOpen} onOpenChange={setCompileModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview AI Prompt Bundle</DialogTitle>
            <DialogDescription>Grounds prompt with AI persona, Instagram context, and instructions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompileEventPrompt} className="custom-scrollbar max-h-[65vh] space-y-4 overflow-y-auto">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ig-comp-ai">Assistant Override</Label>
                <NativeSelect
                  id="ig-comp-ai"
                  value={compileAiProfileId}
                  onChange={(e) => setCompileAiProfileId(e.target.value)}
                >
                  <option value="">Default account assistant</option>
                  {aiProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className="text-sm">Include example replies</span>
                  <Switch checked={compileIncludeFewShot} onCheckedChange={setCompileIncludeFewShot} />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <div>
                    <span className="block text-sm">Humanize directives</span>
                    <span className="block text-2xs text-muted-foreground">Inject natural conversational rules</span>
                  </div>
                  <Switch checked={compileHumanize} onCheckedChange={setCompileHumanize} />
                </label>
              </div>
            </div>
            <Button type="submit" disabled={compileLoading}>
              {compileLoading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Zap className="mr-1.5 size-4" />} Build Preview
            </Button>
            {compiledPromptResult && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold">Compiled System Prompt</p>
                <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">
                  {compiledPromptResult.compiledSystemPrompt}
                </pre>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reply with AI Modal ───────────────────────────────────── */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reply with AI</DialogTitle>
            <DialogDescription>Assistant writes a response for this Instagram DM inquiry.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateResponse} className="custom-scrollbar max-h-[65vh] space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <Label htmlFor="ig-gen-profile">AI Assistant (Optional override)</Label>
              <NativeSelect
                id="ig-gen-profile"
                value={generateAiProfileId}
                onChange={(e) => setGenerateAiProfileId(e.target.value)}
              >
                <option value="">Use webhook default AI assistant</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ig-gen-ctx">Extra Context (Optional)</Label>
              <Input
                id="ig-gen-ctx"
                placeholder="e.g. Customer is asking about black boots sizing"
                value={generateAdditionalContext}
                onChange={(e) => setGenerateAdditionalContext(e.target.value)}
              />
            </div>
            <div className="divide-y rounded-xl border">
              <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">Send directly to Instagram customer</span>
                  <span className="block text-xs text-muted-foreground">Off: just draft the reply for review.</span>
                </span>
                <Switch checked={generateSendToUser} onCheckedChange={setGenerateSendToUser} />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium">Include example replies</span>
                <Switch checked={generateIncludeFewShot} onCheckedChange={setGenerateIncludeFewShot} />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">Humanize conversation tone</span>
                  <span className="block text-xs text-muted-foreground">Inject natural conversational human behavioral directives.</span>
                </span>
                <Switch checked={generateHumanize} onCheckedChange={setGenerateHumanize} />
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={generateLoading}>
              {generateLoading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Sparkles className="mr-1.5 size-4" />}
              {generateSendToUser ? "Generate and Send" : "Draft Reply"}
            </Button>
            {generatedResult && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex gap-2">
                  <Badge variant={generatedResult.dispatchedToInstagram ? "success" : "outline"}>
                    {generatedResult.dispatchedToInstagram ? "Dispatched to IG" : "Draft Only"}
                  </Badge>
                  <Badge variant="outline">{(generatedResult.latencyMs / 1000).toFixed(1)}s</Badge>
                </div>
                <div className="rounded-xl bg-ink p-3 text-sm text-white">
                  <p className="whitespace-pre-wrap">{generatedResult.generatedResponse}</p>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Conversation History Sheet ────────────────────────────── */}
      <Sheet open={conversationModalOpen} onOpenChange={setConversationModalOpen}>
        <SheetContent side="right" title="Instagram Direct History" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="border-b p-4">
            <h2 className="text-base font-semibold">Instagram Direct History</h2>
            <p className="text-xs font-mono text-muted-foreground">{conversationSenderId}</p>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-3">
            {conversationLoading ? (
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Loading chat…
              </div>
            ) : conversationMessages.length === 0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">No chat history recorded.</p>
            ) : (
              conversationMessages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "w-fit max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "assistant" ? "ml-auto bg-ink text-white" : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <span className="mt-1 block text-right text-2xs opacity-60">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
