"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ShoppingCart, Search, Filter, Download, Eye, Truck, Package, CheckCircle, Clock, Loader2, AlertCircle, MapPin, Phone, Calendar, CreditCard, User, Hash, Globe, Receipt, Printer, Edit, Save, X } from "lucide-react"

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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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

  // Helper function to get image URL for display
  const getImageUrl = (image?: string) => {
    if (!image) return null

    // Check if it's already a full URL
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }

    // Use our proxy route for serving images
    return `/api/images/${image}`
  }
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })

  const fetchTableProductDetails = useCallback(async (orders: Order[]) => {
    try {
      // Collect all unique product IDs from all orders
      const allProductIds = new Set<string>()
      orders.forEach(order => {
        order.items.forEach(item => {
          allProductIds.add(item.productId)
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
      // Silently handle errors for table product details
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let url = `/api/user/orders?page=${currentPage}&limit=10`
      if (statusFilter) {
        url += `&status=${statusFilter}`
      }
      if (paymentStatusFilter) {
        url += `&paymentStatus=${paymentStatusFilter}`
      }
      if (startDate) {
        url += `&startDate=${startDate}`
      }
      if (endDate) {
        url += `&endDate=${endDate}`
      }

      const response = await fetch(url)
      const data: OrdersResponse = await response.json()

      if (data.success) {
        setOrders(data.data.orders)
        setPagination(data.data.pagination)
        // Fetch product details for table display
        fetchTableProductDetails(data.data.orders)
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
      // Silently handle errors for product details
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
    // Fetch product details for all items in the order
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
        // Update the selected order with new data
        setSelectedOrder(data.data)
        setIsEditMode(false)
        // Refresh the orders list to reflect changes
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
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone.includes(searchTerm)
  )

  // Calculate stats from actual data
  const totalOrders = pagination.total
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const confirmedOrders = orders.filter(order => order.status === 'confirmed').length
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length

  const stats = [
    { label: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600" },
    { label: "Pending", value: pendingOrders.toString(), icon: Clock, color: "text-amber-600" },
    { label: "Confirmed", value: confirmedOrders.toString(), icon: Package, color: "text-violet-600" },
    { label: "Cancelled", value: cancelledOrders.toString(), icon: CheckCircle, color: "text-red-600" },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      confirmed: "bg-blue-100 text-blue-700 border-blue-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      preparing: "bg-purple-100 text-purple-700 border-purple-200",
      ready: "bg-green-100 text-green-700 border-green-200",
      delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
      paid: "bg-green-100 text-green-700 border-green-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      refunded: "bg-orange-100 text-orange-700 border-orange-200",
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            <p className="text-sm text-slate-600 mt-0.5">Manage all customer orders from chat</p>
          </div>
        </div>
        <Card className="p-6 border border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            onClick={fetchOrders}
            className="mt-4 bg-red-600 hover:bg-red-700"
            size="sm"
          >
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">


      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 border border-slate-200 shadow-sm">
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Payment:</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("")
                setPaymentStatusFilter("")
                setStartDate("")
                setEndDate("")
                setCurrentPage(1)
              }}
              className="h-9"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Products</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{order.customerName}</span>
                      <br />
                      <span className="text-xs text-slate-500">{order.customerPhone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {order.items.slice(0, 3).map((item, idx) => {
                        const productDetail = tableProductDetails[item.productId]
                        return getImageUrl(productDetail?.image) ? (
                          <Image
                            key={idx}
                            src={getImageUrl(productDetail.image)!}
                            alt={item.productName}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-cover rounded border border-slate-200"
                          />
                        ) : (
                          <div key={idx} className="w-8 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                            <Package className="h-4 w-4 text-slate-400" />
                          </div>
                        )
                      })}
                      {order.items.length > 3 && (
                        <span className="text-xs text-slate-500 ml-1">+{order.items.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{order.items.length} items</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {order.currency} {order.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-medium border ${getStatusBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleViewOrderDetails(order)}
                        disabled={orderDetailsLoading}
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Truck className="h-3.5 w-3.5 text-slate-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && !loading && (
        <Card className="p-8 border border-slate-200 shadow-sm text-center">
          <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm || statusFilter || paymentStatusFilter || startDate || endDate
              ? 'Try adjusting your search or filter criteria.'
              : 'No orders have been placed yet.'}
          </p>
        </Card>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={orderDetailsModal} onOpenChange={setOrderDetailsModal}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 [&>button]:hidden">
            <DialogTitle className="sr-only">Order Details - {selectedOrder.orderId}</DialogTitle>
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                    <p className="text-sm text-slate-600">Order #{selectedOrder.orderId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isEditMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={updatingOrder}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpdateOrder}
                        disabled={updatingOrder}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updatingOrder ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusBadge(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </Badge>
                      <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusBadge(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditOrder}
                        className="ml-2"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-700">Items</p>
                          <p className="text-lg font-bold text-blue-900">{selectedOrder.items.length}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-700">Total</p>
                          <p className="text-lg font-bold text-green-900">
                            {selectedOrder.currency} {selectedOrder.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-purple-50 border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-purple-700">Customer</p>
                          <p className="text-sm font-bold text-purple-900">{selectedOrder.customerName}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-orange-700">Date</p>
                          <p className="text-sm font-bold text-orange-900">
                            {new Date(selectedOrder.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Customer & Delivery Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-900">Customer Details</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{selectedOrder.customerName}</p>
                            <p className="text-xs text-slate-500">Customer Name</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Phone className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{selectedOrder.customerPhone}</p>
                            <p className="text-xs text-slate-500">Phone Number</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                            <MapPin className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{selectedOrder.customerAddress}</p>
                            <p className="text-xs text-slate-500">Delivery Address</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Truck className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-900">Order Information</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Hash className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{selectedOrder.orderId}</p>
                            <p className="text-xs text-slate-500">Order ID</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{selectedOrder.source}</p>
                            <p className="text-xs text-slate-500">Order Source</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(selectedOrder.createdAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">Order Date</p>
                          </div>
                        </div>
                        {selectedOrder.deliveryTime && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {new Date(selectedOrder.deliveryTime).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500">Delivery Time</p>
                            </div>
                          </div>
                        )}
                        {selectedOrder.instructions && (
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                              <MapPin className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{selectedOrder.instructions}</p>
                              <p className="text-xs text-slate-500">Delivery Instructions</p>
                            </div>
                          </div>
                        )}
                        {selectedOrder.notes && (
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                              <Receipt className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{selectedOrder.notes}</p>
                              <p className="text-xs text-slate-500">Internal Notes</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Edit Form - Only show in edit mode */}
                  {isEditMode && (
                    <Card className="p-5 border-amber-200 bg-amber-50">
                      <div className="flex items-center gap-2 mb-4">
                        <Edit className="h-5 w-5 text-amber-600" />
                        <h3 className="text-lg font-semibold text-slate-900">Edit Order Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Order Status</label>
                          <select
                            value={editFormData.status}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Payment Status</label>
                          <select
                            value={editFormData.paymentStatus}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Time</label>
                          <input
                            type="datetime-local"
                            value={editFormData.deliveryTime}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Instructions</label>
                          <textarea
                            value={editFormData.instructions}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, instructions: e.target.value }))}
                            placeholder="Enter delivery instructions..."
                            rows={3}
                            maxLength={500}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          <p className="text-xs text-slate-500 mt-1">{editFormData.instructions.length}/500 characters</p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                          <textarea
                            value={editFormData.notes}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add internal notes..."
                            rows={3}
                            maxLength={1000}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          <p className="text-xs text-slate-500 mt-1">{editFormData.notes.length}/1000 characters</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Order Items */}
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Package className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Order Items</h3>
                      <Badge variant="outline" className="ml-auto">
                        {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => {
                        const productDetail = productDetails[item.productId]
                        return (
                          <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                            {/* Product Image */}
                            <div className="shrink-0">
                              {getImageUrl(productDetail?.image) ? (
                                <Image
                                  src={getImageUrl(productDetail.image)!}
                                  alt={item.productName}
                                  width={80}
                                  height={80}
                                  className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-slate-200 rounded-lg border border-slate-200 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-slate-400" />
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-base font-semibold text-slate-900 mb-1">{item.productName}</h4>
                                  <p className="text-xs text-slate-500 mb-2">ID: {item.productId}</p>
                                  {productDetail && (
                                    <div className="flex flex-wrap gap-2">
                                      {productDetail.category && (
                                        <Badge variant="secondary" className="text-xs">
                                          {productDetail.category}
                                        </Badge>
                                      )}
                                      {productDetail.stock !== undefined && (
                                        <Badge
                                          variant={productDetail.stock > 0 ? "default" : "destructive"}
                                          className="text-xs"
                                        >
                                          Stock: {productDetail.stock}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-bold text-slate-900">
                                    {selectedOrder.currency} {item.totalPrice.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {selectedOrder.currency} {item.unitPrice.toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                              </div>

                              {productDetail?.description && (
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{productDetail.description}</p>
                              )}

                              {productDetailsLoading && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                  <span className="text-xs text-slate-500">Loading details...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Order Summary */}
                  <Card className="p-5 bg-linear-to-r from-slate-50 to-blue-50 border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Order Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-600">Subtotal ({selectedOrder.items.length} items)</span>
                        <span className="text-sm font-medium text-slate-900">
                          {selectedOrder.currency} {selectedOrder.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-slate-900">Total Amount</span>
                          <span className="text-xl font-bold text-blue-600">
                            {selectedOrder.currency} {selectedOrder.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <Button variant="outline" onClick={() => setOrderDetailsModal(false)}>
                  Close
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
