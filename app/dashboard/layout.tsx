"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore, Tenant } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
}: SidebarProps) => (
  <div
    className={cn(
      "flex flex-col h-full bg-slate-950 border-r border-slate-800/80 text-slate-300 transition-all duration-300",
      mobile ? "w-full" : collapsed ? "w-18" : "w-64"
    )}
  >
    {/* Logo & Brand Header */}
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center text-white">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
        </div>
        {!collapsed && !mobile && (
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold text-white tracking-tight">BDChatPro</span>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] px-1 py-0 font-semibold">
                v2.0
              </Badge>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">AI Messenger Suite</span>
          </div>
        )}
      </div>
      {!mobile && onToggleCollapse && !collapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {!mobile && onToggleCollapse && collapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg mx-auto"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>

    {/* Active Workspace Mini Card in Sidebar */}
    {!collapsed && !mobile && activeTenant && (
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40">
        <Link
          href="/dashboard/team"
          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all group"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                {activeTenant.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Role: <span className="font-medium text-slate-300">{activeTenant.role}</span>
              </p>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    )}

    {/* Navigation Links */}
    <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
      {navigationSections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {!collapsed && !mobile && (
            <div className="px-2 mb-1.5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {section.title}
              </h3>
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors relative",
                    isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900",
                    collapsed && !mobile && "justify-center px-2"
                  )}
                  onClick={() => mobile && onNavigate?.()}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center transition-transform duration-200",
                      (!collapsed || mobile) && "mr-3",
                      isActive && "scale-105"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                  </div>
                  {(!collapsed || mobile) && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}
                  {(!collapsed || mobile) && (item as { badge?: string }).badge && (
                    <Badge
                      className={cn(
                        "ml-auto text-[9px] px-1.5 py-0 font-bold rounded",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}
                    >
                      {(item as { badge?: string }).badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>

    {/* User Profile Mini Footer */}
    <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
      <Link
        href="/dashboard/profile"
        className={cn(
          "flex items-center p-2 rounded-md bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-colors cursor-pointer group",
          collapsed && !mobile && "justify-center p-1.5"
        )}
      >
        <Avatar
          className={cn(
            "ring-1 ring-blue-500/30",
            collapsed && !mobile ? "h-8 w-8" : "h-9 w-9"
          )}
        >
          <AvatarImage src="" />
          <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
            {user?.firstName?.[0] || "U"}
            {user?.lastName?.[0] || ""}
          </AvatarFallback>
        </Avatar>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0 ml-2.5">
            <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        )}
      </Link>
    </div>
  </div>
)

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="relative mb-4 mx-auto w-12 h-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
            <Bot className="h-6 w-6 text-blue-500 absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
          <p className="text-xs">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  if (subscriptionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-md bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-xl">
          <div className="h-14 w-14 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Subscription Expired</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Renew your plan to keep using BDChatPro — your AI chatbot, Facebook sync, and order management are currently paused.
          </p>
          <Button
            onClick={() => {
              setSubscriptionExpired(false)
              router.push("/dashboard/purchase")
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/30"
          >
            Renew Subscription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
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
        <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-r border-slate-800">
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
        <header className="sticky top-0 z-40 bg-[#070B13]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-sm">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              
              {/* Left breadcrumb trail */}
              <div className="flex items-center gap-3">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-8 w-8 p-0 text-slate-300 hover:bg-white/10 rounded-lg"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                </Sheet>

                {/* Section title breadcrumb */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium hidden sm:inline">Workspace</span>
                  <span className="text-slate-600 hidden sm:inline">/</span>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      {navigationSections
                        .flatMap((section) => section.items)
                        .find(
                          (item) =>
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        )?.name || "Dashboard"}
                    </h1>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2.5">
                {/* Live Webhook Status Beacon */}
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Webhook Online</span>
                </div>

                {/* Search / Command Palette Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchModalOpen(true)}
                  className="h-8 border-white/10 bg-slate-900/60 hover:bg-slate-800 hover:border-white/20 text-slate-400 hover:text-white rounded-xl px-2.5 gap-2 text-xs"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Search console...</span>
                  <kbd className="hidden sm:inline-flex h-4 px-1 items-center gap-0.5 rounded border border-white/10 bg-slate-800 text-[10px] text-slate-400 font-mono">
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
                        className="h-8 border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-200 rounded-xl px-2.5 gap-1.5 text-xs font-semibold"
                      >
                        <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="max-w-[120px] truncate">{activeTenant?.name || "Workspace"}</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-[#0B0F19] border-white/10 text-slate-200 text-xs p-1 shadow-2xl">
                      <div className="px-2.5 py-1.5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
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
                          className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white truncate">{t.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">{t.role}</span>
                          </div>
                          {t.id === activeTenantId && <Check className="h-4 w-4 text-cyan-400 ml-2" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard/team")}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-white/5 py-2 px-2.5 font-medium cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 mr-2" /> Manage Team & Workspaces
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ring-1 ring-slate-700 hover:ring-blue-500 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                          {user?.firstName?.[0] || "U"}
                          {user?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-[#0F172A] border-slate-800 text-slate-200 text-xs p-1 shadow-xl rounded-lg" align="end" forceMount>
                    <div className="flex items-center gap-2.5 p-2.5 mb-1 bg-slate-900 rounded-md border border-slate-800">
                      <Avatar className="h-9 w-9 ring-1 ring-slate-700">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                          {user?.firstName?.[0] || "U"}
                          {user?.lastName?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/profile")}
                      className="py-2 px-2.5 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <User className="mr-2.5 h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">Profile & Security</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/team")}
                      className="py-2 px-2.5 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <Users className="mr-2.5 h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">Team & Workspace</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/subscription")}
                      className="py-2 px-2.5 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <Calendar className="mr-2.5 h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">Subscription & Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="py-2 px-2.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
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
          <div className="bg-amber-950/60 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MailWarning className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Please verify your email address (<strong>{user.email}</strong>) to complete account setup.</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={resendingVerification}
                onClick={handleResendVerification}
                className="h-6 text-[11px] border-amber-700 bg-amber-900/40 hover:bg-amber-900 text-amber-200"
              >
                Resend Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVerificationBannerDismissed(true)}
                className="h-6 w-6 p-0 text-amber-400 hover:text-amber-200"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-[#070B13]">{children}</main>

        {/* Enterprise Dashboard Footer */}
        <footer className="border-t border-white/[0.08] bg-[#05080E] px-4 lg:px-6 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">BDChatPro Console</span>
            <span>•</span>
            <span className="font-mono text-[11px]">v2.4.0 Enterprise</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dhaka Edge (ap-south-1)</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <Link href="/dashboard/configure-page" className="hover:text-white transition-colors">Meta Webhooks</Link>
            <Link href="/dashboard/configure-ai" className="hover:text-white transition-colors">AI Engine</Link>
            <Link href="/dashboard/subscription" className="hover:text-white transition-colors">Billing</Link>
            <span>•</span>
            <span className="text-slate-500">© {new Date().getFullYear()} BDChatPro Inc.</span>
          </div>
        </footer>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-3 border-b border-slate-800 flex flex-row items-center space-x-2">
            <Search className="h-4 w-4 text-slate-400 ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Search pages, features, actions... (e.g. Products, Orders, AI)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">No matching destinations found.</div>
            ) : (
              filteredCommands.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setSearchModalOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                      <route.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {route.title}
                      </p>
                      <p className="text-[10px] text-slate-400">{route.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}