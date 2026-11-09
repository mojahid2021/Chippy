"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore, Tenant } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Bot,
  Home,
  Settings,
  Menu,
  Search,
  LogOut,
  ShoppingCart,
  Package,
  Boxes,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  HelpCircle,
  Command,
  Globe,
  MailWarning,
  AlertTriangle,
  X,
  Users,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const navigationSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home, badge: "Live" },
    ],
  },
  {
    title: "E-Commerce",
    items: [
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
      { name: "Products", href: "/dashboard/products", icon: Package },
      { name: "Categories", href: "/dashboard/categories", icon: Boxes },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "Team & Workspace", href: "/dashboard/team", icon: Users },
      { name: "Profile", href: "/dashboard/profile", icon: User },
    ],
  },
  {
    title: "Configuration",
    items: [
      { name: "AI Settings", href: "/dashboard/configure-ai", icon: Bot, badge: "AI" },
      { name: "Facebook Setup", href: "/dashboard/configure-page", icon: Globe },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Subscription", href: "/dashboard/subscription", icon: Calendar },
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
  } | null
  activeTenant?: Tenant
  onNavigate?: () => void
  onToggleCollapse?: () => void
}

const Sidebar = ({
  mobile = false,
  collapsed = false,
  pathname = "",
  user,
  activeTenant,
  onNavigate,
  onToggleCollapse,
}: SidebarProps) => {
  const expanded = mobile || !collapsed
  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        mobile ? "w-full" : collapsed ? "w-18" : "w-64"
      )}
    >
      <div className={cn("flex items-center justify-between px-4 py-4", !expanded && "flex-col gap-3 px-2")}>
        <Link href="/dashboard" className="text-white" aria-label="Dashboard home">
          <Logo compact={!expanded} />
        </Link>
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid size-7 place-items-center rounded-sm hover:bg-sidebar-accent hover:text-white"
          >
            <CollapseIcon className="size-4" />
          </button>
        )}
      </div>

      {expanded && activeTenant && (
        <Link
          href="/dashboard/team"
          className="mx-3 mb-2 flex items-center justify-between rounded-md bg-sidebar-accent px-3 py-2 hover:text-white"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{activeTenant.name}</span>
            <span className="block truncate text-xs capitalize">{activeTenant.role.toLowerCase()}</span>
          </span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      )}

      <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {navigationSections.map((section) => (
          <div key={section.title}>
            {expanded && <h3 className="mb-1 px-3 text-xs font-medium opacity-70 [font-stretch:100%]">{section.title}</h3>}
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
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-white",
                      !expanded && "justify-center px-2"
                    )}
                    onClick={() => mobile && onNavigate?.()}
                  >
                    <item.icon className="size-[18px] shrink-0" />
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
        className={cn("m-3 flex items-center gap-2.5 rounded-md p-2 hover:bg-sidebar-accent", !expanded && "justify-center p-1")}
      >
        <Avatar className="size-9">
          <AvatarImage src="" />
          <AvatarFallback className="bg-pink text-xs font-bold text-white">
            {user?.firstName?.[0] || "U"}
            {user?.lastName?.[0] || ""}
          </AvatarFallback>
        </Avatar>
        {expanded && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="block truncate text-xs">{user?.email}</span>
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
    tenants,
    activeTenantId,
    currentRole,
    switchTenant,
  } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [subscriptionExpired, setSubscriptionExpired] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0]

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

  // Intercept 402 subscription expired
  useEffect(() => {
    const blockedOn402 = [
      "/api/user/categories",
      "/api/user/products",
      "/api/user/ai-profiles",
      "/api/user/media",
      "/api/user/orders",
      "/api/user/messages",
    ]
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args)
      try {
        const input = args[0]
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
            ? input.url
            : input.toString()
        if (response.status === 402 && blockedOn402.some((path) => url.includes(path))) {
          const clone = response.clone()
          const data = await clone.json().catch(() => null)
          if (data?.code === "SUBSCRIPTION_REQUIRED") {
            setSubscriptionExpired(true)
          }
        }
      } catch {
        // Ignore unreadable bodies
      }
      return response
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const handleResendVerification = useCallback(async () => {
    setResendingVerification(true)
    try {
      const response = await fetch("/api/user/resend-verification", { method: "POST" })
      const data = await response.json()
      toast({
        variant: data.success ? "success" : "destructive",
        title: data.success ? "Verification email sent" : "Couldn't send email",
        description: data.message || "Please check your inbox.",
      })
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Please try again." })
    } finally {
      setResendingVerification(false)
    }
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

  // Filter commands for command palette
  const allRoutes = [
    { title: "Dashboard Overview", href: "/dashboard", desc: "View store metrics and activity", icon: Home },
    { title: "Customer Orders", href: "/dashboard/orders", desc: "Manage fulfillment and routing", icon: ShoppingCart },
    { title: "Products Catalog", href: "/dashboard/products", desc: "Add and manage products", icon: Package },
    { title: "Categories", href: "/dashboard/categories", desc: "Organize inventory hierarchy", icon: Boxes },
    { title: "Team & Workspaces", href: "/dashboard/team", desc: "Manage members, invites, and roles", icon: Users },
    { title: "AI Settings & Playground", href: "/dashboard/configure-ai", desc: "Configure personality and replies", icon: Bot },
    { title: "Facebook Page Setup", href: "/dashboard/configure-page", desc: "Webhook handshake and credentials", icon: Globe },
    { title: "Subscription & Billing", href: "/dashboard/subscription", desc: "Plan features and transaction history", icon: Calendar },
    { title: "User Profile", href: "/dashboard/profile", desc: "Account security and passwords", icon: User },
  ]

  const filteredCommands = allRoutes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <div className="relative mb-4 mx-auto w-12 h-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
            <Bot className="h-6 w-6 text-primary absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-medium">Loading your workspace...</p>
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

  if (subscriptionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md bg-card border border-border p-8 rounded-lg shadow-xl">
          <div className="h-14 w-14 rounded-lg bg-warning-soft border border-warning/30 flex items-center justify-center mx-auto mb-4 text-warning">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Subscription Expired</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Renew your plan to keep using BDChatPro — your AI chatbot, Facebook sync, and order management are currently paused.
          </p>
          <Button
            onClick={() => {
              setSubscriptionExpired(false)
              router.push("/dashboard/purchase")
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg"
          >
            Renew Subscription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          pathname={pathname}
          user={user}
          activeTenant={activeTenant}
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
            activeTenant={activeTenant}
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
        {/* Top Sticky Luxury Navbar */}
        <header className="sticky top-0 z-40 bg-background backdrop-blur-2xl border-b border-border">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              
              {/* Left breadcrumb trail */}
              <div className="flex items-center gap-3">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-8 w-8 p-0 text-foreground/80 hover:bg-muted rounded-lg"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                </Sheet>

                {/* Section title breadcrumb */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {navigationSections
                        .flatMap((section) => section.items)
                        .find(
                          (item) =>
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        )?.name || "Dashboard"}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2.5">


                {/* Search / Command Palette Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchModalOpen(true)}
                  className="h-8 border-border bg-card hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground rounded-xl px-2.5 gap-2 text-xs"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden sm:inline-flex h-4 px-1 items-center gap-0.5 rounded border border-border bg-muted text-xs text-muted-foreground font-mono">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                </Button>

                {/* Workspace Switcher */}
                {tenants.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-border bg-card hover:bg-muted text-foreground rounded-xl px-2.5 gap-1.5 text-xs font-semibold"
                      >
                        <Building2 className="h-3.5 w-3.5 text-info" />
                        <span className="hidden max-w-[120px] truncate sm:inline">{activeTenant?.name || "Workspace"}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-card border-border text-foreground text-xs p-1 shadow-2xl">
                      <div className="px-2.5 py-1.5 font-bold text-muted-foreground text-xs">
                        Your Workspaces
                      </div>
                      {tenants.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={async () => {
                            if (t.id !== activeTenantId) {
                              const ok = await switchTenant(t.id)
                              if (ok) {
                                toast({
                                  variant: "success",
                                  title: "Switched Workspace",
                                  description: `Active: ${t.name}`,
                                })
                                window.location.reload()
                              }
                            }
                          }}
                          className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">{t.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{t.role}</span>
                          </div>
                          {t.id === activeTenantId && <Check className="h-4 w-4 text-info ml-2" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-muted" />
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard/team")}
                        className="text-info hover:text-info hover:bg-muted py-2 px-2.5 font-medium cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 mr-2" /> Manage Team & Workspaces
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ring-1 ring-border hover:ring-ring transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {user?.firstName?.[0] || "U"}
                          {user?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-card border-border text-foreground text-xs p-1 shadow-xl rounded-lg" align="end" forceMount>
                    <div className="flex items-center gap-2.5 p-2.5 mb-1 bg-card rounded-md border border-border">
                      <Avatar className="h-9 w-9 ring-1 ring-border">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {user?.firstName?.[0] || "U"}
                          {user?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/profile")}
                      className="py-2 px-2.5 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <User className="mr-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">Profile & Security</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/team")}
                      className="py-2 px-2.5 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Users className="mr-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">Team & Workspace</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/subscription")}
                      className="py-2 px-2.5 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Calendar className="mr-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">Subscription & Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-muted" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="py-2 px-2.5 rounded-lg text-destructive hover:text-destructive hover:bg-destructive-soft cursor-pointer"
                    >
                      <LogOut className="mr-2.5 h-3.5 w-3.5" />
                      <span className="font-medium">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Email verification reminder banner if unverified */}
        {user && user.emailVerified === false && !verificationBannerDismissed && (
          <div className="bg-warning-soft border-b border-warning/30 px-4 py-2 text-xs text-warning flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MailWarning className="h-4 w-4 text-warning shrink-0" />
              <span>Please verify your email address (<strong>{user.email}</strong>) to complete account setup.</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={resendingVerification}
                onClick={handleResendVerification}
                className="h-6 text-xs border-warning/30 bg-warning-soft hover:bg-warning-soft text-warning"
              >
                Resend Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVerificationBannerDismissed(true)}
                className="h-6 w-6 p-0 text-warning hover:text-warning"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background">{children}</main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-3 border-b border-border flex flex-row items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Search pages, features, actions... (e.g. Products, Orders, AI)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">No matching destinations found.</div>
            ) : (
              filteredCommands.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <route.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {route.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{route.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}