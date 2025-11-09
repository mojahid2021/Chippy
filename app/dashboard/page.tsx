"use client"

import { useState, useEffect, useCallback } from "react"
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

export default function Dashboard() {
  const { user } = useUserStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messagesError, setMessagesError] = useState<string | null>(null)

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

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

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

  // Recent orders from chatbot
  const recentOrders = [
    {
      id: "#ORD-1247",
      customer: "Sarah Johnson",
      product: "Wireless Headphones",
      amount: "Tk 129.99",
      status: "completed",
      time: "2 min ago",
      channel: "Facebook Messenger"
    },
    {
      id: "#ORD-1246",
      customer: "Mike Chen",
      product: "Smart Watch Pro",
      amount: "Tk 299.99",
      status: "processing",
      time: "5 min ago",
      channel: "WhatsApp"
    },
    {
      id: "#ORD-1245",
      customer: "Emma Wilson",
      product: "Bluetooth Speaker",
      amount: "Tk 79.99",
      status: "pending",
      time: "12 min ago",
      channel: "Instagram DM"
    },
    {
      id: "#ORD-1244",
      customer: "Alex Kumar",
      product: "Phone Case Set",
      amount: "Tk 34.99",
      status: "completed",
      time: "18 min ago",
      channel: "Facebook Messenger"
    }
  ]

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
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200 hover:shadow-md transition-all hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-xs font-semibold ${
                  stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <p className="text-xs font-medium text-slate-500">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders - Takes 2 columns */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Recent Orders</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Orders placed via AI chatbot</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                View All
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{order.customer}</p>
                        <p className="text-xs text-slate-500">{order.id}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between ml-12">
                    <div className="flex-1">
                      <p className="text-xs text-slate-600 mb-1">{order.product}</p>
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Chat Activity */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Live Chats</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Active conversations</p>
              </div>
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-2 py-0">
                {messagesLoading ? '...' : chatActivity.filter(c => c.unread).length} New
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-slate-600">Loading messages...</span>
              </div>
            ) : messagesError ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
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
              <div className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-6 w-6 text-slate-400" />
                <div className="mt-2 text-center">
                  <p className="text-sm text-slate-600 font-medium">No messages yet</p>
                  <p className="text-xs text-slate-500">Recent conversations will appear here</p>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
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
            <div className="p-3 border-t border-slate-100">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                View All Conversations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Performance Metrics */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">AI Performance</CardTitle>
            <p className="text-xs text-slate-500">Last 24 hours</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Messages Handled</p>
                  <p className="text-lg font-bold text-slate-900">1,247</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">+156</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Timer className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Avg Response Time</p>
                  <p className="text-lg font-bold text-slate-900">1.2s</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">-0.3s</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Customer Satisfaction</p>
                  <p className="text-lg font-bold text-slate-900">4.8/5.0</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">+0.2</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Quick Actions</CardTitle>
            <p className="text-xs text-slate-500">Manage your chatbot</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold">Train AI</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold">Products</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                <span className="text-xs font-semibold">Analytics</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-semibold">Automations</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}