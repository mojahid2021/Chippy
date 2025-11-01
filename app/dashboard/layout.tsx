"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  mobile?: boolean
  collapsed?: boolean
  user?: any
  onNavigate?: () => void
  onToggleCollapse?: () => void
}

const Sidebar = ({ mobile = false, collapsed = false, user, onNavigate, onToggleCollapse }: SidebarProps) => (
  <div className={cn(
    "flex flex-col h-full bg-white border-r border-gray-200",
    mobile ? "w-full" : collapsed ? "w-16" : "w-64"
  )}>
    {/* Logo */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        {!collapsed && !mobile && (
          <span className="text-xl font-bold text-gray-900">SocialAI</span>
        )}
      </div>
      {!mobile && onToggleCollapse && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
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
    <nav className="flex-1 p-4 space-y-2">
      {navigation.map((item) => {
        const isActive = typeof window !== 'undefined' && window.location.pathname === item.href
        return (
          <a
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              collapsed && !mobile && "justify-center"
            )}
            onClick={() => mobile && onNavigate?.()}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {(!collapsed || mobile) && <span>{item.name}</span>}
          </a>
        )
      })}
    </nav>

    {/* User Info */}
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
  const { user, token, initializeAuth, logout } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Initialize auth state from cookies on mount
    initializeAuth()

    // Redirect to signin if not authenticated
    if (!user && !token) {
      router.push("/auth/signin")
    }
  }, [user, token, router, initializeAuth])

  const handleLogout = () => {
    logout()
    router.push("/auth/signin")
  }

  // Show loading while checking authentication
  if (!user && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
          user={user}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar
            mobile
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
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Page title */}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigation.find(item =>
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  )?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <Button variant="ghost" size="sm">
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
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