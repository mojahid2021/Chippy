"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Search, Filter, Download, TrendingUp, TrendingDown, AlertCircle, Package } from "lucide-react"

export default function InventoryPage() {
  const inventory = [
    {
      id: 1,
      product: "Wireless Headphones",
      sku: "WH-001",
      stock: 145,
      reserved: 12,
      available: 133,
      reorder: 50,
      status: "healthy",
      trend: "up",
    },
    {
      id: 2,
      product: "Smart Watch Pro",
      sku: "SW-002",
      stock: 67,
      reserved: 8,
      available: 59,
      reorder: 50,
      status: "healthy",
      trend: "down",
    },
    {
      id: 3,
      product: "USB-C Cable",
      sku: "CB-003",
      stock: 8,
      reserved: 3,
      available: 5,
      reorder: 100,
      status: "critical",
      trend: "down",
    },
    {
      id: 4,
      product: "Phone Case Premium",
      sku: "PC-004",
      stock: 0,
      reserved: 0,
      available: 0,
      reorder: 75,
      status: "out",
      trend: "down",
    },
    {
      id: 5,
      product: "Bluetooth Speaker",
      sku: "BS-005",
      stock: 234,
      reserved: 34,
      available: 200,
      reorder: 100,
      status: "healthy",
      trend: "up",
    },
  ]

  const stats = [
    { label: "Total Items", value: "342", icon: Package, color: "text-blue-600" },
    { label: "In Stock", value: "298", icon: ShoppingBag, color: "text-emerald-600" },
    { label: "Low Stock", value: "23", icon: AlertCircle, color: "text-amber-600" },
    { label: "Out of Stock", value: "21", icon: AlertCircle, color: "text-red-600" },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: "bg-emerald-100 text-emerald-700 border-emerald-200",
      critical: "bg-amber-100 text-amber-700 border-amber-200",
      out: "bg-red-100 text-red-700 border-red-200",
    }
    return variants[status as keyof typeof variants] || variants.healthy
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      healthy: "Healthy",
      critical: "Low Stock",
      out: "Out of Stock",
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-600 mt-0.5">Track and manage stock levels</p>
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

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory by product name or SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Total Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Reserved</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Available</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700">Reorder Point</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">{item.product}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{item.sku}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-slate-900">{item.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-slate-600">{item.reserved}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-blue-600">{item.available}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-slate-600">{item.reorder}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-medium border ${getStatusBadge(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600 inline" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 inline" />
                    )}
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
