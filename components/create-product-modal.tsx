import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Plus, Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"

interface Category {
  id: string
  name: string
  isActive: boolean
}

interface CreateProductModalProps {
  categories: Category[]
  onProductCreated: () => void
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

export function CreateProductModal({ categories, onProductCreated }: CreateProductModalProps) {
  const [open, setOpen] = useState(false)
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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      let image = ''

      // Upload file if selected
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
        sortOrder: 0,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      }

      const response = await fetch('/api/user/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Product created successfully"
        })
        setOpen(false)
        resetForm()
        onProductCreated()
      } else if (data.code === 'PLAN_LIMIT_REACHED') {
        toast({
          title: "Plan limit reached",
          description: (
            <span>
              {data.error || data.message || "You've reached your plan's product limit."}{" "}
              <Link href="/dashboard/purchase" className="underline font-medium">
                Upgrade your plan
              </Link>{" "}
              to add more products.
            </span>
          ),
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create product",
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
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 bg-primary hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Gaming Laptop X1"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="High-performance gaming laptop with RTX 4070"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category</Label>
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
            <Label htmlFor="imageFile">Product Image</Label>

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
                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview)
                  }
                  const previewUrl = URL.createObjectURL(file)
                  setImagePreview(previewUrl)
                } else {
                  // Clean up preview if no file selected
                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview)
                  }
                  setImagePreview(null)
                }
              }}
              className="hidden"
            />

            {/* Custom image selection area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-info-soft transition-colors"
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <div className="relative w-full max-w-xs mx-auto h-24 border border-border rounded-md overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Selected image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Select product image</p>
                </div>
              )}
            </div>
          </div>

          <Card className="p-4 border border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Product Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="TechCorp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="X1-2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="specifications">Specifications (JSON)</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                placeholder='{"cpu": "Intel i7-13700H", "ram": "32GB", "storage": "1TB SSD"}'
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Enter specifications as JSON object or leave empty</p>
            </div>
          </Card>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active Product</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}