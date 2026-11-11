"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/logo"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CtaBand, FaqSection, FeaturesSection, HowItWorksSection } from "@/components/marketing/sections"
import { PricingSection } from "@/components/marketing/pricing-section"

const questions = [
  { q: "Price koto?", a: "৳১,৮৫০ apu, free delivery Dhaka-r moddhe." },
  { q: "XL ache?", a: "Ji, Black ar Navy te XL ache." },
  { q: "COD hobe?", a: "Hobe! Product hate peye taka diben." },
  { q: "কবে পাবো?", a: "ঢাকায় ২ দিন, বাইরে ৩–৪ দিন।" },
  { q: "Dhaka-r baire jabe?", a: "Jabe, charge ৳১২০." },
  { q: "আর কালার আছে?", a: "Black, Navy, Olive — ৩টা কালার আছে।" },
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
  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-card">
      <SiteHeader />

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
            <Button asChild size="lg" variant="outline" className="rounded-full px-6"><Link href="/how-it-works">See how it works</Link></Button>
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

      <HowItWorksSection />
      <div className="-mt-24"><FeaturesSection /></div>
      <PricingSection />
      <FaqSection />
      <CtaBand />

      <SiteFooter />
    </div>
  )
}
