"use client"

import { useState, useEffect, useCallback, useRef, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  MessageSquareDashed,
  MousePointerClick,
  PanelRight,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  X,
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

const FOLDERS: { value: LiveConversationFolder; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "page_done", label: "Done" },
  { value: "other", label: "Other" },
  { value: "spam", label: "Spam" },
]

const PLATFORMS: { value: LiveConversationPlatform; label: string }[] = [
  { value: "messenger", label: "Messenger" },
  { value: "instagram", label: "Instagram" },
]

const DAY = 864e5
const HOUR = 36e5

const apiMessage = (json: unknown) => (json as { message?: string } | null)?.message

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

const listTime = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  if (sameDay(d, now)) return timeOnly(iso)
  if (sameDay(d, new Date(+now - DAY))) return "Yesterday"
  if (+now - +d < 6 * DAY) return d.toLocaleDateString([], { weekday: "short" })
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  if (sameDay(d, now)) return "Today"
  if (sameDay(d, new Date(+now - DAY))) return "Yesterday"
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?"

// A stable tint per customer makes the list scannable without photos.
const TINTS = [
  "bg-brand-soft text-brand-ink",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
  "bg-pop-soft text-pop",
  "bg-warning-soft text-warning",
]
const tintOf = (key: string) => TINTS[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]

/** Messenger only allows normal replies for 24h after the customer's last message. */
const replyWindowLeft = (messages: LiveMessage[], now: number) => {
  const last = [...messages].reverse().find((m) => !m.isFromPage)
  return last ? +new Date(last.createdTime) + DAY - now : null
}

const formatLeft = (ms: number) =>
  ms >= HOUR ? `${Math.floor(ms / HOUR)}h left to reply` : `${Math.max(1, Math.ceil(ms / 6e4))}m left to reply`

function Person({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return (
    <Avatar className={cn("size-9", className)}>
      {src && <AvatarImage src={src} alt="" className="object-cover" />}
      <AvatarFallback className={cn("text-xs font-semibold", tintOf(name))}>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  )
}

/** Full-height Messenger inbox for one connected page. */
export function MessengerInbox({ webhook }: { webhook: MessengerWebhook }) {
  const [folder, setFolder] = useState<LiveConversationFolder>("inbox")
  const [platform, setPlatform] = useState<LiveConversationPlatform>("messenger")
  const [searchQuery, setSearchQuery] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(false)

  const [conversations, setConversations] = useState<LiveConversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [paging, setPaging] = useState<{ before?: string | null; after?: string | null; hasNext?: boolean; hasPrevious?: boolean }>({})

  const [selectedThread, setSelectedThread] = useState<LiveConversation | null>(null)
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [customerProfile, setCustomerProfile] = useState<LiveCustomerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(true)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)

  const [composerMode, setComposerMode] = useState<"text" | "attachment">("text")
  const [messageText, setMessageText] = useState("")
  const [quickReplies, setQuickReplies] = useState<LiveQuickReply[]>([])
  const [qrOpen, setQrOpen] = useState(false)
  const [newQrTitle, setNewQrTitle] = useState("")
  const [newQrPayload, setNewQrPayload] = useState("")
  const [attachmentType, setAttachmentType] = useState<LiveAttachmentType>("image")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [attachmentReusable, setAttachmentReusable] = useState(true)

  const [sendingMessage, setSendingMessage] = useState(false)
  const [senderActionLoading, setSenderActionLoading] = useState(false)
  const [typingActive, setTypingActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const threadRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const psidOf = useCallback(
    (thread: LiveConversation | null) =>
      thread?.customer?.id || thread?.senders?.[0]?.id || thread?.participants?.find((p) => p.id !== webhook.pageId)?.id || "",
    [webhook.pageId]
  )

  const fetchConversations = useCallback(
    async (cursor?: { before?: string; after?: string }) => {
      try {
        setConversationsLoading(true)
        const params = new URLSearchParams({ limit: "25", folder, platform })
        if (cursor?.after) params.set("after", cursor.after)
        if (cursor?.before) params.set("before", cursor.before)
        const res = await fetch(`/api/v1/messenger/webhooks/${webhook.id}/live/conversations?${params.toString()}`)
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
          toast({ variant: "destructive", title: "Couldn’t load conversations", description: apiMessage(json) || "Facebook didn’t return this page’s chats. Try syncing the page." })
        }
      } catch {
        toast({ variant: "destructive", title: "Couldn’t load conversations", description: "Check your connection and refresh." })
      } finally {
        setConversationsLoading(false)
      }
    },
    [webhook.id, folder, platform]
  )

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        setMessagesLoading(true)
        const res = await fetch(
          `/api/v1/messenger/webhooks/${webhook.id}/live/conversations/${encodeURIComponent(conversationId)}/messages?limit=50`
        )
        const json: LiveMessagesResponse = await res.json()
        if (res.ok && json.data) {
          // Graph returns newest first; show oldest at the top.
          setMessages([...(json.data.messages || [])].sort((a, b) => +new Date(a.createdTime) - +new Date(b.createdTime)))
        } else {
          toast({ variant: "destructive", title: "Couldn’t load messages", description: apiMessage(json) || "Try opening the chat again." })
        }
      } catch {
        toast({ variant: "destructive", title: "Couldn’t load messages", description: "Check your connection and try again." })
      } finally {
        setMessagesLoading(false)
      }
    },
    [webhook.id]
  )

  const fetchCustomerProfile = useCallback(
    async (psid: string) => {
      try {
        setProfileLoading(true)
        const res = await fetch(`/api/v1/messenger/webhooks/${webhook.id}/live/profiles/${encodeURIComponent(psid)}`)
        const json: LiveCustomerProfileResponse = await res.json()
        setCustomerProfile(res.ok && json.data ? json.data : null)
      } catch {
        setCustomerProfile(null)
      } finally {
        setProfileLoading(false)
      }
    },
    [webhook.id]
  )

  useEffect(() => {
    void fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!selectedThread) return
    void fetchMessages(selectedThread.id)
    const psid = psidOf(selectedThread)
    if (psid) void fetchCustomerProfile(psid)
  }, [selectedThread, fetchMessages, fetchCustomerProfile, psidOf])

  useEffect(() => {
    // Scroll only the thread; scrollIntoView would also scroll the page around it.
    const el = threadRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, typingActive])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const activePsid = psidOf(selectedThread)
  const activeName =
    selectedThread?.customer?.name || selectedThread?.senders?.[0]?.name || customerProfile?.name || (activePsid ? `Customer …${activePsid.slice(-4)}` : "")
  const pageName = webhook.pageName || webhook.name
  const windowLeft = replyWindowLeft(messages, now)

  const handleSenderAction = async (action: "typing_on" | "typing_off" | "mark_seen") => {
    if (!activePsid) return
    try {
      setSenderActionLoading(true)
      const res = await fetch(`/api/v1/messenger/webhooks/${webhook.id}/live/sender-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activePsid, action }),
      })
      const json: SendLiveSenderActionResponse = await res.json()
      if (res.ok && json.data?.success) {
        if (action === "typing_on") {
          setTypingActive(true)
          // Messenger hides the bubble after ~20s anyway.
          setTimeout(() => setTypingActive(false), 15000)
        } else if (action === "typing_off") {
          setTypingActive(false)
        } else {
          toast({ variant: "success", title: "Marked as seen", description: `${activeName} sees that you read the chat.` })
        }
      } else {
        toast({ variant: "destructive", title: "Couldn’t update the chat", description: apiMessage(json) || "Try again in a moment." })
      }
    } catch {
      toast({ variant: "destructive", title: "Couldn’t update the chat", description: "Check your connection and try again." })
    } finally {
      setSenderActionLoading(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!selectedThread || !activePsid) return
    if (composerMode === "text" && !messageText.trim()) return
    if (composerMode === "attachment" && !attachmentUrl.trim()) return

    try {
      setSendingMessage(true)
      const payload: Record<string, unknown> = { recipientId: activePsid }
      if (composerMode === "text") {
        payload.text = messageText.trim()
        if (quickReplies.length > 0) payload.quickReplies = quickReplies
      } else {
        payload.attachment = { type: attachmentType, url: attachmentUrl.trim(), isReusable: attachmentReusable }
      }
      const res = await fetch(`/api/v1/messenger/webhooks/${webhook.id}/live/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json: SendLiveMessageResponse = await res.json()
      if (res.ok && json.data) {
        setMessageText("")
        setQuickReplies([])
        setAttachmentUrl("")
        setComposerMode("text")
        setTypingActive(false)
        void fetchMessages(selectedThread.id)
      } else {
        toast({ variant: "destructive", title: "Message not sent", description: apiMessage(json) || "Facebook didn’t accept it. Messenger only allows replies within 24 hours of the customer’s last message." })
      }
    } catch {
      toast({ variant: "destructive", title: "Message not sent", description: "Check your connection. Your text is still in the box." })
    } finally {
      setSendingMessage(false)
    }
  }

  const addQuickReply = () => {
    if (!newQrTitle.trim()) return
    const payload = newQrPayload.trim() || newQrTitle.trim().toUpperCase().replace(/\s+/g, "_")
    setQuickReplies((prev) => [...prev, { title: newQrTitle.trim(), payload }])
    setNewQrTitle("")
    setNewQrPayload("")
    setQrOpen(false)
    composerRef.current?.focus()
  }

  const copyPsid = () => {
    if (!activePsid) return
    navigator.clipboard.writeText(activePsid)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const toggleDetails = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setProfileOpen((o) => !o)
    else setProfileSheetOpen(true)
  }

  const q = searchQuery.trim().toLowerCase()
  const filtered = conversations.filter(
    (c) =>
      (!unreadOnly || c.unreadCount > 0) &&
      (!q || `${c.customer?.name || c.senders?.[0]?.name || ""} ${c.snippet || ""}`.toLowerCase().includes(q))
  )
  const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length
  const canSend = composerMode === "text" ? !!messageText.trim() : !!attachmentUrl.trim()

  const details = selectedThread && (
    <CustomerDetails
      name={customerProfile?.name || activeName}
      profile={customerProfile}
      loading={profileLoading}
      thread={selectedThread}
      psid={activePsid}
      copied={copied}
      onCopy={copyPsid}
      typingActive={typingActive}
      typingBusy={senderActionLoading}
      onToggleTyping={() => handleSenderAction(typingActive ? "typing_off" : "typing_on")}
    />
  )

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      {/* ── Conversation list ── */}
      <section
        aria-label="Conversations"
        className={cn("flex w-full shrink-0 flex-col border-r bg-card md:w-[22rem]", selectedThread && "hidden md:flex")}
      >
        <header className="space-y-3 px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <Person name={pageName} src={webhook.pagePictureUrl} className="size-10 rounded-xl [&>*]:rounded-xl" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl leading-tight">{pageName}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", webhook.isActive ? "bg-success" : "bg-warning")} />
                {webhook.isActive ? "Chippy is replying for you" : "Paused, Chippy won’t reply"}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => fetchConversations()} disabled={conversationsLoading} aria-label="Refresh chats">
              <RefreshCw className={cn(conversationsLoading && "animate-spin")} />
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or message"
              className="h-9 rounded-lg border-transparent bg-secondary pl-8.5 text-sm shadow-none focus-visible:bg-card"
              aria-label="Search chats"
            />
          </div>

          <div role="tablist" aria-label="Folder" className="grid grid-cols-4 gap-0.5 rounded-lg bg-secondary p-0.5">
            {FOLDERS.map((f) => (
              <button
                key={f.value}
                role="tab"
                aria-selected={folder === f.value}
                onClick={() => setFolder(f.value)}
                className={cn(
                  "rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                  folder === f.value && "bg-card text-foreground shadow-xs"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((p) => (
              <Chip key={p.value} pressed={platform === p.value} onClick={() => setPlatform(p.value)}>
                {p.label}
              </Chip>
            ))}
            <span className="mx-0.5 h-4 w-px bg-border" />
            <Chip pressed={unreadOnly} onClick={() => setUnreadOnly((u) => !u)}>
              Unread{unreadTotal > 0 && <span className="tabular-nums opacity-70">{unreadTotal}</span>}
            </Chip>
          </div>
        </header>

        {!webhook.isActive && (
          <p className="mx-4 mb-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
            Chippy isn’t answering this page. Turn it back on from Facebook pages to resume auto-replies.
          </p>
        )}

        <ul className="custom-scrollbar flex-1 overflow-y-auto border-t px-2 py-2">
          {conversationsLoading && conversations.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <li key={i} className="flex gap-3 px-2 py-2.5" aria-hidden>
                <span className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
                <span className="flex-1 space-y-2 py-1">
                  <span className="block h-2.5 w-2/5 animate-pulse rounded bg-muted" />
                  <span className="block h-2.5 w-4/5 animate-pulse rounded bg-muted" />
                </span>
              </li>
            ))
          ) : filtered.length === 0 ? (
            <li className="px-6 py-16 text-center">
              <Inbox className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                {q ? "No chats match your search" : unreadOnly ? "You’re all caught up" : `Nothing in ${FOLDERS.find((f) => f.value === folder)?.label}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {q ? "Try a different name or word." : unreadOnly ? "Every chat here has been read." : "New Messenger chats for this page show up here."}
              </p>
              {(q || unreadOnly) && (
                <Button variant="link" size="sm" className="mt-2" onClick={() => { setSearchQuery(""); setUnreadOnly(false) }}>
                  Show all chats
                </Button>
              )}
            </li>
          ) : (
            filtered.map((c) => {
              const name = c.customer?.name || c.senders?.[0]?.name || "Customer"
              const active = selectedThread?.id === c.id
              const unread = c.unreadCount > 0
              return (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      if (c.id === selectedThread?.id) return
                      setMessages([]) // don't flash the previous customer's chat
                      setCustomerProfile(null)
                      setSelectedThread(c)
                    }}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted",
                      active && "bg-secondary hover:bg-secondary"
                    )}
                  >
                    <span className="relative shrink-0">
                      <Person name={name} className="size-10" />
                      {unread && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-card bg-brand" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{name}</span>
                        <span className={cn("shrink-0 text-2xs tabular-nums", unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                          {listTime(c.updatedTime)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>{c.snippet || "Sent an attachment"}</span>
                        {unread && (
                          <span className="ml-auto grid h-4.5 min-w-4.5 shrink-0 place-items-center rounded-full bg-ink px-1.5 text-2xs font-semibold tabular-nums text-white">
                            {c.unreadCount}
                            <span className="sr-only"> unread</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {(paging.hasPrevious || paging.hasNext) && (
          <div className="flex items-center justify-between border-t px-2 py-1.5">
            <Button variant="ghost" size="sm" disabled={!paging.hasPrevious || conversationsLoading} onClick={() => fetchConversations({ before: paging.before || undefined })}>
              <ChevronLeft className="size-3.5" />Newer
            </Button>
            <Button variant="ghost" size="sm" disabled={!paging.hasNext || conversationsLoading} onClick={() => fetchConversations({ after: paging.after || undefined })}>
              Older<ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </section>

      {/* ── Thread ── */}
      <section aria-label="Conversation" className={cn("flex min-w-0 flex-1 flex-col bg-muted", !selectedThread && "hidden md:flex")}>
        {!selectedThread ? (
          <div className="m-auto max-w-[34ch] p-6 text-center">
            <span className="mx-auto grid size-14 rotate-[-6deg] place-items-center rounded-2xl bg-brand shadow-sm">
              <MessageSquareDashed className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl">Pick a chat</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {unreadTotal > 0
                ? `${unreadTotal} ${unreadTotal === 1 ? "customer is" : "customers are"} waiting on a reply. Open a chat to read it and step in.`
                : "Chippy handles the chats. Open one to read along or reply yourself."}
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2.5 border-b bg-card px-3 py-2.5 sm:px-5">
              <Button variant="ghost" size="icon-sm" className="-ml-1 md:hidden" onClick={() => setSelectedThread(null)} aria-label="Back to chats">
                <ArrowLeft />
              </Button>
              <Person name={activeName} src={customerProfile?.profilePic} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{activeName}</p>
                <ReplyWindow left={windowLeft} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleSenderAction("mark_seen")} disabled={senderActionLoading} aria-label="Mark as seen">
                <CheckCheck className="size-4" /><span className="hidden sm:inline">Mark seen</span>
              </Button>
              {selectedThread.link && (
                <Button asChild variant="ghost" size="icon-sm" aria-label="Open in Facebook" title="Open in Facebook">
                  <a href={selectedThread.link} target="_blank" rel="noopener noreferrer"><ExternalLink /></a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:aria-pressed:bg-secondary lg:aria-pressed:text-foreground"
                onClick={toggleDetails}
                aria-label="Customer details"
                title="Customer details"
                aria-pressed={profileOpen}
              >
                <PanelRight />
              </Button>
            </header>

            <div ref={threadRef} className="custom-scrollbar flex flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-5 sm:px-8" aria-live="polite">
              {messagesLoading && messages.length === 0 ? (
                <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading chat
                </div>
              ) : messages.length === 0 ? (
                <p className="m-auto text-sm text-muted-foreground">No messages in this chat yet.</p>
              ) : (
                <div className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-0.5">
                  {messages.map((msg, i) => {
                    const mine = msg.isFromPage
                    const prev = messages[i - 1]
                    const next = messages[i + 1]
                    const newDay = !prev || !sameDay(new Date(prev.createdTime), new Date(msg.createdTime))
                    const first = newDay || prev?.isFromPage !== mine
                    const last = !next || next.isFromPage !== mine || !sameDay(new Date(next.createdTime), new Date(msg.createdTime))
                    return (
                      <Fragment key={msg.id}>
                        {newDay && (
                          <div className="my-4 flex items-center gap-3 text-2xs font-medium text-muted-foreground" role="separator">
                            <span className="h-px flex-1 bg-border" />
                            {dayLabel(msg.createdTime)}
                            <span className="h-px flex-1 bg-border" />
                          </div>
                        )}
                        <div className={cn("flex max-w-[min(78%,36rem)] flex-col", mine ? "ml-auto items-end" : "items-start", first && !newDay && "mt-3")}>
                          {(msg.text || !msg.attachments?.length) && (
                            <p
                              title={new Date(msg.createdTime).toLocaleString()}
                              className={cn(
                                "whitespace-pre-wrap break-words rounded-[1.125rem] px-3.5 py-2 text-base leading-snug",
                                mine ? "bg-ink text-white" : "bg-card shadow-xs ring-1 ring-border",
                                mine ? !first && "rounded-tr-md" : !first && "rounded-tl-md",
                                mine ? !last && "rounded-br-md" : !last && "rounded-bl-md"
                              )}
                            >
                              {msg.text || <span className="italic opacity-60">Unsupported message</span>}
                            </p>
                          )}
                          {msg.attachments?.map((att, idx) => <AttachmentView key={idx} att={att} />)}
                          {last && (
                            <span className="mt-1 px-1 text-2xs tabular-nums text-muted-foreground">
                              {mine ? `${pageName} · ` : ""}{timeOnly(msg.createdTime)}
                            </span>
                          )}
                        </div>
                      </Fragment>
                    )
                  })}
                  {typingActive && (
                    <p className="typing ml-auto mt-3 flex w-fit gap-1 rounded-[1.125rem] bg-ink px-3.5 py-3" aria-label="Customer sees you typing">
                      <span className="size-1.5 rounded-full bg-white" /><span className="size-1.5 rounded-full bg-white" /><span className="size-1.5 rounded-full bg-white" />
                    </p>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="px-3 pb-3 sm:px-8 sm:pb-5">
              <div className="mx-auto max-w-3xl">
                {windowLeft !== null && windowLeft <= 0 && (
                  <p className="mb-2 flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-xs text-destructive">
                    <Clock className="mt-px size-3.5 shrink-0" />
                    It’s been over 24 hours since {activeName.split(" ")[0]} last wrote. Facebook may block this reply until they message again.
                  </p>
                )}

                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow focus-within:border-foreground/40 focus-within:ring-[3px] focus-within:ring-brand/50">
                  {quickReplies.length > 0 && composerMode === "text" && (
                    <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/60 px-3 py-2">
                      <span className="text-2xs text-muted-foreground">Tap buttons:</span>
                      {quickReplies.map((qr, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-card py-0.5 pl-2.5 pr-0.5 text-xs font-medium">
                          {qr.title}
                          <button type="button" onClick={() => setQuickReplies((p) => p.filter((_, j) => j !== idx))} aria-label={`Remove ${qr.title}`} className="grid size-4.5 place-items-center rounded-full hover:bg-secondary">
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {qrOpen && composerMode === "text" && (
                    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/60 p-2">
                      <Input
                        autoFocus
                        value={newQrTitle}
                        onChange={(e) => setNewQrTitle(e.target.value)}
                        placeholder="Button text, e.g. Order now"
                        className="h-8 min-w-40 flex-1 bg-card text-sm"
                        maxLength={20}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addQuickReply() }
                          if (e.key === "Escape") setQrOpen(false)
                        }}
                        aria-label="Button text"
                      />
                      <Input value={newQrPayload} onChange={(e) => setNewQrPayload(e.target.value)} placeholder="Code (optional)" className="h-8 w-36 bg-card font-mono text-xs" aria-label="Button code" />
                      <Button type="button" size="sm" onClick={addQuickReply} disabled={!newQrTitle.trim()}>Add button</Button>
                      <Button type="button" size="icon-sm" variant="ghost" onClick={() => setQrOpen(false)} aria-label="Cancel"><X /></Button>
                    </div>
                  )}

                  {composerMode === "text" ? (
                    <Textarea
                      ref={composerRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          void handleSendMessage()
                        }
                      }}
                      onFocus={() => !typingActive && handleSenderAction("typing_on")}
                      placeholder={`Message ${activeName}`}
                      rows={2}
                      aria-label="Message"
                      className="max-h-48 min-h-0 resize-none border-0 bg-transparent px-4 pt-3 text-base shadow-none focus-visible:ring-0"
                    />
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
                      <NativeSelect value={attachmentType} onChange={(e) => setAttachmentType(e.target.value as LiveAttachmentType)} className="w-28" aria-label="File type">
                        <option value="image">Photo</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="file">File</option>
                      </NativeSelect>
                      <Input autoFocus type="url" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="Paste a link to the file (https://…)" className="min-w-48 flex-1" aria-label="File link" />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={attachmentReusable} onCheckedChange={setAttachmentReusable} />
                        Save for reuse
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-1 px-2 py-2">
                    <Button
                      type="button"
                      variant={composerMode === "attachment" ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => setComposerMode((m) => (m === "text" ? "attachment" : "text"))}
                      aria-label={composerMode === "attachment" ? "Back to text message" : "Send a file"}
                      title={composerMode === "attachment" ? "Back to text message" : "Send a file"}
                      aria-pressed={composerMode === "attachment"}
                    >
                      <Paperclip />
                    </Button>
                    {composerMode === "text" && (
                      <Button type="button" variant={qrOpen ? "secondary" : "ghost"} size="sm" onClick={() => setQrOpen((o) => !o)} aria-pressed={qrOpen}>
                        <MousePointerClick className="size-3.5" />Add button
                      </Button>
                    )}
                    <span className="ml-auto hidden text-2xs text-muted-foreground md:inline">
                      {composerMode === "text" ? "Enter to send, Shift + Enter for a new line" : "Customers see the file right in Messenger"}
                    </span>
                    <Button type="submit" size="sm" className="ml-2 rounded-lg px-3" disabled={sendingMessage || !canSend}>
                      {sendingMessage ? <Loader2 className="animate-spin" /> : <Send className="size-3.5" />}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
      </section>

      {/* ── Customer ── */}
      {selectedThread && profileOpen && (
        <aside aria-label="Customer details" className="hidden w-72 shrink-0 flex-col border-l bg-card lg:flex">
          {details}
        </aside>
      )}
      <Sheet open={profileSheetOpen && !!selectedThread} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="right" title="Customer details" className="flex w-80 flex-col p-0 lg:hidden">
          {details}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
        pressed ? "border-ink bg-ink text-white" : "border-border text-muted-foreground hover:border-input hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function ReplyWindow({ left }: { left: number | null }) {
  if (left === null) return <p className="text-2xs text-muted-foreground">Messenger</p>
  const tone = left <= 0 ? "text-destructive" : left < 2 * HOUR ? "text-warning" : "text-success"
  return (
    <p className={cn("flex items-center gap-1 text-2xs font-medium", tone)} title="Messenger lets you reply for 24 hours after the customer’s last message.">
      <Clock className="size-3" />
      {left <= 0 ? "Reply window closed" : formatLeft(left)}
    </p>
  )
}

function AttachmentView({ att }: { att: NonNullable<LiveMessage["attachments"]>[number] }) {
  const imgUrl = att.imageData?.url || (att.mimeType?.startsWith("image/") ? att.fileUrl : undefined)
  if (imgUrl) {
    return (
      <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block overflow-hidden rounded-2xl ring-1 ring-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={att.imageData?.previewUrl || imgUrl} alt={att.name || "Photo from chat"} className="max-h-72 max-w-full object-cover" />
      </a>
    )
  }
  if (att.videoData?.url) {
    return <video src={att.videoData.url} poster={att.videoData.previewUrl} controls className="mt-1 max-h-72 max-w-full rounded-2xl ring-1 ring-border" />
  }
  return (
    <a
      href={att.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2.5 rounded-2xl bg-card px-3 py-2.5 text-sm shadow-xs ring-1 ring-border hover:ring-input"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary"><FileText className="size-4" /></span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{att.name || "File"}</span>
        <span className="block text-2xs text-muted-foreground">{att.mimeType || "Attachment"}{att.size ? `, ${Math.round(att.size / 1024)} KB` : ""}</span>
      </span>
    </a>
  )
}

function CustomerDetails({
  name,
  profile,
  loading,
  thread,
  psid,
  copied,
  onCopy,
  typingActive,
  typingBusy,
  onToggleTyping,
}: {
  name: string
  profile: LiveCustomerProfile | null
  loading: boolean
  thread: LiveConversation
  psid: string
  copied: boolean
  onCopy: () => void
  typingActive: boolean
  typingBusy: boolean
  onToggleTyping: () => void
}) {
  return (
    <>
      <div className="flex flex-col items-center px-5 pb-5 pt-8 text-center">
        <Person name={name} src={profile?.profilePic} className="size-20 text-xl [&>span]:text-xl" />
        <h2 className="mt-3 text-lg leading-tight">{name}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"} so far
        </p>
        {loading && <Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" />}
      </div>

      <dl className="mx-4 divide-y rounded-xl border text-sm">
        {profile?.locale && <Row label="Language">{profile.locale.replace("_", "-")}</Row>}
        {profile?.gender && <Row label="Gender"><span className="capitalize">{profile.gender}</span></Row>}
        {profile?.timezone !== undefined && <Row label="Time zone">UTC{profile.timezone >= 0 ? "+" : ""}{profile.timezone}</Row>}
        <Row label="Unread">{thread.unreadCount}</Row>
        <Row label="Last active">{listTime(thread.updatedTime)}</Row>
      </dl>

      {!profile && !loading && (
        <p className="mx-4 mt-3 text-xs text-muted-foreground">Facebook didn’t share more details for this customer.</p>
      )}

      <div className="mx-4 mt-4">
        <p className="text-xs text-muted-foreground">Customer ID</p>
        <div className="mt-1 flex items-center gap-1 rounded-lg bg-muted py-0.5 pl-2.5 pr-0.5">
          <code className="min-w-0 flex-1 truncate font-mono text-2xs">{psid}</code>
          <Button variant="ghost" size="icon-sm" onClick={onCopy} aria-label="Copy customer ID">{copied ? <Check /> : <Copy />}</Button>
        </div>
      </div>

      <div className="mt-auto border-t p-4">
        <Button variant="outline" size="sm" className="w-full" onClick={onToggleTyping} disabled={typingBusy}>
          {typingActive ? "Hide typing bubble" : "Show typing bubble"}
        </Button>
        <p className="mt-2 text-center text-2xs text-muted-foreground">Lets the customer know someone is replying.</p>
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{children}</dd>
    </div>
  )
}
