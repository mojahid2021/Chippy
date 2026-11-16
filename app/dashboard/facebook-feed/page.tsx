"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  Check,
  Copy,
  Edit,
  ExternalLink,
  ListChecks,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  MessageSquareQuote,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  FacebookFeedWebhook,
  FacebookFeedWebhooksResponse,
  FacebookFeedReplyMode,
  FacebookFeedEvent,
  FacebookFeedEventsResponse,
  FacebookFeedCommentMessage,
  FacebookFeedCommentsResponse,
  SyncFacebookFeedPageResponse,
  CompileFacebookFeedPromptResponse,
  GenerateFacebookFeedResponseResponse,
  AiProfile,
  AiProfilesResponse,
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
    return `${backendBase}/api/v1/webhooks/facebook-feed/${webhookId}`
  }

  return webhookUrl || ""
}

const REPLY_MODE_CONFIG: Record<
  FacebookFeedReplyMode,
  { label: string; description: string; badgeClass: string; icon: typeof MessageSquare }
> = {
  PUBLIC_COMMENT: {
    label: "Public comment reply",
    description: "Replies directly under the customer’s comment on the Facebook post.",
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    icon: MessageSquare,
  },
  PRIVATE_MESSAGE: {
    label: "Private Messenger DM",
    description: "Sends a private Messenger direct message to the commenter via Meta recipient.comment_id.",
    badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    icon: Lock,
  },
  BOTH: {
    label: "Public comment & Private DM",
    description: "Posts a public reply under the comment and also sends a private direct message.",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: Share2,
  },
}

export default function FacebookFeedWebhooksPage() {
  const [webhooks, setWebhooks] = useState<FacebookFeedWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<FacebookFeedWebhook | null>(null)
  const [aiProfiles, setAiProfiles] = useState<AiProfile[]>([])

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [singleEventModalOpen, setSingleEventModalOpen] = useState(false)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false)
  const [manualReplyModalOpen, setManualReplyModalOpen] = useState(false)
  const [compileModalOpen, setCompileModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)

  // Form states for Create
  const [formData, setFormData] = useState<{
    name: string
    pageId: string
    appSecret: string
    verifyToken: string
    pageAccessToken: string
    aiProfileId: string
    replyMode: FacebookFeedReplyMode
    autoReply: boolean
  }>({
    name: "",
    pageId: "",
    appSecret: "",
    verifyToken: "",
    pageAccessToken: "",
    aiProfileId: "",
    replyMode: "PUBLIC_COMMENT",
    autoReply: true,
  })

  // Form states for Edit
  const [editData, setEditData] = useState<{
    name: string
    replyMode: FacebookFeedReplyMode
    autoReply: boolean
    isActive: boolean
    aiProfileId: string
    pageId: string
    pageAccessToken: string
    appSecret: string
  }>({
    name: "",
    replyMode: "PUBLIC_COMMENT",
    autoReply: true,
    isActive: true,
    aiProfileId: "",
    pageId: "",
    pageAccessToken: "",
    appSecret: "",
  })

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false)
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Events list & filter states
  const [events, setEvents] = useState<FacebookFeedEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<FacebookFeedEvent | null>(null)
  const [eventFilterStatus, setEventFilterStatus] = useState<string>("")
  const [eventFilterPostId, setEventFilterPostId] = useState<string>("")
  const [eventFilterCommentId, setEventFilterCommentId] = useState<string>("")

  // Post comments & thread states
  const [commentsPostId, setCommentsPostId] = useState<string>("")
  const [postComments, setPostComments] = useState<FacebookFeedCommentMessage[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Manual reply states
  const [replyTargetCommentId, setReplyTargetCommentId] = useState("")
  const [replyModeType, setReplyModeType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC")
  const [manualReplyText, setManualReplyText] = useState("")
  const [manualSending, setManualSending] = useState(false)

  // Compile prompt states
  const [compilingEvent, setCompilingEvent] = useState<FacebookFeedEvent | null>(null)
  const [compileAdditionalContext, setCompileAdditionalContext] = useState<string>("")
  const [compileHumanize, setCompileHumanize] = useState<boolean>(true)
  const [compiledPromptResult, setCompiledPromptResult] = useState<CompileFacebookFeedPromptResponse["data"] | null>(null)
  const [compileLoading, setCompileLoading] = useState(false)

  // Generate response states
  const [generatingEvent, setGeneratingEvent] = useState<FacebookFeedEvent | null>(null)
  const [generateUserInquiry, setGenerateUserInquiry] = useState<string>("")
  const [generateReplyModeOverride, setGenerateReplyModeOverride] = useState<FacebookFeedReplyMode>("PUBLIC_COMMENT")
  const [generateSendReply, setGenerateSendReply] = useState<boolean>(false)
  const [generateAdditionalContext, setGenerateAdditionalContext] = useState<string>("")
  const [generateHumanize, setGenerateHumanize] = useState<boolean>(true)
  const [generatedResult, setGeneratedResult] = useState<GenerateFacebookFeedResponseResponse["data"] | null>(null)
  const [generateLoading, setGenerateLoading] = useState(false)

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/facebook-feed/webhooks")
      const json: FacebookFeedWebhooksResponse = await res.json()
      if (res.ok && json.data) {
        setWebhooks(json.data)
      } else {
        toast({ variant: "destructive", title: "Failed to load Facebook Feed webhooks" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error fetching Facebook Feed webhooks" })
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
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        appSecret: formData.appSecret.trim(),
        pageId: formData.pageId.trim(),
        replyMode: formData.replyMode,
        autoReply: formData.autoReply,
      }
      if (formData.verifyToken.trim()) payload.verifyToken = formData.verifyToken.trim()
      if (formData.pageAccessToken.trim()) payload.pageAccessToken = formData.pageAccessToken.trim()
      if (formData.aiProfileId.trim()) payload.aiProfileId = formData.aiProfileId.trim()

      const res = await fetch("/api/v1/facebook-feed/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        toast({ title: "Page Feed connected", description: "Facebook Feed webhook integration created successfully." })
        setCreateModalOpen(false)
        setFormData({
          name: "",
          pageId: "",
          appSecret: "",
          verifyToken: "",
          pageAccessToken: "",
          aiProfileId: "",
          replyMode: "PUBLIC_COMMENT",
          autoReply: true,
        })
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Failed to connect", description: json.message || "Invalid payload." })
      }
    } catch {
      toast({ variant: "destructive", title: "Error creating Facebook Feed integration" })
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
        replyMode: editData.replyMode,
        autoReply: editData.autoReply,
        isActive: editData.isActive,
        aiProfileId: editData.aiProfileId.trim() || null,
      }
      if (editData.pageId.trim()) payload.pageId = editData.pageId.trim()
      if (editData.pageAccessToken.trim()) payload.pageAccessToken = editData.pageAccessToken.trim()
      if (editData.appSecret.trim()) payload.appSecret = editData.appSecret.trim()

      const res = await fetch(`/api/v1/facebook-feed/webhooks/${selectedWebhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok) {
        toast({ title: "Updated", description: "Facebook Feed webhook configuration updated." })
        setEditModalOpen(false)
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Update failed", description: json.message || "Error" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error updating Facebook Feed webhook" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/v1/facebook-feed/webhooks/${selectedWebhook.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Deleted", description: "Facebook Feed webhook integration deleted." })
        setDeleteModalOpen(false)
        setSelectedWebhook(null)
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Delete failed" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error deleting webhook" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSyncPage = async (webhookId: string) => {
    try {
      setSyncLoadingId(webhookId)
      const res = await fetch(`/api/v1/facebook-feed/webhooks/${webhookId}/sync-page`, {
        method: "POST",
      })
      const json: SyncFacebookFeedPageResponse = await res.json()
      if (res.ok) {
        toast({
          title: "Page details synchronized",
          description: json.data?.pageDetails?.name
            ? `Subscribed to feed events for ${json.data.pageDetails.name}.`
            : "Facebook Page details updated.",
        })
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Sync failed", description: json.message || "Failed to reach Meta Graph API." })
      }
    } catch {
      toast({ variant: "destructive", title: "Sync error" })
    } finally {
      setSyncLoadingId(null)
    }
  }

  const handleBindAiProfile = async (webhookId: string, aiProfileId: string) => {
    try {
      const res = await fetch(`/api/v1/facebook-feed/webhooks/${webhookId}/ai-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProfileId: aiProfileId || null }),
      })
      if (res.ok) {
        toast({ title: "Assistant bound", description: "Active AI Profile updated for this Page Feed." })
        fetchWebhooks()
      } else {
        toast({ variant: "destructive", title: "Failed to bind assistant" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error binding assistant" })
    }
  }

  const handleToggleAutoReply = async (webhook: FacebookFeedWebhook, currentAutoReply: boolean) => {
    try {
      const res = await fetch(`/api/v1/facebook-feed/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReply: !currentAutoReply }),
      })
      if (res.ok) {
        toast({
          title: !currentAutoReply ? "Auto-reply enabled" : "Auto-reply paused",
          description: !currentAutoReply
            ? "Incoming comments will automatically receive AI responses."
            : "Automatic comment replies paused. You can still reply manually.",
        })
        fetchWebhooks()
      }
    } catch {
      toast({ variant: "destructive", title: "Toggle failed" })
    }
  }

  const handleToggleActive = async (webhook: FacebookFeedWebhook, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/facebook-feed/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) {
        toast({
          title: !currentActive ? "Integration active" : "Integration paused",
          description: !currentActive ? "Webhook is receiving events." : "Webhook paused.",
        })
        fetchWebhooks()
      }
    } catch {
      toast({ variant: "destructive", title: "Toggle failed" })
    }
  }

  const fetchEvents = useCallback(async (webhookId: string) => {
    try {
      setEventsLoading(true)
      const params = new URLSearchParams({ limit: "50" })
      if (eventFilterStatus) params.append("status", eventFilterStatus)
      if (eventFilterPostId.trim()) params.append("postId", eventFilterPostId.trim())
      if (eventFilterCommentId.trim()) params.append("commentId", eventFilterCommentId.trim())

      const res = await fetch(`/api/v1/facebook-feed/webhooks/${webhookId}/events?${params.toString()}`)
      const json: FacebookFeedEventsResponse = await res.json()
      if (res.ok && json.data) {
        setEvents(json.data)
      } else {
        setEvents([])
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to load events" })
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [eventFilterStatus, eventFilterPostId, eventFilterCommentId])

  const openEventsModal = (webhook: FacebookFeedWebhook) => {
    setSelectedWebhook(webhook)
    setEventFilterStatus("")
    setEventFilterPostId("")
    setEventFilterCommentId("")
    setEventsModalOpen(true)
    fetchEvents(webhook.id)
  }

  const openCommentsModal = (webhook: FacebookFeedWebhook, initialPostId = "") => {
    setSelectedWebhook(webhook)
    const pid = initialPostId || webhook.pageId || ""
    setCommentsPostId(pid)
    setCommentsModalOpen(true)
    if (pid) {
      fetchPostComments(webhook.id, pid)
    } else {
      setPostComments([])
    }
  }

  const fetchPostComments = async (webhookId: string, postId: string) => {
    if (!postId.trim()) return
    try {
      setCommentsLoading(true)
      const res = await fetch(`/api/v1/facebook-feed/webhooks/${webhookId}/comments/${encodeURIComponent(postId.trim())}`)
      const json: FacebookFeedCommentsResponse = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setPostComments(json.data)
      } else {
        setPostComments([])
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to fetch post comments" })
      setPostComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !replyTargetCommentId.trim() || !manualReplyText.trim()) return

    try {
      setManualSending(true)
      const endpoint =
        replyModeType === "PUBLIC"
          ? `/api/v1/facebook-feed/webhooks/${selectedWebhook.id}/comments`
          : `/api/v1/facebook-feed/webhooks/${selectedWebhook.id}/private-replies`

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: replyTargetCommentId.trim(),
          messageText: manualReplyText.trim(),
        }),
      })
      const json = await res.json()

      if (res.ok) {
        toast({
          title: replyModeType === "PUBLIC" ? "Public comment posted" : "Private DM sent",
          description: "Your reply has been delivered via Meta Graph API.",
        })
        setManualReplyModalOpen(false)
        setManualReplyText("")
        if (commentsPostId) {
          fetchPostComments(selectedWebhook.id, commentsPostId)
        }
      } else {
        toast({ variant: "destructive", title: "Reply failed", description: json.message || "Could not deliver reply" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error delivering reply" })
    } finally {
      setManualSending(false)
    }
  }

  const handleOpenCompiler = (event: FacebookFeedEvent) => {
    setCompilingEvent(event)
    setCompileAdditionalContext("")
    setCompileHumanize(true)
    setCompiledPromptResult(null)
    setCompileModalOpen(true)
  }

  const handleRunCompiler = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !compilingEvent) return

    try {
      setCompileLoading(true)
      const res = await fetch(
        `/api/v1/facebook-feed/webhooks/${selectedWebhook.id}/events/${compilingEvent.id}/compile-prompt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            additionalContext: compileAdditionalContext.trim() || undefined,
            humanize: compileHumanize,
          }),
        }
      )
      const json: CompileFacebookFeedPromptResponse = await res.json()
      if (res.ok && json.data) {
        setCompiledPromptResult(json.data)
        toast({ title: "Prompt compiled successfully", description: "Assembled with post & comment context." })
      } else {
        toast({ variant: "destructive", title: "Prompt compilation failed", description: json.message || "Error" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error compiling prompt" })
    } finally {
      setCompileLoading(false)
    }
  }

  const handleOpenGenerator = (event: FacebookFeedEvent) => {
    setGeneratingEvent(event)
    const text =
      (event.eventData?.message as string) ||
      (event.eventData?.text as string) ||
      (event.rawPayload?.value as Record<string, unknown>)?.message as string ||
      ""
    setGenerateUserInquiry(text)
    setGenerateReplyModeOverride(selectedWebhook?.replyMode || "PUBLIC_COMMENT")
    setGenerateSendReply(false)
    setGenerateAdditionalContext("")
    setGenerateHumanize(true)
    setGeneratedResult(null)
    setGenerateModalOpen(true)
  }

  const handleRunGenerator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !generatingEvent) return

    try {
      setGenerateLoading(true)
      const res = await fetch(
        `/api/v1/facebook-feed/webhooks/${selectedWebhook.id}/events/${generatingEvent.id}/generate-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId: generatingEvent.commentId || undefined,
            postId: generatingEvent.postId || undefined,
            userInquiry: generateUserInquiry.trim() || undefined,
            replyModeOverride: generateReplyModeOverride,
            sendReply: generateSendReply,
            additionalContext: generateAdditionalContext.trim() || undefined,
            humanize: generateHumanize,
          }),
        }
      )
      const json: GenerateFacebookFeedResponseResponse = await res.json()
      if (res.ok && json.data) {
        setGeneratedResult(json.data)
        toast({
          title: generateSendReply ? "AI reply generated and dispatched!" : "AI reply generated",
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
        title="Facebook Page Comments"
        description="Connect Facebook Page Feed webhooks to automate comment replies with AI, ground responses in post context, and reply publicly or privately."
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Connect Page Comments
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-brand" /> Loading Facebook Feed webhooks…
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote />}
          title="No Facebook Feed integrations connected"
          body="Connect your Facebook Page to auto-reply to post comments, answer inquiries, and send private Messenger direct messages."
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Connect your first Page
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((wh) => {
            const boundProfile = aiProfiles.find((p) => p.id === wh.aiProfileId)
            const isSyncing = syncLoadingId === wh.id
            const displayUrl = getDisplayWebhookUrl(wh.webhookUrl, wh.id)
            const modeConfig = REPLY_MODE_CONFIG[wh.replyMode] || REPLY_MODE_CONFIG.PUBLIC_COMMENT
            const ModeIcon = modeConfig.icon

            return (
              <div
                key={wh.id}
                className="relative flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {wh.pagePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={wh.pagePictureUrl}
                          alt=""
                          className="size-11 rounded-full object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-xs">
                          <MessageSquareQuote className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">{wh.pageName || wh.name}</h3>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {wh.pageCategory ? `${wh.pageCategory} • ` : ""}ID: {wh.pageId}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="-mr-1.5 -mt-1.5"
                          aria-label="Account actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSyncPage(wh.id)} disabled={isSyncing}>
                          <RefreshCw className={cn("mr-2 size-4", isSyncing && "animate-spin")} /> Sync from Meta
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCommentsModal(wh)}>
                          <MessageCircle className="mr-2 size-4" /> View Post Comments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEventsModal(wh)}>
                          <ListChecks className="mr-2 size-4" /> Event Logs
                        </DropdownMenuItem>
                        {wh.pageLink && (
                          <DropdownMenuItem asChild>
                            <a href={wh.pageLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 size-4" /> Open Page
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhook(wh)
                            setEditData({
                              name: wh.name,
                              replyMode: wh.replyMode,
                              autoReply: wh.autoReply,
                              isActive: wh.isActive,
                              aiProfileId: wh.aiProfileId || "",
                              pageId: wh.pageId,
                              pageAccessToken: "",
                              appSecret: "",
                            })
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="mr-2 size-4" /> Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedWebhook(wh)
                            setDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 size-4" /> Delete Integration
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mode & Auto-Reply Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("text-2xs font-semibold", modeConfig.badgeClass)}>
                      <ModeIcon className="mr-1 size-3" />
                      {wh.replyMode === "PUBLIC_COMMENT"
                        ? "Public comments"
                        : wh.replyMode === "PRIVATE_MESSAGE"
                        ? "Private DM"
                        : "Public & Private"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-2xs font-semibold",
                        wh.autoReply
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      <Zap className="mr-1 size-3" />
                      {wh.autoReply ? "Auto-reply on" : "Manual reply only"}
                    </Badge>
                    <Badge
                      variant={wh.isActive ? "secondary" : "outline"}
                      className={cn("text-2xs", !wh.isActive && "text-muted-foreground")}
                    >
                      {wh.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>

                  {/* AI Assistant Assignment */}
                  <div className="mt-4 space-y-1.5 rounded-xl border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Assigned Assistant
                      </Label>
                      {boundProfile?.isDefault && (
                        <span className="text-2xs text-brand font-medium">Default</span>
                      )}
                    </div>
                    <NativeSelect
                      value={wh.aiProfileId || ""}
                      onChange={(e) => handleBindAiProfile(wh.id, e.target.value)}
                      className="h-8 text-xs bg-background"
                    >
                      <option value="">No assistant (Use user default)</option>
                      {aiProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isDefault ? "(Default)" : ""}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  {/* Webhook Meta Credentials Box */}
                  <div className="mt-3 space-y-2 rounded-xl border border-dashed p-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-2xs text-muted-foreground">
                        <span>Callback URL</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyToClipboard(displayUrl, `url-${wh.id}`)}
                        >
                          {copiedKey === `url-${wh.id}` ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                      <p className="truncate font-mono text-2xs text-foreground/80">{displayUrl}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-2xs text-muted-foreground">
                        <span>Verify Token</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyToClipboard(wh.verifyToken, `token-${wh.id}`)}
                        >
                          {copiedKey === `token-${wh.id}` ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </Button>
                      </div>
                      <p className="truncate font-mono text-2xs text-foreground/80">{wh.verifyToken}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={wh.autoReply}
                      onCheckedChange={() => handleToggleAutoReply(wh, wh.autoReply)}
                      aria-label="Toggle auto-reply"
                    />
                    <span className="text-xs font-medium text-muted-foreground">Auto-reply</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => openCommentsModal(wh)}>
                      Comments
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEventsModal(wh)}>
                      Logs
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CREATE MODAL ────────────────────────────────────── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Facebook Page Feed</DialogTitle>
            <DialogDescription>
              Provide your Facebook Page credentials to receive post comment webhooks and enable automated AI replies.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Integration label *</Label>
              <Input
                id="create-name"
                placeholder="e.g. Acme Brand Page Comments"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-pageId">Facebook Page ID *</Label>
                <Input
                  id="create-pageId"
                  placeholder="e.g. 100123456789"
                  value={formData.pageId}
                  onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-appSecret">Meta App Secret *</Label>
                <Input
                  id="create-appSecret"
                  type="password"
                  placeholder="32-char hex secret"
                  value={formData.appSecret}
                  onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-pageAccessToken">Page Access Token</Label>
              <Input
                id="create-pageAccessToken"
                type="password"
                placeholder="EAAB... (Required for Graph API sync & comment replies)"
                value={formData.pageAccessToken}
                onChange={(e) => setFormData({ ...formData, pageAccessToken: e.target.value })}
              />
              <p className="text-2xs text-muted-foreground">
                Needs `pages_read_engagement` and `pages_manage_posts` or `pages_messaging` permissions.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-replyMode">Reply Mode</Label>
              <NativeSelect
                id="create-replyMode"
                value={formData.replyMode}
                onChange={(e) => setFormData({ ...formData, replyMode: e.target.value as FacebookFeedReplyMode })}
              >
                <option value="PUBLIC_COMMENT">PUBLIC_COMMENT — Post public comment reply</option>
                <option value="PRIVATE_MESSAGE">PRIVATE_MESSAGE — Send private Messenger DM</option>
                <option value="BOTH">BOTH — Post public reply & send private Messenger DM</option>
              </NativeSelect>
              <p className="text-2xs text-muted-foreground">
                {REPLY_MODE_CONFIG[formData.replyMode].description}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-aiProfile">Assigned AI Assistant</Label>
              <NativeSelect
                id="create-aiProfile"
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

            <div className="space-y-1.5">
              <Label htmlFor="create-verifyToken">Custom Verify Token (optional)</Label>
              <Input
                id="create-verifyToken"
                placeholder="Auto-generated if left empty"
                value={formData.verifyToken}
                onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">Automatic AI Replies</p>
                <p className="text-xs text-muted-foreground">
                  Automatically reply to new post comments when received.
                </p>
              </div>
              <Switch
                checked={formData.autoReply}
                onCheckedChange={(checked) => setFormData({ ...formData, autoReply: checked })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />} Connect Integration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT MODAL ──────────────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feed Integration</DialogTitle>
            <DialogDescription>Update configuration and reply rules for this Facebook Page.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateWebhook} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Integration Label</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-replyMode">Reply Mode</Label>
              <NativeSelect
                id="edit-replyMode"
                value={editData.replyMode}
                onChange={(e) => setEditData({ ...editData, replyMode: e.target.value as FacebookFeedReplyMode })}
              >
                <option value="PUBLIC_COMMENT">PUBLIC_COMMENT — Post public comment reply</option>
                <option value="PRIVATE_MESSAGE">PRIVATE_MESSAGE — Send private Messenger DM</option>
                <option value="BOTH">BOTH — Post public reply & send private Messenger DM</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-aiProfile">Assigned Assistant</Label>
              <NativeSelect
                id="edit-aiProfile"
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

            <div className="space-y-1.5">
              <Label htmlFor="edit-token">Update Page Access Token (optional)</Label>
              <Input
                id="edit-token"
                type="password"
                placeholder="Leave blank to keep existing token"
                value={editData.pageAccessToken}
                onChange={(e) => setEditData({ ...editData, pageAccessToken: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">Automatic Replies</p>
                <p className="text-xs text-muted-foreground">Auto-generate AI replies for incoming comments</p>
              </div>
              <Switch
                checked={editData.autoReply}
                onCheckedChange={(checked) => setEditData({ ...editData, autoReply: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">Active Status</p>
                <p className="text-xs text-muted-foreground">Enable or pause webhook event processing</p>
              </div>
              <Switch
                checked={editData.isActive}
                onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE MODAL ────────────────────────────────────── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Feed Integration?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{selectedWebhook?.name}”? This will remove callback configuration and
              stop comment automation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWebhook} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── POST COMMENTS & THREADS MODAL ───────────────────── */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Facebook Post Comments & Replies</DialogTitle>
            <DialogDescription>
              View threaded post comments and recorded AI replies for {selectedWebhook?.pageName || selectedWebhook?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Facebook Post ID (e.g. 100123456789_post_999888)"
                value={commentsPostId}
                onChange={(e) => setCommentsPostId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={() => selectedWebhook && fetchPostComments(selectedWebhook.id, commentsPostId)}
                disabled={commentsLoading || !commentsPostId.trim()}
              >
                {commentsLoading ? <Loader2 className="size-4 animate-spin" /> : "Fetch Comments"}
              </Button>
            </div>

            {commentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : postComments.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <MessageSquareQuote className="mx-auto mb-2 size-8 opacity-40" />
                <p>No comments found for this post ID.</p>
                <p className="mt-1 text-xs">Enter a valid Post ID and click Fetch Comments.</p>
              </div>
            ) : (
              <div className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto pr-1">
                {postComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "rounded-xl border p-3 text-sm",
                      comment.role === "assistant" ? "bg-muted/50 border-brand/20 ml-6" : "bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between text-2xs text-muted-foreground mb-1">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        {comment.role === "assistant" ? (
                          <>
                            <Sparkles className="size-3 text-brand" /> AI Assistant
                          </>
                        ) : (
                          <>
                            <User className="size-3 text-blue-500" /> Customer Comment
                          </>
                        )}
                        {comment.replyMode && (
                          <Badge variant="outline" className="text-3xs py-0 h-4">
                            {comment.replyMode}
                          </Badge>
                        )}
                      </span>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                    <div className="mt-2 flex items-center justify-between border-t pt-2 text-2xs text-muted-foreground">
                      <span className="font-mono truncate max-w-[200px]">ID: {comment.commentId}</span>
                      {comment.role === "user" && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-2xs px-2"
                            onClick={() => {
                              setReplyTargetCommentId(comment.commentId)
                              setReplyModeType("PUBLIC")
                              setManualReplyModalOpen(true)
                            }}
                          >
                            <MessageSquare className="mr-1 size-3" /> Reply Publicly
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-2xs px-2 text-purple-600 dark:text-purple-400"
                            onClick={() => {
                              setReplyTargetCommentId(comment.commentId)
                              setReplyModeType("PRIVATE")
                              setManualReplyModalOpen(true)
                            }}
                          >
                            <Lock className="mr-1 size-3" /> Send Private DM
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MANUAL COMMENT REPLY MODAL ──────────────────────── */}
      <Dialog open={manualReplyModalOpen} onOpenChange={setManualReplyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {replyModeType === "PUBLIC" ? "Post Public Comment Reply" : "Send Private Messenger DM"}
            </DialogTitle>
            <DialogDescription>
              {replyModeType === "PUBLIC"
                ? "This will publish a threaded reply comment under the customer's comment via Meta Graph API."
                : "This will send a private Messenger direct message to the author of the comment using Meta recipient.comment_id."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendManualReply} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target Comment ID</Label>
              <Input value={replyTargetCommentId} readOnly className="font-mono text-xs bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply-text">Reply Message *</Label>
              <Textarea
                id="reply-text"
                rows={4}
                placeholder={
                  replyModeType === "PUBLIC"
                    ? "Write your public reply here…"
                    : "Write your private direct message here…"
                }
                value={manualReplyText}
                onChange={(e) => setManualReplyText(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setManualReplyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={manualSending}>
                {manualSending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {replyModeType === "PUBLIC" ? "Post Reply" : "Send Direct Message"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EVENTS AUDIT SHEET ──────────────────────────────── */}
      <Sheet open={eventsModalOpen} onOpenChange={setEventsModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-6">
          <div className="space-y-1 pb-4 border-b">
            <h2 className="text-lg font-semibold tracking-tight">Facebook Feed Event Logs</h2>
            <p className="text-xs text-muted-foreground">
              Audit trail of captured Meta Page Feed events for {selectedWebhook?.pageName || selectedWebhook?.name}.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-3 gap-2 py-3 border-b text-xs">
            <NativeSelect
              value={eventFilterStatus}
              onChange={(e) => setEventFilterStatus(e.target.value)}
              className="h-8 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="PROCESSED">PROCESSED</option>
              <option value="DUPLICATE">DUPLICATE</option>
              <option value="ERROR">ERROR</option>
            </NativeSelect>

            <Input
              placeholder="Filter by Post ID…"
              value={eventFilterPostId}
              onChange={(e) => setEventFilterPostId(e.target.value)}
              className="h-8 text-xs font-mono"
            />

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id)}
            >
              <RefreshCw className={cn("mr-1.5 size-3.5", eventsLoading && "animate-spin")} /> Filter
            </Button>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
            {eventsLoading ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Loading event audit logs…
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
                No webhook events recorded for this feed integration.
              </div>
            ) : (
              events.map((ev) => {
                const text =
                  (ev.eventData?.message as string) ||
                  (ev.eventData?.text as string) ||
                  (ev.rawPayload?.value as Record<string, unknown>)?.message as string ||
                  ""

                return (
                  <div
                    key={ev.id}
                    className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-xs shadow-2xs hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-3xs font-semibold py-0",
                            ev.status === "PROCESSED"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : ev.status === "DUPLICATE"
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "border-destructive/20 bg-destructive/10 text-destructive"
                          )}
                        >
                          {ev.status}
                        </Badge>
                        <span className="font-mono text-2xs text-muted-foreground">{ev.eventType}</span>
                      </div>
                      <span className="text-3xs text-muted-foreground">
                        {new Date(ev.metaTimestamp || ev.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {text && (
                      <p className="rounded-md bg-muted/50 p-2 font-mono text-2xs text-foreground whitespace-pre-wrap">
                        {text}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-3xs text-muted-foreground">
                      <div className="flex gap-2 font-mono">
                        {ev.senderId && <span>Sender: {ev.senderId}</span>}
                        {ev.postId && <span>Post: {ev.postId}</span>}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View Payload"
                          onClick={() => {
                            setSelectedEvent(ev)
                            setSingleEventModalOpen(true)
                          }}
                        >
                          <ListChecks className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Test AI Prompt"
                          onClick={() => handleOpenCompiler(ev)}
                        >
                          <Sparkles className="size-3 text-brand" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Generate Response"
                          onClick={() => handleOpenGenerator(ev)}
                        >
                          <Zap className="size-3 text-amber-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── SINGLE EVENT DETAILS MODAL ───────────────────────── */}
      <Dialog open={singleEventModalOpen} onOpenChange={setSingleEventModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Meta Webhook Event Payload</DialogTitle>
            <DialogDescription>
              Raw audit details and parsed context for event ID {selectedEvent?.id}.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2 font-mono text-2xs">
                <div>Event: {selectedEvent.eventType}</div>
                <div>Status: {selectedEvent.status}</div>
                <div>Post ID: {selectedEvent.postId || "—"}</div>
                <div>Comment ID: {selectedEvent.commentId || "—"}</div>
                <div>Sender ID: {selectedEvent.senderId}</div>
                <div>Time: {new Date(selectedEvent.metaTimestamp).toISOString()}</div>
              </div>

              <div>
                <Label className="text-2xs uppercase text-muted-foreground">Parsed Event Data</Label>
                <pre className="max-h-48 overflow-y-auto rounded-lg bg-muted p-3 font-mono text-2xs custom-scrollbar">
                  {JSON.stringify(selectedEvent.eventData, null, 2)}
                </pre>
              </div>

              <div>
                <Label className="text-2xs uppercase text-muted-foreground">Raw Meta Payload Envelope</Label>
                <pre className="max-h-48 overflow-y-auto rounded-lg bg-muted p-3 font-mono text-2xs custom-scrollbar">
                  {JSON.stringify(selectedEvent.rawPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── COMPILE PROMPT TEST MODAL ───────────────────────── */}
      <Dialog open={compileModalOpen} onOpenChange={setCompileModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compile Context-Grounded Prompt</DialogTitle>
            <DialogDescription>
              Test prompt synthesis for this comment event. Pushes original Facebook post content, story, and parent
              comment context into the LLM system prompt.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRunCompiler} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="compile-context">Additional Context (optional)</Label>
              <Input
                id="compile-context"
                placeholder="e.g. Special promotional discount valid until midnight"
                value={compileAdditionalContext}
                onChange={(e) => setCompileAdditionalContext(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">Conversational Directives (Humanize)</p>
                <p className="text-xs text-muted-foreground">Inject natural conversational behavioral rules</p>
              </div>
              <Switch checked={compileHumanize} onCheckedChange={setCompileHumanize} />
            </div>

            <Button type="submit" disabled={compileLoading} className="w-full">
              {compileLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4 text-brand" />
              )}
              Compile Grounded Prompt Bundle
            </Button>
          </form>

          {compiledPromptResult && (
            <div className="mt-4 space-y-3 border-t pt-4 text-xs">
              <div>
                <Label className="text-2xs uppercase tracking-wider text-muted-foreground">
                  Grounded Messages Array
                </Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg bg-muted p-3 font-mono text-2xs custom-scrollbar">
                  {compiledPromptResult.messages.map((m, idx) => (
                    <div key={idx} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <span className="font-semibold text-brand uppercase">[{m.role}]:</span>{" "}
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-2xs uppercase tracking-wider text-muted-foreground">
                  Synthesized System Prompt
                </Label>
                <pre className="max-h-36 overflow-y-auto rounded-lg bg-muted p-3 font-mono text-2xs whitespace-pre-wrap custom-scrollbar">
                  {compiledPromptResult.systemPrompt}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── GENERATE AI RESPONSE MODAL ───────────────────────── */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate AI Comment Response</DialogTitle>
            <DialogDescription>
              Execute the full LLM inference pipeline grounded in Facebook post context and optionally deliver the
              reply live.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRunGenerator} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gen-inquiry">Customer Comment Inquiry</Label>
              <Textarea
                id="gen-inquiry"
                rows={2}
                value={generateUserInquiry}
                onChange={(e) => setGenerateUserInquiry(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gen-replyMode">Reply Mode Override</Label>
              <NativeSelect
                id="gen-replyMode"
                value={generateReplyModeOverride}
                onChange={(e) => setGenerateReplyModeOverride(e.target.value as FacebookFeedReplyMode)}
              >
                <option value="PUBLIC_COMMENT">PUBLIC_COMMENT — Post public comment reply</option>
                <option value="PRIVATE_MESSAGE">PRIVATE_MESSAGE — Send private Messenger DM</option>
                <option value="BOTH">BOTH — Post public reply & send private Messenger DM</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gen-context">Additional Session Context (optional)</Label>
              <Input
                id="gen-context"
                placeholder="e.g. Free shipping on all orders over $50"
                value={generateAdditionalContext}
                onChange={(e) => setGenerateAdditionalContext(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Deliver Live to Facebook
                </p>
                <p className="text-xs text-muted-foreground">
                  When enabled, the generated response is posted directly to Facebook via Meta Graph API.
                </p>
              </div>
              <Switch checked={generateSendReply} onCheckedChange={setGenerateSendReply} />
            </div>

            <Button type="submit" disabled={generateLoading} className="w-full">
              {generateLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Zap className="mr-2 size-4 text-amber-500" />
              )}
              {generateSendReply ? "Generate & Dispatch Reply Live" : "Generate Draft AI Reply"}
            </Button>
          </form>

          {generatedResult && (
            <div className="mt-4 space-y-3 border-t pt-4 text-xs">
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-2xs text-muted-foreground mb-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3 text-brand" /> Generated AI Response
                  </span>
                  <span>
                    {generatedResult.modelName || "AI"} • {(generatedResult.latencyMs / 1000).toFixed(2)}s •{" "}
                    {generatedResult.tokenUsage?.totalTokens || 0} tokens
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap font-medium">
                  {generatedResult.generatedResponse}
                </p>
              </div>

              {(generatedResult.publicCommentReplyId || generatedResult.privateMessageId) && (
                <div className="flex flex-wrap gap-2 text-2xs font-mono">
                  {generatedResult.publicCommentReplyId && (
                    <Badge variant="outline" className="text-3xs text-sky-600">
                      Public Reply ID: {generatedResult.publicCommentReplyId}
                    </Badge>
                  )}
                  {generatedResult.privateMessageId && (
                    <Badge variant="outline" className="text-3xs text-purple-600">
                      Private DM ID: {generatedResult.privateMessageId}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
