"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Boxes, Search, Plus, Edit, Trash2, Package } from "lucide-react"

export default function CategoriesPage() {
  const categories = [
    { id: 1, name: "Electronics", products: 89, subcategories: 12, status: "active", description: "Electronic devices and gadgets" },
    { id: 2, name: "Wearables", products: 45, subcategories: 6, status: "active", description: "Smart watches and fitness trackers" },
    { id: 3, name: "Accessories", products: 156, subcategories: 8, status: "active", description: "Phone cases, cables, and more" },
    { id: 4, name: "Audio", products: 34, subcategories: 5, status: "active", description: "Headphones, speakers, and earbuds" },
    { id: 5, name: "Home & Living", products: 67, subcategories: 9, status: "active", description: "Smart home devices" },
    { id: 6, name: "Gaming", products: 23, subcategories: 4, status: "inactive", description: "Gaming accessories and peripherals" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-600 mt-0.5">Organize products into categories</p>
        </div>
        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Categories</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">24</p>
            </div>
            <Boxes className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Active Categories</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">21</p>
            </div>
            <Boxes className="h-10 w-10 text-emerald-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">414</p>
            </div>
            <Package className="h-10 w-10 text-slate-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
        </div>
      </Card>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Boxes className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{category.description}</p>
                </div>
              </div>
              <Badge className={`text-xs font-medium ${category.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {category.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mb-3 text-sm">
              <div>
                <span className="text-slate-600">Products: </span>
                <span className="font-semibold text-slate-900">{category.products}</span>
              </div>
              <div>
                <span className="text-slate-600">Subcategories: </span>
                <span className="font-semibold text-slate-900">{category.subcategories}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" className="flex-1 h-8">
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
