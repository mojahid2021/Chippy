"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Edit,
  FolderTree,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type { StoreCategory } from "@/lib/types/woombat"

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<StoreCategory[]>([])

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<StoreCategory | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    parentId: "",
  })

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/stores/me/categories")
      if (res.ok) {
        const json = await res.json()
        setCategories(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error("Load categories error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Validation error", description: "Name and slug are required.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        parentId: form.parentId || null,
      }

      const url = editingCategory
        ? `/api/v1/stores/me/categories/${editingCategory.id}`
        : "/api/v1/stores/me/categories"
      const method = editingCategory ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save category")

      toast({
        title: editingCategory ? "Category updated" : "Category created",
        description: `Category "${data.data.name}" saved.`,
      })
      setCategoryModalOpen(false)
      await loadCategories()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save category", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/categories/${categoryToDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete category")
      }
      toast({ title: "Category deleted", description: `"${categoryToDelete.name}" removed.` })
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
      await loadCategories()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete category", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        description="Organize your store catalog into browseable sections with hierarchical nesting."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadCategories()} disabled={loading}>
              <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingCategory(null)
                setForm({ name: "", slug: "", description: "", sortOrder: 0, parentId: "" })
                setCategoryModalOpen(true)
              }}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Category
            </Button>
          </div>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="size-5" />}
          title="No categories created yet"
          body="Create categories like Apparel, Electronics, or Home Goods to help customers find products."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingCategory(null)
                setForm({ name: "", slug: "", description: "", sortOrder: 0, parentId: "" })
                setCategoryModalOpen(true)
              }}
            >
              <Plus className="size-3.5 mr-1" /> Add First Category
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/{c.slug}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.description || "—"}</td>
                  <td className="px-4 py-3 text-xs">{c.sortOrder ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(c)
                          setForm({
                            name: c.name,
                            slug: c.slug,
                            description: c.description || "",
                            sortOrder: c.sortOrder ?? 0,
                            parentId: c.parentId || "",
                          })
                          setCategoryModalOpen(true)
                        }}
                      >
                        <Edit className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => {
                          setCategoryToDelete(c)
                          setDeleteModalOpen(true)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>Create hierarchy groupings for your store products.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                placeholder="Outerwear"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: editingCategory ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  }))
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-slug">URL Slug</Label>
              <Input
                id="c-slug"
                placeholder="outerwear"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                placeholder="Jackets, coats, and winter apparel"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-sort">Sort Order</Label>
                <Input
                  id="c-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-parent">Parent Category</Label>
                <NativeSelect
                  id="c-parent"
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                >
                  <option value="">None (Top-Level)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </NativeSelect>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{categoryToDelete?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
