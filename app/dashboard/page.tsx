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
    <div className="space-y-4">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your account, view your active subscription tier, and track billing renewals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/dashboard/subscription">Manage Billing</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Account Role & Verification */}
        <Card className="border-border bg-card p-3.5 sm:p-4 gap-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Account Role</p>
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">{user?.role || "USER"}</span>
            {user?.isEmailVerified ? (
              <Badge className="bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
              </Badge>
            ) : (
              <Badge className="bg-warning-soft text-warning border-warning/30 text-[10px] py-0 px-1.5 flex items-center gap-1">
                <XCircle className="w-2.5 h-2.5" /> Unverified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">{user?.email}</p>
        </Card>

        {/* Current Plan */}
        <Card className="border-border bg-card p-3.5 sm:p-4 gap-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subscription Tier</p>
            <Crown className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {subscription ? subscription.plan?.name : "Free / Inactive"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {subscription ? `Status: ${subscription.status}` : "No active subscription"}
          </p>
        </Card>

        {/* Billing Cycle / Expiry */}
        <Card className="border-border bg-card p-3.5 sm:p-4 gap-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Billing Period</p>
            <Calendar className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {subscription ? `${getDaysUntilExpiry(subscription.currentPeriodEnd)} days` : "—"}
            </span>
            {subscription && (
              <span className="text-[11px] text-muted-foreground">left in cycle</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {subscription ? `Renews: ${formatDate(subscription.currentPeriodEnd)}` : "Select a plan to start"}
          </p>
        </Card>

        {/* System Health */}
        <Card className="border-border bg-card p-3.5 sm:p-4 gap-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">System Service</p>
            <Activity className="h-3.5 w-3.5 text-success" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground capitalize">{health?.status || "Online"}</span>
            <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Uptime: {health ? `${Math.round(health.uptime)}s` : "Healthy"}
          </p>
        </Card>
      </div>

      {/* Main Grid: Active Subscription Overview + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Active Subscription Card */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card shadow-sm py-3.5 gap-3">
            <CardHeader className="border-b border-border pb-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-primary" />
                  Subscription Details
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                  <Link href="/dashboard/subscription" className="flex items-center gap-1">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-xs text-muted-foreground">Loading subscription...</span>
                </div>
              ) : subscription ? (
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-bold text-foreground">{subscription.plan?.name}</h3>
                        <Badge className="bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5">
                          {subscription.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{subscription.plan?.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-foreground">
                        {formatCurrency(subscription.plan?.price || 0, subscription.plan?.currency)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        /{subscription.plan?.interval}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <p className="text-muted-foreground text-[11px]">Current Billing Period</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <p className="text-muted-foreground text-[11px]">Auto-Renewal Status</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {subscription.autoRenew ? "Enabled (Auto-renews)" : "Disabled (Cancels at period end)"}
                      </p>
                    </div>
                  </div>

                  {subscription.plan?.features && subscription.plan.features.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Plan Features
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {subscription.plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-foreground/90">
                            <Zap className="h-3 w-3 text-primary shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/dashboard/subscription">View Full Billing Details</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link href="/dashboard/purchase">Change Plan Tier</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-info-soft flex items-center justify-center mx-auto text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-foreground">No active subscription</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
                      Enroll in one of our flexible subscription tiers to unlock all premium capabilities.
                    </p>
                  </div>
                  <Button asChild size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground mt-1">
                    <Link href="/dashboard/purchase">
                      Explore Plans <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Personas & Messenger Integrations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="border-border bg-card shadow-sm p-3.5 gap-0 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">AI Engine</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-xs">AI Personas & Prompt Compiler</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Manage system instructions, behavioral guidelines, knowledge base snippets, and simulate LLM prompt synthesis.
                  </p>
                </div>
              </div>
              <div className="pt-2.5">
                <Button asChild size="sm" variant="outline" className="w-full h-7 text-xs">
                  <Link href="/dashboard/ai-profiles" className="flex items-center justify-center gap-1.5">
                    <span>Manage Personas</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="border-border bg-card shadow-sm p-3.5 gap-0 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-7 w-7 rounded-md bg-info-soft border border-border flex items-center justify-center text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">Meta API</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-xs">Meta Messenger Webhooks</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    HMAC-SHA256 signature verification, Facebook Page graph sync, and MongoDB audit logs.
                  </p>
                </div>
              </div>
              <div className="pt-2.5">
                <Button asChild size="sm" variant="outline" className="w-full h-7 text-xs">
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
        <div className="space-y-4">
          <Card className="border-border bg-card shadow-sm py-3.5 gap-3">
            <CardHeader className="border-b border-border pb-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Recent Invoices
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-6 text-xs px-2">
                  <Link href="/dashboard/subscription">
                    All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-5 text-xs text-muted-foreground">
                  <FileText className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  No invoice transactions yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground text-xs">
                          {inv.billingReason === "INITIAL_PAYMENT" ? "Initial Plan" : "Renewal"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(inv.paidAt || inv.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-xs">
                          {formatCurrency(inv.amount, inv.currency)}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-success">
                          <CheckCircle className="h-2.5 w-2.5" /> {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Profile Summary Card */}
          <Card className="border-border bg-card shadow-sm p-3.5 gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-none">{user?.email}</p>
              </div>
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link href="/dashboard/profile">Profile</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
