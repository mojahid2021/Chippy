"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserStore } from "@/lib/stores/userStore"
import {
  Crown,
  Calendar,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
  FileText,
  Loader2,
  Sparkles,
  Zap,
  RefreshCw,
  Clock,
  CheckCircle,
  Bot,
  MessageSquare,
} from "lucide-react"
import type { UserSubscription, SubscriptionInvoice, HealthData } from "@/lib/types/woombat"

export default function Dashboard() {
  const { user } = useUserStore()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [subRes, invRes, healthRes] = await Promise.all([
        fetch('/api/v1/subscriptions/current').catch(() => null),
        fetch('/api/v1/subscriptions/history?page=1&limit=5').catch(() => null),
        fetch('/health').catch(() => null),
      ])

      if (subRes && subRes.ok) {
        const subJson = await subRes.json()
        setSubscription(subJson.data || null)
      } else {
        setSubscription(null)
      }

      if (invRes && invRes.ok) {
        const invJson = await invRes.json()
        setInvoices(invJson.data || [])
      }

      if (healthRes && healthRes.ok) {
        const healthJson = await healthRes.json()
        setHealth(healthJson.data || null)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const displayName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account, view your active subscription tier, and track billing renewals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/dashboard/subscription">Manage Billing</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Account Role & Verification */}
        <Card className="border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Role</p>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{user?.role || "USER"}</span>
            {user?.isEmailVerified ? (
              <Badge className="bg-success-soft text-success border-success/30 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </Badge>
            ) : (
              <Badge className="bg-warning-soft text-warning border-warning/30 text-xs flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Unverified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">{user?.email}</p>
        </Card>

        {/* Current Plan */}
        <Card className="border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscription Tier</p>
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {subscription ? subscription.plan?.name : "Free / Inactive"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {subscription ? `Status: ${subscription.status}` : "No active subscription"}
          </p>
        </Card>

        {/* Billing Cycle / Expiry */}
        <Card className="border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing Period</p>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {subscription ? `${getDaysUntilExpiry(subscription.currentPeriodEnd)} days` : "—"}
            </span>
            {subscription && (
              <span className="text-xs text-muted-foreground">left in cycle</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {subscription ? `Renews: ${formatDate(subscription.currentPeriodEnd)}` : "Select a plan to start"}
          </p>
        </Card>

        {/* System Health */}
        <Card className="border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Service</p>
            <Activity className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground capitalize">{health?.status || "Online"}</span>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Uptime: {health ? `${Math.round(health.uptime)}s` : "Healthy"}
          </p>
        </Card>
      </div>

      {/* Main Grid: Active Subscription Overview + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Subscription Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Subscription Details
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/subscription" className="text-xs flex items-center gap-1">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-xs text-muted-foreground">Loading subscription...</span>
                </div>
              ) : subscription ? (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-foreground">{subscription.plan?.name}</h3>
                        <Badge className="bg-success-soft text-success border-success/30 text-xs">
                          {subscription.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{subscription.plan?.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-foreground">
                        {formatCurrency(subscription.plan?.price || 0, subscription.plan?.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        /{subscription.plan?.interval}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-muted-foreground">Current Billing Period</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-muted-foreground">Auto-Renewal Status</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {subscription.autoRenew ? "Enabled (Auto-renews)" : "Disabled (Cancels at period end)"}
                      </p>
                    </div>
                  </div>

                  {subscription.plan?.features && subscription.plan.features.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Plan Features
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subscription.plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/dashboard/subscription">View Full Billing Details</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/purchase">Change Plan Tier</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-info-soft flex items-center justify-center mx-auto text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">No active subscription</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Enroll in one of our flexible subscription tiers to unlock all premium capabilities.
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                    <Link href="/dashboard/purchase">
                      Explore Plans <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Personas & Messenger Integrations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-border bg-card shadow-sm p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">AI Engine</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">AI Personas & Prompt Compiler</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage system instructions, behavioral guidelines, knowledge base snippets, and simulate LLM prompt synthesis.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button asChild size="sm" variant="outline" className="w-full text-xs">
                  <Link href="/dashboard/ai-profiles" className="flex items-center justify-center gap-1.5">
                    <span>Manage Personas</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="border-border bg-card shadow-sm p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-info-soft border border-border flex items-center justify-center text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">Meta API</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Meta Messenger Webhooks</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    HMAC-SHA256 signature verification, Facebook Page graph sync, and MongoDB audit logs.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button asChild size="sm" variant="outline" className="w-full text-xs">
                  <Link href="/dashboard/messenger" className="flex items-center justify-center gap-1.5">
                    <span>View Webhooks</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Recent Invoices & Quick Links */}
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Recent Invoices
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/subscription" className="text-xs">
                    All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-1.5 opacity-40" />
                  No invoice transactions yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground">
                          {inv.billingReason === "INITIAL_PAYMENT" ? "Initial Plan" : "Renewal"}
                        </p>
                        <p className="text-muted-foreground">{formatDate(inv.paidAt || inv.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {formatCurrency(inv.amount, inv.currency)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] text-success">
                          <CheckCircle className="h-3 w-3" /> {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Profile Summary Card */}
          <Card className="border-border bg-card shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/profile">Profile</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
