import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Hash, Calendar, ShoppingCart, Receipt, Edit, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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

interface ProductDetailsModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  onProductDeleted?: () => void
  onEditProduct?: (product: Product) => void
}

export function ProductDetailsModal({ product, open, onOpenChange, loading, onProductDeleted, onEditProduct }: ProductDetailsModalProps) {
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const handleDeleteProduct = async () => {
    if (!product) return

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeleteLoading(true)

      const response = await fetch(`/api/user/products/${product.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Close the modal
        onOpenChange(false)
        // Notify parent component to refresh the products list
        onProductDeleted?.()
        // Show success message (you might want to use a toast here)
        alert('Product deleted successfully')
      } else {
        alert(data.message || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Delete product error:', error)
      alert('Network error. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }
  if (!product && !loading) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Product Header */}
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                {getImageUrl(product.image) ? (
                  <Image
                    src={getImageUrl(product.image)!}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-30 h-30 bg-muted rounded-lg flex items-center justify-center border border-border">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
                <p className="text-muted-foreground mb-4">{product.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-lg text-success">
                      Tk {typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
                    </span>
                  </div>

                  <Badge variant="outline">
                    {product.categoryName || 'No Category'}
                  </Badge>

                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    <span>ID: {product.id}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">
                      Tk {typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{product.categoryName || 'No Category'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.metadata && Object.keys(product.metadata).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(product.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                             typeof value === 'number' ? value.toString() :
                             typeof value === 'string' ? value : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No additional information available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {product.description && (
              <>
                <div className="border-t border-border" />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{product.description}</p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => onEditProduct?.(product)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              <Button variant="destructive" onClick={handleDeleteProduct} disabled={deleteLoading}>
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {deleteLoading ? 'Deleting...' : 'Delete Product'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}