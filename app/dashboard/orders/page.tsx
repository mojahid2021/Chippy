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
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  StoreOrder,
  OrderStatus,
} from "@/lib/types/woombat"

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; badgeClass: string }> = {
  PENDING: { label: "Pending", badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  PROCESSING: { label: "Processing", badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  SHIPPED: { label: "Shipped", badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  DELIVERED: { label: "Delivered", badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  CANCELLED: { label: "Cancelled", badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false)

  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false)
  const [orderToUpdate, setOrderToUpdate] = useState<StoreOrder | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>("PROCESSING")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/stores/me/orders?limit=100")
      if (res.ok) {
        const json = await res.json()
        setOrders(Array.isArray(json.data) ? json.data : [])
      }
    } catch (err) {
      console.error("Load orders error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const formatMoney = (amount: number, curr = "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(amount || 0)
  }

  const handleUpdateStatus = async () => {
    if (!orderToUpdate) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/stores/me/orders/${orderToUpdate.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to update order status")

      toast({
        title: "Order status updated",
        description: `Order ${orderToUpdate.orderNumber} is now ${newStatus}.`,
      })
      setUpdateStatusModalOpen(false)
      setOrderToUpdate(null)
      await loadOrders()
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error updating status", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Orders"
        description="Fulfill orders, issue tracking numbers, and view complete customer delivery history."
        actions={
          <Button variant="outline" size="sm" onClick={() => void loadOrders()} disabled={loading}>
            <RefreshCw className={cn("size-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, customer, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
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
          title="No orders found"
          body={
            orders.length === 0
              ? "When visitors place orders on your storefront or via automated AI chat, they appear here."
              : "No orders matched your search or status filter."
          }
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
                            setNewStatus(o.status)
                            setTrackingNumber(o.trackingNumber || "")
                            setUpdateStatusModalOpen(true)
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

      {/* UPDATE STATUS DIALOG */}
      <Dialog open={updateStatusModalOpen} onOpenChange={setUpdateStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Fulfill order, add carrier tracking number, or mark as cancelled (restocks items automatically).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ord-status">Status</Label>
              <NativeSelect
                id="ord-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled (Restocks items)</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ord-trk">Tracking Number (Optional)</Label>
              <Input
                id="ord-trk"
                placeholder="e.g. TRK-981240"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setUpdateStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
