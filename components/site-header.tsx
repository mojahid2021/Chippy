"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { SITE_LINKS } from "@/lib/site-links"


/** Marketing header: transparent at the top, a floating bar once you scroll, with a full menu on phones. Marks the current page. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
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
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  pathname === href && "text-foreground after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand"
                )}
              >
                {label}
              </Link>
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
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === href ? "page" : undefined}
                    className="flex rounded-xl px-3 py-2.5 text-base font-medium hover:bg-secondary aria-[current=page]:bg-secondary"
                  >
                    {label}
                  </Link>
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
