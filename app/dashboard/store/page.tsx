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
  Check,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  FolderTree,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Store as StoreIcon,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  StoreProfile,
  StoreAnalytics,
  StoreCategory,
  StoreProduct,
  ProductVariant,
  StoreOrder,
  OrderStatus,
  InventoryLog,
  StoreCoupon,
  DiscountType,
  InventoryAdjustReason,
} from "@/lib/types/woombat"

type StoreTab = "products" | "categories" | "orders" | "inventory" | "coupons" | "settings"

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; badgeClass: string }> = {
  PENDING: { label: "Pending", badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  PROCESSING: { label: "Processing", badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  SHIPPED: { label: "Shipped", badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  DELIVERED: { label: "Delivered", badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  CANCELLED: { label: "Cancelled", badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
}

export default function MerchantStorePage() {
  const [activeTab, setActiveTab] = useState<StoreTab>("products")
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null)
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([])
  const [coupons, setCoupons] = useState<StoreCoupon[]>([])

  // Search & Filters
  const [productSearch, setProductSearch] = useState("")
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL")
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL")

  // Modals
  const [createStoreModalOpen, setCreateStoreModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null)
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<StoreProduct | null>(null)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null)
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<StoreCategory | null>(null)

  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [updateOrderStatusModalOpen, setUpdateOrderStatusModalOpen] = useState(false)
  const [orderToUpdate, setOrderToUpdate] = useState<StoreOrder | null>(null)
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>("PROCESSING")
  const [orderTrackingNumber, setOrderTrackingNumber] = useState("")

  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false)
  const [stockAdjustProductId, setStockAdjustProductId] = useState("")
  const [stockAdjustVariantId, setStockAdjustVariantId] = useState("")
  const [stockAdjustChange, setStockAdjustChange] = useState<number>(0)
  const [stockAdjustReason, setStockAdjustReason] = useState<InventoryAdjustReason>("RESTOCK")
  const [stockAdjustNote, setStockAdjustNote] = useState("")

  const [couponModalOpen, setCouponModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<StoreCoupon | null>(null)
  const [deleteCouponModalOpen, setDeleteCouponModalOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<StoreCoupon | null>(null)

  const [uploadingMedia, setUploadingMedia] = useState<"logo" | "banner" | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Form states
  const [storeForm, setStoreForm] = useState({
    name: "",
    slug: "",
    description: "",
    currency: "USD",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    country: "USA",
    isActive: true,
    isPublished: true,
  })

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

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    parentId: "",
  })

  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as DiscountType,
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 100,
    isActive: true,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const storeRes = await fetch("/api/v1/stores/me")
      if (storeRes.ok) {
        const storeJson = await storeRes.json()
        const storeProfile: StoreProfile = storeJson.data
        setStore(storeProfile)
        setStoreForm({
          name: storeProfile.name || "",
          slug: storeProfile.slug || "",
          description: storeProfile.description || "",
          currency: storeProfile.currency || "USD",
          contactEmail: storeProfile.contactEmail || "",
          contactPhone: storeProfile.contactPhone || "",
          address: storeProfile.address || "",
          city: storeProfile.city || "",
          country: storeProfile.country || "USA",
          isActive: storeProfile.isActive ?? true,
          isPublished: storeProfile.isPublished ?? true,
        })

        // Fetch dependent data in parallel
        const [analyticsRes, catRes, prodRes, orderRes, invRes, coupRes] = await Promise.all([
          fetch("/api/v1/stores/me/analytics").catch(() => null),
          fetch("/api/v1/stores/me/categories").catch(() => null),
          fetch("/api/v1/stores/me/products?limit=100").catch(() => null),
          fetch("/api/v1/stores/me/orders?limit=100").catch(() => null),
          fetch("/api/v1/stores/me/inventory/logs?limit=50").catch(() => null),
          fetch("/api/v1/stores/me/coupons").catch(() => null),
        ])

        if (analyticsRes?.ok) {
          const json = await analyticsRes.json()
          setAnalytics(json.data)
        }
        if (catRes?.ok) {
          const json = await catRes.json()
          setCategories(Array.isArray(json.data) ? json.data : [])
        }
        if (prodRes?.ok) {
          const json = await prodRes.json()
          setProducts(Array.isArray(json.data) ? json.data : [])
        }
        if (orderRes?.ok) {
          const json = await orderRes.json()
          setOrders(Array.isArray(json.data) ? json.data : [])
        }
        if (invRes?.ok) {
          const json = await invRes.json()
          setInventoryLogs(Array.isArray(json.data) ? json.data : [])
        }
        if (coupRes?.ok) {
          const json = await coupRes.json()
          setCoupons(Array.isArray(json.data) ? json.data : [])
        }
      } else {
        setStore(null)
      }
    } catch (err) {
      console.error("Load store data error:", err)
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

  const cleanStorePayload = (form: typeof storeForm) => {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      currency: form.currency || "USD",
      isActive: form.isActive,
      isPublished: form.isPublished,
    }

    if (form.description?.trim()) payload.description = form.description.trim()
    if (form.contactEmail?.trim()) payload.contactEmail = form.contactEmail.trim()
    if (form.contactPhone?.trim()) payload.contactPhone = form.contactPhone.trim()
    if (form.address?.trim()) payload.address = form.address.trim()
    if (form.city?.trim()) payload.city = form.city.trim()
    if (form.country?.trim()) payload.country = form.country.trim()

    return payload
  }

  // Handle Create Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeForm.name.trim() || !storeForm.slug.trim()) {
      toast({ title: "Validation error", description: "Store name and slug are required.", variant: "destructive" })
      return
    }

    if (storeForm.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeForm.contactEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid contact email address or leave it blank.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = cleanStorePayload(storeForm)
      const res = await fetch("/api/v1/stores/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to create store")

      toast({ title: "Store created!", description: `Online store "${data.data.name}" is now live.` })
      setCreateStoreModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create store", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Update Store Settings
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()

    if (storeForm.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeForm.contactEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid contact email address or leave it blank.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = cleanStorePayload(storeForm)
      const res = await fetch("/api/v1/stores/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to update store")

      toast({ title: "Store updated", description: "Store profile settings saved successfully." })
      setStore(data.data)
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update store", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Direct S3/MinIO Media Upload
  const handleMediaUpload = async (type: "logo" | "banner", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingMedia(type)
    try {
      let fileUrl = ""

      // 1. Try Direct binary streaming upload first (POST /api/v1/stores/me/media/upload)
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("assetType", type === "logo" ? "store_logo" : "store_banner")

        const directRes = await fetch("/api/v1/stores/me/media/upload", {
          method: "POST",
          body: formData,
        })

        if (directRes.ok) {
          const directJson = await directRes.json()
          fileUrl = directJson.data?.url || ""
        }
      } catch {
        // Fall back to presigned URL if direct upload fails
      }

      // 2. Fallback to presigned upload URL if needed
      if (!fileUrl) {
        const presignRes = await fetch("/api/v1/stores/me/media/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "image/png",
            assetType: type,
          }),
        })
        const presignData = await presignRes.json()
        if (!presignRes.ok) throw new Error(presignData.message || "Failed to get upload URL")

        const { uploadUrl, fileUrl: s3Url } = presignData.data

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/png" },
          body: file,
        })
        if (!uploadRes.ok) throw new Error("Failed to upload image asset")
        fileUrl = s3Url
      }

      if (!fileUrl) throw new Error("Could not obtain uploaded media URL")

      // 3. Patch store profile
      const patchPayload = type === "logo" ? { logoUrl: fileUrl } : { bannerUrl: fileUrl }
      const updateRes = await fetch("/api/v1/stores/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      })
      const updated = await updateRes.json()
      if (updateRes.ok) {
        setStore(updated.data)
        toast({ title: "Image uploaded!", description: `Store ${type} has been updated.` })
      }
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Media upload error", variant: "destructive" })
    } finally {
      setUploadingMedia(null)
    }
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

  // Handle Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.title.trim() || !productForm.slug.trim()) {
      toast({ title: "Validation error", description: "Product title and slug are required.", variant: "destructive" })
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
      setEditingProduct(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Product
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
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      toast({ title: "Validation error", description: "Category name and slug are required.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description || undefined,
        sortOrder: Number(categoryForm.sortOrder) || 0,
        parentId: categoryForm.parentId || null,
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
      setEditingCategory(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save category", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/categories/${categoryToDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete category")
      }
      toast({ title: "Category deleted", description: `"${categoryToDelete.name}" removed.` })
      setDeleteCategoryModalOpen(false)
      setCategoryToDelete(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete category", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Adjust Inventory Stock
  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockAdjustProductId) {
      toast({ title: "Validation error", description: "Select a product to adjust.", variant: "destructive" })
      return
    }

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
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to adjust stock", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Save Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponForm.code.trim()) {
      toast({ title: "Validation error", description: "Coupon code is required.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: couponForm.code.toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : null,
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : null,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        isActive: couponForm.isActive,
      }

      const url = editingCoupon
        ? `/api/v1/stores/me/coupons/${editingCoupon.id}`
        : "/api/v1/stores/me/coupons"
      const method = editingCoupon ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save coupon")

      toast({
        title: editingCoupon ? "Coupon updated" : "Coupon created",
        description: `Code ${data.data.code} saved successfully.`,
      })
      setCouponModalOpen(false)
      setEditingCoupon(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save coupon", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Coupon
  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/coupons/${couponToDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete coupon")
      }
      toast({ title: "Coupon deleted", description: `Code ${couponToDelete.code} removed.` })
      setDeleteCouponModalOpen(false)
      setCouponToDelete(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to delete coupon", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Update Order Status
  const handleUpdateOrderStatus = async () => {
    if (!orderToUpdate) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/orders/${orderToUpdate.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newOrderStatus,
          trackingNumber: orderTrackingNumber || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to update order status")

      toast({
        title: "Order updated",
        description: `Order ${orderToUpdate.orderNumber} status changed to ${newOrderStatus}.`,
      })
      setUpdateOrderStatusModalOpen(false)
      setOrderToUpdate(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update order", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const copyStorefrontLink = () => {
    if (!store?.slug) return
    const url = `${window.location.origin}/store/${store.slug}`
    void navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast({ title: "Copied!", description: "Storefront link copied to clipboard." })
  }

  // Open Create Product Modal
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

  // Open Edit Product Modal
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

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch ||
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    const matchesCategory =
      productCategoryFilter === "ALL" || p.categoryId === productCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    return orderStatusFilter === "ALL" || o.status === orderStatusFilter
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>Online Store</span>
            {store && (
              <Badge variant="outline" className={store.isPublished ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : ""}>
                {store.isPublished ? "Published & Live" : "Draft / Unpublished"}
              </Badge>
            )}
          </div>
        }
        description="Manage your store profile, catalog, multi-variant products, inventory, coupons, and orders."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            {store && (
              <>
                <Button variant="outline" size="sm" onClick={copyStorefrontLink}>
                  {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  Copy Link
                </Button>
                <Button asChild size="sm" variant="default">
                  <Link href={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1" />
                    Visit Store
                  </Link>
                </Button>
              </>
            )}
            {!store && !loading && (
              <Button size="sm" onClick={() => setCreateStoreModalOpen(true)}>
                <Plus className="size-3.5 mr-1" />
                Create Store
              </Button>
            )}
          </div>
        }
      />

      {/* No store banner state */}
      {!store && !loading && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <StoreIcon className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold">Start Your Online Store</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Launch your multi-tenant storefront, showcase products with variants, track inventory levels, offer promotional coupons, and fulfill orders.
          </p>
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="rounded-full px-6" onClick={() => setCreateStoreModalOpen(true)}>
              <Plus className="size-4 mr-2" />
              Initialize Store Now
            </Button>
          </div>
        </div>
      )}

      {/* Store overview & analytics */}
      {store && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Gross Revenue</span>
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <TrendingUp className="size-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold tracking-tight">
                {formatMoney(analytics?.grossRevenue || 0)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {analytics?.completedOrders || 0} completed orders
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Product Catalog</span>
                <span className="grid size-8 place-items-center rounded-lg bg-sky-500/10 text-sky-600">
                  <Package className="size-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold tracking-tight">
                {analytics?.totalProducts ?? products.length} items
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {analytics?.activeProducts ?? products.filter((p) => p.isActive).length} active for sale
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Orders</span>
                <span className="grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                  <ShoppingBag className="size-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold tracking-tight">
                {analytics?.totalOrders ?? orders.length} orders
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {analytics?.pendingOrders ?? orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING").length} pending fulfillment
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Stock Alerts</span>
                <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                  <AlertTriangle className="size-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold tracking-tight">
                {analytics?.lowStockCount ?? products.filter((p) => p.inventoryQuantity <= (p.lowStockThreshold || 5)).length} items
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Requires restocking
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
            {[
              { id: "products", label: "Products", count: products.length, icon: Package },
              { id: "categories", label: "Categories", count: categories.length, icon: FolderTree },
              { id: "orders", label: "Orders", count: orders.length, icon: ShoppingBag },
              { id: "inventory", label: "Inventory Logs", count: inventoryLogs.length, icon: ArrowUpDown },
              { id: "coupons", label: "Coupons", count: coupons.length, icon: Tag },
              { id: "settings", label: "Store Settings", count: null, icon: Settings },
            ].map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StoreTab)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon className="size-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-2xs font-semibold",
                        active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* TAB 1: PRODUCTS */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search title, SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <NativeSelect
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-48"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <Button size="sm" onClick={openCreateProduct}>
                  <Plus className="size-3.5 mr-1" />
                  Add Product
                </Button>
              </div>

              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon={<Package className="size-5" />}
                  title="No products found"
                  body={
                    products.length === 0
                      ? "Start by adding your first product with pricing and images."
                      : "No products match your search or filter."
                  }
                  action={
                    products.length === 0 ? (
                      <Button size="sm" onClick={openCreateProduct}>
                        <Plus className="size-3.5 mr-1" /> Add Product
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
                        <th className="px-4 py-3">Stock</th>
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
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {p.sku || "—"}
                            </td>
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
                                {p.inventoryQuantity} in stock
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
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Categories Hierarchy</h4>
                  <p className="text-xs text-muted-foreground">Organize your store catalog into browseable sections.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({ name: "", slug: "", description: "", sortOrder: 0, parentId: "" })
                    setCategoryModalOpen(true)
                  }}
                >
                  <Plus className="size-3.5 mr-1" /> Add Category
                </Button>
              </div>

              {categories.length === 0 ? (
                <EmptyState
                  icon={<FolderTree className="size-5" />}
                  title="No categories created yet"
                  body="Create categories like Apparel, Electronics, or Accessories to structure your storefront."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingCategory(null)
                        setCategoryForm({ name: "", slug: "", description: "", sortOrder: 0, parentId: "" })
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
                                  setCategoryForm({
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
                                  setDeleteCategoryModalOpen(true)
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
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <NativeSelect
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-48"
                  >
                    <option value="ALL">All Orders ({orders.length})</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </NativeSelect>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag className="size-5" />}
                  title="No orders placed yet"
                  body="When customers place orders on your public storefront or checkout via Messenger bot, they appear here."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((o) => {
                        const statusConfig = ORDER_STATUS_CONFIG[o.status] || {
                          label: o.status,
                          badgeClass: "",
                        }
                        return (
                          <tr key={o.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono font-medium">{o.orderNumber}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{o.customerName}</p>
                              <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-xs">{o.items?.length || 0} items</td>
                            <td className="px-4 py-3 font-semibold">{formatMoney(o.totalAmount, o.currency)}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={statusConfig.badgeClass}>
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(o)
                                    setOrderDetailModalOpen(true)
                                  }}
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setOrderToUpdate(o)
                                    setNewOrderStatus(o.status)
                                    setOrderTrackingNumber(o.trackingNumber || "")
                                    setUpdateOrderStatusModalOpen(true)
                                  }}
                                >
                                  Update Status
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
            </div>
          )}

          {/* TAB 4: INVENTORY LOGS */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Inventory Adjustment History</h4>
                  <p className="text-xs text-muted-foreground">
                    Atomic stock adjustments with reason logging (RESTOCK, SALE, CORRECTION, RETURN, DAMAGE).
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setStockAdjustProductId(products[0]?.id || "")
                    setStockAdjustVariantId("")
                    setStockAdjustChange(10)
                    setStockAdjustReason("RESTOCK")
                    setStockAdjustNote("")
                    setAdjustStockModalOpen(true)
                  }}
                >
                  <ArrowUpDown className="size-3.5 mr-1" /> Adjust Stock
                </Button>
              </div>

              {inventoryLogs.length === 0 ? (
                <EmptyState
                  icon={<ArrowUpDown className="size-5" />}
                  title="No stock adjustments recorded"
                  body="When inventory is added, corrected, or automatically deducted via checkout, adjustment records appear here."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Product / Variant</th>
                        <th className="px-4 py-3">Change</th>
                        <th className="px-4 py-3">Before → After</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inventoryLogs.map((log) => {
                        const product = products.find((p) => p.id === log.productId)
                        return (
                          <tr key={log.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {log.productTitle || product?.title || log.productId}
                              {log.variantTitle && (
                                <span className="ml-1 text-xs text-muted-foreground">({log.variantTitle})</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "font-semibold",
                                  log.change > 0 ? "text-emerald-600" : "text-rose-600"
                                )}
                              >
                                {log.change > 0 ? `+${log.change}` : log.change}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {log.previousQuantity} → {log.newQuantity}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{log.reason}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{log.note || "—"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COUPONS */}
          {activeTab === "coupons" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Promotional Discount Coupons</h4>
                  <p className="text-xs text-muted-foreground">
                    Create percentage-based or fixed amount discount codes for checkout promotions.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCoupon(null)
                    setCouponForm({
                      code: "",
                      discountType: "PERCENTAGE",
                      discountValue: 15,
                      minOrderAmount: 0,
                      maxDiscountAmount: 0,
                      usageLimit: 100,
                      isActive: true,
                    })
                    setCouponModalOpen(true)
                  }}
                >
                  <Plus className="size-3.5 mr-1" /> Add Coupon
                </Button>
              </div>

              {coupons.length === 0 ? (
                <EmptyState
                  icon={<Tag className="size-5" />}
                  title="No coupons created yet"
                  body="Offer discounts like WINTER20 or FREESHIP to drive customer conversions."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingCoupon(null)
                        setCouponForm({
                          code: "",
                          discountType: "PERCENTAGE",
                          discountValue: 15,
                          minOrderAmount: 0,
                          maxDiscountAmount: 0,
                          usageLimit: 100,
                          isActive: true,
                        })
                        setCouponModalOpen(true)
                      }}
                    >
                      <Plus className="size-3.5 mr-1" /> Create First Coupon
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Discount</th>
                        <th className="px-4 py-3">Min Order</th>
                        <th className="px-4 py-3">Usage</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">{c.code}</td>
                          <td className="px-4 py-3 font-semibold">
                            {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : formatMoney(c.discountValue)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {c.minOrderAmount ? formatMoney(c.minOrderAmount) : "No minimum"}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {c.usageCount} / {c.usageLimit ?? "∞"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={c.isActive ? "default" : "outline"}>
                              {c.isActive ? "Active" : "Disabled"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCoupon(c)
                                  setCouponForm({
                                    code: c.code,
                                    discountType: c.discountType,
                                    discountValue: c.discountValue,
                                    minOrderAmount: c.minOrderAmount || 0,
                                    maxDiscountAmount: c.maxDiscountAmount || 0,
                                    usageLimit: c.usageLimit || 100,
                                    isActive: c.isActive,
                                  })
                                  setCouponModalOpen(true)
                                }}
                              >
                                <Edit className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:text-rose-700"
                                onClick={() => {
                                  setCouponToDelete(c)
                                  setDeleteCouponModalOpen(true)
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
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Media Upload Section */}
              <div className="rounded-2xl border bg-card p-6 shadow-xs">
                <h4 className="font-display text-lg font-bold">Store Branding & Media</h4>
                <p className="text-sm text-muted-foreground">
                  Direct client uploads to presigned MinIO S3 bucket for high-resolution logos and banners.
                </p>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {/* Logo Upload */}
                  <div className="flex flex-col gap-3 rounded-xl border p-4">
                    <Label className="font-semibold">Store Logo</Label>
                    <div className="flex items-center gap-4">
                      {store.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={store.logoUrl}
                          alt="Store Logo"
                          className="size-16 rounded-xl border object-contain bg-secondary p-1"
                        />
                      ) : (
                        <div className="grid size-16 place-items-center rounded-xl border bg-secondary text-muted-foreground">
                          <ImageIcon className="size-6" />
                        </div>
                      )}
                      <div>
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingMedia === "logo"}
                            asChild
                          >
                            <span>
                              {uploadingMedia === "logo" ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Upload className="size-3.5 mr-1.5" />
                              )}
                              Upload Logo
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleMediaUpload("logo", e)}
                          />
                        </label>
                        <p className="mt-1 text-2xs text-muted-foreground">PNG, JPG or SVG up to 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div className="flex flex-col gap-3 rounded-xl border p-4">
                    <Label className="font-semibold">Store Banner</Label>
                    <div className="flex items-center gap-4">
                      {store.bannerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={store.bannerUrl}
                          alt="Store Banner"
                          className="h-16 w-28 rounded-xl border object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-28 place-items-center rounded-xl border bg-secondary text-muted-foreground">
                          <ImageIcon className="size-6" />
                        </div>
                      )}
                      <div>
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingMedia === "banner"}
                            asChild
                          >
                            <span>
                              {uploadingMedia === "banner" ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Upload className="size-3.5 mr-1.5" />
                              )}
                              Upload Banner
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void handleMediaUpload("banner", e)}
                          />
                        </label>
                        <p className="mt-1 text-2xs text-muted-foreground">Recommended 1200x400px</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Profile Form */}
              <form onSubmit={handleUpdateStore} className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
                <h4 className="font-display text-lg font-bold">Store Profile & Configuration</h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name">Store Name</Label>
                    <Input
                      id="edit-name"
                      value={storeForm.name}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-slug">Storefront URL Slug</Label>
                    <div className="flex items-center">
                      <span className="rounded-l-lg border border-r-0 bg-muted px-2.5 py-2 text-xs text-muted-foreground">
                        /store/
                      </span>
                      <Input
                        id="edit-slug"
                        className="rounded-l-none"
                        value={storeForm.slug}
                        onChange={(e) => setStoreForm((prev) => ({ ...prev, slug: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-desc">Description</Label>
                  <Textarea
                    id="edit-desc"
                    rows={3}
                    value={storeForm.description}
                    onChange={(e) => setStoreForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-curr">Currency</Label>
                    <NativeSelect
                      id="edit-curr"
                      value={storeForm.currency}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="BDT">BDT (৳)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email">Contact Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={storeForm.contactEmail}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone">Contact Phone</Label>
                    <Input
                      id="edit-phone"
                      value={storeForm.contactPhone}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-address">Street Address</Label>
                    <Input
                      id="edit-address"
                      value={storeForm.address}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={storeForm.city}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={storeForm.country}
                      onChange={(e) => setStoreForm((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-semibold">Public Storefront Visibility</p>
                    <p className="text-xs text-muted-foreground">
                      When published, visitors can browse products, add to cart, and checkout.
                    </p>
                  </div>
                  <Switch
                    checked={storeForm.isPublished}
                    onCheckedChange={(checked) => setStoreForm((prev) => ({ ...prev, isPublished: checked }))}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                    Save Store Settings
                  </Button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* CREATE STORE DIALOG */}
      <Dialog open={createStoreModalOpen} onOpenChange={setCreateStoreModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Online Store</DialogTitle>
            <DialogDescription>Initialize your brand store profile and start adding products.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStore} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Store Name</Label>
              <Input
                id="create-name"
                placeholder="Acme Boutique"
                value={storeForm.name}
                onChange={(e) => {
                  const val = e.target.value
                  setStoreForm((prev) => ({
                    ...prev,
                    name: val,
                    slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  }))
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-slug">URL Slug</Label>
              <Input
                id="create-slug"
                placeholder="acme-boutique"
                value={storeForm.slug}
                onChange={(e) => setStoreForm((prev) => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-desc">Description</Label>
              <Textarea
                id="create-desc"
                placeholder="Curated apparel and accessories"
                value={storeForm.description}
                onChange={(e) => setStoreForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-curr">Currency</Label>
                <NativeSelect
                  id="create-curr"
                  value={storeForm.currency}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BDT">BDT (৳)</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-city">City</Label>
                <Input
                  id="create-city"
                  placeholder="San Francisco"
                  value={storeForm.city}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateStoreModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Create Store
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT PRODUCT DIALOG */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              Configure product details, pricing, stock levels, variants, and images.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-title">Title</Label>
                <Input
                  id="prod-title"
                  placeholder="Classic Cotton T-Shirt"
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
                <Label htmlFor="prod-slug">Slug</Label>
                <Input
                  id="prod-slug"
                  placeholder="classic-cotton-tshirt"
                  value={productForm.slug}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                rows={2}
                placeholder="Product description and features"
                value={productForm.description}
                onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-price">Price ({store?.currency || "USD"})</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-comp">Compare At Price</Label>
                <Input
                  id="prod-comp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.compareAtPrice || ""}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, compareAtPrice: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-sku">SKU Code</Label>
                <Input
                  id="prod-sku"
                  placeholder="TSHIRT-01"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-cat">Category</Label>
                <NativeSelect
                  id="prod-cat"
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
                <Label htmlFor="prod-stock">Stock Quantity</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  value={productForm.inventoryQuantity}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, inventoryQuantity: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-thresh">Low Stock Alert</Label>
                <Input
                  id="prod-thresh"
                  type="number"
                  min="0"
                  value={productForm.lowStockThreshold}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prod-images">Product Images</Label>
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
                id="prod-images"
                rows={2}
                placeholder="https://... (one per line, or click Upload Image above)"
                value={productForm.imagesText}
                onChange={(e) => setProductForm((prev) => ({ ...prev, imagesText: e.target.value }))}
              />
            </div>

            {/* Product Variants builder */}
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
              Are you sure you want to remove &quot;{productToDelete?.title}&quot; from your catalog? This cannot be undone.
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

      {/* CREATE / EDIT CATEGORY DIALOG */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>Create hierarchy groupings for your store products.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="Outerwear"
                value={categoryForm.name}
                onChange={(e) => {
                  const name = e.target.value
                  setCategoryForm((prev) => ({
                    ...prev,
                    name,
                    slug: editingCategory ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  }))
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">URL Slug</Label>
              <Input
                id="cat-slug"
                placeholder="outerwear"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                placeholder="Jackets, coats and parkas"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-sort">Sort Order</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-parent">Parent Category</Label>
                <NativeSelect
                  id="cat-parent"
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, parentId: e.target.value }))}
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

      {/* DELETE CATEGORY CONFIRMATION */}
      <Dialog open={deleteCategoryModalOpen} onOpenChange={setDeleteCategoryModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category?</DialogTitle>
            <DialogDescription>
              Remove &quot;{categoryToDelete?.name}&quot;? Products in this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={submitting}>
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
              <Label htmlFor="adj-prod">Target Product</Label>
              <NativeSelect
                id="adj-prod"
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

            {/* If product has variants */}
            {(() => {
              const selectedProd = products.find((p) => p.id === stockAdjustProductId)
              if (selectedProd?.variants && selectedProd.variants.length > 0) {
                return (
                  <div className="space-y-1.5">
                    <Label htmlFor="adj-variant">Variant (Optional)</Label>
                    <NativeSelect
                      id="adj-variant"
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
                <Label htmlFor="adj-change">Quantity Change (+/-)</Label>
                <Input
                  id="adj-change"
                  type="number"
                  placeholder="+10 or -5"
                  value={stockAdjustChange}
                  onChange={(e) => setStockAdjustChange(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adj-reason">Reason</Label>
                <NativeSelect
                  id="adj-reason"
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value as InventoryAdjustReason)}
                >
                  <option value="RESTOCK">RESTOCK (Supplier delivery)</option>
                  <option value="CORRECTION">CORRECTION (Inventory recount)</option>
                  <option value="SALE">SALE (Manual order deduction)</option>
                  <option value="RETURN">RETURN (Customer return)</option>
                  <option value="DAMAGE">DAMAGE (Damaged / expired)</option>
                </NativeSelect>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adj-note">Audit Note</Label>
              <Input
                id="adj-note"
                placeholder="e.g. Supplier delivery batch #404"
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
                Confirm Stock Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT COUPON DIALOG */}
      <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
            <DialogDescription>Configure discount code and usage restrictions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCoupon} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="coup-code">Coupon Code</Label>
              <Input
                id="coup-code"
                placeholder="WINTER20"
                value={couponForm.code}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="coup-type">Discount Type</Label>
                <NativeSelect
                  id="coup-type"
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, discountType: e.target.value as DiscountType }))}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ({store?.currency || "USD"})</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coup-val">Discount Value</Label>
                <Input
                  id="coup-val"
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="coup-min">Min Order Amount</Label>
                <Input
                  id="coup-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.minOrderAmount || ""}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coup-limit">Usage Limit</Label>
                <Input
                  id="coup-limit"
                  type="number"
                  min="1"
                  value={couponForm.usageLimit || ""}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium text-sm">Active</p>
                <p className="text-2xs text-muted-foreground">Allow customers to redeem this coupon</p>
              </div>
              <Switch
                checked={couponForm.isActive}
                onCheckedChange={(checked) => setCouponForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCouponModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Save Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE COUPON CONFIRMATION */}
      <Dialog open={deleteCouponModalOpen} onOpenChange={setDeleteCouponModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Coupon?</DialogTitle>
            <DialogDescription>
              Remove promotional code &quot;{couponToDelete?.code}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ORDER DETAILS DIALOG */}
      <Dialog open={orderDetailModalOpen} onOpenChange={setOrderDetailModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/30">
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="font-semibold">{selectedOrder.status}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Payment</span>
                  <p className="font-semibold">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total</span>
                  <p className="font-bold text-base">{formatMoney(selectedOrder.totalAmount, selectedOrder.currency)}</p>
                </div>
              </div>

              {/* Customer and Shipping */}
              <div className="rounded-xl border p-4 space-y-2">
                <h5 className="font-semibold text-xs uppercase text-muted-foreground">Customer & Shipping</h5>
                <p className="font-medium">{selectedOrder.customerName}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || "No phone"}</p>
                <div className="pt-2 text-xs text-muted-foreground border-t">
                  <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                  {selectedOrder.shippingAddress?.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                  <p>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p>{selectedOrder.shippingAddress?.country}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="rounded-xl border p-4 space-y-3">
                <h5 className="font-semibold text-xs uppercase text-muted-foreground">Ordered Items</h5>
                <div className="divide-y text-xs">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        {item.variantTitle && <p className="text-muted-foreground">{item.variantTitle}</p>}
                        <p className="text-muted-foreground">{formatMoney(item.price, selectedOrder.currency)} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatMoney(item.total, selectedOrder.currency)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(selectedOrder.subtotal, selectedOrder.currency)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({selectedOrder.couponCode})</span>
                      <span>-{formatMoney(selectedOrder.discountAmount, selectedOrder.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                    <span>Total Amount</span>
                    <span>{formatMoney(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.trackingNumber && (
                <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 p-3 text-xs text-purple-700 dark:text-purple-300">
                  <Truck className="size-4 shrink-0" />
                  <span>Tracking Number: <strong>{selectedOrder.trackingNumber}</strong></span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDetailModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPDATE ORDER STATUS DIALOG */}
      <Dialog open={updateOrderStatusModalOpen} onOpenChange={setUpdateOrderStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Fulfill order, add tracking number, or mark as cancelled (restocks inventory automatically).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="order-status-select">Order Status</Label>
              <NativeSelect
                id="order-status-select"
                value={newOrderStatus}
                onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled (Restocks items)</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="order-tracking">Tracking Number (Optional)</Label>
              <Input
                id="order-tracking"
                placeholder="e.g. TRK-98471928"
                value={orderTrackingNumber}
                onChange={(e) => setOrderTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setUpdateOrderStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrderStatus} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
