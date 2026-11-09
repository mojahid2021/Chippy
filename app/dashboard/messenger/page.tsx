"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertTriangle,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Search,
  Filter,
  Key,
  Globe,
  Radio,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type {
  MessengerWebhook,
  MessengerWebhooksResponse,
  MessengerWebhookEvent,
  MessengerEventsResponse,
  SyncPageResponse,
} from "@/lib/types/woombat"

function getDisplayWebhookUrl(webhookUrl?: string | null, userId?: string, webhookId?: string): string {
  if (typeof window === "undefined") {
    return webhookUrl || ""
  }

  const origin = window.location.origin

  if (!webhookUrl) {
    if (userId && webhookId) {
      return `${origin}/api/v1/webhooks/messenger/user/${userId}/${webhookId}`
    }
    return ""
  }

  // If webhookUrl is already an absolute URL (e.g. from backend response like http://localhost:3001/api/...)
  if (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://")) {
    try {
      const parsed = new URL(webhookUrl)
      // If it points to localhost / 127.0.0.1, adapt it to the user's current origin (e.g. localhost:3000, ngrok, or production domain)
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${origin}${parsed.pathname}${parsed.search}`
      }
      return webhookUrl
    } catch {
      return webhookUrl
    }
  }

  // If it's a relative path starting with /
  if (webhookUrl.startsWith("/")) {
    return `${origin}${webhookUrl}`
  }

  return `${origin}/${webhookUrl}`
}

export default function MessengerWebhooksPage() {
  const [webhooks, setWebhooks] = useState<MessengerWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<MessengerWebhook | null>(null)

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    appSecret: "",
    verifyToken: "",
    pageId: "",
    pageAccessToken: "",
  })

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editData, setEditData] = useState({ id: "", name: "", isActive: true })

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
  }, [fetchWebhooks])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
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
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Connect Webhook</span>
          </Button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading webhook integrations...</span>
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="border-border bg-card p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-info-soft flex items-center justify-center mx-auto text-primary mb-3">
            <Radio className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">No Messenger Webhooks Configured</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Create your first Messenger webhook integration to receive real-time Meta Messenger notifications, verify Meta challenges, and connect your Facebook Page.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Connect Webhook
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {webhooks.map((hook) => {
            const isSyncing = syncingId === hook.id
            const fullCallbackUrl = getDisplayWebhookUrl(hook.webhookUrl, hook.userId, hook.id)

            return (
              <Card key={hook.id} className="border-border bg-card shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info-soft flex items-center justify-center text-primary shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base">{hook.name}</h3>
                        <Badge
                          className={cn(
                            "text-xs",
                            hook.isActive
                              ? "bg-success-soft text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {hook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">ID: {hook.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEventsModal(hook)}
                      className="text-xs h-8 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Audit Events</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditData({ id: hook.id, name: hook.name, isActive: hook.isActive })
                        setEditModalOpen(true)
                      }}
                      className="text-xs h-8 px-2.5"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWebhookToDelete(hook)
                        setDeleteModalOpen(true)
                      }}
                      className="text-xs h-8 px-2.5 text-destructive hover:bg-destructive-soft hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Meta Configuration details for Developer Dashboard */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Meta Developer App Configuration
                    </p>

                    {/* Callback URL */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Callback URL (Paste into Meta Dashboard)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={fullCallbackUrl}
                          className="font-mono text-xs bg-muted/40 h-8"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(fullCallbackUrl, `url-${hook.id}`)}
                          className="h-8 shrink-0"
                        >
                          {copiedKey === `url-${hook.id}` ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Verify Token */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Verify Token (Paste into Meta Dashboard)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={hook.verifyToken}
                          className="font-mono text-xs bg-muted/40 h-8"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(hook.verifyToken, `token-${hook.id}`)}
                          className="h-8 shrink-0"
                        >
                          {copiedKey === `token-${hook.id}` ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Active Status:</span>
                        <Switch
                          checked={hook.isActive}
                          onCheckedChange={(checked) => handleToggleActive(hook, checked)}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Created {new Date(hook.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right: Associated Facebook Page details */}
                  <div className="space-y-4 rounded-xl bg-muted/20 border border-border p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Associated Facebook Page
                        </p>
                        {hook.pageSubscribedAt ? (
                          <Badge className="bg-success-soft text-success border-success/30 text-xs flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Subscribed
                          </Badge>
                        ) : hook.pageId ? (
                          <Badge variant="outline" className="text-xs">
                            Page Linked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Not Linked
                          </Badge>
                        )}
                      </div>

                      {hook.pageName ? (
                        <div className="flex items-center gap-3 mt-2">
                          {hook.pagePictureUrl ? (
                            <img
                              src={hook.pagePictureUrl}
                              alt={hook.pageName}
                              className="h-10 w-10 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground">
                              {hook.pageName[0]}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-foreground">{hook.pageName}</p>
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
                            <p className="text-xs text-muted-foreground">
                              Page ID: {hook.pageId} • {hook.pageCategory || "Business Page"}
                            </p>
                          </div>
                        </div>
                      ) : hook.pageId ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          Page ID: <strong>{hook.pageId}</strong>. Synchronize with Meta Graph API to fetch page details and auto-subscribe.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          No Facebook Page associated yet. Provide a Page ID and Page Access Token to auto-subscribe messaging webhooks.
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncPage(hook)}
                        disabled={isSyncing}
                        className="text-xs w-full flex items-center justify-center gap-1.5 bg-card"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Synchronizing Meta Graph API...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
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
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Sender: {ev.senderId} • Page: {ev.pageId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(ev.createdAt).toLocaleTimeString()}
                      </span>
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
                </div>

                {selectedEvent.errorMessage && (
                  <div className="p-3 rounded-lg bg-destructive-soft text-destructive border border-destructive/30">
                    <p className="font-semibold">Error Message:</p>
                    <p className="mt-1 font-mono">{selectedEvent.errorMessage}</p>
                  </div>
                )}

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
    </div>
  )
}

