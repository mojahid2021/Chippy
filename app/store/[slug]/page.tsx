"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type {
  StoreProfile,
  StoreCategory,
  StoreProduct,
  ProductVariant,
  CartSession,
  StoreOrder,
} from "@/lib/types/woombat"

export default function PublicStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [products, setProducts] = useState<StoreProduct[]>([])

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

  // Cart State (stored in Redis backend, cartId kept in localStorage)
  const [cart, setCart] = useState<CartSession | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  // Product Quick-view / Variant Selector
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false)

  // Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<StoreOrder | null>(null)
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    paymentMethod: "CASH_ON_DELIVERY",
  })

  // Order Tracking State
  const [trackOrderModalOpen, setTrackOrderModalOpen] = useState(false)
  const [trackOrderNumber, setTrackOrderNumber] = useState("")
  const [trackOrderEmail, setTrackOrderEmail] = useState("")
  const [trackedOrder, setTrackedOrder] = useState<StoreOrder | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

  const cartStorageKey = `woombat_cart_id_${slug}`

  const getCartId = useCallback((): string => {
    if (typeof window === "undefined") return ""
    let id = localStorage.getItem(cartStorageKey)
    if (!id) {
      id = "cart_" + Math.random().toString(36).substring(2, 12)
      localStorage.setItem(cartStorageKey, id)
    }
    return id
  }, [cartStorageKey])

  const fetchCart = useCallback(async () => {
    try {
      const cartId = getCartId()
      const res = await fetch(`/api/v1/stores/${slug}/cart`, {
        headers: { "X-Cart-ID": cartId },
      })
      if (res.ok) {
        const json = await res.json()
        setCart(json.data)
      }
    } catch {
      // Cart might not be created yet
    }
  }, [slug, getCartId])

  // Load public storefront data
  const loadStorefront = useCallback(async () => {
    setLoading(true)
    try {
      const [storeRes, catRes, prodRes] = await Promise.all([
        fetch(`/api/v1/stores/${slug}`).catch(() => null),
        fetch(`/api/v1/stores/${slug}/categories`).catch(() => null),
        fetch(`/api/v1/stores/${slug}/products?limit=100`).catch(() => null),
      ])

      if (storeRes?.ok) {
        const json = await storeRes.json()
        setStore(json.data)
      } else {
        setStore(null)
      }

      if (catRes?.ok) {
        const json = await catRes.json()
        setCategories(Array.isArray(json.data) ? json.data : [])
      }

      if (prodRes?.ok) {
        const json = await prodRes.json()
        setProducts(Array.isArray(json.data) ? json.data : [])
      }

      await fetchCart()
    } catch (err) {
      console.error("Load storefront error:", err)
    } finally {
      setLoading(false)
    }
  }, [slug, fetchCart])

  useEffect(() => {
    void loadStorefront()
  }, [loadStorefront])

  const formatMoney = (amount: number, curr = store?.currency || "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(amount || 0)
  }

  // Add Item to Cart
  const handleAddToCart = async (product: StoreProduct, variant?: ProductVariant) => {
    try {
      const cartId = getCartId()
      const res = await fetch(`/api/v1/stores/${slug}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Cart-ID": cartId,
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant?.id,
          quantity: 1,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to add to cart")

      setCart(json.data)
      setProductDetailModalOpen(false)
      toast({
        title: "Added to cart!",
        description: `"${product.title}${variant ? ` (${variant.title})` : ""}" added.`,
      })
      setCartOpen(true)
    } catch (err: unknown) {
      toast({
        title: "Could not add item",
        description: err instanceof Error ? err.message : "Error adding to cart",
        variant: "destructive",
      })
    }
  }

  // Update Item Quantity in Cart
  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    try {
      const cartId = getCartId()
      if (newQty <= 0) {
        // Remove item
        const res = await fetch(`/api/v1/stores/${slug}/cart/items/${itemId}`, {
          method: "DELETE",
          headers: { "X-Cart-ID": cartId },
        })
        if (res.ok) {
          await fetchCart()
        }
      } else {
        const res = await fetch(`/api/v1/stores/${slug}/cart/items/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Cart-ID": cartId,
          },
          body: JSON.stringify({ quantity: newQty }),
        })
        if (res.ok) {
          const json = await res.json()
          setCart(json.data)
        }
      }
    } catch (err) {
      console.error("Cart update error:", err)
    }
  }

  // Apply Coupon Code
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setApplyingCoupon(true)
    try {
      const cartId = getCartId()
      const res = await fetch(`/api/v1/stores/${slug}/cart/coupon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Cart-ID": cartId,
        },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Invalid coupon code")

      setCart(json.data)
      toast({ title: "Coupon applied!", description: `Discount code ${couponCode.toUpperCase()} applied.` })
      setCouponCode("")
    } catch (err: unknown) {
      toast({
        title: "Coupon error",
        description: err instanceof Error ? err.message : "Failed to apply coupon",
        variant: "destructive",
      })
    } finally {
      setApplyingCoupon(false)
    }
  }

  // Clear Cart
  const handleClearCart = async () => {
    try {
      const cartId = getCartId()
      await fetch(`/api/v1/stores/${slug}/cart`, {
        method: "DELETE",
        headers: { "X-Cart-ID": cartId },
      })
      setCart(null)
      toast({ title: "Cart cleared" })
    } catch (err) {
      console.error("Clear cart error:", err)
    }
  }

  // Place Order (Checkout)
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || !cart.items || cart.items.length === 0) {
      toast({ title: "Empty cart", description: "Add items to your cart before checkout.", variant: "destructive" })
      return
    }

    setSubmittingOrder(true)
    try {
      const cartId = getCartId()
      const payload = {
        cartId,
        customerName: checkoutForm.customerName,
        customerEmail: checkoutForm.customerEmail,
        customerPhone: checkoutForm.customerPhone || undefined,
        shippingAddress: {
          fullName: checkoutForm.customerName,
          addressLine1: checkoutForm.addressLine1,
          addressLine2: checkoutForm.addressLine2 || undefined,
          city: checkoutForm.city,
          state: checkoutForm.state || undefined,
          postalCode: checkoutForm.postalCode || undefined,
          country: checkoutForm.country,
          phone: checkoutForm.customerPhone || undefined,
        },
        paymentMethod: checkoutForm.paymentMethod,
      }

      const res = await fetch(`/api/v1/stores/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to complete checkout")

      setPlacedOrder(json.data)
      setCart(null)
      localStorage.removeItem(cartStorageKey)
      setCheckoutModalOpen(false)
      setCartOpen(false)
      toast({
        title: "Order placed successfully!",
        description: `Order #${json.data.orderNumber} confirmed.`,
      })
    } catch (err: unknown) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Checkout error",
        variant: "destructive",
      })
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Track Order Status
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackOrderNumber.trim()) return

    setTrackingLoading(true)
    try {
      const emailQuery = trackOrderEmail ? `?email=${encodeURIComponent(trackOrderEmail)}` : ""
      const res = await fetch(`/api/v1/stores/${slug}/orders/${trackOrderNumber.trim()}${emailQuery}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Order not found")

      setTrackedOrder(json.data)
    } catch (err: unknown) {
      toast({
        title: "Order not found",
        description: err instanceof Error ? err.message : "Please check your order number.",
        variant: "destructive",
      })
      setTrackedOrder(null)
    } finally {
      setTrackingLoading(false)
    }
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCat = selectedCategory === "ALL" || p.categoryId === selectedCategory
    return matchesSearch && matchesCat && p.isActive
  })

  const cartTotalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-brand" />
        <p className="text-sm text-muted-foreground">Loading storefront...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h2 className="mt-4 font-display text-2xl font-bold">Store Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The store &quot;{slug}&quot; does not exist or has not been published yet.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard/store">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Storefront Header */}
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="size-10 rounded-xl object-contain border" />
            ) : (
              <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground font-bold">
                {store.name[0]}
              </div>
            )}
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">{store.name}</h1>
              {store.city && <p className="text-2xs text-muted-foreground">{store.city}, {store.country}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTrackedOrder(null)
                setTrackOrderModalOpen(true)
              }}
            >
              <Truck className="size-4 mr-1.5" />
              Track Order
            </Button>
            <Button
              variant="default"
              size="sm"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="size-4 mr-1.5" />
              <span>Cart</span>
              {cartTotalItems > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-foreground px-1.5 py-0.2 text-2xs font-bold text-brand">
                  {cartTotalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Banner */}
      {store.bannerUrl && (
        <div className="relative h-48 w-full overflow-hidden border-b sm:h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={store.bannerUrl} alt="Store banner" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-6 max-w-xl">
            <h2 className="font-display text-2xl font-bold sm:text-3xl text-foreground">{store.name}</h2>
            {store.description && <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{store.description}</p>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Search & Categories Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={selectedCategory === "ALL" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory("ALL")}
            >
              All Products
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={selectedCategory === c.id ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-bold">No Products Available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No products found in this category or matching your search.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const hasVariants = p.variants && p.variants.length > 0
              const outOfStock = p.inventoryQuantity <= 0
              return (
                <div
                  key={p.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-md"
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <Package className="size-12" />
                        </div>
                      )}
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <span className="absolute top-2.5 right-2.5 rounded-full bg-rose-500 px-2 py-0.5 text-2xs font-bold text-white shadow-xs">
                          SALE
                        </span>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-background/70 backdrop-blur-xs grid place-items-center">
                          <Badge variant="outline" className="border-rose-500 text-rose-600 bg-background font-bold">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="font-display font-semibold text-foreground group-hover:text-brand line-clamp-1">
                        {p.title}
                      </p>
                      {p.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-display text-lg font-bold text-foreground">
                          {formatMoney(p.price)}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatMoney(p.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    {hasVariants ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={outOfStock}
                        onClick={() => {
                          setSelectedProduct(p)
                          setSelectedVariant(p.variants?.[0] || null)
                          setProductDetailModalOpen(true)
                        }}
                      >
                        Choose Options
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full"
                        disabled={outOfStock}
                        onClick={() => void handleAddToCart(p)}
                      >
                        <ShoppingCart className="size-4 mr-1.5" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* PRODUCT VARIANT SELECTOR MODAL */}
      <Dialog open={productDetailModalOpen} onOpenChange={setProductDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.title}</DialogTitle>
            <DialogDescription>Select your preferred options to add to cart.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedProduct.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    className="size-20 rounded-xl object-cover border"
                  />
                )}
                <div>
                  <p className="font-display text-lg font-bold text-foreground">
                    {formatMoney(selectedVariant?.price ?? selectedProduct.price)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedProduct.description}
                  </p>
                </div>
              </div>

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Options / Variants</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.variants.map((v, i) => {
                      const isSel = selectedVariant?.title === v.title
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={cn(
                            "flex items-center justify-between rounded-xl border p-2.5 text-xs font-medium text-left transition-colors",
                            isSel
                              ? "border-brand bg-brand/5 text-foreground ring-1 ring-brand"
                              : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <span>{v.title}</span>
                          {v.inventoryQuantity <= 0 ? (
                            <span className="text-2xs text-rose-500">Sold out</span>
                          ) : (
                            <span className="text-2xs text-muted-foreground">{v.inventoryQuantity} left</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setProductDetailModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedProduct || Boolean(selectedVariant && selectedVariant.inventoryQuantity <= 0)}
              onClick={() => {
                if (selectedProduct) {
                  void handleAddToCart(selectedProduct, selectedVariant || undefined)
                }
              }}
            >
              <ShoppingCart className="size-4 mr-1.5" />
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SLIDE-OUT SHOPPING CART SHEET */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-brand" />
              <h3 className="font-display text-lg font-bold">Shopping Cart</h3>
            </div>
            {cart && cart.items && cart.items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearCart} className="text-xs text-rose-600">
                Clear
              </Button>
            )}
          </div>

          {!cart || !cart.items || cart.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <ShoppingBag className="size-12 text-muted-foreground" />
              <h4 className="mt-3 font-display font-semibold">Your cart is empty</h4>
              <p className="mt-1 text-xs text-muted-foreground">Add products from the catalog to get started.</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto divide-y pr-1 py-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
                      {item.variantTitle && (
                        <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                      )}
                      <p className="text-xs font-semibold text-brand mt-0.5">
                        {formatMoney(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border">
                        <button
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                          onClick={() => void handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-2 text-xs font-medium">{item.quantity}</span>
                        <button
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                          onClick={() => void handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-rose-600 p-1"
                        onClick={() => void handleUpdateQuantity(item.id, 0)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="border-t pt-3">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="Coupon code (e.g. WINTER20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-xs uppercase"
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={applyingCoupon}>
                    {applyingCoupon ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
                  </Button>
                </form>

                {/* Totals */}
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Subtotal</span>
                    <span>{formatMoney(cart.subtotal || 0)}</span>
                  </div>
                  {cart.discount && cart.discount > 0 ? (
                    <div className="flex justify-between text-xs text-emerald-600 font-medium">
                      <span>Discount {cart.couponCode ? `(${cart.couponCode})` : ""}</span>
                      <span>-{formatMoney(cart.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-display text-base font-bold text-foreground border-t pt-2">
                    <span>Total</span>
                    <span>{formatMoney(cart.total ?? cart.subtotal ?? 0)}</span>
                  </div>
                </div>

                <Button
                  className="mt-4 w-full"
                  size="lg"
                  onClick={() => {
                    setCheckoutModalOpen(true)
                  }}
                >
                  Proceed to Checkout
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CHECKOUT MODAL */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              Enter shipping address and contact details. Free Cash on Delivery available.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="chk-name">Full Name</Label>
              <Input
                id="chk-name"
                placeholder="Alice Johnson"
                value={checkoutForm.customerName}
                onChange={(e) => setCheckoutForm((prev) => ({ ...prev, customerName: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chk-email">Email</Label>
                <Input
                  id="chk-email"
                  type="email"
                  placeholder="alice@example.com"
                  value={checkoutForm.customerEmail}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chk-phone">Phone Number</Label>
                <Input
                  id="chk-phone"
                  placeholder="+1-555-0144"
                  value={checkoutForm.customerPhone}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chk-addr1">Shipping Address</Label>
              <Input
                id="chk-addr1"
                placeholder="123 Market Street, Apt 4B"
                value={checkoutForm.addressLine1}
                onChange={(e) => setCheckoutForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chk-city">City</Label>
                <Input
                  id="chk-city"
                  placeholder="Seattle"
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chk-state">State / Province</Label>
                <Input
                  id="chk-state"
                  placeholder="WA"
                  value={checkoutForm.state}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chk-zip">Postal Code</Label>
                <Input
                  id="chk-zip"
                  placeholder="98101"
                  value={checkoutForm.postalCode}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-xl border p-3 bg-muted/40 space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span>Payment Method</span>
                <span>Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                <span>Order Total</span>
                <span>{formatMoney(cart?.total ?? cart?.subtotal ?? 0)}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCheckoutModalOpen(false)}>
                Back to Cart
              </Button>
              <Button type="submit" disabled={submittingOrder}>
                {submittingOrder && <Loader2 className="size-4 animate-spin mr-2" />}
                Confirm & Place Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ORDER PLACED SUCCESS DIALOG */}
      <Dialog open={!!placedOrder} onOpenChange={() => setPlacedOrder(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">Thank You for Your Order!</DialogTitle>
            <DialogDescription className="text-center">
              Your order has been received and is being prepared for fulfillment.
            </DialogDescription>
          </DialogHeader>
          {placedOrder && (
            <div className="rounded-xl border p-4 text-left text-xs space-y-2 bg-muted/30">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-mono font-bold text-foreground">{placedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-foreground">{formatMoney(placedOrder.totalAmount, placedOrder.currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Payment:</span>
                <span>{placedOrder.paymentMethod}</span>
              </div>
              <div className="border-t pt-2 text-muted-foreground">
                <p>Delivering to: {placedOrder.shippingAddress?.fullName}, {placedOrder.shippingAddress?.city}</p>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setPlacedOrder(null)}>Continue Shopping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRACK ORDER MODAL */}
      <Dialog open={trackOrderModalOpen} onOpenChange={setTrackOrderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Track Your Order</DialogTitle>
            <DialogDescription>
              Enter your order number and email to check real-time delivery status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTrackOrder} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="trk-num">Order Number</Label>
              <Input
                id="trk-num"
                placeholder="e.g. ORD-981240"
                value={trackOrderNumber}
                onChange={(e) => setTrackOrderNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trk-mail">Email Address (Optional)</Label>
              <Input
                id="trk-mail"
                type="email"
                placeholder="alice@example.com"
                value={trackOrderEmail}
                onChange={(e) => setTrackOrderEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={trackingLoading}>
              {trackingLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Search className="size-4 mr-2" />}
              Track Order Status
            </Button>
          </form>

          {trackedOrder && (
            <div className="mt-4 rounded-xl border p-4 space-y-3 text-xs bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm">#{trackedOrder.orderNumber}</span>
                <Badge variant="outline">{trackedOrder.status}</Badge>
              </div>
              <p className="text-muted-foreground">Placed on: {new Date(trackedOrder.createdAt).toLocaleDateString()}</p>
              {trackedOrder.trackingNumber && (
                <div className="flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-300">
                  <Truck className="size-3.5" />
                  <span>Tracking Number: {trackedOrder.trackingNumber}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-foreground">
                <span>Total:</span>
                <span>{formatMoney(trackedOrder.totalAmount, trackedOrder.currency)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
