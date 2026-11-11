"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
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
  Bot,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  ListChecks,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plug,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  MessengerWebhook,
  MessengerWebhooksResponse,
  MessengerWebhookEvent,
  MessengerEventsResponse,
  SyncPageResponse,
  AiProfile,
  AiProfilesResponse,
  CompileWebhookEventPromptResponse,
  GenerateResponseResult,
  GenerateResponseApiResponse,
  ConversationMessage,
  ConversationHistoryResponse,
  SendManualMessageResponse,
} from "@/lib/types/woombat"

function getDisplayWebhookUrl(webhookUrl?: string | null, userId?: string, webhookId?: string): string {
  // If the backend already provided a complete URL (e.g. http://localhost:3001/api/... or https://api.woombat.com/...)
  if (webhookUrl && (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://"))) {
    return webhookUrl
  }

  // Base URL for the backend service
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof window !== "undefined" && window.location.port === "3000"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001")

  // If the backend returned a relative path starting with /
  if (webhookUrl && webhookUrl.startsWith("/")) {
    return `${backendBase}${webhookUrl}`
  }

  // Fallback if webhookUrl is empty
  if (userId && webhookId) {
    return `${backendBase}/api/v1/webhooks/messenger/user/${userId}/${webhookId}`
  }

  return webhookUrl || ""
}

export default function MessengerWebhooksPage() {
  const [webhooks, setWebhooks] = useState<MessengerWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<MessengerWebhook | null>(null)

  // AI Profiles State
  const [aiProfiles, setAiProfiles] = useState<AiProfile[]>([])
  const [, setAiProfilesLoading] = useState(false)

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    appSecret: "",
    verifyToken: "",
    pageId: "",
    pageAccessToken: "",
    aiProfileId: "",
  })

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editData, setEditData] = useState<{ id: string; name: string; isActive: boolean; aiProfileId: string }>({
    id: "",
    name: "",
    isActive: true,
    aiProfileId: "",
  })

  // AI Profile Binding Modal State
  const [bindModalOpen, setBindModalOpen] = useState(false)
  const [webhookToBind, setWebhookToBind] = useState<MessengerWebhook | null>(null)
  const [selectedAiProfileToBind, setSelectedAiProfileToBind] = useState<string>("none")
  const [bindLoading, setBindLoading] = useState(false)

  // Event Prompt Compiler Modal State
  const [compileModalOpen, setCompileModalOpen] = useState(false)
  const [compilingEvent, setCompilingEvent] = useState<MessengerWebhookEvent | null>(null)
  const [compileAiProfileId, setCompileAiProfileId] = useState<string>("")
  const [compileVariables, setCompileVariables] = useState<Record<string, string>>({})
  const [compileIncludeFewShot, setCompileIncludeFewShot] = useState<boolean>(true)
  const [compileLoading, setCompileLoading] = useState(false)
  const [compiledPromptResult, setCompiledPromptResult] = useState<CompileWebhookEventPromptResponse["data"] | null>(null)

  // AI Response Generation & Dispatch State
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generatingEvent, setGeneratingEvent] = useState<MessengerWebhookEvent | null>(null)
  const [generateSendToUser, setGenerateSendToUser] = useState<boolean>(true)
  const [generateAiProfileId, setGenerateAiProfileId] = useState<string>("")
  const [generateVariables, setGenerateVariables] = useState<Record<string, string>>({})
  const [generateAdditionalContext, setGenerateAdditionalContext] = useState<string>("")
  const [generateIncludeFewShot, setGenerateIncludeFewShot] = useState<boolean>(true)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GenerateResponseResult | null>(null)

  // Multi-Turn Conversation History & Live Messaging State
  const [conversationModalOpen, setConversationModalOpen] = useState(false)
  const [conversationSenderId, setConversationSenderId] = useState<string>("")
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([])
  const [conversationLoading, setConversationLoading] = useState(false)
  const [, setConversationPage] = useState(1)
  const [, setConversationTotalPages] = useState(1)
  const [operatorMessageText, setOperatorMessageText] = useState<string>("")
  const [operatorSending, setOperatorSending] = useState(false)

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [webhookToDelete, setWebhookToDelete] = useState<MessengerWebhook | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Sync Page State
  const [syncingId, setSyncingId] = useState<string | null>(null)

  // Audit Events State
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [events, setEvents] = useState<MessengerWebhookEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsPage, setEventsPage] = useState(1)
  const [eventsTotalPages, setEventsTotalPages] = useState(1)
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("ALL")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL")

  // Single Event Detail State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<MessengerWebhookEvent | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Copied State
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast({
        variant: "info",
        title: "Copied",
      })
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  // Fetch all AI Profiles for binding
  const fetchAiProfiles = useCallback(async () => {
    try {
      setAiProfilesLoading(true)
      const res = await fetch("/api/v1/ai-profiles?limit=50")
      const json: AiProfilesResponse = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setAiProfiles(json.data)
      }
    } catch (err) {
      console.error("Failed to fetch AI profiles:", err)
    } finally {
      setAiProfilesLoading(false)
    }
  }, [])

  // Fetch all webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/messenger/webhooks")
      const json: MessengerWebhooksResponse = await res.json()

      if (res.ok && Array.isArray(json.data)) {
        setWebhooks(json.data)
        if (json.data.length > 0 && !selectedWebhook) {
          setSelectedWebhook(json.data[0])
        }
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err)
      toast({
        variant: "destructive",
        title: "Couldn’t load pages",
        description: "Couldn’t load your Facebook pages. Refresh to try again.",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedWebhook])

  useEffect(() => {
    fetchWebhooks()
    fetchAiProfiles()
  }, [fetchWebhooks, fetchAiProfiles])

  // Create Webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.appSecret) {
      toast({
        variant: "destructive",
        title: "Name and app secret needed",
        description: "Both are required to connect a page.",
      })
      return
    }

    try {
      setCreateLoading(true)
      const res = await fetch("/api/v1/messenger/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          appSecret: formData.appSecret,
          ...(formData.verifyToken ? { verifyToken: formData.verifyToken } : {}),
          ...(formData.pageId ? { pageId: formData.pageId } : {}),
          ...(formData.pageAccessToken ? { pageAccessToken: formData.pageAccessToken } : {}),
          ...(formData.aiProfileId ? { aiProfileId: formData.aiProfileId } : {}),
        }),
      })

      const json = await res.json()

      if (res.ok && json.data) {
        toast({
          variant: "success",
          title: "Page connected",
          description: `${json.data.name} is connected. Finish the setup steps on its card.`,
        })
        setCreateModalOpen(false)
        setFormData({
          name: "",
          appSecret: "",
          verifyToken: "",
          pageId: "",
          pageAccessToken: "",
          aiProfileId: "",
        })
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t connect",
          description: json.message || "Couldn’t connect this page. Check the details and try again.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Check your connection and try again.",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  // Update Webhook
  const handleUpdateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editData.name) return

    try {
      setEditLoading(true)
      const res = await fetch(`/api/v1/messenger/webhooks/${editData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          isActive: editData.isActive,
          ...(editData.aiProfileId === "none" ? { aiProfileId: null } : editData.aiProfileId ? { aiProfileId: editData.aiProfileId } : {}),
        }),
      })

      const json = await res.json()

      if (res.ok) {
        toast({
          variant: "success",
          title: "Page updated",
          description: "Your changes are saved.",
        })
        setEditModalOpen(false)
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t save",
          description: json.message || "Couldn’t save changes to this page.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Check your connection and try again.",
      })
    } finally {
      setEditLoading(false)
    }
  }

  // Dedicated AI Profile Binding Action
  const handleBindAiProfile = async () => {
    if (!webhookToBind) return

    try {
      setBindLoading(true)
      const targetAiProfileId = selectedAiProfileToBind === "none" ? null : selectedAiProfileToBind

      const res = await fetch(`/api/v1/messenger/webhooks/${webhookToBind.id}/ai-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProfileId: targetAiProfileId }),
      })

      const json = await res.json()

      if (res.ok) {
        toast({
          variant: "success",
          title: targetAiProfileId ? "Assistant chosen" : "Using the default assistant",
          description: json.message || "Assistant updated for this page.",
        })
        setBindModalOpen(false)
        setWebhookToBind(null)
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t change the assistant",
          description: json.message || "Try again in a moment.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Try again in a moment.",
      })
    } finally {
      setBindLoading(false)
    }
  }

  // Open Event Prompt Compiler Modal
  const handleOpenEventCompiler = (event: MessengerWebhookEvent) => {
    setCompilingEvent(event)
    setCompileAiProfileId(event.aiProfileId || selectedWebhook?.aiProfileId || "")
    setCompileVariables({})
    setCompileIncludeFewShot(true)
    setCompiledPromptResult(null)
    setCompileModalOpen(true)
  }

  // Run Event Prompt Compilation
  const handleCompileEventPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compilingEvent || !selectedWebhook) return

    try {
      setCompileLoading(true)
      const res = await fetch(
        `/api/v1/messenger/webhooks/${selectedWebhook.id}/events/${compilingEvent.id}/compile-prompt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiProfileId: compileAiProfileId || undefined,
            dynamicVariables: compileVariables,
            includeFewShot: compileIncludeFewShot,
          }),
        }
      )

      const json = await res.json()

      if (res.ok && json.data) {
        setCompiledPromptResult(json.data)
        toast({
          variant: "success",
          title: "Preview ready",
          description: `Built with ${json.data.profile.name}.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t build the preview",
          description: json.message || "Try again in a moment.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Try again in a moment.",
      })
    } finally {
      setCompileLoading(false)
    }
  }

  // Open AI Response Generation Modal
  const handleOpenGenerateResponse = (event: MessengerWebhookEvent) => {
    setGeneratingEvent(event)
    setGenerateAiProfileId(event.aiProfileId || selectedWebhook?.aiProfileId || "")
    setGenerateSendToUser(true)
    setGenerateVariables(Object.fromEntries((aiProfiles.find((p) => p.id === (event.aiProfileId || selectedWebhook?.aiProfileId))?.customVariables ?? []).map((v) => [v.key, v.defaultValue])))
    setGenerateAdditionalContext("")
    setGenerateIncludeFewShot(true)
    setGeneratedResult(null)
    setGenerateModalOpen(true)
  }

  // Generate AI Response & Dispatch
  const handleGenerateResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generatingEvent || !selectedWebhook) return

    try {
      setGenerateLoading(true)
      const res = await fetch(
        `/api/v1/messenger/webhooks/${selectedWebhook.id}/events/${generatingEvent.id}/generate-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sendToUser: generateSendToUser,
            aiProfileId: generateAiProfileId || undefined,
            dynamicVariables: generateVariables,
            additionalContext: generateAdditionalContext || undefined,
            includeFewShot: generateIncludeFewShot,
          }),
        }
      )

      const json: GenerateResponseApiResponse = await res.json()

      if (res.ok && json.data) {
        setGeneratedResult(json.data)
        toast({
          variant: "success",
          title: json.data.dispatchedToMessenger ? "Reply sent" : "Reply written",
          description: json.data.dispatchedToMessenger
            ? "The customer has it on Messenger."
            : "Not sent. Copy it or send it from the inbox.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t write a reply",
          description: json.message || "Try again in a moment.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Try again in a moment.",
      })
    } finally {
      setGenerateLoading(false)
    }
  }

  // Fetch Conversation History
  const fetchConversation = useCallback(
    async (senderId: string, page = 1) => {
      if (!selectedWebhook || !senderId) return
      try {
        setConversationLoading(true)
        const res = await fetch(
          `/api/v1/messenger/webhooks/${selectedWebhook.id}/conversations/${senderId}?page=${page}&limit=30`
        )
        const json: ConversationHistoryResponse = await res.json()

        if (res.ok && Array.isArray(json.data)) {
          setConversationMessages(json.data)
          if (json.pagination) {
            setConversationPage(json.pagination.page)
            setConversationTotalPages(json.pagination.totalPages)
          }
        } else {
          setConversationMessages([])
        }
      } catch (err) {
        console.error("Failed to fetch conversation history:", err)
      } finally {
        setConversationLoading(false)
      }
    },
    [selectedWebhook]
  )

  // Open Conversation History Modal
  const handleOpenConversation = (senderId: string) => {
    setConversationSenderId(senderId)
    setOperatorMessageText("")
    setConversationModalOpen(true)
    fetchConversation(senderId, 1)
  }

  // Send Operator Outbound Message
  const handleSendOperatorMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWebhook || !conversationSenderId || !operatorMessageText.trim()) return

    try {
      setOperatorSending(true)
      const res = await fetch(`/api/v1/messenger/webhooks/${selectedWebhook.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: conversationSenderId,
          text: operatorMessageText.trim(),
        }),
      })

      const json: SendManualMessageResponse = await res.json()

      if (res.ok && json.data) {
        toast({
          variant: "success",
          title: "Sent",
          description: "The customer has your reply on Messenger.",
        })
        setOperatorMessageText("")
        await fetchConversation(conversationSenderId, 1)
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t send",
          description: json.message || "Facebook didn’t accept the message. Try again.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Your message wasn’t sent.",
      })
    } finally {
      setOperatorSending(false)
    }
  }

  // Toggle active status directly
  const handleToggleActive = async (hook: MessengerWebhook, newStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/messenger/webhooks/${hook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (res.ok) {
        toast({
          variant: "success",
          title: newStatus ? "Page turned on" : "Page paused",
          description: newStatus ? `${hook.name} is replying again.` : `${hook.name} won’t reply until you turn it back on.`,
        })
        setWebhooks((prev) =>
          prev.map((item) => (item.id === hook.id ? { ...item, isActive: newStatus } : item))
        )
      } else {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "Couldn’t change this page. Try again.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Try again in a moment.",
      })
    }
  }

  // Delete Webhook
  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/v1/messenger/webhooks/${webhookToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          variant: "success",
          title: "Page disconnected",
          description: "Chippy no longer receives its messages.",
        })
        setDeleteModalOpen(false)
        setWebhookToDelete(null)
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t disconnect",
          description: "Couldn’t disconnect this page.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Check your connection and try again.",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Sync Facebook Page & Subscribed Apps
  const handleSyncPage = async (hook: MessengerWebhook) => {
    try {
      setSyncingId(hook.id)
      const res = await fetch(`/api/v1/messenger/webhooks/${hook.id}/sync-page`, {
        method: "POST",
      })

      const json: SyncPageResponse = await res.json()

      if (res.ok && json.data) {
        toast({
          variant: "success",
          title: "Page synced",
          description: `${json.data.pageDetails.name} now sends its messages to Chippy.`,
        })
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t sync",
          description: json.message || "Check that the page has a Page ID and a valid access token.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Couldn’t reach the server. Try again in a moment.",
      })
    } finally {
      setSyncingId(null)
    }
  }

  // Fetch Events Audit Log
  const fetchEvents = useCallback(async (webhookId: string, page = 1) => {
    try {
      setEventsLoading(true)
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (eventStatusFilter !== "ALL") params.append("status", eventStatusFilter)
      if (eventTypeFilter !== "ALL") params.append("eventType", eventTypeFilter)

      const res = await fetch(`/api/v1/messenger/webhooks/${webhookId}/events?${params.toString()}`)
      const json: MessengerEventsResponse = await res.json()

      if (res.ok && Array.isArray(json.data)) {
        setEvents(json.data)
        if (json.pagination) {
          setEventsPage(json.pagination.page)
          setEventsTotalPages(json.pagination.totalPages)
        }
      } else {
        setEvents([])
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setEventsLoading(false)
    }
  }, [eventStatusFilter, eventTypeFilter])

  const openEventsModal = (hook: MessengerWebhook) => {
    setSelectedWebhook(hook)
    setEventsModalOpen(true)
    fetchEvents(hook.id, 1)
  }

  // Inspect single event detail
  const handleInspectEvent = async (event: MessengerWebhookEvent) => {
    try {
      setDetailLoading(true)
      setSelectedEvent(event)
      setDetailModalOpen(true)
      const res = await fetch(`/api/v1/messenger/webhooks/${event.webhookId}/events/${event.id}`)
      const json = await res.json()
      if (res.ok && json.data) {
        setSelectedEvent(json.data)
      }
    } catch {
      // Use fallback existing event data
    } finally {
      setDetailLoading(false)
    }
  }

  const statusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PROCESSED":
        return <Badge variant="success"><CheckCircle />Handled</Badge>
      case "DUPLICATE":
        return <Badge variant="warning"><Clock />Duplicate</Badge>
      case "ERROR":
        return <Badge variant="destructive"><XCircle />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const eventText = (ev: MessengerWebhookEvent | null) =>
    ev?.eventData?.message?.text || ev?.eventData?.postback?.title || ev?.eventData?.postback?.payload || null

  const assistantName = (id?: string | null) => aiProfiles.find((p) => p.id === id)?.name
  const defaultAssistant = aiProfiles.find((p) => p.isDefault)

  const pageState = (hook: MessengerWebhook) =>
    !hook.isActive ? "paused" : hook.pageSubscribedAt ? "live" : "setup"

  const assistantOptions = (noneValue: string, noneLabel: string) => (
    <>
      <option value={noneValue}>{noneLabel}</option>
      {aiProfiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}{p.isDefault ? " (default)" : ""}{!p.isActive ? " · off" : ""}
        </option>
      ))}
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facebook pages"
        description="Connect the pages your customers message, choose which assistant replies on each, and check what came in."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchWebhooks} disabled={loading}>
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="size-3.5" />
              Connect page
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-3" aria-busy>
          {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border bg-muted" />)}
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={<Plug />}
          title="Connect your first Facebook page"
          body="Once a page is connected, every Messenger chat lands in its inbox and your assistant can reply. It takes about five minutes."
          action={<Button onClick={() => setCreateModalOpen(true)}><Plus className="size-4" />Connect page</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {webhooks.map((hook) => {
            const isSyncing = syncingId === hook.id
            const callbackUrl = getDisplayWebhookUrl(hook.webhookUrl, hook.userId, hook.id)
            const state = pageState(hook)
            const bound = assistantName(hook.aiProfileId)
            return (
              <li key={hook.id} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {hook.pagePictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hook.pagePictureUrl} alt="" className="size-11 shrink-0 rounded-xl border object-cover" />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary font-display text-lg font-bold">
                        {(hook.pageName || hook.name).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg">{hook.pageName || hook.name}</h3>
                        {state === "live" && <Badge variant="success"><span className="size-1.5 rounded-full bg-current" />Replying</Badge>}
                        {state === "paused" && <Badge variant="secondary">Paused</Badge>}
                        {state === "setup" && <Badge variant="warning">Needs setup</Badge>}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {hook.pageName && hook.name !== hook.pageName && <span>{hook.name}</span>}
                        <span className="inline-flex items-center gap-1">
                          <Bot className="size-3" />
                          {bound ?? (defaultAssistant ? `${defaultAssistant.name} (default)` : "No assistant yet")}
                        </span>
                        {hook.pageLink && (
                          <a href={hook.pageLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-foreground">
                            View page <ExternalLink className="size-3" />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hook.isActive}
                      onCheckedChange={(checked) => handleToggleActive(hook, checked)}
                      aria-label={hook.isActive ? `Pause ${hook.name}` : `Turn on ${hook.name}`}
                    />
                    <Button variant="outline" size="sm" onClick={() => openEventsModal(hook)}>
                      <ListChecks className="size-3.5" />
                      Message log
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/dashboard/messenger/${hook.id}/inbox`}>
                        <MessageCircle className="size-3.5" />
                        Open inbox
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`More for ${hook.name}`}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => { setWebhookToBind(hook); setSelectedAiProfileToBind(hook.aiProfileId || "none"); setBindModalOpen(true) }}>
                          <Bot className="mr-2 size-4" />Choose assistant
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditData({ id: hook.id, name: hook.name, isActive: hook.isActive, aiProfileId: hook.aiProfileId || "none" })
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="mr-2 size-4" />Rename & settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSyncPage(hook)} disabled={isSyncing}>
                          <RefreshCw className="mr-2 size-4" />Sync with Facebook
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setWebhookToDelete(hook); setDeleteModalOpen(true) }}>
                          <Trash2 className="mr-2 size-4" />Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {state === "setup" && (
                  <div className="border-t bg-warning-soft/60 px-4 py-4">
                    <p className="text-sm font-medium">Finish connecting this page</p>
                    <ol className="mt-3 grid gap-3 text-sm lg:grid-cols-3">
                      <li className="space-y-1.5">
                        <span className="text-xs text-muted-foreground">1. In Meta for Developers → Messenger → Webhooks, paste the callback URL</span>
                        <CopyField value={callbackUrl} copied={copiedKey === `url-${hook.id}`} onCopy={() => copyToClipboard(callbackUrl, `url-${hook.id}`)} label="Callback URL" />
                      </li>
                      <li className="space-y-1.5">
                        <span className="text-xs text-muted-foreground">2. Paste this verify token in the same form</span>
                        <CopyField value={hook.verifyToken} copied={copiedKey === `token-${hook.id}`} onCopy={() => copyToClipboard(hook.verifyToken, `token-${hook.id}`)} label="Verify token" />
                      </li>
                      <li className="space-y-1.5">
                        <span className="text-xs text-muted-foreground">3. Then sync so Chippy starts getting messages</span>
                        <Button className="w-full" onClick={() => handleSyncPage(hook)} disabled={isSyncing}>
                          {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                          {isSyncing ? "Syncing" : "Sync with Facebook"}
                        </Button>
                      </li>
                    </ol>
                    {!hook.pageId && (
                      <p className="mt-3 text-xs text-muted-foreground">This page was connected without a Page ID or access token, so it can’t sync. Disconnect it and connect again with both.</p>
                    )}
                  </div>
                )}

                {state !== "setup" && (
                  <details className="group border-t">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">
                      Connection details
                      <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Callback URL</p>
                        <CopyField value={callbackUrl} copied={copiedKey === `url-${hook.id}`} onCopy={() => copyToClipboard(callbackUrl, `url-${hook.id}`)} label="Callback URL" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Verify token</p>
                        <CopyField value={hook.verifyToken} copied={copiedKey === `token-${hook.id}`} onCopy={() => copyToClipboard(hook.verifyToken, `token-${hook.id}`)} label="Verify token" />
                      </div>
                      <p className="text-xs text-muted-foreground sm:col-span-2">
                        Page ID {hook.pageId || "—"} · {hook.pageCategory || "Business page"} · Connected {new Date(hook.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </details>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Connect a page ─────────────────────────────────── */}
      <Sheet open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <SheetContent side="right" title="Connect a Facebook page" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <form onSubmit={handleCreateWebhook} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b px-6 py-5 pr-14">
              <h2 className="text-2xl">Connect a Facebook page</h2>
              <p className="mt-1 text-sm text-muted-foreground">You’ll need your app’s details from Meta for Developers.</p>
            </div>
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <FormField id="name" label="Name" required hint="Just for you, e.g. the shop or page name.">
                <Input id="name" placeholder="Nakshi Threads" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>

              <fieldset className="space-y-4 rounded-xl border p-4">
                <legend className="px-1 text-sm font-medium">From Meta for Developers</legend>
                <FormField id="appSecret" label="App secret" required hint="App settings → Basic → App secret.">
                  <Input id="appSecret" type="password" autoComplete="off" value={formData.appSecret} onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })} required />
                </FormField>
                <FormField id="pageId" label="Page ID" hint="Your Facebook page → About → Page transparency.">
                  <Input id="pageId" inputMode="numeric" placeholder="106378625516323" value={formData.pageId} onChange={(e) => setFormData({ ...formData, pageId: e.target.value })} />
                </FormField>
                <FormField id="pageAccessToken" label="Page access token" hint="Messenger → Settings → Access tokens. Needed to sync and send replies.">
                  <Input id="pageAccessToken" type="password" autoComplete="off" placeholder="EAAB…" value={formData.pageAccessToken} onChange={(e) => setFormData({ ...formData, pageAccessToken: e.target.value })} />
                </FormField>
                <FormField id="verifyToken" label="Verify token" hint="Leave blank and we’ll make one for you.">
                  <Input id="verifyToken" value={formData.verifyToken} onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })} />
                </FormField>
              </fieldset>

              <FormField id="aiProfileId" label="Assistant" hint="Who replies on this page. You can change it later.">
                <NativeSelect id="aiProfileId" value={formData.aiProfileId} onChange={(e) => setFormData({ ...formData, aiProfileId: e.target.value })}>
                  {assistantOptions("", "Use the default assistant")}
                </NativeSelect>
              </FormField>
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-3">
              <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading && <Loader2 className="animate-spin" />}
                Connect page
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Rename & settings ─────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Page settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateWebhook} className="space-y-4">
            <FormField id="edit-name" label="Name">
              <Input id="edit-name" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} required />
            </FormField>
            <FormField id="edit-aiProfile" label="Assistant">
              <NativeSelect id="edit-aiProfile" value={editData.aiProfileId || "none"} onChange={(e) => setEditData({ ...editData, aiProfileId: e.target.value })}>
                {assistantOptions("none", "Use the default assistant")}
              </NativeSelect>
            </FormField>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Replying</span>
                <span className="block text-xs text-muted-foreground">When paused, messages are still logged but nobody replies.</span>
              </span>
              <Switch checked={editData.isActive} onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })} />
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Choose assistant ──────────────────────────────── */}
      <Dialog open={bindModalOpen} onOpenChange={setBindModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Who replies on {webhookToBind?.pageName || webhookToBind?.name}?</DialogTitle>
            <DialogDescription>The assistant’s instructions, rules, and knowledge are used for every message on this page.</DialogDescription>
          </DialogHeader>
          <div role="radiogroup" className="max-h-80 space-y-1.5 overflow-y-auto">
            {[{ id: "none", name: "Default assistant", role: defaultAssistant ? `Currently ${defaultAssistant.name}` : "No default set yet" }, ...aiProfiles].map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selectedAiProfileToBind === p.id}
                onClick={() => setSelectedAiProfileToBind(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
                  selectedAiProfileToBind === p.id ? "border-ink bg-brand-soft" : "hover:border-input"
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg font-display font-bold", selectedAiProfileToBind === p.id ? "bg-brand" : "bg-secondary")}>
                  {p.id === "none" ? <Star className="size-4" /> : p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{p.role}</span>
                </span>
                {selectedAiProfileToBind === p.id && <Check className="size-4" />}
              </button>
            ))}
          </div>
          {aiProfiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You haven’t made an assistant yet. <Link href="/dashboard/ai-profiles" className="font-medium text-foreground underline underline-offset-4">Create one</Link>
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBindModalOpen(false)}>Cancel</Button>
            <Button onClick={handleBindAiProfile} disabled={bindLoading}>
              {bindLoading && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disconnect ────────────────────────────────────── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disconnect {webhookToDelete?.pageName || webhookToDelete?.name}?</DialogTitle>
            <DialogDescription>Chippy stops receiving and replying to this page’s messages. You can connect it again later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Keep connected</Button>
            <Button variant="destructive" onClick={handleDeleteWebhook} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Message log ───────────────────────────────────── */}
      <Sheet open={eventsModalOpen} onOpenChange={setEventsModalOpen}>
        <SheetContent side="right" title="Message log" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <div className="space-y-4 border-b px-6 py-5 pr-14">
            <div>
              <h2 className="text-2xl">Message log</h2>
              <p className="mt-1 text-sm text-muted-foreground">Everything Facebook sent to {selectedWebhook?.pageName || selectedWebhook?.name}, newest first.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <NativeSelect value={eventStatusFilter} onChange={(e) => setEventStatusFilter(e.target.value)} className="w-40" aria-label="Status">
                <option value="ALL">All results</option>
                <option value="PROCESSED">Handled</option>
                <option value="DUPLICATE">Duplicates</option>
                <option value="ERROR">Failed</option>
              </NativeSelect>
              <NativeSelect value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="w-44" aria-label="Type">
                <option value="ALL">All types</option>
                <option value="messages">Messages</option>
                <option value="messaging_postbacks">Button taps</option>
                <option value="message_deliveries">Delivery receipts</option>
              </NativeSelect>
              <Button variant="outline" onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, 1)} disabled={eventsLoading}>
                <RefreshCw className={cn(eventsLoading && "animate-spin")} />
                Apply
              </Button>
            </div>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {eventsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : events.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto mb-3 size-6" />
                Nothing yet. New Messenger activity shows up here.
              </div>
            ) : (
              <ul className="divide-y">
                {events.map((ev) => (
                  <li key={ev.id} className="group flex items-start gap-3 px-6 py-3 hover:bg-muted/60">
                    <button onClick={() => handleOpenConversation(ev.senderId)} className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-2xs font-semibold" aria-label="Open chat history">
                      {ev.senderId.slice(-2)}
                    </button>
                    <button onClick={() => handleInspectEvent(ev)} className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{eventText(ev) ?? (ev.eventType === "message_deliveries" ? "Delivery receipt" : ev.eventType)}</span>
                        {statusBadge(ev.status)}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Customer …{ev.senderId.slice(-6)} · {new Date(ev.createdAt).toLocaleString()}
                      </p>
                    </button>
                    {eventText(ev) && (
                      <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <Button variant="outline" size="sm" onClick={() => handleOpenGenerateResponse(ev)}><Sparkles className="size-3.5" />Reply with AI</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {eventsTotalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-muted-foreground">
              <span>Page {eventsPage} of {eventsTotalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-sm" disabled={eventsPage <= 1 || eventsLoading} onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, eventsPage - 1)} aria-label="Newer"><ChevronLeft /></Button>
                <Button variant="outline" size="icon-sm" disabled={eventsPage >= eventsTotalPages || eventsLoading} onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, eventsPage + 1)} aria-label="Older"><ChevronRight /></Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Message details ───────────────────────────────── */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Message details</DialogTitle>
              {selectedEvent && statusBadge(selectedEvent.status)}
            </div>
            <DialogDescription>{selectedEvent && new Date(selectedEvent.createdAt).toLocaleString()}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : selectedEvent ? (
            <div className="custom-scrollbar max-h-[60vh] space-y-4 overflow-y-auto">
              {eventText(selectedEvent) && (
                <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border bg-muted px-3.5 py-2 text-sm">{eventText(selectedEvent)}</p>
              )}
              {selectedEvent.errorMessage && (
                <div className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive">
                  <p className="font-medium">What went wrong</p>
                  <p className="mt-1 font-mono text-xs">{selectedEvent.errorMessage}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3 rounded-xl border p-3 text-xs">
                <div><dt className="text-muted-foreground">Type</dt><dd className="font-mono">{selectedEvent.eventType}</dd></div>
                <div><dt className="text-muted-foreground">Customer ID</dt><dd className="truncate font-mono">{selectedEvent.senderId}</dd></div>
                <div><dt className="text-muted-foreground">Page ID</dt><dd className="truncate font-mono">{selectedEvent.pageId}</dd></div>
                <div><dt className="text-muted-foreground">Assistant</dt><dd>{assistantName(selectedEvent.aiProfileId) ?? "Page’s assistant"}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => { setDetailModalOpen(false); handleOpenGenerateResponse(selectedEvent) }}><Sparkles />Reply with AI</Button>
                <Button variant="outline" onClick={() => { setDetailModalOpen(false); handleOpenConversation(selectedEvent.senderId) }}><MessageCircle />Chat history</Button>
                <Button variant="ghost" onClick={() => { setDetailModalOpen(false); handleOpenEventCompiler(selectedEvent) }}><Zap />Preview AI input</Button>
              </div>
              <details className="group rounded-xl border">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                  Raw data from Facebook
                  <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="relative border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => copyToClipboard(JSON.stringify(selectedEvent.rawPayload || selectedEvent.eventData, null, 2), "raw-payload")}
                  >
                    {copiedKey === "raw-payload" ? <Check /> : <Copy />} Copy
                  </Button>
                  <pre className="max-h-64 overflow-auto p-3 font-mono text-2xs">{JSON.stringify(selectedEvent.rawPayload || selectedEvent.eventData, null, 2)}</pre>
                </div>
              </details>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Preview AI input for a message ────────────────── */}
      <Dialog open={compileModalOpen} onOpenChange={setCompileModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview AI input</DialogTitle>
            <DialogDescription>What the assistant would receive for this message. Nothing is sent.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompileEventPrompt} className="custom-scrollbar max-h-[65vh] space-y-4 overflow-y-auto">
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border bg-muted px-3.5 py-2 text-sm">
              {eventText(compilingEvent) ?? "This event has no text."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id="compile-ai" label="Assistant">
                <NativeSelect id="compile-ai" value={compileAiProfileId} onChange={(e) => setCompileAiProfileId(e.target.value)}>
                  {assistantOptions("", "Page’s assistant")}
                </NativeSelect>
              </FormField>
              <label className="flex cursor-pointer items-center justify-between gap-3 self-end rounded-lg border px-3 py-2">
                <span className="text-sm">Include example replies</span>
                <Switch checked={compileIncludeFewShot} onCheckedChange={setCompileIncludeFewShot} />
              </label>
            </div>
            <Button type="submit" disabled={compileLoading}>
              {compileLoading ? <Loader2 className="animate-spin" /> : <Zap />}
              Build preview
            </Button>
            {compiledPromptResult && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs text-muted-foreground">Using {compiledPromptResult.profile.name} · {compiledPromptResult.messages.length} messages</p>
                {compiledPromptResult.messages.map((m, idx) => (
                  <div key={idx} className={cn("rounded-xl border p-3 text-sm", m.role === "system" ? "border-dashed font-mono text-xs text-muted-foreground" : m.role === "assistant" ? "bg-ink text-white" : "bg-card")}>
                    <div className="mb-1 flex items-center justify-between text-2xs font-medium opacity-70">
                      {m.role === "system" ? "Instructions" : m.role === "user" ? "Customer" : "Assistant"}
                      <button type="button" onClick={() => copyToClipboard(m.content, `compile-msg-${idx}`)} aria-label="Copy">
                        {copiedKey === `compile-msg-${idx}` ? <Check className="size-3" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reply with AI ─────────────────────────────────── */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reply with AI</DialogTitle>
            <DialogDescription>The assistant reads the chat history and writes a reply. Send it, or just preview.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateResponse} className="custom-scrollbar max-h-[68vh] space-y-4 overflow-y-auto">
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border bg-muted px-3.5 py-2 text-sm">
              {eventText(generatingEvent) ?? "This event has no text."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id="gen-ai" label="Assistant">
                <NativeSelect id="gen-ai" value={generateAiProfileId} onChange={(e) => setGenerateAiProfileId(e.target.value)}>
                  {assistantOptions("", "Page’s assistant")}
                </NativeSelect>
              </FormField>
              <FormField id="gen-context" label="Extra context">
                <Input id="gen-context" placeholder="e.g. Asked about the black panjabi" value={generateAdditionalContext} onChange={(e) => setGenerateAdditionalContext(e.target.value)} />
              </FormField>
            </div>
            {Object.keys(generateVariables).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Variables</p>
                {Object.entries(generateVariables).map(([k, val]) => (
                  <div key={k} className="grid grid-cols-[8rem_1fr] items-center gap-2">
                    <code className="truncate font-mono text-xs text-muted-foreground">{k}</code>
                    <Input value={val} aria-label={k} onChange={(e) => setGenerateVariables({ ...generateVariables, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
            <div className="divide-y rounded-xl border">
              <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">Send to the customer</span>
                  <span className="block text-xs text-muted-foreground">Off: just show me the reply.</span>
                </span>
                <Switch checked={generateSendToUser} onCheckedChange={setGenerateSendToUser} />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium">Include example replies</span>
                <Switch checked={generateIncludeFewShot} onCheckedChange={setGenerateIncludeFewShot} />
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={generateLoading}>
              {generateLoading ? <Loader2 className="animate-spin" /> : generateSendToUser ? <Send /> : <Sparkles />}
              {generateSendToUser ? "Write and send reply" : "Write reply"}
            </Button>

            {generatedResult && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {generatedResult.dispatchedToMessenger ? <Badge variant="success"><CheckCircle />Sent</Badge> : <Badge variant="outline">Not sent</Badge>}
                  {generatedResult.isFallback && <Badge variant="warning">Used fallback reply</Badge>}
                  <Badge variant="outline">{(generatedResult.latencyMs / 1000).toFixed(1)}s</Badge>
                  <Badge variant="outline">{generatedResult.tokenUsage.totalTokens} tokens</Badge>
                  <Badge variant="outline" className="font-mono">{generatedResult.modelName}</Badge>
                </div>
                <div className="relative ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 pr-10 text-sm text-white">
                  <p className="whitespace-pre-wrap">{generatedResult.generatedResponse}</p>
                  <button type="button" onClick={() => copyToClipboard(generatedResult.generatedResponse, "gen-resp")} className="absolute right-3 top-2.5 opacity-70 hover:opacity-100" aria-label="Copy reply">
                    {copiedKey === "gen-resp" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Chat history ──────────────────────────────────── */}
      <Sheet open={conversationModalOpen} onOpenChange={setConversationModalOpen}>
        <SheetContent side="right" title="Chat history" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="flex items-center gap-3 border-b px-5 py-4 pr-14">
            <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold">{conversationSenderId.slice(-2)}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg">Customer …{conversationSenderId.slice(-6)}</h2>
              <p className="text-xs text-muted-foreground">Chat history saved by Chippy</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => fetchConversation(conversationSenderId, 1)} disabled={conversationLoading} aria-label="Refresh">
              <RefreshCw className={cn(conversationLoading && "animate-spin")} />
            </Button>
          </div>
          <div className="custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto bg-muted/50 p-4">
            {conversationLoading ? (
              <div className="m-auto"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : conversationMessages.length === 0 ? (
              <p className="m-auto max-w-[28ch] text-center text-sm text-muted-foreground">No messages saved for this customer yet.</p>
            ) : (
              conversationMessages.map((msg) => {
                const mine = msg.role === "assistant"
                return (
                  <div key={msg.id} className={cn("flex max-w-[85%] flex-col", mine ? "ml-auto items-end" : "items-start")}>
                    <p className={cn("whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm", mine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border bg-card")}>{msg.content}</p>
                    <span className="mt-1 px-1 text-2xs text-muted-foreground">{mine ? "Chippy / you" : "Customer"} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                )
              })
            )}
          </div>
          <form onSubmit={handleSendOperatorMessage} className="flex gap-2 border-t p-3">
            <Input
              placeholder="Write a reply"
              aria-label="Reply"
              value={operatorMessageText}
              onChange={(e) => setOperatorMessageText(e.target.value)}
              disabled={operatorSending}
            />
            <Button type="submit" size="icon" disabled={operatorSending || !operatorMessageText.trim()} aria-label="Send">
              {operatorSending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FormField({ id, label, hint, required, children }: { id: string; label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-muted-foreground"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function CopyField({ value, label, copied, onCopy }: { value: string; label: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex gap-1.5">
      <Input readOnly value={value} aria-label={label} className="bg-muted font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
      <Button type="button" variant="outline" size="icon" onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  )
}
