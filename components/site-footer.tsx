import Link from "next/link"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/logo"
import { SITE_LINKS } from "@/components/site-header"

const columns = [
  { title: "Product", links: SITE_LINKS.map((l) => ({ ...l, internal: false })) },
  {
    title: "Account",
    links: [
      { label: "Start free trial", href: "/auth/signin?mode=signup", internal: true },
      { label: "Sign in", href: "/auth/signin", internal: true },
    ],
  },
]

/** Ink footer that closes the page: summary, links, how shops pay, and a big wordmark sign-off. */
export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-6 overflow-hidden bg-ink text-white/70">
      <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg text-white" aria-label="Chippy home">
              <LogoMark className="size-8" />
              <span className="font-display text-xl font-bold tracking-[-0.03em]">chippy</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              The Messenger sales assistant for Bangladeshi shops. Answers customers in Bangla, Banglish, and English, and turns questions into orders.
            </p>
            <Button asChild className="mt-6 rounded-full bg-brand px-5 text-brand-foreground hover:bg-brand/90">
              <Link href="/auth/signin?mode=signup">Start 14-day free trial</Link>
            </Button>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="font-sans text-sm font-semibold tracking-normal text-white">{col.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.internal ? (
                      <Link href={l.href} className="hover:text-white">{l.label}</Link>
                    ) : (
                      <a href={l.href} className="hover:text-white">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="font-sans text-sm font-semibold tracking-normal text-white">Pay your way</h2>
            <p className="mt-4 text-sm">No card needed. Pay for your plan with:</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white">
              {["bKash", "Nagad", "Bank transfer"].map((m) => (
                <li key={m} className="rounded-full border border-white/15 px-3 py-1">{m}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse gap-4 border-t border-white/10 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Chippy. Made in Dhaka.</p>
          <a href="#top" className="inline-flex items-center gap-1.5 self-start rounded-full hover:text-white sm:self-auto">
            <ArrowUp className="size-3.5" /> Back to top
          </a>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the page edge. Decorative only. */}
      <p
        aria-hidden
        className="display pointer-events-none -mb-[0.22em] select-none text-center text-[min(28vw,20rem)] leading-none text-brand"
      >
        chippy
      </p>
    </footer>
  )
}
