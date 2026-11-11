"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Logo, LogoMark } from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ChevronsUpDown, CornerDownLeft, LogOut, Menu, PanelLeft, Search, Sparkles, UserCog, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { navSections, navItems, isActive, currentNavItem } from "@/lib/navigation"
import { toast } from "@/hooks/use-toast"

type ShellUser = {
  firstName?: string
  lastName?: string
  name?: string
  email?: string
} | null

const initials = (u: ShellUser) => `${u?.firstName?.[0] ?? "U"}${u?.lastName?.[0] ?? ""}`.toUpperCase()
const fullName = (u: ShellUser) => u?.name || `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "You"

function Sidebar({
  collapsed = false,
  pathname,
  user,
  onNavigate,
  onSearch,
  onLogout,
}: {
  collapsed?: boolean
  pathname: string
  user: ShellUser
  onNavigate?: () => void
  onSearch: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-4 px-3 py-4 text-sidebar-foreground">
      <Link href="/dashboard" onClick={onNavigate} className={cn("flex items-center px-1.5 text-foreground", collapsed && "justify-center px-0")}>
        {collapsed ? <LogoMark /> : <Logo />}
      </Link>

      <button
        onClick={onSearch}
        className={cn(
          "flex h-8 items-center gap-2 rounded-lg border border-sidebar-border bg-card px-2.5 text-sm text-muted-foreground shadow-xs hover:text-foreground",
          collapsed && "justify-center px-0"
        )}
        aria-label="Search"
      >
        <Search className="size-3.5" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded border bg-muted px-1 font-mono text-2xs">⌘K</kbd>
          </>
        )}
      </button>

      <nav className="custom-scrollbar -mx-1 flex-1 space-y-5 overflow-y-auto px-1">
        {navSections.map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && !collapsed && (
              <p className="mb-1 px-2.5 text-2xs font-medium text-muted-foreground">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item, pathname)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.name : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <Link
          href="/dashboard/purchase"
          onClick={onNavigate}
          className="group rounded-xl border border-sidebar-border bg-card p-3 shadow-xs hover:border-input"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Sparkles className="size-3.5" /> Unlock more replies
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Compare plans and upgrade in a minute.</p>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-sidebar-accent focus-visible:outline-2",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-ink text-2xs font-semibold text-white">{initials(user)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{fullName(user)}</span>
                <span className="block truncate text-2xs text-muted-foreground">{user?.email}</span>
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" onClick={onNavigate}><UserCog className="mr-2 size-4" />Profile & security</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/subscription" onClick={onNavigate}><CreditCard className="mr-2 size-4" />Plan & billing</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 size-4" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading, initializeAuth, logout } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading && !user && !token) router.push("/auth/signin")
  }, [user, token, isLoading, router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleLogout = () => {
    logout()
    toast({ variant: "info", title: "Signed out", description: "See you soon." })
    router.push("/auth/signin")
  }

  const commands = [
    ...navItems.map((i) => ({ title: i.name, href: i.href, desc: i.desc, icon: i.icon })),
    { title: "Change plan", href: "/dashboard/purchase", desc: "Compare plans and upgrade", icon: Sparkles },
  ].filter((c) => `${c.title} ${c.desc}`.toLowerCase().includes(query.toLowerCase()))

  const go = (href: string) => {
    setSearchOpen(false)
    setQuery("")
    router.push(href)
  }

  if (isLoading || (!user && !token)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <LogoMark className="size-9 animate-bounce" />
          {isLoading ? "Opening your workspace" : "Taking you to sign in"}
        </div>
      </div>
    )
  }

  const current = currentNavItem(pathname)
  const crumb = pathname.endsWith("/inbox") ? "Inbox" : pathname === "/dashboard/purchase" ? "Choose a plan" : null

  return (
    // App shell: the window never scrolls, only the content panel does, so menus and panels
    // that lock scrolling can’t shift the layout.
    <div className="h-dvh overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Sidebar
          collapsed={collapsed}
          pathname={pathname}
          user={user}
          onSearch={() => setSearchOpen(true)}
          onLogout={handleLogout}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-r-0 bg-sidebar p-0">
          <Sidebar
            pathname={pathname}
            user={user}
            onNavigate={() => setMobileOpen(false)}
            onSearch={() => {
              setMobileOpen(false)
              setSearchOpen(true)
            }}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      <div className={cn("h-full transition-[padding] duration-200 lg:py-2 lg:pr-2", collapsed ? "lg:pl-16" : "lg:pl-60")}>
        <div className="flex h-full flex-col overflow-hidden bg-card lg:rounded-2xl lg:border lg:shadow-sm">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3 sm:px-5">
            <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft />
            </Button>
            <span className="mx-1 hidden h-4 w-px bg-border lg:block" />
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              {current && crumb ? (
                <>
                  <Link href={current.href} className="truncate text-muted-foreground hover:text-foreground">{current.name}</Link>
                  <span className="text-input">/</span>
                  <span className="truncate font-medium">{crumb}</span>
                </>
              ) : (
                <span className="truncate font-medium">{current?.name ?? "Home"}</span>
              )}
            </nav>
            <div className="ml-auto lg:hidden">
              <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search />
              </Button>
            </div>
          </header>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            <main className="mx-auto w-full max-w-site px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          </div>
        </div>
      </div>

      <Dialog
        open={searchOpen}
        onOpenChange={(o) => {
          setSearchOpen(o)
          if (!o) setQuery("")
        }}
      >
        <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 data-[state=open]:slide-in-from-top-[18%]">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCursor(0)
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setCursor((c) => Math.min(c + 1, commands.length - 1))
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setCursor((c) => Math.max(c - 1, 0))
                } else if (e.key === "Enter" && commands[cursor]) {
                  go(commands[cursor].href)
                }
              }}
              placeholder="Where to?"
              className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-80 overflow-y-auto p-1.5">
            {commands.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nothing matches. Try “inbox”, “plan”, or “password”.</li>
            ) : (
              commands.map((c, i) => (
                <li key={c.href + c.title}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(c.href)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left", i === cursor && "bg-secondary")}
                  >
                    <span className={cn("grid size-8 place-items-center rounded-lg border bg-card", i === cursor && "border-transparent bg-brand")}>
                      <c.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{c.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.desc}</span>
                    </span>
                    {i === cursor && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
