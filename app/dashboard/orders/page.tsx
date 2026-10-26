"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  User, 
  Hash, 
  Globe, 
  Receipt, 
  Printer, 
  Edit3, 
  Save, 
  X,
  MessageCircle,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  TrendingUp
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

interface Order {
  orderId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  status: string
  paymentStatus: string
  totalAmount: number
  currency: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  deliveryAddress: string
  source: string
  createdAt: string
  updatedAt: string
  notes?: string
  deliveryTime?: string
  instructions?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  isActive?: boolean
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

export default function OrdersPage() {
  const { canManageOrders } = usePermissions()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailsModal, setOrderDetailsModal] = useState(false)
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({})
  const [productDetailsLoading, setProductDetailsLoading] = useState(false)
  const [tableProductDetails, setTableProductDetails] = useState<Record<string, Product>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState({
    status: '',
    paymentStatus: '',
    notes: '',
    deliveryTime: '',
    instructions: ''
  })
  const [updatingOrder, setUpdatingOrder] = useState(false)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })

  const getImageUrl = (image?: string) => {
    if (!image) return null
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `/api/images/${image}`
  }

  const fetchTableProductDetails = useCallback(async (ordersList: Order[]) => {
    try {
      const allProductIds = new Set<string>()
      ordersList.forEach(order => {
        order.items.forEach(item => {
          if (item.productId) allProductIds.add(item.productId)
        })
      })

      const productIds = Array.from(allProductIds)
      if (productIds.length === 0) return

      const productPromises = productIds.map(async (productId) => {
        try {
          const response = await fetch(`/api/user/products/${productId}`)
          const data = await response.json()
          if (data.success) {
            return { productId, product: data.data }
          }
          return { productId, product: null }
        } catch {
          return { productId, product: null }
        }
      })

      const results = await Promise.all(productPromises)
      const productDetailsMap: Record<string, Product> = {}

      results.forEach(({ productId, product }) => {
        if (product) {
          productDetailsMap[productId] = product
        }
      })

      setTableProductDetails(productDetailsMap)
    } catch {
      // Silently handle
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let url = `/api/user/orders?page=${currentPage}&limit=10`
      if (statusFilter) url += `&status=${statusFilter}`
      if (paymentStatusFilter) url += `&paymentStatus=${paymentStatusFilter}`
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`

      const response = await fetch(url)
      const data: OrdersResponse = await response.json()

      if (data.success) {
        setOrders(data.data.orders || [])
        setPagination(data.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 })
        fetchTableProductDetails(data.data.orders || [])
      } else {
        setError(data.message || 'Failed to fetch orders')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, paymentStatusFilter, startDate, endDate, fetchTableProductDetails])

  const fetchProductDetails = useCallback(async (productIds: string[]) => {
    try {
      setProductDetailsLoading(true)
      const productPromises = productIds.map(async (productId) => {
        try {
          const response = await fetch(`/api/user/products/${productId}`)
          const data = await response.json()
          if (data.success) {
            return { productId, product: data.data }
          }
          return { productId, product: null }
        } catch {
          return { productId, product: null }
        }
      })

      const results = await Promise.all(productPromises)
      const productDetailsMap: Record<string, Product> = {}

      results.forEach(({ productId, product }) => {
        if (product) {
          productDetailsMap[productId] = product
        }
      })

      setProductDetails(productDetailsMap)
    } catch {
      // Silently handle
    } finally {
      setProductDetailsLoading(false)
    }
  }, [])

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    try {
      setOrderDetailsLoading(true)
      const response = await fetch(`/api/user/orders/${orderId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedOrder(data.data)
        setOrderDetailsModal(true)
      } else {
        setError(data.message || 'Failed to fetch order details')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setOrderDetailsLoading(false)
    }
  }, [])

  const handleViewOrderDetails = (order: Order) => {
    fetchOrderDetails(order.orderId)
    const productIds = order.items.map(item => item.productId)
    fetchProductDetails(productIds)
  }

  const handleEditOrder = () => {
    if (selectedOrder) {
      setEditFormData({
        status: selectedOrder.status,
        paymentStatus: selectedOrder.paymentStatus,
        notes: selectedOrder.notes || '',
        deliveryTime: selectedOrder.deliveryTime || '',
        instructions: selectedOrder.instructions || ''
      })
      setIsEditMode(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditFormData({
      status: '',
      paymentStatus: '',
      notes: '',
      deliveryTime: '',
      instructions: ''
    })
  }

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return

    try {
      setUpdatingOrder(true)
      const response = await fetch(`/api/user/orders/${selectedOrder.orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      })

      const data = await response.json()

      if (data.success) {
        setSelectedOrder(data.data)
        setIsEditMode(false)
        fetchOrders()
      } else {
        setError(data.message || 'Failed to update order')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setUpdatingOrder(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (!orderDetailsModal) {
      setSelectedOrder(null)
      setProductDetails({})
      setIsEditMode(false)
      setEditFormData({
        status: '',
        paymentStatus: '',
        notes: '',
        deliveryTime: '',
        instructions: ''
      })
    }
  }, [orderDetailsModal])

  const filteredOrders = orders.filter(order =>
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone?.includes(searchTerm) ||
    order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length
  const deliveredCount = orders.filter(o => o.status === 'delivered').length
  const revenueTotal = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'confirmed':
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case 'delivered':
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case 'pending':
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case 'preparing':
      case 'ready':
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case 'cancelled':
      case 'failed':
        return "bg-rose-500/10 text-rose-400 border-rose-500/20"
      case 'paid':
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case 'refunded':
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20"
    }
  }

  const pipelineStages = [
    { key: "", label: "All Orders" },
    { key: "pending", label: "Pending Review" },
    { key: "confirmed", label: "Confirmed" },
    { key: "preparing", label: "In Prep" },
    { key: "ready", label: "Ready to Dispatch" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ]

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Order Processing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Orders Pipeline</h1>
          <p className="text-sm text-slate-400">Track, fulfill, and update orders captured directly from Facebook Messenger.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "cards" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{pagination.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">৳{revenueTotal.toLocaleString()}</span> volume on page
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Review</span>
            <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Requires confirmation</p>
        </div>

        <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Confirmed</span>
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-300 mt-2">{confirmedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ready for fulfillment</p>
        </div>

        <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Delivered</span>
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{deliveredCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed deliveries</p>
        </div>
      </div>

      {/* Pipeline Stages Horizontal Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {pipelineStages.map((stage) => {
          const isActive = statusFilter === stage.key
          return (
            <button
              key={stage.key}
              onClick={() => {
                setStatusFilter(stage.key)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-[#0F172A] text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {stage.label}
            </button>
          )
        })}
      </div>

      {/* Search & Extra Filters */}
      <div className="p-3.5 rounded-lg bg-[#0F172A] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by customer name, phone (+880...), or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1E293B] border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Payments</option>
              <option value="pending">Payment: Pending</option>
              <option value="paid">Payment: Paid</option>
              <option value="failed">Payment: Failed</option>
              <option value="refunded">Payment: Refunded</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-300"
              />
              <span className="text-[11px]">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-300"
              />
            </div>

            {(statusFilter || paymentStatusFilter || startDate || endDate || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("")
                  setPaymentStatusFilter("")
                  setStartDate("")
                  setEndDate("")
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs text-slate-400 font-medium">Loading orders pipeline...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300">{error}</p>
          <Button onClick={fetchOrders} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-md">
            Retry Connection
          </Button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No orders found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter || paymentStatusFilter
                ? "No orders match your filter criteria. Try resetting filters."
                : "Your AI agent is ready to accept orders from Facebook Messenger once connected."}
            </p>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.orderId}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => handleViewOrderDetails(order)}
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                          <span>{order.customerName || "Anonymous Customer"}</span>
                          {order.source && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-normal">
                              {order.source}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{order.customerPhone}</span>
                        </p>
                      </div>
                    </td>

                    {/* Items preview */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {order.items.slice(0, 3).map((item, idx) => {
                          const p = tableProductDetails[item.productId]
                          return getImageUrl(p?.image) ? (
                            <Image
                              key={idx}
                              src={getImageUrl(p.image)!}
                              alt={item.productName}
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-lg object-cover border border-white/10"
                            />
                          ) : (
                            <div key={idx} className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                          )
                        })}
                        {order.items.length > 3 && (
                          <span className="text-[11px] text-slate-400 font-medium">+{order.items.length - 3}</span>
                        )}
                        <span className="text-xs text-slate-400 ml-1">
                          ({order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} pcs)
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      ৳{order.totalAmount.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[11px] capitalize font-medium border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </Badge>
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4">
                      <Badge className={`text-[11px] capitalize font-medium border ${getStatusBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                          onClick={() => handleViewOrderDetails(order)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => handleViewOrderDetails(order)}
              className="p-5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-4 shadow-sm group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">#{order.orderId.slice(-8)}</span>
                  <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                    {order.customerName}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{order.customerPhone}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`text-[10px] capitalize font-medium border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </Badge>
                  <span className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{order.items.length} item(s)</span>
                  <span className="font-bold text-white text-sm">৳{order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pt-1">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <span key={idx} className="text-[11px] text-slate-300 truncate max-w-[140px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {item.productName} ×{item.quantity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="truncate max-w-[200px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                  <span className="truncate">{order.customerAddress || "No address provided"}</span>
                </span>
                <span className="text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total orders)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modern Order Details Modal */}
      {selectedOrder && (
        <Dialog open={orderDetailsModal} onOpenChange={setOrderDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden p-0 bg-[#0F172A] border border-slate-800 text-slate-100 shadow-2xl rounded-lg [&>button]:hidden">
            <DialogTitle className="sr-only">Order #{selectedOrder.orderId}</DialogTitle>

            <div className="flex flex-col h-full max-h-[92vh]">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">Order Details</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        #{selectedOrder.orderId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Captured on {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditMode && canManageOrders && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditOrder}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 rounded-md"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Edit Status
                    </Button>
                  )}
                  <button
                    onClick={() => setOrderDetailsModal(false)}
                    className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Pipeline Stepper */}
                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-400 font-medium">Fulfillment Status</span>
                    <Badge className={`capitalize text-[11px] font-semibold border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  
                  {/* Visual Stepper */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    {[
                      { label: "1. Order Placed", active: true },
                      { label: "2. Confirmed", active: ['confirmed', 'preparing', 'ready', 'delivered'].includes(selectedOrder.status.toLowerCase()) },
                      { label: "3. Dispatched", active: ['ready', 'delivered'].includes(selectedOrder.status.toLowerCase()) },
                      { label: "4. Delivered", active: selectedOrder.status.toLowerCase() === 'delivered' },
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-full h-1.5 rounded-full mb-1.5 transition-colors ${
                          step.active ? "bg-blue-600" : "bg-slate-800"
                        }`} />
                        <span className={step.active ? "text-blue-400 font-semibold" : "text-slate-500"}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Mode Pane */}
                {isEditMode && (
                  <div className="p-5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-blue-400" />
                        <span>Update Order Information</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-xs text-slate-400 hover:text-white h-7 rounded-md"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleUpdateOrder}
                          disabled={updatingOrder}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 rounded-md"
                        >
                          {updatingOrder ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                          Save Changes
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">Order Status</label>
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready to Dispatch</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">Payment Status</label>
                        <select
                          value={editFormData.paymentStatus}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 mb-1 font-medium">Internal Notes</label>
                        <textarea
                          rows={2}
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Courier tracking number, consignment notes..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white text-xs resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer & Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</h4>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${selectedOrder.customerPhone}`}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1 hover:bg-emerald-500/20"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-medium flex items-center gap-1 hover:bg-teal-500/20"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <p className="text-white font-semibold text-sm">{selectedOrder.customerName}</p>
                      <p className="text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{selectedOrder.customerPhone}</span>
                      </p>
                      <p className="text-slate-300 flex items-start gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{selectedOrder.customerAddress || selectedOrder.deliveryAddress || "No delivery address recorded"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Instructions & Notes</h4>
                    <div className="space-y-2 text-xs">
                      {selectedOrder.instructions ? (
                        <p className="text-slate-300 bg-slate-950/70 p-2.5 rounded-md border border-slate-800">
                          {selectedOrder.instructions}
                        </p>
                      ) : (
                        <p className="text-slate-500 italic">No special delivery instructions provided.</p>
                      )}

                      {selectedOrder.notes && (
                        <div className="pt-1">
                          <p className="text-[11px] text-slate-400 font-medium">Merchant Note:</p>
                          <p className="text-slate-300 text-xs mt-0.5">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ordered Products</h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {selectedOrder.items.map((item, idx) => {
                      const p = productDetails[item.productId]
                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {getImageUrl(p?.image) ? (
                              <Image
                                src={getImageUrl(p.image)!}
                                alt={item.productName}
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-md object-cover border border-slate-800"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-white">{item.productName}</p>
                              <p className="text-xs text-slate-400">
                                ৳{item.unitPrice.toLocaleString()} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">৳{item.totalPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary Footer */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal</span>
                      <span>৳{selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-400 font-medium">Calculated upon dispatch</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                      <span>Total Due</span>
                      <span className="text-white font-bold text-lg">
                        ৳{selectedOrder.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print Receipt
                </Button>
                <Button
                  onClick={() => setOrderDetailsModal(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5"
                >
                  Close
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
