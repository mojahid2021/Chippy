"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface CreateCategoryModalProps {
  categories: Category[]
  onCategoryCreated: () => void
}

interface CategoryFormData {
  name: string
  description: string
  parentId: string
  imageFile: File | null
  isActive: boolean
  sortOrder: number
  tags: string[]
  newTag: string
}

export function CreateCategoryModal({ categories, onCategoryCreated }: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentId: 'none',
    imageFile: null,
    isActive: true,
    sortOrder: 0, // Default sort order value
    tags: [],
    newTag: ''
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up image preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required field",
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

      // Build metadata object with tags
      const metadata: Record<string, unknown> = {}
      if (formData.tags.length > 0) {
        metadata.tags = formData.tags
      }

      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId === 'none' ? null : formData.parentId, // Convert 'none' to null for top-level categories
        image: image,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
        metadata
      }

      const response = await fetch('/api/user/categories', {
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
          description: "Category created successfully"
        })
        setOpen(false)
        resetForm()
        onCategoryCreated()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create category",
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: 'none',
      imageFile: null,
      isActive: true,
      sortOrder: 0, // Default sort order value
      tags: [],
      newTag: ''
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

  const addTag = () => {
    const tag = formData.newTag.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        newTag: ''
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 bg-primary hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Electronics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Electronic devices and gadgets"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, parentId: value }))}
              defaultValue="none"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top Level)</SelectItem>
                {categories
                  .filter(category => category.isActive) // Only show active categories as potential parents
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageFile">Category Image</Label>

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
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground">Select image</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active Category</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="newTag"
                  value={formData.newTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                  variant="outline"
                  disabled={!formData.newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-info-soft text-info text-sm rounded-md"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-primary hover:text-primary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}