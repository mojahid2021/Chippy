"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/stores/userStore"
import { 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  DollarSign,
  Bot,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Star,
  Activity,
  Timer,
  MoreVertical,
  Loader2
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
  const { user } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true)
  const [recentOrdersError, setRecentOrdersError] = useState<string | null>(null)

  // Fetch messages from API
  const fetchMessages = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setMessagesLoading(true)
    }
    setMessagesError(null)

    try {
      const params = new URLSearchParams({
        limit: '10',
        includeAIResponses: 'true'
      })

      const response = await fetch(`/api/user/messages?${params.toString()}`)
      const data: MessagesResponse = await response.json()

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      if (data.success && data.data) {
        setMessages(data.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'An error occurred while fetching messages')
      console.error('Error fetching messages:', err)
    } finally {
      if (showLoading) {
        setMessagesLoading(false)
      }
    }
  }, [])

  // Fetch recent orders from API
  const fetchRecentOrders = useCallback(async () => {
    try {
      setRecentOrdersLoading(true)
      setRecentOrdersError(null)

      // Fetch recent orders (limit to 8 for dashboard display)
      const params = new URLSearchParams({
        limit: '8',
        page: '1'
      })

      const response = await fetch(`/api/user/orders?${params.toString()}`)
      const data: OrdersResponse = await response.json()

      if (data.success && data.data) {
        setRecentOrders(data.data.orders)
      } else {
        throw new Error(data.message || 'Failed to fetch orders')
      }
    } catch (err) {
      setRecentOrdersError(err instanceof Error ? err.message : 'An error occurred while fetching orders')
      console.error('Error fetching orders:', err)
    } finally {
      setRecentOrdersLoading(false)
    }
  }, [])

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages()
    fetchRecentOrders()
  }, [fetchMessages, fetchRecentOrders])

    // Auto-refresh messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(false) // Don't show loading state during auto-refresh
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchMessages])  // Real-time stats for AI chatbot e-commerce
  const stats = [
    {
      title: "Total Orders Today",
      value: "127",
      change: "+12.5%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      lightBg: "bg-blue-500"
    },
    {
      title: "Active Conversations",
      value: "43",
      change: "+8.2%",
      trend: "up",
      icon: MessageSquare,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      lightBg: "bg-emerald-500"
    },
    {
      title: "Revenue Today",
      value: "Tk 8,432",
      change: "+18.4%",
      trend: "up",
      icon: DollarSign,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      lightBg: "bg-violet-500"
    },
    {
      title: "AI Response Rate",
      value: "98.5%",
      change: "+2.1%",
      trend: "up",
      icon: Bot,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      lightBg: "bg-amber-500"
    }
  ]

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`

    return date.toLocaleDateString()
  }

  // Recent orders from chatbot
  const transformedRecentOrders = recentOrders.map((order) => ({
    id: order.orderId,
    customer: order.customerName,
    product: order.items.length > 0 ? order.items[0].productName + (order.items.length > 1 ? ` + ${order.items.length - 1} more` : '') : 'Unknown Product',
    amount: `${order.currency} ${order.totalAmount.toFixed(2)}`,
    status: order.status,
    time: formatTimeAgo(order.createdAt),
    channel: order.source
  }))

  // Live chat activity - now from API
  const chatActivity = messages.slice(0, 10).map((message) => ({
    id: message.id,
    userMessage: message.content === '{}' ? '📎 Image/Attachment' : message.content,
    aiResponse: message.aiResponse?.aiResponse || '',
    time: new Date(message.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    unread: !message.processed, // Unread if not processed
    status: message.aiResponse ? 'ai-responded' : 'pending'
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-sm text-slate-600">
              Your AI chatbot is actively helping customers. Here&apos;s today&apos;s performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>
      </div>



      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Recent Orders - Takes 2 columns */}
        <Card className="lg:col-span-2 border-slate-200 flex flex-col h-full">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Recent Orders</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Latest customer orders</p>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View All
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <div className="h-full divide-y divide-slate-100 overflow-hidden">
              {recentOrdersLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-slate-600">Loading orders...</span>
                </div>
              ) : recentOrdersError ? (
                <div className="flex flex-col items-center justify-center h-full px-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div className="mt-2 text-center">
                    <p className="text-sm text-red-600 font-medium">Error loading orders</p>
                    <p className="text-xs text-slate-600">{recentOrdersError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => fetchRecentOrders()}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : transformedRecentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Package className="h-6 w-6 text-slate-400" />
                  <div className="mt-2 text-center">
                    <p className="text-sm text-slate-600 font-medium">No recent orders</p>
                    <p className="text-xs text-slate-500">Recent orders will appear here</p>
                  </div>
                </div>
              ) : (
                transformedRecentOrders.slice(0, 6).map((order) => (
                  <div key={order.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Package className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{order.customer}</p>
                          <p className="text-xs text-slate-500">{order.id}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3 text-slate-400" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between ml-11">
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 mb-0.5">{order.product}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400">via {order.channel}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{order.amount}</p>
                        <p className="text-[10px] text-slate-400">{order.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Chat Activity */}
        <Card className="border-slate-200 flex flex-col h-full">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Live Chats</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Active conversations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-slate-600">Loading messages...</span>
              </div>
            ) : messagesError ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div className="mt-2 text-center">
                  <p className="text-sm text-red-600 font-medium">Error loading messages</p>
                  <p className="text-xs text-slate-600">{messagesError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => fetchMessages(true)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : chatActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="h-6 w-6 text-slate-400" />
                <div className="mt-2 text-center">
                  <p className="text-sm text-slate-600 font-medium">No messages yet</p>
                  <p className="text-xs text-slate-500">Recent conversations will appear here</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto divide-y divide-slate-100">
                {chatActivity.map((chat, index) => (
                  <div
                    key={`${chat.id}-${chat.time}`}
                    className={`p-3 hover:bg-slate-50 transition-all duration-300 ease-in-out cursor-pointer animate-in fade-in slide-in-from-bottom-2 ${
                      chat.unread ? 'bg-blue-50/50' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {chat.userMessage}
                        </p>
                        {chat.aiResponse && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {chat.aiResponse}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-500">{chat.time}</p>
                          {chat.aiResponse && (
                            <span className="text-[10px] text-blue-600 font-medium">
                              {messages.find(m => m.id === chat.id)?.aiResponse?.aiModel?.split('/')[1] || 'AI'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {chat.unread && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    )}
                  </div>
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