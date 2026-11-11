"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Home,
  Menu,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Crown,
  ArrowRight,
  MessageSquare,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const navigationSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
    ],
  },
  {
    title: "AI & Integrations",
    items: [
      { name: "AI Personas", href: "/dashboard/ai-profiles", icon: Bot },
      { name: "Meta Webhooks", href: "/dashboard/messenger", icon: MessageSquare },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Profile", href: "/dashboard/profile", icon: User },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Subscriptions", href: "/dashboard/subscription", icon: Calendar },
    ],
  },
]

interface SidebarProps {
  mobile?: boolean
  collapsed?: boolean
  pathname?: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    name?: string
  } | null
  onNavigate?: () => void
  onToggleCollapse?: () => void
}

const Sidebar = ({
  mobile = false,
  collapsed = false,
  pathname = "",
  user,
  onNavigate,
  onToggleCollapse,
}: SidebarProps) => {
  const expanded = mobile || !collapsed
  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft
  const displayName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        mobile ? "w-full" : collapsed ? "w-18" : "w-64"
      )}
    >
      <div className={cn("flex items-center justify-between px-3.5 py-3", !expanded && "flex-col gap-2.5 px-2")}>
        <Link href="/dashboard" className="text-white" aria-label="Dashboard home">
          <Logo compact={!expanded} />
        </Link>
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid size-6 place-items-center rounded-sm hover:bg-sidebar-accent hover:text-white"
          >
            <CollapseIcon className="size-3.5" />
          </button>
        )}
      </div>

      <nav className="custom-scrollbar flex-1 space-y-3.5 overflow-y-auto px-2.5 py-2">
        {navigationSections.map((section) => (
          <div key={section.title}>
            {expanded && <h3 className="mb-1 px-2.5 text-[11px] font-medium opacity-70 [font-stretch:100%]">{section.title}</h3>}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={expanded ? undefined : item.name}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-white",
                      !expanded && "justify-center px-1.5"
                    )}
                    onClick={() => mobile && onNavigate?.()}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {expanded && <span className="truncate">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <Link
        href="/dashboard/profile"
        className={cn("m-2 flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent", !expanded && "justify-center p-1")}
      >
        <Avatar className="size-8">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
            {user?.firstName?.[0] || "U"}
            {user?.lastName?.[0] || ""}
          </AvatarFallback>
        </Avatar>
        {expanded && (
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-white">
              {displayName}
            </span>
            <span className="block truncate text-[11px] opacity-75">{user?.email}</span>
          </span>
        )}
      </Link>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    user,
    token,
    isLoading,
    initializeAuth,
    logout,
  } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading && !user && !token) {
      router.push("/auth/signin")
    }
  }, [user, token, isLoading, router])

  // Keyboard shortcut for Cmd+K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchModalOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    toast({
      variant: "info",
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
    router.push("/auth/signin")
  }

  const allRoutes = [
    { title: "Dashboard Overview", href: "/dashboard", desc: "View account and subscription overview", icon: Home },
    { title: "AI Persona Profiles", href: "/dashboard/ai-profiles", desc: "Manage AI personas, guardrails, and compile prompts", icon: Bot },
    { title: "Meta Messenger Webhooks", href: "/dashboard/messenger", desc: "Manage Facebook Messenger webhooks and audit events", icon: MessageSquare },
    { title: "Subscription & Billing", href: "/dashboard/subscription", desc: "Manage billing, renewals, and history", icon: Calendar },
    { title: "User Profile", href: "/dashboard/profile", desc: "View account info and credentials", icon: User },
  ]

  const filteredCommands = allRoutes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!user && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-xs">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  const displayName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          pathname={pathname}
          user={user}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-background border-r border-border">
          <Sidebar
            mobile
            pathname={pathname}
            user={user}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarCollapsed ? "lg:pl-18" : "lg:pl-64"
        )}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-background backdrop-blur-2xl border-b border-border">
          <div className="px-3.5 sm:px-5 py-2">
            <div className="flex items-center justify-between">
              
              {/* Left breadcrumb trail / Mobile trigger */}
              <div className="flex items-center gap-2.5">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-7 w-7 p-0 text-foreground/80 hover:bg-muted rounded-md"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                </Sheet>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Link href="/dashboard" className="hover:text-foreground font-medium">Dashboard</Link>
                  <span>/</span>
                  <span className="text-foreground capitalize">
                    {pathname.split("/").filter(Boolean).pop() || "Overview"}
                  </span>
                </div>
              </div>

              {/* Right Action Stack */}
              <div className="flex items-center gap-2">
                {/* Global Command Palette search bar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchModalOpen(true)}
                  className="hidden md:flex items-center justify-between w-56 h-7 px-2 bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-md text-xs font-normal"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="h-3 w-3" />
                    <span>Quick navigation...</span>
                  </span>
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-card px-1 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-[11px]">⌘</span>K
                  </kbd>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-7 w-7 rounded-full p-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                          {user?.firstName?.[0] || "U"}
                          {user?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-semibold text-xs text-foreground">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer text-xs">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Profile & Account</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/subscription" className="flex items-center gap-2 cursor-pointer text-xs">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Subscription & Billing</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/purchase" className="flex items-center gap-2 cursor-pointer text-xs">
                        <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Upgrade / Change Plan</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="p-0 max-w-lg overflow-hidden border-border bg-card shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Search</DialogTitle>
          </DialogHeader>
          <div className="flex items-center px-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Type a destination or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-transparent text-foreground placeholder:text-muted-foreground text-xs focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2 divide-y divide-border/40">
            {filteredCommands.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground">No matches found.</p>
            ) : (
              filteredCommands.map((command) => (
                <Link
                  key={command.href}
                  href={command.href}
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between p-2.5 hover:bg-muted rounded-md transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted group-hover:bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary shrink-0 transition-colors">
                      <command.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{command.title}</p>
                      <p className="text-[11px] text-muted-foreground">{command.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
