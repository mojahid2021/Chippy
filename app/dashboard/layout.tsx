"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/lib/stores/userStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Users,
  FileText,
  BarChart3,
  Settings,
  Menu,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Plans', href: '/dashboard/plans', icon: CreditCard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Users },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
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
    "flex flex-col h-full bg-white border-r border-gray-200",
    mobile ? "w-full" : collapsed ? "w-16" : "w-64"
  )}>
    {/* Logo & Brand */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
          <Bot className="h-6 w-6 text-white" />
        </div>
        {!collapsed && !mobile && (
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">SocialAI</span>
            <span className="text-xs text-gray-500 font-medium">Pro</span>
          </div>
        )}
      </div>
      {!mobile && onToggleCollapse && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-4 space-y-1">
      {navigation.map((item) => {
        // Improved active state logic: exact match or starts with for nested routes
        const isActive = pathname === item.href || 
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gray-100 text-gray-900 border-r-2 border-gray-900 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              collapsed && !mobile && "justify-center px-3"
            )}
            onClick={() => mobile && onNavigate?.()}
          >
            <div className={cn(
              "flex items-center justify-center transition-colors duration-200",
              isActive ? "text-gray-900" : "text-gray-500"
            )}>
              <item.icon className="h-5 w-5 shrink-0" />
            </div>
            {(!collapsed || mobile) && (
              <span className={cn(
                "transition-colors duration-200",
                isActive ? "text-gray-900 font-semibold" : "text-gray-600"
              )}>
                {item.name}
              </span>
            )}
          </Link>
        )
      })}
    </nav>

    {/* User Info */}
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <Avatar className="h-10 w-10 border-2 border-gray-200">
          <AvatarImage src="" />
          <AvatarFallback className="bg-gray-900 text-white font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate font-medium">{user?.email}</p>
            <div className="flex items-center mt-1">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
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

  useEffect(() => {
    // Initialize auth state from cookies on mount
    const initAuth = async () => {
      await initializeAuth()
    }
    initAuth()
  }, [initializeAuth])

  useEffect(() => {
    // Only redirect to signin if we're not already on a dashboard page and not authenticated
    if (!isLoading && !user && !token && !pathname.startsWith('/dashboard')) {
      router.push("/auth/signin")
    }
  }, [user, token, isLoading, router, pathname])

  const handleLogout = () => {
    logout()
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

  return (
    <div className="min-h-screen bg-gray-50">
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
        <SheetContent side="left" className="p-0 w-64">
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
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden hover:bg-gray-100">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Page title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item =>
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  )?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Welcome back, {user?.firstName}! Here&apos;s your overview.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search */}
              <Button variant="outline" size="sm" className="hidden sm:flex border-gray-300 hover:bg-gray-50">
                <Search className="h-4 w-4 mr-2" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 rounded text-gray-600">⌘K</kbd>
              </Button>
              <Button variant="ghost" size="sm" className="sm:hidden">
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100 border-2 border-transparent hover:border-gray-200 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gray-900 text-white font-semibold text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gray-900 text-white font-semibold">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold leading-none text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs leading-none text-gray-500 mt-1">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center pt-2 border-t border-gray-100">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-600 font-medium">Active now</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="p-3 hover:bg-gray-50">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-3 hover:bg-gray-50">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="p-3 hover:bg-red-50 text-red-600 hover:text-red-700">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}