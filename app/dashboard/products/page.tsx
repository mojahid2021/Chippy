"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Search, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import Image from "next/image"
import { CreateProductModal } from "@/components/create-product-modal"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { EditProductModal } from "@/components/edit-product-modal"

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
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productDetailsModal, setProductDetailsModal] = useState(false)
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [editProductModal, setEditProductModal] = useState(false)

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = '/api/user/products?includeInactive=true'

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data)
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
    // Refresh the products list after creating a new product
    await fetchProducts();
  }, [fetchProducts]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/user/categories?includeInactive=true')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      }
    } catch {
      // Categories are optional, don't show error
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
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/user/products/${product.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchProducts() // Refresh the list
        alert('Product deleted successfully')
      } else {
        alert(data.message || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Delete product error:', error)
      alert('Network error. Please try again.')
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const stats = [
    { label: "Total Products", value: totalProducts.toString(), color: "text-blue-600" },
    { label: "In Stock", value: activeProducts.toString(), color: "text-emerald-600" },
    { label: "Low Stock", value: lowStockProducts.toString(), color: "text-amber-600" },
    { label: "Out of Stock", value: outOfStockProducts.toString(), color: "text-red-600" },
  ]

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
            <h1 className="text-2xl font-bold text-slate-900">Products</h1>
            <p className="text-sm text-slate-600 mt-0.5">Manage your product catalog</p>
          </div>
        </div>
        <Card className="p-6 border border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
          <Button
            onClick={fetchProducts}
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
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and inventory
            </p>
          </div>
          <CreateProductModal
            categories={categories}
            onProductCreated={handleProductCreated}
          />
        </div>      {/* Stats */}
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
              placeholder="Search products by name or description..."
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-slate-100 relative">
              {getImageUrl(product.image) ? (
                <Image
                  src={getImageUrl(product.image)!}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-16 w-16 text-slate-300" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{product.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {product.currency} {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600">
                    Stock: {typeof product.metadata?.stock === 'number' ? product.metadata.stock : 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="text-xs">
                    {product.categoryName || 'No Category'}
                  </Badge>
                  <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-200">
                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => handleViewProductDetails(product)}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => handleEditProduct(product)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteProduct(product)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <Card className="p-8 border border-slate-200 shadow-sm text-center">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first product.'}
          </p>
          <CreateProductModal
            categories={categories}
            onProductCreated={fetchProducts}
          />
        </Card>
      )}

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
