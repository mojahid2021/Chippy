"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Search, Filter, Download, Eye, Truck, Package, CheckCircle, Clock } from "lucide-react"

export default function OrdersPage() {
  const orders = [
    {
      id: "ORD-2024-001",
      customer: "John Doe",
      items: 3,
      total: "$156.00",
      status: "completed",
      payment: "paid",
      date: "Nov 6, 2024",
      channel: "Messenger",
    },
    {
      id: "ORD-2024-002",
      customer: "Sarah Smith",
      items: 1,
      total: "$89.99",
      status: "processing",
      payment: "paid",
      date: "Nov 6, 2024",
      channel: "WhatsApp",
    },
    {
      id: "ORD-2024-003",
      customer: "Mike Johnson",
      items: 5,
      total: "$342.50",
      status: "shipped",
      payment: "paid",
      date: "Nov 5, 2024",
      channel: "Instagram",
    },
    {
      id: "ORD-2024-004",
      customer: "Emily Brown",
      items: 2,
      total: "$124.00",
      status: "pending",
      payment: "pending",
      date: "Nov 5, 2024",
      channel: "Messenger",
    },
    {
      id: "ORD-2024-005",
      customer: "David Wilson",
      items: 4,
      total: "$287.99",
      status: "cancelled",
      payment: "refunded",
      date: "Nov 4, 2024",
      channel: "WhatsApp",
    },
  ]

  const stats = [
    { label: "Total Orders", value: "1,234", icon: ShoppingCart, color: "text-blue-600" },
    { label: "Pending", value: "45", icon: Clock, color: "text-amber-600" },
    { label: "Processing", value: "89", icon: Package, color: "text-violet-600" },
    { label: "Completed", value: "1,100", icon: CheckCircle, color: "text-emerald-600" },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200",
      shipped: "bg-violet-100 text-violet-700 border-violet-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const getPaymentBadge = (payment: string) => {
    const variants = {
      paid: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      refunded: "bg-slate-100 text-slate-700",
    }
    return variants[payment as keyof typeof variants] || variants.pending
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage all customer orders from chat</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

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
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders by ID, customer name, or channel..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Channel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-blue-600">{order.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-900">{order.customer}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{order.items} items</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">{order.total}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-medium ${getPaymentBadge(order.payment)}`}>
                      {order.payment}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {order.channel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{order.date}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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
    </div>
  )
}
