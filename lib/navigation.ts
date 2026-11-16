import { Bot, Camera, CreditCard, House, MessageCircle, MessageSquareQuote, Phone, UserCog, type LucideIcon } from "lucide-react"

export type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  /** Shown in quick search and as the page subtitle. */
  desc: string
  /** Other routes that belong to this item (e.g. the plan picker under billing). */
  also?: string[]
}

export const navSections: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { name: "Home", href: "/dashboard", icon: House, desc: "Setup progress, your plan, and shortcuts" },
    ],
  },
  {
    title: "Automation",
    items: [
      { name: "AI assistants", href: "/dashboard/ai-profiles", icon: Bot, desc: "How your bot talks, what it knows, and which model it uses" },
      { name: "Messenger", href: "/dashboard/messenger", icon: MessageCircle, desc: "Connect Facebook Pages, open live chat inboxes, and auto-reply to messages" },
      { name: "Facebook Feed", href: "/dashboard/facebook-feed", icon: MessageSquareQuote, desc: "Auto-reply to post comments with AI via public replies or private Messenger DMs" },
      { name: "Instagram", href: "/dashboard/instagram", icon: Camera, desc: "Connect Instagram Business accounts, auto-reply to direct messages, and review event logs" },
      { name: "WhatsApp", href: "/dashboard/whatsapp", icon: Phone, desc: "Connect WhatsApp Business Cloud API numbers, sync quality ratings, and auto-reply" },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Plan & billing", href: "/dashboard/subscription", icon: CreditCard, desc: "Your plan, renewals, and invoices", also: ["/dashboard/purchase"] },
      { name: "Profile & security", href: "/dashboard/profile", icon: UserCog, desc: "Your details and password" },
    ],
  },
]

export const navItems = navSections.flatMap((s) => s.items)

export function isActive(item: NavItem, pathname: string) {
  if (item.href === "/dashboard") return pathname === "/dashboard"
  return [item.href, ...(item.also ?? [])].some((h) => pathname === h || pathname.startsWith(h + "/"))
}

export function currentNavItem(pathname: string) {
  return navItems.find((item) => isActive(item, pathname))
}
