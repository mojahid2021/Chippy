"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Bot,
  Home,
  FileText,
  Settings,
  Menu,
  Bell,
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const navigationSections = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
    ]
  },
  {
    title: 'E-Commerce',
    items: [
      { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
      { name: 'Products', href: '/dashboard/products', icon: Package },
      { name: 'Categories', href: '/dashboard/categories', icon: Boxes },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Profile', href: '/dashboard/profile', icon: User },
    ]
  },
  {
    title: 'Billing',
    items: [
      { name: 'Subscription', href: '/dashboard/subscription', icon: Calendar },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { name: 'AI Settings', href: '/dashboard/configure-ai', icon: Bot },
      { name: 'Facebook Page Setup', href: '/dashboard/configure-page', icon: Globe },
    ]
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
  onNavigate?: () => void
  onToggleCollapse?: () => void
}

const Sidebar = ({ mobile = false, collapsed = false, pathname = '', user, onNavigate, onToggleCollapse }: SidebarProps) => (
  <div className={cn(
    "flex flex-col h-full bg-slate-950 border-r border-slate-800",
    mobile ? "w-full" : collapsed ? "w-16" : "w-60"
  )}>
    {/* Logo & Brand */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
      <div className="flex items-center space-x-2.5">
        <div className="relative">
          <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-slate-950"></div>
        </div>
        {!collapsed && !mobile && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight">BDChatPro</span>
            <span className="text-[10px] text-slate-400 font-medium">Workspace</span>
          </div>
        )}
      </div>
      {!mobile && onToggleCollapse && !collapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      )}
      {!mobile && onToggleCollapse && collapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg mx-auto mt-1"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto custom-scrollbar">
      {navigationSections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {!collapsed && !mobile && (
            <div className="px-2 mb-1.5">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href || 
                              (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800",
                    collapsed && !mobile && "justify-center"
                  )}
                  onClick={() => mobile && onNavigate?.()}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full"></div>
                  )}
                  <div className={cn(
                    "flex items-center justify-center transition-transform duration-200",
                    (!collapsed || mobile) && "mr-2.5",
                    isActive && "scale-110"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )} />
                  </div>
                  {(!collapsed || mobile) && (
                    <span className={cn(
                      "transition-colors duration-200 truncate",
                      isActive ? "text-white font-semibold" : "text-slate-400 group-hover:text-white"
                    )}>
                      {item.name}
                    </span>
                  )}
                  {isActive && !collapsed && !mobile && (
                    <div className="ml-auto">
                      <div className="h-1 w-1 rounded-full bg-white"></div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>

    {/* User Info */}
    <div className="p-2.5 border-t border-slate-800">
      <div className={cn(
        "flex items-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer",
        collapsed && !mobile && "justify-center p-1.5"
      )}>
        <Avatar className={cn(
          "border-2 border-slate-700",
          collapsed && !mobile ? "h-8 w-8" : "h-9 w-9"
        )}>
          <AvatarImage src="" />
          <AvatarFallback className="bg-blue-500 text-white font-bold text-xs">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0 ml-2.5">
            <p className="text-xs font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, token, isLoading, initializeAuth, logout } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [subscriptionExpired, setSubscriptionExpired] = useState(false)

  useEffect(() => {
    // Initialize auth state from cookies on mount
    const initAuth = async () => {
      await initializeAuth()
    }
    initAuth()
  }, [initializeAuth])

  useEffect(() => {
    // Redirect to signin once the auth check has finished and there's no session
    // (e.g. the session expired or was cleared while the user was on this page).
    if (!isLoading && !user && !token) {
      router.push("/auth/signin")
    }
  }, [user, token, isLoading, router])

  useEffect(() => {
    // A 402 SUBSCRIPTION_REQUIRED from business-operation endpoints means
    // the merchant's subscription has expired. Only block on those endpoints,
    // not on read-only account endpoints (profile, subscription status, etc.)
    // which non-subscribers legitimately access to see options.
    const blockedOn402 = [
      '/api/user/categories',
      '/api/user/products',
      '/api/user/ai-profiles',
      '/api/user/media',
      '/api/user/orders',
      '/api/user/messages',
    ]
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args)
      try {
        const input = args[0]
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()
        if (response.status === 402 && blockedOn402.some(path => url.includes(path))) {
          const clone = response.clone()
          const data = await clone.json().catch(() => null)
          if (data?.code === 'SUBSCRIPTION_REQUIRED') {
            setSubscriptionExpired(true)
          }
        }
      } catch {
        // Non-JSON or unreadable body - ignore, the original response still
        // goes back to the caller untouched below.
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
      const response = await fetch('/api/user/resend-verification', { method: 'POST' })
      const data = await response.json()
      toast({
        variant: data.success ? "success" : "destructive",
        title: data.success ? "Verification email sent" : "Couldn't send email",
        description: data.message || (data.success ? "Please check your inbox." : "Please try again later."),
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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show loading if authentication check is complete but no user/token (should redirect)
  if (!user && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // A 402 from any dashboard API call means the merchant's subscription has
  // lapsed - replace the whole dashboard with a clear, actionable screen
  // instead of letting every page show its own generic "failed to load" error.
  if (subscriptionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Your subscription has expired</h1>
          <p className="text-slate-600 mb-6">
            Renew your plan to keep using BDChatPro - your AI assistant, orders, and catalog are paused until then.
          </p>
          <Button onClick={() => { setSubscriptionExpired(false); router.push('/dashboard/purchase') }} className="bg-blue-600 hover:bg-blue-700">
            Renew subscription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          pathname={pathname}
          user={user}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-60 bg-slate-950">
          <Sidebar
            mobile
            pathname={pathname}
            user={user}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "lg:pl-0 transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="px-3 lg:px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                    >
                      <Menu className="h-4 w-4 text-slate-700" />
                    </Button>
                  </SheetTrigger>
                </Sheet>

                {/* Page title */}
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    {navigationSections
                      .flatMap(section => section.items)
                      .find(item =>
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      )?.name || 'Dashboard'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0">
                    Welcome back, {user?.firstName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Search */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex h-8 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg px-2.5 gap-2 text-xs"
                >
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-600">Search</span>
                  <kbd className="hidden lg:inline-flex h-4 px-1 items-center gap-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-600 font-mono">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="sm:hidden h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                >
                  <Search className="h-4 w-4 text-slate-600" />
                </Button>

                {/* Quick Actions */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:flex h-8 w-8 p-0 hover:bg-slate-100 rounded-lg relative"
                  title="Help & Support"
                >
                  <HelpCircle className="h-4 w-4 text-slate-600" />
                </Button>

                {/* Notifications */}
                {/* <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg relative"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                </Button> */}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 rounded-lg p-0 hover:bg-slate-100"
                    >
                      <Avatar className="h-7 w-7 border-2 border-slate-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-500 text-white font-bold text-xs">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-1.5" align="end" forceMount>
                    <div className="flex items-center gap-2.5 p-2.5 mb-1">
                      <Avatar className="h-10 w-10 border-2 border-slate-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-500 text-white font-bold text-xs">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard/profile')} 
                      className="py-2 px-2.5 rounded-md cursor-pointer text-xs"
                    >
                      <User className="mr-2.5 h-3.5 w-3.5 text-slate-500" />
                      <span className="font-medium">Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="py-2 px-2.5 rounded-md cursor-pointer text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="mr-2.5 h-3.5 w-3.5" />
                      <span className="font-medium">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Email verification banner */}
        {user?.emailVerified === false && !verificationBannerDismissed && (
          <div className="px-2 lg:px-3 pt-2">
            <Alert className="border-amber-200 bg-amber-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <MailWarning className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <AlertDescription className="text-amber-800">
                  Please verify your email address to make sure you never miss an important notification.{" "}
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="font-medium underline hover:text-amber-900 disabled:opacity-50"
                  >
                    {resendingVerification ? "Sending..." : "Resend verification email"}
                  </button>
                </AlertDescription>
              </div>
              <button
                onClick={() => setVerificationBannerDismissed(true)}
                className="text-amber-600 hover:text-amber-800 shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </div>
        )}

        {/* Page Content */}
        <main className="p-2 lg:p-3 mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}