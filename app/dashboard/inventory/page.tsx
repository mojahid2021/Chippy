"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Loader2,
  Package,
  Plus,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  StoreProduct,
  InventoryLog,
  InventoryAdjustReason,
} from "@/lib/types/woombat"

export default function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([])

  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [productId, setProductId] = useState("")
  const [variantId, setVariantId] = useState("")
  const [change, setChange] = useState<number>(10)
  const [reason, setReason] = useState<InventoryAdjustReason>("RESTOCK")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, logRes] = await Promise.all([
        fetch("/api/v1/stores/me/products?limit=100").catch(() => null),
        fetch("/api/v1/stores/me/inventory/logs?limit=50").catch(() => null),
      ])

      if (prodRes?.ok) {
        const json = await prodRes.json()
        setProducts(Array.isArray(json.data) ? json.data : [])
      }
      if (logRes?.ok) {
        const json = await logRes.json()
        setLogs(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error("Load inventory error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) {
      toast({ title: "Validation error", description: "Select a product to adjust.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/stores/me/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: variantId || undefined,
          change: Number(change),
          reason,
          note: note || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to adjust inventory")

      toast({ title: "Inventory adjusted", description: `Stock adjusted by ${change >= 0 ? "+" : ""}${change}.` })
      setAdjustModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error adjusting stock", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const lowStockProducts = products.filter((p) => p.inventoryQuantity <= (p.lowStockThreshold || 5))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Tracking & Stock Logs"
        description="Monitor stock quantities across catalog items and perform atomic stock adjustments with audit reason logging."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setProductId(products[0]?.id || "")
                setVariantId("")
                setChange(10)
                setReason("RESTOCK")
                setNote("")
                setAdjustModalOpen(true)
              }}
            >
              <ArrowUpDown className="size-3.5 mr-1.5" />
              Adjust Stock
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Catalog Items Tracked</span>
            <Package className="size-4 text-sky-600" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{products.length} products</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {products.reduce((acc, p) => acc + p.inventoryQuantity, 0)} total units in inventory
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Low Stock Warning</span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-amber-600">
            {lowStockProducts.length} items
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Below threshold level</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Adjustments Logged</span>
            <ArrowUpDown className="size-4 text-purple-600" />
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{logs.length} events</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Audit history maintained</p>
        </div>
      </div>

      {/* Audit Logs Table */}
      {logs.length === 0 ? (
        <EmptyState
          icon={<ArrowUpDown className="size-5" />}
          title="No stock adjustment logs recorded"
          body="Whenever stock is added, manually recounted, or sold, adjustment records will appear here with timestamps."
          action={
            <Button
              size="sm"
              onClick={() => {
                setProductId(products[0]?.id || "")
                setVariantId("")
                setChange(10)
                setReason("RESTOCK")
                setNote("")
                setAdjustModalOpen(true)
              }}
            >
              <Plus className="size-3.5 mr-1" /> Log Initial Stock
            </Button>
          }
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
              {logs.map((log) => {
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

      {/* ADJUST STOCK DIALOG */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory Stock</DialogTitle>
            <DialogDescription>
              Increment or decrement stock level with reason logging.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="i-prod">Product</Label>
              <NativeSelect
                id="i-prod"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value)
                  setVariantId("")
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
              const selectedProd = products.find((p) => p.id === productId)
              if (selectedProd?.variants && selectedProd.variants.length > 0) {
                return (
                  <div className="space-y-1.5">
                    <Label htmlFor="i-variant">Variant (Optional)</Label>
                    <NativeSelect
                      id="i-variant"
                      value={variantId}
                      onChange={(e) => setVariantId(e.target.value)}
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
                <Label htmlFor="i-change">Quantity Change (+/-)</Label>
                <Input
                  id="i-change"
                  type="number"
                  value={change}
                  onChange={(e) => setChange(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-reason">Reason</Label>
                <NativeSelect
                  id="i-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as InventoryAdjustReason)}
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
              <Label htmlFor="i-note">Audit Note</Label>
              <Input
                id="i-note"
                placeholder="Supplier shipment, warehouse count, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Confirm Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
