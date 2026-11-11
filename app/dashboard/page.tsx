"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useUserStore } from "@/lib/stores/userStore"
import { Bot, Check, CreditCard, FileText, Inbox, Loader2, Plug, RefreshCw } from "lucide-react"
import type { UserSubscription, SubscriptionInvoice, MessengerWebhook, AiProfile } from "@/lib/types/woombat"
import { cn } from "@/lib/utils"

async function getData<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url)
    if (!res.ok) return fallback
    const json = await res.json()
    return (json.data ?? fallback) as T
  } catch {
    return fallback
  }
}

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount)

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"

const daysLeft = (end: string) => Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000))

export default function Dashboard() {
  const { user } = useUserStore()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
  const [pages, setPages] = useState<MessengerWebhook[]>([])
  const [assistants, setAssistants] = useState<AiProfile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [sub, inv, hooks, profiles] = await Promise.all([
      getData<UserSubscription | null>("/api/v1/subscriptions/current", null),
      getData<SubscriptionInvoice[]>("/api/v1/subscriptions/history?page=1&limit=5", []),
      getData<MessengerWebhook[]>("/api/v1/messenger/webhooks", []),
      getData<AiProfile[]>("/api/v1/ai-profiles?limit=50", []),
    ])
    setSubscription(sub)
    setInvoices(Array.isArray(inv) ? inv : [])
    setPages(Array.isArray(hooks) ? hooks : [])
    setAssistants(Array.isArray(profiles) ? profiles : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const defaultAssistant = assistants.find((a) => a.isDefault)
  const activePages = pages.filter((p) => p.isActive).length

  // The order merchants actually have to do things in.
  const steps = [
    { title: "Choose a plan", body: "Pick a plan to switch on automatic replies.", done: !!subscription, href: "/dashboard/purchase", cta: "See plans" },
    { title: "Create an AI assistant", body: "Tell it about your shop, products, and how to talk to customers.", done: assistants.length > 0, href: "/dashboard/ai-profiles", cta: "Create assistant" },
    { title: "Connect your Facebook page", body: "Link the page your customers already message.", done: pages.length > 0, href: "/dashboard/messenger", cta: "Connect page" },
    {
      title: "Choose who replies",
      body: "Set a default assistant, or pick one for each page.",
      done: !!defaultAssistant || pages.some((p) => p.aiProfileId),
      href: pages.length > 0 ? "/dashboard/messenger" : "/dashboard/ai-profiles",
      cta: "Choose assistant",
    },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const nextStep = steps.findIndex((s) => !s.done)

  const stats = [
    {
      label: "Facebook pages",
      value: pages.length,
      note: pages.length ? `${activePages} replying now` : "None connected",
      href: "/dashboard/messenger",
      icon: Plug,
    },
    {
      label: "AI assistants",
      value: assistants.length,
      note: defaultAssistant ? `Default: ${defaultAssistant.name}` : "No default set",
      href: "/dashboard/ai-profiles",
      icon: Bot,
    },
    {
      label: subscription?.plan?.name ?? "No plan",
      value: subscription ? `${daysLeft(subscription.currentPeriodEnd)} days` : "—",
      note: subscription
        ? `${subscription.autoRenew ? "Renews" : "Ends"} ${formatDate(subscription.currentPeriodEnd)}`
        : "Choose a plan to start",
      href: "/dashboard/subscription",
      icon: CreditCard,
    },
  ]

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there"

  return (
    <div className="space-y-5">
      <PageHeader
        title={<>Hi, {firstName} <span aria-hidden>👋</span></>}
        description={doneCount < steps.length ? "Finish setup so your page can start taking orders on its own." : "Your page is set up and replying to customers."}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            {pages.length > 0 && (
              <Button asChild size="sm">
                {/* One page: straight to its inbox. Several: pick the page first. */}
                <Link href={pages.length === 1 ? `/dashboard/messenger/${pages[0].id}/inbox` : "/dashboard/messenger"}>
                  <Inbox className="size-3.5" />
                  {pages.length === 1 ? "Open inbox" : "Open an inbox"}
                </Link>
              </Button>
            )}
          </>
        }
      />

      {!loading && doneCount < steps.length && (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 className="text-lg">Get your page ready</h2>
              <p className="text-xs text-muted-foreground">{doneCount} of {steps.length} done</p>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary" aria-hidden>
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
          </div>
          <ol className="divide-y">
            {steps.map((step, i) => (
              <li key={step.title} className={cn("flex items-center gap-3.5 px-5 py-3", i === nextStep && "bg-brand-soft")}>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-medium",
                    step.done ? "border-ink bg-brand text-brand-foreground" : "bg-card text-muted-foreground"
                  )}
                >
                  {step.done ? <Check className="size-3.5" aria-label="Done" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", step.done && "text-muted-foreground line-through decoration-border")}>{step.title}</p>
                  {!step.done && <p className="text-xs text-muted-foreground">{step.body}</p>}
                </div>
                {!step.done && (
                  <Button asChild size="sm" variant={i === nextStep ? "default" : "outline"}>
                    <Link href={step.href}>{step.cta}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{s.label}</span>
              <span className="grid size-8 place-items-center rounded-lg bg-secondary transition-colors group-hover:bg-brand"><s.icon className="size-4 text-foreground" /></span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">{loading ? "…" : s.value}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{loading ? "Loading" : s.note}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Your plan</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/subscription">Manage billing</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold">{subscription.plan?.name}</p>
                    <p className="text-xs text-muted-foreground">{subscription.plan?.description}</p>
                  </div>
                  <p className="text-right">
                    <span className="font-display text-2xl font-bold">{formatCurrency(subscription.plan?.price || 0, subscription.plan?.currency)}</span>
                    <span className="text-xs text-muted-foreground"> / {subscription.plan?.interval?.toLowerCase()}</span>
                  </p>
                </div>
                <dl className="grid gap-3 rounded-lg border bg-background p-3 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-0.5 font-medium capitalize">{subscription.status.toLowerCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Current period</dt>
                    <dd className="mt-0.5 font-medium">{formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Auto-renew</dt>
                    <dd className="mt-0.5 font-medium">{subscription.autoRenew ? "On" : "Off, ends at period end"}</dd>
                  </div>
                </dl>
                {!!subscription.plan?.features?.length && (
                  <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
                    {subscription.plan.features.map((f) => (
                      <li key={f} className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0" />{f}</li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/purchase">Change plan</Link>
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-medium">You’re not on a plan yet</p>
                <p className="mx-auto mt-1 max-w-[40ch] text-xs text-muted-foreground">Choose a plan to switch on automatic replies. Pay with bKash, Nagad, or bank transfer.</p>
                <Button asChild size="sm" className="mt-4"><Link href="/dashboard/purchase">See plans</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Recent invoices</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/subscription">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <FileText className="mx-auto mb-2 size-5 opacity-50" />
                Invoices appear here after your first payment.
              </div>
            ) : (
              <ul className="-my-2 divide-y">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <p className="font-medium">{inv.billingReason === "INITIAL_PAYMENT" ? "First payment" : "Renewal"}</p>
                      <p className="text-muted-foreground">{formatDate(inv.paidAt || inv.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(inv.amount, inv.currency)}</p>
                      <p className="capitalize text-success">{inv.status.toLowerCase()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
