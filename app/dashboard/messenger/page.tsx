"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Radio,
  Bot,
  Zap,
  Send,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  const [compileVariables, setCompileVariables] = useState<Record<string, string>>({ store_hours: "9am - 9pm" })
  const [compileIncludeFewShot, setCompileIncludeFewShot] = useState<boolean>(true)
  const [compileLoading, setCompileLoading] = useState(false)
  const [compiledPromptResult, setCompiledPromptResult] = useState<CompileWebhookEventPromptResponse["data"] | null>(null)

  // AI Response Generation & Dispatch State
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generatingEvent, setGeneratingEvent] = useState<MessengerWebhookEvent | null>(null)
  const [generateSendToUser, setGenerateSendToUser] = useState<boolean>(true)
  const [generateAiProfileId, setGenerateAiProfileId] = useState<string>("")
  const [generateVariables, setGenerateVariables] = useState<Record<string, string>>({ support_phone: "+1-800-555-0199" })
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
        title: "Copied to clipboard",
        description: text,
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
        title: "Network Error",
        description: "Failed to load messenger webhooks",
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
        title: "Validation Error",
        description: "Integration Name and App Secret are required.",
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
          title: "Webhook Created",
          description: `Integration "${json.data.name}" registered successfully.`,
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
          title: "Creation Failed",
          description: json.message || "Could not create webhook integration.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while creating webhook.",
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
          title: "Webhook Updated",
          description: "Integration details updated successfully.",
        })
        setEditModalOpen(false)
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: json.message || "Failed to update webhook.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while updating webhook.",
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
          title: targetAiProfileId ? "AI Profile Bound" : "AI Profile Unbound",
          description: json.message || "Webhook AI profile updated successfully.",
        })
        setBindModalOpen(false)
        setWebhookToBind(null)
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Binding Failed",
          description: json.message || "Failed to bind AI Profile.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while binding AI Profile.",
      })
    } finally {
      setBindLoading(false)
    }
  }

  // Open Event Prompt Compiler Modal
  const handleOpenEventCompiler = (event: MessengerWebhookEvent) => {
    setCompilingEvent(event)
    setCompileAiProfileId(event.aiProfileId || selectedWebhook?.aiProfileId || "")
    setCompileVariables({ store_hours: "9am - 9pm" })
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
          title: "Prompt Compiled Successfully",
          description: `Synthesized LLM prompt bundle using ${json.data.profile.name}.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Compilation Failed",
          description: json.message || "Failed to synthesize prompt from event.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error during prompt compilation.",
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
    setGenerateVariables({ support_phone: "+1-800-555-0199" })
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
          title: json.data.dispatchedToMessenger ? "AI Response Dispatched!" : "AI Response Generated",
          description: json.data.dispatchedToMessenger
            ? "Delivered directly to customer on Facebook Messenger."
            : "Generated response with LLM without sending to customer.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: json.message || "Failed to generate AI response.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error during response generation.",
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
          title: "Message Delivered",
          description: `Delivered to customer (${conversationSenderId}) via Meta Send API.`,
        })
        setOperatorMessageText("")
        await fetchConversation(conversationSenderId, 1)
      } else {
        toast({
          variant: "destructive",
          title: "Delivery Failed",
          description: json.message || "Failed to deliver message to customer.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error sending outbound message.",
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
          title: newStatus ? "Webhook Activated" : "Webhook Deactivated",
          description: `${hook.name} is now ${newStatus ? "active" : "disabled"}.`,
        })
        setWebhooks((prev) =>
          prev.map((item) => (item.id === hook.id ? { ...item, isActive: newStatus } : item))
        )
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update status",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error",
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
          title: "Webhook Deleted",
          description: "Integration removed successfully.",
        })
        setDeleteModalOpen(false)
        setWebhookToDelete(null)
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete webhook integration.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while deleting webhook.",
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
          title: "Page Synchronized",
          description: `${json.data.pageDetails.name} is now subscribed to messaging webhooks!`,
        })
        await fetchWebhooks()
      } else {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: json.message || "Failed to sync Facebook Page. Ensure Page Access Token is configured.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while synchronizing Facebook Page.",
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

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PROCESSED":
        return <Badge className="bg-success-soft text-success border-success/30 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Processed</Badge>
      case "DUPLICATE":
        return <Badge className="bg-warning-soft text-warning border-warning/30 flex items-center gap-1"><Clock className="h-3 w-3" /> Duplicate</Badge>
      case "ERROR":
        return <Badge className="bg-destructive-soft text-destructive border-destructive/30 flex items-center gap-1"><XCircle className="h-3 w-3" /> Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Meta Messenger Webhooks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure dynamic Meta Messenger webhook endpoints with per-user HMAC-SHA256 signature verification and Redis deduplication.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWebhooks}
            disabled={loading}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect Webhook</span>
          </Button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Loading webhook integrations...</span>
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="border-border bg-card p-8 text-center">
          <div className="h-10 w-10 rounded-lg bg-info-soft flex items-center justify-center mx-auto text-primary mb-2">
            <Radio className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-foreground text-sm">No Messenger Webhooks Configured</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Create your first Messenger webhook integration to receive real-time Meta Messenger notifications, verify Meta challenges, and connect your Facebook Page.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground mt-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Connect Webhook
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {webhooks.map((hook) => {
            const isSyncing = syncingId === hook.id
            const fullCallbackUrl = getDisplayWebhookUrl(hook.webhookUrl, hook.userId, hook.id)

            return (
              <Card key={hook.id} className="border-border bg-card shadow-sm overflow-hidden py-0 gap-0">
                <div className="p-3 sm:px-4 py-2.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-info-soft flex items-center justify-center text-primary shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-foreground text-sm">{hook.name}</h3>
                        <Badge
                          className={cn(
                            "text-[10px] py-0 px-1.5",
                            hook.isActive
                              ? "bg-success-soft text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {hook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {hook.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEventsModal(hook)}
                      className="text-xs h-7 px-2.5 flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3 text-primary" />
                      <span>Audit Events</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditData({
                          id: hook.id,
                          name: hook.name,
                          isActive: hook.isActive,
                          aiProfileId: hook.aiProfileId || "none",
                        })
                        setEditModalOpen(true)
                      }}
                      className="text-xs h-7 px-2"
                    >
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWebhookToDelete(hook)
                        setDeleteModalOpen(true)
                      }}
                      className="text-xs h-7 px-2 text-destructive hover:bg-destructive-soft hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* AI Persona Binding Banner */}
                {(() => {
                  const boundProfile = aiProfiles.find((p) => p.id === hook.aiProfileId)
                  return (
                    <div className="px-3.5 sm:px-4 py-2 bg-primary/[0.03] border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">AI Persona:</span>
                            {boundProfile ? (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium flex items-center gap-1 py-0 px-1.5">
                                <Sparkles className="h-2 w-2" />
                                {boundProfile.name}
                                <span className="opacity-70 text-[9px]">({boundProfile.role})</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground py-0 px-1.5">
                                Default AI Profile (Fallback)
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {boundProfile
                              ? `Model: ${boundProfile.modelConfig?.provider || "openai"}:${boundProfile.modelConfig?.modelName || "gpt-4o"} • Dispatches tailored LLM prompt bundles`
                              : "No dedicated persona bound. System uses your account default AI profile."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setWebhookToBind(hook)
                            setSelectedAiProfileToBind(hook.aiProfileId || "none")
                            setBindModalOpen(true)
                          }}
                          className="h-6 px-2 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Bot className="h-3 w-3" />
                          <span>{hook.aiProfileId ? "Change Persona" : "Bind Persona"}</span>
                        </Button>

                        <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground">
                          <Link href="/dashboard/ai-profiles" title="Manage AI Personas">
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })()}

                <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {/* Left: Meta Configuration details for Developer Dashboard */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Meta Developer App Configuration
                    </p>

                    {/* Callback URL */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Callback URL (Paste into Meta Dashboard)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          readOnly
                          value={fullCallbackUrl}
                          className="font-mono text-xs bg-muted/40 h-7"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(fullCallbackUrl, `url-${hook.id}`)}
                          className="h-7 px-2 shrink-0"
                        >
                          {copiedKey === `url-${hook.id}` ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Verify Token */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Verify Token (Paste into Meta Dashboard)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          readOnly
                          value={hook.verifyToken}
                          className="font-mono text-xs bg-muted/40 h-7"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(hook.verifyToken, `token-${hook.id}`)}
                          className="h-7 px-2 shrink-0"
                        >
                          {copiedKey === `token-${hook.id}` ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px]">Active Status:</span>
                        <Switch
                          checked={hook.isActive}
                          onCheckedChange={(checked) => handleToggleActive(hook, checked)}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Created {new Date(hook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right: Associated Facebook Page details */}
                  <div className="space-y-3 rounded-lg bg-muted/20 border border-border p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Associated Facebook Page
                        </p>
                        {hook.pageSubscribedAt ? (
                          <Badge className="bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Subscribed
                          </Badge>
                        ) : hook.pageId ? (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            Page Linked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                            Not Linked
                          </Badge>
                        )}
                      </div>

                      {hook.pageName ? (
                        <div className="flex items-center gap-2.5 mt-1.5">
                          {hook.pagePictureUrl ? (
                            <img
                              src={hook.pagePictureUrl}
                              alt={hook.pageName}
                              className="h-9 w-9 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground text-xs">
                              {hook.pageName[0]}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs text-foreground">{hook.pageName}</p>
                              {hook.pageLink && (
                                <a
                                  href={hook.pageLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Page ID: {hook.pageId} • {hook.pageCategory || "Business Page"}
                            </p>
                          </div>
                        </div>
                      ) : hook.pageId ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Page ID: <strong>{hook.pageId}</strong>. Synchronize with Meta Graph API to fetch page details and auto-subscribe.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          No Facebook Page associated yet. Provide a Page ID and Page Access Token to auto-subscribe messaging webhooks.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncPage(hook)}
                        disabled={isSyncing}
                        className="text-xs h-7 w-full flex items-center justify-center gap-1.5 bg-card"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Synchronizing Meta Graph API...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 text-primary" />
                            <span>Sync Facebook Page & Subscribe</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Connect Webhook Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Meta Messenger Webhook</DialogTitle>
            <DialogDescription>
              Create a dedicated webhook endpoint to receive real-time Meta Messenger event notifications.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWebhook} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold">
                Integration Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Customer Support Bot"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="appSecret" className="text-xs font-semibold">
                Meta App Secret <span className="text-destructive">*</span>
              </Label>
              <Input
                id="appSecret"
                type="password"
                placeholder="Meta App Secret for HMAC-SHA256 signature verification"
                value={formData.appSecret}
                onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                required
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Found in Meta App Dashboard under App Settings → Basic.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="verifyToken" className="text-xs font-semibold">
                Verify Token <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="verifyToken"
                placeholder="Leave blank to auto-generate"
                value={formData.verifyToken}
                onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pageId" className="text-xs font-semibold">
                Facebook Page ID <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="pageId"
                placeholder="e.g. 106378625516323"
                value={formData.pageId}
                onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pageAccessToken" className="text-xs font-semibold">
                Page Access Token <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="pageAccessToken"
                type="password"
                placeholder="EAAB..."
                value={formData.pageAccessToken}
                onChange={(e) => setFormData({ ...formData, pageAccessToken: e.target.value })}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Required for auto-subscribing the page via the Meta /subscribed_apps edge.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="aiProfileId" className="text-xs font-semibold">
                Bound AI Persona Profile <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <select
                id="aiProfileId"
                value={formData.aiProfileId}
                onChange={(e) => setFormData({ ...formData, aiProfileId: e.target.value })}
                className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
              >
                <option value="">Default AI Profile (Fallback)</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                Synthesizes custom LLM prompt bundles for events on this webhook.
              </p>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Create Integration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Webhook Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Webhook Integration</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateWebhook} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs font-semibold">
                Integration Name
              </Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-aiProfile" className="text-xs font-semibold">
                Bound AI Persona Profile
              </Label>
              <select
                id="edit-aiProfile"
                value={editData.aiProfileId || "none"}
                onChange={(e) => setEditData({ ...editData, aiProfileId: e.target.value })}
                className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
              >
                <option value="none">No Specific Persona (Use Default)</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Active Status</p>
                <p className="text-xs text-muted-foreground">
                  Toggle whether this webhook integration accepts notifications.
                </p>
              </div>
              <Switch
                checked={editData.isActive}
                onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{webhookToDelete?.name}&quot;? Meta webhook notifications to this dynamic callback will be rejected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWebhook}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Events Modal */}
      <Dialog open={eventsModalOpen} onOpenChange={setEventsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Webhook Event Audit Log — {selectedWebhook?.name}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Real-time events validated with HMAC-SHA256 signatures, deduplicated via Redis, and audited in MongoDB.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, eventsPage)}
                disabled={eventsLoading}
                className="h-8 text-xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1", eventsLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Status:</span>
                <select
                  value={eventStatusFilter}
                  onChange={(e) => setEventStatusFilter(e.target.value)}
                  className="h-7 text-xs rounded border border-border bg-background px-2"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PROCESSED">Processed</option>
                  <option value="DUPLICATE">Duplicate</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Event Type:</span>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="h-7 text-xs rounded border border-border bg-background px-2"
                >
                  <option value="ALL">All Types</option>
                  <option value="messages">messages</option>
                  <option value="messaging_postbacks">messaging_postbacks</option>
                  <option value="message_deliveries">message_deliveries</option>
                </select>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {eventsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">Loading audit records...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                <p className="font-semibold text-foreground text-sm">No Events Recorded Yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When Meta sends Messenger events to your webhook URL, HMAC-verified events will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {ev.eventType}
                          </Badge>
                          {getStatusBadge(ev.status)}
                        </div>
                        <p className="text-muted-foreground truncate mt-0.5">
                          {ev.eventData?.message?.text
                            ? `Message: "${ev.eventData.message.text}"`
                            : ev.eventData?.postback?.title
                            ? `Postback: "${ev.eventData.postback.title}"`
                            : `From: ${ev.senderId}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenConversation(ev.senderId)}
                            className="text-[10px] text-primary hover:underline font-mono flex items-center gap-1"
                            title="Open live chat history with this customer"
                          >
                            <MessageCircle className="h-3 w-3" />
                            Sender: {ev.senderId}
                          </button>
                          <span className="text-[10px] text-muted-foreground">• Page: {ev.pageId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-muted-foreground hidden sm:inline mr-1">
                        {new Date(ev.createdAt).toLocaleTimeString()}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenGenerateResponse(ev)}
                        className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        title="Generate AI response with multi-turn memory & dispatch"
                      >
                        <Bot className="h-3 w-3" />
                        <span className="hidden md:inline">Generate Reply</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEventCompiler(ev)}
                        className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        title="Compile LLM prompt from customer event"
                      >
                        <Zap className="h-3 w-3" />
                        <span className="hidden lg:inline">Compile</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleInspectEvent(ev)}
                        className="h-7 text-xs"
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {eventsTotalPages > 1 && (
            <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20 text-xs">
              <Button
                size="sm"
                variant="outline"
                disabled={eventsPage <= 1 || eventsLoading}
                onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, eventsPage - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {eventsPage} of {eventsTotalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={eventsPage >= eventsTotalPages || eventsLoading}
                onClick={() => selectedWebhook && fetchEvents(selectedWebhook.id, eventsPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inspect Event Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Meta Webhook Event Details
                </DialogTitle>
                <DialogDescription className="text-xs font-mono mt-0.5">
                  Event ID: {selectedEvent?.id}
                </DialogDescription>
              </div>
              {selectedEvent && getStatusBadge(selectedEvent.status)}
            </div>
          </DialogHeader>

          <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : selectedEvent ? (
              <>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border border-border font-mono text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Event Type:</span>
                    <span className="font-semibold">{selectedEvent.eventType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Received At:</span>
                    <span>{new Date(selectedEvent.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Sender PSID:</span>
                    <span>{selectedEvent.senderId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Recipient Page ID:</span>
                    <span>{selectedEvent.pageId}</span>
                  </div>
                  {selectedEvent.aiProfileId && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Bound AI Profile ID:</span>
                      <span className="font-semibold text-primary">{selectedEvent.aiProfileId}</span>
                    </div>
                  )}
                </div>

                {selectedEvent.errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive-soft text-destructive border border-destructive/30">
                    <p className="font-semibold">Error Message:</p>
                    <p className="mt-1 font-mono">{selectedEvent.errorMessage}</p>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-primary/[0.04] border border-primary/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-primary" />
                      AI Response & Conversation Intelligence
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false)
                        handleOpenConversation(selectedEvent.senderId)
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      View Full Conversation
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Synthesize prompt bundles, generate responses with multi-turn conversation memory, or dispatch directly to Facebook Messenger.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        setDetailModalOpen(false)
                        handleOpenGenerateResponse(selectedEvent)
                      }}
                      className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      Generate Reply & Dispatch
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDetailModalOpen(false)
                        handleOpenEventCompiler(selectedEvent)
                      }}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      Compile Prompt
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Raw Meta Payload
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedEvent.rawPayload || selectedEvent.eventData, null, 2),
                          "raw-payload"
                        )
                      }
                      className="h-6 text-[11px] px-2"
                    >
                      {copiedKey === "raw-payload" ? <Check className="h-3 w-3 text-success mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy JSON
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-muted/60 border border-border font-mono text-[11px] max-h-64 overflow-auto text-foreground">
                    {JSON.stringify(selectedEvent.rawPayload || selectedEvent.eventData, null, 2)}
                  </pre>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dedicated AI Profile Binding Modal */}
      <Dialog open={bindModalOpen} onOpenChange={setBindModalOpen}>
        <DialogContent className="max-w-md p-4 sm:p-5 border-border bg-card gap-3.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              Bind AI Persona Profile
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a dedicated AI persona model to &quot;{webhookToBind?.name}&quot; for automated prompt compilation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select AI Persona</Label>
              <select
                value={selectedAiProfileToBind}
                onChange={(e) => setSelectedAiProfileToBind(e.target.value)}
                className="w-full h-9 px-2.5 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
              >
                <option value="none">No Dedicated Persona (Fallback to Account Default)</option>
                {aiProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.role} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                When customer messages arrive at this webhook, the selected persona&apos;s system prompt, knowledge base, and guardrails are applied.
              </p>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBindModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={bindLoading}
                onClick={handleBindAiProfile}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {bindLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Save Persona Binding
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Prompt Compiler Modal */}
      <Dialog open={compileModalOpen} onOpenChange={setCompileModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 border-border bg-card gap-3.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              Synthesize AI Prompt from Messenger Event
            </DialogTitle>
            <DialogDescription className="text-xs">
              Compiles an LLM prompt bundle using this customer event payload and the bound AI persona.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompileEventPrompt} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">AI Persona Override (Optional)</Label>
                <select
                  value={compileAiProfileId}
                  onChange={(e) => setCompileAiProfileId(e.target.value)}
                  className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
                >
                  <option value="">Webhook Bound / Account Default Persona</option>
                  {aiProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Include Few-Shot Dialogs</Label>
                  <p className="text-[10px] text-muted-foreground">Appends sample Q&A into messages</p>
                </div>
                <Switch
                  checked={compileIncludeFewShot}
                  onCheckedChange={setCompileIncludeFewShot}
                />
              </div>
            </div>

            {/* Extracted message display */}
            <div className="p-3 rounded-md bg-muted/40 border border-border text-xs space-y-1">
              <span className="font-semibold text-muted-foreground text-[10px] uppercase">
                Customer Inquiry Extracted from Meta Event
              </span>
              <p className="font-medium text-foreground">
                {compilingEvent?.eventData?.message?.text ||
                  compilingEvent?.eventData?.postback?.payload ||
                  "(No text message body found in payload)"}
              </p>
            </div>

            <Button
              type="submit"
              disabled={compileLoading}
              className="w-full h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {compileLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Compile LLM Prompt Bundle
            </Button>

            {/* Compiled Prompt View */}
            {compiledPromptResult && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Persona: {compiledPromptResult.profile.name} ({compiledPromptResult.profile.role})
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Prompt Messages: {compiledPromptResult.messages.length}
                  </span>
                </div>

                {/* Assembled messages */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {compiledPromptResult.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-2.5 rounded-md border text-xs",
                        m.role === "system" && "bg-muted/40 border-border font-mono text-[11px]",
                        m.role === "user" && "bg-primary/5 border-primary/20",
                        m.role === "assistant" && "bg-emerald-500/5 border-emerald-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {m.role}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.content, `compile-msg-${idx}`)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedKey === `compile-msg-${idx}` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-xs">{m.content}</pre>
                    </div>
                  ))}
                </div>

                {/* Applied Variables */}
                {compiledPromptResult.appliedVariables && (
                  <div className="p-2 rounded bg-muted/30 border border-border text-xs space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Applied Channel Context & Variables
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {Object.entries(compiledPromptResult.appliedVariables).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-primary">{k}:</span>
                          <span className="text-muted-foreground truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* GENERATE AI RESPONSE MODAL                                                */}
      {/* ========================================================================= */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 border-border bg-card gap-3.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              Generate AI Response & Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs">
              Synthesize an AI reply with multi-turn conversation memory, and optionally deliver it directly to the customer on Messenger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateResponse} className="space-y-4 pt-2">
            {/* Inbound Customer Inquiry Display */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                <span>Inbound Customer Message</span>
                <span>PSID: {generatingEvent?.senderId}</span>
              </div>
              <p className="font-semibold text-foreground text-sm">
                {generatingEvent?.eventData?.message?.text ||
                  generatingEvent?.eventData?.postback?.payload ||
                  "(No text message body found in payload)"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">AI Persona Profile</Label>
                <select
                  value={generateAiProfileId}
                  onChange={(e) => setGenerateAiProfileId(e.target.value)}
                  className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
                >
                  <option value="">Webhook Bound / Account Default</option>
                  {aiProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role} {p.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Additional Context (Optional)</Label>
                <Input
                  placeholder="e.g. Customer is inquiring about room rates"
                  value={generateAdditionalContext}
                  onChange={(e) => setGenerateAdditionalContext(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Delivery Toggle & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <Send className="h-3.5 w-3.5" />
                    Deliver to Messenger
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Send reply via Meta Graph API Send endpoint
                  </p>
                </div>
                <Switch
                  checked={generateSendToUser}
                  onCheckedChange={setGenerateSendToUser}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Include Few-Shot Dialogs</Label>
                  <p className="text-[10px] text-muted-foreground">Prepend sample persona Q&A</p>
                </div>
                <Switch
                  checked={generateIncludeFewShot}
                  onCheckedChange={setGenerateIncludeFewShot}
                />
              </div>
            </div>

            {/* Dynamic Session Variables */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dynamic Channel Variables</Label>
              <div className="space-y-1.5 p-2 rounded-md border border-border bg-muted/10 max-h-28 overflow-y-auto">
                {Object.entries(generateVariables).map(([k, val]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-primary w-1/3 truncate">{k}:</span>
                    <Input
                      value={val}
                      onChange={(e) => setGenerateVariables({ ...generateVariables, [k]: e.target.value })}
                      className="h-7 text-xs flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={generateLoading}
              className="w-full h-9 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {generateLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              {generateSendToUser ? "Generate & Dispatch to Customer" : "Generate AI Reply (Preview Only)"}
            </Button>

            {/* Generation Results View */}
            {generatedResult && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    {generatedResult.dispatchedToMessenger ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Dispatched to Messenger
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Generated Only (Not Sent)
                      </Badge>
                    )}

                    {generatedResult.isFallback && (
                      <Badge variant="destructive" className="text-xs">
                        Fallback Triggered
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <Badge variant="outline" className="text-[10px]">
                      {generatedResult.latencyMs} ms
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {generatedResult.provider}:{generatedResult.modelName}
                    </Badge>
                  </div>
                </div>

                {/* Generated response text bubble */}
                <div className="relative p-3 rounded-lg bg-background border border-border text-xs leading-relaxed">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedResult.generatedResponse, "gen-resp")}
                    className="absolute right-2 top-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Copy generated response"
                  >
                    {copiedKey === "gen-resp" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <p className="font-sans whitespace-pre-wrap pr-6 text-foreground font-medium">
                    {generatedResult.generatedResponse}
                  </p>
                </div>

                {/* Token Metrics & Message IDs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground pt-1">
                  <div className="p-2 rounded bg-muted/40 border border-border">
                    <span className="font-semibold text-foreground block text-[10px] uppercase">
                      Token Usage
                    </span>
                    <span>Prompt: {generatedResult.tokenUsage.promptTokens}</span> •{" "}
                    <span>Completion: {generatedResult.tokenUsage.completionTokens}</span> •{" "}
                    <span className="font-bold text-foreground">Total: {generatedResult.tokenUsage.totalTokens}</span>
                  </div>

                  <div className="p-2 rounded bg-muted/40 border border-border">
                    <span className="font-semibold text-foreground block text-[10px] uppercase">
                      Meta Message IDs
                    </span>
                    <span className="truncate block">
                      {generatedResult.messageIds?.length > 0
                        ? generatedResult.messageIds.join(", ")
                        : "None (not delivered)"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* CUSTOMER CONVERSATION HISTORY & LIVE MESSAGING MODAL                      */}
      {/* ========================================================================= */}
      <Dialog open={conversationModalOpen} onOpenChange={setConversationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden border-border bg-card">
          <DialogHeader className="p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    Customer Chat Stream
                    <Badge variant="outline" className="font-mono text-[10px]">
                      PSID: {conversationSenderId}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground">
                    Multi-turn conversation history with live operator Send API messaging.
                  </DialogDescription>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={conversationLoading}
                onClick={() => fetchConversation(conversationSenderId, 1)}
                className="h-7 text-xs px-2 gap-1"
              >
                <RefreshCw className={cn("h-3 w-3", conversationLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Stream Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[440px] bg-muted/5">
            {conversationLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-xs">Loading conversation history...</span>
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">No prior conversation history recorded</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  Messages sent by the customer or dispatched by the AI bot/operator will appear here.
                </p>
              </div>
            ) : (
              conversationMessages.map((msg) => {
                const isAssistant = msg.role === "assistant"

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%] text-xs",
                      isAssistant ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">
                        {isAssistant ? "AI Bot / Support Agent" : `Customer (${msg.senderId})`}
                      </span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      {msg.messageId && (
                        <span className="font-mono opacity-60 truncate max-w-[100px]" title={msg.messageId}>
                          [{msg.messageId.split(":").pop()}]
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        "p-3 rounded-2xl text-xs leading-relaxed shadow-sm font-sans whitespace-pre-wrap",
                        isAssistant
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "bg-muted/80 text-foreground border border-border rounded-tl-xs"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Live Operator Message Composer */}
          <form onSubmit={handleSendOperatorMessage} className="p-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type an outbound message to deliver via Meta Send API..."
                value={operatorMessageText}
                onChange={(e) => setOperatorMessageText(e.target.value)}
                disabled={operatorSending}
                className="text-xs h-9 bg-background"
              />
              <Button
                type="submit"
                disabled={operatorSending || !operatorMessageText.trim()}
                className="h-9 px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                {operatorSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

