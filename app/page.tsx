"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo, LogoMark } from "@/components/logo"
import { cn } from "@/lib/utils"

const questions = [
  { q: "Price koto?", a: "৳১,৮৫০ apu, free delivery Dhaka-r moddhe." },
  { q: "XL ache?", a: "Ji, Black ar Navy te XL ache." },
  { q: "COD hobe?", a: "Hobe! Product hate peye taka diben." },
  { q: "কবে পাবো?", a: "ঢাকায় ২ দিন, বাইরে ৩–৪ দিন।" },
  { q: "Dhaka-r baire jabe?", a: "Jabe, charge ৳১২০." },
  { q: "আর কালার আছে?", a: "Black, Navy, Olive — ৩টা কালার আছে।" },
]

const steps = [
  { title: "Connect your Facebook page", body: "Link the page your customers already message. Nothing changes for them." },
  { title: "Teach Chippy your shop", body: "Add prices, sizes, delivery charges, and how you like to talk to customers." },
  { title: "Let it reply", body: "Chippy answers, quotes the price, collects the address, and hands you the order." },
]

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

const faqs = [
  { q: "Will customers know it’s a bot?", a: "Chippy replies in your shop’s voice, in Bangla, Banglish, or English. You can say it’s an assistant in its greeting, and you can step in from the inbox anytime." },
  { q: "What if it doesn’t know the answer?", a: "It sends your fallback reply, such as “Ekjon team member ekhuni janabe”, and the chat waits in your inbox for you." },
  { q: "How do I pay?", a: "bKash, Nagad, or bank transfer. You can change or cancel your plan anytime." },
  { q: "Do I need a developer?", a: "No. Connecting a page and setting up your assistant takes about ten minutes." },
]

function ChatDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="rounded-[2rem] border-[6px] border-ink bg-card shadow-2xl">
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold">NJ</span>
          <div>
            <p className="text-sm font-semibold">Nusrat Jahan</p>
            <p className="text-2xs text-muted-foreground">Messenger · Nakshi Threads</p>
          </div>
        </div>
        <div className="flex h-[340px] flex-col justify-end gap-2 bg-muted/60 px-3.5 py-4 text-sm">
          <p className="bubble-in self-start rounded-2xl rounded-bl-md border bg-card px-3.5 py-2" style={{ "--at": "200ms" } as React.CSSProperties}>
            Ei panjabi ta XL ache? Price koto?
          </p>
          <p className="bubble-in self-end rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-white" style={{ "--at": "900ms" } as React.CSSProperties}>
            Ji apu, Black XL ache 🙂 Price ৳১,৮৫০, Dhaka-y free delivery.
          </p>
          <p className="bubble-in self-start rounded-2xl rounded-bl-md border bg-card px-3.5 py-2" style={{ "--at": "1600ms" } as React.CSSProperties}>
            1 ta nibo. House 12, Road 4, Mirpur 10
          </p>
          <p className="bubble-in self-end rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-white" style={{ "--at": "2300ms" } as React.CSSProperties}>
            Order confirmed! ২ দিনের মধ্যে পেয়ে যাবেন।
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-b-[1.6rem] border-t px-3.5 py-3 text-xs text-muted-foreground">
          <LogoMark className="size-5" /> Chippy replied in 2 seconds
        </div>
      </div>

      <div
        className="bubble-in absolute -right-4 top-16 w-52 rotate-3 rounded-2xl border-2 border-ink bg-brand p-3.5 shadow-lg sm:-right-16"
        style={{ "--at": "2900ms" } as React.CSSProperties}
      >
        <p className="text-xs font-semibold">New order #1042</p>
        <p className="mt-1 text-xs">Cotton Panjabi · Black XL</p>
        <p className="mt-2 font-display text-2xl font-bold">৳১,৮৫০</p>
        <p className="text-2xs">Cash on delivery · Mirpur 10</p>
      </div>
    </div>
  )
}

export default function Home() {
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
    <div className="min-h-screen overflow-x-clip bg-card">
      <header className="sticky top-0 z-40 border-b border-transparent bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-site items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="Chippy home"><Logo /></Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {[["How it works", "#how"], ["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm"><Link href="/auth/signin">Sign in</Link></Button>
            <Button asChild size="sm" className="rounded-full px-4"><Link href="/auth/signin?mode=signup">Start free</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-site items-center gap-16 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-xs shadow-xs">
            <span className="rounded-full bg-brand px-2 py-0.5 font-semibold">New</span>
            Now replies in Bangla, Banglish, and English
          </p>
          <h1 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
            Your page replies. <span className="highlight">You pack orders.</span>
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg text-muted-foreground">
            Chippy answers every Messenger customer in seconds, checks your stock, and turns “price koto?” into a confirmed order.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6"><Link href="/auth/signin?mode=signup">Start 14-day free trial</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6"><a href="#how">See how it works</a></Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No card needed · Pay later with bKash, Nagad, or bank</p>
        </div>
        <ChatDemo />
      </section>

      <section className="border-y bg-background py-20">
        <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-10">
          <h2 className="display max-w-[18ch] text-4xl sm:text-5xl">The same six questions, all day. Answered.</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map(({ q, a }) => (
              <li key={q} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-sm shadow-xs">
                <p className="self-start rounded-2xl rounded-bl-md bg-secondary px-3 py-1.5">{q}</p>
                <p className="self-end rounded-2xl rounded-br-md bg-ink px-3 py-1.5 text-white">{a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-site scroll-mt-20 px-4 py-24 sm:px-6">
        <h2 className="display max-w-[16ch] text-4xl sm:text-5xl">Live in ten minutes.</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="grid size-10 place-items-center rounded-full border-2 border-ink bg-brand font-display text-lg font-bold">{i + 1}</span>
              <h3 className="mt-5 text-xl">{step.title}</h3>
              <p className="mt-1.5 max-w-[36ch] text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="mx-auto grid max-w-site scroll-mt-20 gap-4 px-4 sm:px-6 lg:px-10 lg:grid-cols-6">
        <article className="rounded-3xl bg-ink p-7 text-white lg:col-span-4">
          <h3 className="text-2xl">Understands how your customers really type.</h3>
          <p className="mt-2 max-w-[48ch] text-sm text-white/70">Spelling mistakes, Banglish, and mixed Bangla are all fine. Five ways to ask one question, one right answer.</p>
          <div className="mt-8 flex flex-wrap gap-2 text-sm">
            {["dam koto", "price?", "কত টাকা", "koto porbe", "taka koto"].map((t) => (
              <span key={t} className="rounded-full border border-white/20 px-3 py-1.5">{t}</span>
            ))}
            <span className="rounded-full bg-brand px-3 py-1.5 font-semibold text-ink">→ ৳১,৮৫০</span>
          </div>
        </article>
        <article className="rounded-3xl border bg-card p-7 lg:col-span-2">
          <h3 className="text-2xl">Never sells what you don’t have.</h3>
          <div className="mt-8 rounded-2xl border bg-muted/60 p-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Black XL</span>
              <span className="font-semibold">4 left</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary"><div className="h-full w-1/4 rounded-full bg-ink" /></div>
          </div>
        </article>
        <article className="rounded-3xl border bg-card p-7 lg:col-span-2">
          <h3 className="text-2xl">Step in anytime.</h3>
          <p className="mt-2 text-sm text-muted-foreground">Every chat is in your inbox. Reply yourself and Chippy steps back.</p>
          <div className="mt-6 flex -space-x-2">
            {["NJ", "TA", "SR", "MK"].map((x) => (
              <span key={x} className="grid size-9 place-items-center rounded-full border-2 border-card bg-secondary text-xs font-semibold">{x}</span>
            ))}
          </div>
        </article>
        <article className="rounded-3xl border-2 border-ink bg-brand p-7 lg:col-span-4">
          <h3 className="text-2xl">An assistant with your shop’s personality.</h3>
          <p className="mt-2 max-w-[48ch] text-sm">Set the tone, the do’s and don’ts, your delivery rules, and the fallback reply. Make one for each page.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {["Friendly apu", "Formal", "Short replies", "Always mention COD"].map((t) => (
              <span key={t} className="rounded-full bg-card px-3 py-1.5 font-medium">{t}</span>
            ))}
          </div>
        </article>
      </section>

      <section id="pricing" className="mx-auto max-w-site scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display text-4xl sm:text-5xl">Simple plans.</h2>
            <p className="mt-3 text-sm text-muted-foreground">Change or cancel anytime from your dashboard.</p>
          </div>
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
                    <Link href="/auth/signin?mode=signup">{planCta(plan)}</Link>
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
      </section>

      <section id="faq" className="mx-auto grid max-w-site scroll-mt-20 gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
        <h2 className="display text-4xl sm:text-5xl">Questions shop owners ask us.</h2>
        <div className="divide-y border-y">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
                {f.q}
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-site flex-col items-start justify-between gap-8 rounded-3xl border-2 border-ink bg-brand p-8 sm:p-12 lg:flex-row lg:items-end">
          <h2 className="display max-w-[16ch] text-4xl sm:text-6xl">Stop typing “price koto” answers.</h2>
          <Button asChild size="lg" className="rounded-full px-6"><Link href="/auth/signin?mode=signup">Start 14-day free trial</Link></Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-site flex-col gap-5 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo className="text-foreground" />
        <nav className="flex flex-wrap gap-5">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <Link href="/auth/signin" className="hover:text-foreground">Sign in</Link>
        </nav>
        <p>© {new Date().getFullYear()} Chippy. Made in Dhaka.</p>
      </footer>
    </div>
  )
}
