"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Unlock,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  SubscriptionPlan,
  UserSubscription,
  SubscriptionInvoice,
  SubscriptionHistoryResponse,
  PremiumContentData,
} from "@/lib/types/woombat"

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(true)

  // Modals & Action States
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelImmediate, setCancelImmediate] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Plan Switch Dialog
  const [switchPlanModalOpen, setSwitchPlanModalOpen] = useState(false)
  const [selectedPlanForSwitch, setSelectedPlanForSwitch] = useState<SubscriptionPlan | null>(null)

  // Premium Content Test State
  const [premiumData, setPremiumData] = useState<PremiumContentData | null>(null)
  const [testingPremium, setTestingPremium] = useState(false)
  const [premiumError, setPremiumError] = useState<string | null>(null)

  // Fetch subscription plans
  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true)
      const res = await fetch('/api/v1/subscriptions/plans')
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        // Filter out redundant duplicates if any, preserving the latest active plans
        const active = json.data.filter((p: SubscriptionPlan) => p.isActive)
        setPlans(active)
      }
    } catch (err) {
      console.error('Failed to load plans:', err)
    } finally {
      setPlansLoading(false)
    }
  }, [])

  // Fetch current subscription
  const fetchCurrentSubscription = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/subscriptions/current')
      const json = await res.json()
      if (res.ok && json.data) {
        setSubscription(json.data)
      } else {
        setSubscription(null)
      }
    } catch (err) {
      console.error('Failed to load current subscription:', err)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch billing history / invoices
  const fetchInvoices = useCallback(async (page = 1) => {
    try {
      setInvoicesLoading(true)
      const res = await fetch(`/api/v1/subscriptions/history?page=${page}&limit=20`)
      const json: SubscriptionHistoryResponse = await res.json()
      if (res.ok && json.data) {
        setInvoices(json.data)
        if (json.pagination) {
          setPagination(json.pagination)
        }
      }
    } catch (err) {
      console.error('Failed to load invoices:', err)
    } finally {
      setInvoicesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchCurrentSubscription()
    fetchInvoices(1)
  }, [fetchPlans, fetchCurrentSubscription, fetchInvoices])

  // Handle Cancel Subscription
  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true)
      const res = await fetch('/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          immediate: cancelImmediate,
          reason: cancelReason || 'User requested cancellation',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          variant: 'success',
          title: cancelImmediate ? 'Plan canceled' : 'Plan will end',
          description: cancelImmediate ? 'Automatic replies have stopped.' : 'You keep everything until the end of this period.',
        })
        setCancelModalOpen(false)
        setCancelReason("")
        setCancelImmediate(false)
        await fetchCurrentSubscription()
      } else {
        toast({
          variant: 'destructive',
          title: 'Couldn’t cancel',
          description: data.message || 'Try again in a moment.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Couldn’t reach the server. Try again in a moment.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Resume Subscription
  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true)
      const res = await fetch('/api/v1/subscriptions/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Your plan continues',
          description: 'It will renew automatically.',
        })
        await fetchCurrentSubscription()
      } else {
        toast({
          variant: 'destructive',
          title: 'Couldn’t keep your plan',
          description: data.message || 'Try again in a moment.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Couldn’t reach the server. Try again in a moment.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Toggle Auto-Renew
  const handleToggleAutoRenew = async (autoRenew: boolean) => {
    try {
      setActionLoading(true)
      const res = await fetch('/api/v1/subscriptions/auto-renew', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          variant: 'success',
          title: autoRenew ? 'Automatic renewal on' : 'Automatic renewal off',
          description: autoRenew ? 'Your plan renews at the end of each period.' : 'Your plan ends at the end of this period.',
        })
        await fetchCurrentSubscription()
      } else {
        toast({
          variant: 'destructive',
          title: 'Couldn’t change renewal',
          description: data.message || 'Try again in a moment.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Couldn’t reach the server. Try again in a moment.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Switch / Change Plan
  const handleConfirmPlanChange = async () => {
    if (!selectedPlanForSwitch) return

    try {
      setActionLoading(true)
      const res = await fetch('/api/v1/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlanForSwitch.id,
          autoRenew: true,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Plan switched',
          description: `You’re now on ${selectedPlanForSwitch.name}.`,
        })
        setSwitchPlanModalOpen(false)
        setSelectedPlanForSwitch(null)
        await fetchCurrentSubscription()
        await fetchInvoices(1)
      } else {
        toast({
          variant: 'destructive',
          title: 'Couldn’t switch plan',
          description: data.message || 'Try again in a moment.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Couldn’t reach the server. Try again in a moment.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Test Premium Content Route Guard
  const handleTestPremiumContent = async () => {
    try {
      setTestingPremium(true)
      setPremiumError(null)
      const res = await fetch('/api/v1/subscriptions/premium-content')
      const data = await res.json()

      if (res.ok && data.data) {
        setPremiumData(data.data)
        toast({
          variant: 'success',
          title: 'Paid features unlocked',
          description: 'Your plan is active.',
        })
      } else {
        setPremiumData(null)
        setPremiumError(data.message || 'Your plan isn’t active, so paid features are locked.')
        toast({
          variant: 'destructive',
          title: 'Paid features locked',
          description: 'Choose or renew a plan to unlock them.',
        })
      }
    } catch {
      setPremiumError('Couldn’t check right now. Try again in a moment.')
    } finally {
      setTestingPremium(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const statusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>
      case "TRIALING":
        return <Badge variant="info">Free trial</Badge>
      case "CANCELED":
      case "CANCELLED":
        return <Badge variant="destructive">Canceled</Badge>
      case "PAST_DUE":
        return <Badge variant="warning">Payment due</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const invoiceBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <Badge variant="success"><CheckCircle />Paid</Badge>
      case "PENDING":
        return <Badge variant="warning"><Clock />Pending</Badge>
      case "FAILED":
        return <Badge variant="destructive"><XCircle />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const periodDays = subscription
    ? Math.max(1, Math.round((+new Date(subscription.currentPeriodEnd) - +new Date(subscription.currentPeriodStart)) / 86_400_000))
    : 1
  const daysLeft = subscription ? getDaysUntilExpiry(subscription.currentPeriodEnd) : 0
  const used = Math.min(100, Math.max(0, ((periodDays - daysLeft) / periodDays) * 100))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Plan & billing"
        description="Your plan, when it renews, and what you’ve paid."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCurrentSubscription()
              fetchPlans()
              fetchInvoices(1)
            }}
            disabled={loading || plansLoading}
          >
            <RefreshCw className={cn("size-3.5", (loading || plansLoading) && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl border bg-muted" aria-busy />
      ) : subscription ? (
        <section className="grid overflow-hidden rounded-3xl border lg:grid-cols-[1.4fr_1fr]">
          <div className="bg-ink p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge(subscription.status)}
              {subscription.cancelAtPeriodEnd && <Badge variant="warning"><AlertTriangle />Ends {formatDate(subscription.currentPeriodEnd)}</Badge>}
            </div>
            <h2 className="mt-4 text-4xl">{subscription.plan?.name ?? "Your plan"}</h2>
            {subscription.plan?.description && <p className="mt-1 max-w-[50ch] text-sm text-white/70">{subscription.plan.description}</p>}
            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold">{formatCurrency(subscription.plan?.price || 0, subscription.plan?.currency)}</span>
              <span className="text-sm text-white/70">/ {subscription.plan?.interval?.toLowerCase() || "month"}</span>
            </p>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-white/70">
                <span>{formatDate(subscription.currentPeriodStart)}</span>
                <span className="font-medium text-brand">{daysLeft} days left</span>
                <span>{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-brand" style={{ width: `${used}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 bg-card p-6 sm:p-8">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Renew automatically</span>
                <span className="block text-xs text-muted-foreground">
                  {subscription.autoRenew ? `Renews on ${formatDate(subscription.currentPeriodEnd)}.` : `Your plan ends on ${formatDate(subscription.currentPeriodEnd)}.`}
                </span>
              </span>
              <Switch checked={subscription.autoRenew} disabled={actionLoading} onCheckedChange={(checked) => handleToggleAutoRenew(checked)} />
            </label>
            {subscription.lastRenewalAt && <p className="text-xs text-muted-foreground">Last renewed {formatDate(subscription.lastRenewalAt)}</p>}
            <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
              <Button asChild>
                <a href="#plans">Change plan</a>
              </Button>
              {subscription.cancelAtPeriodEnd ? (
                <Button variant="outline" onClick={handleResumeSubscription} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="animate-spin" />}
                  Keep my plan
                </Button>
              ) : (
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setCancelModalOpen(true)} disabled={actionLoading}>
                  Cancel plan
                </Button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<Crown />}
          title="You’re not on a plan yet"
          body="Choose a plan to switch on automatic replies. Pay with bKash, Nagad, or bank transfer."
          action={<Button asChild><a href="#plans">See plans</a></Button>}
        />
      )}

      <section id="plans" className="scroll-mt-20 space-y-4">
        <div>
          <h2 className="text-xl">Plans</h2>
          <p className="text-sm text-muted-foreground">Switch anytime. Your new billing period starts right away.</p>
        </div>
        {plansLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl border bg-muted" />)}
          </div>
        ) : plans.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No plans are available right now. Check back soon.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = subscription?.planId === plan.id
              return (
                <div key={plan.id} className={cn("flex flex-col rounded-2xl border bg-card p-5", isCurrent && "border-ink ring-1 ring-ink")}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg">{plan.name}</h3>
                    {isCurrent ? <Badge variant="brand"><Check />Current</Badge> : plan.trialDays > 0 && <Badge variant="info">{plan.trialDays}-day trial</Badge>}
                  </div>
                  <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold">{formatCurrency(plan.price, plan.currency)}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.interval.toLowerCase()}</span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 border-t pt-4 text-sm">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>Your plan</Button>
                    ) : subscription ? (
                      <Button variant="outline" className="w-full" onClick={() => { setSelectedPlanForSwitch(plan); setSwitchPlanModalOpen(true) }}>
                        Switch to {plan.name}
                      </Button>
                    ) : (
                      <Button asChild className="w-full"><Link href={`/dashboard/purchase?planId=${plan.id}`}>Choose {plan.name}</Link></Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl">Invoices</h2>
            <p className="text-sm text-muted-foreground">{pagination.total ? `${pagination.total} so far` : "Every payment shows up here."}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => fetchInvoices(pagination.page)} disabled={invoicesLoading} aria-label="Refresh invoices">
            <RefreshCw className={cn(invoicesLoading && "animate-spin")} />
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border">
          {invoicesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : invoices.length === 0 ? (
            <p className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground"><FileText className="size-5" />No invoices yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">For</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Period</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/60">
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(inv.paidAt || inv.createdAt)}</td>
                    <td className="px-4 py-3">{inv.billingReason === "INITIAL_PAYMENT" ? "First payment" : "Renewal"}</td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</td>
                    <td className="px-4 py-3">{invoiceBadge(inv.status)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(inv.amount, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm text-muted-foreground">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-sm" disabled={pagination.page <= 1 || invoicesLoading} onClick={() => fetchInvoices(pagination.page - 1)} aria-label="Previous page"><ChevronLeft /></Button>
                <Button variant="outline" size="icon-sm" disabled={pagination.page >= pagination.totalPages || invoicesLoading} onClick={() => fetchInvoices(pagination.page + 1)} aria-label="Next page"><ChevronRight /></Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base">Features locked?</h2>
          <p className="text-sm text-muted-foreground">Check whether your plan is active for paid features.</p>
          {premiumData && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-success"><Unlock className="size-4" />Unlocked on {premiumData.tier} until {formatDate(premiumData.expiresAt)}.</p>
          )}
          {premiumError && <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive"><Lock className="size-4" />{premiumError}</p>}
        </div>
        <Button variant="outline" onClick={handleTestPremiumContent} disabled={testingPremium}>
          {testingPremium && <Loader2 className="animate-spin" />}
          Check access
        </Button>
      </section>

      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your plan?</DialogTitle>
            <DialogDescription>Automatic replies stop when your plan ends. Your assistants and pages stay saved.</DialogDescription>
          </DialogHeader>
          <div role="radiogroup" className="space-y-2">
            {[
              { v: false, t: `At the end of this period`, d: subscription ? `Keep everything until ${formatDate(subscription.currentPeriodEnd)}.` : "" },
              { v: true, t: "Right now", d: "Replies stop immediately. No refund for the days left." },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                role="radio"
                aria-checked={cancelImmediate === o.v}
                onClick={() => setCancelImmediate(o.v)}
                className={cn("w-full rounded-xl border px-4 py-3 text-left", cancelImmediate === o.v ? "border-ink bg-brand-soft" : "hover:border-input")}
              >
                <span className="block text-sm font-medium">{o.t}</span>
                <span className="block text-xs text-muted-foreground">{o.d}</span>
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">What made you cancel? <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id="cancel-reason" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>Keep my plan</Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={actionLoading}>
              {actionLoading && <Loader2 className="animate-spin" />}
              Cancel plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={switchPlanModalOpen} onOpenChange={setSwitchPlanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch to {selectedPlanForSwitch?.name}?</DialogTitle>
            <DialogDescription>Your new billing period starts as soon as you confirm.</DialogDescription>
          </DialogHeader>
          {selectedPlanForSwitch && (
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">{selectedPlanForSwitch.description}</p>
              <p className="mt-2 font-display text-2xl font-bold">
                {formatCurrency(selectedPlanForSwitch.price, selectedPlanForSwitch.currency)}
                <span className="text-sm font-normal text-muted-foreground"> / {selectedPlanForSwitch.interval.toLowerCase()}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSwitchPlanModalOpen(false)}>Not now</Button>
            <Button onClick={handleConfirmPlanChange} disabled={actionLoading}>
              {actionLoading && <Loader2 className="animate-spin" />}
              Switch plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
