"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Boxes, Search, Edit, Trash2, Package, Loader2 } from "lucide-react"
import Image from "next/image"
import { CreateCategoryModal } from "@/components/create-category-modal"

interface Category {
  id: string
  userId: string
  name: string
  description: string
  parentId: string | null
  image?: string
  isActive: boolean
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/categories?includeInactive=true')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      } else {
        setError(data.message || 'Failed to fetch categories')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCategories = categories.length
  const activeCategories = categories.filter(cat => cat.isActive).length
  const totalProducts = categories.reduce((sum, cat) => {
    const products = cat.metadata?.products
    return sum + (typeof products === 'number' ? products : 0)
  }, 0)

  const getSubcategoriesCount = (categoryId: string) => {
    return categories.filter(cat => cat.parentId === categoryId).length
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
            <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
            <p className="text-sm text-slate-600 mt-0.5">Organize products into categories</p>
          </div>
        </div>
        <Card className="p-6 border border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
          <Button
            onClick={fetchCategories}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-600 mt-0.5">Organize products into categories</p>
        </div>
        <CreateCategoryModal
          categories={categories}
          onCategoryCreated={fetchCategories}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Categories</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCategories}</p>
            </div>
            <Boxes className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Active Categories</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCategories}</p>
            </div>
            <Boxes className="h-10 w-10 text-emerald-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalProducts}</p>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        {filteredCategories.map((category) => (
          <Card key={category.id} className="p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  {getImageUrl(category.image) ? (
                    <Image
                      src={getImageUrl(category.image)!}
                      alt={category.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <Boxes className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{category.description}</p>
                  {category.parentId && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Parent: {categories.find(c => c.id === category.parentId)?.name || category.parentId}
                    </p>
                  )}
                </div>
              </div>
              <Badge className={`text-xs font-medium ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {category.isActive ? 'active' : 'inactive'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mb-3 text-sm">
              <div>
                <span className="text-slate-600">Products: </span>
                <span className="font-semibold text-slate-900">
                  {typeof category.metadata?.products === 'number' ? category.metadata.products : 0}
                </span>
              </div>
              <div>
                <span className="text-slate-600">Subcategories: </span>
                <span className="font-semibold text-slate-900">{getSubcategoriesCount(category.id)}</span>
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

      {filteredCategories.length === 0 && !loading && (
        <Card className="p-8 border border-slate-200 shadow-sm text-center">
          <Boxes className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first category.'}
          </p>
          <CreateCategoryModal
            categories={categories}
            onCategoryCreated={fetchCategories}
          />
        </Card>
      )}
    </div>
  )
}
