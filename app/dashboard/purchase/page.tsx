"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, Loader2 } from "lucide-react"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { SubscriptionPlan, UserSubscription } from "@/lib/types/woombat"

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount)

export default function PurchasePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams?.get("planId")

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingPlan, setFetchingPlan] = useState(true)
  const [autoRenew, setAutoRenew] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setFetchingPlan(true)
        const [plansRes, subRes] = await Promise.all([
          fetch("/api/v1/subscriptions/plans"),
          fetch("/api/v1/subscriptions/current").catch(() => null),
        ])
        const plansJson = await plansRes.json()
        let sub: UserSubscription | null = null
        if (subRes && subRes.ok) {
          sub = (await subRes.json()).data ?? null
          setCurrentSubscription(sub)
        }
        if (plansRes.ok && Array.isArray(plansJson.data)) {
          const list = (plansJson.data as SubscriptionPlan[]).filter((p) => p.isActive !== false)
          if (planId) {
            try {
              const singleRes = await fetch(`/api/v1/subscriptions/plans/${encodeURIComponent(planId)}`)
              const singleJson = await singleRes.json()
              if (singleRes.ok && singleJson.data) {
                const found = singleJson.data as SubscriptionPlan
                if (!list.some((p) => p.id === found.id)) {
                  list.unshift(found)
                }
              }
            } catch {
              // fallback to general list
            }
          }
          setPlans(list)
          const preferred = list.find((p) => p.id === planId) ?? list.find((p) => p.id !== sub?.planId) ?? list[0]
          setSelectedId(preferred?.id ?? null)
        }
      } catch {
        toast({ variant: "destructive", title: "Couldn’t load plans", description: "Check your connection and refresh." })
      } finally {
        setFetchingPlan(false)
      }
    }
    void load()
  }, [planId])

  const plan = plans.find((p) => p.id === selectedId) ?? null
  const isCurrentPlan = !!plan && currentSubscription?.planId === plan.id
  const isPlanChange = !!currentSubscription && currentSubscription.status === "ACTIVE"

  const confirmSubscription = async () => {
    if (!plan) return
    try {
      setLoading(true)
      const res = await fetch(isPlanChange ? "/api/v1/subscriptions/change-plan" : "/api/v1/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isPlanChange ? { newPlanId: plan.id, autoRenew } : { planId: plan.id, autoRenew }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || "Try again in a moment.")
      toast({
        variant: "success",
        title: isPlanChange ? "Plan switched" : "You’re subscribed",
        description: `Welcome to ${plan.name}.`,
      })
      router.push("/dashboard/subscription")
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn’t complete this", description: err instanceof Error ? err.message : "Try again in a moment." })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingPlan) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading plans
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        title="No plans available right now"
        body="Check back soon, or contact us on WhatsApp for a custom plan."
        action={<Button asChild variant="outline"><Link href="/dashboard/subscription">Back to Plan & billing</Link></Button>}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPlanChange ? "Change your plan" : "Choose a plan"}
        description="Switch anytime. Pay with bKash, Nagad, or bank transfer."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div role="radiogroup" aria-label="Plans" className="space-y-3">
          {plans.map((p) => {
            const selected = p.id === selectedId
            const current = currentSubscription?.planId === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "flex w-full gap-4 rounded-2xl border bg-card p-5 text-left transition-shadow",
                  selected ? "border-ink shadow-md ring-1 ring-ink" : "hover:border-input"
                )}
              >
                <span className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-ink bg-brand" : "border-input")}>
                  {selected && <span className="size-2 rounded-full bg-ink" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold">{p.name}</span>
                    {current && <Badge variant="secondary">Your current plan</Badge>}
                    {p.trialDays > 0 && !current && <Badge variant="info">{p.trialDays}-day free trial</Badge>}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{p.description}</span>
                  {selected && (
                    <span className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                      {p.features.map((f, i) => (
                        <span key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{f}</span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-2xl font-bold">{formatCurrency(p.price, p.currency)}</span>
                  <span className="text-xs text-muted-foreground">per {p.interval.toLowerCase()}</span>
                </span>
              </button>
            )
          })}
        </div>

        {plan && (
          <aside className="space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-4">
            <h2 className="text-lg">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd className="font-medium">{plan.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Billed</dt><dd>Every {plan.interval.toLowerCase()}</dd></div>
              {plan.trialDays > 0 && !isPlanChange && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Free trial</dt><dd>{plan.trialDays} days</dd></div>
              )}
              <div className="flex items-baseline justify-between border-t pt-3">
                <dt className="font-medium">{plan.trialDays > 0 && !isPlanChange ? "Due after trial" : "Due today"}</dt>
                <dd className="font-display text-2xl font-bold">{formatCurrency(plan.price, plan.currency)}</dd>
              </div>
            </dl>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium">Renew automatically</span>
                <span className="block text-xs text-muted-foreground">Turn off anytime in Plan & billing.</span>
              </span>
              <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
            </label>
            <Button size="lg" className="w-full" onClick={confirmSubscription} disabled={loading || isCurrentPlan}>
              {loading && <Loader2 className="animate-spin" />}
              {isCurrentPlan ? "You’re on this plan" : isPlanChange ? `Switch to ${plan.name}` : plan.trialDays > 0 ? "Start free trial" : `Subscribe to ${plan.name}`}
            </Button>
            <Button asChild variant="ghost" className="w-full"><Link href="/dashboard/subscription">Not now</Link></Button>
          </aside>
        )}
      </div>
    </div>
  )
}
