"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/stores/userStore"
import { useEntitlements } from "@/hooks/use-entitlements"
import { usePermissions } from "@/hooks/use-permissions"
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Globe,
  Loader2,
  Package,
  Plus,
  Users,
} from "lucide-react"

// Message interfaces
interface Message {
  id: string
  messageType: string
  content: string
  timestamp: string
  isEcho: boolean
  processed: boolean
  aiResponse?: {
    id: string
    aiResponse: string
    aiModel: string
    tokensUsed: {
      prompt: number
      completion: number
      total: number
    }
    responseTime: number
    status: string
    sentToFacebook: boolean
    createdAt: string
    sentAt: string
  }
}

interface MessagesResponse {
  success: boolean
  data: Message[]
}

// Order interfaces
interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  orderId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  status: string
  paymentStatus: string
  totalAmount: number
  currency: string
  items: OrderItem[]
  deliveryAddress: string
  source: string
  createdAt: string
  updatedAt: string
  notes?: string
  deliveryTime?: string
  instructions?: string
}

interface OrdersResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  message: string
  timestamp: string
}

export default function Dashboard() {
  const { user, tenants, activeTenantId, currentRole } = useUserStore()
  const { entitlements, isGracePeriod, planName, getUsageInfo } = useEntitlements()
  const { canManageCatalog, canConfigureAI, canManageTeam } = usePermissions()

  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true)
  const [recentOrdersError, setRecentOrdersError] = useState<string | null>(null)
  const [totalOrderCount, setTotalOrderCount] = useState(0)

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0]

  // Fetch messages from API
  const fetchMessages = useCallback(async (showLoading = true) => {
    if (showLoading) setMessagesLoading(true)
    setMessagesError(null)

    try {
      const params = new URLSearchParams({
        limit: "15",
        includeAIResponses: "true",
      })

      const response = await fetch(`/api/user/messages?${params.toString()}`)
      const data: MessagesResponse = await response.json()

      if (!response.ok) throw new Error("Failed to fetch messages")

      if (data.success && data.data) {
        setMessages(data.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : "An error occurred while fetching messages")
    } finally {
      if (showLoading) setMessagesLoading(false)
    }
  }, [])

  // Fetch recent orders from API
  const fetchRecentOrders = useCallback(async () => {
    try {
      setRecentOrdersLoading(true)
      setRecentOrdersError(null)

      const params = new URLSearchParams({
        limit: "10",
        page: "1",
      })

      const response = await fetch(`/api/user/orders?${params.toString()}`)
      const data: OrdersResponse = await response.json()

      if (data.success && data.data) {
        setRecentOrders(data.data.orders)
        setTotalOrderCount(data.data.pagination?.total || data.data.orders.length)
      } else {
        throw new Error(data.message || "Failed to fetch orders")
      }
    } catch (err) {
      setRecentOrdersError(err instanceof Error ? err.message : "An error occurred while fetching orders")
    } finally {
      setRecentOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMessages()
    void fetchRecentOrders()
  }, [fetchMessages, fetchRecentOrders, activeTenantId])

  // Periodic polling for live messages every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(false)
    }, 6000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Aggregate metrics from active orders
  const metrics = useMemo(() => {
    const totalRev = recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const pendingOrders = recentOrders.filter((o) => o.status === "pending" || o.status === "draft").length
    const aiRespondedCount = messages.filter((m) => Boolean(m.aiResponse)).length
    const aiRate = messages.length > 0 ? Math.round((aiRespondedCount / messages.length) * 100) : 100

    return {
      revenue: totalRev,
      pendingCount: pendingOrders,
      aiResponseRate: aiRate,
      messagesCount: messages.length,
    }
  }, [recentOrders, messages])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "bg-success-soft text-success border-success/30"
      case "confirmed":
      case "preparing":
      case "ready":
        return "bg-info-soft text-info border-info/30"
      case "pending":
      case "draft":
        return "bg-warning-soft text-warning border-warning/30"
      case "cancelled":
        return "bg-destructive-soft text-destructive border-destructive/30"
      default:
        return "bg-background text-foreground border-border"
    }
  }

  const productUsage = getUsageInfo("MAX_PRODUCTS")
  const stats = [
    { label: "Total orders", value: totalOrderCount.toLocaleString(), note: `${metrics.pendingCount} waiting for you` },
    { label: "Order value", value: `৳${metrics.revenue.toLocaleString()}`, note: "From your last 10 orders" },
    { label: "AI reply rate", value: `${metrics.aiResponseRate}%`, note: "Across recent messages" },
    { label: planName, value: `${productUsage.used} / ${productUsage.limit ?? "∞"}`, note: "Products on your plan" },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {isGracePeriod && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-soft p-4 text-warning">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Your subscription has ended</p>
              <p className="text-xs">Renew your plan to keep the chatbot and catalog running.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/purchase">Renew plan</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl sm:text-5xl">Hi, {user?.firstName}</h1>
          <p className="mt-1 text-muted-foreground">
            {activeTenant?.name || "Your workspace"} at a glance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageTeam && (
            <Button asChild variant="outline" size="sm" className="h-10">
              <Link href="/dashboard/team"><Users /> Team</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="h-10">
            <Link href="/dashboard/configure-page"><Globe /> Facebook page</Link>
          </Button>
          {canConfigureAI && (
            <Button asChild variant="outline" size="sm" className="h-10">
              <Link href="/dashboard/configure-ai"><Bot /> AI settings</Link>
            </Button>
          )}
          {canManageCatalog && (
            <Button asChild size="sm" className="h-10">
              <Link href="/dashboard/products"><Plus /> Add product</Link>
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-sidebar-border rounded-xl bg-sidebar text-white lg:grid-cols-4 lg:divide-x">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 lg:p-6">
            <dt className="text-sm text-sidebar-foreground">{stat.label}</dt>
            <dd className="display mt-1 text-3xl sm:text-4xl">{stat.value}</dd>
            <dd className="mt-1 text-xs text-sidebar-foreground">{stat.note}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-xl">Recent orders</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/orders">View all <ArrowUpRight /></Link>
            </Button>
          </div>
          {recentOrdersLoading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Loading orders
            </div>
          ) : recentOrdersError ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 size-6 text-destructive" />
              <p className="font-medium">{recentOrdersError}</p>
              <Button size="sm" variant="outline" onClick={() => fetchRecentOrders()} className="mt-3">
                Try again
              </Button>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 size-8" />
              <p className="font-medium text-foreground">No orders yet</p>
              <p className="text-xs">Orders appear here as soon as customers place them.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {recentOrders.slice(0, 6).map((order) => (
                <li key={order.orderId} className="flex items-center justify-between gap-4 p-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[12px] rounded-bl-[3px] bg-secondary font-bold">
                      {order.customerName?.[0] || "#"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{order.customerName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.items.length > 0 ? order.items[0].productName : "Product"}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize`}>
                      {order.status}
                    </Badge>
                    <div className="text-right">
                      <p className="font-bold">
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-xl border bg-card">
          <h2 className="border-b p-5 text-xl">Conversations</h2>
          <div className="custom-scrollbar max-h-[460px] flex-1 overflow-y-auto">
            {messagesLoading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /> Loading messages
              </div>
            ) : messagesError && messages.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto mb-2 size-6 text-destructive" />
                <p className="font-medium">{messagesError}</p>
                <Button size="sm" variant="outline" onClick={() => fetchMessages()} className="mt-3">
                  Try again
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Bot className="mx-auto mb-2 size-8" />
                <p className="font-medium text-foreground">No messages yet</p>
                <p className="text-xs">Connect your Facebook page to start receiving messages.</p>
              </div>
            ) : (
              <ul className="space-y-5 p-4">
                {messages.slice(0, 8).map((msg) => (
                  <li key={msg.id} className="space-y-1.5 text-sm">
                    <div className="flex items-end gap-2">
                      <p className="line-clamp-3 rounded-2xl rounded-bl-sm bg-muted px-3.5 pb-1.5 pt-2">
                        {msg.content === "{}" ? "Sent an attachment" : msg.content}
                      </p>
                      <time className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(msg.timestamp)}</time>
                    </div>
                    {msg.aiResponse && (
                      <p className="ml-auto line-clamp-3 w-fit max-w-[88%] rounded-2xl rounded-br-sm bg-primary px-3.5 pb-1.5 pt-2 text-primary-foreground">
                        {msg.aiResponse.aiResponse}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
