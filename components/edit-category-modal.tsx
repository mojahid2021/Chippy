"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  description: string
  parentId: string | null
  isActive: boolean
}

interface EditCategoryModalProps {
  category: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryUpdated: () => void
}

export function EditCategoryModal({ category, open, onOpenChange, onCategoryUpdated }: EditCategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true })
  const { toast } = useToast()

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return

    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Name is required", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/user/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Category updated successfully" })
        onOpenChange(false)
        onCategoryUpdated()
      } else {
        toast({ title: "Error", description: data.message || "Failed to update category", variant: "destructive" })
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Category Name *</Label>
            <Input
              id="edit-category-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category-description">Description</Label>
            <Textarea
              id="edit-category-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-category-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="edit-category-isActive">Active Category</Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
