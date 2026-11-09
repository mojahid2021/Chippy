"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Search, Edit3, Trash2, Eye, Loader2, Plus, LayoutGrid, List, AlertTriangle, ArrowUpRight, TrendingUp, Tag } from "lucide-react"
import Image from "next/image"
import { CreateProductModal } from "@/components/create-product-modal"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { EditProductModal } from "@/components/edit-product-modal"
import { usePermissions } from "@/hooks/use-permissions"
import { useEntitlements } from "@/hooks/use-entitlements"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description: string
  categoryName: string
  price: number
  currency: string
  image?: string
  isActive: boolean
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export default function ProductsPage() {
  const { canManageCatalog } = usePermissions()
  const { isLimitReached, getUsageInfo } = useEntitlements()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock">("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productDetailsModal, setProductDetailsModal] = useState(false)
  const [productDetailsLoading, setProductDetailsLoading] = useState(false)
  const [editProductModal, setEditProductModal] = useState(false)

  const getImageUrl = (image?: string) => {
    if (!image) return null
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `/api/images/${image}`
  }

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/products?includeInactive=true')
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
      } else {
        setError(data.message || 'Failed to fetch products')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleProductCreated = useCallback(async () => {
    await fetchProducts()
  }, [fetchProducts])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/user/categories?includeInactive=true')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch {
      // Optional
    }
  }, [])

  const fetchProductDetails = useCallback(async (productId: string) => {
    try {
      setProductDetailsLoading(true)
      const response = await fetch(`/api/user/products/${productId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedProduct(data.data)
        setProductDetailsModal(true)
      } else {
        setError(data.message || 'Failed to fetch product details')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setProductDetailsLoading(false)
    }
  }, [])

  const handleViewProductDetails = (product: Product) => {
    fetchProductDetails(product.id)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditProductModal(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This removes it from AI catalog search.`
    )
    if (!confirmed) return

    try {
      const response = await fetch(`/api/user/products/${product.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        await fetchProducts()
        toast({
          variant: "success",
          title: "Product Deleted",
          description: `"${product.name}" was successfully removed.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Failed to delete product',
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to connect. Please try again.",
      })
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [fetchCategories, fetchProducts])

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (statusFilter === "active") return product.isActive
    if (statusFilter === "inactive") return !product.isActive
    if (statusFilter === "low_stock") {
      const stock = product.metadata?.stock
      return typeof stock === 'number' && stock <= 10
    }
    return true
  })

  const totalProducts = products.length
  const activeProducts = products.filter(product => product.isActive).length
  const lowStockProducts = products.filter(product => {
    const stock = product.metadata?.stock
    return typeof stock === 'number' && stock > 0 && stock <= 10
  }).length
  const outOfStockProducts = products.filter(product => {
    const stock = product.metadata?.stock
    return typeof stock === 'number' && stock === 0
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Products here are automatically indexed so your AI agent can quote prices and take orders in Messenger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl bg-card border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {canManageCatalog && !isLimitReached("MAX_PRODUCTS") && (
            <CreateProductModal
              categories={categories}
              onProductCreated={handleProductCreated}
            />
          )}
        </div>
      </div>

      {/* Limit Warning */}
      {isLimitReached("MAX_PRODUCTS") && (
        <div className="p-4 rounded-lg bg-warning-soft border border-warning/30 text-xs text-warning flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>
              Product limit reached ({getUsageInfo("MAX_PRODUCTS").used} / {getUsageInfo("MAX_PRODUCTS").limit}). Upgrade your plan to catalog more items.
            </span>
          </div>
          <Button asChild size="sm" className="bg-marigold hover:bg-marigold/85 text-ink text-xs h-8 px-3 rounded-md">
            <Link href="/dashboard/purchase">Upgrade Plan</Link>
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Catalog</span>
            <div className="w-8 h-8 rounded-md bg-info-soft border border-info/30 text-info flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{totalProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">Available in workspace</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active / Searchable</span>
            <div className="w-8 h-8 rounded-md bg-success-soft border border-success/30 text-success flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success mt-2">{activeProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">Quoted by AI sales bot</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Low Stock (&le;10)</span>
            <div className="w-8 h-8 rounded-md bg-warning-soft border border-warning/30 text-warning flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-warning mt-2">{lowStockProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">Restock recommended</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Out of Stock</span>
            <div className="w-8 h-8 rounded-md bg-destructive-soft border border-destructive/30 text-destructive flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-destructive mt-2">{outOfStockProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">Inventory depleted</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-lg bg-card border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "active", "inactive", "low_stock"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors border ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Loading catalog items...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-destructive-soft border border-destructive/30 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={fetchProducts} size="sm" className="bg-destructive hover:bg-destructive/90 text-white text-xs rounded-md">
            Retry
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 rounded-lg bg-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-lg bg-info-soft border border-info/30 flex items-center justify-center mx-auto text-info">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No products found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm ? "No products match your search. Try adjusting the query." : "Add your first product to train your AI sales representative."}
            </p>
          </div>
          {canManageCatalog && !isLimitReached("MAX_PRODUCTS") && (
            <CreateProductModal
              categories={categories}
              onProductCreated={fetchProducts}
            />
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => {
            const stock = typeof product.metadata?.stock === 'number' ? product.metadata.stock : null
            return (
              <div
                key={product.id}
                className="group rounded-lg bg-card border border-border overflow-hidden hover:border-border transition-colors flex flex-col justify-between"
              >
                {/* Image Aspect Box */}
                <div className="aspect-square relative overflow-hidden bg-background">
                  {getImageUrl(product.image) ? (
                    <Image
                      src={getImageUrl(product.image)!}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                      product.isActive 
                        ? "bg-success-soft border-success/30 text-success" 
                        : "bg-muted border-border text-muted-foreground"
                    }`}>
                      {product.isActive ? "Active" : "Draft"}
                    </span>
                  </div>

                  {product.categoryName && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-card border border-border text-foreground/80">
                        {product.categoryName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {product.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">
                        ৳{product.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stock !== null ? (
                          stock > 0 ? (
                            <span className={stock <= 10 ? "text-warning" : "text-success"}>
                              {stock} in stock
                            </span>
                          ) : (
                            <span className="text-destructive">Out of stock</span>
                          )
                        ) : (
                          "Stock: Unlimited"
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProductDetails(product)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canManageCatalog && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredProducts.map((product) => {
                const stock = typeof product.metadata?.stock === 'number' ? product.metadata.stock : null
                return (
                  <tr key={product.id} className="hover:bg-muted transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {getImageUrl(product.image) ? (
                          <Image
                            src={getImageUrl(product.image)!}
                            alt={product.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-md object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground text-sm">{product.name}</p>
                          <p className="text-muted-foreground text-xs line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-foreground/80">
                      {product.categoryName || "Uncategorized"}
                    </td>

                    <td className="py-3 px-4 font-bold text-foreground">
                      ৳{product.price.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      {stock !== null ? (
                        <span className={stock === 0 ? "text-destructive font-semibold" : stock <= 10 ? "text-warning font-semibold" : "text-success"}>
                          {stock} pcs
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unlimited</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                        product.isActive 
                          ? "bg-success-soft border-success/30 text-success" 
                          : "bg-muted border-border text-muted-foreground"
                      }`}>
                        {product.isActive ? "Active" : "Draft"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProductDetails(product)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {canManageCatalog && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ProductDetailsModal
        product={selectedProduct}
        open={productDetailsModal}
        onOpenChange={setProductDetailsModal}
        loading={productDetailsLoading}
        onProductDeleted={fetchProducts}
        onEditProduct={handleEditProduct}
      />

      <EditProductModal
        product={selectedProduct}
        categories={categories}
        open={editProductModal}
        onOpenChange={setEditProductModal}
        onProductUpdated={fetchProducts}
      />
    </div>
  )
}
