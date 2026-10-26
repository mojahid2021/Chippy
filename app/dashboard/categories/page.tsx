"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Boxes, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  Loader2, 
  Plus, 
  FolderTree, 
  Tag, 
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react"
import Image from "next/image"
import { CreateCategoryModal } from "@/components/create-category-modal"
import { EditCategoryModal } from "@/components/edit-category-modal"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"
import { useEntitlements } from "@/hooks/use-entitlements"
import Link from "next/link"

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
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const { canManageCatalog } = usePermissions()
  const { isLimitReached, getUsageInfo } = useEntitlements()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getImageUrl = (image?: string) => {
    if (!image) return null
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `/api/images/${image}`
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/categories?includeInactive=true')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data || [])
      } else {
        setError(data.message || 'Failed to fetch categories')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"? Products inside will become uncategorized.`)) {
      return
    }

    try {
      setDeletingId(category.id)
      const response = await fetch(`/api/user/categories/${category.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Category removed successfully" })
        fetchCategories()
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete category", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-1.5">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Storefront Taxonomies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Product Categories</h1>
          <p className="text-sm text-slate-400">
            Structure your catalog into collections to help your AI agent recommend relevant alternatives.
          </p>
        </div>

        {canManageCatalog && !isLimitReached("MAX_CATEGORIES") && (
          <CreateCategoryModal
            categories={categories}
            onCategoryCreated={fetchCategories}
          />
        )}
      </div>

      {/* Plan limit warning */}
      {isLimitReached("MAX_CATEGORIES") && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Category limit reached ({getUsageInfo("MAX_CATEGORIES").used} / {getUsageInfo("MAX_CATEGORIES").limit}). Upgrade your plan to create more collections.
            </span>
          </div>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 rounded-md">
            <Link href="/dashboard/purchase">Upgrade</Link>
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Categories</span>
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalCategories}</p>
          <p className="text-[11px] text-slate-400 mt-1">Catalog divisions</p>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Collections</span>
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{activeCategories}</p>
          <p className="text-[11px] text-slate-400 mt-1">Visible to AI recommendations</p>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Categorized Products</span>
            <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalProducts}</p>
          <p className="text-[11px] text-slate-400 mt-1">Assigned products</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs text-slate-400">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <p className="text-sm text-rose-300">{error}</p>
          <Button onClick={fetchCategories} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-md">
            Retry
          </Button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
            <Boxes className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No categories found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {searchTerm ? "No category matches your search filter." : "Create your first category (e.g. Panjabi, Saree, Western) to organize your catalog."}
            </p>
          </div>
          {canManageCatalog && !isLimitReached("MAX_CATEGORIES") && (
            <CreateCategoryModal
              categories={categories}
              onCategoryCreated={fetchCategories}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="p-5 rounded-lg bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {getImageUrl(category.image) ? (
                      <Image
                        src={getImageUrl(category.image)!}
                        alt={category.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Boxes className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{category.name}</h3>
                    {category.parentId && (
                      <p className="text-[11px] text-slate-400">
                        Subcategory of: <span className="text-cyan-300">{categories.find(c => c.id === category.parentId)?.name || category.parentId}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Badge className={`text-[10px] font-semibold border ${
                  category.isActive
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 border-white/10 text-slate-400"
                }`}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {category.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{category.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Products</span>
                  <p className="text-white font-bold text-sm">
                    {typeof category.metadata?.products === 'number' ? category.metadata.products : 0}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Subcategories</span>
                  <p className="text-white font-bold text-sm">{getSubcategoriesCount(category.id)}</p>
                </div>
              </div>

              {canManageCatalog && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs h-8"
                    onClick={() => {
                      setEditingCategory(category)
                      setEditModalOpen(true)
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Edit Collection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => handleDeleteCategory(category)}
                    disabled={deletingId === category.id}
                  >
                    {deletingId === category.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditCategoryModal
        category={editingCategory}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onCategoryUpdated={fetchCategories}
      />
    </div>
  )
}
