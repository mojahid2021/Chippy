import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

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

interface EditProductModalProps {
  product: Product | null
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated: () => void
}

interface ProductFormData {
  name: string
  description: string
  categoryName: string
  price: string
  currency: string
  imageFile: File | null
  isActive: boolean
  // Metadata fields
  brand: string
  model: string
  stock: string
  specifications: string
}

export function EditProductModal({ product, categories, open, onOpenChange, onProductUpdated }: EditProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryName: 'none',
    price: '',
    currency: 'BDT',
    imageFile: null,
    isActive: true,
    brand: '',
    model: '',
    stock: '',
    specifications: ''
  })

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

  // Populate form when product changes
  useEffect(() => {
    if (product) {
      // Find the category ID from category name
      const category = categories.find(cat => cat.name === product.categoryName)
      const categoryId = category?.id || 'none'

      // Extract metadata fields
      const metadata = product.metadata || {}
      const brand = typeof metadata.brand === 'string' ? metadata.brand : ''
      const model = typeof metadata.model === 'string' ? metadata.model : ''
      const stock = typeof metadata.stock === 'number' ? metadata.stock.toString() : ''
      const specifications = metadata.specifications ?
        (typeof metadata.specifications === 'string' ? metadata.specifications : JSON.stringify(metadata.specifications, null, 2)) : ''

      setFormData({
        name: product.name,
        description: product.description || '',
        categoryName: categoryId,
        price: product.price.toString(),
        currency: product.currency,
        imageFile: null, // Don't pre-populate file input
        isActive: product.isActive,
        brand,
        model,
        stock,
        specifications
      })

      // Set image preview if product has an image
      if (product.image) {
        setImagePreview(getImageUrl(product.image))
      } else {
        setImagePreview(null)
      }
    }
  }, [product, categories])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryName: 'none',
      price: '',
      currency: 'BDT',
      imageFile: null,
      isActive: true,
      brand: '',
      model: '',
      stock: '',
      specifications: ''
    })
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Clean up image preview
    if (imagePreview && !product?.image) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast({
        title: "Validation Error",
        description: "Valid price is required (must be >= 0)",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      let image = product.image // Keep existing image by default

      // Upload file if a new file is selected
      if (formData.imageFile) {
        // Create form data for file upload
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.imageFile)

        // Upload the file
        const uploadResponse = await fetch('/api/user/media', {
          method: 'POST',
          body: uploadFormData
        })

        const uploadData = await uploadResponse.json()

        if (!uploadData.success) {
          throw new Error(uploadData.message || 'Failed to upload image')
        }

        // Use the uploaded file URL
        image = uploadData.data.filename
      }

      // Build metadata object
      const metadata: Record<string, unknown> = {}
      if (formData.brand.trim()) metadata.brand = formData.brand.trim()
      if (formData.model.trim()) metadata.model = formData.model.trim()
      if (formData.stock && !isNaN(parseInt(formData.stock))) {
        metadata.stock = parseInt(formData.stock)
      }

      // Parse specifications if provided
      if (formData.specifications.trim()) {
        try {
          const specs = JSON.parse(formData.specifications)
          metadata.specifications = specs
        } catch {
          // If JSON parsing fails, store as string
          metadata.specifications = formData.specifications.trim()
        }
      }

      // Find the selected category name
      const selectedCategory = categories.find(cat => cat.id === formData.categoryName)
      const categoryName = selectedCategory?.name

      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryName: formData.categoryName === 'none' ? undefined : categoryName,
        price: parseFloat(formData.price),
        currency: formData.currency,
        image: image || undefined,
        isActive: formData.isActive,
        sortOrder: product.sortOrder,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      }

      const response = await fetch(`/api/user/products/${product.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Product updated successfully"
        })
        onOpenChange(false)
        resetForm()
        onProductUpdated()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update product",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Gaming Laptop X1"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price *</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="25000.00"
                  required
                />
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT">BDT (Tk)</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="High-performance gaming laptop with RTX 4070"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-categoryName">Category</Label>
              <Select
                value={formData.categoryName}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories
                    .filter(category => category.isActive)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-imageFile">Product Image</Label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0] || null

                // Validate file type if a file is selected
                if (file) {
                  const allowedTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp'
                  ]

                  if (!allowedTypes.includes(file.type)) {
                    toast({
                      title: "Invalid File Type",
                      description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
                      variant: "destructive"
                    })
                    // Clear the input
                    e.target.value = ''
                    return
                  }
                }

                setFormData(prev => ({ ...prev, imageFile: file }))

                // Create preview URL for the selected file
                if (file) {
                  // Clean up previous preview URL
                  if (imagePreview && !product?.image) {
                    URL.revokeObjectURL(imagePreview)
                  }
                  const previewUrl = URL.createObjectURL(file)
                  setImagePreview(previewUrl)
                } else {
                  // Reset to original image or null
                  setImagePreview(product?.image ? getImageUrl(product.image) : null)
                }
              }}
              className="hidden"
            />

            {/* Custom image selection area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <div className="relative w-full max-w-xs mx-auto h-24 border border-gray-200 rounded-md overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Product image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600">Select product image</p>
                </div>
              )}
            </div>
          </div>

          <Card className="p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Product Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-brand">Brand</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="TechCorp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="X1-2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stock">Stock Quantity</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="edit-specifications">Specifications (JSON)</Label>
              <Textarea
                id="edit-specifications"
                value={formData.specifications}
                onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                placeholder='{"cpu": "Intel i7-13700H", "ram": "32GB", "storage": "1TB SSD"}'
                rows={3}
              />
              <p className="text-xs text-gray-500">Enter specifications as JSON object or leave empty</p>
            </div>
          </Card>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="edit-isActive">Active Product</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}