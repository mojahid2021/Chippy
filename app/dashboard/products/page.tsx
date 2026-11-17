"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  AlertTriangle,
  ArrowUpDown,
  Edit,
  ExternalLink,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  StoreProfile,
  StoreCategory,
  StoreProduct,
  ProductVariant,
  InventoryAdjustReason,
} from "@/lib/types/woombat"

export default function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [products, setProducts] = useState<StoreProduct[]>([])

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [stockFilter, setStockFilter] = useState("ALL")

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null)
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<StoreProduct | null>(null)

  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false)
  const [stockAdjustProductId, setStockAdjustProductId] = useState("")
  const [stockAdjustVariantId, setStockAdjustVariantId] = useState("")
  const [stockAdjustChange, setStockAdjustChange] = useState<number>(0)
  const [stockAdjustReason, setStockAdjustReason] = useState<InventoryAdjustReason>("RESTOCK")
  const [stockAdjustNote, setStockAdjustNote] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const [productForm, setProductForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    compareAtPrice: 0,
    costPrice: 0,
    sku: "",
    barcode: "",
    trackInventory: true,
    inventoryQuantity: 10,
    lowStockThreshold: 5,
    categoryId: "",
    imagesText: "",
    isActive: true,
    variants: [] as ProductVariant[],
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [storeRes, catRes, prodRes] = await Promise.all([
        fetch("/api/v1/stores/me").catch(() => null),
        fetch("/api/v1/stores/me/categories").catch(() => null),
        fetch("/api/v1/stores/me/products?limit=100").catch(() => null),
      ])

      if (storeRes?.ok) {
        const json = await storeRes.json()
        setStore(json.data)
      }
      if (catRes?.ok) {
        const json = await catRes.json()
        setCategories(Array.isArray(json.data) ? json.data : [])
      }
      if (prodRes?.ok) {
        const json = await prodRes.json()
        setProducts(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error("Load products error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const formatMoney = (amount: number, curr = store?.currency || "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(amount || 0)
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setProductForm({
      title: "",
      slug: "",
      description: "",
      price: 29.99,
      compareAtPrice: 0,
      costPrice: 0,
      sku: "",
      barcode: "",
      trackInventory: true,
      inventoryQuantity: 20,
      lowStockThreshold: 5,
      categoryId: categories[0]?.id || "",
      imagesText: "",
      isActive: true,
      variants: [],
    })
    setProductModalOpen(true)
  }

  const openEditProduct = (p: StoreProduct) => {
    setEditingProduct(p)
    setProductForm({
      title: p.title || "",
      slug: p.slug || "",
      description: p.description || "",
      price: p.price || 0,
      compareAtPrice: p.compareAtPrice || 0,
      costPrice: p.costPrice || 0,
      sku: p.sku || "",
      barcode: p.barcode || "",
      trackInventory: p.trackInventory ?? true,
      inventoryQuantity: p.inventoryQuantity ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      categoryId: p.categoryId || "",
      imagesText: (p.images || []).join("\n"),
      isActive: p.isActive ?? true,
      variants: p.variants || [],
    })
    setProductModalOpen(true)
  }

  const [uploadingProductImage, setUploadingProductImage] = useState(false)

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProductImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("assetType", "product_image")

      const res = await fetch("/api/v1/stores/me/media/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to upload image")

      const newUrl = data.data?.url
      if (newUrl) {
        setProductForm((prev) => ({
          ...prev,
          imagesText: prev.imagesText.trim() ? `${prev.imagesText.trim()}\n${newUrl}` : newUrl,
        }))
        toast({ title: "Image uploaded", description: "Image added to product gallery." })
      }
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Error uploading product image",
        variant: "destructive",
      })
    } finally {
      setUploadingProductImage(false)
      e.target.value = ""
    }
  }

  const [syncingVectors, setSyncingVectors] = useState(false)

  const handleSyncVisualSearch = async () => {
    setSyncingVectors(true)
    try {
      const res = await fetch("/api/v1/stores/me/visual-search/sync", {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to sync visual search vectors")
      toast({
        title: "Visual Search Synced",
        description: `Successfully synchronized ${data.data?.indexedCount ?? 0} products into the Qdrant vector database.`,
      })
    } catch (err: unknown) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Error syncing visual search vectors",
        variant: "destructive",
      })
    } finally {
      setSyncingVectors(false)
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.title.trim() || !productForm.slug.trim()) {
      toast({ title: "Validation error", description: "Title and slug are required.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const images = productForm.imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        title: productForm.title,
        slug: productForm.slug,
        description: productForm.description,
        price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : null,
        costPrice: productForm.costPrice ? Number(productForm.costPrice) : null,
        sku: productForm.sku || undefined,
        barcode: productForm.barcode || undefined,
        trackInventory: productForm.trackInventory,
        inventoryQuantity: Number(productForm.inventoryQuantity),
        lowStockThreshold: Number(productForm.lowStockThreshold),
        categoryId: productForm.categoryId || null,
        images,
        isActive: productForm.isActive,
        variants: productForm.variants,
      }

      const url = editingProduct
        ? `/api/v1/stores/me/products/${editingProduct.id}`
        : "/api/v1/stores/me/products"
      const method = editingProduct ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save product")

      toast({
        title: editingProduct ? "Product updated" : "Product created",
        description: `"${data.data.title}" saved successfully.`,
      })
      setProductModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error saving product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/products/${productToDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete product")
      }
      toast({ title: "Product deleted", description: `"${productToDelete.title}" removed.` })
      setDeleteProductModalOpen(false)
      setProductToDelete(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error deleting product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockAdjustProductId) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/stores/me/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: stockAdjustProductId,
          variantId: stockAdjustVariantId || undefined,
          change: Number(stockAdjustChange),
          reason: stockAdjustReason,
          note: stockAdjustNote || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to adjust inventory")

      toast({ title: "Inventory updated", description: `Stock adjusted by ${stockAdjustChange >= 0 ? "+" : ""}${stockAdjustChange}.` })
      setAdjustStockModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error adjusting stock", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = categoryFilter === "ALL" || p.categoryId === categoryFilter
    const lowStock = p.inventoryQuantity <= (p.lowStockThreshold || 5)
    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "IN_STOCK" && p.inventoryQuantity > 0) ||
      (stockFilter === "LOW_STOCK" && lowStock && p.inventoryQuantity > 0) ||
      (stockFilter === "OUT_OF_STOCK" && p.inventoryQuantity === 0)
    return matchesSearch && matchesCat && matchesStock
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description="Manage catalog items, pricing, multi-variant options, and inventory tracking."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncVisualSearch}
              disabled={syncingVectors || loading}
              title="Synchronize product visual vector embeddings into Qdrant for Messenger and Storefront reverse image search"
            >
              <Sparkles className={cn("size-3.5 mr-1.5 text-brand", syncingVectors && "animate-spin")} />
              {syncingVectors ? "Syncing Qdrant..." : "Sync Visual Search"}
            </Button>
            {store && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5 mr-1.5" />
                  View Storefront
                </Link>
              </Button>
            )}
            <Button size="sm" onClick={openCreateProduct}>
              <Plus className="size-3.5 mr-1.5" />
              Add Product
            </Button>
          </div>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <NativeSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-44"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-40"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </NativeSelect>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title="No products found"
          body={
            products.length === 0
              ? "Your catalog is empty. Add your first product to begin selling."
              : "No products matched your search or filter."
          }
          action={
            products.length === 0 ? (
              <Button size="sm" onClick={openCreateProduct}>
                <Plus className="size-3.5 mr-1" /> Add First Product
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock Quantity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((p) => {
                const lowStock = p.inventoryQuantity <= (p.lowStockThreshold || 5)
                const categoryName = categories.find((c) => c.id === p.categoryId)?.name
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="size-10 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="grid size-10 place-items-center rounded-lg bg-secondary text-muted-foreground border">
                            <Package className="size-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{p.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {categoryName && <span>{categoryName}</span>}
                            {p.variants && p.variants.length > 0 && (
                              <span>• {p.variants.length} variants</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{formatMoney(p.price)}</span>
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">
                          {formatMoney(p.compareAtPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          p.inventoryQuantity === 0
                            ? "text-rose-600 font-semibold"
                            : lowStock
                            ? "text-amber-600"
                            : "text-foreground"
                        )}
                      >
                        {p.inventoryQuantity} units
                        {lowStock && <AlertTriangle className="size-3 text-amber-500" />}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isActive ? "default" : "outline"}>
                        {p.isActive ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStockAdjustProductId(p.id)
                            setStockAdjustVariantId("")
                            setStockAdjustChange(0)
                            setStockAdjustReason("RESTOCK")
                            setStockAdjustNote("")
                            setAdjustStockModalOpen(true)
                          }}
                          title="Adjust Stock"
                        >
                          <ArrowUpDown className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditProduct(p)}>
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => {
                            setProductToDelete(p)
                            setDeleteProductModalOpen(true)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT DIALOG */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              Configure product details, pricing, variants, and stock tracking.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-title">Title</Label>
                <Input
                  id="p-title"
                  value={productForm.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setProductForm((prev) => ({
                      ...prev,
                      title,
                      slug: editingProduct ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    }))
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-slug">Slug</Label>
                <Input
                  id="p-slug"
                  value={productForm.slug}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                rows={2}
                value={productForm.description}
                onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price ({store?.currency || "USD"})</Label>
                <Input
                  id="p-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-comp">Compare Price</Label>
                <Input
                  id="p-comp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.compareAtPrice || ""}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, compareAtPrice: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sku">SKU Code</Label>
                <Input
                  id="p-sku"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-cat">Category</Label>
                <NativeSelect
                  id="p-cat"
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stock Quantity</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={productForm.inventoryQuantity}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, inventoryQuantity: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-thresh">Low Stock Threshold</Label>
                <Input
                  id="p-thresh"
                  type="number"
                  min="0"
                  value={productForm.lowStockThreshold}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="p-images">Product Images</Label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-brand hover:underline">
                  <Upload className="size-3.5" />
                  {uploadingProductImage ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingProductImage}
                    onChange={handleProductImageUpload}
                  />
                </label>
              </div>
              <Textarea
                id="p-images"
                placeholder="https://... (one per line, or click Upload Image above)"
                rows={2}
                value={productForm.imagesText}
                onChange={(e) => setProductForm((prev) => ({ ...prev, imagesText: e.target.value }))}
              />
            </div>

            {/* Variants builder */}
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-sm">Product Variants</h5>
                  <p className="text-2xs text-muted-foreground">Sizes, colors, or materials with individual inventory.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVar: ProductVariant = {
                      title: `Option ${productForm.variants.length + 1}`,
                      sku: `${productForm.sku || "PROD"}-${productForm.variants.length + 1}`,
                      inventoryQuantity: 5,
                    }
                    setProductForm((prev) => ({ ...prev, variants: [...prev.variants, newVar] }))
                  }}
                >
                  <Plus className="size-3 mr-1" /> Add Variant
                </Button>
              </div>

              {productForm.variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Size M / Black"
                    value={v.title}
                    onChange={(e) => {
                      const updated = [...productForm.variants]
                      updated[idx].title = e.target.value
                      setProductForm((prev) => ({ ...prev, variants: updated }))
                    }}
                    className="flex-1 text-xs"
                  />
                  <Input
                    placeholder="SKU"
                    value={v.sku || ""}
                    onChange={(e) => {
                      const updated = [...productForm.variants]
                      updated[idx].sku = e.target.value
                      setProductForm((prev) => ({ ...prev, variants: updated }))
                    }}
                    className="w-28 text-xs font-mono"
                  />
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={v.inventoryQuantity}
                    onChange={(e) => {
                      const updated = [...productForm.variants]
                      updated[idx].inventoryQuantity = Number(e.target.value)
                      setProductForm((prev) => ({ ...prev, variants: updated }))
                    }}
                    className="w-20 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 p-1"
                    onClick={() => {
                      const updated = productForm.variants.filter((_, i) => i !== idx)
                      setProductForm((prev) => ({ ...prev, variants: updated }))
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium text-sm">Active For Sale</p>
                <p className="text-2xs text-muted-foreground">Visible on public storefront</p>
              </div>
              <Switch
                checked={productForm.isActive}
                onCheckedChange={(checked) => setProductForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE PRODUCT CONFIRMATION */}
      <Dialog open={deleteProductModalOpen} onOpenChange={setDeleteProductModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{productToDelete?.title}&quot; from your catalog?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteProductModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADJUST STOCK MODAL */}
      <Dialog open={adjustStockModalOpen} onOpenChange={setAdjustStockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory Stock</DialogTitle>
            <DialogDescription>
              Atomically increment or decrement stock level with reason audit logging.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustInventory} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="a-prod">Product</Label>
              <NativeSelect
                id="a-prod"
                value={stockAdjustProductId}
                onChange={(e) => {
                  setStockAdjustProductId(e.target.value)
                  setStockAdjustVariantId("")
                }}
                required
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.inventoryQuantity} in stock)
                  </option>
                ))}
              </NativeSelect>
            </div>

            {(() => {
              const selectedProd = products.find((p) => p.id === stockAdjustProductId)
              if (selectedProd?.variants && selectedProd.variants.length > 0) {
                return (
                  <div className="space-y-1.5">
                    <Label htmlFor="a-variant">Variant (Optional)</Label>
                    <NativeSelect
                      id="a-variant"
                      value={stockAdjustVariantId}
                      onChange={(e) => setStockAdjustVariantId(e.target.value)}
                    >
                      <option value="">Base Product Stock</option>
                      {selectedProd.variants.map((v) => (
                        <option key={v.id || v.title} value={v.id || v.title}>
                          {v.title} ({v.inventoryQuantity} in stock)
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                )
              }
              return null
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="a-change">Quantity Change (+/-)</Label>
                <Input
                  id="a-change"
                  type="number"
                  value={stockAdjustChange}
                  onChange={(e) => setStockAdjustChange(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-reason">Reason</Label>
                <NativeSelect
                  id="a-reason"
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value as InventoryAdjustReason)}
                >
                  <option value="RESTOCK">RESTOCK</option>
                  <option value="CORRECTION">CORRECTION</option>
                  <option value="SALE">SALE</option>
                  <option value="RETURN">RETURN</option>
                  <option value="DAMAGE">DAMAGE</option>
                </NativeSelect>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="a-note">Note</Label>
              <Input
                id="a-note"
                placeholder="Audit note"
                value={stockAdjustNote}
                onChange={(e) => setStockAdjustNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAdjustStockModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
