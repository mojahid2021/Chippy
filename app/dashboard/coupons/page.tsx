"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  StoreProfile,
  StoreCoupon,
  DiscountType,
} from "@/lib/types/woombat"

export default function CouponsPage() {
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [coupons, setCoupons] = useState<StoreCoupon[]>([])

  const [couponModalOpen, setCouponModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<StoreCoupon | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<StoreCoupon | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as DiscountType,
    discountValue: 15,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 100,
    isActive: true,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [storeRes, coupRes] = await Promise.all([
        fetch("/api/v1/stores/me").catch(() => null),
        fetch("/api/v1/stores/me/coupons").catch(() => null),
      ])

      if (storeRes?.ok) {
        const json = await storeRes.json()
        setStore(json.data)
      }
      if (coupRes?.ok) {
        const json = await coupRes.json()
        setCoupons(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error("Load coupons error:", err)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) {
      toast({ title: "Validation error", description: "Coupon code is required.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
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
        description: `Promo code ${data.data.code} saved successfully.`,
      })
      setCouponModalOpen(false)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error saving coupon", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!couponToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/coupons/${couponToDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete coupon")
      }
      toast({ title: "Coupon deleted", description: `Code ${couponToDelete.code} removed.` })
      setDeleteModalOpen(false)
      setCouponToDelete(null)
      await loadData()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error deleting coupon", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotional Coupons"
        description="Create percentage-based or fixed discount codes to boost conversions at checkout."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingCoupon(null)
                setForm({
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
              <Plus className="size-3.5 mr-1.5" />
              Add Coupon
            </Button>
          </div>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-5" />}
          title="No coupons created yet"
          body="Create promotional codes like WINTER20 or WELCOME10 to offer customer discounts."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingCoupon(null)
                setForm({
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
                          setForm({
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
      <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
            <DialogDescription>Configure discount code and usage rules.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-code">Coupon Code</Label>
              <Input
                id="cp-code"
                placeholder="WINTER20"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-type">Discount Type</Label>
                <NativeSelect
                  id="cp-type"
                  value={form.discountType}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as DiscountType }))}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ({store?.currency || "USD"})</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-val">Discount Value</Label>
                <Input
                  id="cp-val"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discountValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-min">Min Order Amount</Label>
                <Input
                  id="cp-min"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minOrderAmount || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-limit">Usage Limit</Label>
                <Input
                  id="cp-limit"
                  type="number"
                  min="1"
                  value={form.usageLimit || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium text-sm">Active</p>
                <p className="text-2xs text-muted-foreground">Allow customers to redeem this coupon</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
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

      {/* DELETE CONFIRMATION */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Coupon?</DialogTitle>
            <DialogDescription>
              Remove promotional code &quot;{couponToDelete?.code}&quot;?
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
