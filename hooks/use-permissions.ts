import { useUserStore } from "@/lib/stores/userStore"

export function usePermissions() {
  const { currentRole, permissions } = useUserStore()

  const isOwner = currentRole === "OWNER"
  const isAdmin = currentRole === "ADMIN" || isOwner
  const isManager = currentRole === "MANAGER" || isAdmin
  const isAgent = currentRole === "AGENT" || isManager

  const can = (permission: string): boolean => {
    if (isOwner) return true
    return permissions.includes(permission)
  }

  const canAny = (perms: string[]): boolean => {
    if (isOwner) return true
    return perms.some((p) => permissions.includes(p))
  }

  const canAll = (perms: string[]): boolean => {
    if (isOwner) return true
    return perms.every((p) => permissions.includes(p))
  }

  return {
    currentRole,
    permissions,
    isOwner,
    isAdmin,
    isManager,
    isAgent,
    can,
    canAny,
    canAll,
    canManageCatalog: can("product:write") || can("category:write"),
    canManageOrders: can("order:write"),
    canManageTeam: can("member:manage"),
    canManageBilling: can("billing:manage"),
    canConfigureAI: can("ai_profile:write"),
    canConfigureChannel: can("channel:write"),
  }
}
