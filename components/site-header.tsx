"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

export const SITE_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

/** Marketing header: transparent at the top, a floating bar once you scroll, with a full menu on phones. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Underline the section currently in view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" }
    )
    SITE_LINKS.forEach(({ href }) => {
      const el = document.querySelector(href)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div
        className={cn(
          "mx-auto rounded-2xl border transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || open ? "border-border bg-card/85 shadow-lg backdrop-blur-md" : "border-transparent bg-transparent"
        )}
      >
        <div className="flex h-14 items-center gap-2 pl-4 pr-2">
          <Link href="/" aria-label="Chippy home" className="mr-auto rounded-lg md:mr-0">
            <Logo />
          </Link>

          <nav aria-label="Main" className="mx-auto hidden items-center md:flex">
            {SITE_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                aria-current={active === href ? "location" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  active === href && "text-foreground after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand"
                )}
              >
                {label}
              </a>
            ))}
          </nav>

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link href="/auth/signin?mode=signup">Start free</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>

        {open && (
          <nav id="site-menu" aria-label="Main" className="border-t px-2 pb-3 pt-2 md:hidden">
            <ul>
              {SITE_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} onClick={() => setOpen(false)} className="flex rounded-xl px-3 py-2.5 text-base font-medium hover:bg-secondary">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t px-1 pt-3">
              <Button asChild variant="outline" className="rounded-full"><Link href="/auth/signin">Sign in</Link></Button>
              <Button asChild className="rounded-full"><Link href="/auth/signin?mode=signup">Start free trial</Link></Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
