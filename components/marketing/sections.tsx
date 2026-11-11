import Link from "next/link"
import { ArrowRight, Bookmark, BookOpen, Bot, Check, ChevronDown, Code2, Cpu, Inbox, Languages, MessagesSquare, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"

export const SIGNUP = "/auth/signin?mode=signup"

/* ── Content ─────────────────────────────────────────── */

const steps = [
  {
    title: "Connect your Facebook page",
    body: "Link the page your customers already message. Nothing changes for them.",
    details: ["Sign in with the Facebook account that manages the page", "Pick the page, and Chippy starts receiving its messages", "Connect more pages anytime, each with its own inbox"],
  },
  {
    title: "Teach Chippy your shop",
    body: "Add prices, sizes, delivery charges, and how you like to talk to customers.",
    details: ["Start from a ready-made template for Messenger shops", "Add facts like delivery charges and return rules", "Set the tone, the language, and a few example replies"],
  },
  {
    title: "Let it reply",
    body: "Chippy answers, quotes the price, collects the address, and hands you the order.",
    details: ["Replies arrive in seconds, day and night", "Every chat lands in that page’s inbox", "Reply yourself whenever you want to step in"],
  },
]

const faqGroups = [
  {
    title: "Getting started",
    items: [
      { q: "Do I need a developer?", a: "No. Connecting a page and setting up your assistant takes about ten minutes." },
      { q: "Can I connect more than one page?", a: "Yes. Connect every page you run, and choose which assistant replies on each one." },
      { q: "What do I need before I start?", a: "Admin access to your Facebook page, and your prices and delivery charges. Chippy’s starter template fills in the rest." },
    ],
  },
  {
    title: "Replies",
    items: [
      { q: "Will customers know it’s a bot?", a: "Chippy replies in your shop’s voice, in Bangla, Banglish, or English. You can say it’s an assistant in its greeting, and you can step in from the inbox anytime." },
      { q: "What if it doesn’t know the answer?", a: "It sends your fallback reply, such as “Ekjon team member ekhuni janabe”, and the chat waits in your inbox for you." },
      { q: "Which languages does it reply in?", a: "Bangla, Banglish, and English. Set one language, or let it match whatever the customer writes in." },
      { q: "Can I reply to customers myself?", a: "Yes. Every page has an inbox with all its Messenger chats. Open any chat and reply." },
    ],
  },
  {
    title: "Plans and billing",
    items: [
      { q: "How do I pay?", a: "bKash, Nagad, or bank transfer. You can change or cancel your plan anytime." },
      { q: "Is there a free trial?", a: "Yes, 14 days, and you don’t need a card to start." },
      { q: "Can I change or cancel my plan?", a: "Anytime, from Plan & billing in your dashboard." },
    ],
  },
]

const moreFeatures = [
  { icon: Inbox, title: "An inbox for every page", body: "Read every Messenger chat for a page in one place and reply yourself." },
  { icon: Bot, title: "Several assistants", body: "Make a different assistant for each page or product line, and pick a default." },
  { icon: ShieldAlert, title: "Always and never rules", body: "Short rules it follows on every reply, like “Always mention COD”." },
  { icon: BookOpen, title: "Shop knowledge", body: "Delivery charges, return policy, size charts, and links it can share." },
  { icon: Bookmark, title: "Example replies", body: "Show it how you answer, and it picks up your tone." },
  { icon: Code2, title: "Reusable details", body: "Set your shop name or phone once and use it everywhere." },
  { icon: Languages, title: "Bangla, Banglish, English", body: "Replies in the language your customer writes in." },
  { icon: Cpu, title: "Your choice of AI model", body: "OpenAI, Anthropic, Google, and more. Defaults work well out of the box." },
  { icon: MessagesSquare, title: "Instagram chats too", body: "See Instagram conversations in the same inbox as Messenger." },
]

/* ── Page frame ──────────────────────────────────────── */

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-card">
      <SiteHeader />
      <main>{children}</main>
      <CtaBand />
      <SiteFooter />
    </div>
  )
}

export function PageHero({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-site px-4 pb-16 pt-14 sm:px-6 lg:px-10 lg:pt-20">
      <h1 className="display max-w-[16ch] text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
      <p className="mt-6 max-w-[52ch] text-lg text-muted-foreground">{intro}</p>
      {children && <div className="mt-8 flex flex-wrap items-center gap-3">{children}</div>}
    </section>
  )
}

export function CtaBand() {
  return (
    <section className="px-4 pb-6 pt-8 sm:px-6">
      <div className="mx-auto flex max-w-site flex-col items-start justify-between gap-8 rounded-3xl border-2 border-ink bg-brand p-8 sm:p-12 lg:flex-row lg:items-end">
        <h2 className="display max-w-[16ch] text-4xl sm:text-6xl">Stop typing “price koto” answers.</h2>
        <Button asChild size="lg" className="rounded-full px-6"><Link href={SIGNUP}>Start 14-day free trial</Link></Button>
      </div>
    </section>
  )
}

/** "Read more" link from a home-page preview to its full page. */
export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function SectionTitle({ as: H = "h2", title, more }: { as?: "h1" | "h2"; title: string; more?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <H className="display max-w-[16ch] text-4xl sm:text-5xl">{title}</H>
      {more}
    </div>
  )
}

/* ── Sections ────────────────────────────────────────── */

export function HowItWorksSection({ detailed = false }: { detailed?: boolean }) {
  return (
    <section className="mx-auto max-w-site px-4 py-24 sm:px-6 lg:px-10">
      {!detailed && <SectionTitle title="Live in ten minutes." more={<MoreLink href="/how-it-works">How it works</MoreLink>} />}
      <ol className={cn("grid gap-8 md:grid-cols-3", !detailed && "mt-12")}>
        {steps.map((step, i) => (
          <li key={step.title} className={cn(detailed && "rounded-3xl border bg-card p-7")}>
            <span className="grid size-10 place-items-center rounded-full border-2 border-ink bg-brand font-display text-lg font-bold">{i + 1}</span>
            <h3 className="mt-5 text-xl">{step.title}</h3>
            <p className="mt-1.5 max-w-[36ch] text-sm text-muted-foreground">{step.body}</p>
            {detailed && (
              <ul className="mt-5 space-y-2 border-t pt-5 text-sm">
                {step.details.map((d) => (
                  <li key={d} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" aria-hidden />{d}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function DayToDaySection() {
  return (
    <section className="border-y bg-background py-24">
      <div className="mx-auto grid max-w-site gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-10">
        <div>
          <h2 className="display max-w-[14ch] text-4xl sm:text-5xl">What a normal day looks like.</h2>
          <p className="mt-4 max-w-[44ch] text-muted-foreground">Chippy takes the repeat questions. You spend your time on the chats that need you.</p>
        </div>
        <ol className="space-y-3">
          {[
            ["A customer asks “XL ache? Price koto?”", "Chippy checks what you taught it and replies in seconds, in their language."],
            ["They decide to buy", "It collects their name, phone number, and address, then confirms the order."],
            ["Something unusual comes up", "It sends your fallback reply and the chat waits in the page’s inbox."],
            ["You open the inbox", "Read any chat and reply yourself. Chippy keeps handling the rest."],
          ].map(([t, b]) => (
            <li key={t} className="rounded-2xl border bg-card p-5">
              <p className="font-medium">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function FeaturesSection({ detailed = false }: { detailed?: boolean }) {
  return (
    <section className="mx-auto max-w-site px-4 py-24 sm:px-6 lg:px-10">
      {!detailed && <SectionTitle title="Built for how Bangladeshi shops sell." more={<MoreLink href="/features">All features</MoreLink>} />}
      <div className={cn("grid gap-4 lg:grid-cols-6", !detailed && "mt-12")}>
        <article className="rounded-3xl bg-ink p-7 text-white lg:col-span-4">
          <h3 className="text-2xl">Understands how your customers really type.</h3>
          <p className="mt-2 max-w-[48ch] text-sm text-white/70">Spelling mistakes, Banglish, and mixed Bangla are all fine. Five ways to ask one question, one right answer.</p>
          <div className="mt-8 flex flex-wrap gap-2 text-sm">
            {["dam koto", "price?", "কত টাকা", "koto porbe", "taka koto"].map((t) => (
              <span key={t} className="rounded-full border border-white/20 px-3 py-1.5">{t}</span>
            ))}
            <span className="rounded-full bg-brand px-3 py-1.5 font-semibold text-ink">৳১,৮৫০</span>
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
          <p className="mt-2 text-sm text-muted-foreground">Every chat is in your inbox. Reply yourself whenever a customer needs you.</p>
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
      </div>

      {detailed && (
        <>
          <h2 className="display mt-24 max-w-[18ch] text-4xl sm:text-5xl">Everything else in the box.</h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {moreFeatures.map((f) => (
              <li key={f.title} className="bg-card p-6">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-soft"><f.icon className="size-4.5" /></span>
                <h3 className="mt-4 font-sans text-base font-semibold tracking-normal">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export function FaqSection({ detailed = false }: { detailed?: boolean }) {
  const groups = detailed ? faqGroups : [{ title: "", items: faqGroups.flatMap((g) => g.items).filter((f) => ["Will customers know it’s a bot?", "What if it doesn’t know the answer?", "How do I pay?", "Do I need a developer?"].includes(f.q)) }]
  return (
    <section className={cn("mx-auto grid max-w-site gap-10 px-4 pb-24 sm:px-6 lg:px-10", detailed ? "lg:grid-cols-[14rem_1fr]" : "lg:grid-cols-[1fr_1.6fr]")}>
      {detailed ? (
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {faqGroups.map((g) => (
              <li key={g.title}>
                <a href={`#${slug(g.title)}`} className="block rounded-full border px-3 py-1.5 text-sm hover:bg-secondary lg:rounded-lg lg:border-0">{g.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <div>
          <h2 className="display text-4xl sm:text-5xl">Questions shop owners ask us.</h2>
          <div className="mt-6"><MoreLink href="/faq">All questions</MoreLink></div>
        </div>
      )}
      <div className="space-y-12">
        {groups.map((g) => (
          <div key={g.title || "top"} id={g.title ? slug(g.title) : undefined} className="scroll-mt-24">
            {g.title && <h2 className="mb-2 text-2xl">{g.title}</h2>}
            <div className="divide-y border-y">
              {g.items.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
                    {f.q}
                    <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
        {detailed && (
          <p className="text-sm text-muted-foreground">
            Still unsure? <Link href={SIGNUP} className="font-medium text-foreground underline underline-offset-4">Start the free trial</Link> and try it on your own page. No card needed.
          </p>
        )}
      </div>
    </section>
  )
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")
