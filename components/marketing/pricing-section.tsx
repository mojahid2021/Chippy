"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreLink, SIGNUP } from "@/components/marketing/sections"
import { cn } from "@/lib/utils"

type Plan = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  trialDays: number
  features: string[]
  isActive: boolean
}

const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount)

const per = (p: Plan) => {
  const unit = p.interval.toLowerCase()
  return p.intervalCount > 1 ? `every ${p.intervalCount} ${unit}s` : unit
}

const planCta = (p: Plan) =>
  p.price === 0 ? "Start free" : p.trialDays > 0 ? `Start ${p.trialDays}-day free trial` : `Choose ${p.name}`

export function PricingSection({ detailed = false }: { detailed?: boolean }) {
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [plansFailed, setPlansFailed] = useState(false)
  const [interval, setBillingInterval] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/public/plans")
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error()
        const list = ((json.data?.plans ?? []) as Plan[]).filter((p) => p.isActive).sort((x, y) => x.price - y.price)
        setPlans(list)
        setBillingInterval(list[0]?.interval ?? null)
      })
      .catch(() => {
        setPlansFailed(true)
        setPlans([])
      })
  }, [])

  const intervals = [...new Set((plans ?? []).map((p) => p.interval))]
  const shown = (plans ?? []).filter((p) => intervals.length < 2 || p.interval === interval)
  // Highlight the middle plan of an odd-sized lineup, the usual "best value" spot.
  const featuredId = shown.length >= 3 && shown.length % 2 === 1 ? shown[Math.floor(shown.length / 2)].id : null

  return (
    <section className={cn("mx-auto max-w-site px-4 sm:px-6 lg:px-10", detailed ? "pb-24" : "py-24")}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        {!detailed && (
          <div>
            <h2 className="display text-4xl sm:text-5xl">Simple plans.</h2>
            <p className="mt-3 text-sm text-muted-foreground">Change or cancel anytime from your dashboard.</p>
          </div>
        )}
        {intervals.length > 1 && (
          <div role="group" aria-label="Billing period" className="inline-flex rounded-full border bg-secondary p-1 text-sm">
            {intervals.map((iv) => (
              <button
                key={iv}
                aria-pressed={interval === iv}
                onClick={() => setBillingInterval(iv)}
                className={cn("rounded-full px-4 py-1.5 font-medium capitalize text-muted-foreground", interval === iv && "bg-card text-foreground shadow-sm")}
              >
                {iv.toLowerCase() === "year" ? "Yearly" : iv.toLowerCase() === "month" ? "Monthly" : iv.toLowerCase()}
              </button>
            ))}
          </div>
        )}
        {!detailed && <MoreLink href="/pricing">Compare plans</MoreLink>}
      </div>

      {plans === null ? (
        <div className="mt-10 grid gap-4 lg:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-3xl border bg-muted" />)}
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {plansFailed ? "Plans didn’t load. Refresh the page to try again." : "Plans are coming soon."}
        </p>
      ) : (
        <div className={cn("mt-10 grid items-start gap-4", shown.length === 1 ? "max-w-md" : shown.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3")}>
          {shown.map((plan) => {
            const featured = plan.id === featuredId
            return (
              <div key={plan.id} className={cn("flex flex-col rounded-3xl border p-7", featured ? "bg-ink text-white" : "bg-card")}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl">{plan.name}</h3>
                  {plan.trialDays > 0 && (
                    <span className={cn("rounded-full px-2.5 py-0.5 text-2xs font-semibold", featured ? "bg-brand text-ink" : "bg-brand-soft")}>
                      {plan.trialDays}-day free trial
                    </span>
                  )}
                </div>
                <p className={cn("mt-1 line-clamp-2 min-h-10 text-sm", featured ? "text-white/70" : "text-muted-foreground")}>{plan.description}</p>
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="display text-5xl">{plan.price === 0 ? "Free" : formatPrice(plan.price, plan.currency)}</span>
                  {plan.price > 0 && <span className={cn("text-sm", featured ? "text-white/70" : "text-muted-foreground")}>/ {per(plan)}</span>}
                </p>
                <Button asChild variant={featured ? "brand" : "outline"} className="mt-6 w-full rounded-full">
                  <Link href={SIGNUP}>{planCta(plan)}</Link>
                </Button>
                {plan.features.length > 0 && (
                  <ul className={cn("mt-6 space-y-2.5 border-t pt-6 text-sm", featured && "border-white/15")}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" aria-hidden />{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {detailed && (
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["Pay the local way", "bKash, Nagad, or bank transfer. No card needed, even for the trial."],
            ["Change anytime", "Move up, move down, or cancel from Plan & billing in your dashboard."],
            ["Try it first", "Every paid plan with a trial gives you the full product before you pay."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border bg-background p-6">
              <h3 className="font-sans text-base font-semibold tracking-normal">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
