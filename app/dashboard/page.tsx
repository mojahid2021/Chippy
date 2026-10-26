"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/stores/userStore"
import { useEntitlements } from "@/hooks/use-entitlements"
import { usePermissions } from "@/hooks/use-permissions"
import {
  MessageSquare,
  AlertCircle,
  ArrowUpRight,
  Package,
  Activity,
  MoreVertical,
  Loader2,
  TrendingUp,
  DollarSign,
  Bot,
  Users,
  Sparkles,
  Plus,
  Globe,
  Settings,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "confirmed":
      case "preparing":
      case "ready":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "pending":
      case "draft":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 lg:p-6">
      {/* Grace period warning if applicable */}
      {isGracePeriod && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Your subscription is in grace period</p>
              <p className="text-xs text-amber-700">
                Please renew your plan to prevent automated chatbot and catalog service interruption.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
            <Link href="/dashboard/purchase">Renew Plan</Link>
          </Button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-lg p-6 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs rounded">
              {activeTenant?.name || "Workspace"} • {currentRole || "OWNER"}
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            Your Facebook AI assistant is active and processing conversations. Here is your store summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 flex items-center gap-1.5 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Service Connected
          </Badge>
        </div>
      </div>

      {/* Top Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders Card */}
        <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalOrderCount}</h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {metrics.pendingCount} awaiting processing
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent Volume</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                BDT {metrics.revenue.toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">From latest active batch</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* AI Automation Rate */}
        <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Response Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.aiResponseRate}%</h3>
              <p className="text-xs text-indigo-600 font-medium flex items-center mt-1">
                <Sparkles className="h-3 w-3 mr-1" /> Automated Messenger replies
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Plan Card */}
        <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Plan & Usage</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{planName}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-slate-500">
                  Products: {getUsageInfo("MAX_PRODUCTS").used} / {getUsageInfo("MAX_PRODUCTS").limit ?? "∞"}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Quick Actions:
        </span>
        {canManageCatalog && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1 border-slate-200 hover:bg-slate-50">
            <Link href="/dashboard/products">
              <Plus className="h-3.5 w-3.5 text-blue-600" /> Add Product
            </Link>
          </Button>
        )}
        {canConfigureAI && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1 border-slate-200 hover:bg-slate-50">
            <Link href="/dashboard/configure-ai">
              <Bot className="h-3.5 w-3.5 text-indigo-600" /> Configure AI
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1 border-slate-200 hover:bg-slate-50">
          <Link href="/dashboard/configure-page">
            <Globe className="h-3.5 w-3.5 text-emerald-600" /> Facebook Setup
          </Link>
        </Button>
        {canManageTeam && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1 border-slate-200 hover:bg-slate-50">
            <Link href="/dashboard/team">
              <Users className="h-3.5 w-3.5 text-purple-600" /> Manage Team
            </Link>
          </Button>
        )}
      </div>

      {/* Main Content Grid: Recent Orders & Live Chats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - 2 Columns */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-600" /> Recent Customer Orders
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Incoming orders routed from Facebook Messenger and website
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-blue-600 font-medium">
              <Link href="/dashboard/orders">
                View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {recentOrdersLoading ? (
              <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Loading orders...
              </div>
            ) : recentOrdersError ? (
              <div className="p-8 text-center text-slate-500">
                <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">{recentOrdersError}</p>
                <Button size="sm" variant="outline" onClick={() => fetchRecentOrders()} className="mt-3 text-xs">
                  Retry
                </Button>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No recent orders yet</p>
                <p className="text-xs mt-1">Orders will appear here as soon as customers place them.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.slice(0, 6).map((order) => (
                  <div key={order.orderId} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs">
                        {order.customerName?.[0] || "#"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{order.customerName}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {order.items.length > 0 ? order.items[0].productName : "Product"}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <Badge variant="outline" className={`${getStatusColor(order.status)} text-[11px] font-semibold px-2 py-0.5`}>
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {order.currency} {order.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatTimeAgo(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Chats Stream */}
        <Card className="border-slate-200 shadow-sm bg-white flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" /> Live Conversations
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Real-time customer inquiries</CardDescription>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </CardHeader>
          <CardContent className="p-0 flex-1 max-h-[460px] overflow-y-auto custom-scrollbar">
            {messagesLoading ? (
              <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Connecting to stream...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Connect your Facebook Page to start receiving messages.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {messages.slice(0, 8).map((msg) => (
                  <div key={msg.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium">
                        <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                          User
                        </span>
                        <span className="line-clamp-1">{msg.content === "{}" ? "📎 Media attachment" : msg.content}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatTimeAgo(msg.timestamp)}</span>
                    </div>

                    {msg.aiResponse && (
                      <div className="mt-2 p-2 rounded-lg bg-indigo-50/70 border border-indigo-100/80 text-xs text-indigo-950">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 mb-0.5">
                          <Bot className="h-3 w-3" /> AI Assistant Reply:
                        </div>
                        <p className="line-clamp-2 leading-relaxed">{msg.aiResponse.aiResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}