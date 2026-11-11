"use client"

import { useState, useEffect, useCallback } from "react"
import Link from 'next/link'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  Unlock
} from "lucide-react"
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type {
  SubscriptionPlan,
  UserSubscription,
  SubscriptionInvoice,
  SubscriptionHistoryResponse,
  PremiumContentData
} from '@/lib/types/woombat'

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
          title: cancelImmediate ? 'Subscription Canceled' : 'Cancellation Scheduled',
          description: data.message || 'Subscription updated successfully.',
        })
        setCancelModalOpen(false)
        setCancelReason("")
        setCancelImmediate(false)
        await fetchCurrentSubscription()
      } else {
        toast({
          variant: 'destructive',
          title: 'Cancellation Failed',
          description: data.message || 'Could not cancel subscription.',
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Network error',
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
          title: 'Subscription Resumed',
          description: data.message || 'Auto-renewal has been re-enabled.',
        })
        await fetchCurrentSubscription()
      } else {
        toast({
          variant: 'destructive',
          title: 'Resume Failed',
          description: data.message || 'Failed to resume auto-renewal.',
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Network error',
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
          title: autoRenew ? 'Auto-Renewal Enabled' : 'Auto-Renewal Disabled',
          description: data.message || `Auto-renewal is now ${autoRenew ? 'active' : 'disabled'}.`,
        })
        await fetchCurrentSubscription()
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: data.message || 'Failed to update auto-renewal toggle.',
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Network error',
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
          title: 'Plan Updated',
          description: data.message || `Switched to ${selectedPlanForSwitch.name} successfully.`,
        })
        setSwitchPlanModalOpen(false)
        setSelectedPlanForSwitch(null)
        await fetchCurrentSubscription()
        await fetchInvoices(1)
      } else {
        toast({
          variant: 'destructive',
          title: 'Plan Switch Failed',
          description: data.message || 'Could not update plan.',
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Network error',
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
          title: 'Access Granted',
          description: data.message || 'You have active subscription access to premium content.',
        })
      } else {
        setPremiumData(null)
        setPremiumError(data.message || 'Access denied: Subscription inactive or expired')
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: data.message || 'Active subscription required.',
        })
      }
    } catch {
      setPremiumError('Failed to communicate with premium content service')
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
    if (!dateString) return 'N/A'
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

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge className="bg-success-soft text-success border-success/30">Active</Badge>
      case 'TRIALING':
        return <Badge className="bg-info-soft text-info border-info/30">Trial Period</Badge>
      case 'CANCELED':
      case 'CANCELLED':
        return <Badge className="bg-destructive-soft text-destructive border-destructive/30">Canceled</Badge>
      case 'PAST_DUE':
        return <Badge className="bg-warning-soft text-warning border-warning/30">Past Due</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return (
          <Badge className="bg-success-soft text-success border-success/30 flex items-center gap-1 text-xs">
            <CheckCircle className="h-3 w-3" /> Paid
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className="bg-warning-soft text-warning border-warning/30 flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge className="bg-destructive-soft text-destructive border-destructive/30 flex items-center gap-1 text-xs">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Subscriptions & Billing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your subscription tier, billing period, and invoice transactions
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            fetchCurrentSubscription()
            fetchPlans()
            fetchInvoices(1)
          }}
          disabled={loading || plansLoading}
          className="h-8 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={cn("h-3 w-3", (loading || plansLoading) && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* No Subscription Alert */}
      {!loading && !subscription && (
        <Card className="border-info/30 bg-info-soft/40 p-3.5 gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-info-soft flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">No active subscription found</p>
                <p className="text-[11px] text-muted-foreground">
                  Select a subscription plan below to unlock automated store tools and AI features.
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="h-7 text-xs bg-primary hover:bg-primary/90"
              onClick={() => {
                const el = document.getElementById('available-plans-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore Plans <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Current Active Subscription Banner */}
      {subscription && (
        <Card className="border-border overflow-hidden bg-card shadow-sm py-0 gap-0">
          <div className="bg-card border-b border-border p-3.5 sm:px-4 py-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-info-soft border border-info/30 flex items-center justify-center text-info shrink-0">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {getStatusBadge(subscription.status)}
                    {subscription.cancelAtPeriodEnd && (
                      <Badge className="bg-warning-soft text-warning border-warning/30 flex items-center gap-1 text-[10px] py-0 px-1.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> Scheduled to Cancel
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {subscription.plan?.name || "Active"} Plan
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {subscription.plan?.description || "Subscribed member"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-0.5">
                <p className="text-[11px] text-muted-foreground">Current Billing Cycle</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
                </p>
                <p className="text-[11px] text-primary font-medium">
                  {getDaysUntilExpiry(subscription.currentPeriodEnd)} days remaining
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/20">
            {/* Auto Renewal Card */}
            <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Auto-Renewal
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-foreground">
                    {subscription.autoRenew ? 'Enabled (Recurring)' : 'Disabled (Will not renew)'}
                  </span>
                  <Switch 
                    checked={subscription.autoRenew}
                    disabled={actionLoading}
                    onCheckedChange={(checked) => handleToggleAutoRenew(checked)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  {subscription.cancelAtPeriodEnd 
                    ? 'Subscription will terminate at the end of the current period.' 
                    : 'Your card will renew automatically at the end of billing cycle.'}
                </p>
              </div>
            </div>

            {/* Plan Price & Interval */}
            <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Rate & Interval
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(subscription.plan?.price || 0, subscription.plan?.currency)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    /{subscription.plan?.interval?.toLowerCase() || 'month'}
                  </span>
                </p>
                {subscription.lastRenewalAt && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Last renewed: {formatDate(subscription.lastRenewalAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Subscription Actions */}
            <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Subscription Controls
                </p>
                <div className="flex flex-col gap-2 mt-1">
                  {subscription.cancelAtPeriodEnd ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleResumeSubscription}
                      disabled={actionLoading}
                      className="w-full h-7 text-xs text-success border-success/30 hover:bg-success-soft"
                    >
                      {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                      Resume Auto-Renewal
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setCancelModalOpen(true)}
                      disabled={actionLoading}
                      className="w-full h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive-soft"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans Catalog */}
      <div id="available-plans-section" className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Available Subscription Plans</h2>
          <p className="text-xs text-muted-foreground">Select a pricing tier for your merchant workspace</p>
        </div>

        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 border-border animate-pulse space-y-3">
                <div className="h-5 w-1/2 bg-muted rounded"></div>
                <div className="h-7 w-1/3 bg-muted rounded"></div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-muted rounded"></div>
                  <div className="h-3.5 w-3/4 bg-muted rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card className="p-6 text-center border-border">
            <p className="text-xs text-muted-foreground">No active subscription plans available at this moment.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {plans.map((plan) => {
              const isCurrent = subscription?.planId === plan.id
              const hasTrial = plan.trialDays > 0

              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative border-2 transition-all p-4 flex flex-col justify-between hover:shadow-md gap-0",
                    isCurrent ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-2.5 py-0 text-[10px] shadow">
                        <Check className="h-2.5 w-2.5 mr-1" />
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{plan.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{plan.description}</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-info-soft flex items-center justify-center shrink-0">
                        {plan.price > 20 ? <Shield className="h-4 w-4 text-primary" /> : <Zap className="h-4 w-4 text-primary" />}
                      </div>
                    </div>

                    <div className="my-2.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">
                          {formatCurrency(plan.price, plan.currency)}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase font-medium">
                          /{plan.interval}
                        </span>
                      </div>
                      {hasTrial && (
                        <Badge className="mt-1 bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5">
                          <Sparkles className="h-2.5 w-2.5 mr-1" /> {plan.trialDays}-Day Free Trial
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 my-3 border-t border-border pt-2.5">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    {isCurrent ? (
                      <Button className="w-full h-8 text-xs bg-muted text-muted-foreground hover:bg-muted" disabled>
                        Subscribed
                      </Button>
                    ) : subscription ? (
                      <Button 
                        className="w-full h-8 text-xs"
                        variant="outline"
                        onClick={() => {
                          setSelectedPlanForSwitch(plan)
                          setSwitchPlanModalOpen(true)
                        }}
                      >
                        Switch to {plan.name}
                      </Button>
                    ) : (
                      <Link href={`/dashboard/purchase?planId=${plan.id}`} className="w-full block">
                        <Button className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                          Subscribe <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Invoice & Billing History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <Card className="lg:col-span-2 border-border bg-card py-0 gap-0">
          <div className="p-3 sm:px-4 py-2.5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-xs">Billing & Invoice History</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Past invoice settlement records and billing renewals
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchInvoices(pagination.page)} 
              disabled={invoicesLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={cn("h-3 w-3", invoicesLoading && "animate-spin")} />
            </Button>
          </div>

          <div className="p-3 sm:p-4">
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">Loading invoices...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-1.5 opacity-50" />
                <p className="text-xs font-medium text-foreground">No invoices generated yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Invoices will appear here once your subscription billing executes.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {inv.billingReason === 'INITIAL_PAYMENT' ? 'Initial Plan Enrollment' : 'Subscription Renewal'}
                          </p>
                          {getInvoiceStatusBadge(inv.status)}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Period: {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Invoice ID: {inv.id.substring(0, 18)}...
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">
                        {formatCurrency(inv.amount, inv.currency)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(inv.paidAt || inv.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Premium Content & Route Guard Verification Card */}
        <Card className="border-border bg-card py-0 gap-0">
          <div className="p-3 sm:px-4 py-2.5 border-b border-border">
            <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Member Access Verification
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Verify your active subscription status with the backend route guard
            </p>
          </div>

          <div className="p-3 sm:p-4 space-y-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Protected endpoints use the backend subscription validator. Click below to test your access.
            </p>

            <Button 
              className="w-full h-8 text-xs" 
              variant="outline"
              disabled={testingPremium}
              onClick={handleTestPremiumContent}
            >
              {testingPremium ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 mr-1.5 text-primary" /> Test Premium Access
                </>
              )}
            </Button>

            {premiumData && (
              <div className="p-2.5 rounded-md bg-success-soft/50 border border-success/30 space-y-1 text-xs">
                <p className="font-semibold text-success flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3.5 w-3.5" /> Access Granted
                </p>
                <p className="text-foreground/90 text-xs">{premiumData.content}</p>
                <div className="pt-1 text-[11px] text-muted-foreground flex items-center justify-between border-t border-success/20">
                  <span>Tier: <strong>{premiumData.tier}</strong></span>
                  <span>Expires: {formatDate(premiumData.expiresAt)}</span>
                </div>
              </div>
            )}

            {premiumError && (
              <div className="p-2.5 rounded-md bg-destructive-soft/50 border border-destructive/30 space-y-1 text-xs">
                <p className="font-semibold text-destructive flex items-center gap-1 text-xs">
                  <Lock className="h-3.5 w-3.5" /> Restricted Access
                </p>
                <p className="text-destructive/90 text-xs">{premiumError}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="cancel-reason" className="text-xs font-medium text-foreground">
                Reason for cancellation (optional)
              </label>
              <textarea
                id="cancel-reason"
                className="w-full min-h-[80px] p-2.5 text-xs rounded-md border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Let us know why you are canceling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Terminate access immediately</p>
                <p className="text-xs text-muted-foreground">
                  Default is to keep access until current billing period ends.
                </p>
              </div>
              <Switch 
                checked={cancelImmediate} 
                onCheckedChange={setCancelImmediate}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Switch Plan Dialog */}
      <Dialog open={switchPlanModalOpen} onOpenChange={setSwitchPlanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Subscription Plan</DialogTitle>
            <DialogDescription>
              Upgrade or downgrade your current subscription to {selectedPlanForSwitch?.name}.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForSwitch && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                <p className="font-semibold text-sm text-foreground">{selectedPlanForSwitch.name}</p>
                <p className="text-muted-foreground">{selectedPlanForSwitch.description}</p>
                <p className="text-base font-bold text-foreground mt-2">
                  {formatCurrency(selectedPlanForSwitch.price, selectedPlanForSwitch.currency)} / {selectedPlanForSwitch.interval}
                </p>
              </div>
              <p className="text-muted-foreground">
                Your new billing cycle will begin immediately upon confirmation.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSwitchPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleConfirmPlanChange}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirm Plan Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
