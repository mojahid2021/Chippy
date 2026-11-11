"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  MessageCircle,
  RefreshCw,
  Send,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  Copy,
  Paperclip,
  User,
  Radio,
  Image as ImageIcon,
  FileText,
  Volume2,
  Video,
  X,
  Plus,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type {
  MessengerWebhook,
  LiveConversation,
  LiveConversationsResponse,
  LiveMessage,
  LiveMessagesResponse,
  LiveCustomerProfile,
  LiveCustomerProfileResponse,
  LiveQuickReply,
  LiveAttachmentType,
  LiveConversationFolder,
  LiveConversationPlatform,
  SendLiveMessageResponse,
  SendLiveSenderActionResponse,
} from "@/lib/types/woombat"

interface LiveMessengerSuiteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  webhook: MessengerWebhook | null
}

export function LiveMessengerSuiteModal({
  open,
  onOpenChange,
  webhook,
}: LiveMessengerSuiteModalProps) {
  // Filter states
  const [folder, setFolder] = useState<LiveConversationFolder>("inbox")
  const [platform, setPlatform] = useState<LiveConversationPlatform>("messenger")
  const [searchQuery, setSearchQuery] = useState("")

  // Conversations list state
  const [conversations, setConversations] = useState<LiveConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [paging, setPaging] = useState<{
    before?: string | null
    after?: string | null
    hasNext?: boolean
    hasPrevious?: boolean
  }>({})

  // Active selected conversation thread
  const [selectedThread, setSelectedThread] = useState<LiveConversation | null>(null)

  // Messages in active thread
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesPaging, setMessagesPaging] = useState<{
    before?: string | null
    after?: string | null
    hasNext?: boolean
    hasPrevious?: boolean
  }>({})

  // Active customer profile
  const [customerProfile, setCustomerProfile] = useState<LiveCustomerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)

  // Outbound message composer state
  const [composerMode, setComposerMode] = useState<"text" | "attachment">("text")
  const [messageText, setMessageText] = useState("")
  const [quickReplies, setQuickReplies] = useState<LiveQuickReply[]>([])
  const [newQrTitle, setNewQrTitle] = useState("")
  const [newQrPayload, setNewQrPayload] = useState("")
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Attachment composer state
  const [attachmentType, setAttachmentType] = useState<LiveAttachmentType>("image")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [attachmentReusable, setAttachmentReusable] = useState(true)

  // Action states
  const [sendingMessage, setSendingMessage] = useState(false)
  const [senderActionLoading, setSenderActionLoading] = useState(false)
  const [typingActive, setTypingActive] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Fetch live conversations from Meta Graph API
  const fetchConversations = useCallback(
    async (cursor?: { before?: string; after?: string }) => {
      if (!webhook) return
      try {
        setConversationsLoading(true)
        const params = new URLSearchParams({
          limit: "25",
          folder,
          platform,
        })
        if (cursor?.after) params.set("after", cursor.after)
        if (cursor?.before) params.set("before", cursor.before)

        const res = await fetch(
          `/api/v1/messenger/webhooks/${webhook.id}/live/conversations?${params.toString()}`
        )
        const json: LiveConversationsResponse = await res.json()

        if (res.ok && json.data) {
          setConversations(json.data.conversations || [])
          setPaging({
            before: json.data.paging?.cursors?.before || null,
            after: json.data.paging?.cursors?.after || null,
            hasNext: !!json.data.paging?.hasNext,
            hasPrevious: !!json.data.paging?.hasPrevious,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Failed to fetch conversations",
            description: (json as unknown as { message?: string })?.message || "Could not retrieve live conversations from Meta.",
          })
        }
      } catch (err) {
        console.error("Live conversations error:", err)
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Failed to reach Meta live conversation endpoint.",
        })
      } finally {
        setConversationsLoading(false)
      }
    },
    [webhook, folder, platform]
  )

  // Fetch live chronological messages in a thread
  const fetchMessages = useCallback(
    async (conversationId: string, cursor?: { before?: string; after?: string }) => {
      if (!webhook) return
      try {
        setMessagesLoading(true)
        const params = new URLSearchParams({ limit: "50" })
        if (cursor?.after) params.set("after", cursor.after)
        if (cursor?.before) params.set("before", cursor.before)

        const res = await fetch(
          `/api/v1/messenger/webhooks/${webhook.id}/live/conversations/${encodeURIComponent(
            conversationId
          )}/messages?${params.toString()}`
        )
        const json: LiveMessagesResponse = await res.json()

        if (res.ok && json.data) {
          const list = json.data.messages || []
          // Sort chronologically ascending (oldest first to newest last)
          const sorted = [...list].sort(
            (a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
          )
          setMessages(sorted)
          setMessagesPaging({
            before: json.data.paging?.cursors?.before || null,
            after: json.data.paging?.cursors?.after || null,
            hasNext: !!json.data.paging?.hasNext,
            hasPrevious: !!json.data.paging?.hasPrevious,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Failed to fetch messages",
            description: (json as unknown as { message?: string })?.message || "Could not retrieve live thread messages.",
          })
        }
      } catch (err) {
        console.error("Live messages error:", err)
      } finally {
        setMessagesLoading(false)
      }
    },
    [webhook]
  )

  // Fetch customer profile from PSID
  const fetchCustomerProfile = useCallback(
    async (psid: string) => {
      if (!webhook || !psid) return
      try {
        setProfileLoading(true)
        const res = await fetch(
          `/api/v1/messenger/webhooks/${webhook.id}/live/profiles/${encodeURIComponent(psid)}`
        )
        const json: LiveCustomerProfileResponse = await res.json()

        if (res.ok && json.data) {
          setCustomerProfile(json.data)
        } else {
          setCustomerProfile(null)
        }
      } catch (err) {
        console.error("Live profile fetch error:", err)
        setCustomerProfile(null)
      } finally {
        setProfileLoading(false)
      }
    },
    [webhook]
  )

  // Initialize or reload on modal open
  useEffect(() => {
    if (open && webhook) {
      fetchConversations()
    } else {
      setSelectedThread(null)
      setMessages([])
      setCustomerProfile(null)
      setMessageText("")
      setQuickReplies([])
      setAttachmentUrl("")
    }
  }, [open, webhook, fetchConversations])

  // When a thread is selected, load its messages and customer profile
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id)
      const psid =
        selectedThread.customer?.id ||
        selectedThread.senders?.[0]?.id ||
        selectedThread.participants?.find((p) => p.id !== webhook?.pageId)?.id
      if (psid) {
        fetchCustomerProfile(psid)
      }
    }
  }, [selectedThread, fetchMessages, fetchCustomerProfile, webhook])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Execute sender actions (mark_seen, typing_on, typing_off)
  const handleSenderAction = async (action: "typing_on" | "typing_off" | "mark_seen") => {
    if (!webhook || !selectedThread) return
    const psid =
      selectedThread.customer?.id ||
      selectedThread.senders?.[0]?.id ||
      selectedThread.participants?.find((p) => p.id !== webhook.pageId)?.id
    if (!psid) {
      toast({
        variant: "destructive",
        title: "Action error",
        description: "Customer PSID not found for this thread.",
      })
      return
    }

    try {
      setSenderActionLoading(true)
      const res = await fetch(`/api/v1/messenger/webhooks/${webhook.id}/live/sender-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: psid, action }),
      })
      const json: SendLiveSenderActionResponse = await res.json()

      if (res.ok && json.data?.success) {
        if (action === "typing_on") {
          setTypingActive(true)
          toast({
            variant: "info",
            title: "Typing Indicator Active",
            description: "Sent typing_on signal to customer on Messenger.",
          })
          // Auto turn off typing indicator after 15 seconds
          setTimeout(() => setTypingActive(false), 15000)
        } else if (action === "typing_off") {
          setTypingActive(false)
          toast({
            variant: "info",
            title: "Typing Indicator Stopped",
            description: "Sent typing_off signal.",
          })
        } else if (action === "mark_seen") {
          toast({
            variant: "success",
            title: "Marked as Seen",
            description: "Read receipt dispatched to customer on Messenger.",
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Sender action failed",
          description: (json as unknown as { message?: string })?.message || "Failed to execute sender action.",
        })
      }
    } catch (err) {
      console.error("Sender action error:", err)
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Could not dispatch sender action.",
      })
    } finally {
      setSenderActionLoading(false)
    }
  }

  // Send live message (Text or Attachment)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!webhook || !selectedThread) return
    const psid =
      selectedThread.customer?.id ||
      selectedThread.senders?.[0]?.id ||
      selectedThread.participants?.find((p) => p.id !== webhook.pageId)?.id
    if (!psid) {
      toast({
        variant: "destructive",
        title: "Send error",
        description: "Customer PSID could not be determined.",
      })
      return
    }

    if (composerMode === "text" && !messageText.trim()) return
    if (composerMode === "attachment" && !attachmentUrl.trim()) return

    try {
      setSendingMessage(true)
      const payload: Record<string, unknown> = {
        recipientId: psid,
      }

      if (composerMode === "text") {
        payload.text = messageText.trim()
        if (quickReplies.length > 0) {
          payload.quickReplies = quickReplies
        }
      } else {
        payload.attachment = {
          type: attachmentType,
          url: attachmentUrl.trim(),
          isReusable: attachmentReusable,
        }
      }

      const res = await fetch(`/api/v1/messenger/webhooks/${webhook.id}/live/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json: SendLiveMessageResponse = await res.json()

      if (res.ok && json.data) {
        toast({
          variant: "success",
          title: "Message Dispatched",
          description: `Dispatched to Meta Graph API (${json.data.chunksSent} chunk(s) sent).`,
        })

        // Reset composer
        setMessageText("")
        setQuickReplies([])
        setAttachmentUrl("")
        setTypingActive(false)

        // Refresh messages in thread to show sent reply
        fetchMessages(selectedThread.id)
      } else {
        toast({
          variant: "destructive",
          title: "Dispatch failed",
          description: (json as unknown as { message?: string })?.message || "Failed to dispatch message via Meta Graph API.",
        })
      }
    } catch (err) {
      console.error("Send live message error:", err)
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Could not dispatch message to Meta Graph API.",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  // Quick reply chip adder
  const handleAddQuickReply = () => {
    if (!newQrTitle.trim()) return
    const payload = newQrPayload.trim() || newQrTitle.trim().toUpperCase().replace(/\s+/g, "_")
    setQuickReplies((prev) => [...prev, { title: newQrTitle.trim(), payload }])
    setNewQrTitle("")
    setNewQrPayload("")
    setQrModalOpen(false)
  }

  const handleRemoveQuickReply = (index: number) => {
    setQuickReplies((prev) => prev.filter((_, i) => i !== index))
  }

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const name = c.customer?.name || c.senders?.[0]?.name || ""
    const snippet = c.snippet || ""
    return name.toLowerCase().includes(q) || snippet.toLowerCase().includes(q)
  })

  // Determine active thread PSID
  const activePsid = selectedThread
    ? selectedThread.customer?.id ||
      selectedThread.senders?.[0]?.id ||
      selectedThread.participants?.find((p) => p.id !== webhook?.pageId)?.id ||
      ""
    : ""

  const activeCustomerName = selectedThread
    ? selectedThread.customer?.name ||
      selectedThread.senders?.[0]?.name ||
      customerProfile?.name ||
      `Customer (${activePsid.slice(0, 6)}...)`
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-3.5 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Live Custom Messenger Suite
                </DialogTitle>
                <Badge className="bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Meta Graph API Live
                </Badge>
              </div>
              <DialogDescription className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>Webhook: {webhook?.name}</span>
                {webhook?.pageName && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-foreground">{webhook.pageName}</span>
                  </>
                )}
                {webhook?.pageId && (
                  <span className="font-mono text-[10px]">({webhook.pageId})</span>
                )}
              </DialogDescription>
            </div>
          </div>

          {/* Header Controls: Folder & Platform */}
          <div className="flex items-center gap-2">
            {/* Folder Select */}
            <select
              value={folder}
              onChange={(e) => {
                setFolder(e.target.value as LiveConversationFolder)
              }}
              className="text-xs h-7 bg-background border border-border rounded-md px-2 text-foreground font-medium"
            >
              <option value="inbox">Inbox</option>
              <option value="page_done">Done</option>
              <option value="other">Other</option>
              <option value="spam">Spam</option>
            </select>

            {/* Platform Select */}
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as LiveConversationPlatform)
              }}
              className="text-xs h-7 bg-background border border-border rounded-md px-2 text-foreground font-medium"
            >
              <option value="messenger">Messenger</option>
              <option value="instagram">Instagram</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              disabled={conversationsLoading}
              onClick={() => fetchConversations()}
              className="h-7 text-xs px-2 gap-1"
            >
              <RefreshCw className={cn("h-3 w-3", conversationsLoading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* ───────────────────────────────────────────────────────────────── */}
          {/* LEFT: Conversation Threads List Sidebar                           */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="w-80 md:w-88 border-r border-border flex flex-col bg-muted/10 shrink-0">
            {/* Search Filter */}
            <div className="p-2.5 border-b border-border bg-card">
              <Input
                placeholder="Filter live threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-7 bg-muted/30"
              />
            </div>

            {/* Thread Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {conversationsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Streaming from Meta Graph API...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground px-4 space-y-1">
                  <MessageSquare className="h-7 w-7 mx-auto opacity-30" />
                  <p className="text-xs font-semibold">No threads found</p>
                  <p className="text-[11px] text-muted-foreground">
                    No active conversations in {folder} folder for {platform}.
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = selectedThread?.id === c.id
                  const customerName =
                    c.customer?.name || c.senders?.[0]?.name || "Customer"
                  const initial = customerName.charAt(0).toUpperCase() || "C"

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedThread(c)}
                      className={cn(
                        "w-full text-left p-3 transition-colors flex items-start gap-2.5 hover:bg-muted/30",
                        isSelected && "bg-primary/10 border-l-2 border-primary"
                      )}
                    >
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {initial}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {customerName}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                            {new Date(c.updatedTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {c.snippet || "No text preview"}
                        </p>

                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[9px] text-muted-foreground font-mono opacity-70 truncate max-w-[140px]">
                            {c.id}
                          </span>
                          {c.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-4">
                              {c.unreadCount} new
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div className="p-2 border-t border-border bg-card flex items-center justify-between text-xs">
              <Button
                variant="ghost"
                size="sm"
                disabled={!paging.hasPrevious || conversationsLoading}
                onClick={() => fetchConversations({ before: paging.before || undefined })}
                className="h-7 px-2 text-xs gap-1"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>Prev</span>
              </Button>

              <span className="text-[10px] text-muted-foreground">
                {filteredConversations.length} conversation(s)
              </span>

              <Button
                variant="ghost"
                size="sm"
                disabled={!paging.hasNext || conversationsLoading}
                onClick={() => fetchConversations({ after: paging.after || undefined })}
                className="h-7 px-2 text-xs gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* MIDDLE: Active Thread Chat Stream & Actions                       */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col bg-background min-w-0">
            {selectedThread ? (
              <>
                {/* Active Thread Bar */}
                <div className="p-2.5 px-4 border-b border-border bg-card flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-xs shrink-0">
                      {activeCustomerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {activeCustomerName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                          PSID: {activePsid}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        Thread: {selectedThread.id}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Mark Seen Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={senderActionLoading}
                      onClick={() => handleSenderAction("mark_seen")}
                      title="Mark thread as read (mark_seen sender action)"
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Eye className="h-3 w-3 text-primary" />
                      <span className="hidden sm:inline">Mark Seen</span>
                    </Button>

                    {/* Typing Indicator Toggle */}
                    <Button
                      variant={typingActive ? "default" : "outline"}
                      size="sm"
                      disabled={senderActionLoading}
                      onClick={() => handleSenderAction(typingActive ? "typing_off" : "typing_on")}
                      title="Show typing bubble in customer's Messenger window"
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Radio className={cn("h-3 w-3", typingActive && "animate-pulse")} />
                      <span className="hidden sm:inline">
                        {typingActive ? "Typing..." : "Send Typing"}
                      </span>
                    </Button>

                    {/* Toggle Profile Drawer */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfileDrawerOpen((prev) => !prev)}
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>

                    {/* Meta Thread Direct Link */}
                    {selectedThread.link && (
                      <a
                        href={selectedThread.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-primary transition-colors"
                        title="Open directly in Facebook Messages"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Messages Stream View */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs">Loading live messages from Meta...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground space-y-2">
                      <MessageSquare className="h-8 w-8 mx-auto opacity-30" />
                      <p className="text-xs font-semibold">No messages in this thread</p>
                      <p className="text-[11px] max-w-xs mx-auto">
                        Messages sent by the customer or dispatched by your page will appear here live.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isPage = msg.isFromPage
                      const senderName = isPage
                        ? webhook?.pageName || "Woombat Coffee Roasters (Page)"
                        : activeCustomerName

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[80%] text-xs",
                            isPage ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          {/* Bubble Metadata */}
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-muted-foreground">
                            <span className="font-semibold">{senderName}</span>
                            <span>•</span>
                            <span>
                              {new Date(msg.createdTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="font-mono opacity-50 truncate max-w-[80px]" title={msg.id}>
                              [{msg.id.split(".").pop()}]
                            </span>
                          </div>

                          {/* Message Bubble Content */}
                          <div
                            className={cn(
                              "p-3 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap",
                              isPage
                                ? "bg-primary text-primary-foreground rounded-tr-xs"
                                : "bg-muted/80 text-foreground border border-border rounded-tl-xs"
                            )}
                          >
                            {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                            {/* Attachments rendering */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att, idx) => {
                                  const imgUrl = att.imageData?.url || att.fileUrl

                                  if (att.mimeType?.startsWith("image/") && imgUrl) {
                                    return (
                                      <div key={idx} className="rounded-lg overflow-hidden border border-border/40">
                                        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                                          <img
                                            src={att.imageData?.previewUrl || imgUrl}
                                            alt={att.name || "Attachment"}
                                            className="max-h-56 max-w-full rounded-md object-cover hover:opacity-90 transition-opacity"
                                          />
                                        </a>
                                        {att.imageData?.maxWidth && (
                                          <p className="text-[9px] opacity-70 p-1 font-mono">
                                            {att.imageData.maxWidth} × {att.imageData.maxHeight}
                                            {att.size ? ` • ${Math.round(att.size / 1024)} KB` : ""}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  }

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/40 text-[11px]"
                                    >
                                      <FileText className="h-4 w-4 text-primary shrink-0" />
                                      <div className="min-w-0 flex-1 truncate">
                                        <p className="font-semibold truncate">{att.name || "File Attachment"}</p>
                                        <p className="text-[10px] opacity-70">
                                          {att.mimeType || "media"}
                                          {att.size ? ` • ${Math.round(att.size / 1024)} KB` : ""}
                                        </p>
                                      </div>
                                      {att.fileUrl && (
                                        <a
                                          href={att.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline text-[10px] shrink-0 font-medium"
                                        >
                                          Download
                                        </a>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}

                  {/* Typing Indicator Live Bubble */}
                  {typingActive && (
                    <div className="flex flex-col items-end mr-1 space-y-1">
                      <div className="bg-primary/20 text-primary border border-primary/30 p-2 px-3 rounded-2xl rounded-tr-xs text-[11px] flex items-center gap-1.5 animate-pulse">
                        <Radio className="h-3 w-3" />
                        <span>Sending typing indicator on Messenger...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Live Outbound Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-border bg-card space-y-2 shrink-0"
                >
                  {/* Mode Selector & Quick Replies Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md border border-border text-xs">
                      <button
                        type="button"
                        onClick={() => setComposerMode("text")}
                        className={cn(
                          "px-2 py-0.5 rounded font-medium text-[11px] transition-colors",
                          composerMode === "text"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Text Message
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposerMode("attachment")}
                        className={cn(
                          "px-2 py-0.5 rounded font-medium text-[11px] transition-colors",
                          composerMode === "attachment"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Media Attachment
                      </button>
                    </div>

                    {/* Quick Replies Controls */}
                    {composerMode === "text" && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQrModalOpen(true)}
                          className="h-6 text-[11px] px-2 gap-1 text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Quick Reply Chip</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Active Quick Replies Chips */}
                  {composerMode === "text" && quickReplies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                        Chips:
                      </span>
                      {quickReplies.map((qr, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-[10px] py-0 px-2 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20"
                        >
                          <span>{qr.title}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickReply(index)}
                            className="hover:text-destructive"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Text Composer Inputs */}
                  {composerMode === "text" ? (
                    <div className="space-y-1">
                      <div className="flex items-end gap-2">
                        <Textarea
                          placeholder="Type a live message to dispatch directly via Meta Graph API Send endpoint..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          disabled={sendingMessage}
                          className="text-xs min-h-[50px] max-h-[100px] bg-background resize-none flex-1 leading-relaxed"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage(e)
                            }
                          }}
                        />
                        <Button
                          type="submit"
                          disabled={sendingMessage || !messageText.trim()}
                          className="h-12 px-4 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                        >
                          {sendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span>Send</span>
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                        <span>Press Enter to send, Shift+Enter for new line</span>
                        <span
                          className={cn(
                            messageText.length > 1900 ? "text-amber-500 font-semibold" : ""
                          )}
                        >
                          {messageText.length} chars (chunks sent automatically &gt; 1900 chars)
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Attachment Composer Inputs */
                    <div className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground">
                            Attachment Type
                          </label>
                          <select
                            value={attachmentType}
                            onChange={(e) =>
                              setAttachmentType(e.target.value as LiveAttachmentType)
                            }
                            className="w-full text-xs h-8 bg-background border border-border rounded-md px-2 mt-0.5 text-foreground"
                          >
                            <option value="image">Image (jpg, png, gif)</option>
                            <option value="audio">Audio (mp3, wav)</option>
                            <option value="video">Video (mp4)</option>
                            <option value="file">File (pdf, zip)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-medium text-muted-foreground">
                            Public HTTPS Media URL
                          </label>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Input
                              placeholder="https://images.unsplash.com/photo-..."
                              value={attachmentUrl}
                              onChange={(e) => setAttachmentUrl(e.target.value)}
                              disabled={sendingMessage}
                              className="text-xs h-8 bg-background"
                            />
                            <Button
                              type="submit"
                              disabled={sendingMessage || !attachmentUrl.trim()}
                              className="h-8 px-3 text-xs gap-1.5 bg-primary text-primary-foreground shrink-0"
                            >
                              {sendingMessage ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Paperclip className="h-3 w-3" />
                              )}
                              <span>Send Media</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </>
            ) : (
              /* Empty State (No thread selected) */
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Select a Live Conversation</h3>
                <p className="text-xs max-w-sm">
                  Choose a live customer thread from the inbox on the left to read messages, view media attachments, and send live replies in real time.
                </p>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* RIGHT: Customer Meta Profile & Details Drawer                     */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {profileDrawerOpen && selectedThread && (
            <div className="w-72 border-l border-border bg-card p-4 space-y-4 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Customer Profile</span>
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileDrawerOpen(false)}
                  className="h-6 w-6 p-0 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {profileLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs">Fetching profile...</span>
                </div>
              ) : customerProfile ? (
                <div className="space-y-3.5">
                  {/* Avatar & Name */}
                  <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
                    {customerProfile.profilePic ? (
                      <img
                        src={customerProfile.profilePic}
                        alt={customerProfile.name}
                        className="h-16 w-16 rounded-full border-2 border-primary/30 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xl">
                        {customerProfile.name.charAt(0)}
                      </div>
                    )}
                    <h5 className="font-bold text-sm text-foreground">{customerProfile.name}</h5>
                    {customerProfile.firstName && (
                      <p className="text-[11px] text-muted-foreground">
                        {customerProfile.firstName} {customerProfile.lastName}
                      </p>
                    )}
                  </div>

                  {/* Meta Profile Fields */}
                  <div className="space-y-2 rounded-lg bg-muted/20 border border-border p-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        Page-Scoped ID (PSID):
                      </span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="font-mono text-[11px] truncate">{customerProfile.id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(customerProfile.id, "psid-drawer")}
                          className="h-5 w-5 p-0"
                        >
                          {copiedKey === "psid-drawer" ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {customerProfile.locale && (
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Locale:
                        </span>
                        <span className="font-semibold text-foreground">{customerProfile.locale}</span>
                      </div>
                    )}

                    {customerProfile.timezone !== undefined && (
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Timezone:
                        </span>
                        <span className="font-semibold text-foreground">
                          UTC {customerProfile.timezone >= 0 ? `+${customerProfile.timezone}` : customerProfile.timezone}
                        </span>
                      </div>
                    )}

                    {customerProfile.gender && (
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Gender:
                        </span>
                        <span className="capitalize font-semibold text-foreground">
                          {customerProfile.gender}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thread Summary */}
                  <div className="space-y-1 rounded-lg bg-muted/20 border border-border p-3 text-xs">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                      Thread Metadata
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Message Count:</span>
                      <span className="font-semibold">{selectedThread.messageCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Unread:</span>
                      <span className="font-semibold">{selectedThread.unreadCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Participants:</span>
                      <span className="font-semibold">{selectedThread.participants.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground space-y-1">
                  <p className="text-xs font-semibold">No profile data</p>
                  <p className="text-[11px]">Could not retrieve profile for PSID: {activePsid}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Quick Reply Builder Dialog */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm p-4 border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Add Quick Reply Chip
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Quick replies appear as tappable button chips to the customer on Facebook Messenger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Chip Title (e.g., &quot;Coffee Menu&quot;)
              </label>
              <Input
                placeholder="e.g. Coffee Menu"
                value={newQrTitle}
                onChange={(e) => setNewQrTitle(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Payload (Optional, defaults to uppercase title)
              </label>
              <Input
                placeholder="e.g. SHOW_MENU"
                value={newQrPayload}
                onChange={(e) => setNewQrPayload(e.target.value)}
                className="text-xs h-8 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newQrTitle.trim()}
              onClick={handleAddQuickReply}
              className="h-8 text-xs bg-primary text-primary-foreground"
            >
              Add Chip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

