"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

const askedAllDay = [
  "Price koto?",
  "XL ache?",
  "Delivery charge koto?",
  "COD hobe?",
  "কবে পাবো?",
  "Dhaka-r baire jabe?",
  "আর কালার আছে?",
  "Inbox please",
]

const steps = [
  { title: "Connect your Facebook page", body: "Link the page your customers already message. Nothing changes for them." },
  { title: "Add your products", body: "Enter names, prices, sizes, and stock. The bot only sells what you list." },
  { title: "Let it reply", body: "It answers, quotes the price, collects the address, and creates the order." },
]

const plans = [
  {
    name: "Starter",
    audience: "For a single Facebook page",
    monthly: "৳১,৮৫০",
    yearly: "৳১,৫০০",
    features: ["Up to 50 products", "1 Facebook page", "1,500 AI conversations a month", "Order management and receipts"],
  },
  {
    name: "Growth Pro",
    audience: "For shops growing past one person",
    monthly: "৳৩,৯৫০",
    yearly: "৳৩,২০০",
    featured: true,
    features: ["Unlimited products and categories", "Unlimited AI conversations", "5 team seats with roles", "Custom AI personalities and prompts", "Priority bKash and WhatsApp support"],
  },
  {
    name: "Enterprise Scale",
    audience: "For agencies and multi-brand sellers",
    monthly: "৳৮,৯০০",
    yearly: "৳৭,২০০",
    features: ["Multiple brands and workspaces", "Unlimited team seats", "AI trained on your catalog", "Dedicated message queue"],
  },
]

const orders = [
  { name: "Nusrat J.", item: "Cotton Panjabi, Black XL", status: "New", tone: "bg-marigold text-ink" },
  { name: "Tanvir A.", item: "Jamdani Saree, Teal", status: "Confirmed", tone: "bg-info-soft text-info" },
  { name: "Sadia R.", item: "Kids Kurti, Size 6", status: "Delivered", tone: "bg-success-soft text-success" },
]

const startCta = "bg-marigold text-ink hover:bg-marigold/85"

export default function Home() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <section className="scallop bg-sidebar text-white">
        <header className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-8">
          <Link href="/" aria-label="BDChatPro home"><Logo /></Link>
          <nav className="hidden items-center gap-8 font-medium md:flex">
            <a href="#how" className="hover:text-marigold">How it works</a>
            <a href="#features" className="hover:text-marigold">Features</a>
            <a href="#pricing" className="hover:text-marigold">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hover:bg-white/15 hover:text-white">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
            <Button asChild className={cn(startCta, "hidden sm:inline-flex")}>
              <Link href="/auth/signin">Start free trial</Link>
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-4 sm:px-8 lg:pb-20">
          {/* The conversation is the hero: it plays once, then the page explains it. */}
          <div aria-hidden className="display relative flex flex-col gap-3 text-[clamp(2.5rem,min(8.5vw,14vh),8rem)]">
            <p className="bubble-in self-start rounded-[0.38em] rounded-bl-[0.06em] bg-white px-[0.4em] pb-[0.1em] pt-[0.16em] text-ink">
              Price koto?
            </p>
            <p style={{ "--at": "600ms" } as React.CSSProperties} className="bubble-in max-w-full self-end rounded-[0.38em] rounded-br-[0.06em] bg-marigold px-[0.4em] pb-[0.1em] pt-[0.16em] text-ink">
              ৳১,৮৫০. XL ache.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <p style={{ "--at": "1200ms" } as React.CSSProperties} className="bubble-in rounded-[0.38em] rounded-bl-[0.06em] bg-white px-[0.4em] pb-[0.1em] pt-[0.16em] text-ink">
                1 ta nibo!
              </p>
              <p style={{ "--at": "1800ms" } as React.CSSProperties} className="stamp-in -rotate-6 rounded-lg border-4 border-white bg-pink px-5 pb-2 pt-3 text-[clamp(1.1rem,2.6vw,2.5rem)] text-white">
                Order confirmed
              </p>
            </div>
          </div>

          <div className="mt-12 grid items-end gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <h1 className="display text-[clamp(2rem,4.4vw,4.25rem)]">
              Your Facebook page now takes orders by itself.
            </h1>
            <div>
              <p className="max-w-[46ch] text-lg leading-relaxed text-sidebar-foreground">
                BDChatPro replies to Messenger customers in Bangla and Banglish, checks your stock, and creates the order.
              </p>
              <Button asChild size="lg" className={cn(startCta, "mt-6 w-full sm:w-auto")}>
                <Link href="/auth/signin">Start 14-day free trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div aria-hidden className="overflow-hidden bg-marigold pb-4 pt-9 text-ink">
        <div className="marquee flex w-max gap-10 whitespace-nowrap text-2xl font-bold [font-stretch:115%]">
          {[...askedAllDay, ...askedAllDay].map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>

      <section id="how" className="mx-auto max-w-[1500px] scroll-mt-8 px-4 py-20 sm:px-8 lg:py-28">
        <h2 className="display max-w-[16ch] text-[clamp(2.25rem,5vw,4.5rem)]">Live on your page in three steps.</h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t-4 border-ink pt-5">
              <span className="display text-6xl text-primary">{i + 1}</span>
              <h3 className="mt-4 text-2xl">{step.title}</h3>
              <p className="mt-2 max-w-[38ch] text-lg leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="mx-auto grid max-w-[1500px] scroll-mt-8 gap-5 px-4 sm:px-8 lg:grid-cols-12">
        <article className="rounded-2xl border-2 border-ink bg-marigold p-7 text-ink sm:p-10 lg:col-span-7">
          <h2 className="display text-[clamp(1.9rem,3.4vw,3.25rem)]">Understands how your customers really type.</h2>
          <div className="mt-8 flex flex-wrap gap-2 text-lg font-semibold">
            {["dam koto", "price?", "কত টাকা", "koto porbe", "taka koto"].map((text) => (
              <span key={text} className="rounded-2xl rounded-bl-sm bg-white px-4 pb-1.5 pt-2.5">{text}</span>
            ))}
          </div>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed">
            Five ways to ask one question, all answered with the right price. Spelling mistakes and mixed Bangla are fine.
          </p>
        </article>

        <article className="flex flex-col justify-between rounded-2xl bg-pink p-7 text-white sm:p-10 lg:col-span-5">
          <h2 className="display text-[clamp(1.9rem,3.4vw,3.25rem)]">Never sells what you don’t have.</h2>
          <div className="mt-8 rounded-xl bg-white p-5 text-ink">
            <p className="text-sm text-muted-foreground">Cotton Panjabi, Black XL</p>
            <p className="display mt-1 text-4xl">4 left</p>
            <div className="mt-3 h-2.5 rounded-full bg-muted">
              <div className="h-full w-1/4 rounded-full bg-pink" />
            </div>
          </div>
        </article>

        <article className="flex flex-col rounded-2xl border-2 border-ink bg-card p-7 sm:p-10 lg:col-span-5">
          <h2 className="display text-[clamp(1.9rem,3.4vw,3.25rem)]">Your whole team, one login.</h2>
          <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-muted-foreground">
            Run several pages from one account. Give each person only the access they need.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 pt-4 font-semibold lg:mt-auto">
            {["Owner", "Admin", "Manager", "Agent"].map((role) => (
              <span key={role} className="rounded-full bg-secondary px-4 pb-1 pt-2">{role}</span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-sidebar p-7 text-white sm:p-10 lg:col-span-7">
          <h2 className="display text-[clamp(1.9rem,3.4vw,3.25rem)]">Every order lands in one list.</h2>
          <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl bg-white text-ink">
            {orders.map((order) => (
              <li key={order.name} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{order.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{order.item}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-3 pb-0.5 pt-1.5 text-sm font-semibold", order.tone)}>{order.status}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section id="pricing" className="mx-auto max-w-[1500px] scroll-mt-8 px-4 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display text-[clamp(2.25rem,5vw,4.5rem)]">Priced in taka.</h2>
            <p className="mt-3 text-lg text-muted-foreground">Pay with bKash, Nagad, or bank transfer. Change plans anytime.</p>
          </div>
          <div role="group" aria-label="Billing period" className="inline-flex rounded-full border-2 border-ink bg-card p-1 font-semibold">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                aria-pressed={billingCycle === cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn("rounded-full px-5 pb-1.5 pt-2.5", billingCycle === cycle && "bg-ink text-white")}
              >
                {cycle === "monthly" ? "Monthly" : "Yearly, save about 20%"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-2xl border-2 border-ink p-7",
                plan.featured ? "bg-marigold text-ink shadow-hard lg:-mt-4" : "bg-card"
              )}
            >
              <h3 className="text-2xl">{plan.name}</h3>
              <p className={cn("mt-1", !plan.featured && "text-muted-foreground")}>{plan.audience}</p>
              <p className="mt-6">
                <span className="display text-5xl">{billingCycle === "yearly" ? plan.yearly : plan.monthly}</span>
                <span className="ml-1">/ month</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant={plan.featured ? "default" : "outline"} className="mt-8 w-full">
                <Link href="/auth/signin">Start free trial</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-pink px-4 py-20 text-center text-white sm:px-8 lg:py-28">
        <h2 className="display mx-auto max-w-[18ch] text-[clamp(2.5rem,7vw,6.5rem)]">
          Stop answering “price koto?” by hand.
        </h2>
        <Button asChild size="lg" className={cn(startCta, "mt-10")}>
          <Link href="/auth/signin">Start 14-day free trial</Link>
        </Button>
      </section>

      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo className="text-white" />
          <nav className="flex flex-wrap gap-6">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <Link href="/auth/signin" className="hover:text-white">Sign in</Link>
          </nav>
          <p>© {new Date().getFullYear()} BDChatPro. Made in Dhaka.</p>
        </div>
      </footer>
    </div>
  )
}
