"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Search, Filter, Plus, Edit, Trash2, Eye } from "lucide-react"

export default function ProductsPage() {
  const products = [
    {
      id: 1,
      name: "Wireless Headphones",
      sku: "WH-001",
      category: "Electronics",
      price: "$89.99",
      stock: 145,
      status: "active",
      image: "/placeholder.jpg",
    },
    {
      id: 2,
      name: "Smart Watch Pro",
      sku: "SW-002",
      category: "Wearables",
      price: "$299.00",
      stock: 67,
      status: "active",
      image: "/placeholder.jpg",
    },
    {
      id: 3,
      name: "USB-C Cable",
      sku: "CB-003",
      category: "Accessories",
      price: "$12.99",
      stock: 8,
      status: "low_stock",
      image: "/placeholder.jpg",
    },
    {
      id: 4,
      name: "Phone Case Premium",
      sku: "PC-004",
      category: "Accessories",
      price: "$24.99",
      stock: 0,
      status: "out_of_stock",
      image: "/placeholder.jpg",
    },
    {
      id: 5,
      name: "Bluetooth Speaker",
      sku: "BS-005",
      category: "Electronics",
      price: "$45.00",
      stock: 234,
      status: "active",
      image: "/placeholder.jpg",
    },
  ]

  const stats = [
    { label: "Total Products", value: "342", color: "text-blue-600" },
    { label: "Active", value: "298", color: "text-emerald-600" },
    { label: "Low Stock", value: "23", color: "text-amber-600" },
    { label: "Out of Stock", value: "21", color: "text-red-600" },
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      low_stock: "bg-amber-100 text-amber-700 border-amber-200",
      out_of_stock: "bg-red-100 text-red-700 border-red-200",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Active",
      low_stock: "Low Stock",
      out_of_stock: "Out of Stock",
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter
          </Button>
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Product
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
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <Package className={`h-10 w-10 ${stat.color} opacity-20`} />
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
              placeholder="Search products by name, SKU, or category..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-slate-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-16 w-16 text-slate-300" />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">SKU: {product.sku}</p>
                </div>
                <Badge className={`text-xs font-medium border ${getStatusBadge(product.status)}`}>
                  {getStatusLabel(product.status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{product.price}</p>
                  <p className="text-xs text-slate-600">Stock: {product.stock}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-200">
                <Button variant="outline" size="sm" className="flex-1 h-8">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
